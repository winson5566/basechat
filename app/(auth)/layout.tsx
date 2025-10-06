import Image from "next/image";
import Link from "next/link";

import WinsonWuLogo from "@/components/winsonwu-logo";
import * as settings from "@/lib/server/settings";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="h-screen w-full flex flex-col items-center bg-white overflow-hidden">
      <div className="flex-1 w-full overflow-y-auto">
        <div className="w-full max-w-[442px] px-4 pt-10 mx-auto h-full flex flex-col items-center justify-center max-[460px]:px-8 relative">
          <div className="flex items-center justify-center mb-16 w-full">
            <Link href="/" aria-label="Back to Home" className="inline-flex items-center gap-3">
              <Image src="/logo.svg" alt="SmartChat" width={64} height={64} priority />
              <span className={`hidden sm:inline text-black/90 text-4xl md:text-5xl font-semibold tracking-wide`}>
                SmartChat
              </span>
            </Link>
          </div>
          <div className="flex flex-col items-center w-full">{children}</div>
        </div>
      </div>
      <div className="h-20 shrink-0 w-full bg-[#27272A] flex items-center justify-center">
        <div className={`mr-2.5 text-md text-[#FEFEFE]`}>Powered by</div>
        <div>
          <a href="https://winsonwu.com/?utm_source=smart-chat" target="_blank" className="text-white">
            @WinsonWu
          </a>
        </div>
      </div>
    </div>
  );
}
