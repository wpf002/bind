import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { caseTableTeX, caseToBibTeX, shapeTableTeX, sourceToBibTeX, bibtexKey } from "@bind/core";
import { listCases, listShapes, shapeTableInput } from "../src/queries";
import { prisma } from "../src/client";

/** Writes the corpus back to markdown and generates the paper's tables. Published cases only. */
const root = join(import.meta.dirname, "../../..");

async function main() {
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

  await mkdir(join(root, "docs/paper"), { recursive: true });
  await writeFile(
    join(root, "docs/paper/shapes.tex"),
    shapeTableTeX(...(await shapeTableInput()))
  );
  await writeFile(
    join(root, "docs/paper/cases.tex"),
    caseTableTeX(cases.map((c) => ({ slug: c.slug, corpusRef: c.corpusRef, title: c.title, shape: c.shapes[0]?.shape.name ?? "", resolvability: c.resolvability })))
  );
  const bib = cases.flatMap((c) => [
    caseToBibTeX(c),
    ...c.citations.map((s, i) => sourceToBibTeX(s, `${bibtexKey(c.slug)}:src${i + 1}`)),
  ]);
  await writeFile(join(root, "docs/paper/bind.bib"), bib.join("\n\n") + "\n");
  console.log(`exported ${cases.length} cases, ${shapes.length} shapes`);
}

main().finally(() => prisma.$disconnect());
