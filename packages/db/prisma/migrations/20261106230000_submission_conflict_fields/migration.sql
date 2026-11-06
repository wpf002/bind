-- Refocus submissions on the conflict an engineer hit. New columns first, backfilled from the
-- free-form fields, then the old columns go.
ALTER TABLE "Submission"
    ADD COLUMN "building" TEXT,
    ADD COLUMN "property" TEXT,
    ADD COLUMN "jurisdictions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "blockedByCitation" TEXT,
    ADD COLUMN "blockedByUrl" TEXT,
    ADD COLUMN "requiredByCitation" TEXT,
    ADD COLUMN "requiredByUrl" TEXT,
    ADD COLUMN "workaround" TEXT;

UPDATE "Submission" SET
    "building" = "statement",
    "workaround" = "inclusionArgument",
    "blockedByCitation" = "legalCitation",
    "blockedByUrl" = "legalUrl",
    "requiredByCitation" = 'Not recorded',
    "requiredByUrl" = '',
    "property" = CASE
        WHEN EXISTS (SELECT 1 FROM "ArchitecturalProperty" p WHERE p."slug" = "Submission"."architecturalProperty") THEN "architecturalProperty"
        ELSE 'unknown'
    END;

ALTER TABLE "Submission"
    ALTER COLUMN "building" SET NOT NULL,
    ALTER COLUMN "property" SET NOT NULL,
    ALTER COLUMN "blockedByCitation" SET NOT NULL,
    ALTER COLUMN "blockedByUrl" SET NOT NULL,
    ALTER COLUMN "requiredByCitation" SET NOT NULL,
    ALTER COLUMN "requiredByUrl" SET NOT NULL,
    ALTER COLUMN "workaround" SET NOT NULL,
    ALTER COLUMN "jurisdictions" DROP DEFAULT,
    DROP COLUMN "statement",
    DROP COLUMN "inclusionArgument",
    DROP COLUMN "legalCitation",
    DROP COLUMN "legalUrl",
    DROP COLUMN "architecturalProperty",
    DROP COLUMN "proposedShape";
