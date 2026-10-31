import Link from "next/link";
import { listCases, listJurisdictions, listShapes } from "@bind/db";
import { Ord, Res, Tip } from "@/components/marks";

export const metadata = { title: "Matrix" };

export default async function Matrix() {
  const [cases, shapes, jurs] = await Promise.all([listCases(), listShapes(), listJurisdictions()]);
  const cols = jurs.filter((j) => j.cases > 0);
  const cell = (shape: string, code: string) =>
    cases.filter((c) => c.shapes[0]?.shape.slug === shape && c.jurisdictions.includes(code));

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">
          Matrix
          <Tip text="Primary shape by jurisdiction. A case citing instruments from two jurisdictions appears in both columns." />
        </h1>
        <div className="legend">
          <Res r="unresolvable" />
          <Res r="resolvable_costly" />
          <Res r="tech_gap" />
        </div>
      </header>
      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th>Shape</th>
              {cols.map((j) => (
                <th key={j.code}>
                  <Link href={`/?jurisdiction=${j.code}`}>{j.code}</Link>
                  <small>{j.name}</small>
                </th>
              ))}
              <th className="total">Σ</th>
            </tr>
          </thead>
          <tbody>
            {shapes.map((s) => (
              <tr key={s.slug}>
                <th>
                  <Link className="shape-tag" href={`/shapes/${s.slug}`}>
                    <Ord n={s.ordinal} />
                    {s.name}
                  </Link>
                </th>
                {cols.map((j) => {
                  const hits = cell(s.slug, j.code);
                  return (
                    <td key={j.code} className={hits.length ? "" : "zero"}>
                      <div className="mx-pills">
                        {hits.map((c) => (
                          <Link key={c.slug} className={`mx-pill res-${c.resolvability}`} href={`/case/${c.slug}`} title={c.title}>
                            <span className="res-glyph" aria-hidden />
                            {c.corpusRef}
                          </Link>
                        ))}
                      </div>
                    </td>
                  );
                })}
                <td className="total">{s.published}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>Σ</th>
              {cols.map((j) => (
                <td key={j.code}>{j.cases}</td>
              ))}
              <td className="total">{cases.length}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
