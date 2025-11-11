/**
 * Test script for PDF extraction service
 * Run with: tsx lib/services/test-extraction.ts
 */

import { extractPdfText, processDocumentExtraction } from './extraction.service';
import { db } from '../db/client';
import { sourceDocuments } from '../db/schema';
import { eq } from 'drizzle-orm';

async function testExtraction() {
  console.log('=== PDF Extraction Service Test ===\n');

  // Test 1: Find a PDF document in the database
  console.log('1. Looking for PDF documents in database...');
  const pdfDocs = await db.query.sourceDocuments.findMany({
    where: eq(sourceDocuments.fileType, 'application/pdf'),
    limit: 5,
  });

  if (pdfDocs.length === 0) {
    console.log('❌ No PDF documents found in database');
    console.log('   Please upload a PDF first using the upload API');
    return;
  }

  console.log(`✓ Found ${pdfDocs.length} PDF document(s)\n`);

  // Test 2: Extract text from first PDF
  const testDoc = pdfDocs[0];
  console.log('2. Testing extraction on document:');
  console.log(`   ID: ${testDoc.id}`);
  console.log(`   File: ${testDoc.fileName}`);
  console.log(`   S3 Key: ${testDoc.s3Key}`);
  console.log(`   Current status: ${testDoc.extractionStatus}\n`);

  console.log('3. Starting extraction...');
  const startTime = Date.now();

  try {
    const result = await extractPdfText(testDoc.s3Key);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✓ Extraction completed in ${duration}s\n`);
    console.log('4. Results:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Pages: ${result.pageCount}`);
    console.log(`   Text length: ${result.text.length} characters`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.success && result.text) {
      console.log('\n5. Text preview (first 500 chars):');
      console.log('   ---');
      console.log(`   ${result.text.substring(0, 500)}${result.text.length > 500 ? '...' : ''}`);
      console.log('   ---\n');
    }

    // Test 3: Test full processing (updates database)
    console.log('6. Testing full document processing...');
    await processDocumentExtraction(testDoc.id);

    // Verify database update
    const updatedDoc = await db.query.sourceDocuments.findFirst({
      where: eq(sourceDocuments.id, testDoc.id),
    });

    if (updatedDoc) {
      console.log(`✓ Document status updated to: ${updatedDoc.extractionStatus}`);
      console.log(`✓ Extracted text stored: ${updatedDoc.extractedText ? 'Yes' : 'No'}`);
      if (updatedDoc.extractedText) {
        console.log(`✓ Text length: ${updatedDoc.extractedText.length} characters`);
      }
    }

    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    throw error;
  }
}

// Run test
testExtraction()
  .then(() => {
    console.log('\nTest finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
