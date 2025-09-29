import Image from "next/image";

import { getRagieStreamPath } from "@/lib/paths";

import PlayerControls from "../player-controls";
import { MediaDisplayData, MediaPlayerState, MediaPlayerActions } from "../shared-types";

interface MediaDisplayProps {
  mediaData: MediaDisplayData;
  state: MediaPlayerState;
  actions: MediaPlayerActions;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  slug: string;
  onCanPlay: () => void;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
}

function MediaSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="h-4 w-full mb-1 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-full mb-1 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-[85%] mb-7 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

export default function MediaDisplay({
  mediaData,
  state,
  actions,
  videoRef,
  audioRef,
  slug,
  onCanPlay,
  onLoadedMetadata,
  onTimeUpdate,
}: MediaDisplayProps) {
  if (!mediaData.type) return null;

  if (mediaData.type === "image" && mediaData.imageUrl) {
    return (
      <div className="mb-6">
        <Image src={getRagieStreamPath(slug, mediaData.imageUrl)} alt="Image" width={500} height={500} />
      </div>
    );
  }

  if (mediaData.type === "audio" && mediaData.streamUrl) {
    return (
      <div className="mb-6">
        <div className="flex flex-col">
          <audio
            ref={audioRef}
            className="w-full"
            src={getRagieStreamPath(slug, mediaData.streamUrl)}
            controls={false}
            preload="metadata"
            onCanPlay={onCanPlay}
            onLoadedMetadata={onLoadedMetadata}
            onLoadedData={onLoadedMetadata}
            onDurationChange={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
          />
          {state.isMediaLoaded ? (
            <PlayerControls
              isPlaying={state.isPlaying}
              isMuted={state.isMuted}
              currentTime={state.currentTime}
              duration={state.duration}
              onProgressClick={actions.onProgressClick}
              onPlayPause={actions.onPlayPause}
              onMute={actions.onMute}
              onForward={actions.onForward}
              onReplay={actions.onReplay}
              onFullscreen={actions.onFullscreen}
              onDragStateChange={actions.onDragStateChange}
            />
          ) : (
            <MediaSkeleton />
          )}
        </div>
      </div>
    );
  }

  if (mediaData.type === "video" && mediaData.streamUrl) {
    return (
      <div className="mb-6">
        <div className="flex flex-col">
          <video
            ref={videoRef}
            className="w-full rounded-lg"
            src={getRagieStreamPath(slug, mediaData.streamUrl)}
            controls={false}
            onCanPlay={onCanPlay}
            onLoadedMetadata={onLoadedMetadata}
            onLoadedData={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
          />
          {state.isMediaLoaded && state.duration > 0 ? (
            <PlayerControls
              isPlaying={state.isPlaying}
              isMuted={state.isMuted}
              currentTime={state.currentTime}
              duration={state.duration}
              onProgressClick={actions.onProgressClick}
              onPlayPause={actions.onPlayPause}
              onMute={actions.onMute}
              onForward={actions.onForward}
              onReplay={actions.onReplay}
              onFullscreen={actions.onFullscreen}
              onDragStateChange={actions.onDragStateChange}
            />
          ) : (
            <MediaSkeleton />
          )}
        </div>
      </div>
    );
  }

  return null;
}
