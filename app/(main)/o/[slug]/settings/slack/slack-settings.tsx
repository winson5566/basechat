"use client";

import { Loader2, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import * as schema from "@/lib/server/db/schema";

type Props = {
  tenant: typeof schema.tenants.$inferSelect;
  slackConfigured: boolean;
};

export default function SlackSettings({ tenant, slackConfigured }: Props) {
  const [isLoading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle OAuth callback success/error messages
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      toast.success("Successfully connected to Slack!");
    } else if (error) {
      let errorMessage = "Failed to connect to Slack";
      switch (error) {
        case "oauth_not_configured":
          errorMessage = "Slack OAuth is not configured on the server";
          break;
        case "missing_code_or_state":
          errorMessage = "Invalid authorization response from Slack";
          break;
        case "callback_failed":
          errorMessage = "Failed to complete Slack authorization";
          break;
        default:
          errorMessage = `Slack authorization failed: ${error}`;
      }
      toast.error(errorMessage);
    }
  }, [searchParams]);

  async function handleConnectSlack() {
    window.location.href = `/api/slack/oauth?tenant=${tenant.slug}`;
  }

  async function handleDisconnectSlack() {
    setLoading(true);
    try {
      const response = await fetch("/api/tenants/current", {
        method: "PATCH",
        headers: {
          tenant: tenant.slug,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slackEnabled: false,
          slackBotToken: null,
          slackTeamId: null,
          slackTeamName: null,
        }),
      });

      if (!response.ok) throw new Error("Failed to disconnect");

      toast.success("Disconnected from Slack");
      window.location.reload(); // Simple way to refresh the state
    } catch (error) {
      toast.error("Failed to disconnect from Slack");
    } finally {
      setLoading(false);
    }
  }

  const isConnected = tenant.slackEnabled && tenant.slackBotToken;

  return (
    <div className="w-full p-4 flex-grow flex flex-col relative">
      <div className="flex w-full justify-between items-center mb-16">
        <h1 className="font-bold text-[32px] text-[#343A40]">Slack Integration</h1>
      </div>

      <div className="space-y-8 max-w-2xl">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#343A40]">Connect your Slack workspace</h2>
          <p className="text-sm text-muted-foreground">
            Add our AI assistant to your Slack workspace to enable chat interactions and notifications directly in
            Slack.
          </p>
        </div>

        {!slackConfigured ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-medium text-yellow-800">Slack OAuth Not Configured</h3>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              The administrator needs to configure Slack OAuth credentials (SLACK_CLIENT_ID and SLACK_CLIENT_SECRET) to
              enable Slack integration.
            </p>
          </div>
        ) : isConnected ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-green-800">Connected to Slack</h3>
              </div>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Workspace: <strong>{tenant.slackTeamName || "Unknown"}</strong>
                </p>
                <p>Your AI assistant is ready to use in Slack!</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-[#343A40]">Integration Status</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bot Status:</span>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Workspace:</span>
                  <span className="text-sm font-medium">{tenant.slackTeamName || "Unknown"}</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                onClick={handleDisconnectSlack}
                disabled={isLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
                Disconnect from Slack
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Getting Started</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Click &quot;Connect to Slack&quot; below</li>
                <li>2. Choose your Slack workspace</li>
                <li>3. Authorize the AI assistant bot</li>
                <li>4. Start chatting with the bot in any channel!</li>
              </ol>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleConnectSlack}
                disabled={isLoading}
                className="bg-[#4A154B] hover:bg-[#4A154B]/90 text-white"
              >
                {isLoading ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <ExternalLink size={16} className="mr-2" />
                )}
                Connect to Slack
              </Button>
            </div>
          </div>
        )}

        {slackConfigured && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-medium text-[#343A40] mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              After connecting, you can interact with the AI assistant by mentioning it in any channel where it&apos;s
              added, or by sending direct messages to the bot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
