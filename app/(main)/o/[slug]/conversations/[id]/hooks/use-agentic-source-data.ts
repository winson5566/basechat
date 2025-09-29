import { useAgenticRetrieverContext } from "@/components/agentic-retriever/agentic-retriever-context";
import { getRagieSourcePath } from "@/lib/paths";

import { DocumentDisplayData, MediaDisplayData } from "../shared-types";

interface UseAgenticSourceDataProps {
  runId: string;
  sourceId: string;
  slug: string;
  apiBaseUrl: string;
}

export function useAgenticSourceData({ runId, sourceId, slug, apiBaseUrl }: UseAgenticSourceDataProps) {
  const agenticRetrival = useAgenticRetrieverContext();
  const source = agenticRetrival.getEvidence(runId, sourceId);

  if (!source || source.type !== "ragie") {
    return {
      documentData: null,
      mediaData: null,
      isLoading: false,
      error: "Source not found or not a ragie source",
    };
  }

  // Transform agentic source data to our display format
  const documentData: DocumentDisplayData = {
    name: source.document_name,
    summary: source.text.substring(source.document_name.length),
    updatedAt: source.document_metadata.document_uploaded_at
      ? new Date(source.document_metadata.document_uploaded_at * 1000).toISOString()
      : new Date().toISOString(),
    sourceUrl:
      source.document_metadata.source_url ||
      getRagieSourcePath(slug, `${apiBaseUrl}/documents/${source.document_id}/source`, source.metadata.start_page),
    metadata: {
      source_type: source.document_metadata.source_type || "unknown",
      source_url: source.document_metadata.source_url || "#",
      _source_updated_at: source.document_metadata.document_uploaded_at,
    },
  };

  // Determine media type and prepare media data
  let mediaType: "audio" | "video" | "image" | null = null;
  const imageUrl = source.links.self_image?.href;

  if (imageUrl) {
    mediaType = "image";
  }

  const mediaData: MediaDisplayData = {
    type: mediaType,
    imageUrl: imageUrl,
  };

  return {
    documentData,
    mediaData,
    isLoading: false,
    error: null,
    sourceMetadata: {
      startPage: source.metadata.start_page,
      endPage: source.metadata.end_page,
    },
  };
}
