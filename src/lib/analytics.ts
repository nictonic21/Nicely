"use client";

import { track as vercelTrack } from "@vercel/analytics";

// Counts key moments (sign-ups, rewrites, checkouts) so you can see how many
// visitors become customers. Privacy-friendly: no cookies, no message content,
// and nothing that identifies a person. Never fails the page.
type Props = Record<string, string | number | boolean | null>;
export function track(event: string, props?: Props) {
  try {
    vercelTrack(event, props);
  } catch {}
}
