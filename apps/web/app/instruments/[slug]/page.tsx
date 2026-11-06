import Link from "next/link";
import { notFound } from "next/navigation";
import { getInstrument } from "@bind/db";
import { Jur, Res } from "@/components/marks";
import { fmtDate, titleCase } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const i = await getInstrument((await params).slug);
  return { title: i?.shortName ?? "Not Found" };
}

export default async function InstrumentPage({ params }: Props) {
  const i = await getInstrument((await params).slug);
  if (!i) notFound();
  const manyNames = i.instruments.length > 1;

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/instruments">Instruments</Link>
        <span>/</span>
        <span>{i.shortName}</span>
      </nav>
      <header className="shape-hero">
        <div className="shape-main">
          <div className="case-meta">
            <span className="eyebrow">Instrument</span>
          </div>
          <h1 className="case-title">{i.shortName}</h1>
          <p className="shape-def">{i.instruments.join(" · ")}</p>
          <dl className="kv">
            <dt>Regime</dt>
            <dd>{i.regimes.join(" · ")}</dd>
            <dt>Jurisdiction</dt>
            <dd>
              <div className="jurs">
                {i.jurisdictions.map((j) => (
                  <Jur key={j.code} code={j.code} link />
                ))}
              </div>
            </dd>
          </dl>
        </div>
        <aside className="verdict">
          <span className="eyebrow">Cases</span>
          <span className="verdict-v">{i.cases}</span>
          <dl className="kv" style={{ gridTemplateColumns: "88px 1fr" }}>
            <dt>Provisions</dt>
            <dd className="mono">{i.provisions.length}</dd>
          </dl>
        </aside>
      </header>

      {i.provisions.map((p) => (
        <section key={p.id} id={p.anchor} style={{ marginBottom: 48 }}>
          <div className="sect-h">
            <h2>
              <a href={`#${p.anchor}`}>{p.provision}</a>
            </h2>
            <span className="n">{p.cases.length}</span>
          </div>
          {manyNames ? <div className="provision-instr">{p.instrument}</div> : null}
          <blockquote className="mandate">{p.mandate}</blockquote>
          <dl className="kv provision-dates">
            {p.sourceUrl ? (
              <>
                <dt>Source</dt>
                <dd>
                  <a className="source-link" href={p.sourceUrl} target="_blank" rel="noreferrer">
                    {p.sourceUrl.replace(/^https?:\/\//, "")} ↗
                  </a>
                </dd>
              </>
            ) : null}
            {p.inForceSince ? (
              <>
                <dt>In Force</dt>
                <dd className="mono">{fmtDate(p.inForceSince)}</dd>
              </>
            ) : null}
            {p.amendedAt ? (
              <>
                <dt>Amended</dt>
                <dd className="mono">{fmtDate(p.amendedAt)}</dd>
              </>
            ) : null}
          </dl>
          {p.cases.length ? (
            <table className="log">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Case</th>
                  <th className="col-jur">Role</th>
                  <th className="col-res">Resolvability</th>
                </tr>
              </thead>
              <tbody>
                {p.cases.map((c) => (
                  <tr key={c.slug}>
                    <td className="c-id">
                      <Link className="row-link" href={`/case/${c.slug}`} aria-label={c.title} />
                      <div className="row-id">
                        <span className="id">{c.slug}</span>
                        <span className="ref">{c.corpusRef}</span>
                      </div>
                    </td>
                    <td className="c-case">
                      <div className="row-title">{c.title}</div>
                      {c.note ? <div className="row-statement">{c.note}</div> : null}
                    </td>
                    <td>
                      <span className="chip chip-plain">{titleCase(c.role)}</span>
                    </td>
                    <td>
                      <Res r={c.resolvability} />
                      {c.resolution !== "none" ? (
                        <div className="chip chip-ok" style={{ marginTop: 6 }}>
                          {titleCase(c.resolution)}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">No Published Cases</div>
          )}
        </section>
      ))}
    </div>
  );
}
