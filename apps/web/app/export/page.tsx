import { bibtexKey, caseTableTeX, caseToBibTeX, shapeTableTeX, sourceToBibTeX, texCorpusComment } from "@bind/core";
import { CORPUS_JSON_FILENAME, corpusExport, corpusExportText, listCases, shapeTableInput } from "@bind/db";
import { CopyButton, DownloadButton } from "@/components/CopyButton";
import { API_URL } from "@/lib/api";
import { pad } from "@/lib/format";

export const metadata = { title: "Export" };

/** The JSON corpus is a few hundred kilobytes. The page shows its head and hands the whole file to the API route. */
const JSON_PREVIEW_LINES = 48;

const previewOf = (text: string) => text.split("\n").slice(0, JSON_PREVIEW_LINES).join("\n") + "\n  …\n";

const kilobytes = (text: string) => `${Math.round(Buffer.byteLength(text, "utf8") / 1024)} KB`;

export default async function Export() {
  const [cases, shapeInput, corpus] = await Promise.all([listCases(), shapeTableInput(), corpusExport()]);
  const header = texCorpusComment(corpus.corpus.version);
  const bib =
    header +
    cases
      .flatMap((c) => [caseToBibTeX(c), ...c.citations.map((s, i) => sourceToBibTeX(s, `${bibtexKey(c.slug)}:src${i + 1}`))])
      .join("\n\n");
  const shapeTex = header + shapeTableTeX(...shapeInput);
  const caseTex =
    header +
    caseTableTeX(
      cases.map((c) => ({
        slug: c.slug,
        corpusRef: c.corpusRef,
        title: c.title,
        shape: c.shapes[0]?.shape.name ?? "",
        resolvability: c.resolvability,
      }))
    );
  const json = corpusExportText(corpus);

  const blocks = [
    { name: "BibTeX", file: "bind.bib", meta: `${pad(cases.length)} cases · ${cases.reduce((n, c) => n + c.citations.length, 0)} sources`, text: bib },
    { name: "Shape Table", file: "shapes.tex", meta: "booktabs · tab:shapes", text: shapeTex },
    { name: "Case Table", file: "cases.tex", meta: "table* · tab:corpus", text: caseTex },
  ];

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">Export</h1>
        <div className="page-side">
          <a className="btn" href={`${API_URL}/openapi.json`}>
            API
          </a>
          <div className="page-stats">
            <div className="page-stat">
              <b>{corpus.corpus.version}</b>
              <span>Corpus</span>
            </div>
            <div className="page-stat">
              <b>{cases.length}</b>
              <span>Published Cases</span>
            </div>
          </div>
        </div>
      </header>
      <div className="exports">
        <section className="export-block" key={CORPUS_JSON_FILENAME}>
          <div>
            <h2>JSON</h2>
            <span className="mono muted" style={{ fontSize: 12 }}>
              {CORPUS_JSON_FILENAME}
            </span>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {corpus.corpus.shapes} shapes · {corpus.corpus.properties} properties · {kilobytes(json)}
            </div>
            <div className="actions">
              <a className="btn" href={`${API_URL}/export/json`} download={CORPUS_JSON_FILENAME}>
                Download
              </a>
            </div>
          </div>
          <pre className="code-block">{previewOf(json)}</pre>
        </section>
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
