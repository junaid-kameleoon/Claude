#!/usr/bin/env node
/**
 * generate-trace-data.mjs
 *
 * Transforms raw Langfuse JSON exports (arrays of observations) into compact,
 * client-safe datasets consumed by the dashboard at runtime.
 *
 * It handles the three Kameleoon AI features, one export each:
 *   1. targeting  -> AI Asset Trace Explorer (segments + triggers/keymoments)
 *   2. kai        -> Kai experiment copilot (doc Q&A + experiment summaries)
 *   3. goals      -> AI Goals (Aria agent: inspects HTML, generates goal snippets)
 *
 * Raw exports are large (~45-50MB) and are NEVER shipped to the browser.
 * Output compact JSON files land in ./public and are committed.
 *
 * Usage:
 *   node scripts/generate-trace-data.mjs
 *   TARGETING_EXPORT=/path/a.json KAI_EXPORT=/path/b.json GOALS_EXPORT=/path/c.json node scripts/generate-trace-data.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { StringDecoder } from "node:string_decoder";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public");
const DOWNLOADS = process.env.EXPORT_DIR || path.join(os.homedir(), "Downloads");

// Each Kameleoon AI feature exports under a stable Langfuse object id (the suffix
// after "lf-events-export-"). We resolve the newest matching file in DOWNLOADS,
// in either .json or .csv form, so a weekly re-export just needs to land there.
const SOURCES = {
  targeting: { id: "cmlf6nfxt02axad07n8sks3lq", env: "TARGETING_EXPORT", out: "trace-data.json" },
  // Kai's export can be multi-GB; window it to the last few weeks (override with KAI_SINCE_DAYS).
  kai: {
    id: "cmg94erlg0i1lad07jglb5m59",
    env: "KAI_EXPORT",
    out: "kai-data.json",
    sinceDays: Number(process.env.KAI_SINCE_DAYS) || 21,
  },
  goals: { id: "cmok6nd0k07e9ad07wug22mxn", env: "GOALS_EXPORT", out: "goals-data.json" },
};

/** Newest export file (json|csv) for a feature id, or null if none found. */
function resolveSource(cfg) {
  if (process.env[cfg.env]) return process.env[cfg.env];
  if (!fs.existsSync(DOWNLOADS)) return null;
  const matches = fs
    .readdirSync(DOWNLOADS)
    .filter((f) => f.includes(`lf-events-export-${cfg.id}`) && /\.(json|csv)$/i.test(f))
    .map((f) => {
      const full = path.join(DOWNLOADS, f);
      const prefix = parseInt(f.split("-")[0], 10) || 0;
      return { full, prefix, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.prefix - a.prefix || b.mtime - a.mtime);
  return matches.length ? matches[0].full : null;
}

/* ------------------------------------------------------------------ helpers */

function tryParse(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Pull the messages array out of an input/output payload (string or object). */
function messagesOf(payload) {
  const obj = tryParse(payload);
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (Array.isArray(obj.messages)) return obj.messages;
  return [];
}

/** Flatten a LangChain message `content` (string | array of parts) to text. */
function textOf(content) {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function roleOf(m) {
  return m.role || m.type || "";
}

function isUser(m) {
  const r = roleOf(m);
  return r === "user" || r === "human";
}

function isAssistant(m) {
  const r = roleOf(m);
  return r === "assistant" || r === "ai";
}

function firstUserText(messages) {
  const m = messages.find(isUser);
  return m ? textOf(m.content).trim() : "";
}

function lastAssistantText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (isAssistant(messages[i])) {
      const t = textOf(messages[i].content).trim();
      if (t) return t;
    }
  }
  return "";
}

function dayOf(iso) {
  return iso ? String(iso).slice(0, 10) : "unknown";
}

function domainOf(url) {
  if (!url || typeof url !== "string") return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    const m = url.match(/^https?:\/\/([^/]+)/i);
    return m ? m[1].replace(/^www\./, "") : null;
  }
}

function inc(map, key, by = 1) {
  if (key == null || key === "") return;
  map[key] = (map[key] || 0) + by;
}

function topEntries(map, limit = 20) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function round(n, d = 4) {
  const f = 10 ** d;
  return Math.round((n || 0) * f) / f;
}

/** Sum Langfuse usage/cost details across a list of observations. */
function aggregateUsage(observations) {
  let tokens = 0;
  let cost = 0;
  const num = (v) => {
    const n = typeof v === "number" ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  for (const o of observations) {
    cost += num(o.totalCost);
    const usage = o.usageDetails || {};
    // Prefer an explicit total; otherwise sum the input/output components.
    if (usage.total != null || usage.total_tokens != null) {
      tokens += num(usage.total != null ? usage.total : usage.total_tokens);
    } else {
      for (const [k, v] of Object.entries(usage)) {
        if (/^(input|output|prompt|completion)$/.test(k)) tokens += num(v);
      }
    }
  }
  return { tokens, cost: round(cost) };
}

/** Build a compact, sorted timeline of observations within a trace. */
function buildTimeline(observations) {
  return observations
    .filter((o) => o.startTime)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .map((o) => ({
      name: o.name || o.type || "?",
      type: o.type || "",
      latencyMs: typeof o.latencyMs === "number" ? Math.round(o.latencyMs) : null,
    }));
}

function groupByTrace(observations) {
  const groups = new Map();
  for (const o of observations) {
    const id = o.traceId || o.id;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(o);
  }
  return groups;
}

// CSV cells holding structured data must be JSON-parsed back into objects;
// numeric columns must be coerced so the extractors behave like the JSON path.
const OBJECT_FIELDS = ["metadata", "usageDetails", "costDetails", "modelParameters"];
const NUMBER_FIELDS = ["latencyMs", "timeToFirstTokenMs", "totalCost"];

const ROOT_NAMES = new Set(["targeting_agent", "LangGraph", "Streaming"]);

/** Turn a CSV header+row pair into an observation object (with nested JSON parsed). */
function rowToObs(header, cells, { sinceTime, trim } = {}) {
  const obj = {};
  for (let c = 0; c < header.length; c++) {
    const key = header[c];
    const val = cells[c] ?? "";
    if (val === "") obj[key] = null;
    else if (OBJECT_FIELDS.includes(key)) obj[key] = tryParse(val) ?? {};
    else if (NUMBER_FIELDS.includes(key)) {
      const num = parseFloat(val);
      obj[key] = Number.isFinite(num) ? num : null;
    } else obj[key] = val;
  }
  // Date cutoff: startTime is "YYYY-MM-DD ..." so string compare is chronological.
  if (sinceTime && obj.startTime && obj.startTime < sinceTime) return null;
  // Memory trim: only roots and tool calls need their (often huge) input/output.
  if (trim && !(obj.type === "TOOL" || ROOT_NAMES.has(obj.name) || !obj.parentObservationId)) {
    obj.input = null;
    obj.output = null;
  }
  return obj;
}

/**
 * Stream a (possibly multi-GB) CSV file, parsing rows incrementally so the whole
 * file is never resident in memory. StringDecoder handles multi-byte UTF-8 split
 * across chunk boundaries. Returns only the observations passing the filters.
 */
function streamCsvObservations(file, opts = {}) {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder("utf8");
    const observations = [];
    let header = null;
    let row = [];
    let pieces = []; // slices of the current field, joined at field end
    let inQuotes = false;
    let pendingQuote = false; // a '"' ended a chunk inside quotes; next char decides escape vs close
    let total = 0;

    const endField = () => {
      row.push(pieces.length === 1 ? pieces[0] : pieces.join(""));
      pieces.length = 0;
    };
    const endRow = () => {
      if (row.length > 1 || row[0] !== "") {
        if (!header) header = row.slice();
        else {
          total++;
          const obj = rowToObs(header, row, opts);
          if (obj) observations.push(obj);
        }
      }
      row.length = 0;
    };

    // indexOf-based scan: inside quoted JSON cells we jump straight to the next
    // quote instead of inspecting every character — the key to speed on GB files.
    const processChunk = (s) => {
      const len = s.length;
      let pos = 0;
      while (pos < len) {
        if (pendingQuote) {
          pendingQuote = false;
          if (s[pos] === '"') {
            pieces.push('"');
            pos++;
            continue; // escaped quote, still inside quotes
          }
          inQuotes = false; // the earlier quote was the closing one
        }
        if (inQuotes) {
          const q = s.indexOf('"', pos);
          if (q === -1) {
            pieces.push(s.slice(pos));
            break;
          }
          if (q > pos) pieces.push(s.slice(pos, q));
          pos = q + 1;
          if (pos >= len) {
            pendingQuote = true; // decide escape vs close at next chunk
          } else if (s[pos] === '"') {
            pieces.push('"');
            pos++;
          } else {
            inQuotes = false;
          }
        } else {
          let i = pos;
          while (i < len) {
            const c = s[i];
            if (c === '"' || c === "," || c === "\n" || c === "\r") break;
            i++;
          }
          if (i > pos) pieces.push(s.slice(pos, i));
          if (i >= len) break;
          const c = s[i];
          pos = i + 1;
          if (c === '"') inQuotes = true;
          else if (c === ",") endField();
          else if (c === "\n") {
            endField();
            endRow();
          }
          // '\r' is skipped
        }
      }
    };

    const stream = fs.createReadStream(file, { highWaterMark: 1 << 20 });
    stream.on("data", (buf) => processChunk(decoder.write(buf)));
    stream.on("error", reject);
    stream.on("end", () => {
      processChunk(decoder.end());
      if (pieces.length || row.length) {
        endField();
        endRow();
      }
      resolve({ observations, total });
    });
  });
}

