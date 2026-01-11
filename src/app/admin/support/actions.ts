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

export async function getTickets(): Promise<SupportTicket[]> {
  const user = await requireAuth("/admin/support");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*, profiles:created_by(email)")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  return data as SupportTicket[];
}

export async function getTicket(id: string): Promise<SupportTicket | null> {
  const user = await requireAuth(`/admin/support/${id}`);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*, profiles:created_by(email)")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

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
  const user = await requireAuth("/admin/support");
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
  const user = await requireAuth(`/admin/support/${id}`);
  const supabase = await createClient();

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

  const { error } = await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) {
    console.error("Error updating ticket:", error);
    return { success: false, error: "Failed to update ticket" };
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
  redirect("/admin/support");
}
