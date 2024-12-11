import Image from "next/image";
import Link from "next/link";

import { requireSession } from "@/lib/auth-utils";

import HamburgerIcon from "../public/icons/hamburger.svg";
import NewChatIcon from "../public/icons/new-chat.svg";

export default async function Header() {
  const session = await requireSession();

  return (
    <header className="w-full flex justify-between p-4 items-center">
      <div className="flex">
        <Image src={HamburgerIcon} alt="Expand chats" className="mr-2.5" />
        <Link href="/">
          <Image src={NewChatIcon} alt="New chat" />
        </Link>
      </div>
      <div className="bg-[#66666E] rounded-[16px] h-[32px] w-[32px] flex items-center justify-center text-[#FEFEFE] font-semibold">
        {session.user.name?.trim()[0].toUpperCase()}
      </div>
    </header>
  );
}
