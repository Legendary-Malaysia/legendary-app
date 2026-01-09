"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PhoneOff, Mic, MicOff, X, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useWebSocket,
  useAudioRecorder,
  useAudioPlayer,
  base64ToArrayBuffer,
  type WebSocketMessage,
  type ConnectionStatus,
} from "./hooks";

// ============ TYPES ============

export interface VoiceCallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  wsUrl?: string;
  enableSearch?: boolean;
  enableFunctions?: boolean;
  animationSpeed?: number;
  className?: string;
}

// ============ ANIMATED COMPONENTS ============

function PulsingRings({
  isActive,
  speed = 1,
}: {
  isActive: boolean;
  speed?: number;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[1, 2, 3].map((ring) => (
        <div
          key={ring}
          className={cn(
            "absolute rounded-full border-2 border-indigo-400/50",
            isActive ? "animate-voice-pulse" : "opacity-0",
          )}
          style={{
            width: `${80 + ring * 40}px`,
            height: `${80 + ring * 40}px`,
            animationDelay: `${ring * 0.3}s`,
            animationDuration: `${2 / speed}s`,
          }}
        />
      ))}
    </div>
  );
}

function WaveformBars({
  isActive,
  speed = 1,
}: {
  isActive: boolean;
  speed?: number;
}) {
  const bars = [0.6, 1, 0.7, 0.9, 0.5, 0.8, 1, 0.6, 0.9, 0.7];

  return (
    <div className="flex h-12 items-end justify-center gap-1">
      {bars.map((height, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-150",
            isActive ? "bg-emerald-400" : "bg-gray-600",
            isActive && "animate-voice-wave",
          )}
          style={{
            height: isActive ? `${height * 100}%` : "20%",
            animationDelay: `${i * 0.05}s`,
            animationDuration: `${0.5 / speed}s`,
          }}
        />
      ))}
    </div>
  );
}

