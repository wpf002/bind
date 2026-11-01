import Link from "next/link";
import { INCLUSION_CRITERIA } from "@bind/core";
import { RESOLVABILITY } from "@bind/shared";
import { leads, listShapes, listTransitions, stats } from "@bind/db";
import { Res } from "@/components/marks";
import { fmtDate, resNote, titleCase } from "@/lib/format";

export const metadata = { title: "Method" };

export default async function Method() {
  const [s, transitions, shapes] = await Promise.all([
    stats(),
    listTransitions(),
    listShapes(),
  ]);
  const shapeName = (slug: string) =>
    shapes.find((x) => x.slug === slug)?.name ?? slug;

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">Method</h1>
      </header>
      <div className="method">
        <nav className="toc" aria-label="Sections">
          <a href="#inclusion">Inclusion Test</a>
          <a href="#resolvability">Resolvability</a>
          <a href="#gate">Citation Gate</a>
          <a href="#transitions">Transitions</a>
          <a href="#leads">Leads</a>
        </nav>
        <div>
          <section id="inclusion">
            <h2>Inclusion Test</h2>
            <p className="prose" style={{ marginBottom: 24 }}>
              A case enters the registry only if a competent engineer with
              unlimited budget still cannot satisfy both the legal mandate and
              the architectural property. All five criteria must hold. Failing
              one is a rejection, logged publicly under that criterion.
            </p>
            <div className="test">
              {INCLUSION_CRITERIA.map((c, i) => (
                <div className="test-row" key={c.key}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="test-label">{c.label}</span>
                  <span className="test-q">
                    {c.question}{" "}
                    <Link
                      className="code"
                      href="/rejections"
                      style={{ color: "var(--accent)" }}
                    >
                      {c.failsAs}
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section id="resolvability">
            <h2>Resolvability</h2>
            <div className="res-def">
              {RESOLVABILITY.map((r) => (
                <div key={r}>
                  <Res r={r} />
                  <p>{resNote(r)}</p>
                  <span className="mono muted" style={{ fontSize: 12 }}>
                    {s.byResolvability[r] ?? 0} cases
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section id="gate">
            <h2>Citation Gate</h2>
            <p className="prose">
              Every provision a case relies on is opened at its primary source
              and checked against the quoted text. A case with any unverified or
              disputed citation stays unpublished. There is no provisional tier.
            </p>
            <div className="reason-bar" style={{ marginTop: 24 }}>
              <div className="reason-stat">
                <b>{s.published}</b>
                <span>Published</span>
              </div>
              <div className="reason-stat">
                <b>{s.held}</b>
                <span>Held</span>
              </div>
              <div className="reason-stat">
                <b>{s.unverifiedCitations}</b>
                <span>Unverified Citations</span>
              </div>
              <div className="reason-stat">
                <b>{s.gate}</b>
                <span>Taxonomy Gate</span>
              </div>
            </div>
          </section>

          <section id="transitions">
            <h2>Transitions</h2>
            {transitions.length ? (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Case</th>
                    <th>Change</th>
                    <th>Trigger</th>
                  </tr>
                </thead>
                <tbody>
                  {transitions.map((t) => (
                    <tr key={t.id}>
                      <td className="mono">{fmtDate(t.occurredAt)}</td>
                      <td>
                        <Link href={`/case/${t.case.slug}`} className="id">
                          {t.case.slug}
                        </Link>
                      </td>
                      <td className="mono">
                        {titleCase(t.fromState)} → {titleCase(t.toState)}
                      </td>
                      <td>
                        {t.triggerUrl ? (
                          <a href={t.triggerUrl}>{t.trigger}</a>
                        ) : (
                          t.trigger
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">None Recorded</p>
            )}
          </section>

          <section id="leads">
            <h2>Leads</h2>
            {leads.length ? (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Candidate</th>
                    <th>Likely Shape</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.ref}>
                      <td className="mono">{l.ref}</td>
                      <td>{l.title}</td>
                      <td>
                        {l.shape ? (
                          <Link href={`/shapes/${l.shape}`}>
                            {shapeName(l.shape)}
                          </Link>
                        ) : (
                          <span className="muted">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">None Open</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
