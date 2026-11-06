import type { CorpusExport, ExportCase } from "@bind/shared";
import { corpusExportSchema } from "@bind/shared";
import { instrumentSlug } from "@bind/core";
import { listCases, listProperties, listShapes, type CaseRow } from "./queries";

/** The published corpus as one JSON document. GET /export/json and `pnpm export` both call this. */

function toExportCase(c: CaseRow): ExportCase {
  return {
    slug: c.slug,
    corpusRef: c.corpusRef,
    title: c.title,
    statement: c.statement,
    analysis: c.analysis,
    inclusionReasoning: c.inclusionReasoning,
    resolvability: c.resolvability,
    resolution: c.resolution,
    resolvedAt: c.resolvedAt,
    resolvedBy: c.resolvedBy,
    status: c.status,
    publishedAt: c.publishedAt,
    firstSeenAt: c.firstSeenAt,
    jurisdictions: c.jurisdictions,
    properties: c.properties.map((p) => ({ slug: p.property.slug, name: p.property.name, note: p.note })),
    shapes: c.shapes.map((s) => ({ slug: s.shape.slug, name: s.shape.name, ordinal: s.shape.ordinal, isPrimary: s.isPrimary, rationale: s.rationale })),
    instruments: c.instruments.map((i) => ({
      role: i.role,
      note: i.note,
      slug: i.instrument.slug,
      instrumentSlug: instrumentSlug(i.instrument.shortName),
      regime: i.instrument.regime,
      instrument: i.instrument.instrument,
      shortName: i.instrument.shortName,
      provision: i.instrument.provision,
      mandate: i.instrument.mandate,
      jurisdiction: i.instrument.jurisdiction.code,
      sourceUrl: i.instrument.sourceUrl,
    })),
    citations: c.citations.map((s) => ({
      label: s.label,
      url: s.url,
      secondUrl: s.secondUrl,
      publisher: s.publisher,
      quote: s.quote,
      retrieved: s.retrieved,
      verificationStatus: s.verificationStatus,
      sourceCheck: s.sourceCheck,
      sourceCheckedAt: s.sourceCheckedAt,
    })),
    paperingOvers: c.paperingOvers.map((p) => ({ technique: p.technique, description: p.description, standing: p.standing, residual: p.residual })),
    transitions: c.transitions.map((t) => ({ fromState: t.fromState, toState: t.toState, trigger: t.trigger, triggerUrl: t.triggerUrl, occurredAt: t.occurredAt })),
  };
}

/** Every published case with its properties, shapes, instruments, citations, workarounds and transitions. */
export async function corpusExport(generatedAt = new Date()): Promise<CorpusExport> {
  const [cases, shapes, properties] = await Promise.all([listCases({ limit: 200 }), listShapes(), listProperties()]);
  return corpusExportSchema.parse({
    generatedAt,
    corpus: { cases: cases.length, shapes: shapes.length, properties: properties.length },
    cases: cases.map(toExportCase),
  });
}

export const CORPUS_JSON_FILENAME = "bind-corpus.json";

/** The export file's text. One serialisation, so the route and the script write the same bytes. */
export const corpusExportText = (doc: CorpusExport) => JSON.stringify(doc, null, 2) + "\n";
