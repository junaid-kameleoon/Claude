import { useMemo, useState } from "react";
import type { GoalsData, GoalsTrace } from "../../lib/types";
import { Metric, Panel, BarList, DayChart, Timeline, ToolCalls, KV, Insight } from "../../components/primitives";
import { fmtInt, fmtCost, fmtTokens, fmtDate, fmtRange, fmtLatency } from "../../lib/format";

export function GoalsView({ data }: { data: GoalsData }) {
  const [tab, setTab] = useState<"exchange" | "patterns">("exchange");
  const { summary } = data;

  return (
    <div>
      <div className="metrics">
        <Metric label="Sessions" value={fmtInt(summary.traceCount)} sub={fmtRange(summary.dateRange.from, summary.dateRange.to)} />
        <Metric label="Snippets generated" value={fmtInt(summary.codeGenerated)} sub="goal tracking code" />
        <Metric label="HTML inspections" value={fmtInt(summary.toolLookups)} sub="inspect_html_code" />
        <Metric label="Sites" value={fmtInt(data.patterns.domains.length)} sub="domains" />
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

function Exchange({ data }: { data: GoalsData }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(data.traces[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.traces;
    return data.traces.filter(
      (t) => t.prompt.toLowerCase().includes(q) || (t.response || "").toLowerCase().includes(q) || (t.metadata.url || "").toLowerCase().includes(q),
    );
  }, [data.traces, query]);

  const selected = filtered.find((t) => t.id === selectedId) || filtered[0] || null;

  if (data.traces.length === 0) {
    return <div className="empty-state">No AI Goals traces in this export yet.</div>;
  }

  return (
    <div className="exchange-grid">
      <div className="col">
        <section className="panel">
          <div className="list-controls">
            <input className="search-input" placeholder="Search sessions…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="trace-list-wrap">
            {filtered.map((t) => (
              <button key={t.id} className={"trace-item" + (selected?.id === t.id ? " active" : "")} onClick={() => setSelectedId(t.id)}>
                <div className="ti-top">
                  <span className={"badge " + (t.outcome === "code_generated" ? "trigger" : "neutral")}>
                    {t.outcome === "code_generated" ? "snippet" : "answer"}
                  </span>
                  <span className="ti-time">{fmtDate(t.timestamp)}</span>
                </div>
                <div className="ti-prompt">{t.metadata.url || t.prompt || "(session)"}</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="col">{selected ? <ChatView trace={selected} /> : <div className="empty-state">Select a session</div>}</div>

      <div className="col meta-col">{selected && <MetaView trace={selected} />}</div>
    </div>
  );
}

function ChatView({ trace }: { trace: GoalsTrace }) {
  return (
    <div className="chat">
      <div className="bubble user">
        <div className="role">Context / prompt</div>
        <div className="content scroll">{trace.prompt || "(no prompt)"}</div>
      </div>
      <div className="bubble assistant">
        <div className="role">Aria · goals agent</div>
        <div className="content">{trace.response || <span className="muted">No textual response.</span>}</div>
      </div>
      {trace.goalSnippet && (
        <div className="bubble assistant">
          <div className="role">Generated goal-tracking snippet</div>
          <pre className="code">{trace.goalSnippet}</pre>
        </div>
      )}
    </div>
  );
}

function MetaView({ trace }: { trace: GoalsTrace }) {
  return (
    <>
      <Panel title="Session details">
        <KV
          rows={[
            ["Agent", trace.metadata.agent_name],
            ["When", fmtDate(trace.timestamp)],
            ["Customer", trace.metadata.customer_id],
            ["Experiment", trace.metadata.experiment_id],
            ["Variation", trace.metadata.variation_id && trace.metadata.variation_id !== "None" ? trace.metadata.variation_id : null],
            ["Electra", trace.metadata.electra_version],
            ["Tokens", fmtTokens(trace.tokens)],
            ["Cost", fmtCost(trace.cost)],
            ["Latency", fmtLatency(trace.latencyMs)],
            [
              "Page",
              trace.metadata.url ? (
                <a href={trace.metadata.url} target="_blank" rel="noreferrer">
                  {trace.metadata.url}
                </a>
              ) : null,
            ],
          ]}
        />
      </Panel>

      {trace.tools.length > 0 && (
        <Panel title={`HTML inspections · ${trace.tools.length}`}>
          <ToolCalls tools={trace.tools} />
        </Panel>
      )}

      <Panel title="Observation flow">
        <Timeline steps={trace.timeline} />
      </Panel>
    </>
  );
}

function Patterns({ data }: { data: GoalsData }) {
  const p = data.patterns;
  return (
    <div>
      <div className="insight-cards">
        <Insight value={fmtInt(data.summary.traceCount)} label="Goal sessions" />
        <Insight value={fmtInt(data.summary.codeGenerated)} label="Snippets generated" />
        <Insight value={fmtInt(data.summary.toolLookups)} label="HTML inspections" />
        <Insight value={fmtCost(data.summary.modelCost)} label="Model spend" />
      </div>

      <div className="patterns-grid">
        <Panel title="Agents">
          <BarList data={p.agents} />
        </Panel>
        <Panel title="Domains">
          <BarList data={p.domains} color="orange" />
        </Panel>
        <Panel title="Customers">
          <BarList data={p.customers} />
        </Panel>
        <Panel title="Tools">
          <BarList data={p.tools} color="orange" />
        </Panel>
        <Panel title="Daily activity">
          <DayChart data={p.dailyActivity} />
        </Panel>
      </div>
    </div>
  );
}
