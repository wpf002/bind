import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty } from "@bind/db";
import { Jur, Ord, Res, ShapeTag } from "@/components/marks";
import { titleCase } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const p = await getProperty((await params).slug);
  return { title: p?.name ?? "Not Found" };
}

export default async function PropertyPage({ params }: Props) {
  const p = await getProperty((await params).slug);
  if (!p) notFound();
  const resolvedCases = p.groups.reduce((n, g) => n + g.cases.filter((c) => c.resolution !== "none").length, 0);

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/properties">Properties</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <header className="shape-hero">
        <div className="shape-main">
          <div className="case-meta">
            <span className="eyebrow">Property</span>
            {p.resolved ? <span className="chip chip-ok">Resolved</span> : null}
          </div>
          <h1 className="case-title">{p.name}</h1>
          <p className="shape-def">{p.threatModel}</p>
          <dl className="kv">
            <dt>If Abandoned</dt>
            <dd>{p.defeatNote}</dd>
            {p.exemplars.length ? (
              <>
                <dt>Relied On By</dt>
                <dd>{p.exemplars.join(" · ")}</dd>
              </>
            ) : null}
          </dl>
        </div>
        <aside className="verdict">
          <span className="eyebrow">Cases</span>
          <span className="verdict-v">{p.cases}</span>
          <dl className="kv" style={{ gridTemplateColumns: "88px 1fr" }}>
            <dt>Shapes</dt>
            <dd>
              <div className="jurs">
                {p.shapes.map((s) => (
                  <ShapeTag key={s.slug} shape={s} />
                ))}
              </div>
            </dd>
            <dt>Jurisdictions</dt>
            <dd>
              <div className="jurs">
                {p.jurisdictions.map((j) => (
                  <Jur key={j} code={j} link />
                ))}
              </div>
            </dd>
            <dt>Resolved</dt>
            <dd className="mono">{resolvedCases}</dd>
          </dl>
        </aside>
      </header>

      {p.groups.length ? (
        p.groups.map((g) => (
          <section key={g.shape?.slug ?? "none"} style={{ marginBottom: 48 }}>
            <div className="sect-h">
              {g.shape ? <Ord n={g.shape.ordinal} /> : null}
              <h2>{g.shape ? <Link href={`/shapes/${g.shape.slug}`}>{g.shape.name}</Link> : "No Shape"}</h2>
              <span className="n">{g.cases.length}</span>
            </div>
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
                {g.cases.map((c) => (
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
                      <div className="row-statement">{c.note ?? c.statement}</div>
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
          </section>
        ))
      ) : (
        <div className="empty">No Published Cases</div>
      )}
    </div>
  );
}
