"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import HamburgerIcon from "../../public/icons/hamburger.svg";
import LogOutIcon from "../../public/icons/log-out.svg";
import NewChatIcon from "../../public/icons/new-chat.svg";

import ConversationHistory from "./conversation-history";

interface Props {
  className?: string;
  name?: string | null;
  onNavClick?: () => void;
}

const HeaderPopoverContent = ({
  children,
  className,
  align,
}: {
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) => (
  <PopoverContent
    align={align}
    className={cn("bg-[#F5F5F7] w-[258px] border-none shadow-none rounded-[24px] p-6", className)}
  >
    {children}
  </PopoverContent>
);

export default function Header({ name, onNavClick = () => {} }: Props) {
  const handleLogOutClick = async () => await signOut();

  return (
    <header className="w-full shrink-0 flex justify-between p-4 items-center">
      <div className="flex">
        <Popover>
          <PopoverTrigger asChild>
            <Image src={HamburgerIcon} alt="Expand chats" className="mr-2.5 cursor-pointer" onClick={onNavClick} />
          </PopoverTrigger>
          <HeaderPopoverContent align="start">
            <ConversationHistory />
          </HeaderPopoverContent>
        </Popover>
        <Link href="/">
          <Image src={NewChatIcon} alt="New chat" />
        </Link>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <div className="bg-[#66666E] rounded-[16px] h-[32px] w-[32px] flex items-center justify-center text-[#FEFEFE] font-semibold cursor-pointer">
            {name?.trim()[0].toUpperCase()}
          </div>
        </PopoverTrigger>
        <HeaderPopoverContent align="end" className="p-4">
          <div className="flex cursor-pointer" onClick={handleLogOutClick}>
            <Image src={LogOutIcon} alt="Log out" className="mr-3" />
            Log out
          </div>
        </HeaderPopoverContent>
      </Popover>
    </header>
  );
}
