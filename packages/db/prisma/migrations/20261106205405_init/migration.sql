-- CreateEnum
CREATE TYPE "Resolvability" AS ENUM ('unresolvable', 'resolvable_costly', 'tech_gap');

-- CreateEnum
CREATE TYPE "ResolutionMechanism" AS ENUM ('none', 'engineering', 'legislative', 'judicial', 'abandonment');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('draft', 'in_review', 'published', 'withdrawn');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'verified', 'corrected', 'disputed');

-- CreateEnum
CREATE TYPE "SourceCheck" AS ENUM ('current', 'changed', 'blocked', 'unreachable');

-- CreateEnum
CREATE TYPE "InclusionVerdict" AS ENUM ('passes', 'fails', 'undecided');

-- CreateEnum
CREATE TYPE "InstrumentRole" AS ENUM ('mandating', 'conflicting', 'context');

-- CreateEnum
CREATE TYPE "ShapeFamily" AS ENUM ('architectural', 'conflict_of_law', 'drafting_error', 'research_gap');

-- CreateEnum
CREATE TYPE "CitationTarget" AS ENUM ('case', 'shape', 'instrument', 'property', 'papering_over', 'rejection');

-- CreateEnum
CREATE TYPE "AdversarialVerdict" AS ENUM ('novel', 'partial', 'rebrand', 'inconclusive');

-- CreateEnum
CREATE TYPE "LegalStanding" AS ENUM ('untested', 'endorsed_by_regulator', 'rejected_by_regulator', 'litigated_unresolved', 'academic_only');

-- CreateEnum
CREATE TYPE "RejectionReason" AS ENUM ('merely_expensive', 'implementation_defect', 'no_primary_source', 'not_a_binding_mandate', 'duplicate_of_existing', 'out_of_scope', 'resolved_by_known_technique');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'in_review', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "Shape" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "family" "ShapeFamily" NOT NULL,
    "definition" TEXT NOT NULL,
    "boundaryCriteria" TEXT NOT NULL,
    "provenanceNote" TEXT,
    "taxonomyVersion" TEXT NOT NULL DEFAULT 'v1',
    "retiredAt" TIMESTAMP(3),
    "retiredNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shape_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShapeAssignment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "shapeId" TEXT NOT NULL,
    "taxonomyVersion" TEXT NOT NULL DEFAULT 'v1',
    "rationale" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),

    CONSTRAINT "ShapeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdversarialAudit" (
    "id" TEXT NOT NULL,
    "shapeId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "verdict" "AdversarialVerdict" NOT NULL,
    "priorArt" TEXT,
    "reasoning" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdversarialAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "corpusRef" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "analysis" TEXT,
    "inclusionVerdict" "InclusionVerdict" NOT NULL DEFAULT 'undecided',
    "inclusionReasoning" TEXT,
    "resolvability" "Resolvability" NOT NULL,
    "resolution" "ResolutionMechanism" NOT NULL DEFAULT 'none',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3),
    "contributor" TEXT,
    "sortKey" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalInstrument" (
    "id" TEXT NOT NULL,
    "regime" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "provision" TEXT NOT NULL,
    "mandate" TEXT NOT NULL,
    "inForceSince" TIMESTAMP(3),
    "amendedAt" TIMESTAMP(3),
    "jurisdictionId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL DEFAULT 'primary',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalInstrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jurisdiction" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'national',

    CONSTRAINT "Jurisdiction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseInstrument" (
    "caseId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "role" "InstrumentRole" NOT NULL DEFAULT 'mandating',
    "note" TEXT,

    CONSTRAINT "CaseInstrument_pkey" PRIMARY KEY ("caseId","instrumentId")
);

-- CreateTable
CREATE TABLE "ArchitecturalProperty" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "threatModel" TEXT NOT NULL,
    "defeatNote" TEXT NOT NULL,
    "exemplars" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchitecturalProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseProperty" (
    "caseId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "CaseProperty_pkey" PRIMARY KEY ("caseId","propertyId")
);

-- CreateTable
CREATE TABLE "PaperingOver" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "technique" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "standing" "LegalStanding" NOT NULL DEFAULT 'untested',
    "residual" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperingOver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rejection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "reason" "RejectionReason" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "submittedBy" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rejection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL,
    "targetType" "CitationTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secondUrl" TEXT,
    "publisher" TEXT,
    "quote" TEXT,
    "retrieved" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationNote" TEXT,
    "sourceCheck" "SourceCheck",
    "sourceCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseTransition" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "triggerUrl" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "inclusionArgument" TEXT NOT NULL,
    "legalCitation" TEXT NOT NULL,
    "legalUrl" TEXT NOT NULL,
    "architecturalProperty" TEXT NOT NULL,
    "proposedShape" TEXT,
    "submitterName" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "submitterAffiliation" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionReview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shape_slug_key" ON "Shape"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Shape_ordinal_key" ON "Shape"("ordinal");

-- CreateIndex
CREATE INDEX "ShapeAssignment_caseId_supersededAt_idx" ON "ShapeAssignment"("caseId", "supersededAt");

-- CreateIndex
CREATE INDEX "ShapeAssignment_shapeId_supersededAt_idx" ON "ShapeAssignment"("shapeId", "supersededAt");

-- CreateIndex
CREATE INDEX "AdversarialAudit_shapeId_idx" ON "AdversarialAudit"("shapeId");

-- CreateIndex
CREATE UNIQUE INDEX "Case_slug_key" ON "Case"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Case_corpusRef_key" ON "Case"("corpusRef");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_resolvability_idx" ON "Case"("resolvability");

-- CreateIndex
CREATE INDEX "LegalInstrument_jurisdictionId_idx" ON "LegalInstrument"("jurisdictionId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalInstrument_instrument_provision_key" ON "LegalInstrument"("instrument", "provision");

-- CreateIndex
CREATE UNIQUE INDEX "Jurisdiction_code_key" ON "Jurisdiction"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ArchitecturalProperty_slug_key" ON "ArchitecturalProperty"("slug");

-- CreateIndex
CREATE INDEX "PaperingOver_caseId_idx" ON "PaperingOver"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Rejection_slug_key" ON "Rejection"("slug");

-- CreateIndex
CREATE INDEX "Citation_targetType_targetId_idx" ON "Citation"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Citation_verificationStatus_idx" ON "Citation"("verificationStatus");

-- CreateIndex
CREATE INDEX "CaseTransition_caseId_occurredAt_idx" ON "CaseTransition"("caseId", "occurredAt");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionReview_submissionId_reviewer_key" ON "SubmissionReview"("submissionId", "reviewer");

-- AddForeignKey
ALTER TABLE "ShapeAssignment" ADD CONSTRAINT "ShapeAssignment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShapeAssignment" ADD CONSTRAINT "ShapeAssignment_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdversarialAudit" ADD CONSTRAINT "AdversarialAudit_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalInstrument" ADD CONSTRAINT "LegalInstrument_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseInstrument" ADD CONSTRAINT "CaseInstrument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseInstrument" ADD CONSTRAINT "CaseInstrument_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "LegalInstrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseProperty" ADD CONSTRAINT "CaseProperty_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseProperty" ADD CONSTRAINT "CaseProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "ArchitecturalProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperingOver" ADD CONSTRAINT "PaperingOver_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTransition" ADD CONSTRAINT "CaseTransition_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionReview" ADD CONSTRAINT "SubmissionReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

