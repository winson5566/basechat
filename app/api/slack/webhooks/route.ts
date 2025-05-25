import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getTenantBySlackTeamId } from "@/lib/server/service";
import { SLACK_SIGNING_SECRET } from "@/lib/server/settings";

// Slack signing secret - this should be stored in environment variables

interface SlackEvent {
  type: string;
  event_id?: string;
  event_time?: number;
  team_id?: string;
  api_app_id?: string;
  event?: {
    type: string;
    channel?: string;
    user?: string;
    text?: string;
    ts?: string;
    thread_ts?: string;
    bot_id?: string;
    subtype?: string;
    [key: string]: any;
  };
  challenge?: string;
  token?: string;
}

interface SlackUrlVerification {
  type: "url_verification";
  challenge: string;
  token: string;
}

// Verify that the request came from Slack
function verifySlackSignature(signingSecret: string, body: string, timestamp: string, signature: string): boolean {
  if (!signingSecret) {
    console.error("Slack signing secret not configured");
    return false;
  }

  // Check if timestamp is not older than 5 minutes
  const time = Math.floor(new Date().getTime() / 1000);
  if (Math.abs(time - parseInt(timestamp)) > 300) {
    console.error("Request timestamp too old");
    return false;
  }

  // Create signature
  const hmac = crypto.createHmac("sha256", signingSecret);
  const [version, hash] = signature.split("=");
  hmac.update(`${version}:${timestamp}:${body}`);
  const expectedHash = hmac.digest("hex");

  // Compare signatures
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
}

// Handle different types of Slack events
async function handleSlackEvent(event: SlackEvent["event"]): Promise<void> {
  if (!event) return;

  console.log(`Handling Slack event: ${event.type}`, event);

  switch (event.type) {
    case "message":
      await handleMessage(event);
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

async function handleMessage(event: any): Promise<void> {
  console.log("Processing message event:", {
    channel: event.channel,
    user: event.user,
    text: event.text,
    timestamp: event.ts,
    thread_ts: event.thread_ts,
    bot_id: event.bot_id,
    subtype: event.subtype,
  });

  // Skip bot messages to avoid loops
  if (event.bot_id || event.subtype === "bot_message") {
    console.log("Skipping bot message");
    return;
  }

  // Add your message processing logic here
  // For example: save to database, trigger AI response, etc.

  // Example: Log the message
  console.log(`User ${event.user} said: ${event.text} in channel ${event.channel}`);
}

async function handleAppMention(event: any): Promise<void> {
  console.log("Processing app mention:", {
    channel: event.channel,
    user: event.user,
    text: event.text,
    timestamp: event.ts,
    team: event.team,
  });

  const { slackBotToken } = await getTenantBySlackTeamId(event.team);

  try {
    // Remove the bot mention from the text to get the actual message
    const mentionRegex = /<@[A-Z0-9]+>/g;
    const cleanText = event.text?.replace(mentionRegex, "").trim();

    // Create the echo response
    const echoMessage = cleanText ? `Echo: ${cleanText}` : "Echo: (no message)";

    // Send the echo response back to the channel
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: event.channel,
        text: echoMessage,
        thread_ts: event.ts, // Reply in thread to the original message
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error("Failed to send Slack message:", result.error);
    } else {
      console.log("Echo message sent successfully");
    }
  } catch (error) {
    console.error("Error sending echo message:", error);
  }
}

async function handleMemberJoinedChannel(event: any): Promise<void> {
  console.log("Member joined channel:", {
    channel: event.channel,
    user: event.user,
  });

  // Add your member joined logic here
  // For example: send welcome message, notify admins, etc.
}

async function handleMemberLeftChannel(event: any): Promise<void> {
  console.log("Member left channel:", {
    channel: event.channel,
    user: event.user,
  });

  // Add your member left logic here
}

async function handleReactionAdded(event: any): Promise<void> {
  console.log("Reaction added:", {
    user: event.user,
    reaction: event.reaction,
    item: event.item,
  });

  // Add your reaction added logic here
}

async function handleReactionRemoved(event: any): Promise<void> {
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

    const slackEvent: SlackEvent = JSON.parse(body);

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
