/**
 * Cleanup Draft Projects Script
 * Deletes draft projects older than 48 hours
 *
 * Usage:
 *   npx tsx scripts/cleanup-draft-projects.ts
 *
 * Can be run as a cron job or scheduled task
 */

import { db } from '../lib/db/client';
import { projects, sourceDocuments } from '../lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const RETENTION_HOURS = 48; // Delete drafts older than 48 hours

/**
 * Initialize S3 client
 */
function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Delete files from S3 for a project
 */
async function deleteProjectFiles(projectId: string): Promise<number> {
  const s3Client = getS3Client();
  const bucketName = process.env.S3_BUCKET_NAME || 'steno-documents-dev';

  // Get all source documents for this project
  const docs = await db.query.sourceDocuments.findMany({
    where: eq(sourceDocuments.projectId, projectId),
  });

  let deletedCount = 0;

  for (const doc of docs) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: doc.s3Key,
      });

      await s3Client.send(command);
      deletedCount++;
      console.log(`  ✓ Deleted S3 file: ${doc.s3Key}`);
    } catch (error) {
      console.error(`  ✗ Failed to delete S3 file ${doc.s3Key}:`, error);
    }
  }

  return deletedCount;
}

/**
 * Main cleanup function
 */
async function cleanupDraftProjects() {
  console.log('🧹 Starting draft project cleanup...\n');

  // Calculate cutoff time (48 hours ago)
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - RETENTION_HOURS);

  console.log(`Cutoff time: ${cutoffTime.toISOString()}`);
  console.log(`Deleting draft projects older than ${RETENTION_HOURS} hours\n`);

  try {
    // Find all draft projects older than retention period
    const oldDrafts = await db.query.projects.findMany({
      where: and(
        eq(projects.status, 'draft'),
        lt(projects.createdAt, cutoffTime)
      ),
      with: {
        sourceDocuments: true,
      },
    });

    if (oldDrafts.length === 0) {
      console.log('✓ No old draft projects found. Nothing to clean up.');
      return;
    }

    console.log(`Found ${oldDrafts.length} draft project(s) to delete:\n`);

    let totalFilesDeleted = 0;

    // Delete each old draft
    for (const draft of oldDrafts) {
      console.log(`📁 Project: ${draft.title} (${draft.id})`);
      console.log(`   Created: ${draft.createdAt.toISOString()}`);
      console.log(`   Documents: ${draft.sourceDocuments.length}`);

      // Delete associated S3 files
      const filesDeleted = await deleteProjectFiles(draft.id);
      totalFilesDeleted += filesDeleted;

      // Delete project (cascade will handle sourceDocuments and drafts)
      await db.delete(projects).where(eq(projects.id, draft.id));

      console.log(`   ✓ Project deleted\n`);
    }

    console.log('─'.repeat(50));
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Projects deleted: ${oldDrafts.length}`);
    console.log(`   S3 files deleted: ${totalFilesDeleted}`);

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupDraftProjects()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });
