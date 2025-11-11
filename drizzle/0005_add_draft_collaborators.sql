-- Create enum for permission levels
CREATE TYPE permission_level AS ENUM ('view', 'comment', 'edit');

-- Create draft_collaborators table
CREATE TABLE draft_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission permission_level NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Ensure a user can only be added once per draft
  CONSTRAINT draft_collaborators_draft_user_unique UNIQUE (draft_id, user_id)
);

-- Create indexes for performance
CREATE INDEX draft_collaborators_draft_id_idx ON draft_collaborators(draft_id);
CREATE INDEX draft_collaborators_user_id_idx ON draft_collaborators(user_id);
