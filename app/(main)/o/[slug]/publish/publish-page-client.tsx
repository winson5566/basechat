"use client";

import { Copy } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ChromePluginIllustration from "@/public/icons/chromeplugin-option.svg";
import IframeIllustration from "@/public/icons/iframe-option.svg";

interface PublishPageClientProps {
  tenantName: string;
  tenantId: string;
  tenantSlug: string;
  chatbotUrl: string;
  widgetSnippet: string;
}

export default function PublishPageClient({
  tenantName,
  tenantId,
  tenantSlug,
  chatbotUrl,
  widgetSnippet,
}: PublishPageClientProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<"widget" | "extension">("widget");

  const handleCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      toast.success("Copied");
    } catch (error) {
      toast.error("Copy failed. Please try again.");
    }
  };

  const handleInstallClick = () => {
    window.open("https://chromewebstore.google.com/detail/smartchat-widget/bfhdfpmoohlijnhmeohjmlncjfmefdkc", "_blank");
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2 mt-4">
        <h1 className="text-3xl font-semibold text-[#1D1D1F]">Embed on website</h1>
        <p className="text-base text-muted-foreground">Choose the way to embed Smart Chat to your website</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          aria-label="Script embed option"
          aria-pressed={selectedOption === "widget"}
          onClick={() => setSelectedOption("widget")}
          className={`flex h-80 items-center justify-center rounded-2xl border-2 p-6 transition focus:outline-none ${
            selectedOption === "widget"
              ? "border-[#2563EB] bg-white shadow-lg"
              : "border-transparent bg-[#F5F5F7] hover:border-[#CBD5F5]"
          }`}
        >
          <Image src={IframeIllustration} alt="Script embed" className="h-full w-full object-contain" />
        </button>
        <button
          type="button"
          aria-label="Chrome extension option"
          aria-pressed={selectedOption === "extension"}
          onClick={() => setSelectedOption("extension")}
          className={`flex h-80 items-center justify-center rounded-2xl border-2 p-6 transition focus:outline-none ${
            selectedOption === "extension"
              ? "border-[#2563EB] bg-white shadow-lg"
              : "border-transparent bg-[#F5F5F7] hover:border-[#CBD5F5]"
          }`}
        >
          <Image src={ChromePluginIllustration} alt="Chrome extension" className="h-full w-full object-contain" />
        </button>
      </div>

      {selectedOption === "widget" && (
        <Card className="border border-[#E4E7EC] bg-white">
          <CardContent className="space-y-4 p-6">
            <Button
              className="w-full bg-[#1D4ED8] text-white hover:bg-[#1E40AF]"
              onClick={() => handleCopy(widgetSnippet, "widget-top")}
            >
              Copy Script
            </Button>
            <div className="rounded-xl bg-[#F8FAFC] p-4 text-sm text-[#475467]">
              <div className="mb-2 flex items-center justify-between font-medium text-[#1D1D1F]">
                <span>To add a chat app to the bottom right of your website add this code to your html</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(widgetSnippet, "widget")}
                  className={copiedKey === "widget" ? "text-[#2563EB]" : "text-[#475467]"}
                  aria-label="Copy script snippet"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <div className="rounded-lg border border-[#D0D5DD] bg-white p-3 font-mono text-sm text-[#1D1D1F]">
                {widgetSnippet}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedOption === "extension" && (
        <Card className="border border-[#E4E7EC] bg-white">
          <CardContent className="space-y-4 p-6">
            <Button className="w-full bg-[#1D4ED8] text-white hover:bg-[#1E40AF]" onClick={handleInstallClick}>
              Install SmartChat Chrome Extension
            </Button>
            <div className="rounded-xl bg-[#F1F5F9] p-4 text-sm text-[#475467]">
              <div className="mb-2 flex items-center justify-between font-medium text-[#1D1D1F]">
                <span>Copy the URL into the extension</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(chatbotUrl, "chatbot")}
                  className={copiedKey === "chatbot" ? "text-[#2563EB]" : "text-[#475467]"}
                  aria-label="Copy chatbot URL"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <div className="rounded-lg border border-[#D0D5DD] bg-white p-3 font-mono text-sm text-[#1D1D1F]">
                {chatbotUrl}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
