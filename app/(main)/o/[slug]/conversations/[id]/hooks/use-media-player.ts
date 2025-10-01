import { useCallback, useEffect, useRef, useState } from "react";

import { MediaPlayerState, MediaPlayerActions } from "../shared-types";

interface UseMediaPlayerProps {
  mediaType: "audio" | "video" | "image" | null;
  streamUrl?: string;
  startTime?: number;
  mergedTimeRanges?: { startTime: number; endTime: number }[];
  slug: string;
}

export function useMediaPlayer({ mediaType, streamUrl, startTime, mergedTimeRanges, slug }: UseMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [state, setState] = useState<MediaPlayerState>({
    isPlaying: false,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    isMediaLoaded: mediaType === "image" || !mediaType, // Images are immediately "loaded"
    isDragging: false,
    didInitialSeek: false,
  });

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only handle progress clicks for audio/video
      if (mediaType !== "audio" && mediaType !== "video") return;

      const media = videoRef.current || audioRef.current;
      if (media && state.duration > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * state.duration;

        // Pause the media before seeking to prevent race conditions
        const wasPlaying = !media.paused;
        if (wasPlaying) {
          media.pause();
        }

        media.currentTime = newTime;
        setState((prev) => ({ ...prev, currentTime: newTime }));

        // Resume playback if it was playing before
        if (wasPlaying) {
          const playPromise = media.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error("Error resuming playback:", error);
            });
          }
        }
      }
    },
    [mediaType, state.duration],
  );

  const onPlayPause = useCallback(() => {
    if (mediaType !== "audio" && mediaType !== "video") return;
    const media = videoRef.current || audioRef.current;
    if (media) {
      if (media.paused) {
        media.play();
        setState((prev) => ({ ...prev, isPlaying: true }));
      } else {
        media.pause();
        setState((prev) => ({ ...prev, isPlaying: false }));
      }
    }
  }, [mediaType]);

  const onMute = useCallback(() => {
    if (mediaType !== "audio" && mediaType !== "video") return;
    const media = videoRef.current || audioRef.current;
    if (media) {
      media.muted = !media.muted;
      setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [mediaType]);

  const onForward = useCallback(() => {
    if (mediaType !== "audio" && mediaType !== "video") return;
    const media = videoRef.current || audioRef.current;
    if (media) {
      const newTime = Math.min(media.duration, media.currentTime + 10);
      media.currentTime = newTime;
      setState((prev) => ({ ...prev, currentTime: newTime }));
    }
  }, [mediaType]);

  const onReplay = useCallback(() => {
    if (mediaType !== "audio" && mediaType !== "video") return;
    const media = videoRef.current || audioRef.current;
    if (media) {
      const newTime = Math.max(0, media.currentTime - 10);
      media.currentTime = newTime;
      setState((prev) => ({ ...prev, currentTime: newTime }));
    }
  }, [mediaType]);

  const onFullscreen = useCallback(() => {
    if (mediaType !== "video") return;
    const video = videoRef.current;
    if (video) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        video.requestFullscreen();
      }
    }
  }, [mediaType]);

  const onDragStateChange = useCallback((isDragging: boolean) => {
    setState((prev) => ({ ...prev, isDragging }));
  }, []);

  const actions: MediaPlayerActions = {
    onPlayPause,
    onMute,
    onForward,
    onReplay,
    onFullscreen,
    onProgressClick: handleProgressClick,
    onDragStateChange,
  };

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // Media event handlers
  const handleCanPlay = useCallback(() => {
    if (mediaType !== "audio" && mediaType !== "video") return;
    const media = videoRef.current || audioRef.current;
    if (media) {
      const seekTime = mergedTimeRanges && mergedTimeRanges.length > 0 ? mergedTimeRanges[0].startTime : startTime;
      const canSeek = media.seekable.end(0) >= (seekTime || 0);
      if (canSeek && !state.didInitialSeek) {
        media.currentTime = seekTime || 0;
        setState((prev) => ({
          ...prev,
          currentTime: seekTime || 0,
          didInitialSeek: true,
        }));
      }
    }
  }, [mediaType, mergedTimeRanges, startTime, state.didInitialSeek]);

  const handleLoadedMetadata = useCallback(() => {
    if (mediaType !== "audio" && mediaType !== "video") return;
    const media = videoRef.current || audioRef.current;
    if (media) {
      setState((prev) => ({
        ...prev,
        duration: media.duration,
        isMediaLoaded: true,
      }));
    }
  }, [mediaType]);

  const handleTimeUpdate = useCallback(() => {
    if (mediaType !== "audio" && mediaType !== "video") return;
    const media = videoRef.current || audioRef.current;
    if (media && media.currentTime !== state.currentTime) {
      setState((prev) => ({ ...prev, currentTime: media.currentTime }));
    }
  }, [mediaType, state.currentTime]);

  return {
    videoRef,
    audioRef,
    state,
    actions,
    handleCanPlay,
    handleLoadedMetadata,
    handleTimeUpdate,
  };
}
