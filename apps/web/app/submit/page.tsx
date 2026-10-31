import Link from "next/link";
import { listShapes } from "@bind/db";
import { SubmitForm } from "./SubmitForm";

export const metadata = { title: "Submit" };

export default async function Submit() {
  const shapes = await listShapes();
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
        <SubmitForm shapes={shapes.map((s) => ({ slug: s.slug, name: s.name, ordinal: s.ordinal }))} />
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
