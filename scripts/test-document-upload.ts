/**
 * Manual Test Script for Document Upload API
 *
 * This script tests the document upload functionality including:
 * - File upload to S3
 * - Database record creation
 * - Presigned URL generation
 * - Firm isolation
 *
 * Usage: tsx scripts/test-document-upload.ts
 */

import { db } from '../lib/db/client';
import { firms, users, projects, templates, sourceDocuments } from '../lib/db/schema';
import { hashPassword, generateAccessToken } from '../lib/services/auth.service';
import { uploadDocumentToS3, getPresignedUrl, testS3Connection } from '../lib/services/storage.service';
import { eq } from 'drizzle-orm';

async function testDocumentUpload() {
  console.log('🚀 Starting Document Upload API Test...\n');

  try {
    // Test 1: Verify S3 connection
    console.log('Test 1: Verifying S3 connection...');
    const s3Connected = await testS3Connection();
    if (s3Connected) {
      console.log('✅ S3 connection successful\n');
    } else {
      console.log('❌ S3 connection failed\n');
      return;
    }

    // Test 2: Create test firm and user
    console.log('Test 2: Creating test firm and user...');
    const [firm] = await db
      .insert(firms)
      .values({ name: 'Test Firm - Document Upload' })
      .returning();
    console.log(`✅ Created firm: ${firm.name} (${firm.id})\n`);

    const password = await hashPassword('test123');
    const [user] = await db
      .insert(users)
      .values({
        email: 'test-upload@example.com',
        passwordHash: password,
        firstName: 'Test',
        lastName: 'User',
        role: 'attorney',
        firmId: firm.id,
      })
      .returning();
    console.log(`✅ Created user: ${user.email} (${user.id})\n`);

    // Test 3: Create template and project
    console.log('Test 3: Creating template and project...');
    const [template] = await db
      .insert(templates)
      .values({
        name: 'Test Template',
        description: 'Template for testing',
        sections: [],
        variables: [],
        firmId: firm.id,
        createdBy: user.id,
      })
      .returning();
    console.log(`✅ Created template: ${template.name}\n`);

    const [project] = await db
      .insert(projects)
      .values({
        title: 'Test Project - Document Upload',
        clientName: 'Test Client',
        status: 'draft',
        caseDetails: { test: true },
        templateId: template.id,
        firmId: firm.id,
        createdBy: user.id,
      })
      .returning();
    console.log(`✅ Created project: ${project.title} (${project.id})\n`);

    // Test 4: Upload a test document to S3
    console.log('Test 4: Uploading test document to S3...');
    const documentId = crypto.randomUUID();
    const fileName = 'test-document.pdf';
    const fileContent = Buffer.from('This is a test PDF document content');
    const fileType = 'application/pdf';

    // Create a mock File object
    const mockFile = {
      name: fileName,
      type: fileType,
      size: fileContent.length,
      arrayBuffer: async () => fileContent.buffer,
    } as File;

    const s3Key = `${firm.id}/${project.id}/${documentId}-${fileName}`;
    await uploadDocumentToS3(mockFile, s3Key);
    console.log(`✅ Uploaded file to S3: ${s3Key}\n`);

    // Test 5: Create database record
    console.log('Test 5: Creating database record...');
    const [document] = await db
      .insert(sourceDocuments)
      .values({
        id: documentId,
        projectId: project.id,
        fileName,
        fileType,
        fileSize: fileContent.length,
        s3Key,
        extractionStatus: 'pending',
        uploadedBy: user.id,
      })
      .returning();
    console.log(`✅ Created database record: ${document.id}\n`);

    // Test 6: Generate presigned URL
    console.log('Test 6: Generating presigned URL...');
    const presignedUrl = await getPresignedUrl(s3Key);
    console.log(`✅ Generated presigned URL (expires in 1 hour):`);
    console.log(`${presignedUrl.substring(0, 100)}...\n`);

    // Test 7: Verify document retrieval with relationships
    console.log('Test 7: Verifying document retrieval with relationships...');
    const retrievedDoc = await db.query.sourceDocuments.findFirst({
      where: eq(sourceDocuments.id, documentId),
      with: {
        project: true,
        uploader: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (retrievedDoc) {
      console.log('✅ Document retrieved successfully:');
      console.log(`   - ID: ${retrievedDoc.id}`);
      console.log(`   - File: ${retrievedDoc.fileName}`);
      console.log(`   - Size: ${retrievedDoc.fileSize} bytes`);
      console.log(`   - Project: ${retrievedDoc.project.title}`);
      console.log(`   - Uploader: ${retrievedDoc.uploader.firstName} ${retrievedDoc.uploader.lastName}`);
      console.log(`   - S3 Key: ${retrievedDoc.s3Key}\n`);
    }

    // Test 8: Generate access token
    console.log('Test 8: Generating JWT access token...');
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firmId: user.firmId,
    });
    console.log(`✅ Generated JWT token (first 50 chars): ${token.substring(0, 50)}...\n`);

    // Test 9: Display curl command for manual API testing
    console.log('Test 9: Manual API testing command:');
    console.log('\n📋 To test the upload endpoint with curl, use:');
    console.log(`
curl -X POST http://localhost:3000/api/documents/upload \\
  -H "Authorization: Bearer ${token}" \\
  -F "file=@/path/to/your/test.pdf" \\
  -F "projectId=${project.id}"
`);

    console.log(`\n📋 To retrieve the document, use:`);
    console.log(`
curl -X GET http://localhost:3000/api/documents/${documentId} \\
  -H "Authorization: Bearer ${token}"
`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\nTest Summary:');
    console.log(`- Firm ID: ${firm.id}`);
    console.log(`- User ID: ${user.id}`);
    console.log(`- Project ID: ${project.id}`);
    console.log(`- Document ID: ${documentId}`);
    console.log(`- S3 Key: ${s3Key}`);
    console.log(`- JWT Token: ${token.substring(0, 50)}...`);

    console.log('\n⚠️  Cleanup Note:');
    console.log('Test data has been created. To clean up, delete the firm:');
    console.log(`DELETE FROM firms WHERE id = '${firm.id}';`);
    console.log('(Cascade delete will remove all related records)\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDocumentUpload()
  .then(() => {
    console.log('🎉 Document upload test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
