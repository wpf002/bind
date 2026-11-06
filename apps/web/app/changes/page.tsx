import Link from "next/link";
import { listChanges } from "@bind/db";
import { CHANGE_KIND_LABEL, type ChangeKind } from "@bind/core";
import { Tip } from "@/components/marks";
import { API_URL } from "@/lib/api";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Changes" };

const KIND_CHIP: Record<ChangeKind, string> = {
  corpus_released: "chip-accent",
  case_published: "chip-accent",
  case_resolved: "chip-ok",
  case_transition: "chip-plain",
  source_changed: "chip-warn",
};

export default async function Changes() {
  const events = await listChanges();

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">
          Changes
          <Tip text="Every publish, transition and failed source check in the published corpus, newest first." />
        </h1>
        <div className="page-side">
          <a className="btn" href={`${API_URL}/changes.atom`} type="application/atom+xml">
            Atom Feed
          </a>
          <div className="page-stats">
            <div className="page-stat">
              <b>{events.length}</b>
              <span>Events</span>
            </div>
          </div>
        </div>
      </header>

      {events.length ? (
        <table className="log">
          <thead>
            <tr>
              <th className="col-id">Date</th>
              <th>Change</th>
              <th className="col-res">Kind</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td className="c-id">
                  <Link className="row-link" href={e.url} aria-label={e.title} />
                  <div className="row-id">
                    <span className="id">{fmtDate(e.occurredAt)}</span>
                    <span className="ref">{e.url.replace(/^\/(case\/)?/, "")}</span>
                  </div>
                </td>
                <td className="c-case">
                  <div className="row-title">{e.title}</div>
                  <div className="row-statement">{e.summary}</div>
                </td>
                <td>
                  <span className={`chip ${KIND_CHIP[e.kind]}`}>{CHANGE_KIND_LABEL[e.kind]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty">No Changes</div>
      )}
    </div>
  );
}
