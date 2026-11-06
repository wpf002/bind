-- One slug per provision row, set by the seed from its corpus key (gdpr17). Existing rows get a
-- placeholder built from the unique (instrument, provision) pair so the constraint can go on; the
-- next seed replaces every row.
ALTER TABLE "LegalInstrument" ADD COLUMN "slug" TEXT;

UPDATE "LegalInstrument"
SET "slug" = trim(both '-' from regexp_replace(lower("instrument" || ' ' || "provision"), '[^a-z0-9]+', '-', 'g'));

ALTER TABLE "LegalInstrument" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "LegalInstrument_slug_key" ON "LegalInstrument"("slug");
