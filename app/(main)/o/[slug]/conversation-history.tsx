import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";

import { conversationListResponseSchema, conversationSchema } from "@/lib/api";
import { getConversationPath, getTenantPath } from "@/lib/paths";
import NewChatIcon from "@/public/icons/new-chat.svg";

interface Props {
  className?: string;
  tenant: { slug: string };
}

type Conversation = z.infer<typeof conversationSchema>;

export default function ConversationHistory({ className, tenant }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/conversations", { headers: { tenant: tenant.slug } });
        const json = await res.json();
        const conversations = conversationListResponseSchema.parse(json);
        setConversations(conversations);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [tenant.slug]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Link href={getTenantPath(tenant.slug)}>
        <div className="flex items-center">
          <Image src={NewChatIcon} height={24} width={24} alt="New chat" />
          <div className="ml-1.5 font-medium">New Chat</div>
        </div>
      </Link>

      <div className="font-semibold text-[13px] mt-8">History</div>

      <div className="flex-1 overflow-hidden mt-2">
        <div className="max-h-[calc(100vh-270px)] overflow-y-auto pr-1 scrollbar-thin">
          {isLoading ? (
            <div className="flex justify-center items-center mt-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="mt-4 text-gray-500">No conversations yet</div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation, i) => (
                <Link key={i} href={getConversationPath(tenant.slug, conversation.id)}>
                  <div className="py-2 px-1 truncate hover:bg-gray-100 rounded-md transition-colors">
                    {conversation.title}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
