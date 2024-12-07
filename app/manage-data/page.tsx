import { Inter } from "next/font/google";
import Image from "next/image";

import { requireSession } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

import ChatIcon from "../../public/icons/chat.svg";
import DataIcon from "../../public/icons/data.svg";
import HamburgerIcon from "../../public/icons/hamburger.svg";
import NewChatIcon from "../../public/icons/new-chat.svg";
import SettingsIcon from "../../public/icons/settings.svg";
import ManageDataPreviewIcons from "../../public/manage-data-preview-icons.svg";

import AddConnectionMenu from "./add-connection-menu";

const inter = Inter({ subsets: ["latin"] });

function NavButton({ alt, src, className }: { alt: string; src: any; className?: string }) {
  return (
    <div className={cn("flex flex-col w-20 text-white items-center", className)}>
      <Image alt={alt} src={src} className="mb-2.5" />
      <div className="text-[14px]">{alt}</div>
    </div>
  );
}

export default async function ManageDataPage() {
  const session = await requireSession();

  return (
    <div className={`min-h-screen flex flex-col items-center bg-white ${inter.className}`}>
      <header className="w-full flex justify-between p-4 items-center">
        <div className="flex">
          <Image src={HamburgerIcon} alt="Expand chats" className="mr-2.5" />
          <Image src={NewChatIcon} alt="New chat" />
        </div>
        <div className="bg-[#66666E] rounded-[16px] h-[32px] w-[32px] flex items-center justify-center text-[#FEFEFE] font-semibold">
          {session.user.name?.trim()[0].toUpperCase()}
        </div>
      </header>
      <div className="flex-grow h-full w-full flex flex-col items-center justify-center max-w-[1140px] p-4">
        <div className="flex w-full justify-between items-center pt-2">
          <h1 className="font-bold text-[32px]">Manage data</h1>
          <AddConnectionMenu />
        </div>
        <div className="flex-grow w-full flex flex-col items-center justify-center">
          <Image alt="Manage data" src={ManageDataPreviewIcons} />
          <h1 className="font-bold text-[32px] mb-3">Chat with your own data</h1>
          <div className="text-[16px]">Click ‘Add data’ above to get started</div>
        </div>
      </div>
      <div className="h-20 w-full bg-[#27272A] flex items-center justify-center">
        <div className="flex">
          <NavButton alt="Chat" src={ChatIcon} className="mr-5" />
          <NavButton alt="My Data" src={DataIcon} className="mr-5 font-semibold" />
          <NavButton alt="Settings" src={SettingsIcon} />
        </div>
      </div>
    </div>
  );
}
