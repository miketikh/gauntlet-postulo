CREATE TYPE "public"."export_format" AS ENUM('docx', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."permission_level" AS ENUM('view', 'comment', 'edit');--> statement-breakpoint
CREATE TABLE "draft_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"permission" "permission_level" NOT NULL,
	"invited_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"format" "export_format" DEFAULT 'docx' NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"s3_key" varchar(500),
	"file_size" integer,
	"metadata" jsonb,
	"exported_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "draft_snapshots" ADD COLUMN "contributors" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "is_system_template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "draft_collaborators" ADD CONSTRAINT "draft_collaborators_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_collaborators" ADD CONSTRAINT "draft_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_collaborators" ADD CONSTRAINT "draft_collaborators_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_exports" ADD CONSTRAINT "draft_exports_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_exports" ADD CONSTRAINT "draft_exports_exported_by_users_id_fk" FOREIGN KEY ("exported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "draft_collaborators_draft_id_idx" ON "draft_collaborators" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "draft_collaborators_user_id_idx" ON "draft_collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "draft_exports_draft_id_idx" ON "draft_exports" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "draft_exports_exported_by_idx" ON "draft_exports" USING btree ("exported_by");--> statement-breakpoint
CREATE INDEX "draft_snapshots_contributors_idx" ON "draft_snapshots" USING btree ("contributors");--> statement-breakpoint
CREATE INDEX "templates_is_system_template_idx" ON "templates" USING btree ("is_system_template");