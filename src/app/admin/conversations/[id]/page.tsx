import { getChatSession } from "../actions";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  MessageSquare,
  User,
  Bot,
  Terminal,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ConversationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ROLE_ICONS = {
  user: User,
  assistant: Bot,
  system: ShieldAlert,
  tool: Terminal,
};

const ROLE_STYLES = {
  user: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  assistant: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  system: "bg-slate-500/10 border-slate-500/20 text-slate-400",
  tool: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { id } = await params;
  const data = await getChatSession(id);

  if (!data) {
    notFound();
  }

  const { session } = data;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/conversations"
        className="flex w-fit items-center gap-2 text-sm text-slate-400 transition-colors hover:text-indigo-400"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Conversations
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Conversation Detail
          </h1>
          <p className="text-slate-400">
            Session: <span className="font-mono text-xs">{session.id}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Info Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base text-white">
                Session Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-slate-500">User</p>
                <p className="font-medium text-slate-300">
                  {session.profiles?.email || "Anonymous"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Started</p>
                <p className="font-medium text-slate-300">
                  {formatDate(session.created_at)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Last Activity</p>
                <p className="font-medium text-slate-300">
                  {formatDate(session.updated_at)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Total Messages</p>
                <p className="font-medium text-slate-300">
                  {session.messages.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-3">
          <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageSquare className="h-5 w-5 text-indigo-400" />
                Transcript
              </CardTitle>
              <CardDescription className="text-slate-400">
                Full history of messages in this session
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700/50">
                {session.messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No messages in this session.
                  </div>
                ) : (
                  session.messages.map((message) => {
                    const Icon =
                      ROLE_ICONS[message.role as keyof typeof ROLE_ICONS] ||
                      MessageSquare;
                    return (
                      <div
                        key={message.id}
                        className="flex gap-4 p-6 transition-colors hover:bg-slate-700/10"
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                            ROLE_STYLES[
                              message.role as keyof typeof ROLE_STYLES
                            ] || "bg-slate-700 text-slate-300",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              {message.role}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                          <div className="prose prose-invert max-w-none text-slate-300">
                            {message.content}
                          </div>
                          {message.metadata &&
                            Object.keys(message.metadata).length > 0 && (
                              <div className="mt-2 rounded bg-slate-900/50 p-2 text-[10px] font-mono text-slate-500">
                                <pre>
                                  {JSON.stringify(message.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
