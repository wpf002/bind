import Link from "next/link";
import { FAMILY_LABEL, type ShapeFamily } from "@bind/shared";
import { listShapes } from "@bind/db";
import { Ord, Tip } from "@/components/marks";
import { titleCase } from "@/lib/format";

export const metadata = { title: "Shapes" };

export default async function Shapes() {
  const shapes = await listShapes();
  const published = shapes.reduce((n, s) => n + s.published, 0);
  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">Shapes</h1>
        <div className="page-stats">
          <div className="page-stat">
            <b>{shapes.length}</b>
            <span>Shapes</span>
          </div>
          <div className="page-stat">
            <b>{published}</b>
            <span>Cases</span>
          </div>
          <div className="page-stat">
            <b>{shapes.filter((s) => s.audit).length}</b>
            <span>
              Audited
              <Tip text="Each shape is checked against prior art. A rebrand verdict means the shape already exists under another name." />
            </span>
          </div>
        </div>
      </header>
      <div>
        {shapes.map((s) => (
          <Link key={s.slug} href={`/shapes/${s.slug}`} className="taxon">
            <Ord n={s.ordinal} lg />
            <div>
              <h2 className="taxon-name">{s.name}</h2>
              <p className="taxon-def">{s.definition}</p>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div className="taxon-family">
                <span className="chip chip-plain">{FAMILY_LABEL[s.family as ShapeFamily]}</span>
                <span className={`chip ${s.audit ? (s.audit.verdict === "novel" ? "chip-ok" : s.audit.verdict === "rebrand" ? "chip-accent" : "chip-warn") : "chip-plain"}`}>
                  {s.audit ? titleCase(s.audit.verdict) : "Unaudited"}
                </span>
              </div>
              <p className="taxon-bound">{s.boundaryCriteria}</p>
            </div>
            <div className="taxon-side">
              <div className="taxon-count">
                {s.published}
                {s.total > s.published ? <small>+{s.total - s.published} held</small> : null}
              </div>
              <div className="cells" aria-label={`${s.total} cases`}>
                {s.cases.map((c) => (
                  <span
                    key={c.slug}
                    className={`cell cell-${c.resolvability}${c.status === "published" ? "" : " cell-held"}`}
                    title={c.status === "published" ? `${c.slug} ${c.title}` : "Held at gate"}
                  />
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
