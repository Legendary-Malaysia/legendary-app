import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef, memo, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import { StatusMessage } from "./messages/status";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { TooltipIconButton } from "./tooltip-icon-button";
import { ArrowDown, LoaderCircle, SquarePen, XIcon, Send } from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import {
  useArtifactOpen,
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
} from "./artifact";
import { LegendaryLogo } from "../icons/legendary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { VoiceCallButton } from "@/components/voice-call";

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

const SUGGESTED_QUESTIONS: Record<"en" | "id", string[]> = {
  en: [
    "Hi! Can you tell me what Orchid fragrance is all about?",
    "How long does Orchid fragrance last?",
    "What occasions would Orchid be suitable for?",
    "Who would love Orchid fragrance?",
    "What are the scent notes in Mahsuri?",
    "What's the story behind Mahsuri?",
    "How does the water-based formula work in Three Wishes?",
    "Does Three Wishes have any skincare benefits?",
    "What does each 'wish' represent?",
    "Who is Three Wishes ideal for?",
    "How many fragrances are in the Nyonya Series?",
    "What makes the Nyonya Series unique?",
    "Who is Spirit I ideal for?",
    "What's the difference between Spirit I and Spirit II?",
    "What makes Violet special or unique?",
    "Who is Violet ideal for?",
    "What does Man smell like? What are the notes?",
    "What makes Man special or unique?",
    "Can I wear Man both during the day and at night?",
    "What is your most well-known perfume?",
    "Where can I find Legendary perfumes?",
    "What types of perfumes do you offer?",
    "How can I contact Legendary?",
  ],
  id: [
    "Hi! Bisakah kamu ceritakan apa itu parfum Orchid?",
    "Berapa lama parfum Orchid bertahan?",
    "Untuk acara apa saja Orchid cocok digunakan?",
    "Siapa yang akan menyukai parfum Orchid?",
    "Apa saja aroma (scent notes) dalam Mahsuri?",
    "Apa kisah di balik Mahsuri?",
    "Bagaimana formula berbasis air bekerja dalam Three Wishes?",
    "Apakah Three Wishes memiliki manfaat untuk perawatan kulit?",
    "Apa yang diwakili oleh masing-masing 'wish'?",
    "Siapa yang cocok menggunakan Three Wishes?",
    "Berapa banyak parfum yang ada dalam Seri Nyonya?",
    "Apa yang membuat Seri Nyonya unik?",
    "Siapa yang cocok menggunakan Spirit I?",
    "Apa perbedaan antara Spirit I dan Spirit II?",
    "Apa yang membuat Violet istimewa atau unik?",
    "Siapa yang cocok menggunakan Violet?",
    "Apa aroma dari Man? Apa saja scent notes-nya?",
    "Apa yang membuat Man istimewa atau unik?",
    "Bisakah saya memakai Man baik di siang maupun malam hari?",
    "Apa parfummu yang paling terkenal?",
    "Di mana saya bisa menemukan parfum Legendary?",
    "Apa jenis parfum yang kamu tawarkan?",
    "Bagaimana cara saya menghubungi Legendary?",
  ],
};

const TickerRow = memo(
  ({
    items,
    reverse,
    onSelect,
  }: {
    items: string[];
    reverse?: boolean;
    onSelect: (q: string) => void;
  }) => {
    // Use a stable random duration
    const duration = useRef(50 + Math.random() * 20).current;

    return (
      <div className="group flex w-full overflow-hidden px-4 py-1">
        <motion.div
          className="flex gap-3 whitespace-nowrap"
          animate={{
            x: reverse ? [-1500, 0] : [0, -1500],
          }}
          transition={{
            repeat: Infinity,
            duration: duration,
            ease: "linear",
            repeatType: "loop",
          }}
          style={{ width: "max-content" }}
        >
          {/* Repeat items to ensure continuous scrolling */}
          {[...items, ...items, ...items, ...items].map((q, i) => (
            <Button
              key={`${q}-${i}`}
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900 active:scale-95"
              onClick={() => onSelect(q)}
            >
              {q}
            </Button>
          ))}
        </motion.div>
      </div>
    );
  },
);

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const QuestionTicker = memo(
  ({
    onSelect,
    language,
  }: {
    onSelect: (q: string) => void;
    language: "en" | "id";
  }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
    }, []);

    const questions = SUGGESTED_QUESTIONS[language] || SUGGESTED_QUESTIONS.en;

    // Create independently randomized pools for each row, stable per language
    const row1Pool = useMemo(() => shuffleArray(questions), [questions]);
    const row2Pool = useMemo(() => shuffleArray(questions), [questions]);
    const row3Pool = useMemo(() => shuffleArray(questions), [questions]);

    if (!mounted) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mt-2 flex w-full max-w-3xl flex-col gap-1 overflow-hidden"
      >
        {/* Gradient Overlays */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent" />

        <TickerRow
          items={row1Pool}
          onSelect={onSelect}
        />
        <TickerRow
          items={row2Pool}
          reverse
          onSelect={onSelect}
        />
        <TickerRow
          items={row3Pool}
          onSelect={onSelect}
        />
      </motion.div>
    );
  },
);

