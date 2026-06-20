import { useMemo, useState } from "react";
import type { TargetingData, TargetingTrace } from "../../lib/types";
import { Metric, Panel, BarList, DayChart, Timeline, ToolCalls, KV, JsonBlock, Insight } from "../../components/primitives";
import { fmtInt, fmtCost, fmtTokens, fmtPct, fmtDate, fmtRange, fmtLatency } from "../../lib/format";
import { AssetCard } from "./AssetCard";

type Filter = "all" | "segment" | "trigger" | "both" | "clarification" | "tools";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "segment", label: "Segments" },
  { key: "trigger", label: "Triggers" },
  { key: "both", label: "Both" },
  { key: "clarification", label: "Clarifications" },
  { key: "tools", label: "Tools" },
];

export function TargetingView({ data }: { data: TargetingData }) {
  const [tab, setTab] = useState<"exchange" | "patterns">("exchange");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(data.traces[0]?.id ?? null);
  const { summary } = data;

  const jumpTo = (id: string) => {
    setFilter("all");
    setQuery("");
    setSelectedId(id);
    setTab("exchange");
  };

  return (
    <div>
      <div className="metrics">
        <Metric label="Traces" value={fmtInt(summary.traceCount)} sub={fmtRange(summary.dateRange.from, summary.dateRange.to)} />
        <Metric label="Generated assets" value={fmtInt(summary.generatedAssets)} sub="segments + triggers" />
        <Metric label="Clarification rate" value={fmtPct(summary.clarificationRate)} sub={`${data.patterns.outcomeCounts.clarification} traces`} />
        <Metric label="Tool lookups" value={fmtInt(summary.toolLookups)} sub="entity searches" />
        <Metric label="Model spend" value={fmtCost(summary.modelCost)} sub={`${fmtTokens(summary.modelTokens)} tokens`} />
      </div>

      <div className="subtabs">
        <button className={tab === "exchange" ? "active" : ""} onClick={() => setTab("exchange")}>
          Exchange
        </button>
        <button className={tab === "patterns" ? "active" : ""} onClick={() => setTab("patterns")}>
          Patterns
        </button>
      </div>

      {tab === "exchange" ? (
        <Exchange
          data={data}
          filter={filter}
          setFilter={setFilter}
          query={query}
          setQuery={setQuery}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
      ) : (
        <Patterns data={data} onExample={jumpTo} />
      )}
    </div>
  );
}

