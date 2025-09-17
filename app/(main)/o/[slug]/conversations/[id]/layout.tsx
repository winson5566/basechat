import { ReactNode } from "react";

import { AgenticRetrieverProvider } from "@/components/agentic-retriever/agentic-retriever-context";

interface Props {
  params: Promise<{ id: string; slug: string }>;
  children?: ReactNode;
  drawer?: ReactNode;
}

export default async function ConversationLayout({ children, drawer, params }: Props) {
  const { slug } = await params;
  return (
    <AgenticRetrieverProvider tenantSlug={slug}>
      <div className="relative lg:flex h-full w-full">
        <div className="flex-1">{children}</div>
        {drawer}
      </div>
    </AgenticRetrieverProvider>
  );
}