export function Thread() {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  // const [hideToolCalls, setHideToolCalls] = useQueryState(
  //   "hideToolCalls",
  //   parseAsBoolean.withDefault(false),
  // );
  const [input, setInput] = useState("");
  const {
    contentBlocks,
    setContentBlocks,
    dropRef,
    removeBlock,
    resetBlocks: _resetBlocks,
    dragOver,
    handlePaste,
  } = useFileUpload();
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  // Stop streaming on unmount
  useEffect(() => {
    return () => {
      stream.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  const submitMessage = (text: string, overrideBlocks?: any[]) => {
    const blocks = overrideBlocks ?? contentBlocks;
    if ((text.trim().length === 0 && blocks.length === 0) || isLoading) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(text.trim().length > 0 ? [{ type: "text", text: text }] : []),
        ...blocks,
      ] as Message["content"],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], context },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          context,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );

    setInput("");
    setContentBlocks([]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitMessage(input);
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = Math.max(0, prevMessageLength.current - 1);
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
    });
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );

  const LanguagePicker = () => {
    if (chatStarted) return null;

    const languages = [
      { code: "en", name: "EN" },
      { code: "id", name: "ID" },
    ];

    return (
      <Select
        value={stream.language}
        onValueChange={(value) => stream.setLanguage(value as "en" | "id")}
      >
        <SelectTrigger className="w-[65px] border-gray-200 bg-white shadow-sm transition-all hover:bg-gray-50">
          <SelectValue placeholder="Select Language" />
        </SelectTrigger>
        <SelectContent
          align="end"
          className="min-w-[65px]"
        >
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="w-[65px] hover:cursor-pointer"
            >
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="relative hidden lg:flex">
        <motion.div
          className="absolute z-20 h-full overflow-hidden border-r bg-white"
          style={{ width: 300 }}
          animate={
            isLargeScreen
              ? { x: chatHistoryOpen ? 0 : -300 }
              : { x: chatHistoryOpen ? 0 : -300 }
          }
          initial={{ x: -300 }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          <div
            className="relative h-full"
            style={{ width: 300 }}
          >
            {/* <ThreadHistory /> */}
          </div>
        </motion.div>
      </div>

      <div
        className={cn(
          "grid w-full grid-cols-[1fr_0fr] transition-all duration-500",
          artifactOpen && "grid-cols-[3fr_2fr]",
        )}
      >
        <motion.div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col overflow-hidden",
            !chatStarted && "grid-rows-[1fr]",
          )}
          layout={isLargeScreen}
          animate={{
            marginLeft: chatHistoryOpen ? (isLargeScreen ? 300 : 0) : 0,
            width: chatHistoryOpen
              ? isLargeScreen
                ? "calc(100% - 300px)"
                : "100%"
              : "100%",
          }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          {!chatStarted && (
            <div className="absolute top-0 left-0 z-10 flex w-full items-center justify-between gap-3 p-2 pl-4">
              <div className="absolute top-2 right-4 flex items-center">
                <LanguagePicker />
              </div>
            </div>
          )}
          {chatStarted && (
            <div className="relative z-10 flex items-center justify-between gap-3 p-2">
              <div className="relative flex items-center justify-start gap-2">
                {/* <div className="absolute left-0 z-10">
                  {(!chatHistoryOpen || !isLargeScreen) && (
                    <Button
                      className="hover:bg-gray-100"
                      variant="ghost"
                      onClick={() => setChatHistoryOpen((p) => !p)}
                    >
                      {chatHistoryOpen ? (
                        <PanelRightOpen className="size-5" />
                      ) : (
                        <PanelRightClose className="size-5" />
                      )}
                    </Button>
                  )}
                </div> */}
                <motion.button
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() => window.location.reload()}
                  animate={{
                    marginLeft: !chatHistoryOpen ? 8 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <LegendaryLogo
                    width={107}
                    height={16}
                  />
                </motion.button>
              </div>

              <div className="flex items-center gap-4">
                <LanguagePicker />
                {/* <div className="flex items-center">
                  <OpenGitHubRepo />
                </div> */}
                <TooltipIconButton
                  size="lg"
                  className="p-4"
                  tooltip="New thread"
                  variant="ghost"
                  onClick={() => window.location.reload()}
                >
                  <SquarePen className="size-5" />
                </TooltipIconButton>
              </div>

              <div className="from-background to-background/0 absolute inset-x-0 top-full h-5 bg-gradient-to-b" />
            </div>
          )}

          <StickToBottom className="relative flex-1 overflow-hidden">
            <StickyToBottomContent
              className={cn(
                "absolute inset-0 overflow-y-scroll px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
                !chatStarted &&
                  "flex flex-col items-stretch pt-[10vh] sm:pt-[25vh]",
                chatStarted && "grid grid-rows-[1fr_auto]",
              )}
              contentClassName="pt-8 pb-16 max-w-3xl mx-auto flex flex-col gap-4 w-full"
              content={
                <>
                  {messages
                    .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                    .map((message, index) =>
                      message.type === "human" ? (
                        <HumanMessage
                          key={message.id || `${message.type}-${index}`}
                          message={message}
                          isLoading={isLoading}
                        />
                      ) : (
                        <AssistantMessage
                          key={message.id || `${message.type}-${index}`}
                          message={message}
                          isLoading={isLoading}
                          handleRegenerate={handleRegenerate}
                        />
                      ),
                    )}
                  {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
                    We need to render it outside of the messages list, since there are no messages to render */}
                  {hasNoAIOrToolMessages && !!stream.interrupt && (
                    <AssistantMessage
                      key="interrupt-msg"
                      message={undefined}
                      isLoading={isLoading}
                      handleRegenerate={handleRegenerate}
                    />
                  )}
                  {isLoading && !firstTokenReceived && (
                    <AssistantMessageLoading />
                  )}
                  <StatusMessage status={(stream as any).status} />
                </>
              }
              footer={
                <div className="sticky bottom-0 flex flex-col items-center gap-4 bg-white sm:gap-8">
                  {!chatStarted && (
                    <div className="flex items-center gap-3">
                      <LegendaryLogo
                        width={214}
                        height={32}
                      />
                    </div>
                  )}

                  <ScrollToBottom className="bg-muted animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                  <div
                    ref={dropRef}
                    className={cn(
                      "bg-muted relative z-10 mx-auto mb-4 w-full max-w-3xl rounded-2xl shadow-xs transition-all",
                      dragOver
                        ? "border-primary border-2 border-dotted"
                        : "border border-solid",
                    )}
                  >
                    <form
                      onSubmit={handleSubmit}
                      className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2"
                    >
                      <ContentBlocksPreview
                        blocks={contentBlocks}
                        onRemove={removeBlock}
                      />
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !e.metaKey &&
                            !e.nativeEvent.isComposing
                          ) {
                            e.preventDefault();
                            const el = e.target as HTMLElement | undefined;
                            const form = el?.closest("form");
                            form?.requestSubmit();
                          }
                        }}
                        placeholder={
                          stream.language === "id"
                            ? "Temukan kisah di balik Legendary..."
                            : "Find the story behind Legendary..."
                        }
                        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                      />

                      <div className="flex items-center gap-6 p-2 pt-4">
                        {stream.isLoading ? (
                          <Button
                            key="stop"
                            onClick={() => stream.stop()}
                            className="ml-auto"
                          >
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="ml-auto shadow-md transition-all"
                            disabled={
                              isLoading ||
                              (!input.trim() && contentBlocks.length === 0)
                            }
                          >
                            <Send className="size-5" />
                          </Button>
                        )}
                      </div>
                    </form>
                  </div>

                  {!chatStarted && (
                    <>
                      <QuestionTicker
                        language={stream.language}
                        onSelect={(q) => submitMessage(q, [])}
                      />
                      <VoiceCallButton className="bg-black hover:bg-gray-700" />
                    </>
                  )}
                </div>
              }
            />
          </StickToBottom>
          <FooterNote
            chatStarted={chatStarted}
            language={stream.language}
          />
        </motion.div>
        <div className="relative flex flex-col border-l">
          <div className="absolute inset-0 flex min-w-[30vw] flex-col">
            <div className="grid grid-cols-[1fr_auto] border-b p-4">
              <ArtifactTitle className="truncate overflow-hidden" />
              <button
                onClick={closeArtifact}
                className="cursor-pointer"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <ArtifactContent className="relative flex-grow" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FooterNote({
  chatStarted,
  language,
}: {
  chatStarted: boolean;
  language: "en" | "id";
}) {
  return (
    <div className="flex flex-col items-center pb-4">
      {!chatStarted && (
        <div className="flex items-center gap-3 px-4 py-2">
          <p className="w-full text-center text-xs text-gray-500">
            <span className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <a
                href="/disclaimer"
                className="whitespace-nowrap hover:underline"
              >
                Disclaimer
              </a>
              <span className="hidden text-gray-300 sm:inline">•</span>
              <a
                href="https://legendary.com.my/pages/privacy-policy"
                className="whitespace-nowrap hover:underline"
              >
                Privacy Policy
              </a>
              <span className="hidden text-gray-300 sm:inline">•</span>
              <a
                href="https://legendary.com.my/pages/terms-of-service"
                className="whitespace-nowrap hover:underline"
              >
                Terms of Service
              </a>
              <span className="hidden text-gray-300 sm:inline">•</span>
              <a
                href="https://legendary.com.my/"
                className="whitespace-nowrap hover:underline"
              >
                legendary.com.my
              </a>
            </span>
          </p>
        </div>
      )}
      {chatStarted && (
        <div className="flex items-center">
          <p className="text-muted-foreground text-xs">
            {language === "id"
              ? "AI dapat membuat kesalahan. Pastikan untuk memverifikasi informasi."
              : "AI can make mistakes. Please verify the information."}
          </p>
        </div>
      )}
    </div>
  );
}
