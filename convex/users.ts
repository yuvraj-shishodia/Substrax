import {mutation, query} from "./_generated/server";
import {v} from "convex/values"


export const createusers = mutation({
    args:{
        email: v.string(),
        name: v.string(),
        clerkId: v.string()
    },
})