import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

import { AgenticRetrieverProvider } from "@/components/agentic-retriever/agentic-retriever-context";
import { getConversationPath } from "@/lib/paths";

interface Props {
  params: Promise<{ id: string; slug: string }>;
  children?: ReactNode;
  drawer?: ReactNode;
}

export default async function ConversationLayout({ children, drawer, params }: Props) {
  const { slug } = await params;
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Handle drawer route redirects first
  if (pathname.includes("/conversations/") && pathname.includes("/details/")) {
    const conversationMatch = pathname.match(/\/o\/([^\/]+)\/conversations\/([^\/]+)/);
    if (conversationMatch) {
      const [, slug, conversationId] = conversationMatch;
      redirect(getConversationPath(slug, conversationId));
    }
  }
  return (
    <AgenticRetrieverProvider tenantSlug={slug}>
      <div className="relative lg:flex h-full w-full">
        <div className="flex-1">{children}</div>
        {drawer}
      </div>
    </AgenticRetrieverProvider>
  );
}
