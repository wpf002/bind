/** Citation strings and paper export. The corpus generates the tables directly. */

export const REGISTRY_TITLE = "Bind: A Registry of Legal–Architectural Incompatibilities";
export const REGISTRY_BASE = "https://bind.registry/case";

export type CiteCase = {
  slug: string;
  title: string;
  updatedAt: Date | string;
  contributor?: string | null;
};

export function suggestedCitation(c: CiteCase, accessed = new Date()): string {
  const year = new Date(c.updatedAt).getUTCFullYear();
  const author = c.contributor?.trim() || "Bind Registry";
  return `${author}, "${c.title}", ${REGISTRY_TITLE}, case ${c.slug} (${year}). ${REGISTRY_BASE}/${c.slug} (accessed ${iso(accessed)}).`;
}

export function bibtexKey(slug: string): string {
  return `bind:${slug.replace(/^bind-/, "")}`;
}

export function caseToBibTeX(c: CiteCase, accessed = new Date()): string {
  const year = new Date(c.updatedAt).getUTCFullYear();
  return [
    `@misc{${bibtexKey(c.slug)},`,
    `  author       = {${c.contributor?.trim() || "{Bind Registry}"}},`,
    `  title        = {${escapeTex(c.title)}},`,
    `  howpublished = {${escapeTex(REGISTRY_TITLE)}, case ${c.slug}},`,
    `  year         = {${year}},`,
    `  url          = {${REGISTRY_BASE}/${c.slug}},`,
    `  urldate      = {${iso(accessed)}}`,
    `}`,
  ].join("\n");
}

export type SourceCitation = {
  label: string;
  url: string;
  publisher?: string | null;
  retrieved?: Date | string | null;
  verificationStatus: string;
};

export function sourceToBibTeX(s: SourceCitation, key: string): string {
  return [
    `@misc{${key},`,
    `  title        = {${escapeTex(s.label)}},`,
    s.publisher ? `  organization = {${escapeTex(s.publisher)}},` : null,
    `  url          = {${s.url}},`,
    s.retrieved ? `  urldate      = {${iso(new Date(s.retrieved))}}` : `  note         = {unverified}`,
    `}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Shape × case counts as a LaTeX tabular, with one verdict column per auditor in the order given. */
export function shapeTableTeX(
  rows: { ordinal: number; name: string; family: string; cases: number; verdicts: (string | null)[] }[],
  auditors: string[]
): string {
  const body = rows
    .map((r) => {
      const verdicts = auditors.map((_, i) => escapeTex(r.verdicts[i] ?? "--"));
      return `  ${[r.ordinal, escapeTex(r.name), escapeTex(r.family.replace(/_/g, " ")), r.cases, ...verdicts].join(" & ")} \\\\`;
    })
    .join("\n");
  return [
    `\\begin{table*}[t]`,
    `\\centering`,
    `\\caption{Shapes of legal--architectural incompatibility, with case counts and prior-art verdicts by auditor.}`,
    `\\label{tab:shapes}`,
    `\\begin{tabular}{rllr${"l".repeat(auditors.length)}}`,
    `\\toprule`,
    `${["\\#", "Shape", "Family", "Cases", ...auditors.map(escapeTex)].join(" & ")} \\\\`,
    `\\midrule`,
    body,
    `\\bottomrule`,
    `\\end{tabular}`,
    `\\end{table*}`,
  ].join("\n");
}

export function caseTableTeX(
  rows: { slug: string; corpusRef: string; title: string; shape: string; resolvability: string }[]
): string {
  const body = rows
    .map(
      (r) =>
        `  ${r.corpusRef} & ${escapeTex(trunc(r.title, 56))} & ${escapeTex(r.shape)} & ${escapeTex(r.resolvability.replace(/_/g, " "))} \\\\`
    )
    .join("\n");
  return [
    `\\begin{table*}[t]`,
    `\\centering`,
    `\\caption{Corpus of documented incompatibilities.}`,
    `\\label{tab:corpus}`,
    `\\footnotesize`,
    `\\begin{tabular}{llll}`,
    `\\toprule`,
    `Ref & Case & Shape & Resolvability \\\\`,
    `\\midrule`,
    body,
    `\\bottomrule`,
    `\\end{tabular}`,
    `\\end{table*}`,
  ].join("\n");
}

function trunc(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function escapeTex(s: string) {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/–/g, "--")
    .replace(/—/g, "---");
}

/** First line of every BibTeX and LaTeX export: both treat `%` as a comment, so the version travels with the file. */
export const texCorpusComment = (version: string) => `% Bind corpus ${version}\n`;
