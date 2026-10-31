import { listRejections } from "@bind/db";
import { INCLUSION_CRITERIA } from "@bind/core";
import { Tip } from "@/components/marks";
import { fmtDate, titleCase } from "@/lib/format";

export const metadata = { title: "Rejections" };

const criterionFor = (reason: string) => INCLUSION_CRITERIA.find((c) => c.failsAs === reason)?.label;

export default async function Rejections() {
  const rows = await listRejections();
  const counts = Object.entries(
    rows.reduce<Record<string, number>>((a, r) => ((a[r.reason] = (a[r.reason] ?? 0) + 1), a), {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">
          Rejections
          <Tip text="Every rejected submission is logged with the inclusion criterion it failed." />
        </h1>
        <div className="reason-bar">
          {counts.map(([reason, n]) => (
            <div className="reason-stat" key={reason}>
              <b>{n}</b>
              <span>{titleCase(reason)}</span>
            </div>
          ))}
        </div>
      </header>
      <table className="log">
        <thead>
          <tr>
            <th className="col-id">ID</th>
            <th>Claim</th>
            <th className="col-shape">Failed</th>
            <th className="col-jur">Decided</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} id={r.slug}>
              <td className="c-id">
                <span className="id">{r.slug}</span>
              </td>
              <td className="c-case">
                <div className="row-title">{r.title}</div>
                <p className="rej-claim">“{r.claim}”</p>
                <p className="rej-reason">{r.reasoning}</p>
              </td>
              <td>
                <span className="chip chip-accent code">{titleCase(r.reason)}</span>
                {criterionFor(r.reason) ? (
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    {criterionFor(r.reason)}
                  </div>
                ) : null}
              </td>
              <td className="mono muted" style={{ fontSize: 12 }}>
                {fmtDate(r.decidedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
