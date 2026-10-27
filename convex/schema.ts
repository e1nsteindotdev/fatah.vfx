import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  videos: defineTable({
    title: v.string(),
    category: v.string(),
    clientOrArtist: v.string(),
    year: v.string(),
    duration: v.string(),
    role: v.string(),
    aspectRatio: v.string(),
    resolution: v.string(),
    videoSrc: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    description: v.string(),
    gradient: v.string(),
    timecode: v.string(),
    order: v.optional(v.number()),
  }).index("by_order", ["order"]),
  profile: defineTable({
    name: v.string(),
    title: v.string(),
    tagline: v.optional(v.string()),
    email: v.string(),
    description: v.string(),
    handle: v.optional(v.string()),
    location: v.optional(v.string()),
  }),
});
