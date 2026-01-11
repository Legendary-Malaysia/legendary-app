import { getTickets, SupportTicket } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

const STATUS_STYLES = {
  open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved: "bg-green-500/10 text-green-400 border-green-500/20",
  closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const PRIORITY_STYLES = {
  low: "text-slate-400",
  medium: "text-blue-400",
  high: "text-amber-400",
  urgent: "text-red-400",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateId(id: string) {
  return id.slice(0, 8);
}

export default async function SupportPage() {
  const tickets = await getTickets();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Support Tickets
          </h1>
          <p className="text-slate-400">
            View and manage your support requests
          </p>
        </div>
        <Link href="/admin/support/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Ticket className="h-5 w-5 text-indigo-400" />
                All Tickets
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage and track all support tickets
              </CardDescription>
            </div>
            {/* Placeholder for future search/filter implementation */}
            <div className="flex gap-2">
              {/* <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search tickets..."
                  className="w-[200px] border-slate-700 bg-slate-900/50 pl-9 text-white placeholder:text-slate-500 hover:bg-slate-900/70 focus:bg-slate-900"
                />
              </div>
              <Button variant="outline" size="icon" className="border-slate-700 bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white">
                <Filter className="h-4 w-4" />
              </Button> */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-slate-700/50">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 text-xs text-slate-300 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Ticket ID</th>
                  <th className="px-6 py-3 font-medium">Subject</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Created By</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Ticket className="h-8 w-8 text-slate-600" />
                        <p className="font-medium text-slate-300">
                          No tickets found
                        </p>
                        <p className="text-slate-500">
                          Create a new ticket to get started
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="group transition-colors hover:bg-slate-700/20"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        #{truncateId(ticket.id)}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {ticket.subject}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-300">
                            {ticket.customer_name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {ticket.customer_email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[ticket.status]
                          }`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            PRIORITY_STYLES[ticket.priority]
                          }`}
                        >
                          {ticket.priority.charAt(0).toUpperCase() +
                            ticket.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {ticket.created_by || "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/support/${ticket.id}`}
                          className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