/** YYYY-MM-DD for `days` ago (used for the date-window cutoff). */
function cutoffDate(days) {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

async function load(file, opts = {}) {
  if (!file || !fs.existsSync(file)) return null;
  if (/\.csv$/i.test(file)) {
    const { observations, total } = await streamCsvObservations(file, opts);
    if (opts.sinceTime) {
      console.log(`  (windowed: kept ${observations.length} of ${total} observations since ${opts.sinceTime})`);
    }
    return observations;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return Array.isArray(data) ? data : data.data || [];
}

/* ------------------------------------------------- targeting condition tree */

/** Human-readable value for a single targeting condition leaf. */
function summarizeCondition(tc) {
  const type = tc.targetingType || "UNKNOWN";
  // find the *TargetingCondition sub-object
  let detail = null;
  for (const [k, v] of Object.entries(tc)) {
    if (k !== "targetingType" && v && typeof v === "object") {
      detail = v;
      break;
    }
  }
  const d = detail || {};
  const include = d.include !== undefined ? d.include : true;
  const matchType = d.textMatchType || d.matchType || null;
  let value = "";
  if (d.url) value = d.url;
  else if (d.device) value = d.device;
  else if (d.country) value = d.country + (d.region ? ` / ${d.region}` : "") + (d.city ? ` / ${d.city}` : "");
  else if (d.browser) value = d.browser;
  else if (d.operatingSystem || d.os) value = d.operatingSystem || d.os;
  else if (d.language) value = d.language;
  else if (d.name) value = d.name;
  else if (d.key) value = `${d.key}${d.value ? " = " + d.value : ""}`;
  else if (d.value !== undefined) value = String(d.value);
  else if (typeof d.count === "number") value = String(d.count);
  else {
    // best-effort: first primitive field
    for (const [k, v] of Object.entries(d)) {
      if (k === "include" || k === "textMatchType" || k === "matchType") continue;
      if (typeof v === "string" || typeof v === "number") {
        value = `${k}: ${v}`;
        break;
      }
    }
  }
  return { type, include, matchType, value: String(value).slice(0, 240) };
}

/** Recursively flatten a conditionDataTree into a list of leaf conditions. */
function flattenConditions(tree, acc = []) {
  if (!tree || typeof tree !== "object") return acc;
  if (tree.targetingCondition) {
    acc.push(summarizeCondition(tree.targetingCondition));
  }
  const children = tree.conditionDataTree;
  if (Array.isArray(children)) {
    for (const c of children) flattenConditions(c, acc);
  } else if (children && typeof children === "object") {
    flattenConditions(children, acc);
  }
  return acc;
}

function rootOperator(tree) {
  return (tree && tree.logicalOperator) || "AND";
}

/* ---------------------------------------------------------------- targeting */

function parseTargetingPayload(rootObs) {
  const out = messagesOf(rootObs.output);
  // final answer is the last assistant/ai message text holding a JSON blob
  for (let i = out.length - 1; i >= 0; i--) {
    const m = out[i];
    if (!isAssistant(m)) continue;
    const txt = textOf(m.content).trim();
    const parsed = tryParse(txt);
    if (parsed && (("segment_state" in parsed) || ("keymoment_state" in parsed) || ("clarifications" in parsed))) {
      return parsed;
    }
  }
  return null;
}

function collectAssets(state, key) {
  // state can be: null | object{created_*} | array of {created_*, clarifications}
  const assets = [];
  const clarifications = [];
  const visit = (node) => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (typeof node !== "object") return;
    if (Array.isArray(node[key])) assets.push(...node[key]);
    if (node.clarifications) {
      if (Array.isArray(node.clarifications)) clarifications.push(...node.clarifications);
      else clarifications.push(node.clarifications);
    }
  };
  visit(state);
  return { assets, clarifications };
}

function normalizeAsset(raw, kind) {
  const tree = raw.conditionDataTree || raw.conditionsDataTree || null;
  const conditions = flattenConditions(tree);
  return {
    kind,
    name: raw.name || raw.title || `(unnamed ${kind})`,
    description: raw.description || raw.goal || "",
    operator: rootOperator(tree),
    conditions,
    raw,
  };
}

function buildTargeting(observations) {
  const groups = groupByTrace(observations);
  const traces = [];

  // pattern accumulators
  const outcomeCounts = { segment: 0, trigger: 0, both: 0, clarification: 0, none: 0 };
  const currentObjectCounts = {};
  const conditionTypeCounts = {};
  const matchTypeCounts = {};
  const domains = {};
  const users = {};
  const sites = {};
  const tools = {};
  const daily = {};
  const promptShapes = {};
  const useCaseDefs = [
    { key: "url_page", label: "URL / page targeting", types: ["PAGE_URL", "PAGE_TITLE", "LANDING_PAGE", "PREVIOUS_PAGE", "NUMBER_OF_VISITED_PAGES", "PAGE_VIEWS"] },
    { key: "device", label: "Device audiences", types: ["DEVICE_TYPE", "SCREEN_DIMENSION"] },
    { key: "geo", label: "Geography audiences", types: ["GEOLOCATION"] },
    { key: "custom_data", label: "Custom data / taxonomy", types: ["CUSTOM_DATUM", "DOM_ELEMENT", "JS_CODE"] },
    { key: "lifecycle", label: "Visitor lifecycle", types: ["NEW_VISITORS", "VISITS", "LAST_VISIT", "FIRST_VISIT", "SAME_DAY_VISITS", "ACTIVE_SESSION", "CONVERSIONS", "SEGMENT"] },
    { key: "tech", label: "Browser / OS / language", types: ["BROWSER", "OPERATING_SYSTEM", "BROWSER_LANGUAGE", "ORIGIN", "ORIGIN_TYPE"] },
    { key: "timing", label: "Timing / events / interaction", types: ["TIME_SINCE_PAGE_LOAD", "EVENT", "KEY_MOMENT"] },
  ];
  const useCaseCounts = {};
  const useCaseClar = {};
  const useCaseExamples = {};
  useCaseDefs.forEach((u) => {
    useCaseCounts[u.key] = 0;
    useCaseClar[u.key] = 0;
    useCaseExamples[u.key] = [];
  });

  let totalCost = 0;
  let totalTokens = 0;
  let minTime = null;
  let maxTime = null;

  for (const [traceId, obs] of groups) {
    const root = obs.find((o) => o.name === "targeting_agent") || obs.find((o) => !o.parentObservationId) || obs[0];
    if (!root) continue;

    const meta = root.metadata || {};
    const inputMsgs = messagesOf(root.input);
    const prompt = firstUserText(inputMsgs) || textOf((inputMsgs[0] || {}).content);

    const payload = parseTargetingPayload(root);
    const seg = collectAssets(payload && payload.segment_state, "created_segments");
    const key = collectAssets(payload && payload.keymoment_state, "created_keymoments");
    const topClar = payload && payload.clarifications;
    const clarifications = [
      ...seg.clarifications,
      ...key.clarifications,
      ...(topClar ? (Array.isArray(topClar) ? topClar : [topClar]) : []),
    ].filter(Boolean);

    const segments = seg.assets.map((a) => normalizeAsset(a, "segment"));
    const triggers = key.assets.map((a) => normalizeAsset(a, "trigger"));

    const hasSeg = segments.length > 0;
    const hasTrig = triggers.length > 0;
    const hasClar = clarifications.length > 0;
    let outcome = "none";
    if (hasSeg && hasTrig) outcome = "both";
    else if (hasSeg) outcome = "segment";
    else if (hasTrig) outcome = "trigger";
    else if (hasClar) outcome = "clarification";
    outcomeCounts[outcome] += 1;

    // conditions + match types
    const allConditions = [...segments, ...triggers].flatMap((a) => a.conditions);
    const traceCondTypes = new Set();
    for (const c of allConditions) {
      inc(conditionTypeCounts, c.type);
      traceCondTypes.add(c.type);
      if (c.matchType) inc(matchTypeCounts, c.matchType);
      const dom = domainOf(c.value);
      if (dom) inc(domains, dom);
    }

    // tools
    const toolObs = obs.filter((o) => o.type === "TOOL" || o.name === "search_kameleoon_entities");
    const toolCalls = toolObs.map((t) => ({
      name: t.name || "tool",
      input: compactStr(t.input, 300),
      output: compactStr(t.output, 600),
    }));
    toolObs.forEach((t) => inc(tools, t.name || "tool"));

    // usage
    const usage = aggregateUsage(obs);
    totalCost += usage.cost;
    totalTokens += usage.tokens;

    const ts = root.startTime || obs[0].startTime;
    if (ts) {
      if (!minTime || ts < minTime) minTime = ts;
      if (!maxTime || ts > maxTime) maxTime = ts;
      inc(daily, dayOf(ts));
    }

    inc(currentObjectCounts, meta.current_object_type || "unknown");
    inc(users, meta.user_id || root.userId || "unknown");
    inc(sites, meta.site_id || "unknown");
    const pageDomain = domainOf(meta.current_page_url);
    if (pageDomain) inc(domains, pageDomain);

    // prompt shape (normalized)
    const shape = promptShape(prompt);
    inc(promptShapes, shape);

    // use-case clusters
    useCaseDefs.forEach((u) => {
      if (u.types.some((t) => traceCondTypes.has(t))) {
        useCaseCounts[u.key] += 1;
        if (hasClar) useCaseClar[u.key] += 1;
        if (useCaseExamples[u.key].length < 6) useCaseExamples[u.key].push(traceId);
      }
    });

    traces.push({
      id: traceId,
      timestamp: ts,
      prompt,
      outcome,
      segments,
      triggers,
      clarifications,
      response: payload ? null : lastAssistantText(messagesOf(root.output)),
      structured: payload,
      conditionTypes: [...traceCondTypes],
      matchTypes: [...new Set(allConditions.map((c) => c.matchType).filter(Boolean))],
      metadata: {
        user_id: meta.user_id || root.userId || null,
        site_id: meta.site_id || null,
        thread_id: meta.thread_id || null,
        current_object_type: meta.current_object_type || null,
        current_page_url: meta.current_page_url || null,
        model: root.providedModelName || root.modelId || null,
      },
      tokens: usage.tokens,
      cost: usage.cost,
      latencyMs: typeof root.latencyMs === "number" ? Math.round(root.latencyMs) : null,
      tools: toolCalls,
      timeline: buildTimeline(obs),
    });
  }

  traces.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const summary = {
    totalObservations: observations.length,
    traceCount: traces.length,
    dateRange: { from: minTime, to: maxTime },
    modelCost: round(totalCost),
    modelTokens: totalTokens,
    generatedAssets:
      traces.reduce((n, t) => n + t.segments.length + t.triggers.length, 0),
    clarificationRate: traces.length ? round(outcomeCounts.clarification / traces.length, 3) : 0,
    toolLookups: Object.values(tools).reduce((a, b) => a + b, 0),
  };

  const patterns = {
    outcomeCounts,
    currentObjectCounts: topEntries(currentObjectCounts, 10),
    useCaseClusters: useCaseDefs.map((u) => ({
      key: u.key,
      label: u.label,
      count: useCaseCounts[u.key],
      clarificationRate: useCaseCounts[u.key] ? round(useCaseClar[u.key] / useCaseCounts[u.key], 3) : 0,
      examples: useCaseExamples[u.key],
    })).sort((a, b) => b.count - a.count),
    promptShapes: topEntries(promptShapes, 12),
    conditionTypeCounts: topEntries(conditionTypeCounts, 30),
    matchTypeCounts: topEntries(matchTypeCounts, 10),
    domains: topEntries(domains, 20),
    users: topEntries(users, 15),
    sites: topEntries(sites, 15),
    tools: topEntries(tools, 10),
    dailyActivity: Object.entries(daily).sort().map(([date, count]) => ({ date, count })),
  };

  return { feature: "targeting", summary, patterns, traces };
}

function compactStr(value, max = 400) {
  if (value == null) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function promptShape(prompt) {
  const p = (prompt || "").toLowerCase();
  if (!p) return "(empty)";
  if (/^url is|\burl is\b/.test(p) && /\bstaging\b/.test(p)) return "URL list + exclude staging";
  if (/^url is|\burl is\b/.test(p)) return "URL list targeting";
  if (/\b(mobile|desktop|tablet)\b/.test(p)) return "Device audience";
  if (/\b(france|germany|country|countries|geo|us|usa|uk|canada|spain|italy)\b/.test(p)) return "Geography audience";
  if (/\b(new visitor|returning|first visit|last visit|loyal)\b/.test(p)) return "Visitor lifecycle";
  if (/\b(browser|chrome|safari|firefox|edge|os|operating system|language)\b/.test(p)) return "Browser / OS / language";
  if (/\b(click|event|scroll|add to cart|seconds|after)\b/.test(p)) return "Timing / events";
  if (p.length < 40) return "Short instruction";
  return "Other / freeform";
}

/* ---------------------------------------------------------------------- kai */

function buildKai(observations) {
  const groups = groupByTrace(observations);
  const traces = [];

  const useCaseCounts = {};
  const models = {};
  const tools = {};
  const docQueries = {};
  const languages = {};
  const daily = {};
  const promptShapes = {};
  let totalCost = 0;
  let totalTokens = 0;
  let minTime = null;
  let maxTime = null;

  const classify = (prompt) => {
    const p = (prompt || "").toLowerCase();
    if (/starting with "insights:"|"recommendations:"|summary of the results of this experiment/.test(p))
      return "Experiment summary";
    if (/translate|translation|answer in [a-z]{2}\b/.test(p) && p.length < 600) return "Translation";
    return "Documentation Q&A / chat";
  };

  for (const [traceId, obs] of groups) {
    const root =
      obs.find((o) => o.name === "LangGraph" && !o.parentObservationId) ||
      obs.find((o) => o.name === "LangGraph") ||
      obs.find((o) => !o.parentObservationId) ||
      obs[0];
    if (!root) continue;

    const meta = root.metadata || {};
    const inMsgs = messagesOf(root.input);
    const outMsgs = messagesOf(root.output);
    const prompt = firstUserText(inMsgs) || textOf((inMsgs[0] || {}).content);
    const response = lastAssistantText(outMsgs);

    // tool calls (doc search, mcp tools)
    const toolObs = obs.filter((o) => o.type === "TOOL");
    const toolCalls = toolObs.map((t) => {
      const input = tryParse(t.input) || {};
      const query = input.query || input.q || (typeof t.input === "string" ? t.input : "");
      if (t.name && /doc/i.test(t.name) && query) inc(docQueries, String(query).slice(0, 80));
      return { name: t.name || "tool", input: compactStr(t.input, 240), output: compactStr(t.output, 600) };
    });
    toolObs.forEach((t) => inc(tools, t.name || "tool"));

    const usage = aggregateUsage(obs);
    totalCost += usage.cost;
    totalTokens += usage.tokens;

    const ts = root.startTime || obs[0].startTime;
    if (ts) {
      if (!minTime || ts < minTime) minTime = ts;
      if (!maxTime || ts > maxTime) maxTime = ts;
      inc(daily, dayOf(ts));
    }

    const useCase = classify(prompt);
    inc(useCaseCounts, useCase);
    inc(models, meta.model || root.providedModelName || root.modelId || "unknown");
    const langMatch = (prompt || "").match(/answer in ([a-z]{2})\b/i);
    if (langMatch) inc(languages, langMatch[1].toLowerCase());
    inc(promptShapes, useCase);

    traces.push({
      id: traceId,
      timestamp: ts,
      // Kai prompts embed large experiment-stats blocks; cap stored text to keep
      // the runtime dataset small (full text isn't needed for the dashboard).
      prompt: compactStr(prompt, 1500),
      response: compactStr(response, 2500),
      outcome: useCase,
      useCase,
      metadata: {
        thread_id: meta.thread_id || null,
        model: meta.model || root.providedModelName || root.modelId || null,
        backend_version: meta.backend_version || null,
      },
      tokens: usage.tokens,
      cost: usage.cost,
      latencyMs: typeof root.latencyMs === "number" ? Math.round(root.latencyMs) : null,
      tools: toolCalls,
      timeline: buildTimeline(obs),
    });
  }

  traces.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const summary = {
    totalObservations: observations.length,
    traceCount: traces.length,
    dateRange: { from: minTime, to: maxTime },
    modelCost: round(totalCost),
    modelTokens: totalTokens,
    toolLookups: Object.values(tools).reduce((a, b) => a + b, 0),
    docQueries: Object.values(docQueries).reduce((a, b) => a + b, 0),
  };

  const patterns = {
    useCaseCounts: topEntries(useCaseCounts, 10),
    models: topEntries(models, 10),
    tools: topEntries(tools, 12),
    topDocQueries: topEntries(docQueries, 20),
    languages: topEntries(languages, 12),
    promptShapes: topEntries(promptShapes, 10),
    dailyActivity: Object.entries(daily).sort().map(([date, count]) => ({ date, count })),
  };

  return { feature: "kai", summary, patterns, traces };
}

/* -------------------------------------------------------------------- goals */

function buildGoals(observations) {
  const groups = groupByTrace(observations);
  const traces = [];

  const agents = {};
  const domains = {};
  const customers = {};
  const tools = {};
  const daily = {};
  let totalCost = 0;
  let totalTokens = 0;
  let minTime = null;
  let maxTime = null;

  for (const [traceId, obs] of groups) {
    const root =
      obs.find((o) => o.name === "Streaming") ||
      obs.find((o) => o.type === "SPAN" && !o.parentObservationId) ||
      obs.find((o) => !o.parentObservationId) ||
      obs[0];
    if (!root) continue;

    const meta = root.metadata || {};
    const inMsgs = messagesOf(root.input);
    const outMsgs = messagesOf(root.output);
    const prompt = firstUserText(inMsgs) || textOf((inMsgs[0] || {}).content);
    const response = lastAssistantText(outMsgs);

    // detect generated goal/tracking code in the conversation
    const allText = outMsgs.map((m) => textOf(m.content)).join("\n");
    const codeMatch = allText.match(/\(\(\)\s*=>\s*\{[\s\S]*?\}\)\(\);?/);
    const goalSnippet = codeMatch ? codeMatch[0].slice(0, 4000) : null;

    const toolObs = obs.filter((o) => o.type === "TOOL");
    const toolCalls = toolObs.map((t) => ({
      name: t.name || "tool",
      input: compactStr(t.input, 400),
      output: compactStr(t.output, 700),
    }));
    toolObs.forEach((t) => inc(tools, t.name || "tool"));

    const usage = aggregateUsage(obs);
    totalCost += usage.cost;
    totalTokens += usage.tokens;

    const ts = root.startTime || obs[0].startTime;
    if (ts) {
      if (!minTime || ts < minTime) minTime = ts;
      if (!maxTime || ts > maxTime) maxTime = ts;
      inc(daily, dayOf(ts));
    }

    inc(agents, meta.agent_name || "goals");
    const dom = domainOf(meta.url);
    if (dom) inc(domains, dom);
    inc(customers, meta.customer_id || meta.account_id || "unknown");

    traces.push({
      id: traceId,
      timestamp: ts,
      prompt,
      response,
      outcome: goalSnippet ? "code_generated" : "answer",
      goalSnippet,
      metadata: {
        agent_name: meta.agent_name || null,
        url: meta.url || null,
        customer_id: meta.customer_id || null,
        experiment_id: extractExperiment(meta),
        variation_id: meta.variation_id || null,
        thread_id: meta.thread_id || null,
        electra_version: meta.electra_version || null,
      },
      tokens: usage.tokens,
      cost: usage.cost,
      latencyMs: typeof root.latencyMs === "number" ? Math.round(root.latencyMs) : null,
      tools: toolCalls,
      timeline: buildTimeline(obs),
    });
  }

  traces.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const summary = {
    totalObservations: observations.length,
    traceCount: traces.length,
    dateRange: { from: minTime, to: maxTime },
    modelCost: round(totalCost),
    modelTokens: totalTokens,
    toolLookups: Object.values(tools).reduce((a, b) => a + b, 0),
    codeGenerated: traces.filter((t) => t.outcome === "code_generated").length,
  };

  const patterns = {
    agents: topEntries(agents, 10),
    domains: topEntries(domains, 15),
    customers: topEntries(customers, 15),
    tools: topEntries(tools, 12),
    dailyActivity: Object.entries(daily).sort().map(([date, count]) => ({ date, count })),
  };

  return { feature: "goals", summary, patterns, traces };
}

function extractExperiment(meta) {
  if (meta.experiment_id) return meta.experiment_id;
  if (meta.url) {
    const m = String(meta.url).match(/experimentId=(\d+)/);
    if (m) return m[1];
  }
  if (meta.thread_id) {
    const m = String(meta.thread_id).match(/(\d+)$/);
    if (m) return m[1];
  }
  return null;
}

/* --------------------------------------------------------------------- main */

const BUILDERS = { targeting: buildTargeting, kai: buildKai, goals: buildGoals };

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = { generatedAt: new Date().toISOString(), datasets: {} };

  for (const [feature, cfg] of Object.entries(SOURCES)) {
    const file = resolveSource(cfg);
    if (!file) {
      console.warn(`! ${feature}: no export matching id ${cfg.id} in ${DOWNLOADS} — skipping`);
      continue;
    }
    const opts = {};
    if (cfg.sinceDays && /\.csv$/i.test(file)) {
      opts.sinceTime = cutoffDate(cfg.sinceDays);
      opts.trim = true;
    }
    const observations = await load(file, opts);
    if (!observations) {
      console.warn(`! ${feature}: could not read ${file} — skipping`);
      continue;
    }
    console.log(`• ${feature}: ${observations.length} observations from ${path.basename(file)}`);
    const result = BUILDERS[feature](observations);
    result.generatedAt = manifest.generatedAt;
    result.source = path.basename(file);
    if (opts.sinceTime) result.window = { sinceDays: cfg.sinceDays, since: opts.sinceTime };
    const outPath = path.join(OUT_DIR, cfg.out);
    fs.writeFileSync(outPath, JSON.stringify(result));
    const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
    console.log(`  -> ${cfg.out} (${result.traces.length} traces, ${kb} KB)`);
    manifest.datasets[feature] = {
      file: cfg.out,
      traceCount: result.traces.length,
      summary: result.summary,
    };
  }

  fs.writeFileSync(path.join(OUT_DIR, "datasets-manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("✓ wrote datasets-manifest.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
