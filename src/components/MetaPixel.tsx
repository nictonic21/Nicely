"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, getConsent } from "@/lib/consent";

// The Meta Pixel, for measuring Facebook / Instagram ads. Loads ONLY after the
// visitor accepts advertising cookies. Automatic data collection is switched
// off (autoConfig false), so Meta never reads buttons or text on the page:
// it only gets the events Nicelyy sends on purpose.

// Nicelyy's Meta Pixel (Events Manager). Pixel IDs aren't secret: every
// site using one shows it to visitors. To change pixel, change this number.
// Set to "" to switch the pixel and the cookie banner off.
export const META_PIXEL_ID = "761860435544865";

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };

function loadPixel(id: string) {
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return;
  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue!.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  w.fbq = fbq;
  w._fbq = fbq;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  fbq("set", "autoConfig", false, id);
  fbq("init", id);
}

export default function MetaPixel() {
  const pathname = usePathname();
  const ready = useRef(false);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    const start = () => {
      if (getConsent() !== "granted" || ready.current) return;
      loadPixel(META_PIXEL_ID);
      ready.current = true;
      (window as unknown as { fbq: Fbq }).fbq("track", "PageView");
    };
    start();
    window.addEventListener(CONSENT_EVENT, start);
    return () => window.removeEventListener(CONSENT_EVENT, start);
  }, []);

  // A page view for each new page in the app (it doesn't fully reload).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (ready.current) (window as unknown as { fbq: Fbq }).fbq("track", "PageView");
  }, [pathname]);

  return null;
}
