import { isFormat, isRecipient, isTone, MAX_CHARS } from "@/lib/options";
import type { RewriteInput } from "@/lib/rewrite";

// Reads and checks the fields every rewrite request sends.
// Returns the clean input, or a friendly error message.
export function parseRewriteBody(body: Record<string, unknown>): RewriteInput | { error: string } {
  const text = typeof body.text === "string" ? body.text : "";
  const received = typeof body.received === "string" ? body.received : "";
  const { tone, recipient, format } = body;
  if (!text.trim()) return { error: "Write, paste or say what you want to say first." };
  if (text.length > MAX_CHARS || received.length > MAX_CHARS) {
    return { error: `Please keep each box under ${MAX_CHARS.toLocaleString()} characters.` };
  }
  if (!isTone(tone) || !isRecipient(recipient) || !isFormat(format)) {
    return { error: "Please choose a tone and who it's for." };
  }
  return { text, received, tone, recipient, format };
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const b = await request.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const DECLINED_MESSAGE =
  "We can't help with that one. Try telling us the point you want to make, and we'll help you say it well.";
export const FAILED_MESSAGE =
  "We couldn't rewrite that just now. You haven't been charged for it. Please try again.";
