import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import ChatIcon from "../public/icons/chat.svg";
import DataIcon from "../public/icons/data.svg";
import SettingsIcon from "../public/icons/settings.svg";

export function NavButton({ alt, src, className }: { alt: string; src: any; className?: string }) {
  return (
    <div className={cn("flex flex-col w-20 text-white items-center", className)}>
      <Image alt={alt} src={src} className="mb-2.5" />
      <div className="text-[14px]">{alt}</div>
    </div>
  );
}

export default function Footer() {
  return (
    <div className="h-20 w-full bg-[#27272A] flex items-center justify-center">
      <div className="flex">
        <Link href="/">
          <NavButton alt="Chat" src={ChatIcon} className="mr-5" />
        </Link>
        <Link href="/data">
          <NavButton alt="My Data" src={DataIcon} className="mr-5 font-semibold" />
        </Link>
        <NavButton alt="Settings" src={SettingsIcon} />
      </div>
    </div>
  );
}
