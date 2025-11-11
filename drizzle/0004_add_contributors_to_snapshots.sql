-- Migration: Add contributors field to draft_snapshots table
-- Story 4.8: Implement Change Tracking with Author Attribution
-- Date: 2025-11-11

-- Add contributors column to store list of users who contributed to this snapshot
ALTER TABLE "draft_snapshots" ADD COLUMN "contributors" jsonb DEFAULT '[]'::jsonb;

-- Add index for querying by contributors
CREATE INDEX "draft_snapshots_contributors_idx" ON "draft_snapshots" USING gin("contributors");

-- Comment on column
COMMENT ON COLUMN "draft_snapshots"."contributors" IS 'Array of user IDs who contributed changes since last snapshot: [{"userId": "uuid", "name": "John Doe", "changesCount": 15}]';
