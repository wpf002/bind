import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listCases } from "../src/queries";
import { prisma } from "../src/client";

/**
 * Phase 1 gate: the DB, rendered back to markdown, must carry every sentence of
 * PARADOX-CORPUS.md. Checks the case ID set, titles, and per-sentence content.
 * "Legal:" lines are checked against the case's instruments, since the schema
 * stores them as structured rows. Exits 1 on any mismatch.
 */
const root = join(import.meta.dirname, "../../..");

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/⚠/g, " ")
    .replace(/[*_`]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”"]/g, "")
    .replace(/[^a-z0-9'§./]+/g, " ")
    .replace(/\s*[.]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type SourceCase = { ref: string; title: string; legal: string[]; sentences: string[] };

function parseSource(md: string): SourceCase[] {
  const body = md.split(/^## What the corpus actually shows/m)[0]!;
  const blocks = body.split(/^### /m).slice(1);
  return blocks.map((b) => {
    const lines = b.split("\n");
    let head = lines.shift()!;
    // Wrapped headings continue on an indented line (E4).
    while (lines[0] && /^\s{2}\S/.test(lines[0]) && !lines[0].trim().startsWith("-")) head += " " + lines.shift()!.trim();
    const m = head.match(/^([A-H]\d)\.\s+(.*)$/)!;
    const text = lines.join("\n").split(/^---$/m)[0]!.split(/^## /m)[0]!;
    const bullets = text.split(/^- /m).slice(1).map((x) => x.replace(/\s+/g, " ").trim());
    const legal: string[] = [];
    const sentences: string[] = [];
    for (const bl of bullets) {
      const lab = bl.match(/^\*\*([^*]+?):?\*\*:?\s*/);
      const label = lab?.[1]?.replace(/:$/, "") ?? "";
      const rest = lab ? bl.slice(lab[0].length) : bl;
      if (/^Legal/.test(label)) {
        legal.push(rest);
        continue;
      }
      for (const s of rest.split(/(?<=[.?!])\s+(?=[A-Z(“"])|;\s+/)) if (norm(s)) sentences.push(s.trim());
    }
    return { ref: m[1]!, title: m[2]!.replace(/\s*⚠\s*$/, "").trim(), legal, sentences };
  });
}

type DbCase = Awaited<ReturnType<typeof listCases>>[number];

/** Renders one case in the source's bullet format. Written to corpus/roundtrip.md for human diffing. */
function render(c: DbCase) {
  const prop = c.properties[0]?.property;
  const out = [`### ${c.corpusRef}. ${c.title}`];
  out.push(`- **Legal:** ${c.instruments.map((i) => `${i.instrument.shortName} ${i.instrument.provision}${i.note ? ` (${i.note})` : ""}`).join("; ")}`);
  if (prop) out.push(`- **Architectural:** ${prop.threatModel}${prop.defeatNote ? ` ${prop.defeatNote}` : ""}`);
  out.push(`- **Incompatibility:** ${c.statement}`);
  if (c.paperingOvers.length)
    out.push(`- **Current papering-over:** ${c.paperingOvers.map((p) => `${p.technique}: ${p.description}${p.residual ? ` ${p.residual}` : ""}`).join(" ")}`);
  if (c.analysis) out.push(`- **Note:** ${c.analysis.replace(/\n+/g, " ")}`);
  out.push(`- **Resolvable?** ${c.resolvability}${c.inclusionReasoning ? `. ${c.inclusionReasoning}` : ""}`);
  const notes = c.citations.filter((s) => s.verificationNote && !s.verificationNote.startsWith("Source states")).map((s) => `${s.label}: ${s.verificationNote}`);
  if (notes.length) out.push(`- **Sources:** ${notes.join(" ")}`);
  return out.join("\n");
}

async function main() {
  const src = parseSource(await readFile(join(root, "PARADOX-CORPUS.md"), "utf8"));
  const db = (await listCases({ limit: 500 }, { includeDrafts: true })).filter((c) => src.some((s) => s.ref === c.corpusRef));
  const errors: string[] = [];

  const srcRefs = src.map((s) => s.ref).join(" ");
  const dbRefs = db.map((c) => c.corpusRef).join(" ");
  if (srcRefs !== dbRefs) errors.push(`ID set differs\n  source: ${srcRefs}\n  db:     ${dbRefs}`);

  let total = 0;
  for (const s of src) {
    const c = db.find((x) => x.corpusRef === s.ref);
    if (!c) continue;
    if (norm(c.title) !== norm(s.title)) errors.push(`${s.ref} title\n  source: ${s.title}\n  db:     ${c.title}`);
    if (s.legal.length && !c.instruments.length) errors.push(`${s.ref} has a Legal line but no instruments`);
    const hay = norm(render(c) + " " + c.citations.map((x) => `${x.label} ${x.verificationNote ?? ""}`).join(" "));
    for (const sent of s.sentences) {
      total++;
      if (!hay.includes(norm(sent))) errors.push(`${s.ref} missing: ${sent}`);
    }
  }

  await writeFile(join(root, "corpus/roundtrip.md"), db.map(render).join("\n\n") + "\n");
  console.log(`${src.length} source cases, ${db.length} in db, ${total} sentences checked, ${errors.length} mismatches`);
  for (const e of errors) console.log("✗ " + e);
  process.exitCode = errors.length ? 1 : 0;
}

main().finally(() => prisma.$disconnect());
