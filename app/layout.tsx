import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

import { GaTags } from "@/components/ga-tags";

import { QueryClientProvider } from "../lib/query-client-provider";

import { GlobalStateProvider } from "./(main)/o/[slug]/context";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Smart Chat",
  description: "Smart Chat powered by WinsonWu",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full w-full">
      <body className={`antialiased h-full w-full bg-white`}>
        <GaTags gaKey={process.env.GOOGLE_ANALYTICS_KEY} />
        <GlobalStateProvider>
          <QueryClientProvider>{children}</QueryClientProvider>
          <Toaster position="bottom-center" />
        </GlobalStateProvider>
      </body>
    </html>
  );
}
