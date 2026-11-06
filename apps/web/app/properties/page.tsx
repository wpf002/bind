import Link from "next/link";
import { listProperties } from "@bind/db";
import { Jur, Ord, Tip } from "@/components/marks";

export const metadata = { title: "Properties" };

export default async function Properties() {
  const properties = await listProperties();
  const cases = new Set(properties.flatMap((p) => p.caseRows.map((c) => c.slug)));
  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">
          Properties
          <Tip text="The architectural property a system is built around. Each case is reached from at least one." />
        </h1>
        <div className="page-stats">
          <div className="page-stat">
            <b>{properties.length}</b>
            <span>Properties</span>
          </div>
          <div className="page-stat">
            <b>{cases.size}</b>
            <span>Cases</span>
          </div>
          <div className="page-stat">
            <b>{properties.filter((p) => p.resolved).length}</b>
            <span>
              With A Resolution
              <Tip text="At least one case under this property has stopped being live." />
            </span>
          </div>
        </div>
      </header>
      <div>
        {properties.map((p) => (
          <Link key={p.slug} href={`/properties/${p.slug}`} className="taxon taxon-prop">
            <div>
              <h2 className="taxon-name">{p.name}</h2>
              <p className="taxon-def">{p.threatModel}</p>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div className="taxon-family" style={{ flexWrap: "wrap" }}>
                {p.shapes.map((s) => (
                  <span key={s.slug} className="shape-tag">
                    <Ord n={s.ordinal} />
                    {s.name}
                  </span>
                ))}
                {p.resolved ? <span className="chip chip-ok">Resolved</span> : null}
              </div>
              <div className="jurs">
                {p.jurisdictions.map((j) => (
                  <Jur key={j} code={j} />
                ))}
              </div>
            </div>
            <div className="taxon-side">
              <div className="taxon-count">{p.cases}</div>
              <div className="cells" aria-label={`${p.cases} cases`}>
                {p.caseRows.map((c) => (
                  <span key={c.slug} className={`cell cell-${c.resolvability}`} title={`${c.slug} ${c.title}`} />
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
