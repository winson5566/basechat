"use client";

import { experimental_useObject as useObject } from "ai/react";
import { Inter } from "next/font/google";
import { Fragment, useState } from "react";

import { GenerateRequest, GenerateResponseSchema } from "@/lib/schema";

import ChatInput from "./chat-input";

const inter = Inter({ subsets: ["latin"] });

type Message = { content: string; role: "system" | "user" };

const AiMessage = ({ content }: { content: string | undefined }) => (
  <div className="flex">
    <div>
      <div className="h-[40px] w-[40px] bg-gray-700 rounded-[50px] text-white flex items-center justify-center font-bold text-[13px] mb-8">
        FS
      </div>
    </div>
    <div className="self-start mb-6 rounded-md pt-2 ml-7">{content}</div>
  </div>
);

const UserMessage = ({ content }: { content: string }) => (
  <div className="mb-6 rounded-md px-4 py-2 self-end bg-[#F5F5F7]">{content}</div>
);

export default function Chatbot({ company }: { company: string }) {
  const [messages, setMessages] = useState<Message[]>([]);

  const { isLoading, object, submit } = useObject({
    api: "/api/generate",
    schema: GenerateResponseSchema,
    onError: console.error,
    onFinish: (event) => {
      if (!event.object) return;

      const content = event.object.message;
      setMessages((prev) => [...prev, { content: content, role: "system" }]);
    },
  });

  const handleSubmit = (content: string) => {
    const message: GenerateRequest = { content };
    setMessages([...messages, { ...message, role: "user" }]);
    submit(message);
  };

  return (
    <div className="flex-grow flex flex-col h-full w-full bg-white p-4 max-w-[717px]">
      {messages.length ? (
        <div className="flex-grow flex flex-col">
          {messages.map((message, i) =>
            message.role === "user" ? (
              <UserMessage key={i} content={message.content} />
            ) : (
              <Fragment key={i}>
                <AiMessage content={message.content} />
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
          {isLoading && <AiMessage content={object?.message} />}
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
