"use client";

import { FileText } from "lucide-react";
import Image from "next/image";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { useAgenticRetrieverContext } from "@/components/agentic-retriever/agentic-retriever-context";
import { getRagieSourcePath, getRagieStreamPath } from "@/lib/paths";
import ExternalLinkIcon from "@/public/icons/external-link.svg";

export default function SourceDetails({
  slug,
  sourceId,
  runId,
  apiBaseUrl,
}: {
  slug: string;
  sourceId: string;
  runId: string;
  apiBaseUrl: string;
}) {
  const agenticRetrival = useAgenticRetrieverContext();
  const source = agenticRetrival.getEvidence(runId, sourceId);
  if (!source) {
    return <div>Source not found</div>;
  }
  if (source.type !== "ragie") {
    return <div>Non ragie source</div>;
  }
  const imageUrl = source.links.self_image?.href;
  let sourceUrl = source.links.document?.href;
  if (sourceUrl) {
    sourceUrl = `${apiBaseUrl}/documents/${source.document_id}/source`;
  }
  let page = source.metadata.start_page;

  return (
    <div>
      <div className="flex items-center gap-3 pt-6">
        <div className={`rounded bg-blue-600 p-1`}>
          <FileText className={`h-5 w-5 text-white`} />
        </div>
        <h2 className="text-lg font-bold">{source.document_name}</h2>
      </div>
      <div className="h-3" />
      <div className="flex items-center justify-between mb-6">
        <div className="text-[#74747A]">{buildMetadataText(source.document_metadata, source.metadata)}</div>
        {sourceUrl && (
          <a
            href={getRagieSourcePath(slug, sourceUrl, page)}
            target="_blank"
            className="text-[#7749F8] flex items-center gap-1"
          >
            View in source
            <Image src={ExternalLinkIcon} alt="Open in new window" />
          </a>
        )}
      </div>
      <hr />
      <div className="h-5" />
      {imageUrl && (
        <div className="mb-6">
          <Image src={getRagieStreamPath(slug, imageUrl)} alt="Image" width={500} height={500} />
        </div>
      )}

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
