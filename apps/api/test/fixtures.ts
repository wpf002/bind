import { randomBytes } from "node:crypto";
import { join } from "node:path";
import type { Reviewer } from "@bind/core";
import { prisma } from "@bind/db";
import type { SubmissionInput } from "@bind/shared";
import { buildApp } from "../src/app";
import { toSubmissionRow } from "../src/submissions";

const TOKEN_BYTES = 24;

/** Two reviewers with tokens generated for this run. Nothing in the tests reads REVIEWERS. */
export function createReviewers(): [Reviewer, Reviewer] {
  const token = () => randomBytes(TOKEN_BYTES).toString("hex");
  return [
    { name: "ada", token: token() },
    { name: "grace", token: token() },
  ];
}

/** A one-entry releases ledger, so tests don't depend on the real one. */
export const RELEASES_FIXTURE_PATH = join(import.meta.dirname, "releases.fixture.json");
export const FIXTURE_RELEASE = { version: "2025.12", releasedAt: "2025-12-01T00:00:00.000Z", cases: 1 };

export const buildTestApp = (reviewers: Reviewer[] = [], releasesPath = RELEASES_FIXTURE_PATH) => buildApp({ reviewers, logLevel: "silent", releasesPath });

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

export const validSubmission: SubmissionInput = {
  title: "Erasure against an append-only audit log",
  building: "A hash-chained audit log for a payments ledger, where no record is ever rewritten or removed.",
  property: "append-only-integrity",
  jurisdictions: ["EU"],
  requiredBy: { citation: "Regulation (EU) 2016/679, Art. 17(1)", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj" },
  blockedBy: { citation: "Directive 2014/65/EU, Art. 25(5)", url: "https://eur-lex.europa.eu/eli/dir/2014/65/oj" },
  workaround: "Tombstoning the record keeps the chain but leaves the ciphertext, which the erasure order still covers. Crypto-shredding fails the audit rule.",
  submitterName: "Test Submitter",
  submitterEmail: "submitter@example.com",
  submitterAffiliation: "Example University",
};

/** The same submission as the row the table stores. */
export const submissionRow = toSubmissionRow(validSubmission);

export const PUBLISHED_SLUG = "bind-0001";
export const DRAFT_SLUG = "bind-0002";
export const SHAPE_SLUG = "immutability-vs-erasure";
export const PROPERTY_SLUG = "append-only-integrity";

/** One shape and one property holding a published case and a held draft, with the rows the read routes join. */
export async function seedCorpus() {
  const jurisdiction = await prisma.jurisdiction.create({ data: { code: "EU", name: "European Union", level: "supranational" } });
  const instrument = await prisma.legalInstrument.create({
    data: {
      regime: "EU data protection",
      instrument: "Regulation (EU) 2016/679",
      shortName: "GDPR",
      slug: "gdpr17",
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
  const property = await prisma.architecturalProperty.create({
    data: {
      slug: PROPERTY_SLUG,
      name: "Append-Only Integrity",
      threatModel: "Records cannot be altered or removed once written.",
      defeatNote: "A store that can delete gives up tamper evidence.",
      exemplars: ["Distributed ledgers"],
    },
  });
  const linked = {
    resolvability: "unresolvable",
    shapes: { create: { shapeId: shape.id } },
    instruments: { create: { instrumentId: instrument.id } },
    properties: { create: { propertyId: property.id } },
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
      transitions: { create: { fromState: "open", toState: "resolved", trigger: "Draft trigger", occurredAt: new Date("2025-01-01") } },
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
  return { published, draft, shape, property };
}

export const SECOND_SLUG = "bind-0003";
export const THIRD_SLUG = "bind-0004";
export const SECOND_SHAPE_SLUG = "custody-vs-access";
export const SECOND_PROPERTY_SLUG = "key-custody";
export const INSTRUMENT_SLUG = "gdpr";
export const SECOND_INSTRUMENT_SLUG = "wiretap-act";
export const PROVISION_SLUGS = ["gdpr17", "gdpr5c"] as const;

/** A second GDPR provision, cited as context by the third case: one instrument page, two provisions, cases shared between them. */
export async function seedSecondProvision() {
  const eu = await prisma.jurisdiction.findUniqueOrThrow({ where: { code: "EU" } });
  const third = await prisma.case.findUniqueOrThrow({ where: { slug: THIRD_SLUG } });
  await prisma.legalInstrument.create({
    data: {
      regime: "EU data protection",
      instrument: "Regulation (EU) 2016/679",
      shortName: "GDPR",
      slug: PROVISION_SLUGS[1],
      provision: "Art. 5(1)(c)",
      mandate: "Collect no more than the purpose needs.",
      jurisdictionId: eu.id,
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
      cases: { create: { caseId: third.id, role: "context", note: "Minimisation bounds what the operator may hold." } },
    },
  });
}

/**
 * A second corner of the corpus for the design check: a US jurisdiction, a second shape and property,
 * a US-only case under both, and an EU case under the second property with the second shape primary.
 * Call after seedCorpus.
 */
export async function seedSecondCorner() {
  const us = await prisma.jurisdiction.create({ data: { code: "US", name: "United States", level: "national" } });
  const eu = await prisma.jurisdiction.findUniqueOrThrow({ where: { code: "EU" } });
  const usInstrument = await prisma.legalInstrument.create({
    data: {
      regime: "US lawful access",
      instrument: "18 U.S.C. § 2518",
      shortName: "Wiretap Act",
      slug: "wiretap2518",
      provision: "§ 2518(4)",
      mandate: "Furnish technical assistance to intercept.",
      jurisdictionId: us.id,
      sourceUrl: "https://www.law.cornell.edu/uscode/text/18/2518",
    },
  });
  const euInstrument = await prisma.legalInstrument.findFirstOrThrow({ where: { jurisdictionId: eu.id } });
  const firstShape = await prisma.shape.findUniqueOrThrow({ where: { slug: SHAPE_SLUG } });
  const shape = await prisma.shape.create({
    data: {
      slug: SECOND_SHAPE_SLUG,
      ordinal: 2,
      name: "Custody vs Access",
      family: "architectural",
      definition: "An access mandate meets a system that holds no key.",
      boundaryCriteria: "Systems that escrow a key are out.",
    },
  });
  const property = await prisma.architecturalProperty.create({
    data: {
      slug: SECOND_PROPERTY_SLUG,
      name: "Key Custody",
      threatModel: "The operator never holds a key that decrypts user content.",
      defeatNote: "An operator key makes the operator a target.",
      exemplars: ["End-to-end messengers"],
    },
  });
  await prisma.case.create({
    data: {
      slug: SECOND_SLUG,
      corpusRef: "B1",
      title: "Intercept order against an operator with no key",
      statement: "Assistance is ordered and the operator holds no key.",
      status: "published",
      sortKey: 3,
      resolvability: "unresolvable",
      shapes: { create: { shapeId: shape.id } },
      instruments: { create: { instrumentId: usInstrument.id } },
      properties: { create: { propertyId: property.id } },
    },
  });
  await prisma.case.create({
    data: {
      slug: THIRD_SLUG,
      corpusRef: "B2",
      title: "Erasure order against a keyless operator",
      statement: "Erasure is ordered and the operator cannot read what it must erase.",
      status: "published",
      sortKey: 4,
      resolvability: "resolvable_costly",
      resolution: "engineering",
      resolvedAt: new Date("2025-02-01"),
      shapes: { create: [{ shapeId: shape.id, isPrimary: true }, { shapeId: firstShape.id, isPrimary: false }] },
      instruments: { create: { instrumentId: euInstrument.id } },
      properties: { create: { propertyId: property.id } },
    },
  });
}
