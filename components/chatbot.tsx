"use client";

import { Cabin } from "next/font/google";
import { KeyboardEvent, useRef, useState } from "react";

import { AutosizeTextarea, AutosizeTextAreaRef } from "@/components//ui/autosize-textarea";

const cabin = Cabin();

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
    <div className="flex w-full">
      <AutosizeTextarea
        ref={ref}
        placeholder="Send a message"
        minHeight={8}
        value={value}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
      <button onClick={() => handleSubmit(value)}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            opacity="0.5"
            d="M32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32C24.8366 32 32 24.8366 32 16ZM17 23C17 23.5523 16.5523 24 16 24C15.4477 24 15 23.5523 15 23V11.4142L10.7071 15.7071C10.3166 16.0976 9.68342 16.0976 9.29289 15.7071C8.90237 15.3166 8.90237 14.6834 9.29289 14.2929L15.2929 8.29289C15.6834 7.90237 16.3166 7.90237 16.7071 8.29289L22.7071 14.2929C23.0976 14.6834 23.0976 15.3166 22.7071 15.7071C22.3166 16.0976 21.6834 16.0976 21.2929 15.7071L17 11.4142V23Z"
            fill="#00AEC5"
          />
        </svg>
      </button>
    </div>
  );
};

export default function Chatbot({ company }: { company: string }) {
  const [messages, setMessages] = useState<string[]>([]);

  return (
    <div className="flex-grow flex flex-col items-center justify-center">
      <div className="flex-grow flex flex-col items-center justify-center h-full w-full min-w-[448px]">
        <div className="font-semibold text-[15px] h-10">{company} AI</div>
        <div className="flex-grow flex flex-col h-full w-full mb-6 bg-white rounded-xl p-4">
          {messages.length ? (
            <div className="flex flex-col items-end">
              {messages.map((message, i) => (
                <div key={i} className="mb-6 rounded-md px-4 py-2 bg-[#D1EFF3]">
                  {message}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex-grow flex">
                <div className={`flex-grow flex flex-col items-center justify-center ${cabin.className}`}>
                  <h1 className="text-xl font-bold text-[#286239]">Hi there! I&apos;m {company}&apos;s AI.</h1>
                  <div className="text-[#C79730]">What would you like to know?</div>
                </div>
              </div>
              <ul className="space-y-2">
                <li className="rounded-md px-4 py-2 bg-[#D1EFF3]">How does Acme&apos;s occupancy compare to target?</li>
                <li className="rounded-md px-4 py-2 bg-[#D1EFF3]">Did Acme&apos;s controllable costs increase?</li>
                <li className="rounded-md px-4 py-2 bg-[#D1EFF3]">Summarize Acme&apos;s performance over time.</li>
              </ul>
            </>
          )}
        </div>
        <div className="w-full flex flex-col items-center p-2 pl-4 rounded-[24px] bg-white">
          <ChatInput
            handleSubmit={(message) => {
              setMessages([...messages, message]);
            }}
          />
        </div>
      </div>
    </div>
  );
}
