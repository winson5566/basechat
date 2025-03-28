"use client";

import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { z } from "zod";

import ChatInput from "@/components/chatbot/chat-input";
import Logo from "@/components/tenant/logo/logo";
import { DEFAULT_WELCOME_MESSAGE } from "@/lib/constants";
import { DEFAULT_MODEL, LLMModel } from "@/lib/llm/types";
import { getConversationPath } from "@/lib/paths";
import * as schema from "@/lib/server/db/schema";
import { cn } from "@/lib/utils";
import { getAvatarNumber } from "@/lib/utils";

import { useGlobalState } from "./context";

const inter = Inter({ subsets: ["latin"] });

const conversationResponseSchema = z.object({ id: z.string() });

interface Props {
  tenant: typeof schema.tenants.$inferSelect;
  className?: string;
}

export default function Welcome({ tenant, className }: Props) {
  const router = useRouter();
  const { setInitialMessage, setInitialModel } = useGlobalState();
  const [selectedModel, setSelectedModel] = useState<LLMModel>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.selectedModel ?? DEFAULT_MODEL;
      }
    }
    return DEFAULT_MODEL;
  });
  const [isBreadth, setIsBreadth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.isBreadth ?? false;
      }
    }
    return false;
  });
  const [rerankEnabled, setRerankEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.rerankEnabled ?? false;
      }
    }
    return false;
  });
  const [prioritizeRecent, setPrioritizeRecent] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.prioritizeRecent ?? false;
      }
    }
    return false;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "chatSettings",
      JSON.stringify({
        isBreadth,
        rerankEnabled,
        prioritizeRecent,
        selectedModel,
      }),
    );
  }, [isBreadth, rerankEnabled, prioritizeRecent, selectedModel]);

  const handleSubmit = async (content: string, model: LLMModel = DEFAULT_MODEL) => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        title: content,
        initialModel: model,
        isBreadth,
        rerankEnabled,
        prioritizeRecent,
      }),
      headers: {
        tenant: tenant.slug,
      },
    });
    if (!res.ok) throw new Error("Could not create conversation");

    const json = await res.json();
    const conversation = conversationResponseSchema.parse(json);
    setInitialMessage(content);
    setInitialModel(model);
    router.push(getConversationPath(tenant.slug, conversation.id));
  };

  const questions = [tenant.question1, tenant.question2, tenant.question3].filter(
    (question): question is string => question !== null && question.trim() !== "",
  );

  return (
    <div className={className}>
      <div className={`h-full flex flex-col justify-center ${inter.className}`}>
        <Logo name={tenant.name} url={tenant.logoUrl} width={100} height={100} className="mb-8" tenantId={tenant.id} />
        <h1 className="mb-12 text-3xl lg:text-[40px] font-bold leading-[50px]">
          {(tenant.welcomeMessage || DEFAULT_WELCOME_MESSAGE).replace("{{company.name}}", tenant.name)}
        </h1>
        {questions.length > 0 && (
          <div className="flex flex-col md:flex-row items-stretch justify-evenly space-y-4 md:space-y-0 md:space-x-2">
            {questions.map((question, i) => (
              <div
                key={i}
                className="rounded-md border p-4 w-full md:w-1/3 h-full cursor-pointer"
                onClick={() => handleSubmit(question, selectedModel)}
              >
                {question}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="w-full flex flex-col items-center p-2 pl-4 rounded-[24px] border border-[#D7D7D7] mt-auto">
        <ChatInput
          handleSubmit={handleSubmit}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          isBreadth={isBreadth}
          onBreadthChange={setIsBreadth}
          rerankEnabled={rerankEnabled}
          onRerankChange={setRerankEnabled}
          prioritizeRecent={prioritizeRecent}
          onPrioritizeRecentChange={setPrioritizeRecent}
        />
      </div>
    </div>
  );
}
