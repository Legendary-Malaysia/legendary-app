import { getChatSessions } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { SessionPagination } from "./components";
import { DeleteSessionButton } from "./delete-session-button";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}) {
  const { search: query = "", page = "1" } = await searchParams;

  const pageSize = 10;
  const parsedPage = Math.floor(Number(page));
  const currentPage = parsedPage > 0 ? parsedPage : 1;

  const { sessions, count } = await getChatSessions({
    page: currentPage,
    pageSize,
    search: query,
  });

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Chat Conversations
          </h1>
          <p className="text-slate-400">Monitor and review AI chat history</p>
        </div>
      </div>

      <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageSquare className="h-5 w-5 text-indigo-400" />
                All Sessions
              </CardTitle>
              <CardDescription className="text-slate-400">
                View all recent chat interactions
              </CardDescription>
            </div>
            {/* Search */}
            {/* <div className="flex flex-col gap-2 sm:flex-row">
              <SessionSearch />
            </div> */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-700/50">
            <table className="w-full min-w-[800px] text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 text-xs text-slate-300 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Session ID</th>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Messages</th>
                  <th className="px-6 py-3 font-medium">Last Activity</th>
                  <th className="px-6 py-3 font-medium">Started</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {sessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <MessageSquare className="h-8 w-8 text-slate-600" />
                        <p className="font-medium text-slate-300">
                          No conversations found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="group transition-colors hover:bg-slate-700/20"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-white">
                        {session.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300">
                          {session.profiles?.email || "Anonymous"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-300">
                          {session.message_count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(session.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {formatDate(session.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/admin/conversations/${session.id}`}
                            className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
                          >
                            Detail
                          </Link>
                          <DeleteSessionButton sessionId={session.id} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {count > 0 && (
        <SessionPagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}
