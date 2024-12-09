"use client";

import { experimental_useObject as useObject } from "ai/react";
import { Inter } from "next/font/google";
import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";

import CONNECTOR_MAP from "@/app/data/connector-map";
import { GenerateRequest, GenerateResponseSchema } from "@/lib/schema";

import ChatInput from "./chat-input";

const inter = Inter({ subsets: ["latin"] });

type AiMessage = { content: string; role: "system"; id?: string; sources: SourceMetadata[] };
type UserMessage = { content: string; role: "user" };
type Message = AiMessage | UserMessage;
type SourceMetadata = {
  source_type: string;
  file_path: string;
  source_url: string;
};

const Citation = ({ source }: { source: SourceMetadata }) => {
  const connector = CONNECTOR_MAP[source.source_type];
  const formatSourceName = (input: string) => {
    if (input.length <= 15) return input;
    return "..." + input.slice(-15);
  };

  return (
    <div className="rounded-[16px] flex border px-3 py-1.5 mr-3 mb-3">
      {connector && <Image src={connector[1]} alt={connector[0]} className="mr-1" />}
      {formatSourceName(source.file_path)}
    </div>
  );
};

const AiMessage = ({
  content,
  id,
  sources,
}: {
  content: string | undefined;
  id?: string | null;
  sources: SourceMetadata[];
}) => {
  return (
    <div className="flex">
      <div>
        <div className="h-[40px] w-[40px] bg-gray-700 rounded-[50px] text-white flex items-center justify-center font-bold text-[13px] mb-8">
          FS
        </div>
      </div>
      <div className="self-start mb-6 rounded-md pt-2 ml-7">
        {content}
        <div className="flex flex-wrap mt-4">
          {sources.map((source, i) => (
            <Citation key={i} source={source} />
          ))}
        </div>
      </div>
    </div>
  );
};

const UserMessage = ({ content }: { content: string }) => (
  <div className="mb-6 rounded-md px-4 py-2 self-end bg-[#F5F5F7]">{content}</div>
);

export default function Chatbot({ company }: { company: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sourceCache, setSourceCache] = useState<Record<string, SourceMetadata[]>>({});
  const [pendingMessageId, setPendingMessageId] = useState<null | string>(null);

  const { isLoading, object, submit } = useObject({
    api: "/api/generate",
    schema: GenerateResponseSchema,
    fetch: async function middleware(input: RequestInfo | URL, init?: RequestInit) {
      const res = await fetch(input, init);
      setPendingMessageId(res.headers.get("x-message-id"));
      return res;
    },
    onError: console.error,
    onFinish: (event) => {
      if (!event.object) return;

      const content = event.object.message;
      setMessages((prev) => [...prev, { content: content, role: "system", sources: [] }]);
    },
  });

  const handleSubmit = (content: string) => {
    const message: GenerateRequest = { content };
    setMessages([...messages, { ...message, role: "user" }]);
    submit(message);
  };

  useEffect(() => {
    if (!pendingMessageId || isLoading) return;

    const copy = [...messages];
    const last = copy.pop();
    if (last?.role === "system") {
      setMessages([...copy, { ...last, id: pendingMessageId }]);
      setPendingMessageId(null);
    }
  }, [pendingMessageId, isLoading, messages]);

  useEffect(() => {
    if (!pendingMessageId) return;

    (async () => {
      const res = await fetch(`/api/messages/${pendingMessageId}`);
      if (!res.ok) return;

      const json = (await res.json()) as { id: string; sources: SourceMetadata[] };
      setSourceCache((prev) => ({ ...prev, [json.id]: json.sources }));
    })();
  }, [pendingMessageId]);

  const messagesWithSources = useMemo(
    () => messages.map((m) => (m.role === "system" && m.id ? { ...m, sources: sourceCache[m.id] } : m)),
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
                <AiMessage content={message.content} id={message.id} sources={message.sources} />
                {i === messages.length - 1 && (
                  <div className="flex justify-center">
                    <button className="flex justify-center rounded-[20px] border px-4 py-2.5 mt-8">
                      Tell me more about this
                    </button>
                  </div>
                )}
              </Fragment>
            ),
          )}
          {isLoading && <AiMessage content={object?.message} id={pendingMessageId} sources={[]} />}
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
