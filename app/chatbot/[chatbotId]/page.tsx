/**
 * 外挂聊天机器人页面
 * 路径: /chatbot/[chatbotId]
 * 无需登录，可通过iframe嵌入
 */
import BubbleChat from "@/components/extend_bubble_chat";

export default async function ChatbotPage({ params }: { params: Promise<{ chatbotId: string }> }) {
  const { chatbotId } = await params;

  return <BubbleChat chatbotId={chatbotId} />;
}
