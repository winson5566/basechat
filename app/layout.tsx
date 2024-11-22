import type { Metadata } from "next";
import { Source_Sans_3 } from 'next/font/google'
import "./globals.css";

const sourceSans3 = Source_Sans_3();

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
    <html lang="en">
      <body className={`${sourceSans3.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
