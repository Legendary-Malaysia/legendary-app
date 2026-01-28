"use client";

import { MessageSquare, User, Bot, ShieldAlert, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownText } from "@/components/thread/markdown-text";
import { ChatMessage } from "../actions";

interface ConversationThreadProps {
  messages: ChatMessage[];
}

const ROLE_ICONS = {
  user: User,
  assistant: Bot,
  system: ShieldAlert,
  tool: Terminal,
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function HumanMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="group ml-auto flex flex-col gap-1 max-w-[80%]">
      <div className="flex items-center justify-end gap-2 px-2">
        <span className="text-xs text-slate-400">
          {formatDate(message.created_at)}
        </span>
        <span className="text-xs text-blue-500">Human</span>
      </div>
      <div className="bg-indigo-600/40 border border-indigo-500/20 rounded-2xl rounded-tr-sm px-4 py-2 text-slate-200 whitespace-pre-wrap shadow-sm">
        {message.content}
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="group mr-auto flex flex-col gap-1 max-w-[90%] w-full">
      <div className="flex items-center gap-2 px-2">
        <span className="text-xs text-emerald-500">Assistant</span>
        <span className="text-xs text-slate-400">
          {formatDate(message.created_at)}
        </span>
      </div>
      <div className="prose prose-invert max-w-none text-slate-300 px-2">
        <MarkdownText>{message.content}</MarkdownText>
      </div>
      {/* {message.metadata && Object.keys(message.metadata).length > 0 && (
        <div className="mt-1 ml-2 rounded bg-slate-900/50 p-2 text-[10px] font-mono text-slate-500 w-fit max-w-full overflow-x-auto">
          <pre>{JSON.stringify(message.metadata, null, 2)}</pre>
        </div>
      )} */}
    </div>
  );
}

function SystemMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col items-center gap-1 my-2">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-full px-3 py-1 text-[10px] text-slate-500 flex items-center gap-1.5 shadow-sm">
        <ShieldAlert className="h-3 w-3" />
        <span className="uppercase tracking-widest font-semibold">
          {message.role}
        </span>
        <span>•</span>
        <span>{formatDate(message.created_at)}</span>
      </div>
      <div className="text-xs text-slate-400 italic max-w-[80%] text-center">
        {message.content}
      </div>
    </div>
  );
}

export function ConversationThread({ messages }: ConversationThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-3">
        <MessageSquare className="h-8 w-8 opacity-20" />
        <p>No messages in this session.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      {messages.map((message) => {
        if (message.role === "human") {
          return (
            <HumanMessage
              key={message.id}
              message={message}
            />
          );
        }
        if (message.role === "ai") {
          return (
            <AssistantMessage
              key={message.id}
              message={message}
            />
          );
        }
        return (
          <SystemMessage
            key={message.id}
            message={message}
          />
        );
      })}
    </div>
  );
}