function CallTimer({ startTime }: { startTime: number | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <span className="font-mono text-sm text-gray-400">
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

// ============ MAIN COMPONENT ============

export function VoiceCallOverlay({
  isOpen,
  onClose,
  wsUrl,
  enableSearch = false,
  enableFunctions = true,
  animationSpeed = 1,
  className,
}: VoiceCallOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<"user" | "ai" | null>(
    null,
  );

  const { enqueueAudio, stopAudio, resumeAudio, isPlaying } = useAudioPlayer();

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case "audio":
          const audioData = base64ToArrayBuffer(message.data);
          enqueueAudio(audioData);
          break;

        case "interrupted":
          stopAudio();
          setCurrentSpeaker(null);
          break;

        case "turn_complete":
          resumeAudio();
          break;

        case "error":
          console.error("Voice call error:", message.data);
          break;
      }
    },
    [enqueueAudio, stopAudio, resumeAudio],
  );

  const { connect, disconnect, send, status, setStatus, isConnected } =
    useWebSocket(enableSearch, enableFunctions, handleMessage, wsUrl);

  const { startRecording, stopRecording, isRecording } = useAudioRecorder(
    (audioData) => {
      if (!isMuted) {
        send({ type: "audio", data: audioData });
      }
    },
  );

  const handleEndCall = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    stopAudio();
    send({ type: "stop" });
    disconnect();
    setCallStartTime(null);
    setCurrentSpeaker(null);
    setIsMuted(false);
    onClose();
  }, [isRecording, stopRecording, stopAudio, send, disconnect, onClose]);

  // Update speaker state based on recording/playing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isPlaying) {
      setCurrentSpeaker("ai");
    } else if (isRecording && !isMuted) {
      setCurrentSpeaker("user");
    } else if (!isRecording && !isPlaying) {
      // Add delay before clearing AI speaker status to prevent flickering
      // during buffer underruns or between chunks
      timeoutId = setTimeout(() => {
        setCurrentSpeaker(null);
      }, 500);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRecording, isPlaying, isMuted]);

  // Handle overlay open/close
  useEffect(() => {
    if (isOpen) {
      connect();
    } else {
      handleEndCall();
    }
  }, [isOpen, connect, handleEndCall]);

  // Start recording when connected
  useEffect(() => {
    if (status === "connected" && !isRecording && isOpen) {
      startRecording().then((success) => {
        if (success) {
          setStatus("recording");
          setCallStartTime(Date.now());
        }
      });
    }
  }, [status, isOpen, isRecording, startRecording, setStatus]);

  // const handleToggleMute = useCallback(() => {
  //   setIsMuted((prev) => !prev);
  // }, []);

  const statusText = useMemo(() => {
    const statusMap: Record<ConnectionStatus, string> = {
      disconnected: "Disconnected",
      connecting: "Connecting...",
      connected: "Connected",
      recording: "In Call",
      error: "Connection Error",
    };
    return statusMap[status];
  }, [status]);

  const statusColor = useMemo(() => {
    const colorMap: Record<ConnectionStatus, string> = {
      disconnected: "text-gray-400",
      connecting: "text-amber-400",
      connected: "text-emerald-400",
      recording: "text-emerald-400",
      error: "text-red-400",
    };
    return colorMap[status];
  }, [status]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "animate-in fade-in duration-300",
        className,
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={handleEndCall}
      />

      {/* Content */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center justify-between",
          "h-[80vh] max-h-[600px] w-full max-w-md p-8",
          "rounded-3xl bg-gradient-to-b from-black to-gray-900",
          "animate-in zoom-in-95 duration-300",
        )}
      >
        {/* Header */}
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col">
            <span className={cn("text-sm font-medium", statusColor)}>
              {statusText}
            </span>
            <CallTimer startTime={callStartTime} />
          </div>
          <button
            onClick={handleEndCall}
            className="rounded-full p-2 transition-colors hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Avatar with Animations */}
        <div className="relative flex flex-1 items-center justify-center">
          <PulsingRings
            isActive={currentSpeaker === "ai"}
            speed={animationSpeed}
          />

          {/* Avatar Circle */}
          <div
            className={cn(
              "relative h-32 w-32 rounded-full",
              "bg-gradient-to-br from-indigo-500 to-purple-600",
              "flex items-center justify-center",
              "shadow-lg shadow-indigo-700",
              status === "connecting" && "animate-pulse",
            )}
          >
            <PhoneCall className="h-8 w-8 text-gray-300" />
          </div>
        </div>

        {/* Waveform Indicator */}
        <div className="flex h-16 w-full items-center justify-center">
          <WaveformBars
            isActive={currentSpeaker === "user" && !isMuted}
            speed={animationSpeed}
          />
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-center gap-6">
          {/* Mute Button */}
          {/* <button
            onClick={handleToggleMute}
            disabled={!isConnected}
            className={cn(
              "rounded-full p-4 transition-all duration-200",
              isMuted
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-gray-700 text-white hover:bg-gray-600",
              !isConnected && "cursor-not-allowed opacity-50",
            )}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button> */}

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className={cn(
              "rounded-full p-5 transition-all duration-200",
              "bg-red-500 text-white hover:bg-red-600",
              "shadow-lg shadow-red-500/30 hover:shadow-red-500/50",
            )}
            aria-label="End call"
          >
            <PhoneOff className="h-7 w-7" />
          </button>
        </div>

        {/* Speaking Indicator Text */}
        <div className="mt-4 h-6">
          {currentSpeaker === "user" && !isMuted && (
            <span className="animate-pulse text-sm text-emerald-400">
              Listening...
            </span>
          )}
          {currentSpeaker === "ai" && (
            <span className="animate-pulse text-sm text-indigo-400">
              AI is speaking...
            </span>
          )}
          {isMuted && isConnected && (
            <span className="text-sm text-amber-400">Muted</span>
          )}
        </div>
        <div className="mt-4 h-6">
          <span className="text-sm text-gray-500">
            AI can make mistakes. Please verify the information.
          </span>
        </div>
      </div>
    </div>
  );
}
