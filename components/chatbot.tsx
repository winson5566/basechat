"use client";

import { Cabin } from "next/font/google";
import { useRouter } from "next/navigation";
import React, { FormEvent } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const cabin = Cabin();

const AutoResizingTextarea = () => {
  const [textareaValue, setTextareaValue] = React.useState("");

  const handleInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + "px";
    setTextareaValue(textarea.value);
  };

  return (
    <div className="flex w-full">
      <textarea
        value={textareaValue}
        onInput={handleInput}
        className="w-full max-h-[100px] resize-none overflow-y-auto border-0 focus:outline-none focus:border-none mt-1.5"
        placeholder="Send a message"
        rows={1}
      />
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"  >
        <path opacity="0.5" d="M32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32C24.8366 32 32 24.8366 32 16ZM17 23C17 23.5523 16.5523 24 16 24C15.4477 24 15 23.5523 15 23V11.4142L10.7071 15.7071C10.3166 16.0976 9.68342 16.0976 9.29289 15.7071C8.90237 15.3166 8.90237 14.6834 9.29289 14.2929L15.2929 8.29289C15.6834 7.90237 16.3166 7.90237 16.7071 8.29289L22.7071 14.2929C23.0976 14.6834 23.0976 15.3166 22.7071 15.7071C22.3166 16.0976 21.6834 16.0976 21.2929 15.7071L17 11.4142V23Z" fill="#00AEC5" />
      </svg>
    </div>
  );
};

const CONNECTOR_LIST = [
  ["confluence", "Confluence"],
  ["jira", "Jira"],
  ["gmail", "Gmail"],
  ["google_drive", "Google Drive"],
  ["notion", "Notion"],
  ["onedrive", "OneDrive"],
  ["salesforce", "Salesforce"],
]

export default function Chatot({ company }: { company: string }) {
  const router = useRouter();

  const onSelect = async (sourceType: string) => {
    const res = await fetch(`/api/connect/${sourceType}`)
    if (res.status < 200 || res.status >= 300) throw new Error("Could not retrieve redirect URL");
    const { url } = await res.json() as { url: string }
    router.push(url)
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center h-full w-full min-w-[448px]">
      <div className="font-semibold text-[15px] mb-4">{company} AI</div>
      <div className="flex-grow flex flex-col h-full w-full mb-6 bg-white rounded-xl p-4">
        <div className="flex-grow flex">
          <div className={`flex-grow flex flex-col items-center justify-center ${cabin.className}`}>
            <h1 className="text-xl font-bold text-[#286239]">Hi there! I&apos;m {company}&apos;s AI.</h1>
            <div className="text-[#C79730]">
              What would you like to know?
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="border border-black mt-6 py-1 px-2 rounded">+ Connect</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Choose a connector</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CONNECTOR_LIST.map(([sourceType, name]) => (
                  <DropdownMenuItem key={sourceType} onSelect={() => onSelect(sourceType)}>{name}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <ul className="space-y-2">
          <li className="rounded-md px-4 py-2 bg-[#D1EFF3]">How does Acme&apos;s occupancy compare to target?</li>
          <li className="rounded-md px-4 py-2 bg-[#D1EFF3]">Did Acme&apos;s controllable costs increase?</li>
          <li className="rounded-md px-4 py-2 bg-[#D1EFF3]">Summarize Acme&apos;s performance over time.</li>
        </ul>
      </div>
      <div className="w-full flex flex-col items-center p-2 pl-4 rounded-[24px] bg-white">
        <AutoResizingTextarea />
      </div>
    </div>
  );
}