#!/bin/bash
# Fix Next.js 15 params types in all route handlers

FILES=(
  "app/api/comments/threads/[id]/resolve/route.ts"
  "app/api/drafts/[id]/comments/route.ts"
  "app/api/drafts/[id]/collaborators/route.ts"
  "app/api/drafts/[id]/collaborators/[userId]/route.ts"
  "app/api/drafts/[id]/snapshots/route.ts"
  "app/api/drafts/[id]/versions/[version]/route.ts"
  "app/api/drafts/[id]/versions/route.ts"
  "app/api/drafts/[id]/diff/route.ts"
  "app/api/drafts/[id]/history/route.ts"
  "app/api/drafts/[id]/restore/[version]/route.ts"
  "app/api/documents/[id]/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."

    # Replace single param patterns
    sed -i.bak 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' "$file"

    # Replace double param patterns
    sed -i.bak 's/{ params }: { params: { id: string; version: string } }/{ params }: { params: Promise<{ id: string; version: string }> }/g' "$file"
    sed -i.bak 's/{ params }: { params: { id: string; userId: string } }/{ params }: { params: Promise<{ id: string; userId: string }> }/g' "$file"

    # Replace params.id access patterns - need to await first
    # This is more complex and might need manual review

    rm "$file.bak" 2>/dev/null
  fi
done

echo "Done! Please manually review and update params access to use 'await params'"
