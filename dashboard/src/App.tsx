import { useEffect, useState } from "react";
import type { TargetingData, KaiData, GoalsData } from "./lib/types";
import { TargetingView } from "./features/targeting/TargetingView";
import { KaiView } from "./features/kai/KaiView";
import { GoalsView } from "./features/goals/GoalsView";
import { Gate, logout } from "./auth/Gate";
import { fmtDate } from "./lib/format";

type FeatureKey = "targeting" | "goals" | "kai";

const TABS: { key: FeatureKey; label: string }[] = [
  { key: "targeting", label: "AI Assets" },
  { key: "goals", label: "AI Goals" },
  { key: "kai", label: "Kai" },
];

// Resolve data files against the deployment base path (Vite injects BASE_URL).
const asset = (file: string) => `${import.meta.env.BASE_URL}${file}`;

function useDataset<T>(file: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(asset(file))
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [file]);
  return { data, error };
}

function Dashboard() {
  const [tab, setTab] = useState<FeatureKey>("targeting");
  const targeting = useDataset<TargetingData>("trace-data.json");
  const goals = useDataset<GoalsData>("goals-data.json");
  const kai = useDataset<KaiData>("kai-data.json");

  const generatedAt = targeting.data?.generatedAt;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="dot" /> AI Trace Explorer
        </div>
        <nav className="feature-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </nav>
        <span className="spacer" />
        {generatedAt && <span className="meta-note">data · {fmtDate(generatedAt)}</span>}
        <button className="logout" onClick={logout}>
          Lock
        </button>
      </header>

      <main className="main">
        {tab === "targeting" && <Loader res={targeting} render={(d) => <TargetingView data={d} />} />}
        {tab === "goals" && <Loader res={goals} render={(d) => <GoalsView data={d} />} />}
        {tab === "kai" && <Loader res={kai} render={(d) => <KaiView data={d} />} />}
      </main>
    </div>
  );
}

function Loader<T>({ res, render }: { res: { data: T | null; error: string | null }; render: (d: T) => JSX.Element }) {
  if (res.error) return <div className="empty-state">Failed to load data: {res.error}</div>;
  if (!res.data) return <div className="spinner">Loading dataset…</div>;
  return render(res.data);
}

export default function App() {
  return (
    <Gate>
      <Dashboard />
    </Gate>
  );
}
