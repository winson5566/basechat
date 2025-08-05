import Image from "next/image";
import { useCallback, useEffect, useRef, useReducer } from "react";

import { cn } from "@/lib/utils";
import Forward10Icon from "@/public/icons/forward_10.svg";
import FullScreenIcon from "@/public/icons/full_screen.svg";
import PauseIcon from "@/public/icons/pause.svg";
import PlayIcon from "@/public/icons/play.svg";
import Replay10Icon from "@/public/icons/replay_10.svg";
import VolumeUpIcon from "@/public/icons/volume_up.svg";

interface PlayerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPlayPause: () => void;
  onMute: () => void;
  onForward: () => void;
  onReplay: () => void;
  onFullscreen: () => void;
  onDragStateChange: (isDragging: boolean) => void;
}

type DragState = {
  isDragging: boolean;
  previewTime: number | null;
};

type DragAction =
  | { type: "START_DRAG"; time: number }
  | { type: "UPDATE_PREVIEW"; time: number }
  | { type: "END_DRAG" };

function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case "START_DRAG":
      return { isDragging: true, previewTime: action.time };
    case "UPDATE_PREVIEW":
      return { ...state, previewTime: action.time };
    case "END_DRAG":
      return { isDragging: false, previewTime: null };
    default:
      return state;
  }
}

export default function PlayerControls({
  isPlaying,
  isMuted,
  currentTime,
  duration,
  onProgressClick,
  onPlayPause,
  onMute,
  onForward,
  onReplay,
  onFullscreen,
  onDragStateChange,
}: PlayerControlsProps) {
  const [dragState, dispatch] = useReducer(dragReducer, { isDragging: false, previewTime: null });
  const progressBarRef = useRef<HTMLDivElement>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventHandlersRef = useRef<{
    handleDragOver: (e: DragEvent) => void;
    handleDocumentDrop: (e: DragEvent) => void;
    handleDocumentDragEnd: () => void;
  } | null>(null);

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const calculateNewTime = (clientX: number): number => {
    const rect = progressBarRef.current?.getBoundingClientRect();
    if (!rect) return currentTime;

    // Calculate position relative to the progress bar
    const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = relativeX / rect.width;
    return Math.max(0, Math.min(duration, percent * duration));
  };

  const cleanupDrag = useCallback(() => {
    dispatch({ type: "END_DRAG" });
    if (eventHandlersRef.current) {
      document.removeEventListener("dragover", eventHandlersRef.current.handleDragOver);
      document.removeEventListener("drop", eventHandlersRef.current.handleDocumentDrop);
      document.removeEventListener("dragend", eventHandlersRef.current.handleDocumentDragEnd);
    }
  }, []);

  // Initialize event handlers
  useEffect(() => {
    eventHandlersRef.current = {
      handleDragOver: (e: DragEvent) => {
        e.preventDefault();
        if (!dragState.isDragging || !progressBarRef.current) return;
        const newTime = calculateNewTime(e.clientX);
        dispatch({ type: "UPDATE_PREVIEW", time: newTime });
      },
      handleDocumentDrop: (e: DragEvent) => {
        e.preventDefault();
        if (!dragState.isDragging) return;
        onProgressClick({
          clientX: e.clientX,
          currentTarget: progressBarRef.current,
        } as React.MouseEvent<HTMLDivElement>);
        cleanupDrag();
      },
      handleDocumentDragEnd: () => {
        cleanupDrag();
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState.isDragging, onProgressClick, cleanupDrag]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("text/plain", ""); // Required for Firefox
      e.dataTransfer.effectAllowed = "move";

      const rect = progressBarRef.current?.getBoundingClientRect();
      if (rect && eventHandlersRef.current) {
        // Clean up any existing listeners before adding new ones
        cleanupDrag();

        dispatch({ type: "START_DRAG", time: currentTime });
        onDragStateChange(true);

        // Add event listeners for drag outside the window
        document.addEventListener("dragover", eventHandlersRef.current.handleDragOver);
        document.addEventListener("drop", eventHandlersRef.current.handleDocumentDrop);
        document.addEventListener("dragend", eventHandlersRef.current.handleDocumentDragEnd);
      }
    },
    [currentTime, cleanupDrag, onDragStateChange],
  );

  const handleDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!dragState.isDragging || !progressBarRef.current) return;

      // Update immediately for better responsiveness
      const newTime = calculateNewTime(e.clientX);
      dispatch({ type: "UPDATE_PREVIEW", time: newTime });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragState.isDragging],
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!dragState.isDragging) return;

      onProgressClick({
        clientX: e.clientX,
        currentTarget: progressBarRef.current,
      } as React.MouseEvent<HTMLDivElement>);
      onDragStateChange(false);
      cleanupDrag();
    },
    [dragState.isDragging, onProgressClick, cleanupDrag, onDragStateChange],
  );

  // Cleanup on unmount
  useEffect(() => {
    const timeoutId = dragTimeoutRef.current;
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      cleanupDrag();
      onDragStateChange(false);
    };
  }, [cleanupDrag, onDragStateChange]);

  // Add cleanup on component update
  useEffect(() => {
    return () => {
      cleanupDrag();
      onDragStateChange(false);
    };
  }, [cleanupDrag, onDragStateChange]);

  const currentProgress = dragState.previewTime !== null ? dragState.previewTime : currentTime;
  const progressPercent = (currentProgress / duration) * 100;

  return (
    <div className="flex flex-col">
      <div className="mt-4 px-2">
        <div
          ref={progressBarRef}
          className={cn(
            "h-1 bg-gray-200 rounded-full cursor-pointer relative transition-colors duration-200",
            dragState.isDragging && "bg-gray-300",
          )}
          onClick={onProgressClick}
        >
          <div
            className={cn(
              "h-full bg-[#7749F8] rounded-full transition-all duration-200",
              dragState.isDragging && "opacity-80",
            )}
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-black rounded-sm cursor-grab active:cursor-grabbing transition-all duration-200",
              dragState.isDragging && "h-4 w-1.5 bg-[#7749F8]",
            )}
            style={{ left: `${progressPercent}%`, transform: "translate(-50%, -50%)" }}
            draggable="true"
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{formatTime(currentProgress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <button onClick={onMute} className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200">
          <Image
            src={VolumeUpIcon}
            alt={isMuted ? "Unmute" : "Mute"}
            width={32}
            height={32}
            className={cn(isMuted && "opacity-50")}
          />
        </button>
        <div className="flex items-center gap-0">
          <button onClick={onReplay} className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200">
            <Image src={Replay10Icon} alt="Replay 10 seconds" width={32} height={32} />
          </button>
          <button onClick={onPlayPause} className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200">
            <Image src={isPlaying ? PauseIcon : PlayIcon} alt={isPlaying ? "Pause" : "Play"} width={48} height={48} />
          </button>
          <button onClick={onForward} className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200">
            <Image src={Forward10Icon} alt="Forward 10 seconds" width={32} height={32} />
          </button>
        </div>
        <button onClick={onFullscreen} className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200">
          <Image src={FullScreenIcon} alt={"Toggle fullscreen"} width={32} height={32} />
        </button>
      </div>
    </div>
  );
}
