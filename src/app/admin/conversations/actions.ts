"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ChatSession = {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string | null;
  } | null;
  _count?: {
    chat_messages: number;
  };
  message_count?: number;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: "human" | "ai" | "system" | "tool";
  content: string;
  metadata: any;
  created_at: string;
};

export type GetSessionsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export async function getChatSessions(
  options: GetSessionsOptions = {},
): Promise<{
  sessions: ChatSession[];
  count: number;
}> {
  const { user, role } = await requireAuth("/admin/conversations");
  const supabase = await createClient();

  const isAdmin = role === "admin";
  const { page = 1, pageSize = 10, search = "" } = options;

  let query = supabase
    .from("chat_sessions")
    .select("*, chat_messages(count)", { count: "exact" });

  if (!isAdmin) {
    query = query.eq("user_id", user.id);
  }

  // Handle Search on Email or ID
  if (search) {
    const escapedSearch = search.replace(/[%_\\]/g, "\\$&");

    // Fetch matching profiles first since we can't join directly
    const { data: matchingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", `%${escapedSearch}%`);

    const profileIds = matchingProfiles?.map((p) => p.id) || [];

    if (profileIds.length > 0) {
      query = query.or(
        `id.ilike.%${escapedSearch}%,user_id.in.(${profileIds.join(",")})`,
      );
    } else {
      query = query.ilike("id", `%${escapedSearch}%`);
    }
  }

  // Handle sorting and pagination
  query = query.order("updated_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching chat sessions:", error);
    return { sessions: [], count: 0 };
  }

  const sessionsRaw = data || [];

  // Enrich with profiles
  const userIds = Array.from(
    new Set(sessionsRaw.map((s) => s.user_id).filter(Boolean)),
  );
  let profilesMap: Record<string, { email: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    profilesMap = (profiles || []).reduce((acc: any, p: any) => {
      acc[p.id] = { email: p.email };
      return acc;
    }, {});
  }

  const sessions = sessionsRaw.map((session: any) => ({
    ...session,
    profiles: session.user_id ? profilesMap[session.user_id] : null,
    message_count: session.chat_messages?.[0]?.count || 0,
  }));

  return { sessions, count: count || 0 };
}

export async function getChatSession(id: string): Promise<{
  session: ChatSession & { messages: ChatMessage[] };
} | null> {
  const { user, role } = await requireAuth(`/admin/conversations/${id}`);
  const supabase = await createClient();

  const isAdmin = role === "admin";

  let query = supabase
    .from("chat_sessions")
    .select("*, messages:chat_messages(*)")
    .eq("id", id)
    .order("created_at", { referencedTable: "messages", ascending: true });

  if (!isAdmin) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error("Error fetching chat session detail:", error);
    return null;
  }

  const sessionData = data as any;

  // Enrich with profile
  if (sessionData.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", sessionData.user_id)
      .maybeSingle();

    sessionData.profiles = profile;
  }

  return { session: sessionData };
}

export async function deleteChatSession(id: string) {
  const { user, role } = await requireAuth("/admin/conversations");
  const supabase = await createClient();

  const isAdmin = role === "admin";

  let query = supabase.from("chat_sessions").delete().eq("id", id);

  if (!isAdmin) {
    query = query.eq("user_id", user.id);
  }

  const { error } = await query;

  if (error) {
    console.error("Error deleting chat session:", error);
    return { success: false, error: "Failed to delete session" };
  }

  revalidatePath("/admin/conversations");
  return { success: true };
}
