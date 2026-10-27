import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const profile = await ctx.db.query("profile").first();
    return profile ?? null;
  },
});

export const update = mutation({
  args: {
    name: v.string(),
    title: v.string(),
    tagline: v.optional(v.string()),
    email: v.string(),
    description: v.string(),
    handle: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("profile").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        title: args.title,
        tagline: args.tagline,
        email: args.email,
        description: args.description,
        handle: args.handle,
        location: args.location,
      });
      return existing._id;
    }
    return await ctx.db.insert("profile", {
      name: args.name,
      title: args.title,
      tagline: args.tagline,
      email: args.email,
      description: args.description,
      handle: args.handle,
      location: args.location,
    });
  },
});
