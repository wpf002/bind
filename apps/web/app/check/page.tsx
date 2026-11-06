import Link from "next/link";
import { checkHref, checkQuerySchema, resolveCheckSelection, runCheck, toggleCheck, type CheckSelection } from "@bind/core";
import { listCheckCases, listJurisdictions, listProperties } from "@bind/db";
import { Jur, Ord, Res, Tip } from "@/components/marks";
import { titleCase } from "@/lib/format";

export const metadata = { title: "Check" };

type Params = Record<string, string | string[] | undefined>;

export default async function Check({ searchParams }: { searchParams: Promise<Params> }) {
  const [params, cases, properties, allJurisdictions] = await Promise.all([searchParams, listCheckCases(), listProperties(), listJurisdictions()]);
  const jurisdictions = allJurisdictions.filter((j) => j.cases > 0);
  const query = checkQuerySchema.safeParse(params);
  const selection = resolveCheckSelection(query.success ? query.data : { p: [], j: [] }, {
    properties: properties.map((p) => p.slug),
    jurisdictions: jurisdictions.map((j) => j.code),
  });
  const groups = runCheck(cases, selection);
  const count = groups.reduce((n, g) => n + g.cases.length, 0);
  const picked = selection.properties.length + selection.jurisdictions.length;
  const propertyName = (slug: string) => properties.find((p) => p.slug === slug)?.name ?? slug;
  const clear = (dimension: keyof CheckSelection) => checkHref({ ...selection, [dimension]: [] });

  return (
    <div className="wrap index">
      <aside className="rail" aria-label="Selection">
        <div className="rail-group">
          <div className="eyebrow">
            Properties {selection.properties.length ? <Link href={clear("properties")}>Clear</Link> : null}
          </div>
          {properties.map((p) => (
            <Link
              key={p.slug}
              className={`facet${p.cases ? "" : " facet-dim"}`}
              href={checkHref(toggleCheck(selection, "properties", p.slug))}
              aria-current={selection.properties.includes(p.slug)}
            >
              <span className="pick" aria-hidden />
              <span>{p.name}</span>
              <span className="facet-n">{p.cases}</span>
            </Link>
          ))}
        </div>
        <div className="rail-group">
          <div className="eyebrow">
            Jurisdictions {selection.jurisdictions.length ? <Link href={clear("jurisdictions")}>Clear</Link> : null}
          </div>
          <div className="jur-grid">
            {jurisdictions.map((j) => (
              <Link
                key={j.code}
                className="facet"
                href={checkHref(toggleCheck(selection, "jurisdictions", j.code))}
                aria-current={selection.jurisdictions.includes(j.code)}
                title={j.name}
              >
                <span className="jur">{j.code}</span>
                <span />
                <span className="facet-n">{j.cases}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      <section>
        <header className="page-head">
          <h1 className="page-title">
            Check
            <Tip text="Pick the properties a design relies on and the jurisdictions it runs in. Every published case that hits one of each is listed under its shape." />
          </h1>
          <div className="page-stats">
            <div className="page-stat">
              <b>{count}</b>
              <span>Cases</span>
            </div>
            <div className="page-stat">
              <b>{groups.length}</b>
              <span>Shapes</span>
            </div>
          </div>
        </header>

        {picked ? (
          <div className="active-filters check-picked">
            {selection.properties.map((slug) => (
              <Link key={slug} href={checkHref(toggleCheck(selection, "properties", slug))} className="chip chip-plain">
                {propertyName(slug)} ×
              </Link>
            ))}
            {selection.jurisdictions.map((code) => (
              <Link key={code} href={checkHref(toggleCheck(selection, "jurisdictions", code))} className="chip chip-plain">
                {code} ×
              </Link>
            ))}
            <Link href="/check" className="sect-link">
              Clear All
            </Link>
          </div>
        ) : null}

        {groups.length ? (
          groups.map((g) => (
            <section key={g.shape?.slug ?? "none"} className="check-shape">
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
          <div className="empty">No Matching Cases</div>
        )}
      </section>
    </div>
  );
}
