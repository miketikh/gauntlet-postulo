/**
 * Test Export Script
 * Manually test Word document export functionality
 * Part of Story 5.7 - Implement Word Document Export
 */

import { exportDraft } from '../lib/services/export.service';
import { db } from '../lib/db/client';
import { drafts } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Set environment to skip S3 upload
process.env.EXPORT_UPLOAD_TO_S3 = 'false';

async function testExport() {
  try {
    console.log('🔍 Finding a draft to export...');

    // Find a draft with content
    const draft = await db.query.drafts.findFirst({
      with: {
        project: {
          with: {
            template: true,
          },
        },
      },
    });

    if (!draft) {
      console.error('❌ No drafts found in database');
      console.log('💡 Please create a draft first using the application');
      return;
    }

    console.log(`✅ Found draft: ${draft.id}`);
    console.log(`   Project: ${draft.project.title}`);
    console.log(`   Version: ${draft.currentVersion}`);

    console.log('\n📝 Exporting to Word document...');

    const result = await exportDraft({
      draftId: draft.id,
      format: 'docx',
      userId: draft.project.createdBy,
      includeMetadata: true,
    });

    console.log(`✅ Export successful!`);
    console.log(`   Export ID: ${result.exportId}`);
    console.log(`   File name: ${result.fileName}`);
    console.log(`   File size: ${result.fileSize} bytes`);

    if (result.buffer) {
      // Save to test-files directory
      const outputPath = join(process.cwd(), 'test-files', result.fileName);
      writeFileSync(outputPath, result.buffer);
      console.log(`\n💾 Saved to: ${outputPath}`);
      console.log('\n✨ Test complete! You can now open this file in Microsoft Word to verify formatting.');
    } else {
      console.log('\n⚠️  No buffer returned (file may be in S3)');
    }

    // Display export history
    console.log('\n📊 Export history for this draft:');
    const { getDraftExports } = await import('../lib/services/export.service');
    const exports = await getDraftExports(draft.id);

    exports.forEach((exp, index) => {
      console.log(`   ${index + 1}. ${exp.fileName} - v${exp.version} (${new Date(exp.createdAt).toLocaleString()})`);
      if (exp.exporter) {
        console.log(`      Exported by: ${exp.exporter.firstName} ${exp.exporter.lastName}`);
      }
    });

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Export test failed:', error);
    throw error;
  }
}

// Run test
testExport()
  .then(() => {
    console.log('\n✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
