import { useMemo, useState } from "react";
import type { KaiData, KaiTrace } from "../../lib/types";
import { Metric, Panel, BarList, DayChart, Timeline, ToolCalls, KV, Insight } from "../../components/primitives";
import { fmtInt, fmtCost, fmtTokens, fmtDate, fmtRange, fmtLatency } from "../../lib/format";

export function KaiView({ data }: { data: KaiData }) {
  const [tab, setTab] = useState<"exchange" | "patterns">("exchange");
  const { summary } = data;

  return (
    <div>
      <div className="metrics">
        <Metric label="Conversations" value={fmtInt(summary.traceCount)} sub={fmtRange(summary.dateRange.from, summary.dateRange.to)} />
        <Metric label="Doc lookups" value={fmtInt(summary.docQueries)} sub="documentation searches" />
        <Metric label="Tool calls" value={fmtInt(summary.toolLookups)} sub="all tools" />
        <Metric label="Models" value={fmtInt(data.patterns.models.length)} sub={data.patterns.models.map((m) => m.name).join(", ")} />
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

      {tab === "exchange" ? <Exchange data={data} /> : <Patterns data={data} />}
    </div>
  );
}

const FILTERS = ["All", "Documentation Q&A / chat", "Experiment summary", "Translation", "Tools"];

function Exchange({ data }: { data: KaiData }) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(data.traces[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.traces.filter((t) => {
      if (filter === "Tools" && t.tools.length === 0) return false;
      if (filter !== "All" && filter !== "Tools" && t.useCase !== filter) return false;
      if (!q) return true;
      return t.prompt.toLowerCase().includes(q) || (t.response || "").toLowerCase().includes(q);
    });
  }, [data.traces, filter, query]);

  const selected = filtered.find((t) => t.id === selectedId) || filtered[0] || null;

  return (
    <div className="exchange-grid">
      <div className="col">
        <section className="panel">
          <div className="list-controls">
            <input className="search-input" placeholder="Search prompts and answers…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="filter-chips">
              {FILTERS.map((f) => (
                <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
                  {f === "Documentation Q&A / chat" ? "Docs Q&A" : f}
                </button>
              ))}
            </div>
          </div>
          <div className="trace-list-wrap">
            {filtered.length === 0 ? (
              <div className="list-empty">No conversations match.</div>
            ) : (
              filtered.map((t) => (
                <button key={t.id} className={"trace-item" + (selected?.id === t.id ? " active" : "")} onClick={() => setSelectedId(t.id)}>
                  <div className="ti-top">
                    <span className="badge neutral">{t.useCase === "Documentation Q&A / chat" ? "Docs Q&A" : t.useCase}</span>
                    <span className="ti-time">{fmtDate(t.timestamp)}</span>
                  </div>
                  <div className="ti-prompt">{t.prompt || "(no prompt)"}</div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="col">{selected ? <ChatView trace={selected} /> : <div className="empty-state">Select a conversation</div>}</div>

      <div className="col meta-col">{selected && <MetaView trace={selected} />}</div>
    </div>
  );
}

function ChatView({ trace }: { trace: KaiTrace }) {
  return (
    <div className="chat">
      <div className="bubble user">
        <div className="role">User prompt</div>
        <div className="content scroll">{trace.prompt || "(no prompt)"}</div>
      </div>
      <div className="bubble assistant">
        <div className="role">Kai response</div>
        <div className="content">{trace.response || <span className="muted">No response captured.</span>}</div>
      </div>
    </div>
  );
}

function MetaView({ trace }: { trace: KaiTrace }) {
  return (
    <>
      <Panel title="Conversation details">
        <KV
          rows={[
            ["Use case", <span className="badge neutral">{trace.useCase}</span>],
            ["When", fmtDate(trace.timestamp)],
            ["Model", trace.metadata.model],
            ["Backend", trace.metadata.backend_version],
            ["Tokens", fmtTokens(trace.tokens)],
            ["Cost", fmtCost(trace.cost)],
            ["Latency", fmtLatency(trace.latencyMs)],
            ["Thread", trace.metadata.thread_id ? <code style={{ fontSize: 11 }}>{trace.metadata.thread_id}</code> : null],
          ]}
        />
      </Panel>

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

function Patterns({ data }: { data: KaiData }) {
  const p = data.patterns;
  return (
    <div>
      <div className="insight-cards">
        <Insight value={fmtInt(data.summary.traceCount)} label="Conversations analyzed" />
        <Insight value={fmtInt(data.summary.docQueries)} label="Documentation lookups" />
        <Insight value={fmtInt(p.topDocQueries.length)} label="Distinct doc queries" />
        <Insight value={fmtInt(p.models.length)} label="Models used" />
        <Insight value={fmtCost(data.summary.modelCost)} label="Total model spend" />
      </div>

      <div className="patterns-grid">
        <Panel title="Use cases">
          <BarList data={p.useCaseCounts} total={data.summary.traceCount} />
        </Panel>
        <Panel title="Models">
          <BarList data={p.models} color="orange" />
        </Panel>
        <Panel title="Tools">
          <BarList data={p.tools} />
        </Panel>
        <Panel title="Answer language">
          <BarList data={p.languages} color="orange" empty="Not specified in prompts" />
        </Panel>
        <Panel title="Top documentation queries">
          <BarList data={p.topDocQueries} empty="No documentation lookups" />
        </Panel>
        <Panel title="Daily activity">
          <DayChart data={p.dailyActivity} />
        </Panel>
      </div>
    </div>
  );
}
