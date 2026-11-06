import Link from "next/link";
import { DEFAULT_CASE_SORT, parseCaseSort, sortCases, type CaseSort } from "@bind/core";
import { RESOLVABILITY } from "@bind/shared";
import { listCases, listJurisdictions, listShapes, stats } from "@bind/db";
import { Jur, Ord, Res, ShapeTag, Tip } from "@/components/marks";
import { pad, resLabel, withParam } from "@/lib/format";

type Params = { shape?: string; jurisdiction?: string; resolvability?: string; q?: string; sort?: string };

const SORT_COLUMNS: { sort: CaseSort; label: string; className?: string }[] = [
  { sort: "id", label: "ID", className: "col-id" },
  { sort: "title", label: "Case" },
  { sort: "shape", label: "Shape", className: "col-shape" },
];

export default async function Index({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const resolvability = RESOLVABILITY.find((r) => r === p.resolvability);
  const sort = parseCaseSort(p.sort);
  const [matched, all, shapes, jurs, s] = await Promise.all([
    listCases({ shape: p.shape, jurisdiction: p.jurisdiction, resolvability, q: p.q }),
    listCases(),
    listShapes(),
    listJurisdictions(),
    stats(),
  ]);

  const cases = sortCases(matched, sort, (c) => ({
    sortKey: c.sortKey,
    title: c.title,
    shapeOrdinal: c.shapes[0]?.shape.ordinal ?? null,
    sourceCount: c.citations.length,
  }));
  const active = Object.entries(p).filter(([k, v]) => v && k !== "sort") as [keyof Params, string][];
  const sortHref = (key: CaseSort) => withParam({ ...p, sort: sort === DEFAULT_CASE_SORT ? undefined : sort }, "sort", key === DEFAULT_CASE_SORT ? undefined : key);
  const sortLink = (key: CaseSort, label: string) => (
    <Link href={sortHref(key)} aria-current={sort === key ? "true" : undefined}>
      {label}
    </Link>
  );
  const shapeName = (slug: string) => shapes.find((x) => x.slug === slug)?.name ?? slug;
  const ticks = Array.from({ length: s.gate }, (_, i) => (i < s.published ? "on" : i < s.total ? "held" : ""));
  const dist = RESOLVABILITY.map((r) => [r, s.byResolvability[r] ?? 0] as const);
  const resolvedOther = s.resolvedBy.legislative + s.resolvedBy.judicial + s.resolvedBy.abandonment;

  return (
    <div className="wrap index">
      <aside className="rail" aria-label="Filters">
        <div className="rail-group">
          <div className="eyebrow">
            Shape {p.shape ? <Link href={withParam(p, "shape")}>Clear</Link> : null}
          </div>
          {shapes.map((sh) => (
            <Link
              key={sh.slug}
              className={`facet${sh.published ? "" : " facet-dim"}`}
              href={withParam(p, "shape", sh.slug)}
              aria-current={p.shape === sh.slug}
            >
              <Ord n={sh.ordinal} />
              <span>{sh.name}</span>
              <span className="facet-n">{sh.published}</span>
            </Link>
          ))}
        </div>
        <div className="rail-group">
          <div className="eyebrow">
            Jurisdiction {p.jurisdiction ? <Link href={withParam(p, "jurisdiction")}>Clear</Link> : null}
          </div>
          <div className="jur-grid">
            {jurs.map((j) => (
              <Link
                key={j.code}
                className={`facet${j.cases ? "" : " facet-dim"}`}
                href={withParam(p, "jurisdiction", j.code)}
                aria-current={p.jurisdiction?.toUpperCase() === j.code}
                title={j.name}
              >
                <span className="jur">{j.code}</span>
                <span />
                <span className="facet-n">{j.cases}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rail-group">
          <div className="eyebrow">
            Resolvability {p.resolvability ? <Link href={withParam(p, "resolvability")}>Clear</Link> : null}
          </div>
          {dist.map(([r, n]) => (
            <Link key={r} className="facet" href={withParam(p, "resolvability", r)} aria-current={p.resolvability === r}>
              <Res r={r} short />
              <span>{resLabel(r)}</span>
              <span className="facet-n">{n}</span>
            </Link>
          ))}
        </div>
      </aside>

      <section>
        <div className="findings">
          <div className="finding">
            <span className="finding-n">{s.resolvedBy.engineering}</span>
            <span className="finding-label">Resolved By Engineering</span>
            <span className="finding-sub">
              <Link href="/resolutions">{resolvedOther} by other means</Link> · {s.published} published
            </span>
          </div>
          <div className="gauges">
            <div>
              <div className="gauge-head">
                <span className="eyebrow">
                  Publication Gate
                  <Tip text={`Taxonomy publishes at ${s.gate} verified cases. Hatched ticks are held for unverified citations.`} />
                </span>
                <b>
                  {s.published}/{s.gate}
                  <span className="muted"> · {s.held} held</span>
                </b>
              </div>
              <div className="ticks" role="img" aria-label={`${s.published} of ${s.gate} published, ${s.held} held`}>
                {ticks.map((t, i) => (
                  <span key={i} className={t ? `tick tick-${t}` : "tick"} />
                ))}
              </div>
              <div className="tick-scale">
                <span>0</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
                <span>40</span>
              </div>
            </div>
            <div>
              <div className="dist" role="img" aria-label="Resolvability distribution">
                {dist.map(([r, n]) => (n ? <span key={r} className={`dist-${r}`} style={{ flex: n }} /> : null))}
              </div>
              <div className="legend">
                {dist.map(([r, n]) => (
                  <span key={r}>
                    <Res r={r} /> <span className="mono muted">{n}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <form className="toolbar" action="/" role="search">
          {active
            .filter(([k]) => k !== "q")
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          {sort !== DEFAULT_CASE_SORT ? <input type="hidden" name="sort" value={sort} /> : null}
          <label className="search">
            <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden>
              <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 8l3 3" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <span className="sr">Search</span>
            <input name="q" defaultValue={p.q} placeholder="Title, provision, case ID" />
          </label>
          <div className="active-filters">
            {active.map(([k, v]) => (
              <Link key={k} href={withParam(p, k)} className="chip chip-plain">
                {k === "shape" ? shapeName(v) : k === "resolvability" ? resLabel(v) : v} ×
              </Link>
            ))}
          </div>
          <span className="result-count">
            {pad(cases.length)} / {pad(all.length)}
          </span>
        </form>

        {cases.length ? (
          <table className="log">
            <thead>
              <tr>
                {SORT_COLUMNS.map((col) => (
                  <th key={col.sort} className={col.className} aria-sort={sort === col.sort ? "ascending" : undefined}>
                    {sortLink(col.sort, col.label)}
                  </th>
                ))}
                <th className="col-jur">Juris.</th>
                <th className="col-res">Resolvability</th>
                <th aria-sort={sort === "sources" ? "descending" : undefined}>{sortLink("sources", "Src")}</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const primary = c.shapes[0]?.shape;
                return (
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
                    <td>{primary ? <ShapeTag shape={primary} /> : null}</td>
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
                          Resolved
                        </div>
                      ) : null}
                      {c.changedSources ? (
                        <div className="chip chip-accent" style={{ marginTop: 6 }}>
                          Source Changed
                        </div>
                      ) : null}
                    </td>
                    <td className="c-src mono muted">{c.citations.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty">No Published Cases Match</div>
        )}
        {s.held ? (
          <div className="held-note">
            <span className="tick tick-held" style={{ width: 14, height: 14, display: "inline-block" }} />
            {s.held} cases held at the citation gate. Not listed until every source is verified.
          </div>
        ) : null}
      </section>
    </div>
  );
}
