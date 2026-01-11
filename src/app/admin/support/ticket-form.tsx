"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  SupportTicket,
  createTicket,
  updateTicket,
  ActionState,
} from "./actions";

const CATEGORIES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "billing", label: "Billing" },
  { value: "technical_support", label: "Technical Support" },
  { value: "account_issue", label: "Account Issue" },
  { value: "general_inquiry", label: "General Inquiry" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-slate-400" },
  { value: "medium", label: "Medium", color: "text-blue-400" },
  { value: "high", label: "High", color: "text-amber-400" },
  { value: "urgent", label: "Urgent", color: "text-red-400" },
];

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

interface TicketFormProps {
  initialData?: SupportTicket;
}

export function TicketForm({ initialData }: TicketFormProps) {
  // If initialData exists, we are editing, otherwise creating.
  // We wrap the action to include the ID if we are editing.
  const action = initialData
    ? updateTicket.bind(null, initialData.id)
    : createTicket;

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    { success: false },
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/support"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {initialData ? "Edit Ticket" : "Create New Ticket"}
        </h1>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
        {state.error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <form
          action={formAction}
          className="space-y-6"
        >
          {/* Customer Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              Customer Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="customer_name"
                  className="text-slate-300"
                >
                  Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  defaultValue={initialData?.customer_name}
                  required
                  className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="customer_email"
                  className="text-slate-300"
                >
                  Email <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="customer_email"
                  name="customer_email"
                  type="email"
                  defaultValue={initialData?.customer_email}
                  required
                  className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="customer_phone"
                className="text-slate-300"
              >
                Phone (Optional)
              </Label>
              <Input
                id="customer_phone"
                name="customer_phone"
                type="tel"
                defaultValue={initialData?.customer_phone || ""}
                className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="h-px bg-slate-700/50" />

          {/* Ticket Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Ticket Details</h3>

            <div className="space-y-2">
              <Label
                htmlFor="subject"
                className="text-slate-300"
              >
                Subject <span className="text-red-400">*</span>
              </Label>
              <Input
                id="subject"
                name="subject"
                defaultValue={initialData?.subject}
                required
                className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Category <span className="text-red-400">*</span>
                </Label>
                <Select
                  name="category"
                  defaultValue={initialData?.category}
                  required
                >
                  <SelectTrigger className="border-slate-600 bg-slate-900/50 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-800">
                    {CATEGORIES.map((cat) => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                        className="text-white focus:bg-slate-700 focus:text-white"
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  Priority <span className="text-red-400">*</span>
                </Label>
                <Select
                  name="priority"
                  defaultValue={initialData?.priority || "medium"}
                  required
                >
                  <SelectTrigger className="border-slate-600 bg-slate-900/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-800">
                    {PRIORITIES.map((p) => (
                      <SelectItem
                        key={p.value}
                        value={p.value}
                        className="text-white focus:bg-slate-700 focus:text-white"
                      >
                        <span className={p.color}>{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status Field - Only visible in Edit Mode */}
            {initialData && (
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Status <span className="text-red-400">*</span>
                </Label>
                <Select
                  name="status"
                  defaultValue={initialData.status}
                  required
                >
                  <SelectTrigger className="border-slate-600 bg-slate-900/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-800">
                    {STATUSES.map((s) => (
                      <SelectItem
                        key={s.value}
                        value={s.value}
                        className="text-white focus:bg-slate-700 focus:text-white"
                      >
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-slate-300"
              >
                Description <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={initialData?.description}
                rows={5}
                required
                className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/admin/support">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : initialData ? (
                "Update Ticket"
              ) : (
                "Create Ticket"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
