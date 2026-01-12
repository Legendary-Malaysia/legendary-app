import type { Message } from "@langchain/langgraph-sdk";

/**
 * Extracts text content from a message's content array.
 * - If content is a string, returns it directly.
 * - If content is an array, extracts and joins all text parts.
 * - Returns an empty string if no text parts are found.
 */
export function getContentString(content: Message["content"]): string {
  if (typeof content === "string") return content;
  const texts = content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text);
  return texts.join(" ");
}
