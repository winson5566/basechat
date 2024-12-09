"use client";

import { experimental_useObject as useObject } from "ai/react";
import { Inter } from "next/font/google";
import { KeyboardEvent, useRef, useState } from "react";

import { AutosizeTextarea, AutosizeTextAreaRef } from "@/components//ui/autosize-textarea";
import { GenerateRequest, GenerateResponseSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

interface ChatInputProps {
  handleSubmit?: (text: string) => void;
}

const ChatInput = (props: ChatInputProps) => {
  const [value, setValue] = useState("");
  const ref = useRef<AutosizeTextAreaRef>(null);

  const handleSubmit = (value: string) => {
    setValue("");

    const v = value.trim();
    v && props.handleSubmit && props.handleSubmit(v);
    ref.current?.textArea.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || (event.key === "Enter" && event.shiftKey)) return;

    event.preventDefault();
    handleSubmit(value);
  };

  return (
    <div className="flex w-full items-end items-center">
      <AutosizeTextarea
        className="pt-1.5"
        ref={ref}
        placeholder="Send a message"
        minHeight={4}
        value={value}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
      <button onClick={() => handleSubmit(value)}>
        <svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M24.3125 12L11.6731 12M6.34685 16.1693H3.91254M6.34685 12.1464H1.51254M6.34685 8.12356H3.91254M10.6199 4.59596L23.8753 11.0228C24.6916 11.4186 24.6916 12.5814 23.8753 12.9772L10.6199 19.4041C9.71186 19.8443 8.74666 18.9161 9.15116 17.9915L11.582 12.4353C11.7034 12.1578 11.7034 11.8422 11.582 11.5647L9.15116 6.00848C8.74666 5.08391 9.71186 4.15568 10.6199 4.59596Z"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

type Message = { content: string; role: "system" | "user" };

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
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "mb-6 rounded-md px-4 py-2",
                message.role === "user" ? "self-end bg-[#F5F5F7]" : "self-start",
              )}
            >
              {message.content}
            </div>
          ))}
          {isLoading && <div className="self-start mb-6 rounded-md px-4 py-2">{object?.message}</div>}
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
