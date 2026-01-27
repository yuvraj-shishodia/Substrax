import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { api } from "./_generated/api";


const http = httpRouter();

const clerkWebhook = httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
        throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable")
    }

    const svix_id = request.headers.get("svix-id")
    const svix_signature = request.headers.get("svix-signature")
    const svix_timestamp = request.headers.get("svix-timestamp")
    if(!svix_id || !svix_signature || !svix_timestamp) {
        return new Response("Error occurred -- no svix headers", {
            status: 400,
        })
    }

    // Use raw body for Svix signature verification.
    const body = await request.text();

    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.log("Error verifying webhook", err);
        return new Response("Error occurred", { status: 400 });
    }

    const eventType = evt.type;

    if(eventType === "user.created") {
        const { id, email_addresses, first_name, last_name} = evt.data;
        const email = email_addresses[0]?.email_address;
        if (!email) {
            return new Response("Missing email address", { status: 400 });
        }
        const name = `${first_name || ""} ${last_name || ""}`.trim();

        try {
            await ctx.runMutation(api.users.createUser, {
                email,
                name,
                clerkId: id,
            });
            //todo create stripe customer as well
            //send welcome email
        } catch (error) {
            console.error("Error creating USER IN convex", error);
            return new Response("Error creating user", { status: 500 });
        }

    }
    return new Response("Webhook processed successfully", { status:200 });
});

http.route({
    path:"/clerk-webhook",
    method:"POST",
    handler: clerkWebhook
})

export default http
