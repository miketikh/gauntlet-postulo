/**
 * Apply Export Migration Script
 * Manually applies the draft_exports table migration
 */

import postgres from 'postgres';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL!;

async function applyMigration() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log('📦 Applying draft_exports table migration...');

    // Create export_format enum if it doesn't exist
    await sql`
      DO $$ BEGIN
        CREATE TYPE export_format AS ENUM('docx', 'pdf');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('  ✅ Created export_format enum');

    // Create draft_exports table
    await sql`
      CREATE TABLE IF NOT EXISTS draft_exports (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        draft_id uuid NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
        version integer NOT NULL,
        format export_format DEFAULT 'docx' NOT NULL,
        file_name varchar(500) NOT NULL,
        s3_key varchar(500),
        file_size integer,
        metadata jsonb,
        exported_by uuid NOT NULL REFERENCES users(id),
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    console.log('  ✅ Created draft_exports table');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS draft_exports_draft_id_idx ON draft_exports USING btree (draft_id);`;
    await sql`CREATE INDEX IF NOT EXISTS draft_exports_exported_by_idx ON draft_exports USING btree (exported_by);`;
    await sql`CREATE INDEX IF NOT EXISTS draft_exports_format_idx ON draft_exports USING btree (format);`;
    await sql`CREATE INDEX IF NOT EXISTS draft_exports_created_at_idx ON draft_exports USING btree (created_at);`;
    console.log('  ✅ Created indexes');

    console.log('\n🎉 Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
