import { createHmac, timingSafeEqual } from "node:crypto";

// Server-only secret for signing links (e.g. email unsubscribe) and salting
// hashed IP addresses. Set NICELYY_SECRET in Vercel to a long random string.
function secret(): string {
  const s = process.env.NICELYY_SECRET;
  if (!s || s.length < 16) throw new Error("NICELYY_SECRET is not set.");
  return s;
}

export function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function verify(value: string, signature: string): boolean {
  try {
    const a = Buffer.from(sign(value));
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
