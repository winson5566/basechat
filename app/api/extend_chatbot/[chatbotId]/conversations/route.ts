/**
 * 创建匿名对话的API
 * POST /api/extend_chatbot/[chatbotId]/conversations
 * 无需登录
 */
import { NextRequest } from "next/server";
import { z } from "zod";

import { createAnonymousConversation } from "@/lib/server/extend_anonymous";

const createConversationRequest = z.object({
  title: z.string().optional().default("Widget Conversation"),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const { chatbotId } = await params;
    const json = await request.json();
    const { title } = createConversationRequest.parse(json);

    const conversation = await createAnonymousConversation(chatbotId, title);

    return Response.json({
      id: conversation.id,
      title: conversation.title,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return Response.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
