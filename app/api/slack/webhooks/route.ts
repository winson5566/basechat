import assert from "assert";

import {
  AllMessageEvents,
  AppMentionEvent,
  MemberJoinedChannelEvent,
  MemberLeftChannelEvent,
  ReactionAddedEvent,
  ReactionRemovedEvent,
  SlackEvent,
} from "@slack/types";
import { WebClient } from "@slack/web-api";
import { NextRequest, NextResponse } from "next/server";

import { SLACK_SIGNING_SECRET } from "@/lib/server/settings";
import { verifySlackSignature } from "@/lib/server/slack";

import ConversationManager from "./conversation-manager";
import BaseGenerator from "./generator";
import { slackSignIn } from "./utils";

// Webhook payload wrapper types (these are specific to webhook delivery, not individual events)
interface SlackWebhookPayload {
  type: "event_callback" | "url_verification";
  event_id?: string;
  event_time?: number;
  team_id?: string;
  api_app_id?: string;
  event?: SlackEvent;
  challenge?: string;
  token?: string;
}

interface SlackUrlVerification {
  type: "url_verification";
  challenge: string;
  token: string;
}

// Handle different types of Slack events
async function handleSlackEvent(event: SlackEvent | undefined): Promise<void> {
  if (!event) return;

  console.log(`Handling Slack event: ${event.type}`, event);

  switch (event.type) {
    case "message":
      await handleMessage(event as AllMessageEvents);
      break;

    case "app_mention":
      await handleAppMention(event);
      break;

    case "member_joined_channel":
      await handleMemberJoinedChannel(event);
      break;

    case "member_left_channel":
      await handleMemberLeftChannel(event);
      break;

    case "reaction_added":
      await handleReactionAdded(event);
      break;

    case "reaction_removed":
      await handleReactionRemoved(event);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleMessage(event: AllMessageEvents): Promise<void> {
  // Only handle basic message events that have user and text properties
  if (event.subtype && event.subtype !== undefined) {
    console.log(`Skipping message with subtype: ${event.subtype}`);
    return;
  }

  if (event.bot_id) {
    console.log(`Skipping message from bot`);
    return;
  }

  if (!event.team) {
    throw new Error("No team ID found in message event");
  }

  const { tenant, profile } = await slackSignIn(event.team, event.user);
  assert(tenant.slackBotToken, "expected slack bot token");

  const manager = await ConversationManager.fromMessageEvent(tenant, profile, event);
  const object = await manager.generateObject();
  const slack = new WebClient(tenant.slackBotToken);

  await slack.chat.postMessage({
    channel: event.channel,
    text: object.message,
    thread_ts: event.ts,
  });
}

async function handleAppMention(event: AppMentionEvent): Promise<void> {
  console.log("Processing app mention:", {
    channel: event.channel,
    user: event.user,
    text: event.text,
    timestamp: event.ts,
    team: event.team,
  });
}

async function handleMemberJoinedChannel(event: MemberJoinedChannelEvent): Promise<void> {
  console.log("Member joined channel:", {
    channel: event.channel,
    user: event.user,
  });

  // Add your member joined logic here
  // For example: send welcome message, notify admins, etc.
}

async function handleMemberLeftChannel(event: MemberLeftChannelEvent): Promise<void> {
  console.log("Member left channel:", {
    channel: event.channel,
    user: event.user,
  });

  // Add your member left logic here
}

async function handleReactionAdded(event: ReactionAddedEvent): Promise<void> {
  console.log("Reaction added:", {
    user: event.user,
    reaction: event.reaction,
    item: event.item,
  });

  // Add your reaction added logic here
}

async function handleReactionRemoved(event: ReactionRemovedEvent): Promise<void> {
  console.log("Reaction removed:", {
    user: event.user,
    reaction: event.reaction,
    item: event.item,
  });

  // Add your reaction removed logic here
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const timestamp = request.headers.get("x-slack-request-timestamp");
    const signature = request.headers.get("x-slack-signature");

    // Verify the request came from Slack
    if (SLACK_SIGNING_SECRET && timestamp && signature) {
      const isValid = verifySlackSignature(SLACK_SIGNING_SECRET, body, timestamp, signature);
      if (!isValid) {
        console.error("Invalid Slack signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (SLACK_SIGNING_SECRET) {
      console.error("Missing signature headers");
      return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
    } else {
      console.warn("Slack signing secret not configured - skipping signature verification");
    }

    const slackEvent: SlackWebhookPayload = JSON.parse(body);

    // Handle URL verification challenge
    if (slackEvent.type === "url_verification") {
      const verification = slackEvent as SlackUrlVerification;
      console.log("Handling URL verification challenge");
      return NextResponse.json({ challenge: verification.challenge });
    }

    // Handle event callbacks
    if (slackEvent.type === "event_callback") {
      console.log("Received event callback:", slackEvent.event?.type);

      // Intentional setTimeout so we can respond quickly to the webhook request
      setTimeout(async () => {
        await handleSlackEvent(slackEvent.event);
      }, 0);

      // Always respond quickly to avoid retries
      return NextResponse.json({ ok: true });
    }

    // Handle other event types
    console.log(`Received Slack event type: ${slackEvent.type}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error processing Slack webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: "Slack webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
