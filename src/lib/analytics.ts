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

// Meta (Facebook / Instagram) ad events. Only sent if the visitor accepted
// advertising cookies, because the pixel only exists after consent. Never
// pass anything people wrote: just the event name and, for money events, the
// plan's price.
type Fbq = (...args: unknown[]) => void;
export function metaTrack(event: string, params?: Record<string, string | number>, eventId?: string) {
  try {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    if (!fbq) return;
    if (eventId) fbq("track", event, params ?? {}, { eventID: eventId });
    else fbq("track", event, params ?? {});
  } catch {}
}
