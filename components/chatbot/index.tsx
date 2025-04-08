"use client";

import assert from "assert";

import { experimental_useObject as useObject } from "ai/react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { useGlobalState } from "@/app/(main)/o/[slug]/context";
import {
  conversationMessagesResponseSchema,
  CreateConversationMessageRequest,
  createConversationMessageResponseSchema,
  SearchSettings,
} from "@/lib/api";
import { getEnabledModels, getProviderForModel, LLMModel, modelSchema } from "@/lib/llm/types";

import AssistantMessage from "./assistant-message";
import ChatInput from "./chat-input";
import { SourceMetadata } from "./types";

type AiMessage = { content: string; role: "assistant"; id?: string; sources: SourceMetadata[]; model?: LLMModel };
type UserMessage = { content: string; role: "user" };
type SystemMessage = { content: string; role: "system" };
type Message = AiMessage | UserMessage | SystemMessage;

const UserMessage = ({ content }: { content: string }) => (
  <div className="mb-6 rounded-md px-4 py-2 self-end bg-[#F5F5F7]">{content}</div>
);

interface Props {
  conversationId: string;
  tenant: {
    name: string;
    logoUrl?: string | null;
    slug: string;
    id: string;
    enabledModels: LLMModel[];
    defaultModel: LLMModel | null;
    searchSettings: SearchSettings | null;
  };
  initMessage?: string;
  onSelectedDocumentId: (id: string) => void;
}

