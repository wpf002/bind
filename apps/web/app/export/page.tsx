import { bibtexKey, caseTableTeX, caseToBibTeX, shapeTableTeX, sourceToBibTeX } from "@bind/core";
import { listCases, listShapes } from "@bind/db";
import { CopyButton, DownloadButton } from "@/components/CopyButton";
import { pad } from "@/lib/format";

export const metadata = { title: "Export" };

export default async function Export() {
  const [cases, shapes] = await Promise.all([listCases(), listShapes()]);
  const bib = cases
    .flatMap((c) => [caseToBibTeX(c), ...c.citations.map((s, i) => sourceToBibTeX(s, `${bibtexKey(c.slug)}:src${i + 1}`))])
    .join("\n\n");
  const shapeTex = shapeTableTeX(
    shapes.map((s) => ({ ordinal: s.ordinal, name: s.name, family: s.family, cases: s.published, verdict: s.audit?.verdict }))
  );
  const caseTex = caseTableTeX(
    cases.map((c) => ({
      slug: c.slug,
      corpusRef: c.corpusRef,
      title: c.title,
      shape: c.shapes[0]?.shape.name ?? "",
      resolvability: c.resolvability,
    }))
  );

  const blocks = [
    { name: "BibTeX", file: "bind.bib", meta: `${pad(cases.length)} cases · ${cases.reduce((n, c) => n + c.citations.length, 0)} sources`, text: bib },
    { name: "Shape Table", file: "shapes.tex", meta: "booktabs · tab:shapes", text: shapeTex },
    { name: "Case Table", file: "cases.tex", meta: "table* · tab:corpus", text: caseTex },
  ];

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">Export</h1>
        <div className="page-stats">
          <div className="page-stat">
            <b>{cases.length}</b>
            <span>Published Cases</span>
          </div>
        </div>
      </header>
      <div className="exports">
        {blocks.map((b) => (
          <section className="export-block" key={b.file}>
            <div>
              <h2>{b.name}</h2>
              <span className="mono muted" style={{ fontSize: 12 }}>
                {b.file}
              </span>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {b.meta}
              </div>
              <div className="actions">
                <CopyButton text={b.text} />
                <DownloadButton text={b.text} filename={b.file} />
              </div>
            </div>
            <pre className="code-block">{b.text}</pre>
          </section>
        ))}
      </div>
    </div>
  );
}
