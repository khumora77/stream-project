import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  const wh = new Webhook(SIGNING_SECRET);

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.log("Error: Could not verify webhook:", err);
    return new Response("Error: Verefication error", { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.created") {
    await db.user.create({
      data: {
        clerkId: evt.data.id,
        username: evt.data.username!,
        avatar: evt.data.image_url,
        fullName: `${evt.data.first_name} ${evt.data.last_name}`,
        bio: "Bio is not provided!!!",
      },
    });
  }
  if (eventType === "user.updated") {
    await db.user.update({
      where: { clerkId: evt.data.id },
      data: {
        username: evt.data.username!,
        avatar: evt.data.image_url,
        fullName: `${evt.data.first_name} ${evt.data.last_name}`,
        bio: "Bio is not provided!!!",
      },
    });
  }
  if (eventType === "user.deleted") {
    await db.user.delete({
      where: { clerkId: evt.data.id },
    });
  }

  return new Response("Webhook received", { status: 200 });
}