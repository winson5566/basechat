import { useEffect, useState } from "react";

import { DocumentDisplayData } from "../shared-types";
import { DocumentResponse } from "../types";

interface UseDocumentDataProps {
  documentId: string;
  slug: string;
  source: {
    ragieSourceUrl?: string;
    streamUrl?: string;
    downloadUrl?: string;
    imageUrl?: string;
    startTime?: number;
    endTime?: number;
    mergedTimeRanges?: { startTime: number; endTime: number }[];
  };
}

export function useDocumentData({ documentId, slug, source }: UseDocumentDataProps) {
  const [documentData, setDocumentData] = useState<DocumentDisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setDocumentData(null);

    (async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          headers: { tenant: slug },
        });

        if (!res.ok) {
          const fallbackData: DocumentDisplayData = {
            name: "Document",
            summary: "Document summary not available",
            updatedAt: new Date().toISOString(),
            sourceUrl: source.ragieSourceUrl,
            downloadUrl: source.downloadUrl,
            metadata: {
              source_type: "unknown",
              source_url: "#",
            },
          };
          setDocumentData(fallbackData);
          throw new Error("could not retrieve document with summary");
        }

        const json = (await res.json()) as DocumentResponse;

        // Transform the API response to our display format
        const displayData: DocumentDisplayData = {
          name: json.name,
          summary: json.summary,
          updatedAt: json.metadata._source_updated_at
            ? new Date(json.metadata._source_updated_at * 1000).toISOString()
            : json.updatedAt,
          sourceUrl: json.metadata.source_url || source.ragieSourceUrl,
          downloadUrl: source.downloadUrl,
          metadata: json.metadata,
        };

        setDocumentData(displayData);
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [documentId, slug, source.ragieSourceUrl, source.downloadUrl]);

  return { documentData, isLoading };
}
