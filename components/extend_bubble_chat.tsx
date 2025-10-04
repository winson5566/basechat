"use client";

import { experimental_useObject as useObject } from "ai/react";
import { MessageCircle, X, Minus, Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { z } from "zod";

import { createConversationMessageResponseSchema } from "@/lib/api";
interface ChatbotInfo {
  id: string;
  name: string;
  welcomeMessage: string;
  logoUrl?: string | null;
  question1?: string | null;
  question2?: string | null;
  question3?: string | null;
}

type Message = {
  role: "user" | "assistant";
  content: string;
  id?: string;
};

interface BubbleChatProps {
  chatbotId: string;
}

export default function BubbleChat({ chatbotId }: BubbleChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatbotInfo, setChatbotInfo] = useState<ChatbotInfo | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载chatbot信息
  useEffect(() => {
    fetch(`/api/extend_chatbot/${chatbotId}`)
      .then((res) => res.json())
      .then((data) => {
        setChatbotInfo(data);
        // 添加欢迎消息
        if (data.welcomeMessage) {
          setMessages([{ role: "assistant", content: data.welcomeMessage }]);
        }
      })
      .catch((err) => console.error("Failed to load chatbot info:", err));
  }, [chatbotId]);

  // 创建对话
  const createConversation = async () => {
    if (conversationId) return conversationId;

    try {
      const res = await fetch(`/api/extend_chatbot/${chatbotId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Widget Conversation" }),
      });
      const data = await res.json();
      setConversationId(data.id);
      return data.id;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      return null;
    }
  };

  const { isLoading, object, submit } = useObject({
    api: "",
    schema: createConversationMessageResponseSchema,
    fetch: async function middleware(input: RequestInfo | URL, init?: RequestInit) {
      const convId = conversationId || (await createConversation());
      if (!convId) throw new Error("Failed to create conversation");

      const url = `/api/extend_chatbot/${chatbotId}/conversations/${convId}/messages`;
      const res = await fetch(url, init);
      const id = res.headers.get("x-message-id");
      if (id) setPendingMessageId(id);
      return res;
    },
    onError: (error) => {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    },
    onFinish: (event) => {
      if (!event.object?.message) return;
      setMessages((prev) => [...prev, { role: "assistant", content: event.object!.message, id: pendingMessageId! }]);
      setPendingMessageId(null);
    },
  });

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    submit({ content: userMessage });
  };

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, object]);

  // 通知父窗口调整iframe大小
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      const message = {
        type: "basechat-resize",
        isOpen,
        isMinimized,
      };
      window.parent.postMessage(message, "*");
    }
  }, [isOpen, isMinimized]);

  if (!chatbotInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* 气泡按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 pointer-events-auto"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-200 pointer-events-auto ${
            isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
          }`}
          style={{ maxHeight: "calc(100vh - 48px)" }}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              {chatbotInfo.logoUrl && (
                <Image
                  src={chatbotInfo.logoUrl}
                  alt={chatbotInfo.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="font-semibold">{chatbotInfo.name}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-blue-700 p-1 rounded"
                aria-label={isMinimized ? "Maximize" : "Minimize"}
              >
                <Minus size={18} />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded" aria-label="Close">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 聊天内容 */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800 prose prose-sm max-w-none"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* 正在输入指示器 */}
                {isLoading && object?.message && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-gray-100 text-gray-800 rounded-lg px-4 py-2 prose prose-sm max-w-none">
                      <ReactMarkdown>{object.message}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {isLoading && !object?.message && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 快捷问题 */}
              {messages.length <= 1 && (chatbotInfo.question1 || chatbotInfo.question2 || chatbotInfo.question3) && (
                <div className="px-4 pb-2 space-y-2">
                  {chatbotInfo.question1 && (
                    <button
                      onClick={() => handleQuestionClick(chatbotInfo.question1!)}
                      className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      {chatbotInfo.question1}
                    </button>
                  )}
                  {chatbotInfo.question2 && (
                    <button
                      onClick={() => handleQuestionClick(chatbotInfo.question2!)}
                      className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      {chatbotInfo.question2}
                    </button>
                  )}
                  {chatbotInfo.question3 && (
                    <button
                      onClick={() => handleQuestionClick(chatbotInfo.question3!)}
                      className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      {chatbotInfo.question3}
                    </button>
                  )}
                </div>
              )}

              {/* 输入框 */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !inputValue.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    aria-label="Send message"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