export default function Chatbot({ tenant, conversationId, initMessage, onSelectedDocumentId }: Props) {
  const [localInitMessage, setLocalInitMessage] = useState(initMessage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sourceCache, setSourceCache] = useState<Record<string, SourceMetadata[]>>({});
  const [pendingMessage, setPendingMessage] = useState<null | { id: string; model: LLMModel }>(null);
  const pendingMessageRef = useRef<null | { id: string; model: LLMModel }>(null);
  pendingMessageRef.current = pendingMessage;
  const { initialModel } = useGlobalState();

  const tenantSearchSettings = tenant.searchSettings;
  const enabledModels = getEnabledModels(tenant.enabledModels);
  const [isBreadth, setIsBreadth] = useState(tenantSearchSettings?.isBreadth ?? false);
  const [rerankEnabled, setRerankEnabled] = useState(tenantSearchSettings?.rerankEnabled ?? false);
  const [prioritizeRecent, setPrioritizeRecent] = useState(tenantSearchSettings?.prioritizeRecent ?? false);

  const [selectedModel, setSelectedModel] = useState<LLMModel>(() => {
    if (enabledModels.length > 0) {
      const parsed = modelSchema.safeParse(initialModel);
      if (parsed.success && enabledModels.includes(initialModel)) {
        return initialModel;
      }
      // if initial model from global state is no longer enabled by this tenant, change to one that is
      return tenant.defaultModel || enabledModels[0];
    }
    return initialModel;
  });

  // Load user settings from localStorage after initial render and tenant settings are loaded
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        // Apply user settings only if overrides are allowed
        if (!tenantSearchSettings || tenantSearchSettings.overrideBreadth) {
          setIsBreadth(settings.isBreadth ?? false);
        }
        if (!tenantSearchSettings || tenantSearchSettings.overrideRerank) {
          setRerankEnabled(settings.rerankEnabled ?? false);
        }
        if (!tenantSearchSettings || tenantSearchSettings.overridePrioritizeRecent) {
          setPrioritizeRecent(settings.prioritizeRecent ?? false);
        }
        // Model selection is always allowed
        const savedModel = settings.selectedModel;
        const parsed = modelSchema.safeParse(savedModel);
        if (parsed.success && enabledModels.includes(savedModel)) {
          setSelectedModel(savedModel);
        } else {
          setSelectedModel(tenant.defaultModel || enabledModels[0]);
        }
      }
    }
  }, [enabledModels, tenantSearchSettings]);

  // Save user settings to localStorage whenever they change
  useEffect(() => {
    // Only save settings that can be overridden
    const settingsToSave = {
      selectedModel,
      ...(tenantSearchSettings?.overrideBreadth ? { isBreadth } : {}),
      ...(tenantSearchSettings?.overrideRerank ? { rerankEnabled } : {}),
      ...(tenantSearchSettings?.overridePrioritizeRecent ? { prioritizeRecent } : {}),
    };

    localStorage.setItem("chatSettings", JSON.stringify(settingsToSave));
  }, [isBreadth, rerankEnabled, prioritizeRecent, selectedModel, tenantSearchSettings]);

  const { isLoading, object, submit } = useObject({
    api: `/api/conversations/${conversationId}/messages`,
    schema: createConversationMessageResponseSchema,
    fetch: async function middleware(input: RequestInfo | URL, init?: RequestInit) {
      const res = await fetch(input, {
        ...init,
        headers: { ...init?.headers, tenant: tenant.slug },
      });
      const id = res.headers.get("x-message-id");
      const model = res.headers.get("x-model");

      assert(id);

      setPendingMessage({ id, model: model as LLMModel });
      return res;
    },
    onError: console.error,
    onFinish: (event) => {
      if (!event.object) return;

      const content = event.object.message;
      const model = pendingMessageRef.current?.model;
      setMessages((prev) => [...prev, { content: content, role: "assistant", sources: [], model }]);
    },
  });

  const handleSubmit = (content: string, model: LLMModel) => {
    const provider = getProviderForModel(model);
    if (!provider) {
      return;
    }

    const payload: CreateConversationMessageRequest = {
      conversationId,
      content,
      model,
      isBreadth,
      rerankEnabled,
      prioritizeRecent,
    };
    setMessages([...messages, { content, role: "user" }]);
    submit(payload);
  };

  useEffect(() => {
    if (!pendingMessage || isLoading) return;

    const copy = [...messages];
    const last = copy.pop();
    if (last?.role === "assistant") {
      setMessages([...copy, { ...last, id: pendingMessage.id }]);
      setPendingMessage(null);
    }
  }, [pendingMessage, isLoading, messages]);

  useEffect(() => {
    if (!pendingMessage) return;

    (async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages/${pendingMessage.id}`, {
        headers: { tenant: tenant.slug },
      });
      if (!res.ok) return;

      const json = (await res.json()) as { id: string; sources: SourceMetadata[] };
      setSourceCache((prev) => ({ ...prev, [json.id]: json.sources }));
    })();
  }, [conversationId, pendingMessage, tenant.slug]);

  useEffect(() => {
    if (localInitMessage) {
      handleSubmit(localInitMessage, selectedModel);
      setLocalInitMessage(undefined);
    } else {
      (async () => {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          headers: { tenant: tenant.slug },
        });
        if (!res.ok) throw new Error("Could not load conversation");
        const json = await res.json();
        const messages = conversationMessagesResponseSchema.parse(json);
        setMessages(messages);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally run once
  }, []);

  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    container.current?.scrollTo({
      top: container.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const messagesWithSources = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => (m.role === "assistant" && m.id && sourceCache[m.id] ? { ...m, sources: sourceCache[m.id] } : m)),
    [messages, sourceCache],
  );

  // Ensure selected model is in enabled models list
  useEffect(() => {
    if (!enabledModels.includes(selectedModel)) {
      // Update to first enabled model
      if (tenant.defaultModel && enabledModels.includes(tenant.defaultModel)) {
        setSelectedModel(tenant.defaultModel);
      } else {
        setSelectedModel(enabledModels[0]);
      }
    }
  }, [selectedModel, enabledModels, tenant.defaultModel]);

  return (
    <div className="flex h-full w-full items-center flex-col">
      <div ref={container} className="flex flex-col h-full w-full items-center overflow-y-auto">
        <div className="flex flex-col h-full w-full p-4 max-w-[717px]">
          {messagesWithSources.map((message, i) =>
            message.role === "user" ? (
              <UserMessage key={i} content={message.content} />
            ) : (
              <Fragment key={i}>
                <AssistantMessage
                  name={tenant.name}
                  logoUrl={tenant.logoUrl}
                  content={message.content}
                  id={message.id}
                  sources={message.sources}
                  onSelectedDocumentId={onSelectedDocumentId}
                  model={message.model || selectedModel}
                  isGenerating={false}
                  tenantId={tenant.id}
                />
              </Fragment>
            ),
          )}
          {isLoading && (
            <AssistantMessage
              name={tenant.name}
              logoUrl={tenant.logoUrl}
              content={object?.message}
              id={pendingMessage?.id}
              sources={[]}
              onSelectedDocumentId={onSelectedDocumentId}
              model={pendingMessage?.model || selectedModel}
              isGenerating
              tenantId={tenant.id}
            />
          )}
        </div>
      </div>
      <div className="p-4 w-full flex justify-center max-w-[717px]">
        <div className="flex flex-col w-full p-2 pl-4 rounded-[16px] border border-[#D7D7D7]">
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
            enabledModels={enabledModels}
            tenantSearchSettings={tenantSearchSettings || undefined}
          />
        </div>
      </div>
    </div>
  );
}
