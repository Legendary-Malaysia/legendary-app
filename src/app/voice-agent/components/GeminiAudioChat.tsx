"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

// Configuration
const CONFIG = {
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000",
  SAMPLE_RATE: 16000,
  RECEIVE_SAMPLE_RATE: 24000,
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000,
  MAX_AUDIO_CONTEXTS: 1,
} as const;

// Types
interface ToolCall {
  function_name: string;
  arguments: Record<string, any>;
  timestamp: string;
  id: string;
}

interface ToolResult {
  function_name: string;
  result: any;
  timestamp: string;
  id: string;
}

interface TranscriptMessage {
  id: string;
  speaker: "user" | "ai" | "system";
  content: string;
  timestamp: string;
}

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "recording";

type WebSocketMessage =
  | { type: "ready"; features?: { available_functions?: string[] } }
  | { type: "audio"; data: string }
  | { type: "text"; data: string }
  | { type: "tool_call"; function_name: string; arguments: Record<string, any> }
  | { type: "tool_result"; function_name: string; result: any }
  | { type: "search_code"; code: string }
  | { type: "search_result"; output: string }
  | { type: "turn_complete" }
  | { type: "error"; data: string };

// Custom Hooks
function useWebSocket(
  enableSearch: boolean,
  enableFunctions: boolean,
  onMessage: (message: WebSocketMessage) => void,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setStatus("connecting");
      const url = `${CONFIG.WS_URL}/ws/audio?enable_search=${enableSearch}&enable_functions=${enableFunctions}`;
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
  }, [enableSearch, enableFunctions, onMessage]);

  const disconnect = useCallback(() => {
    reconnectAttemptsRef.current = CONFIG.MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
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

function useAudioRecorder(onAudioData: (data: string) => void) {
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
      processor.connect(audioContextRef.current.destination);

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

function useAudioPlayer() {
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const shouldStopRef = useRef(false);

  const enqueueAudio = useCallback((audioData: ArrayBuffer) => {
    audioQueueRef.current.push(audioData);
    if (!isPlayingRef.current && !shouldStopRef.current) {
      playQueue();
    }
  }, []);

  const playQueue = useCallback(async () => {
    if (
      isPlayingRef.current ||
      audioQueueRef.current.length === 0 ||
      shouldStopRef.current
    )
      return;

    isPlayingRef.current = true;

    if (
      !playbackContextRef.current ||
      playbackContextRef.current.state === "closed"
    ) {
      playbackContextRef.current = new AudioContext({
        sampleRate: CONFIG.RECEIVE_SAMPLE_RATE,
      });
    }

    const audioContext = playbackContextRef.current;

    try {
      while (audioQueueRef.current.length > 0 && !shouldStopRef.current) {
        const audioData = audioQueueRef.current.shift()!;
        const audioBuffer = await pcmToAudioBuffer(
          audioContext,
          audioData,
          CONFIG.RECEIVE_SAMPLE_RATE,
        );
        await playAudioBuffer(audioContext, audioBuffer, currentSourceRef);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }

    isPlayingRef.current = false;
  }, []);

  const stopAudio = useCallback(() => {
    shouldStopRef.current = true;

    // Stop currently playing audio
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (error) {
        // Already stopped or disconnected
      }
      currentSourceRef.current = null;
    }

    // Clear the queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  const resumeAudio = useCallback(() => {
    shouldStopRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
      if (playbackContextRef.current) {
        playbackContextRef.current.close();
      }
    };
  }, [stopAudio]);

  return { enqueueAudio, stopAudio, resumeAudio };
}

// Helper Functions
const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
};

const arrayBufferToBase64 = (buffer: ArrayBufferLike): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const pcmToAudioBuffer = async (
  audioContext: AudioContext,
  pcmData: ArrayBufferLike,
  sampleRate: number,
): Promise<AudioBuffer> => {
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

const playAudioBuffer = (
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  sourceRef: React.MutableRefObject<AudioBufferSourceNode | null>,
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

// Main Component
export default function GeminiAudioChat() {
  const [enableSearch, setEnableSearch] = useState(false);
  const [enableFunctions, setEnableFunctions] = useState(true);
  const [availableFunctions, setAvailableFunctions] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");

  const { enqueueAudio, stopAudio, resumeAudio } = useAudioPlayer();

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      const timestamp = new Date().toLocaleTimeString();

      switch (message.type) {
        case "ready":
          if (message.features?.available_functions) {
            setAvailableFunctions(message.features.available_functions);
          }
          break;

        case "audio":
          const audioData = base64ToArrayBuffer(message.data);
          enqueueAudio(audioData);
          break;

        case "text":
          setTranscript((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              speaker: "ai",
              content: message.data,
              timestamp,
            },
          ]);
          break;

        case "tool_call":
          const toolCall: ToolCall = {
            id: crypto.randomUUID(),
            function_name: message.function_name,
            arguments: message.arguments,
            timestamp,
          };
          setToolCalls((prev) => [...prev, toolCall]);
          setTranscript((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              speaker: "system",
              content: `🔧 ${message.function_name}(${JSON.stringify(message.arguments)})`,
              timestamp,
            },
          ]);
          break;

        case "tool_result":
          const toolResult: ToolResult = {
            id: crypto.randomUUID(),
            function_name: message.function_name,
            result: message.result,
            timestamp,
          };
          setToolResults((prev) => [...prev, toolResult]);
          break;

        case "search_code":
          setSearchResults((prev) => [...prev, `Code: ${message.code}`]);
          break;

        case "search_result":
          setSearchResults((prev) => [...prev, `Result: ${message.output}`]);
          break;

        case "error":
          console.error("Server error:", message.data);
          setTranscript((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              speaker: "system",
              content: `❌ Error: ${message.data}`,
              timestamp,
            },
          ]);
          break;
      }
    },
    [enqueueAudio],
  );

  const { connect, disconnect, send, status, setStatus, isConnected } =
    useWebSocket(enableSearch, enableFunctions, handleMessage);

  const { startRecording, stopRecording, isRecording } = useAudioRecorder(
    (audioData) => {
      send({ type: "audio", data: audioData });
    },
  );

  const handleStartRecording = useCallback(async () => {
    if (!isConnected) {
      alert("Please connect first");
      return;
    }

    // Resume audio playback if it was stopped
    resumeAudio();

    const success = await startRecording();
    if (success) {
      setStatus("recording");
    } else {
      alert("Failed to access microphone. Please check permissions.");
    }
  }, [isConnected, startRecording, setStatus, resumeAudio]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    setStatus("connected");

    // Stop any playing audio
    stopAudio();

    // Send interrupt signal to server to stop generating audio
    send({ type: "interrupt" });
  }, [stopRecording, setStatus, stopAudio, send]);

  const handleSendText = useCallback(() => {
    if (!textInput.trim()) return;
    if (!send({ type: "text", data: textInput })) {
      alert("Please connect first");
      return;
    }

    setTranscript((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        speaker: "user",
        content: textInput,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setTextInput("");
  }, [textInput, send]);

  const handleDisconnect = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    send({ type: "stop" });
    disconnect();
  }, [isRecording, stopRecording, send, disconnect]);

  const clearLogs = useCallback(() => {
    setTranscript([]);
    setToolCalls([]);
    setToolResults([]);
    setSearchResults([]);
  }, []);

  const statusText = useMemo(() => {
    switch (status) {
      case "disconnected":
        return "Disconnected";
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Connected";
      case "recording":
        return "Recording...";
      case "error":
        return "Connection Error";
    }
  }, [status]);

  const statusColor = useMemo(() => {
    switch (status) {
      case "disconnected":
        return "text-gray-600";
      case "connecting":
        return "text-yellow-600";
      case "connected":
        return "text-green-600";
      case "recording":
        return "text-red-600";
      case "error":
        return "text-red-600";
    }
  }, [status]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-3xl font-bold">Gemini Audio Chat</h1>

        {/* Status Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              Status:{" "}
              <span className={`font-semibold ${statusColor}`}>
                {statusText}
              </span>
            </p>
            {availableFunctions.length > 0 && (
              <p className="text-xs text-blue-600">
                Functions: {availableFunctions.join(", ")}
              </p>
            )}
          </div>

          {/* Feature Toggles */}
          {!isConnected && (
            <div className="flex gap-4 rounded bg-gray-50 p-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableSearch}
                  onChange={(e) => setEnableSearch(e.target.checked)}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm">Enable Google Search</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableFunctions}
                  onChange={(e) => setEnableFunctions(e.target.checked)}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm">Enable Function Calling</span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!isConnected ? (
              <button
                onClick={connect}
                disabled={status === "connecting"}
                className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "connecting" ? "Connecting..." : "Connect"}
              </button>
            ) : (
              <>
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="rounded bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
                  >
                    🎤 Start Recording
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="animate-pulse rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                  >
                    ⏹️ Stop Recording
                  </button>
                )}
                <button
                  onClick={handleDisconnect}
                  className="rounded bg-gray-600 px-4 py-2 text-white transition hover:bg-gray-700"
                >
                  Disconnect
                </button>
                <button
                  onClick={clearLogs}
                  className="rounded bg-orange-600 px-4 py-2 text-white transition hover:bg-orange-700"
                >
                  Clear Logs
                </button>
              </>
            )}
          </div>

          {/* Text Input */}
          {isConnected && (
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendText()}
                placeholder="Type a message or question..."
                className="flex-1 rounded border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={isRecording}
              />
              <button
                onClick={handleSendText}
                disabled={!textInput.trim() || isRecording}
                className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Transcript */}
          <div className="h-96 overflow-y-auto rounded bg-gray-50 p-4">
            <h2 className="sticky top-0 mb-3 flex items-center gap-2 bg-gray-50 pb-2 font-semibold">
              💬 Transcript
              <span className="text-xs text-gray-500">
                ({transcript.length})
              </span>
            </h2>
            {transcript.length === 0 ? (
              <p className="text-gray-400 italic">No messages yet...</p>
            ) : (
              <div className="space-y-2">
                {transcript.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded p-2 text-sm ${
                      msg.speaker === "user"
                        ? "ml-8 bg-blue-100"
                        : msg.speaker === "ai"
                          ? "mr-8 bg-white"
                          : "bg-yellow-50"
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold">
                        {msg.speaker === "user"
                          ? "You"
                          : msg.speaker === "ai"
                            ? "AI"
                            : "System"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {msg.timestamp}
                      </span>
                    </div>
                    <p className="break-words">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Function Calls */}
          <div className="h-96 overflow-y-auto rounded bg-blue-50 p-4">
            <h2 className="sticky top-0 mb-3 flex items-center gap-2 bg-blue-50 pb-2 font-semibold">
              🔧 Function Calls
              <span className="text-xs text-gray-500">
                ({toolCalls.length})
              </span>
            </h2>
            {toolCalls.length === 0 ? (
              <p className="text-gray-400 italic">No function calls yet...</p>
            ) : (
              <div className="space-y-2">
                {toolCalls.map((call) => (
                  <div
                    key={call.id}
                    className="rounded bg-white p-3 text-sm shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <p className="font-semibold text-blue-600">
                        {call.function_name}
                      </p>
                      <p className="text-xs text-gray-500">{call.timestamp}</p>
                    </div>
                    <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                      {JSON.stringify(call.arguments, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Function Results */}
          <div className="h-96 overflow-y-auto rounded bg-green-50 p-4">
            <h2 className="sticky top-0 mb-3 flex items-center gap-2 bg-green-50 pb-2 font-semibold">
              ✅ Function Results
              <span className="text-xs text-gray-500">
                ({toolResults.length})
              </span>
            </h2>
            {toolResults.length === 0 ? (
              <p className="text-gray-400 italic">No results yet...</p>
            ) : (
              <div className="space-y-2">
                {toolResults.map((result) => (
                  <div
                    key={result.id}
                    className="rounded bg-white p-3 text-sm shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <p className="font-semibold text-green-600">
                        {result.function_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {result.timestamp}
                      </p>
                    </div>
                    <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Activity */}
          <div className="h-96 overflow-y-auto rounded bg-yellow-50 p-4">
            <h2 className="sticky top-0 mb-3 flex items-center gap-2 bg-yellow-50 pb-2 font-semibold">
              🔍 Search Activity
              <span className="text-xs text-gray-500">
                ({searchResults.length})
              </span>
            </h2>
            {searchResults.length === 0 ? (
              <p className="text-gray-400 italic">No search activity yet...</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="rounded bg-white p-3 text-xs break-words shadow-sm"
                  >
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="mb-2 font-semibold">💡 Try these prompts:</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
          <li>"What's the weather in San Francisco?"</li>
          <li>"Turn on the lights in the living room"</li>
          <li>"Search for the latest news about AI"</li>
          <li>"When did the last World Cup happen?"</li>
        </ul>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="mb-2 font-semibold">⚠️ Important Notes:</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
          <li>Use headphones to prevent echo/feedback</li>
          <li>Allow microphone access when prompted</li>
          <li>Server must be running on localhost:8000</li>
          <li>Auto-reconnect after disconnection (max 5 attempts)</li>
        </ul>
      </div>
    </div>
  );
}
