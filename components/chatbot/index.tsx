"use client";

import assert from "assert";

import { experimental_useObject as useObject } from "ai/react";
import { Inter } from "next/font/google";
import { Fragment, useEffect, useMemo, useState } from "react";

import { GenerateRequest, GenerateResponseSchema } from "@/lib/schema";

import AssistantMessage from "./assistant-message";
import ChatInput from "./chat-input";
import { SourceMetadata } from "./types";

const inter = Inter({ subsets: ["latin"] });

type AiMessage = { content: string; role: "system"; id?: string; expanded: boolean; sources: SourceMetadata[] };
type UserMessage = { content: string; role: "user" };
type Message = AiMessage | UserMessage;

const UserMessage = ({ content }: { content: string }) => (
  <div className="mb-6 rounded-md px-4 py-2 self-end bg-[#F5F5F7]">{content}</div>
);

interface Props {
  company: string;
  onSelectedDocumentId: (id: string) => void;
}

export default function Chatbot({ company, onSelectedDocumentId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sourceCache, setSourceCache] = useState<Record<string, SourceMetadata[]>>({});
  const [pendingMessage, setPendingMessage] = useState<null | { id: string; expanded: boolean }>(null);

  const { isLoading, object, submit } = useObject({
    api: "/api/generate",
    schema: GenerateResponseSchema,
    fetch: async function middleware(input: RequestInfo | URL, init?: RequestInit) {
      const res = await fetch(input, init);
      const id = res.headers.get("x-message-id");
      const expanded = res.headers.get("x-expanded") ? true : false;

      assert(id);

      setPendingMessage({ id, expanded });
      return res;
    },
    onError: console.error,
    onFinish: (event) => {
      if (!event.object) return;

      const content = event.object.message;
      setMessages((prev) => [...prev, { content: content, role: "system", sources: [], expanded: false }]);
    },
  });

  const handleSubmit = (content: string) => {
    const message: GenerateRequest = { content };
    setMessages([...messages, { ...message, role: "user" }]);
    submit(message);
  };

  useEffect(() => {
    if (!pendingMessage || isLoading) return;

    const copy = [...messages];
    const last = copy.pop();
    if (last?.role === "system") {
      setMessages([...copy, { ...last, id: pendingMessage.id, expanded: pendingMessage.expanded }]);
      setPendingMessage(null);
    }
  }, [pendingMessage, isLoading, messages]);

  useEffect(() => {
    if (!pendingMessage) return;

    (async () => {
      const res = await fetch(`/api/messages/${pendingMessage.id}`);
      if (!res.ok) return;

      const json = (await res.json()) as { id: string; sources: SourceMetadata[] };
      setSourceCache((prev) => ({ ...prev, [json.id]: json.sources }));
    })();
  }, [pendingMessage]);

  const messagesWithSources = useMemo(
    () =>
      messages.map((m) =>
        m.role === "system" && m.id && sourceCache[m.id] ? { ...m, sources: sourceCache[m.id] } : m,
      ),
    [messages, sourceCache],
  );

  return (
    <div className="flex-grow flex flex-col h-full w-full bg-white p-4 max-w-[717px]">
      {messages.length ? (
        <div className="flex-grow flex flex-col">
          {messagesWithSources.map((message, i) =>
            message.role === "user" ? (
              <UserMessage key={i} content={message.content} />
            ) : (
              <Fragment key={i}>
                <AssistantMessage
                  content={message.content}
                  id={message.id}
                  sources={message.sources}
                  onSelectedDocumentId={onSelectedDocumentId}
                />
                {i === messages.length - 1 && messages[i].role === "system" && !messages[i].expanded && (
                  <div className="flex justify-center">
                    <button
                      className="flex justify-center rounded-[20px] border px-4 py-2.5 mt-8"
                      onClick={() => handleSubmit("Tell me more about this")}
                    >
                      Tell me more about this
                    </button>
                  </div>
                )}
              </Fragment>
            ),
          )}
          {isLoading && (
            <AssistantMessage
              content={object?.message}
              id={pendingMessage?.id}
              sources={[]}
              onSelectedDocumentId={onSelectedDocumentId}
            />
          )}
        </div>
      ) : (
        <div className={`flex-grow flex flex-col justify-center ${inter.className}`}>
          <div className="h-[100px] w-[100px] bg-gray-700 rounded-[50px] text-white flex items-center justify-center font-bold text-[32px] mb-8">
            FS
          </div>
          <h1 className="mb-12 text-[40px] font-bold leading-[50px]">
            Hello, I&apos;m {company}&apos;s AI.
            <br />
            What would you like to know?
          </h1>
          <div className="flex items-start justify-evenly space-x-2">
            <div className="rounded-md border p-4 h-full w-1/3">
              Sample question. Lorem ipsum dolor sit amet consectetur. Sample question.
            </div>
            <div className="rounded-md border p-4 h-full w-1/3">
              Sample question. Lorem ipsum dolor sit amet consectetur. Sample question.
            </div>
            <div className="rounded-md border p-4 h-full w-1/3">
              Sample question. Lorem ipsum dolor sit amet consectetur. Sample question.
            </div>
          </div>
        </div>
      )}
      <div className="w-full flex flex-col items-center p-2 pl-4 rounded-[24px] border border-[#D7D7D7]">
        <ChatInput handleSubmit={handleSubmit} />
      </div>
    </div>
  );
}
