ALTER TABLE "templates" ADD COLUMN "is_system_template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "templates_is_system_template_idx" ON "templates" USING btree ("is_system_template");
