import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: { id: v.id("videos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const videos = await ctx.db.query("videos").take(100);
    
    // Sort by order ascending (0, 1, 2, ...), falling back to _creationTime desc
    videos.sort((a, b) => {
      const orderA = a.order;
      const orderB = b.order;
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      return b._creationTime - a._creationTime;
    });

    return videos.map((v) => {
      // ONLY serve video URLs that come from Cloudflare R2.
      // NEVER fall back to Convex storage.
      let videoUrl = "";

      if (v.r2Key) {
        const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
        videoUrl = publicUrl ? `${publicUrl}/${v.r2Key}` : (v.videoSrc || "");
      } else if (
        v.videoSrc &&
        (v.videoSrc.includes("r2.dev") ||
          v.videoSrc.includes("r2.cloudflarestorage.com") ||
          (!v.videoSrc.includes(".convex.cloud/api/storage") && !v.videoSrc.startsWith("/vids/")))
      ) {
        videoUrl = v.videoSrc;
      }

      return {
        id: v._id,
        _id: v._id,
        title: v.title,
        category: v.category as 'Commercial' | 'Music Video' | 'Narrative' | 'Documentary' | 'Fashion',
        clientOrArtist: v.clientOrArtist,
        year: v.year,
        duration: v.duration,
        role: v.role,
        aspectRatio: v.aspectRatio,
        resolution: v.resolution,
        videoSrc: videoUrl,
        r2Key: v.r2Key,
        description: v.description,
        gradient: v.gradient,
        timecode: v.timecode,
        order: v.order,
        _creationTime: v._creationTime,
      };
    });
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    clientOrArtist: v.string(),
    year: v.string(),
    duration: v.string(),
    role: v.string(),
    aspectRatio: v.string(),
    resolution: v.string(),
    videoSrc: v.optional(v.string()),
    r2Key: v.optional(v.string()),
    description: v.string(),
    gradient: v.string(),
    timecode: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // If order is not specified, place it at the end of the existing list
    let order = args.order;
    if (order === undefined) {
      const all = await ctx.db.query("videos").take(100);
      const maxOrder = all.reduce((max, v) => Math.max(max, v.order ?? 0), -1);
      order = maxOrder + 1;
    }

    const id = await ctx.db.insert("videos", {
      title: args.title,
      category: args.category,
      clientOrArtist: args.clientOrArtist,
      year: args.year,
      duration: args.duration,
      role: args.role,
      aspectRatio: args.aspectRatio,
      resolution: args.resolution,
      videoSrc: args.videoSrc ?? "",
      r2Key: args.r2Key,
      description: args.description,
      gradient: args.gradient,
      timecode: args.timecode,
      order,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("videos"),
    title: v.string(),
    category: v.string(),
    clientOrArtist: v.string(),
    year: v.string(),
    duration: v.string(),
    role: v.string(),
    aspectRatio: v.string(),
    resolution: v.string(),
    videoSrc: v.optional(v.string()),
    r2Key: v.optional(v.string()),
    description: v.string(),
    gradient: v.string(),
    timecode: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      category: args.category,
      clientOrArtist: args.clientOrArtist,
      year: args.year,
      duration: args.duration,
      role: args.role,
      aspectRatio: args.aspectRatio,
      resolution: args.resolution,
      videoSrc: args.videoSrc !== undefined ? args.videoSrc : existing.videoSrc,
      r2Key: args.r2Key !== undefined ? args.r2Key : existing.r2Key,
      description: args.description,
      gradient: args.gradient,
      timecode: args.timecode,
      order: args.order !== undefined ? args.order : existing.order,
    });

    return args.id;
  },
});

