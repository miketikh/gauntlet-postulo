const fs = require('fs');
const path = require('path');

const files = [
  'app/api/comments/threads/[id]/resolve/route.ts',
  'app/api/drafts/[id]/comments/route.ts',
  'app/api/drafts/[id]/collaborators/route.ts',
  'app/api/drafts/[id]/collaborators/[userId]/route.ts',
  'app/api/drafts/[id]/snapshots/route.ts',
  'app/api/drafts/[id]/versions/[version]/route.ts',
  'app/api/drafts/[id]/versions/route.ts',
  'app/api/drafts/[id]/diff/route.ts',
  'app/api/drafts/[id]/history/route.ts',
  'app/api/drafts/[id]/restore/[version]/route.ts',
  'app/api/documents/[id]/route.ts',
];

files.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if file has already been processed
  if (content.includes('= await params')) {
    console.log(`Skipping ${filePath} - already processed`);
    return;
  }

  // Pattern 1: const commentId = params.id; -> const { id: commentId } = await params;
  content = content.replace(
    /const (\w+) = params\.id;/g,
    'const { id: $1 } = await params;'
  );

  // Pattern 2: const draftId = params.id; -> same as above
  // This is already handled by the regex above

  // Pattern 3: const version = params.version; -> const { version } = await params;
  content = content.replace(
    /const version = params\.version;/g,
    'const { version } = await params;'
  );

  // Pattern 4: const userId = params.userId; -> const { userId } = await params;
  content = content.replace(
    /const userId = params\.userId;/g,
    'const { userId } = await params;'
  );

  // Pattern 5: Multiple destructuring like const { id, version } = await params;
  content = content.replace(
    /const draftId = params\.id;\s*const version = params\.version;/g,
    'const { id: draftId, version } = await params;'
  );

  content = content.replace(
    /const draftId = params\.id;\s*const userId = params\.userId;/g,
    'const { id: draftId, userId } = await params;'
  );

  // Remove any references to params.id in error handlers
  content = content.replace(/params\.id/g, 'await params.then(p => p.id)');
  content = content.replace(/params\.version/g, 'await params.then(p => p.version)');
  content = content.replace(/params\.userId/g, 'await params.then(p => p.userId)');

  // But that's messy - better to just remove those fields from logger since we already have the local var

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Fixed ${filePath}`);
});

console.log('All files processed!');
