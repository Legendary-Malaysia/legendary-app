"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Configuration
export const CONFIG = {
  WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  SAMPLE_RATE: 16000,
  RECEIVE_SAMPLE_RATE: 24000,
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000,
} as const;

// Types
export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "recording";

export type WebSocketMessage =
  | { type: "ready"; features?: { available_functions?: string[] } }
  | { type: "audio"; data: string }
  | { type: "text"; data: string }
  | { type: "interrupted"; message: string }
  | {
      type: "tool_call";
      function_name: string;
      arguments: Record<string, unknown>;
    }
  | { type: "tool_result"; function_name: string; result: unknown }
  | { type: "search_code"; code: string }
  | { type: "search_result"; output: string }
  | { type: "turn_complete" }
  | { type: "error"; data: string };

// ============ HELPER FUNCTIONS ============

export const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
};

export const arrayBufferToBase64 = (buffer: ArrayBufferLike): string => {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const pcmToAudioBuffer = async (
  audioContext: AudioContext,
  pcmData: ArrayBufferLike,
  sampleRate: number,
): Promise<AudioBuffer> => {
  const byteLength = (pcmData as ArrayBuffer).byteLength;
  if (byteLength % 2 !== 0) {
    throw new Error(
      `Invalid PCM data: byte length ${byteLength} is not a multiple of 2 (required for 16-bit samples)`,
    );
  }

  const int16Array = new Int16Array(pcmData);
  const float32Array = new Float32Array(int16Array.length);

  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
  }

  const audioBuffer = audioContext.createBuffer(
    1,
    float32Array.length,
    sampleRate,
  );
  audioBuffer.getChannelData(0).set(float32Array);
  return audioBuffer;
};

export const playAudioBuffer = (
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  sourceRef: React.RefObject<AudioBufferSourceNode | null>,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    sourceRef.current = source;

    source.onended = () => {
      sourceRef.current = null;
      resolve();
    };

    try {
      source.start();
    } catch (error) {
      sourceRef.current = null;
      reject(error);
    }
  });
};

// ============ HOOKS ============

export function useWebSocket(
  enableSearch: boolean,
  enableFunctions: boolean,
  onMessage: (message: WebSocketMessage) => void,
  wsUrl?: string,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setStatus("connecting");
      const baseUrl = wsUrl || CONFIG.WS_URL;
      if (!baseUrl) {
        console.error("WebSocket URL is not configured");
        setStatus("error");
        return;
      }
      const url = `${baseUrl}/ws/audio?enable_search=${enableSearch}&enable_functions=${enableFunctions}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          onMessage(message);
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("error");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setStatus("disconnected");
        wsRef.current = null;

        // Auto-reconnect logic
        if (reconnectAttemptsRef.current < CONFIG.MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          setTimeout(() => {
            console.log(`Reconnect attempt ${reconnectAttemptsRef.current}`);
            connect();
          }, CONFIG.RECONNECT_DELAY);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Connection error:", error);
      setStatus("error");
    }
  }, [enableSearch, enableFunctions, onMessage, wsUrl]);

  const disconnect = useCallback(() => {
    reconnectAttemptsRef.current = CONFIG.MAX_RECONNECT_ATTEMPTS;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const send = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    send,
    status,
    setStatus,
    isConnected: status === "connected" || status === "recording",
  };
}

export function useAudioRecorder(onAudioData: (data: string) => void) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: CONFIG.SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      audioContextRef.current = new AudioContext({
        sampleRate: CONFIG.SAMPLE_RATE,
      });
      const source = audioContextRef.current.createMediaStreamSource(stream);

      await audioContextRef.current.audioWorklet.addModule(
        "/worklets/pcm-processor.js",
      );
      const processor = new AudioWorkletNode(
        audioContextRef.current,
        "pcm-processor",
      );
      processorRef.current = processor;

      processor.port.onmessage = (e) => {
        const pcmData = floatTo16BitPCM(e.data);
        const base64 = arrayBufferToBase64(pcmData.buffer);
        onAudioData(base64);
      };

      source.connect(processor);

      const zeroGain = audioContextRef.current.createGain();
      zeroGain.gain.value = 0;
      processor.connect(zeroGain);
      zeroGain.connect(audioContextRef.current.destination);

      setIsRecording(true);
      return true;
    } catch (error) {
      console.error("Error starting recording:", error);
      return false;
    }
  }, [onAudioData]);

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return { startRecording, stopRecording, isRecording };
}

// Queue management constants
const MAX_QUEUE_SIZE = 10; // Maximum chunks in queue before dropping old frames
const SCHEDULE_AHEAD_TIME = 0.1; // Schedule audio 100ms ahead for seamless playback

export function useAudioPlayer() {
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const shouldStopRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const getAudioContext = useCallback(async () => {
    if (
      !playbackContextRef.current ||
      playbackContextRef.current.state === "closed"
    ) {
      playbackContextRef.current = new AudioContext({
        sampleRate: CONFIG.RECEIVE_SAMPLE_RATE,
      });
    }

    // Handle suspended state (browser power-saving)
    if (playbackContextRef.current.state === "suspended") {
      await playbackContextRef.current.resume();
    }

    return playbackContextRef.current;
  }, []);

  const scheduleAudioChunk = useCallback(
    async (audioContext: AudioContext, audioData: ArrayBuffer) => {
      const audioBuffer = await pcmToAudioBuffer(
        audioContext,
        audioData,
        CONFIG.RECEIVE_SAMPLE_RATE,
      );

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      // Track active source for cleanup
      activeSourcesRef.current.add(source);

      // Calculate precise start time - schedule ahead to avoid gaps
      const currentTime = audioContext.currentTime;
      const startTime = Math.max(
        nextStartTimeRef.current,
        currentTime + SCHEDULE_AHEAD_TIME,
      );

      // Update next start time for seamless chaining
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      source.onended = () => {
        activeSourcesRef.current.delete(source);
        // Check if all audio has finished playing
        if (
          activeSourcesRef.current.size === 0 &&
          audioQueueRef.current.length === 0
        ) {
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      };

      source.start(startTime);
    },
    [],
  );

  const processQueue = useCallback(async () => {
    if (isPlayingRef.current || shouldStopRef.current) return;
    if (audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setIsPlaying(true);

    try {
      const audioContext = await getAudioContext();

      // Process all queued chunks with schedule-ahead
      while (audioQueueRef.current.length > 0 && !shouldStopRef.current) {
        const audioData = audioQueueRef.current.shift()!;
        await scheduleAudioChunk(audioContext, audioData);
      }
    } catch (error) {
      console.error("Error processing audio queue:", error);
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, [getAudioContext, scheduleAudioChunk]);

  const enqueueAudio = useCallback(
    (audioData: ArrayBuffer) => {
      if (shouldStopRef.current) {
        console.log("Resuming audio playback for new response");
        shouldStopRef.current = false;
        nextStartTimeRef.current = 0; // Reset scheduling time
      }

      // Queue management: drop oldest frames if queue is too large
      while (audioQueueRef.current.length >= MAX_QUEUE_SIZE) {
        audioQueueRef.current.shift();
        console.warn("Dropping audio frame to reduce latency");
      }

      audioQueueRef.current.push(audioData);

      // Start processing if not already playing
      if (!isPlayingRef.current && !shouldStopRef.current) {
        processQueue();
      } else if (isPlayingRef.current) {
        // If already playing, schedule the new chunk immediately
        getAudioContext().then((ctx) => {
          if (!shouldStopRef.current && audioQueueRef.current.length > 0) {
            const data = audioQueueRef.current.shift()!;
            scheduleAudioChunk(ctx, data);
          }
        });
      }
    },
    [processQueue, getAudioContext, scheduleAudioChunk],
  );

  const stopAudio = useCallback(() => {
    shouldStopRef.current = true;

    // Stop all active sources
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Already stopped or disconnected
      }
    });
    activeSourcesRef.current.clear();

    audioQueueRef.current = [];
    nextStartTimeRef.current = 0;
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const resumeAudio = useCallback(() => {
    shouldStopRef.current = false;
    nextStartTimeRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
      if (playbackContextRef.current) {
        playbackContextRef.current.close();
      }
    };
  }, [stopAudio]);

  return { enqueueAudio, stopAudio, resumeAudio, isPlaying };
}
