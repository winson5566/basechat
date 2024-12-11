import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

import { GlobalStateProvider } from "./context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chatbot example",
  description: "Chatbot example using Ragie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <GlobalStateProvider>
        <html lang="en" className="h-full w-full">
          <body className={`${inter.className} antialiased h-full w-full`}>{children}</body>
        </html>
      </GlobalStateProvider>
    </SessionProvider>
  );
}
