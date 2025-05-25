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

import { getTenantBySlackTeamId } from "@/lib/server/service";
import { SLACK_SIGNING_SECRET } from "@/lib/server/settings";
import { verifySlackSignature } from "@/lib/server/slack";

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

  console.log("Processing message event:", {
    channel: event.channel,
    user: event.user,
    text: event.text,
    timestamp: event.ts,
    thread_ts: event.thread_ts,
    bot_id: event.bot_id,
    subtype: event.subtype,
  });

  // Add your message processing logic here
  // For example: save to database, trigger AI response, etc.

  // Example: Log the message
  console.log(`User ${event.user} said: ${event.text} in channel ${event.channel}`);
}

async function handleAppMention(event: AppMentionEvent): Promise<void> {
  console.log("Processing app mention:", {
    channel: event.channel,
    user: event.user,
    text: event.text,
    timestamp: event.ts,
    team: event.team,
  });

  if (!event.team) {
    console.error("No team ID found in app mention event");
    return;
  }

  const { slackBotToken } = await getTenantBySlackTeamId(event.team);

  if (!slackBotToken) {
    console.error("No Slack bot token found for team:", event.team);
    return;
  }

  try {
    // Create Slack client using the utility function
    const slack = new WebClient(slackBotToken);

    // Remove the bot mention from the text to get the actual message
    const mentionRegex = /<@[A-Z0-9]+>/g;
    const cleanText = event.text?.replace(mentionRegex, "").trim();

    // Create the echo response
    const echoMessage = cleanText ? `Echo: ${cleanText}` : "Echo: (no message)";

    // Send the echo response back to the channel using the utility function
    const result = await slack.chat.postMessage({
      channel: event.channel,
      text: echoMessage,
      thread_ts: event.ts,
    });

    if (result.ok) {
      console.log("Echo message sent successfully");
    } else {
      console.error("Failed to send Slack message:", result.error);
    }
  } catch (error) {
    console.error("Error sending echo message:", error);
  }
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
      await handleSlackEvent(slackEvent.event);

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
