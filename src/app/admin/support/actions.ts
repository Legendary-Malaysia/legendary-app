"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SupportTicket = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category:
    | "bug"
    | "feature_request"
    | "billing"
    | "technical_support"
    | "account_issue"
    | "general_inquiry"
    | "other";
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  profiles?: {
    email: string | null;
  } | null;
};

export type GetTicketsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
};

export async function getTickets(options: GetTicketsOptions = {}): Promise<{
  tickets: SupportTicket[];
  count: number;
}> {
  const { user, role } = await requireAuth("/admin/support");
  const supabase = await createClient();

  const isAdmin = role === "admin";
  const { page = 1, pageSize = 10, search = "", status, priority } = options;

  let query = supabase
    .from("support_tickets")
    .select("*, profiles:created_by(email)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("created_by", user.id);
  }

  // Apply filters
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (priority && priority !== "all") {
    query = query.eq("priority", priority);
  }

  // Apply search
  if (search) {
    // Note: This simple OR search assumes we can cast text fields comfortably.
    // For more complex search features, we might need a stored procedure or Full Text Search.
    // We are searching on: subject, customer_name, customer_email, and description (optional but good).
    const searchCondition = `subject.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`;
    query = query.or(searchCondition);
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching tickets:", error);
    return { tickets: [], count: 0 };
  }

  return { tickets: data as SupportTicket[], count: count || 0 };
}

export async function getTicket(id: string): Promise<SupportTicket | null> {
  const { user, role } = await requireAuth(`/admin/support/${id}`);
  const supabase = await createClient();

  const isAdmin = role === "admin";

  let query = supabase
    .from("support_tickets")
    .select("*, profiles:created_by(email)")
    .eq("id", id);

  if (!isAdmin) {
    query = query.eq("created_by", user.id);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error("Error fetching ticket:", error);
    return null;
  }

  return data as SupportTicket;
}

export type ActionState = {
  success: boolean;
  error?: string;
};

export async function createTicket(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireAuth("/admin/support");
  const supabase = await createClient();

  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const priority = formData.get("priority") as string;
  const customer_name = formData.get("customer_name") as string;
  const customer_email = formData.get("customer_email") as string;
  const customer_phone = formData.get("customer_phone") as string;

  // Validate required fields
  if (
    !subject ||
    !description ||
    !category ||
    !priority ||
    !customer_name ||
    !customer_email
  ) {
    return { success: false, error: "All fields are required" };
  }

  const { error } = await supabase.from("support_tickets").insert({
    customer_name,
    customer_email,
    customer_phone: customer_phone || null,
    subject,
    description,
    category,
    priority,
    created_by: user.id,
  });

  if (error) {
    console.error("Error creating ticket:", error);
    return { success: false, error: "Failed to create ticket" };
  }

  revalidatePath("/admin/support");
  redirect("/admin/support");
}

export async function updateTicket(
  id: string,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, role } = await requireAuth(`/admin/support/${id}`);
  const supabase = await createClient();

  const isAdmin = role === "admin";

  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const priority = formData.get("priority") as string;
  const status = formData.get("status") as string;
  const customer_name = formData.get("customer_name") as string;
  const customer_email = formData.get("customer_email") as string;
  const customer_phone = formData.get("customer_phone") as string;

  if (
    !subject ||
    !description ||
    !category ||
    !priority ||
    !status ||
    !customer_name ||
    !customer_email
  ) {
    return { success: false, error: "All fields are required" };
  }

  const updates: any = {
    customer_name,
    customer_email,
    customer_phone: customer_phone || null,
    subject,
    description,
    category,
    priority,
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "resolved" && !updates.resolved_at) {
    updates.resolved_at = new Date().toISOString();
  }
  if (status === "closed" && !updates.closed_at) {
    updates.closed_at = new Date().toISOString();
  }

  let query = supabase.from("support_tickets").update(updates).eq("id", id);

  if (!isAdmin) {
    query = query.eq("created_by", user.id);
  }

  const { error } = await query;

  if (error) {
    console.error("Error updating ticket:", error);
    return { success: false, error: "Failed to update ticket" };
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
  redirect("/admin/support");
}
