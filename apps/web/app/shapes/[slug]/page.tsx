import Link from "next/link";
import { notFound } from "next/navigation";
import { FAMILY_LABEL, type ShapeFamily } from "@bind/shared";
import { getShape } from "@bind/db";
import { Jur, Ord, Res } from "@/components/marks";
import { fmtDate, titleCase } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const s = await getShape((await params).slug);
  return { title: s?.name ?? "Not Found" };
}

export default async function ShapePage({ params }: Props) {
  const s = await getShape((await params).slug);
  if (!s) notFound();
  const cases = s.cases.filter((c) => c.status === "published");
  const held = s.cases.length - cases.length;
  const audit = s.audits[0];

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/shapes">Shapes</Link>
        <span>/</span>
        <span>{s.name}</span>
      </nav>
      <header className="shape-hero">
        <div className="shape-main">
          <div className="case-meta">
            <Ord n={s.ordinal} lg />
            <span className="chip chip-plain">{FAMILY_LABEL[s.family as ShapeFamily]}</span>
            <span className="id muted">Taxonomy {s.taxonomyVersion}</span>
          </div>
          <h1 className="case-title">{s.name}</h1>
          <p className="shape-def">{s.definition}</p>
          <dl className="kv">
            <dt>Boundary</dt>
            <dd>{s.boundaryCriteria}</dd>
            {s.provenanceNote ? (
              <>
                <dt>Provenance</dt>
                <dd>{s.provenanceNote}</dd>
              </>
            ) : null}
          </dl>
        </div>
        <aside className={`verdict verdict-${audit?.verdict ?? "none"}`}>
          <span className="eyebrow">Prior-Art Audit</span>
          <span className="verdict-v">{audit ? audit.verdict : "Pending"}</span>
          {audit ? (
            <>
              <span className="verdict-run">
                {fmtDate(audit.runAt)} · {audit.model} · prompt {audit.promptVersion}
              </span>
              <details className="verdict-more">
                <summary>Reasoning</summary>
                <p>{audit.reasoning}</p>
                {audit.priorArt ? <p className="muted">Prior art: {audit.priorArt}</p> : null}
              </details>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 14 }}>Not yet run.</p>
          )}
        </aside>
      </header>

      <div className="sect-h">
        <h2>Cases</h2>
        <span className="n">
          {cases.length}
          {held ? ` · ${held} held` : ""}
        </span>
      </div>
      {cases.length ? (
        <table className="log">
          <thead>
            <tr>
              <th className="col-id">ID</th>
              <th>Case</th>
              <th className="col-jur">Juris.</th>
              <th className="col-res">Resolvability</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
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
                  <div className="row-statement">{c.statement}</div>
                </td>
                <td>
                  <div className="jurs">
                    {c.jurisdictions.map((j) => (
                      <Jur key={j} code={j} />
                    ))}
                  </div>
                </td>
                <td>
                  <Res r={c.resolvability} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty">No Published Cases{held ? ` · ${held} Held At Gate` : ""}</div>
      )}
      {audit && s.audits.length > 1 ? (
        <section style={{ marginTop: 48 }}>
          <div className="sect-h">
            <h2>Audit Log</h2>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Run</th>
                <th>Verdict</th>
                <th>Model</th>
              </tr>
            </thead>
            <tbody>
              {s.audits.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{fmtDate(a.runAt)}</td>
                  <td>{titleCase(a.verdict)}</td>
                  <td className="mono">{a.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
