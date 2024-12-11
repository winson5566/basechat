"use client";

import { ReactNode, useState } from "react";

import ConversationList from "./conversation-list";
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
            <ConversationList className="flex-grow bg-[#F5F5F7] rounded-xl m-4 p-6" />
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
