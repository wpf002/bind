import Link from "next/link";
import { listResolutions } from "@bind/db";
import { RESOLUTION_MECHANISMS, resolutionsByYear, type ResolutionMechanism } from "@bind/core";
import { Tip } from "@/components/marks";
import { fmtDate, titleCase } from "@/lib/format";

export const metadata = { title: "Resolutions" };

export default async function Resolutions() {
  const rows = (await listResolutions()).flatMap((r) =>
    r.resolvedAt && r.resolution !== "none" ? [{ ...r, resolution: r.resolution as ResolutionMechanism, resolvedAt: r.resolvedAt }] : []
  );
  const series = resolutionsByYear(rows, new Date().getUTCFullYear());
  const totals = series.at(-1)?.cumulative;

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">
          Resolutions
          <Tip text="How each resolved case stopped being live. A workaround doesn't count." />
        </h1>
        <div className="reason-bar">
          {RESOLUTION_MECHANISMS.map((m) => (
            <div className={`reason-stat${m === "engineering" ? " reason-stat-key" : ""}`} key={m}>
              <b>{totals?.[m] ?? 0}</b>
              <span>{titleCase(m)}</span>
            </div>
          ))}
        </div>
      </header>

      {series.length ? (
        <>
          <div className="sect-h">
            <h2>Running Total</h2>
            <span className="n">{rows.length}</span>
          </div>
          <div className="scroll-x">
            <table className="tbl years">
              <thead>
                <tr>
                  <th>Mechanism</th>
                  {series.map((y) => (
                    <th key={y.year} className="num">
                      {y.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESOLUTION_MECHANISMS.map((m) => (
                  <tr key={m} className={m === "engineering" ? "years-key" : undefined}>
                    <td>{titleCase(m)}</td>
                    {series.map((y) => (
                      <td key={y.year} className="num">
                        <span className="years-n">{y.cumulative[m]}</span>
                        <span className="years-add">{y.added[m] ? `+${y.added[m]}` : ""}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sect-h" style={{ marginTop: 48 }}>
            <h2>Log</h2>
          </div>
          <table className="log">
            <thead>
              <tr>
                <th className="col-id">Resolved</th>
                <th>Case</th>
                <th className="col-res">Mechanism</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug}>
                  <td className="c-id">
                    <Link className="row-link" href={`/case/${r.slug}`} aria-label={r.title} />
                    <div className="row-id">
                      <span className="id">{fmtDate(r.resolvedAt)}</span>
                      <span className="ref">{r.slug}</span>
                    </div>
                  </td>
                  <td className="c-case">
                    <div className="row-title">{r.title}</div>
                    <div className="row-statement">{r.resolvedBy ?? r.transitions[0]?.trigger}</div>
                  </td>
                  <td>
                    <span className="chip chip-plain">{titleCase(r.resolution)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="empty">No Resolved Cases</div>
      )}
    </div>
  );
}
