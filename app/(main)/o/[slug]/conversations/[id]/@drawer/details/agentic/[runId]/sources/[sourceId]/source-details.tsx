"use client";

import CitedRanges from "../../../../../../cited-ranges";
import DocumentHeader from "../../../../../../components/document-header";
import DocumentSummary from "../../../../../../components/document-summary";
import MediaDisplay from "../../../../../../components/media-display";
import { useAgenticSourceData } from "../../../../../../hooks/use-agentic-source-data";
import { useMediaPlayer } from "../../../../../../hooks/use-media-player";

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

  // Use media player hook for proper state management
  const {
    videoRef,
    audioRef,
    state: mediaState,
    actions: mediaActions,
    handleCanPlay,
    handleLoadedMetadata,
    handleTimeUpdate,
  } = useMediaPlayer({
    mediaType: mediaData?.type || null,
    streamUrl: mediaData?.streamUrl,
    startTime: mediaData?.startTime,
    mergedTimeRanges: mediaData?.mergedTimeRanges,
    slug,
  });

  if (error) {
    return <div>{error}</div>;
  }

  if (isLoading || !documentData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <DocumentHeader documentData={documentData} slug={slug} />

      {mediaData && (
        <MediaDisplay
          mediaData={mediaData}
          state={mediaState}
          actions={mediaActions}
          videoRef={videoRef}
          audioRef={audioRef}
          slug={slug}
          onCanPlay={handleCanPlay}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
        />
      )}

      <CitedRanges source={sourceMetadata} slug={slug} />

      <DocumentSummary summary={documentData.summary} />
    </div>
  );
}
