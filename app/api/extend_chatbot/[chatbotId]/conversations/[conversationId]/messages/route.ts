/**
 * 匿名对话消息API
 * GET /api/extend_chatbot/[chatbotId]/conversations/[conversationId]/messages - 获取消息历史
 * POST /api/extend_chatbot/[chatbotId]/conversations/[conversationId]/messages - 发送消息
 * 无需登录
 */
import { eq, and, asc } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { DEFAULT_MODEL, DEFAULT_PROVIDER, getProviderForModel, getEnabledModelsFromDisabled } from "@/lib/llm/types";
import {
  ConversationContext,
  MessageDAO,
  ReplyGenerator,
  Retriever,
  generatorFactory,
} from "@/lib/server/conversation-context";
import { FAILED_MESSAGE_CONTENT } from "@/lib/server/conversation-context/utils";
import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { getOrCreateAnonymousProfile } from "@/lib/server/extend_anonymous";

const createMessageRequest = z.object({
  content: z.string(),
  model: z.string().optional(),
});

/**
 * 获取对话消息历史
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; conversationId: string }> },
) {
  try {
    const { chatbotId, conversationId } = await params;

    // 验证对话属于该chatbot
    const [conversation] = await db
      .select()
      .from(schema.conversations)
      .where(and(eq(schema.conversations.id, conversationId), eq(schema.conversations.tenantId, chatbotId)))
      .limit(1);

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 获取消息
    const messages = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .orderBy(asc(schema.messages.createdAt));

    return Response.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

/**
 * 发送消息并获取AI回复
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; conversationId: string }> },
) {
  try {
    const { chatbotId, conversationId } = await params;
    const json = await request.json();
    const { content, model: modelInJson } = createMessageRequest.parse(json);

    // 获取tenant信息
    const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, chatbotId)).limit(1);

    if (!tenant) {
      return Response.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // 获取匿名profile
    const { profileId } = await getOrCreateAnonymousProfile(chatbotId);

    // 验证对话
    const [conversation] = await db
      .select()
      .from(schema.conversations)
      .where(and(eq(schema.conversations.id, conversationId), eq(schema.conversations.tenantId, chatbotId)))
      .limit(1);

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 确定使用的模型
    let provider = modelInJson ? getProviderForModel(modelInJson as any) : null;
    let model = modelInJson || tenant.defaultModel || DEFAULT_MODEL;
    const enabledModels = getEnabledModelsFromDisabled(tenant.disabledModels);

    if (!provider || !enabledModels.includes(model as any)) {
      console.log(`Invalid model or model not enabled for tenant: ${model}`);
      console.log(`Using default model: ${DEFAULT_MODEL}`);
      provider = DEFAULT_PROVIDER;
      model = DEFAULT_MODEL;
    }

    // 创建上下文和生成器（使用默认设置）
    const retriever = new Retriever(tenant, {
      isBreadth: tenant.isBreadth || false,
      rerankEnabled: tenant.rerankEnabled || false,
      prioritizeRecent: tenant.prioritizeRecent || false,
    });
    const dao = new MessageDAO(tenant.id);

    const context = new ConversationContext(dao, retriever, tenant, conversation);

    // 创建profile对象（简化版）
    const anonymousProfile = {
      id: profileId,
      userId: "", // 匿名用户
      tenantId: chatbotId,
      role: "guest" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const replyContext = await context.prompt(anonymousProfile, content);
    const generator = new ReplyGenerator(dao, generatorFactory(model as any));

    const [stream, messageId] = await generator.generateStream(replyContext);

    if (!stream) {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(JSON.stringify({ usedSourceIndexes: [], message: FAILED_MESSAGE_CONTENT })),
            );
            controller.close();
          },
        }),
        {
          headers: {
            "x-message-id": messageId,
            "x-model": model,
          },
        },
      );
    }

    // Handle different stream types
    if (stream instanceof ReadableStream) {
      return new Response(stream, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "x-message-id": messageId,
          "x-model": model,
        },
      });
    } else {
      return stream.toTextStreamResponse({ headers: { "x-message-id": messageId, "x-model": model } });
    }
  } catch (error) {
    console.error("Error processing message:", error);
    return Response.json({ error: "Failed to process message" }, { status: 500 });
  }
}
