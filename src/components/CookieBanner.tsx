"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, OPEN_SETTINGS_EVENT, setConsent } from "@/lib/consent";
import { META_PIXEL_ID } from "@/components/MetaPixel";

// Asks once whether advertising cookies are OK. Accept and Reject are equally
// easy, as UK guidance requires. Only shown when an ad pixel is set up.
export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    if (getConsent() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, []);

  if (!open) return null;

  function choose(v: "granted" | "denied") {
    const before = getConsent();
    setConsent(v);
    setOpen(false);
    // Withdrawing consent after the pixel loaded: reload so it's gone.
    if (before === "granted" && v === "denied") window.location.reload();
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <p className="text-sm text-ink/75">
          Can we use cookies to measure our Facebook and Instagram ads? It helps us reach people who&apos;d find
          Nicelyy useful. We never share what you write.{" "}
          <Link href="/privacy#cookies" className="font-semibold text-accent underline">Learn more</Link>
        </p>
        <div className="flex flex-none gap-2">
          <button type="button" onClick={() => choose("denied")} className="btn-secondary flex-1 px-4 py-2 text-sm sm:flex-none">
            Reject
          </button>
          <button type="button" onClick={() => choose("granted")} className="btn-primary flex-1 px-4 py-2 text-sm sm:flex-none">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
