import { Inter } from "next/font/google";

import { requireSession } from "@/lib/auth-utils";
import { getTenantByUserId } from "@/lib/service";

import ChatView from "./chat-view";
import Footer, { AppLocation } from "./footer";
import Header from "./header";

const inter = Inter({ subsets: ["latin"] });

export default async function Home() {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);

  return (
    <div className={`min-h-screen flex flex-col items-center bg-white ${inter.className}`}>
      <Header />
      <div className="flex-grow h-full w-full flex flex-col items-center justify-center max-w-[1140px] p-4">
        <ChatView company={tenant.name} />
      </div>
      <Footer appLocation={AppLocation.CHAT} />
    </div>
  );
}
