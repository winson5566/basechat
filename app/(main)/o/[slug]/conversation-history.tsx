import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { conversationListResponseSchema, conversationSchema } from "@/lib/api";
import { getConversationPath, getTenantPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import EllipsesIcon from "@/public/icons/ellipses.svg";
import NewChatIcon from "@/public/icons/new-chat.svg";

interface Props {
  className?: string;
  tenant: { slug: string };
}

type Conversation = z.infer<typeof conversationSchema>;

type ConversationsByDate = {
  today: Conversation[];
  thisMonth: Conversation[];
  byMonth: Record<string, Conversation[]>;
};

const ConversationPopoverContent = ({ children }: { children: React.ReactNode }) => (
  <PopoverContent
    align="end"
    alignOffset={-46}
    side="right"
    sideOffset={-16}
    className={cn("bg-[#F5F5F7] w-[100px] border border-[#D7D7D7] shadow-none rounded-[6px] p-3")}
  >
    {children}
  </PopoverContent>
);

export default function ConversationHistory({ className, tenant }: Props) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
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
  }, [tenant.slug]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleDelete = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          tenant: tenant.slug,
        },
        body: JSON.stringify({ tenantSlug: tenant.slug }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete conversation");
      }

      toast.success("Conversation deleted");

      // Refresh the conversation list
      await fetchConversations();

      // Check if we're currently viewing the deleted conversation
      const currentPath = location.pathname;
      const deletedConversationPath = getConversationPath(tenant.slug, conversationId);
      if (currentPath === deletedConversationPath) {
        router.push(getTenantPath(tenant.slug));
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce<ConversationsByDate>(
    (acc, conversation) => {
      const updatedAt = conversation.updatedAt;
      const now = new Date();

      // Check if conversation is from today
      if (
        updatedAt.getDate() === now.getDate() &&
        updatedAt.getMonth() === now.getMonth() &&
        updatedAt.getFullYear() === now.getFullYear()
      ) {
        acc.today.push(conversation);
        return acc;
      }

      // Check if conversation is from this month
      if (updatedAt.getMonth() === now.getMonth() && updatedAt.getFullYear() === now.getFullYear()) {
        acc.thisMonth.push(conversation);
        return acc;
      }

      // Group by month
      const monthYear = updatedAt.toLocaleString("default", { month: "long", year: "numeric" });
      if (!acc.byMonth[monthYear]) {
        acc.byMonth[monthYear] = [];
      }
      acc.byMonth[monthYear].push(conversation);

      return acc;
    },
    { today: [], thisMonth: [], byMonth: {} },
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Link href={getTenantPath(tenant.slug)}>
        <div className="flex items-center">
          <Image src={NewChatIcon} height={24} width={24} alt="New chat" />
          <div className="ml-1.5 font-medium">New Chat</div>
        </div>
      </Link>

      <div className="flex-1 overflow-hidden mt-6">
        <div className="max-h-[calc(100vh-270px)] overflow-y-auto pr-1 scrollbar-thin">
          {isLoading ? (
            <div className="flex justify-center items-center mt-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="mt-4 text-gray-500">No chat history yet.</div>
          ) : (
            <div className="space-y-4">
              {/* Today's conversations */}
              {groupedConversations.today.length > 0 && (
                <div>
                  <div className="font-bold text-xs mb-2 pl-4">Today</div>
                  <div className="space-y-2">
                    {groupedConversations.today.map((conversation, i) => (
                      <div
                        key={i}
                        className="py-2 px-4 flex justify-between items-center hover:bg-gray-200 rounded-md transition-colors group"
                      >
                        <Link href={getConversationPath(tenant.slug, conversation.id)} className="flex-1 min-w-0">
                          <div className="truncate pr-2 max-w-[calc(100%-24px)]">{conversation.title}</div>
                        </Link>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Image
                              src={EllipsesIcon}
                              height={16}
                              width={16}
                              alt="Options"
                              className="flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </PopoverTrigger>
                          <ConversationPopoverContent>
                            <button
                              className="text-sm text-black hover:text-gray-700"
                              onClick={() => handleDelete(conversation.id)}
                            >
                              Delete
                            </button>
                          </ConversationPopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* This month's conversations */}
              {groupedConversations.thisMonth.length > 0 && (
                <div>
                  <div className="font-bold text-xs mb-2 pl-4">This month</div>
                  <div className="space-y-2">
                    {groupedConversations.thisMonth.map((conversation, i) => (
                      <div
                        key={i}
                        className="py-2 px-4 flex justify-between items-center hover:bg-gray-200 rounded-md transition-colors group"
                      >
                        <Link href={getConversationPath(tenant.slug, conversation.id)} className="flex-1 min-w-0">
                          <div className="truncate pr-2 max-w-[calc(100%-24px)]">{conversation.title}</div>
                        </Link>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Image
                              src={EllipsesIcon}
                              height={16}
                              width={16}
                              alt="Options"
                              className="flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </PopoverTrigger>
                          <ConversationPopoverContent>
                            <button
                              className="text-sm text-black hover:text-gray-700"
                              onClick={() => handleDelete(conversation.id)}
                            >
                              Delete
                            </button>
                          </ConversationPopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous months */}
              {Object.entries(groupedConversations.byMonth).map(([month, monthConversations]) => {
                // Format month to have only first letter capitalized
                const formattedMonth = month
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(" ");

                return (
                  <div key={month}>
                    <div className="font-bold text-xs mb-2 pl-4">{formattedMonth}</div>
                    <div className="space-y-2">
                      {monthConversations.map((conversation, i) => (
                        <div
                          key={i}
                          className="py-2 px-4 flex justify-between items-center hover:bg-gray-200 rounded-md transition-colors group"
                        >
                          <Link href={getConversationPath(tenant.slug, conversation.id)} className="flex-1 min-w-0">
                            <div className="truncate pr-2 max-w-[calc(100%-24px)]">{conversation.title}</div>
                          </Link>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Image
                                src={EllipsesIcon}
                                height={16}
                                width={16}
                                alt="Options"
                                className="flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </PopoverTrigger>
                            <ConversationPopoverContent>
                              <button
                                className="text-sm text-black hover:text-gray-700"
                                onClick={() => handleDelete(conversation.id)}
                              >
                                Delete
                              </button>
                            </ConversationPopoverContent>
                          </Popover>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
