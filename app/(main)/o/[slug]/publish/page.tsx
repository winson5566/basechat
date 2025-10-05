import { BASE_URL } from "@/lib/server/settings";
import { authOrRedirect } from "@/lib/server/utils";

import PublishPageClient from "./publish-page-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublishPage({ params }: Props) {
  const { slug } = await params;
  const { tenant } = await authOrRedirect(slug);

  const baseUrl = BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const chatbotUrl = `${baseUrl.replace(/\/$/, "")}/chatbot/${tenant.id}`;
  const widgetSnippet = `<script src="${baseUrl.replace(/\/$/, "")}/basechat-widget.js" data-chatbot-id="${tenant.id}"></script>`;

  return (
    <PublishPageClient
      tenantName={tenant.name ?? "Smart Chat"}
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      chatbotUrl={chatbotUrl}
      widgetSnippet={widgetSnippet}
    />
  );
}
