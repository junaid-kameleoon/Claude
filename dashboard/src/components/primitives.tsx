import type { ReactNode } from "react";
import type { Entry, DailyPoint, TimelineStep, ToolCall } from "../lib/types";
import { fmtInt, fmtLatency, fmtDay } from "../lib/format";

export function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub != null && <div className="sub">{sub}</div>}
    </div>
  );
}

export function Insight({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="insight">
      <div className="i-value">{value}</div>
      <div className="i-label">{label}</div>
    </div>
  );
}

export function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        {right}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function BarList({
  data,
  max,
  color,
  empty = "No data",
  total,
}: {
  data: Entry[];
  max?: number;
  color?: "teal" | "orange";
  empty?: string;
  total?: number;
}) {
  if (!data || data.length === 0) return <div className="muted">{empty}</div>;
  const peak = max ?? Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="barlist">
      {data.map((d) => (
        <div className="barlist-row" key={d.name}>
          <div className="bl-top">
            <span className="bl-label">{d.name}</span>
            <span className="bl-count">
              {fmtInt(d.count)}
              {total ? ` · ${Math.round((d.count / total) * 100)}%` : ""}
            </span>
          </div>
          <div className="barlist-track">
            <div
              className={"barlist-fill" + (color === "orange" ? " orange" : "")}
              style={{ width: `${(d.count / peak) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DayChart({ data }: { data: DailyPoint[] }) {
  if (!data || data.length === 0) return <div className="muted">No activity</div>;
  const peak = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="daychart">
      {data.map((d) => (
        <div className="daybar-wrap" key={d.date} title={`${d.date}: ${d.count}`}>
          <div className="daybar" style={{ height: `${(d.count / peak) * 100}%` }} />
          <div className="daybar-label">{fmtDay(d.date)}</div>
        </div>
      ))}
    </div>
  );
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  if (!steps || steps.length === 0) return <div className="muted">No observations</div>;
  const peak = Math.max(...steps.map((s) => s.latencyMs || 0), 1);
  return (
    <div>
      {steps.map((s, i) => (
        <div className="timeline-row" key={i}>
          <span className="tl-name" title={s.name}>
            {s.name}
          </span>
          <div className="timeline-meta">
            <div
              className="timeline-bar"
              style={{ width: `${Math.max(((s.latencyMs || 0) / peak) * 80, 2)}px` }}
            />
            <span className="timeline-lat">{fmtLatency(s.latencyMs)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToolCalls({ tools }: { tools: ToolCall[] }) {
  if (!tools || tools.length === 0) return <div className="muted">No tool lookups</div>;
  return (
    <div>
      {tools.map((t, i) => (
        <div className="tool-call" key={i}>
          <div className="tc-name">{t.name}</div>
          {t.input && <div className="tc-io">→ {t.input}</div>}
          {t.output && <div className="tc-io">← {t.output}</div>}
        </div>
      ))}
    </div>
  );
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {rows
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => (
          <div style={{ display: "contents" }} key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
    </dl>
  );
}

export function JsonBlock({ title, value }: { title: string; value: unknown }) {
  if (value == null) return null;
  return (
    <details className="json">
      <summary>{title}</summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}
