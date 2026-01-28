"use server";

import { createClient } from "@/lib/supabase/server";

export async function ensureChatSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Use upsert with ignoreDuplicates to ensure the session exists without crashing if it was just created
  // by a concurrent request. This also works around RLS issues where anonymous users might not be
  // able to 'select' the session they just created.
  const insertData: any = { id: sessionId };
  if (user) {
    insertData.user_id = user.id;
  }

  const { error: upsertError } = await supabase
    .from("chat_sessions")
    .upsert(insertData, { onConflict: "id", ignoreDuplicates: true });

  if (upsertError) {
    console.error("Error ensuring chat session:", upsertError);
    return { success: false, error: upsertError.message };
  }

  return { success: true, sessionId };
}

export async function logChatMessage(
  sessionId: string,
  role: "human" | "ai" | "system" | "tool",
  content: string,
  metadata: any = {},
) {
  const enableLogging = process.env.ENABLE_CONVERSATION_LOGGING === "true";

  if (!enableLogging) {
    return { success: true };
  }

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
