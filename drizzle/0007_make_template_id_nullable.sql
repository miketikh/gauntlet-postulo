-- Make template_id nullable in projects table
-- This allows creating demand letters from scratch without a template
ALTER TABLE "projects"
ALTER COLUMN "template_id" DROP NOT NULL;
