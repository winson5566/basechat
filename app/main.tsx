"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useState } from "react";

import NewChatIcon from "../public/icons/new-chat.svg";

import Footer, { AppLocation } from "./footer";
import Header from "./header";

interface Props {
  appLocation: AppLocation;
  name?: string | null;
  children?: ReactNode;
}

export default function Main({ appLocation, name, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-full w-full flex flex-col items-center bg-white">
      <Header name={name} onNavClick={() => setOpen(!open)} />
      <div className="flex-grow flex h-full w-full justify-center">
        {open && (
          <div className="min-w-[258px] h-full flex flex-col">
            <div className="flex-grow bg-[#F5F5F7] rounded-xl m-4 p-6">
              <Link href="/">
                <div className="flex items-center">
                  <Image src={NewChatIcon} height={24} width={24} alt="New chat" />
                  <div className="ml-1.5 font-medium">New Chat</div>
                </div>
              </Link>

              <div className="font-semibold text-[13px] mt-8">Today</div>
              <div className="mt-4">Chat title</div>
              <div className="mt-4">Chat title</div>
              <div className="mt-4">Chat title</div>
              <div className="mt-4">Chat title</div>
              <div className="mt-4">Chat title</div>

              <div className="font-semibold text-[13px] mt-8">November</div>
              <div className="mt-4">Chat title</div>
              <div className="mt-4">Chat title</div>
              <div className="mt-4">Chat title</div>

              <div className="font-semibold text-[13px] mt-8">October</div>
              <div className="mt-4">Chat title</div>
              <div className="mt-4">Chat title</div>
              <div className="mt-4">Chat title</div>
              <div className="mt-4">Chat title</div>
              <div className="mt-4">Chat title</div>
            </div>
            <div className="h-[80px] bg-[#27272A]" />
          </div>
        )}
        <div className="flex-grow h-full w-full flex flex-col items-center justify-center min-w-[500px]">
          {children}
          <Footer appLocation={appLocation} className="h-[80px] w-full bg-[#27272A] flex items-center justify-center" />
        </div>
      </div>
    </div>
  );
}
