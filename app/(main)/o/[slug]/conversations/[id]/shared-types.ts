import { SourceMetadata } from "@/lib/types";

export interface DocumentDisplayData {
  name: string;
  summary: string;
  updatedAt: string;
  sourceUrl?: string;
  downloadUrl?: string;
  icon?: string;
  metadata: {
    source_type: string;
    source_url: string;
    _source_updated_at?: number;
  };
}

export interface MediaDisplayData {
  type: "audio" | "video" | "image" | null;
  streamUrl?: string;
  imageUrl?: string;
  downloadUrl?: string;
  startTime?: number;
  endTime?: number;
  mergedTimeRanges?: { startTime: number; endTime: number }[];
}

export interface DocumentDisplayProps {
  className?: string;
  documentData: DocumentDisplayData;
  mediaData: MediaDisplayData;
  source: SourceMetadata;
  slug: string;
  onCloseClick?: () => void;
  isLoading?: boolean;
}

export interface MediaPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isMediaLoaded: boolean;
  isDragging: boolean;
  didInitialSeek: boolean;
}

export interface MediaPlayerActions {
  onPlayPause: () => void;
  onMute: () => void;
  onForward: () => void;
  onReplay: () => void;
  onFullscreen: () => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDragStateChange: (isDragging: boolean) => void;
}
