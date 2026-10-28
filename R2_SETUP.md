# Cloudflare R2 + Convex Architecture & Setup Guide

This project is configured to use **Convex exclusively for text-based data & reactive metadata** and **Cloudflare R2 for zero-cost video storage and streaming**.

---

## 🏛️ Architecture Overview

```
                                          ┌─────────────────────────────┐
                                          │   Convex Reactive Database  │
                                          │  (Text Data & Metadata)     │
                                          │                             │
                                          │ • title, category, role     │
                                          │ • duration, resolution      │
                                          │ • videoSrc (R2 public URL)  │
                                          │ • r2Key (for management)    │
                                          └──────────────┬──────────────┘
                                                         │
                                   1. Query metadata     │ 3. Save text record
                                      & signed URL       │    (0 MB storage)
                                                         ▼
┌───────────────────────────┐      2. Direct PUT upload      ┌─────────────────────────────┐
│                           │ ─────────────────────────────> │        Cloudflare R2        │
│   Browser / Dashboard     │                                │  (Object Video Storage)     │
│  (FastStart MP4 Pre-pack) │ <───────────────────────────── │                             │
│                           │      4. Direct video stream    │ • 10 GB Free Storage        │
│                           │         (Range Requests / CDN) │ • 10M Class B Reads Free    │
└───────────────────────────┘                                │ • $0.00 Egress Bandwidth    │
                                                             └─────────────────────────────┘
```

### Key Advantages
1. **0 MB Video Overhead in Convex**: Convex stores only lightweight JSON records (titles, descriptions, aspect ratios, and the public streaming URL).
2. **Zero Bandwidth Costs**: Cloudflare R2 charges **$0.00 / GB for egress bandwidth**, unlike AWS S3 or traditional storage providers.
3. **Instant Playback (FastStart)**: Before upload, the browser rearranges the MP4 `moov` atom to the beginning of the file, enabling immediate streaming and seeking via HTTP Range requests without buffering.
4. **Direct Browser Uploads**: Video files upload directly from the user's browser to Cloudflare R2 using secure, temporary presigned URLs generated on-demand by Convex actions.

---

## 🚀 5-Minute Setup Guide

You only need to configure 5 environment variables in your **Convex Dashboard** (and/or `.env.local` for local dev).

### Step 1: Create a Bucket in Cloudflare R2
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left navigation bar, click **R2**.
3. Click **Create bucket**.
4. Name your bucket (e.g., `fatah-portfolio-videos`).
5. Choose **Default** (Automatic) location and click **Create Bucket**.

### Step 2: Enable Public Access (Get Public URL)
Cloudflare R2 provides two ways to serve videos to the public:

#### Option A: R2.dev Subdomain (Quickest - Free)
1. In your bucket overview, click the **Settings** tab.
2. Scroll down to **Public access** > **R2.dev subdomain**.
3. Click **Allow Access** and type `allow` to confirm.
4. Copy the public URL (e.g. `https://pub-a1b2c3d4e5f6g7h8.r2.dev`). This is your `R2_PUBLIC_URL`.

#### Option B: Custom Domain (Optional)
If you own a domain on Cloudflare (e.g., `fatahchafaa.com`), you can attach `media.fatahchafaa.com` under **Custom Domains**.

### Step 3: Add CORS Policy to the Bucket (Required for Browser Uploads)
Because videos upload directly from the web browser to R2, you need to allow PUT requests:
1. In your bucket, go to the **Settings** tab.
2. Scroll down to **CORS Policy** and click **Add CORS policy** (or Edit).
3. Paste the following JSON policy and click **Save**:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://*.vercel.app",
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 4: Create API Token for R2
1. Go back to the **R2** main page in Cloudflare.
2. On the right side, click **Manage R2 API Tokens**.
3. Click **Create API Token**.
4. Set permissions to: **Object Read & Write**.
5. Under **Specify bucket(s)**, select your bucket (or Apply to all buckets).
6. Click **Create API Token**.
7. Copy:
   - **Access Key ID** (`R2_ACCESS_KEY_ID`)
   - **Secret Access Key** (`R2_SECRET_ACCESS_KEY`)

### Step 5: Get your Account ID
On the right sidebar of the **R2 Overview** page in Cloudflare, find your **Account ID** (a 32-character hex string). This is `R2_ACCOUNT_ID`.

---

## ⚙️ Environment Variables Reference

Add these 5 variables in your **Convex Dashboard**:
👉 Go to **[dashboard.convex.dev](https://dashboard.convex.dev)** > Your Project (`fatah-vfx`) > **Settings** > **Environment Variables**:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `R2_ACCOUNT_ID` | Cloudflare 32-character Account ID | `9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d` |
| `R2_ACCESS_KEY_ID` | R2 API Token Access Key | `0123456789abcdef0123456789abcdef` |
| `R2_SECRET_ACCESS_KEY` | R2 API Token Secret Key | `fedcba9876543210fedcba9876543210...` |
| `R2_BUCKET_NAME` | Name of your R2 bucket | `fatah-portfolio-videos` |
| `R2_PUBLIC_URL` | Public access domain for bucket | `https://pub-xxxxxx.r2.dev` |

*(Optional for local development: also paste them in `.env.local`)*

---

## 🧪 Testing Your Connection

We've provided a CLI tool to test your R2 credentials:

```bash
pnpm test:r2
```

When properly configured, you'll see:
```text
✅ All 5 required environment variables are present
Connecting to Cloudflare R2 endpoint...
🎉 Successfully connected to Cloudflare R2!
   Bucket "fatah-portfolio-videos" is accessible and ready.
```

---

## 🖥️ Live Dashboard Indicators

Once plugged in, your `/dashboard` route will automatically:
- Show a **Cloudflare R2 Video Storage: Active** status badge with your bucket name.
- Upload video files directly to Cloudflare R2 with a live percentage progress bar.
- Tag each portfolio item with a **Cloudflare R2** indicator badge.
- Automatically delete the file from Cloudflare R2 when you delete or replace a video in the dashboard.
