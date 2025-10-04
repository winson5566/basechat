/**
 * Widget信息页面 - 帮助用户获取chatbot嵌入代码
 * 路径: /o/[slug]/extend_widget_info
 */
import { authOrRedirect } from "@/lib/server/utils";

import WidgetInfoClient from "./widget-info-client";

export default async function WidgetInfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await authOrRedirect(slug);

  // 构建chatbot URL（使用环境变量或当前域名）
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const chatbotUrl = `${baseUrl}/chatbot/${tenant.id}`;

  return (
    <WidgetInfoClient
      chatbotUrl={chatbotUrl}
      tenant={{
        name: tenant.name,
        slug: tenant.slug,
        welcomeMessage: tenant.welcomeMessage,
        question1: tenant.question1,
        question2: tenant.question2,
        question3: tenant.question3,
      }}
    />
  );
}
