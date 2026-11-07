"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// "Continue with Google / Apple". Each button only appears once that provider
// is switched on in Supabase AND listed in NEXT_PUBLIC_AUTH_PROVIDERS
// (e.g. "google,apple") in Vercel.
const ENABLED = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter((s): s is "google" | "apple" => s === "google" || s === "apple");

export function oauthEnabled() {
  return ENABLED.length > 0;
}

export default function OAuthButtons({ next }: { next: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!ENABLED.length) return null;

  async function go(provider: "google" | "apple") {
    setBusy(provider);
    setError(null);
    const { error: err } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (err) {
      setError("That didn't work. Please try again, or use your email instead.");
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="space-y-2.5">
        {ENABLED.includes("google") ? (
          <button
            type="button"
            onClick={() => go("google")}
            disabled={!!busy}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-5 py-3 font-semibold text-ink shadow-soft transition hover:border-ink/30 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            {busy === "google" ? "Opening Google…" : "Continue with Google"}
          </button>
        ) : null}
        {ENABLED.includes("apple") ? (
          <button
            type="button"
            onClick={() => go("apple")}
            disabled={!!busy}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-black px-5 py-3 font-semibold text-white transition hover:bg-black/85 disabled:opacity-60"
          >
            <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor" aria-hidden>
              <path d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-166 41s-106-57-156-127C44 790 0 663 0 543c0-193 125-295 249-295 66 0 121 43 162 43 39 0 101-46 176-46 29 0 131 3 201 96zM554 159c31-37 53-88 53-139 0-7-1-14-2-20-50 2-110 34-146 76-28 32-55 83-55 135 0 8 1 16 2 18 3 1 9 2 14 2 45 0 102-30 134-72z" />
            </svg>
            {busy === "apple" ? "Opening Apple…" : "Continue with Apple"}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink/35">
        <span className="h-px flex-1 bg-ink/10" /> or use email <span className="h-px flex-1 bg-ink/10" />
      </div>
    </div>
  );
}
