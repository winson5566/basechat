import { NextRequest } from "next/server";

import { saveConnection } from "@/lib/service";
import { RAGIE_WEBHOOK_SECRET } from "@/lib/settings";
import { validateSignature } from "@/lib/utils";

interface WebhookEvent {
  type: string;
  payload: any;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-signature");
  if (!signature) {
    return Response.json({ message: "missing signature" }, { status: 400 });
  }

  const buffer = await request.arrayBuffer();

  const isValid = await validateSignature(RAGIE_WEBHOOK_SECRET, buffer, signature);
  if (!isValid) {
    return Response.json({ message: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(new TextDecoder("utf-8").decode(buffer)) as WebhookEvent;

  // Ignore all other webhooks
  if (
    event.type !== "connection_sync_started" &&
    event.type !== "connection_sync_progress" &&
    event.type !== "connection_sync_finished"
  ) {
    return Response.json({ message: "success" });
  }

  const status =
    event.type === "connection_sync_started" || event.type === "connection_sync_progress" ? "syncing" : "ready";

  await saveConnection(event.payload.connection_id, status);

  return Response.json({ message: "success" });
}
