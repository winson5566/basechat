import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";

import NewChatIcon from "../../public/icons/new-chat.svg";

interface Props {
  className?: string;
}

const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.coerce.date(),
});
const conversationListResponseSchema = z.array(conversationSchema);

type Conversation = z.infer<typeof conversationSchema>;
type ConversationListResponse = z.infer<typeof conversationListResponseSchema>;

export default function ConversationList({ className }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/conversations");
      const json = await res.json();
      const conversations = conversationListResponseSchema.parse(json);
      setConversations(conversations);
    })();
  }, []);

  return (
    <div className={className}>
      <Link href="/">
        <div className="flex items-center">
          <Image src={NewChatIcon} height={24} width={24} alt="New chat" />
          <div className="ml-1.5 font-medium">New Chat</div>
        </div>
      </Link>

      <div className="font-semibold text-[13px] mt-8">History</div>
      {conversations.map((conversation, i) => (
        <Link key={i} href={`/conversations/${conversation.id}`}>
          <div className="mt-4">{conversation.title}</div>
        </Link>
      ))}
    </div>
  );
}