export const reorder = mutation({
  args: {
    orderedIds: v.array(v.id("videos")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { order: i });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("videos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.id);
    if (!video) return;
    await ctx.db.delete(args.id);
  },
});

export const seedInitialVideos = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("videos").first();
    if (existing) {
      return { count: 0, message: "Videos already exist" };
    }

    const defaultVideos = [
      {
        title: 'SOLARIS MUSIC FESTIVAL',
        category: 'Music Video',
        clientOrArtist: 'Live & Sound Experience',
        year: '2025',
        duration: '04:44',
        role: 'Director & DP',
        aspectRatio: '16:9',
        resolution: '4K UHD',
        videoSrc: '/vids/festival.mp4',
        description: 'Electrifying open-air festival experience capturing crowd energy, stage pyrotechnics, and live artist performances.',
        gradient: 'from-fuchsia-950 via-purple-900 to-black',
        timecode: '00:04:44:12',
        order: 0,
      },
      {
        title: 'CHROMATIC REEL // COLOR GRADING',
        category: 'Commercial',
        clientOrArtist: 'Post-Production Studio',
        year: '2026',
        duration: '00:29',
        role: 'Lead Colorist',
        aspectRatio: '16:9',
        resolution: '4K DCI',
        videoSrc: '/vids/color-grading.mp4',
        description: 'Color science breakdown showcasing dynamic range preservation, tonal contrast, and film emulation aesthetics.',
        gradient: 'from-amber-950 via-neutral-900 to-black',
        timecode: '00:00:29:18',
        order: 1,
      },
      {
        title: 'VELOCITY // AUTOMOTIVE DRIFT',
        category: 'Commercial',
        clientOrArtist: 'Motorsport & Performance',
        year: '2025',
        duration: '00:14',
        role: 'Director & Cinematographer',
        aspectRatio: '9:16',
        resolution: '4K Vertical',
        videoSrc: '/vids/cars.mp4',
        description: 'High-speed track footage capturing precision drifts, asphalt burnouts, and raw kinetic horsepower.',
        gradient: 'from-red-950 via-neutral-900 to-black',
        timecode: '00:00:14:06',
        order: 2,
      },
      {
        title: 'CELEBRA // NIGHTLIFE MOMENTS',
        category: 'Documentary',
        clientOrArtist: 'Cultural Archives',
        year: '2025',
        duration: '00:32',
        role: 'Director & Camera Operator',
        aspectRatio: '9:16',
        resolution: '4K Vertical',
        videoSrc: '/vids/celebra.mp4',
        description: 'Candid celebration vignette capturing authentic laughter, nocturnal rhythms, and vibrant street life.',
        gradient: 'from-emerald-950 via-slate-900 to-black',
        timecode: '00:00:32:15',
        order: 3,
      },
      {
        title: 'SMOKE & SHADOWS',
        category: 'Narrative',
        clientOrArtist: 'Independent Cinema',
        year: '2025',
        duration: '00:20',
        role: 'Director & DP',
        aspectRatio: '9:16',
        resolution: '4K Vertical',
        videoSrc: '/vids/cigaretts.mp4',
        description: 'Atmospheric neo-noir vignette exploring cinematic chiaroscuro lighting, rising smoke, and quiet tension.',
        gradient: 'from-zinc-900 via-neutral-900 to-black',
        timecode: '00:00:20:08',
        order: 4,
      },
      {
        title: 'CREPOLIO // URBAN FLAVORS',
        category: 'Commercial',
        clientOrArtist: 'Artisanal Culinary Brand',
        year: '2025',
        duration: '00:36',
        role: 'Director & Food Stylist',
        aspectRatio: '9:16',
        resolution: '4K Vertical',
        videoSrc: '/vids/crepolio.mp4',
        description: 'Dynamic culinary showcase capturing sizzle, golden textures, and mouthwatering artisanal street food craft.',
        gradient: 'from-amber-900 via-orange-950 to-black',
        timecode: '00:00:36:20',
        order: 5,
      },
      {
        title: 'INTERSPE // EXPERIMENTAL MOTION',
        category: 'Fashion',
        clientOrArtist: 'Avant-Garde Studio',
        year: '2025',
        duration: '01:07',
        role: 'Visual Director',
        aspectRatio: '1:1',
        resolution: '2K Square',
        videoSrc: '/vids/interspe.mp4',
        description: 'Abstract visual exploration blending structured choreography, textural lighting, and sound-driven pacing.',
        gradient: 'from-cyan-950 via-blue-950 to-black',
        timecode: '00:01:07:14',
        order: 6,
      },
      {
        title: 'ROAD TO GLORY // OLYMPIC SPIRIT',
        category: 'Documentary',
        clientOrArtist: 'Athletic Federation',
        year: '2024',
        duration: '01:36',
        role: 'Director of Photography',
        aspectRatio: '9:16',
        resolution: '4K Vertical',
        videoSrc: '/vids/olympics.mp4',
        description: 'Inspiring documentary feature focusing on athlete dedication, relentless training, and stadium triumphs.',
        gradient: 'from-blue-950 via-indigo-950 to-black',
        timecode: '00:01:36:22',
        order: 7,
      },
      {
        title: 'LA SORTIE // ESCAPE',
        category: 'Narrative',
        clientOrArtist: 'Short Film Festival',
        year: '2024',
        duration: '00:53',
        role: 'Writer & Director',
        aspectRatio: '16:9',
        resolution: '1080p HD',
        videoSrc: '/vids/sortie.mp4',
        description: 'A tense cinematic scene tracking an impromptu departure under the glow of midnight streetlights.',
        gradient: 'from-slate-900 via-neutral-900 to-black',
        timecode: '00:00:53:10',
        order: 8,
      },
    ];

    for (const vid of defaultVideos) {
      await ctx.db.insert("videos", vid);
    }

    return { count: defaultVideos.length, message: "Sample videos successfully seeded" };
  },
});
