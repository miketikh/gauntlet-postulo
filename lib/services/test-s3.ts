/**
 * S3 Connection Test Script
 * Run with: tsx lib/services/test-s3.ts
 */

import 'dotenv/config';
import { testS3Connection } from './storage.service';

async function main() {
  console.log('🔄 Testing S3 connection...');
  console.log(`Bucket: ${process.env.S3_BUCKET_NAME}`);
  console.log(`Region: ${process.env.AWS_REGION}\n`);

  const connected = await testS3Connection();

  if (connected) {
    console.log('✅ S3 connection successful!');
    console.log('✓ Upload test passed');
    console.log('✓ File exists check passed');
    console.log('✓ Delete test passed');
    process.exit(0);
  } else {
    console.log('❌ S3 connection failed');
    console.log('Check your AWS credentials and bucket configuration');
    process.exit(1);
  }
}

main();
