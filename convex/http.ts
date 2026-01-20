import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server"



const http = httpRouter();

const clerkWebhook = httpAction(async (ctx,request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
        throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable")
    }

    const svix_id = request.headers.get("svix-id")
    const svix_signature = request.headers.get("svix-signature")
    const svix_timestamp = request.headers.get("svix-timestamp")
    if(!svix_id || !svix_signature || !svix_timestamp) {
        return new Response("Error occured -- no svix headers", {
            status: 400,
        })
    }

    const payload = await request.json();
    const body =  JSON.stringify(payload);

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
        return new Response("Error occured", { status: 400 });
    }

    try {
        //todo: create the user save it to the db
    } catch (error) {
        console.error("Error handling webhook", error);
        return new Response("Error occured", { status: 500 });
    }

    return new Response("OK", { status: 200 });
});

http.route({
    path:"/clerk-webhook",
    method:"POST",
    handler: clerkWebhook
})

export default http
