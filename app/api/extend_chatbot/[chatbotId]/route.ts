/**
 * 获取chatbot信息的API
 * GET /api/extend_chatbot/[chatbotId]
 * 无需登录
 */
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const { chatbotId } = await params;

    // 使用tenant.id作为chatbotId
    const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, chatbotId)).limit(1);

    if (!tenant) {
      return Response.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // 只返回公开信息
    return Response.json({
      id: tenant.id,
      name: tenant.name,
      welcomeMessage: tenant.welcomeMessage || "Hi! How can I help you today?",
      logoUrl: tenant.logoUrl,
      question1: tenant.question1,
      question2: tenant.question2,
      question3: tenant.question3,
    });
  } catch (error) {
    console.error("Error fetching chatbot:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
