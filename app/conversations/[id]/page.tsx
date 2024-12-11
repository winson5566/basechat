import { Inter } from "next/font/google";

import Footer, { AppLocation } from "@/app/footer";
import Header from "@/app/header";
import { requireSession } from "@/lib/auth-utils";

import Conversation from "./conversation";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  return (
    <div className="min-h-screen flex flex-col items-center bg-white">
      <Header />
      <div className="flex-grow h-full w-full flex flex-col items-center justify-center max-w-[1140px] p-4">
        <Conversation id={id} />
      </div>
      <Footer appLocation={AppLocation.CHAT} />
    </div>
  );
}
