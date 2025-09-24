"use client";

import { FileText } from "lucide-react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { useAgenticRetrieverContext } from "@/components/agentic-retriever/agentic-retriever-context";

export default function SourceDetails({ sourceId, runId }: { sourceId: string; runId: string }) {
  const agenticRetrival = useAgenticRetrieverContext();
  const source = agenticRetrival.getEvidence(runId, sourceId);
  if (!source) {
    return <div>Source not found</div>;
  }
  if (source.type !== "ragie") {
    return <div>Non ragie source</div>;
  }
  return (
    <div>
      <div className="flex items-center gap-3 pt-6">
        <div className={`rounded bg-blue-600 p-1`}>
          <FileText className={`h-5 w-5 text-white`} />
        </div>
        <h2 className="text-lg font-bold">{source.document_name}</h2>
      </div>
      <div className="h-3" />
      <div className="text-[#74747A]">{buildMetadataText(source.document_metadata, source.metadata)}</div>
      <div className="h-4" />
      <hr />
      <div className="h-5" />
      <div className="">
        <Markdown className="markdown" rehypePlugins={[rehypeHighlight, remarkGfm]}>
          {source.text.substring(source.document_name.length)}
        </Markdown>
      </div>
    </div>
  );
}

function buildMetadataText(documentMetadata: Record<string, any>, metadata: Record<string, any>) {
  const metadataText = [];
  if (documentMetadata.document_uploaded_at) {
    metadataText.push(new Date(documentMetadata.document_uploaded_at * 1000).toLocaleDateString());
  }
  if (metadata.start_page != metadata.end_page) {
    metadataText.push(`Pages ${metadata.start_page}-${metadata.end_page}`);
  } else if (metadata.start_page) {
    metadataText.push(`Page ${metadata.start_page}`);
  }

  if (documentMetadata.source_type) {
    metadataText.push(documentMetadata.source_type);
  }

  return metadataText.join(" • ");
}
