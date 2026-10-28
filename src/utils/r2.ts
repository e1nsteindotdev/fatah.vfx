/**
 * Pure utility functions for Cloudflare R2
 */

export function checkR2Config(env: Record<string, string | undefined> = process.env) {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucketName = env.R2_BUCKET_NAME;
  const publicUrl = env.R2_PUBLIC_URL;

  const missingVars: string[] = [];
  if (!accountId) missingVars.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missingVars.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missingVars.push("R2_SECRET_ACCESS_KEY");
  if (!bucketName) missingVars.push("R2_BUCKET_NAME");
  if (!publicUrl) missingVars.push("R2_PUBLIC_URL");

  return {
    isConfigured: missingVars.length === 0,
    missingVars,
    bucketName: bucketName || null,
    publicUrl: publicUrl ? publicUrl.replace(/\/+$/, "") : null,
  };
}

export function formatR2Key(filename: string): string {
  const cleanFilename = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/-\./g, ".");
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return `videos/${Date.now()}-${randomSuffix}-${cleanFilename}`;
}
