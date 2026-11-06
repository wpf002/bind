import { randomBytes } from "node:crypto";
import type { Reviewer } from "@bind/core";
import { prisma } from "@bind/db";
import type { SubmissionInput } from "@bind/shared";
import { buildApp } from "../src/app";

const TOKEN_BYTES = 24;

/** Two reviewers with tokens generated for this run. Nothing in the tests reads REVIEWERS. */
export function createReviewers(): [Reviewer, Reviewer] {
  const token = () => randomBytes(TOKEN_BYTES).toString("hex");
  return [
    { name: "ada", token: token() },
    { name: "grace", token: token() },
  ];
}

export const buildTestApp = (reviewers: Reviewer[] = []) => buildApp({ reviewers, logLevel: "silent" });

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

export const validSubmission: SubmissionInput = {
  title: "Erasure against an append-only audit log",
  statement: "The regulation orders deletion on request while the audit rule orders every record kept unaltered.",
  inclusionArgument:
    "Deleting the record breaks the hash chain the audit rule relies on, and keeping it breaks the erasure order. No budget changes that.",
  legalCitation: "Regulation (EU) 2016/679, Art. 17(1)",
  legalUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
  architecturalProperty: "append-only integrity",
  proposedShape: "immutability-vs-erasure",
  submitterName: "Test Submitter",
  submitterEmail: "submitter@example.com",
  submitterAffiliation: "Example University",
};

export const PUBLISHED_SLUG = "bind-0001";
export const DRAFT_SLUG = "bind-0002";
export const SHAPE_SLUG = "immutability-vs-erasure";

/** One shape holding a published case and a held draft, with the rows the read routes join. */
export async function seedCorpus() {
  const jurisdiction = await prisma.jurisdiction.create({ data: { code: "EU", name: "European Union", level: "supranational" } });
  const instrument = await prisma.legalInstrument.create({
    data: {
      regime: "EU data protection",
      instrument: "Regulation (EU) 2016/679",
      shortName: "GDPR",
      provision: "Art. 17(1)",
      mandate: "Erase personal data on request.",
      jurisdictionId: jurisdiction.id,
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    },
  });
  const shape = await prisma.shape.create({
    data: {
      slug: SHAPE_SLUG,
      ordinal: 1,
      name: "Immutability vs Erasure",
      family: "architectural",
      definition: "A deletion mandate meets a store that cannot delete.",
      boundaryCriteria: "Stores that can redact without breaking integrity are out.",
    },
  });
  const linked = {
    resolvability: "unresolvable",
    shapes: { create: { shapeId: shape.id } },
    instruments: { create: { instrumentId: instrument.id } },
  } as const;
  const published = await prisma.case.create({
    data: {
      ...linked,
      slug: PUBLISHED_SLUG,
      corpusRef: "A1",
      title: "Erasure on a public ledger",
      statement: "Erasure is ordered and the ledger cannot erase.",
      status: "published",
      sortKey: 1,
      transitions: { create: { fromState: "open", toState: "contested", trigger: "Regulator opinion", occurredAt: new Date("2024-03-01") } },
    },
  });
  const draft = await prisma.case.create({
    data: {
      ...linked,
      slug: DRAFT_SLUG,
      corpusRef: "A2",
      title: "Held draft on key escrow",
      statement: "Escrow is ordered and the protocol holds no keys.",
      status: "draft",
      sortKey: 2,
    },
  });
  await prisma.citation.create({
    data: {
      targetType: "case",
      targetId: published.id,
      label: "GDPR Art. 17(1)",
      url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
      verificationStatus: "verified",
    },
  });
  await prisma.rejection.create({
    data: {
      slug: "rej-0001",
      title: "Slow export endpoint",
      claim: "The export takes too long to meet the deadline.",
      reason: "merely_expensive",
      reasoning: "More hardware meets the deadline.",
    },
  });
  return { published, draft, shape };
}
