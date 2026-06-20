import type { Asset } from "../../lib/types";

export function AssetCard({ asset }: { asset: Asset }) {
  return (
    <div className={"asset " + asset.kind}>
      <div className="a-head">
        <span className={"badge " + asset.kind}>{asset.kind}</span>
        <span className="a-name">{asset.name}</span>
      </div>
      {asset.description && <div className="a-desc">{asset.description}</div>}
      {asset.conditions.length > 0 ? (
        <>
          <div className="a-op">MATCH {asset.operator}</div>
          <div className="chip-row" style={{ padding: "6px 11px" }}>
            {dedupeTypes(asset.conditions).map((t) => (
              <span className="chip" key={t}>
                {t}
              </span>
            ))}
          </div>
          <table className="cond-table">
            <tbody>
              {asset.conditions.map((c, i) => (
                <tr key={i}>
                  <td className="c-type">{c.type}</td>
                  <td>
                    <span className={c.include ? "c-inc" : "c-exc"}>
                      {c.include ? "is" : "is not"}
                    </span>
                    {c.matchType && <span className="c-match"> · {c.matchType}</span>}
                  </td>
                  <td className="c-val">{c.value || <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="a-desc muted">No structured conditions</div>
      )}
    </div>
  );
}

function dedupeTypes(conds: { type: string }[]): string[] {
  return [...new Set(conds.map((c) => c.type))];
}
