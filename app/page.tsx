import { Inter } from "next/font/google";

import Chatbot from "@/components/chatbot";
import { requireSession } from "@/lib/auth-utils";
import { getTenantByUserId } from "@/lib/service";
import * as settings from "@/lib/settings";

import Footer from "./footer";
import Header from "./header";

const inter = Inter({ subsets: ["latin"] });

export default async function Home() {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);

  return (
    <div className={`min-h-screen flex flex-col items-center bg-white ${inter.className}`}>
      <Header />
      <div className="flex-grow h-full w-full flex flex-col items-center justify-center max-w-[1140px] p-4">
        <div className="flex-grow w-full flex flex-col items-center justify-center">
          <Chatbot company={tenant.name} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
