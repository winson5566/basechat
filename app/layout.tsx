import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

import { GlobalStateProvider } from "./context";

const sourceSans3 = Source_Sans_3({ subsets: ["latin"] });

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
        <html lang="en">
          <body className={`${sourceSans3.className} antialiased`}>{children}</body>
        </html>
      </GlobalStateProvider>
    </SessionProvider>
  );
}
