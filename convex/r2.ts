"use node";

import process from "node:process";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Helper to check R2 environment configuration.
 * Returns boolean and list of missing variable names.
 */
function checkR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

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

/**
 * Creates a unique, sanitized R2 object key for an uploaded video.
 */
function formatR2Key(filename: string): string {
  const cleanFilename = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/-\./g, ".");
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return `videos/${Date.now()}-${randomSuffix}-${cleanFilename}`;
}

/**
 * Validates and retrieves Cloudflare R2 credentials from environment variables.
 * Works seamlessly once the user configures:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - R2_PUBLIC_URL
 */
function getR2Client() {
  const status = checkR2Config();
  if (!status.isConfigured) {
    throw new Error(
      `Cloudflare R2 is not fully configured. Missing environment variables: ${status.missingVars.join(
        ", "
      )}. Please add them to your Convex Dashboard (Settings > Environment Variables) or .env.local.`
    );
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  return {
    s3,
    bucketName: status.bucketName!,
    publicUrl: status.publicUrl!,
  };
}

/**
 * Checks the status of Cloudflare R2 environment variables.
 * Safe to call from client: never exposes secrets.
 */
export const getConfigStatus = action({
  args: {},
  handler: async () => {
    return checkR2Config();
  },
});

/**
 * Generates a presigned Cloudflare R2 upload URL (PUT) for direct client upload.
 * Zero video bytes pass through or store in Convex.
 */
export const generateUploadUrl = action({
  args: {
    filename: v.string(),
    contentType: v.string(),
  },
  handler: async (_ctx, args) => {
    const { s3, bucketName, publicUrl } = getR2Client();
    const key = formatR2Key(args.filename);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: args.contentType || "video/mp4",
    });

    // Presigned upload URL valid for 1 hour
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return {
      uploadUrl,
      key,
      publicUrl: `${publicUrl}/${key}`,
    };
  },
});

/**
 * Deletes an object directly from Cloudflare R2 by key.
 */
export const deleteR2File = action({
  args: {
    key: v.string(),
  },
  handler: async (_ctx, args) => {
    try {
      const { s3, bucketName } = getR2Client();
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: args.key,
        })
      );
      return { success: true };
    } catch (err: unknown) {
      console.warn(`Failed to delete object from R2 (${args.key}):`, err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});

/**
 * Deletes a video record from Convex and removes its associated video file from R2.
 */
export const deleteVideo = action({
  args: {
    id: v.id("videos"),
  },
  handler: async (ctx, args) => {
    const video = await ctx.runQuery(api.videos.getById, { id: args.id });
    if (!video) {
      return { success: false, message: "Video not found" };
    }

    // If video has an R2 key, delete the asset from Cloudflare R2
    if (video.r2Key) {
      try {
        const { s3, bucketName } = getR2Client();
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: video.r2Key,
          })
        );
      } catch (err: unknown) {
        console.warn(`Could not remove R2 file ${video.r2Key}:`, err);
      }
    }

    // Delete the Convex text record (and any legacy Convex storage file if present)
    await ctx.runMutation(api.videos.remove, { id: args.id });

    return { success: true };
  },
});
