import Link from "next/link";
import { listJurisdictions, listProperties } from "@bind/db";
import { SubmitForm } from "./SubmitForm";

export const metadata = { title: "Submit" };

export default async function Submit() {
  const [properties, jurisdictions] = await Promise.all([listProperties(), listJurisdictions()]);
  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">Submit</h1>
        <div className="page-stats">
          <div className="page-stat">
            <b>2</b>
            <span>Reviewers</span>
          </div>
          <div className="page-stat">
            <b>5</b>
            <span>Criteria</span>
          </div>
        </div>
      </header>
      <div className="submit">
        <SubmitForm
          properties={properties.map((p) => ({ slug: p.slug, name: p.name }))}
          jurisdictions={jurisdictions.map((j) => ({ code: j.code, name: j.name }))}
        />
        <aside className="aside">
          <div className="panel">
            <div className="panel-h">
              <span className="eyebrow">Review</span>
            </div>
            <ol className="panel-b timeline" style={{ paddingBottom: 0 }}>
              <li>
                <time>01</time>
                <span className="node" />
                <span>Two independent reviewers run the inclusion test</span>
              </li>
              <li>
                <time>02</time>
                <span className="node" />
                <span>Every cited provision checked at its primary source</span>
              </li>
              <li>
                <time>03</time>
                <span className="node node-accent" />
                <span>
                  Published with attribution, or logged in <Link href="/rejections">Rejections</Link>
                </span>
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
