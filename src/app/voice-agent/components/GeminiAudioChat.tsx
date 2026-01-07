// components/GeminiAudioChat.tsx
"use client";

import { useEffect, useRef, useState } from "react";

const SAMPLE_RATE = 16000;
const RECEIVE_SAMPLE_RATE = 24000;

interface ToolCall {
  function_name: string;
  arguments: Record<string, any>;
  timestamp: string;
}

interface ToolResult {
  function_name: string;
  result: any;
  timestamp: string;
}

export default function GeminiAudioChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [status, setStatus] = useState("Disconnected");
  const [enableSearch, setEnableSearch] = useState(false);
  const [enableFunctions, setEnableFunctions] = useState(true);
  const [availableFunctions, setAvailableFunctions] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const audioQueueRef = useRef<ArrayBufferLike[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize WebSocket connection
  const connect = async () => {
    try {
      setStatus("Connecting...");
      const url = `ws://localhost:8000/ws/audio?enable_search=${enableSearch}&enable_functions=${enableFunctions}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setStatus("Connected");
        wsRef.current = ws;
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "ready") {
          setStatus("Ready to record");
          if (message.features?.available_functions) {
            setAvailableFunctions(message.features.available_functions);
          }
          console.log("Features enabled:", message.features);
        } else if (message.type === "audio") {
          const audioData = base64ToArrayBuffer(message.data);
          audioQueueRef.current.push(audioData);
          if (!isPlayingRef.current) {
            playAudioQueue();
          }
        } else if (message.type === "text") {
          setTranscript((prev) => [...prev, `AI: ${message.data}`]);
        } else if (message.type === "tool_call") {
          // Log when a function is called
          const toolCall: ToolCall = {
            function_name: message.function_name,
            arguments: message.arguments,
            timestamp: new Date().toLocaleTimeString(),
          };
          setToolCalls((prev) => [...prev, toolCall]);
          setTranscript((prev) => [
            ...prev,
            `🔧 Calling: ${message.function_name}(${JSON.stringify(message.arguments)})`,
          ]);
        } else if (message.type === "tool_result") {
          // Log function results
          const toolResult: ToolResult = {
            function_name: message.function_name,
            result: message.result,
            timestamp: new Date().toLocaleTimeString(),
          };
          setToolResults((prev) => [...prev, toolResult]);
          setTranscript((prev) => [
            ...prev,
            `✅ Result: ${JSON.stringify(message.result)}`,
          ]);
        } else if (message.type === "search_code") {
          // Google Search executable code
          setSearchResults((prev) => [...prev, `Code: ${message.code}`]);
          setTranscript((prev) => [...prev, `🔍 Searching with code...`]);
        } else if (message.type === "search_result") {
          // Google Search results
          setSearchResults((prev) => [...prev, `Result: ${message.output}`]);
          setTranscript((prev) => [...prev, `📊 Search result received`]);
        } else if (message.type === "turn_complete") {
          console.log("Turn complete");
        } else if (message.type === "error") {
          console.error("Server error:", message.data);
          setStatus(`Error: ${message.data}`);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("Connection error");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        setIsRecording(false);
        setStatus("Disconnected");
        wsRef.current = null;
      };
    } catch (error) {
      console.error("Connection error:", error);
      setStatus("Failed to connect");
    }
  };

  // Send text message
  const sendText = async (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("Please connect first");
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "text",
        data: text,
      }),
    );

    setTranscript((prev) => [...prev, `You: ${text}`]);
  };

  // Start recording audio
  const startRecording = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("Please connect first");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;
      audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
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
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.data;
        const pcmData = floatTo16BitPCM(inputData);

        wsRef.current.send(
          JSON.stringify({
            type: "audio",
            data: arrayBufferToBase64(pcmData.buffer),
          }),
        );
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      setIsRecording(true);
      setStatus("Recording...");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to access microphone");
    }
  };

  // Stop recording
  const stopRecording = () => {
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
    setStatus("Connected");
  };

  // Disconnect WebSocket
  const disconnect = () => {
    if (isRecording) {
      stopRecording();
    }

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setStatus("Disconnected");
  };

  // Clear all logs
  const clearLogs = () => {
    setTranscript([]);
    setToolCalls([]);
    setToolResults([]);
    setSearchResults([]);
  };

  // Play audio queue
  const playAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    const audioContext = new AudioContext({ sampleRate: RECEIVE_SAMPLE_RATE });

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift()!;
      const audioBuffer = await pcmToAudioBuffer(
        audioContext,
        audioData,
        RECEIVE_SAMPLE_RATE,
      );
      await playAudioBuffer(audioContext, audioBuffer);
    }

    audioContext.close();
    isPlayingRef.current = false;
  };

  // Helper functions
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
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
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
  ): Promise<void> => {
    return new Promise((resolve) => {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => resolve();
      source.start();
    });
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-3xl font-bold">
          Gemini Audio Chat with Tools
        </h1>

        {/* Status and Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Status: <span className="font-semibold">{status}</span>
            </p>
            {availableFunctions.length > 0 && (
              <p className="text-xs text-blue-600">
                Functions: {availableFunctions.join(", ")}
              </p>
            )}
          </div>

          {/* Feature toggles */}
          {!isConnected && (
            <div className="flex gap-4 rounded bg-gray-50 p-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableSearch}
                  onChange={(e) => setEnableSearch(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Enable Google Search</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableFunctions}
                  onChange={(e) => setEnableFunctions(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Enable Function Calling</span>
              </label>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {!isConnected ? (
              <button
                onClick={connect}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Connect
              </button>
            ) : (
              <>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                  >
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    Stop Recording
                  </button>
                )}
                <button
                  onClick={disconnect}
                  className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                >
                  Disconnect
                </button>
                <button
                  onClick={clearLogs}
                  className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
                >
                  Clear Logs
                </button>
              </>
            )}
          </div>

          {/* Text input for testing */}
          {isConnected && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message or question..."
                className="flex-1 rounded border px-4 py-2"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value) {
                    sendText(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget
                    .previousSibling as HTMLInputElement;
                  if (input.value) {
                    sendText(input.value);
                    input.value = "";
                  }
                }}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          )}
        </div>

        {/* Grid layout for different panels */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Transcript */}
          <div className="max-h-96 overflow-y-auto rounded bg-gray-50 p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              💬 Transcript
              <span className="text-xs text-gray-500">
                ({transcript.length})
              </span>
            </h2>
            {transcript.length === 0 ? (
              <p className="text-gray-400 italic">No messages yet...</p>
            ) : (
              <div className="space-y-2">
                {transcript.map((msg, idx) => (
                  <p
                    key={idx}
                    className="text-sm break-words"
                  >
                    {msg}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Tool Calls */}
          <div className="max-h-96 overflow-y-auto rounded bg-blue-50 p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              🔧 Function Calls
              <span className="text-xs text-gray-500">
                ({toolCalls.length})
              </span>
            </h2>
            {toolCalls.length === 0 ? (
              <p className="text-gray-400 italic">No function calls yet...</p>
            ) : (
              <div className="space-y-2">
                {toolCalls.map((call, idx) => (
                  <div
                    key={idx}
                    className="rounded bg-white p-2 text-sm"
                  >
                    <p className="font-semibold text-blue-600">
                      {call.function_name}
                    </p>
                    <p className="text-xs text-gray-500">{call.timestamp}</p>
                    <pre className="mt-1 overflow-x-auto text-xs">
                      {JSON.stringify(call.arguments, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tool Results */}
          <div className="max-h-96 overflow-y-auto rounded bg-green-50 p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              ✅ Function Results
              <span className="text-xs text-gray-500">
                ({toolResults.length})
              </span>
            </h2>
            {toolResults.length === 0 ? (
              <p className="text-gray-400 italic">No results yet...</p>
            ) : (
              <div className="space-y-2">
                {toolResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="rounded bg-white p-2 text-sm"
                  >
                    <p className="font-semibold text-green-600">
                      {result.function_name}
                    </p>
                    <p className="text-xs text-gray-500">{result.timestamp}</p>
                    <pre className="mt-1 overflow-x-auto text-xs">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto rounded bg-yellow-50 p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
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
                  <p
                    key={idx}
                    className="rounded bg-white p-2 text-xs break-words"
                  >
                    {result}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded border border-blue-200 bg-blue-50 p-4 text-sm">
        <p className="mb-2 font-semibold">💡 Try these prompts:</p>
        <ul className="list-inside list-disc space-y-1 text-gray-700">
          <li>"What's the weather in San Francisco?"</li>
          <li>"Turn on the lights in the living room"</li>
          <li>"Search for the latest news about AI"</li>
          <li>"When did the last World Cup happen?" (uses Google Search)</li>
        </ul>
      </div>

      <div className="rounded border border-yellow-200 bg-yellow-50 p-4 text-sm">
        <p className="mb-2 font-semibold">⚠️ Important Notes:</p>
        <ul className="list-inside list-disc space-y-1 text-gray-700">
          <li>Use headphones to prevent echo/feedback</li>
          <li>Allow microphone access when prompted</li>
          <li>Make sure the FastAPI server is running on port 8000</li>
          <li>Function calls are executed on the server side</li>
        </ul>
      </div>
    </div>
  );
}
