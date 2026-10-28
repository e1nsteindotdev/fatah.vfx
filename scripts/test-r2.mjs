/**
 * Cloudflare R2 Connection Tester
 * Run: node scripts/test-r2.mjs
 */
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// 1. Load from .env.local if present
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

console.log('\n--- Checking Cloudflare R2 Configuration ---');

const missing = [];
if (!accountId) missing.push('R2_ACCOUNT_ID');
if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
if (!bucketName) missing.push('R2_BUCKET_NAME');
if (!publicUrl) missing.push('R2_PUBLIC_URL');

if (missing.length > 0) {
  console.log('❌ Missing environment variables:');
  for (const m of missing) {
    console.log(`   - ${m}`);
  }
  console.log('\nPlease configure these in your Convex Dashboard or .env.local.');
  console.log('See R2_SETUP.md for full step-by-step instructions.\n');
  process.exit(1);
}

console.log('✅ All 5 required environment variables are present:');
console.log(`   - R2_ACCOUNT_ID: ${accountId.substring(0, 6)}...`);
console.log(`   - R2_ACCESS_KEY_ID: ${accessKeyId.substring(0, 6)}...`);
console.log(`   - R2_BUCKET_NAME: ${bucketName}`);
console.log(`   - R2_PUBLIC_URL: ${publicUrl}`);

console.log('\nConnecting to Cloudflare R2 endpoint...');
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

try {
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 5,
    })
  );
  console.log('🎉 Successfully connected to Cloudflare R2!');
  console.log(`   Bucket "${bucketName}" is accessible and ready.`);
  console.log(`   Existing objects count in sample: ${result.KeyCount ?? 0}`);
  console.log('\nYou are completely set up for zero-cost video storage!\n');
} catch (err) {
  console.error('\n❌ Could not connect to Cloudflare R2 bucket:');
  console.error(err.message || err);
  console.log('\nPlease double check:');
  console.log('1. R2 API Token permissions (must have "Object Read & Write")');
  console.log('2. Bucket name spelling matches Cloudflare dashboard exactly');
  console.log('3. Account ID matches the Account ID on your R2 dashboard overview');
  process.exit(1);
}
