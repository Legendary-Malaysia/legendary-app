"use server";

import { createClient } from "@/lib/supabase/server";

export async function ensureChatSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if session exists
  const { data: session, error: fetchError } = await supabase
    .from("chat_sessions")
    .select("id, user_id")
    .eq("id", sessionId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching chat session:", fetchError);
    return { success: false, error: fetchError.message };
  }

  if (session) {
    // If session exists but has no user_id and we are authenticated, optionally update it?
    // For now, just return success.
    return { success: true, sessionId: session.id };
  }

  // Create session if it doesn't exist
  const insertData: any = { id: sessionId };
  if (user) {
    insertData.user_id = user.id;
  }

  const { error: insertError } = await supabase
    .from("chat_sessions")
    .insert(insertData);

  if (insertError) {
    console.error("Error creating chat session:", insertError);
    return { success: false, error: insertError.message };
  }

  return { success: true, sessionId };
}

export async function logChatMessage(
  sessionId: string,
  role: "human" | "ai" | "system" | "tool",
  content: string,
  metadata: any = {},
) {
  const supabase = await createClient();

  // Ensure session exists first
  const sessionResult = await ensureChatSession(sessionId);
  if (!sessionResult.success) {
    return sessionResult;
  }

  const { error } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role: role,
    content,
    metadata,
  });

  if (error) {
    console.error("Error logging chat message:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
