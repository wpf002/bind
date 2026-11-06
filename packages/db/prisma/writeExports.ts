import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { caseTableTeX, caseToBibTeX, shapeTableTeX, sourceToBibTeX, bibtexKey, texCorpusComment } from "@bind/core";
import { listCases, listShapes, shapeTableInput } from "../src/queries";
import { CORPUS_JSON_FILENAME, corpusExport, corpusExportText } from "../src/export";
import { currentRelease } from "../src/releases";

/** Writes the corpus back to markdown and JSON and generates the paper's tables. Published cases only. */
const root = join(import.meta.dirname, "../../..");

/** Every file `pnpm export` writes, stamped with the current release. The release command calls it after a bump. */
export async function writeExports(): Promise<{ cases: number; shapes: number; version: string }> {
  const release = await currentRelease();
  const header = texCorpusComment(release.version);

  const cases = await listCases({ limit: 200 });
  const shapes = await listShapes();

  await mkdir(join(root, "corpus/cases"), { recursive: true });
  for (const c of cases) {
    const shape = c.shapes[0]?.shape;
    const md = [
      "---",
      `id: ${c.slug}`,
      `ref: ${c.corpusRef}`,
      `shape: ${shape?.slug ?? ""}`,
      `resolvability: ${c.resolvability}`,
      `resolution: ${c.resolution}`,
      `jurisdictions: [${c.jurisdictions.join(", ")}]`,
      "---",
      "",
      `# ${c.title}`,
      "",
      c.statement,
      "",
      "## Instruments",
      ...c.instruments.map((i) => `- ${i.role}: ${i.instrument.shortName} ${i.instrument.provision} (${i.instrument.sourceUrl})`),
      "",
      "## Analysis",
      c.analysis ?? "",
      "",
      "## Inclusion",
      c.inclusionReasoning ?? "",
      "",
      "## Sources",
      ...c.citations.map((s) => `- [${s.verificationStatus}] ${s.label} <${s.url}>${s.secondUrl ? ` <${s.secondUrl}>` : ""}`),
      "",
    ].join("\n");
    await writeFile(join(root, "corpus/cases", `${c.slug}.md`), md);
  }

  await writeFile(join(root, "corpus", CORPUS_JSON_FILENAME), corpusExportText(await corpusExport({ release })));

  await mkdir(join(root, "docs/paper"), { recursive: true });
  await writeFile(
    join(root, "docs/paper/shapes.tex"),
    header + shapeTableTeX(...(await shapeTableInput()))
  );
  await writeFile(
    join(root, "docs/paper/cases.tex"),
    header + caseTableTeX(cases.map((c) => ({ slug: c.slug, corpusRef: c.corpusRef, title: c.title, shape: c.shapes[0]?.shape.name ?? "", resolvability: c.resolvability })))
  );
  const bib = cases.flatMap((c) => [
    caseToBibTeX(c),
    ...c.citations.map((s, i) => sourceToBibTeX(s, `${bibtexKey(c.slug)}:src${i + 1}`)),
  ]);
  await writeFile(join(root, "docs/paper/bind.bib"), header + bib.join("\n\n") + "\n");
  return { cases: cases.length, shapes: shapes.length, version: release.version };
}
