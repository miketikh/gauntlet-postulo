ALTER TABLE "templates"
ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "templates_is_active_idx"
ON "templates" ("is_active");

CREATE INDEX IF NOT EXISTS "templates_firm_id_idx"
ON "templates" ("firm_id");


