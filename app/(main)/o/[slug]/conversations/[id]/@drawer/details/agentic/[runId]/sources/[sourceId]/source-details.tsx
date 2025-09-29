"use client";

import { FileText } from "lucide-react";


import DocumentHeader from "../../../../../../components/document-header";
import DocumentSummary from "../../../../../../components/document-summary";
import MediaDisplay from "../../../../../../components/media-display";
import { useAgenticSourceData } from "../../../../../../hooks/use-agentic-source-data";

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
  const { documentData, mediaData, isLoading, error, sourceMetadata } = useAgenticSourceData({
    runId,
    sourceId,
    slug,
    apiBaseUrl,
  });

  if (error) {
    return <div>{error}</div>;
  }

  if (isLoading || !documentData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 pt-6">
        <div className={`rounded bg-blue-600 p-1`}>
          <FileText className={`h-5 w-5 text-white`} />
        </div>
        <h2 className="text-lg font-bold">{documentData.name}</h2>
      </div>
      <div className="h-3" />

      <DocumentHeader documentData={documentData} slug={slug} />

      {mediaData && (
        <MediaDisplay
          mediaData={mediaData}
          state={{
            isPlaying: false,
            isMuted: false,
            currentTime: 0,
            duration: 0,
            isMediaLoaded: true,
            isDragging: false,
            didInitialSeek: false,
          }}
          actions={{
            onPlayPause: () => {},
            onMute: () => {},
            onForward: () => {},
            onReplay: () => {},
            onFullscreen: () => {},
            onProgressClick: () => {},
            onDragStateChange: () => {},
          }}
          videoRef={{ current: null }}
          audioRef={{ current: null }}
          slug={slug}
          onCanPlay={() => {}}
          onLoadedMetadata={() => {}}
          onTimeUpdate={() => {}}
        />
      )}

      <DocumentSummary summary={documentData.summary} />
    </div>
  );
}
