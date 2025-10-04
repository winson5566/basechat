/**
 * Chatbot页面布局
 * 简化布局，适合iframe嵌入
 */
"use client";

import { useEffect } from "react";
import "./chatbot.css";

export default function ChatbotLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("chatbot-embed");
    document.body.classList.add("chatbot-embed");

    return () => {
      document.documentElement.classList.remove("chatbot-embed");
      document.body.classList.remove("chatbot-embed");
    };
  }, []);

  return <>{children}</>;
}