function Exchange({
  data,
  filter,
  setFilter,
  query,
  setQuery,
  selectedId,
  setSelectedId,
}: {
  data: TargetingData;
  filter: Filter;
  setFilter: (f: Filter) => void;
  query: string;
  setQuery: (q: string) => void;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.traces.filter((t) => {
      if (filter === "tools" && t.tools.length === 0) return false;
      if (filter !== "all" && filter !== "tools" && t.outcome !== filter) return false;
      if (!q) return true;
      return (
        t.prompt.toLowerCase().includes(q) ||
        t.segments.some((s) => s.name.toLowerCase().includes(q)) ||
        t.triggers.some((s) => s.name.toLowerCase().includes(q)) ||
        (t.metadata.current_page_url || "").toLowerCase().includes(q) ||
        t.conditionTypes.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [data.traces, filter, query]);

  const selected =
    filtered.find((t) => t.id === selectedId) || filtered[0] || data.traces.find((t) => t.id === selectedId) || null;
  const CAP = 400;
  const shown = filtered.slice(0, CAP);

  return (
    <div className="exchange-grid">
      <div className="col">
        <section className="panel">
          <div className="list-controls">
            <input
              className="search-input"
              placeholder="Search prompts, assets, URLs, conditions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="filter-chips">
              {FILTERS.map((f) => (
                <button key={f.key} className={filter === f.key ? "active" : ""} onClick={() => setFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="trace-list-wrap">
            {filtered.length === 0 ? (
              <div className="list-empty">No traces match.</div>
            ) : (
              <>
                {shown.map((t) => (
                  <button
                    key={t.id}
                    className={"trace-item" + (selected?.id === t.id ? " active" : "")}
                    onClick={() => setSelectedId(t.id)}
                  >
                    <div className="ti-top">
                      <span className={"badge " + t.outcome}>{t.outcome}</span>
                      <span className="ti-time">{fmtDate(t.timestamp)}</span>
                    </div>
                    <div className="ti-prompt">{t.prompt || "(no prompt)"}</div>
                  </button>
                ))}
                {filtered.length > CAP && (
                  <div className="list-empty">
                    Showing newest {CAP} of {filtered.length.toLocaleString()} — search to narrow.
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <div className="col">{selected ? <ChatView trace={selected} /> : <div className="empty-state">Select a trace</div>}</div>

      <div className="col meta-col">{selected && <MetaView trace={selected} />}</div>
    </div>
  );
}

function ChatView({ trace }: { trace: TargetingTrace }) {
  const assets = [...trace.segments, ...trace.triggers];
  return (
    <div className="chat">
      <div className="bubble user">
        <div className="role">User prompt</div>
        <div className="content">{trace.prompt || "(no prompt)"}</div>
      </div>

      {trace.clarifications.length > 0 && (
        <div className="bubble clarify">
          <div className="role">Assistant · clarification</div>
          <div className="content">{trace.clarifications.join("\n\n")}</div>
        </div>
      )}

      {trace.response && (
        <div className="bubble assistant">
          <div className="role">Assistant</div>
          <div className="content">{trace.response}</div>
        </div>
      )}

      {assets.length > 0 && (
        <div className="bubble assistant">
          <div className="role">Generated assets · {assets.length}</div>
          <div className="content" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {assets.map((a, i) => (
              <AssetCard asset={a} key={i} />
            ))}
          </div>
        </div>
      )}

      {assets.length === 0 && trace.clarifications.length === 0 && !trace.response && (
        <div className="bubble assistant">
          <div className="role">Assistant</div>
          <div className="content muted">No structured assets returned.</div>
        </div>
      )}

      <JsonBlock title="Structured response (parsed payload)" value={trace.structured} />
    </div>
  );
}

function MetaView({ trace }: { trace: TargetingTrace }) {
  return (
    <>
      <Panel title="Trace details">
        <KV
          rows={[
            ["Outcome", <span className={"badge " + trace.outcome}>{trace.outcome}</span>],
            ["When", fmtDate(trace.timestamp)],
            ["User", trace.metadata.user_id],
            ["Site", trace.metadata.site_id],
            ["Object", trace.metadata.current_object_type],
            ["Model", trace.metadata.model],
            ["Tokens", fmtTokens(trace.tokens)],
            ["Cost", fmtCost(trace.cost)],
            ["Latency", fmtLatency(trace.latencyMs)],
            [
              "Page",
              trace.metadata.current_page_url ? (
                <a href={trace.metadata.current_page_url} target="_blank" rel="noreferrer">
                  {trace.metadata.current_page_url}
                </a>
              ) : null,
            ],
            ["Thread", trace.metadata.thread_id ? <code style={{ fontSize: 11 }}>{trace.metadata.thread_id}</code> : null],
          ]}
        />
      </Panel>

      {trace.conditionTypes.length > 0 && (
        <Panel title="Condition types">
          <div className="chip-row">
            {trace.conditionTypes.map((c) => (
              <span className="chip" key={c}>
                {c}
              </span>
            ))}
          </div>
        </Panel>
      )}

      {trace.tools.length > 0 && (
        <Panel title={`Tool lookups · ${trace.tools.length}`}>
          <ToolCalls tools={trace.tools} />
        </Panel>
      )}

      <Panel title="Observation flow">
        <Timeline steps={trace.timeline} />
      </Panel>
    </>
  );
}

function Patterns({ data, onExample }: { data: TargetingData; onExample: (id: string) => void }) {
  const p = data.patterns;
  const oc = p.outcomeCounts;
  const total = data.summary.traceCount;
  const outcomeEntries = [
    { name: "Segment", count: oc.segment },
    { name: "Trigger", count: oc.trigger },
    { name: "Both", count: oc.both },
    { name: "Clarification", count: oc.clarification },
    { name: "None", count: oc.none },
  ];

  return (
    <div>
      <div className="insight-cards">
        <Insight value={fmtInt(total)} label="Total exchanges analyzed" />
        <Insight value={fmtInt(data.summary.generatedAssets)} label="Assets generated" />
        <Insight value={fmtPct(data.summary.clarificationRate)} label="Needed a clarification" />
        <Insight value={fmtInt(p.conditionTypeCounts.length)} label="Distinct condition types" />
        <Insight value={fmtInt(p.domains.length)} label="Domains targeted" />
      </div>

      <div className="patterns-grid">
        <Panel title="Use-case clusters">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {p.useCaseClusters.map((c) => (
              <div className="cluster" key={c.key}>
                <div className="cl-top">
                  <span className="cl-label">{c.label}</span>
                  <span className="cl-count">{c.count}</span>
                </div>
                <div className="cl-sub">{fmtPct(c.clarificationRate)} clarification rate</div>
                <div className="cl-examples">
                  {c.examples.map((id) => (
                    <button key={id} onClick={() => onExample(id)} title="Open this trace in Exchange">
                      {id.slice(0, 8)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="col">
          <Panel title="Outcome mix">
            <BarList data={outcomeEntries} total={total} />
          </Panel>
          <Panel title="Repeated prompt shapes">
            <BarList data={p.promptShapes} color="orange" />
          </Panel>
        </div>

        <Panel title="Condition types">
          <BarList data={p.conditionTypeCounts} />
        </Panel>

        <Panel title="Match types">
          <BarList data={p.matchTypeCounts} color="orange" />
        </Panel>

        <Panel title="Current object">
          <BarList data={p.currentObjectCounts} />
        </Panel>

        <Panel title="Top domains">
          <BarList data={p.domains} color="orange" />
        </Panel>

        <Panel title="Top sites">
          <BarList data={p.sites} />
        </Panel>

        <Panel title="Top users">
          <BarList data={p.users} color="orange" />
        </Panel>

        <Panel title="Daily activity">
          <DayChart data={p.dailyActivity} />
        </Panel>
      </div>
    </div>
  );
}
