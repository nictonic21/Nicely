"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import ResultPanel from "@/components/ResultPanel";
import { IconArrowRight, IconInfo, IconSparkle } from "@/components/Icons";
import { TONES, type ToneId } from "@/lib/options";
import { track } from "@/lib/analytics";
import Turnstile, { TURNSTILE_SITE_KEY, type TurnstileHandle } from "@/components/Turnstile";

// The free try on the home page. No account needed.

const EXAMPLE = "my landlord still hasn't fixed the boiler after 3 weeks, im sick of being ignored and freezing";

interface Result {
  versions: { label: string; message: string }[];
  subject: string;
  tip: string;
  safety: "none" | "crisis";
}

export default function TryIt() {
  const [text, setText] = useState("");
  const [tone, setTone] = useState<ToneId>("firm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpNudge, setSignUpNudge] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const check = useRef<TurnstileHandle>(null);

  async function submit() {
    if (loading || !text.trim()) return;
    setLoading(true);
    setError(null);
    track("try_submit", { tone });
    try {
      const res = await fetch("/api/try", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, received: "", tone, recipient: "other", format: "text", turnstileToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.signUp) setSignUpNudge(true);
        if (data.retryCheck) check.current?.reset();
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setResult(data);
      setSelected(0);
      track("try_success", { tone });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const waitingForCheck = !!TURNSTILE_SITE_KEY && !token;

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="card p-5 sm:p-6">
        <label htmlFor="try-text" className="text-sm font-bold">What do you want to say?</label>
        <textarea
          id="try-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 1200))}
          rows={5}
          placeholder={EXAMPLE}
          className="field mt-2 text-[16px] leading-relaxed"
        />
        {!text ? (
          <button type="button" onClick={() => setText(EXAMPLE)} className="mt-2 text-xs font-semibold text-accent hover:underline">
            Use this example
          </button>
        ) : null}
        <p className="mt-4 text-sm font-bold">Tone</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tone === t.id}
              onClick={() => setTone(t.id)}
              className={`chip ${tone === t.id ? "chip-on" : "chip-off"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Turnstile ref={check} onToken={setToken} className="mt-4" />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !text.trim() || waitingForCheck || !!result}
          className={`btn-primary mt-5 w-full py-3.5 ${loading ? "animate-shimmer disabled:opacity-100" : ""}`}
          style={loading ? { backgroundImage: "linear-gradient(90deg,#7C3AED,#DB2777,#F59E0B,#DB2777,#7C3AED)", backgroundSize: "200% 100%" } : undefined}
        >
          <IconSparkle className="h-5 w-5" />
          {loading ? "Writing your message…" : result ? "Free try used" : "Say it nicelyy"}
        </button>
        <p className="mt-2 text-center text-xs text-ink/45">Free, no sign-up. We don&apos;t keep what you write.</p>
        {error ? (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
            <IconInfo className="mt-0.5 h-4 w-4 flex-none" /> {error}
          </p>
        ) : null}
        {signUpNudge && !result ? (
          <Link href="/signup" className="btn-primary mt-3 w-full">
            Create a free account <IconArrowRight />
          </Link>
        ) : null}
      </div>

      <div>
        {result ? (
          <div className="space-y-4">
            <ResultPanel
              versions={result.versions}
              subject={result.subject}
              tip={result.tip}
              safety={result.safety}
              toneLabel={TONES.find((t) => t.id === tone)?.label ?? ""}
              selected={selected}
              onSelect={setSelected}
            />
            <div className="rounded-2xl bg-night p-5 text-white">
              <p className="font-bold">Like it? There&apos;s more.</p>
              <p className="mt-1 text-sm text-white/70">
                Create a free account for 3 more messages, plus voice notes, replies to messages, emails and
                one-tap tweaks.
              </p>
              <Link href="/signup" onClick={() => track("try_signup_click")} className="btn-primary mt-4">
                Get 3 more free <IconArrowRight />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-ink/10 bg-white/50 p-8 text-center">
            <p className="font-bold">Your message will appear here</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-ink/55">Three versions to pick from, ready to copy and send.</p>
          </div>
        )}
      </div>
    </div>
  );
}
