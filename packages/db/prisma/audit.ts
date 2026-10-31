import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "../src/client";

/**
 * Phase 4: adversarial prior-art audit of a shape, run by a non-Claude model.
 * Talks to any OpenAI-compatible chat endpoint (OpenAI, OpenRouter, Mistral, Ollama, Flint).
 *
 *   AUDIT_API_BASE  e.g. https://api.openai.com/v1
 *   AUDIT_API_KEY   set it yourself; never committed
 *   AUDIT_MODEL     e.g. gpt-5, mistral-large-latest
 *
 *   pnpm --filter @bind/db prior-art deliberate-blindness
 *   pnpm --filter @bind/db prior-art --all
 *   pnpm --filter @bind/db prior-art deliberate-blindness --dry-run   (prints the prompt, calls nothing)
 */
const root = join(import.meta.dirname, "../../..");
const PROMPT = join(root, "docs/prompts/ADVERSARIAL_PRIOR_ART_PROMPT.md");
const VERDICTS = ["novel", "partial", "rebrand", "inconclusive"] as const;
type Verdict = (typeof VERDICTS)[number];

async function loadPrompt() {
  const raw = await readFile(PROMPT, "utf8");
  const version = raw.match(/<!-- version: (\S+) -->/)?.[1];
  if (!version) throw new Error("prompt file has no version line");
  return { template: raw.replace(/<!--[\s\S]*?-->\n?/g, "").trim(), promptVersion: `ADVERSARIAL_PRIOR_ART_PROMPT.md@${version}` };
}

async function buildPrompt(slug: string, template: string) {
  const shape = await prisma.shape.findUnique({
    where: { slug },
    include: { assignments: { where: { supersededAt: null }, include: { case: true } } },
  });
  if (!shape) throw new Error(`no shape ${slug}`);
  const cases = shape.assignments
    .map((a) => a.case)
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((c) => `- ${c.corpusRef}. ${c.title}: ${c.statement}`)
    .join("\n");
  const text = template
    .replace("{{name}}", shape.name)
    .replace("{{definition}}", shape.definition)
    .replace("{{boundary}}", shape.boundaryCriteria)
    .replace("{{cases}}", cases || "(none)");
  return { shape, text };
}

function parse(content: string): { verdict: Verdict; priorArt: string | null; reasoning: string } {
  const json = content.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error(`model returned no JSON:\n${content}`);
  const o = JSON.parse(json) as { verdict?: string; prior_art?: { citation?: string; url?: string | null; overlap?: string }[]; reasoning?: string };
  if (!VERDICTS.includes(o.verdict as Verdict)) throw new Error(`bad verdict: ${o.verdict}`);
  const art = (o.prior_art ?? [])
    .filter((p) => p.citation)
    .map((p) => `${p.citation}${p.url ? ` <${p.url}>` : ""}${p.overlap ? `. ${p.overlap}` : ""}`);
  return { verdict: o.verdict as Verdict, priorArt: art.length ? art.join("\n") : null, reasoning: o.reasoning ?? "" };
}

async function call(model: string, prompt: string) {
  const base = process.env.AUDIT_API_BASE!.replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.AUDIT_API_KEY ?? ""}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const body = (await res.json()) as { choices: { message: { content: string } }[] };
  return body.choices[0]!.message.content;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry-run");
  const slugs = args.includes("--all") ? (await prisma.shape.findMany({ orderBy: { ordinal: "asc" } })).map((s) => s.slug) : args.filter((a) => !a.startsWith("--"));
  if (!slugs.length) throw new Error("usage: audit <shape-slug>... | --all [--dry-run]");

  const model = process.env.AUDIT_MODEL ?? "";
  if (!dry) {
    if (!process.env.AUDIT_API_BASE || !model) throw new Error("set AUDIT_API_BASE, AUDIT_API_KEY and AUDIT_MODEL");
    if (/claude|anthropic/i.test(model) || /anthropic/i.test(process.env.AUDIT_API_BASE)) throw new Error("audit must run on a non-Claude model");
  }

  const { template, promptVersion } = await loadPrompt();
  for (const slug of slugs) {
    const { shape, text } = await buildPrompt(slug, template);
    if (dry) {
      console.log(`=== ${slug} (${promptVersion})\n${text}\n`);
      continue;
    }
    const out = parse(await call(model, text));
    await prisma.adversarialAudit.create({ data: { shapeId: shape.id, model, promptVersion, ...out } });
    console.log(`${slug}: ${out.verdict}${out.priorArt ? `\n  ${out.priorArt.replace(/\n/g, "\n  ")}` : ""}`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
