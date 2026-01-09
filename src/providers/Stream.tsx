import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useRef,
  useMemo,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      context?: Record<string, unknown>;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream> & {
  language: "en" | "id";
  setLanguage: (lang: "en" | "id") => void;
};
const StreamContext = createContext<StreamContextType | undefined>(undefined);

const StreamSession = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [language, setLanguage] = useState<"en" | "id">("en");
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSetLanguage = React.useCallback(
    (lang: "en" | "id") => {
      setLanguage((prevLang) => {
        // Note: messages.length check might be slightly stale if using messages from closure,
        // but it's fine for this purpose.
        if (messages.length === 0) {
          return lang;
        }
        return prevLang;
      });
    },
    [messages.length],
  );

  /**
   * Custom adapter for the FastAPI SSE endpoint.
   *
   * This object implements the `StreamContextType` interface (from `useTypedStream`)
   * using our own state management and fetch logic to communicate with a custom
   * FastAPI backend. The backend is fully functional for our requirements but
   * does not implement the full LangChain SDK protocol.
   *
   * **Implemented properties:**
   * - `messages`, `status`, `isLoading`, `error`: Real state values.
   * - `submit`: Sends messages to the FastAPI endpoint and handles SSE streaming.
   * - `getMessagesMetadata`: Returns minimal metadata structure.
   *
   * **Unused SDK features (no-op or placeholder values):**
   * - `stop`: Not needed (backend handles stream lifecycle).
   * - `setBranch`: Branching not used by our backend.
   * - `interrupt`, `values`, `branches`, `checkpoint`, `next`, `config`, `metadata`:
   *   Required by the interface but not applicable to our backend architecture.
   *
   * The `as any` assertion bypasses TypeScript checking because we intentionally
   * omit SDK-specific properties that our FastAPI backend doesn't use. If the
   * SDK's `StreamContextType` changes, review this adapter for compatibility.
   */
  const streamValue: StreamContextType = useMemo(
    () =>
      ({
        messages,
        status,
        isLoading,
        error,
        language,
        setLanguage: handleSetLanguage,
        submit: async (params: any) => {
          // Abort any existing request before starting a new one
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }

          const controller = new AbortController();
          abortControllerRef.current = controller;
          setIsLoading(true);
          setError(null);
          setStatus("");

          // Optimistically add the human message
          const addedMessages = params?.messages || [];
          const newMessages = [...messages, ...addedMessages];
          setMessages(newMessages);

          try {
            // Map messages to the format expected by the API
            const apiMessages = newMessages
              .map((m) => {
                const role =
                  m.type === "human"
                    ? "user"
                    : m.type === "ai"
                      ? "assistant"
                      : m.type;
                const content =
                  typeof m.content === "string"
                    ? m.content
                    : Array.isArray(m.content)
                      ? (m.content.find((c: any) => c.type === "text") as any)
                          ?.text || ""
                      : "";
                return { role, content };
              })
              .filter((m) => m.content !== "" || m.role === "assistant"); // Keep assistant messages even if empty (streaming)

            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: apiMessages,
                config: { language },
              }),
              signal: controller.signal,
            });

            if (!response.ok || !response.body) {
              const errText = await response.text();
              throw new Error(errText || "Failed to fetch from supervisor");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const aiMessageId = uuidv4();
            let fullContent = "";

            // Add an initial empty AI message
            setMessages((prev) => [
              ...prev,
              { id: aiMessageId, type: "ai", content: "" },
            ]);

            let accumulated = "";
            let teamContent = "";
            let hasStartedTeam = false;

            streamLoop: while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              accumulated += decoder.decode(value, { stream: true });
              const blocks = accumulated.split("\n\n");
              accumulated = blocks.pop() || "";

              for (const block of blocks) {
                const lines = block.split("\n");
                for (const line of lines) {
                  if (line.trim().startsWith("data: ")) {
                    try {
                      const jsonStr = line.trim().slice(6);
                      const data = JSON.parse(jsonStr);
                      if (data.event === "done") break streamLoop;
                      if (data.node === "custom") {
                        // Intermediate status updates
                        setStatus(data.content || "");
                      } else if (data.node === "customer_service_team") {
                        // Final response content
                        if (!hasStartedTeam) {
                          hasStartedTeam = true;
                          setStatus(""); // Clear status when response begins
                        }
                        teamContent += data.content || "";
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === aiMessageId
                              ? { ...m, content: teamContent }
                              : m,
                          ),
                        );
                      } else if (data.error) {
                        // Handle error event data
                        throw new Error(data.error);
                      } else if (!data.node && data.content) {
                        // Fallback for old/unexpected format
                        fullContent += data.content;
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === aiMessageId
                              ? { ...m, content: fullContent }
                              : m,
                          ),
                        );
                      }
                    } catch (e) {
                      console.error("Error parsing SSE data:", e, line);
                    }
                  }
                }
              }
            }
          } catch (err: any) {
            // Ignore abort errors
            if (
              err.name === "AbortError" ||
              err.message?.toLowerCase().includes("abort")
            ) {
              return;
            }

            setError(err);
            toast.error("Backend Error", {
              description: err.message,
            });
          } finally {
            if (abortControllerRef.current === controller) {
              abortControllerRef.current = null;
              setIsLoading(false);
            }
          }
        },
        stop: async () => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }
          setIsLoading(false);
        },
        getMessagesMetadata: (message: Message) => ({
          id: message.id || "",
          firstSeenState: {
            checkpoint: null,
          },
        }),
        setBranch: async () => {},
        interrupt: null,
        values: {},
        branches: {},
        checkpoint: null,
        next: [],
        config: {},
        metadata: {},
      }) as any,
    [messages, status, isLoading, error, language, handleSetLanguage],
  );

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return <StreamSession>{children}</StreamSession>;
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
