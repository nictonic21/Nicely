// Where to send someone after they log in, sign up or click an email link.
// Kept free of server imports so middleware and tests can use it.

// Only same-site paths, so ?next=//evil.com (or /\evil.com, which browsers
// treat the same) cannot bounce people to another site.
export function safeNext(raw: string | null | undefined, fallback = "/app"): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") ? raw : fallback;
}

// The "confirm your email" link carries the page the person was heading to
// (for example checkout for the plan they picked) inside Supabase's
// redirect_to, which is our /auth/callback?next=... address. Supabase may
// insert it as-is or percent-encoded, so this reads the raw text after
// "redirect_to=" (which the template puts last) and handles both.
export function nextFromEmailLink(requestUrl: string, fallback = "/app"): string {
  const url = new URL(requestUrl);
  const direct = url.searchParams.get("next");
  if (direct) return safeNext(direct, fallback);
  const at = requestUrl.indexOf("redirect_to=");
  if (at === -1) return fallback;
  let raw = requestUrl.slice(at + "redirect_to=".length);
  if (/^https?%3A/i.test(raw)) {
    try {
      raw = decodeURIComponent(raw);
    } catch {
      return fallback;
    }
  }
  try {
    return safeNext(new URL(raw).searchParams.get("next"), fallback);
  } catch {
    return fallback;
  }
}
