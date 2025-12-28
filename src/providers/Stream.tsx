import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { v4 as uuidv4 } from "uuid";
import { useQueryState } from "nuqs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { getApiKey } from "@/lib/api-key";
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

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

const StreamSession = ({
  children,
  apiUrl,
  assistantId: _assistantId,
}: {
  children: ReactNode;
  apiUrl: string;
  assistantId: string;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
  const streamValue: StreamContextType = {
    messages,
    status,
    isLoading,
    error,
    submit: async (params: any) => {
      setIsLoading(true);
      setError(null);
      setStatus("");

      // Optimistically add the human message
      const addedMessages = params?.messages || [];
      setMessages((prev) => [...prev, ...addedMessages]);

      try {
        const currentMessages = [...messages, ...addedMessages];

        // Map messages to the format expected by the API
        const apiMessages = currentMessages
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

        const normalizedApiUrl = apiUrl.endsWith("/")
          ? apiUrl.slice(0, -1)
          : apiUrl;
        const response = await fetch(`${normalizedApiUrl}/${_assistantId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, config: {} }),
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

        while (true) {
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
        setError(err);
        toast.error("Backend Error", {
          description: err.message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    stop: async () => {},
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
  } as any;

  useEffect(() => {
    // Basic connectivity check
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok && res.status !== 404) {
          toast.warning("Backend might be unreachable", {
            description: `Could not connect to ${apiUrl}`,
          });
        }
      })
      .catch(() => {
        toast.error("Connection Failed", {
          description: `FastAPI server not found at ${apiUrl}`,
        });
      });
  }, [apiUrl]);

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

// Default values for the form
const DEFAULT_API_URL = "http://127.0.0.1:8000";
const DEFAULT_ASSISTANT_ID = "agent";

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get environment variables
  const envApiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const envAssistantId: string | undefined =
    process.env.NEXT_PUBLIC_ASSISTANT_ID;

  // Use URL params with env var fallbacks
  const [apiUrl, setApiUrl] = useQueryState("apiUrl", {
    defaultValue: envApiUrl || "",
  });
  const [assistantId, setAssistantId] = useQueryState("assistantId", {
    defaultValue: envAssistantId || "",
  });

  // For API key, use localStorage with env var fallback
  const [apiKey, _setApiKey] = useState(() => {
    const storedKey = getApiKey();
    return storedKey || "";
  });

  const setApiKey = (key: string) => {
    window.localStorage.setItem("lg:chat:apiKey", key);
    _setApiKey(key);
  };

  // Determine final values to use, prioritizing URL params then env vars
  const finalApiUrl = apiUrl || envApiUrl;
  const finalAssistantId = assistantId || envAssistantId;

  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!finalApiUrl || !finalAssistantId) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div className="animate-in fade-in-0 zoom-in-95 bg-background flex max-w-3xl flex-col rounded-lg border shadow-lg">
          <div className="mt-14 flex flex-col gap-2 border-b p-6">
            <div className="flex flex-col items-start gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                Agent Chat
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to Agent Chat! Before you get started, you need to enter
              the URL of the deployment and the assistant / graph ID.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();

              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const apiUrl = formData.get("apiUrl") as string;
              const assistantId = formData.get("assistantId") as string;
              const apiKey = formData.get("apiKey") as string;

              setApiUrl(apiUrl);
              setApiKey(apiKey);
              setAssistantId(assistantId);

              form.reset();
            }}
            className="bg-muted/50 flex flex-col gap-6 p-6"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiUrl">
                Deployment URL<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                This is the URL of your LangGraph deployment. Can be a local, or
                production deployment.
              </p>
              <Input
                id="apiUrl"
                name="apiUrl"
                className="bg-background"
                defaultValue={apiUrl || DEFAULT_API_URL}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="assistantId">
                Assistant / Graph ID<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                This is the ID of the graph (can be the graph name), or
                assistant to fetch threads from, and invoke when actions are
                taken.
              </p>
              <Input
                id="assistantId"
                name="assistantId"
                className="bg-background"
                defaultValue={assistantId || DEFAULT_ASSISTANT_ID}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="apiKey">LangSmith API Key</Label>
              <p className="text-muted-foreground text-sm">
                This is <strong>NOT</strong> required if using a local LangGraph
                server. This value is stored in your browser's local storage and
                is only used to authenticate requests sent to your LangGraph
                server.
              </p>
              <PasswordInput
                id="apiKey"
                name="apiKey"
                defaultValue={apiKey ?? ""}
                className="bg-background"
                placeholder="lsv2_pt_..."
              />
            </div>

            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                size="lg"
              >
                Continue
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <StreamSession
      apiUrl={apiUrl}
      assistantId={assistantId}
    >
      {children}
    </StreamSession>
  );
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
