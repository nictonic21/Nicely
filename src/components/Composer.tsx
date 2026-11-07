"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import VoiceButton from "@/components/VoiceButton";
import Glow from "@/components/Glow";
import {
  FORMATS,
  MAX_CHARS,
  RECIPIENTS,
  TONES,
  type FormatId,
  type RecipientId,
  type ToneId,
} from "@/lib/options";

interface Usage {
  tier: string;
  planName: string;
  used: number;
  limit: number;
  unlimited: boolean;
  pastDue?: boolean;
}

interface Result {
  message: string;
  subject: string;
  tip: string;
  safety: "none" | "crisis";
}

export default function Composer({ welcome }: { welcome: boolean }) {
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [showReceived, setShowReceived] = useState(false);
  const [received, setReceived] = useState("");
  const [tone, setTone] = useState<ToneId>("professional");
  const [recipient, setRecipient] = useState<RecipientId>("work");
  const [format, setFormat] = useState<FormatId>("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outOfMessages, setOutOfMessages] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.ok) setUsage(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const left = usage ? Math.max(0, usage.limit - usage.used) : null;

  async function submit() {
    if (loading || !text.trim()) return;
    setLoading(true);
    setError(null);
    setOutOfMessages(false);
    setCopied(false);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, received: showReceived ? received : "", tone, recipient, format }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setOutOfMessages(true);
        loadUsage();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setResult({ message: data.message, subject: data.subject, tip: data.tip, safety: data.safety });
      if (data.usage && usage) setUsage({ ...usage, used: data.usage.used });
      else loadUsage();
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    const full = result.subject ? `Subject: ${result.subject}\n\n${result.message}` : result.message;
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      // Older browsers: fall back to a hidden text box.
      const ta = document.createElement("textarea");
      ta.value = full;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function startOver() {
    setText("");
    setReceived("");
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="relative isolate">
    <Glow />
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      {welcome ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">Welcome aboard. Your plan is active.</p>
          <p className="text-sm">It can take a few seconds to show below. Refresh if it hasn't updated.</p>
        </div>
      ) : null}
      {usage?.pastDue ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your last payment didn't go through. Please{" "}
          <Link href="/account" className="font-semibold underline">update your card</Link> to keep your plan.
        </div>
      ) : null}

      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
        What do you want <span className="text-gradient">to say?</span>
      </h1>
      {usage ? (
        <div className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-full border border-white/70 bg-white/80 py-1.5 pl-2 pr-4 text-sm shadow-soft backdrop-blur">
          <span className="rounded-full bg-brand px-3 py-0.5 text-xs font-bold text-white">{usage.planName}</span>
          {usage.unlimited ? (
            <span className="text-ink/70">Unlimited messages</span>
          ) : (
            <>
              <span className="text-ink/70">
                <strong className="text-ink">{left}</strong> of {usage.limit}{" "}
                {usage.tier === "free" ? "free messages" : "this month"} left
              </span>
              <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-ink/10 sm:block">
                <span
                  className="block h-full rounded-full bg-brand"
                  style={{ width: `${Math.min(100, ((left ?? 0) / usage.limit) * 100)}%` }}
                />
              </span>
              <Link href="/account" className="font-semibold text-accent hover:underline">
                {usage.tier === "free" ? "Get more" : "Upgrade"}
              </Link>
            </>
          )}
        </div>
      ) : null}

      {/* Replying to something */}
      <div className="card mt-8 p-5 sm:p-6">
      <div>
        {showReceived ? (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="received" className="text-sm font-semibold">
                The message you're replying to
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowReceived(false);
                  setReceived("");
                }}
                className="text-sm text-ink/50 hover:text-ink"
              >
                Remove
              </button>
            </div>
            <textarea
              id="received"
              value={received}
              onChange={(e) => setReceived(e.target.value.slice(0, MAX_CHARS))}
              rows={4}
              placeholder="Paste the email or message you got"
              className="field mt-2"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowReceived(true)}
            className="text-sm font-semibold text-accent hover:underline"
          >
            + I'm replying to a message
          </button>
        )}
      </div>

      {/* What you want to say */}
      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="text" className="text-sm font-semibold">
            Say it how you feel it
          </label>
          <VoiceButton
            disabled={loading}
            onInterim={setInterim}
            onFinal={(t) =>
              setText((prev) => (prev.trim() ? `${prev.trimEnd()} ${t}` : t).slice(0, MAX_CHARS))
            }
          />
        </div>
        <textarea
          id="text"
          value={interim ? `${text}${text ? " " : ""}${interim}` : text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          readOnly={!!interim}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={6}
          placeholder="Type, paste or tap Voice note. Don't hold back, we'll make it nice."
          className="field mt-2 text-lg"
        />
        <p className="mt-1 text-right text-xs text-ink/40">
          {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </p>
      </div>

      {/* Tone */}
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">How should it sound?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.hint}
              aria-pressed={tone === t.id}
              onClick={() => setTone(t.id)}
              className={`chip ${tone === t.id ? "chip-on" : "chip-off"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/50">{TONES.find((t) => t.id === tone)?.hint}</p>
      </fieldset>

      {/* Who + format */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">Who's it to?</span>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value as RecipientId)}
            className="field mt-2 py-2.5"
          >
            {RECIPIENTS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="text-sm font-semibold">Sending it as</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={format === f.id}
                onClick={() => setFormat(f.id)}
                className={`chip ${format === f.id ? "chip-on" : "chip-off"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading || !text.trim()}
        className={`btn-primary mt-8 w-full py-4 text-lg ${loading ? "animate-shimmer" : ""}`}
        style={loading ? { backgroundImage: "linear-gradient(90deg,#7C3AED,#DB2777,#F59E0B,#DB2777,#7C3AED)", backgroundSize: "200% 100%" } : undefined}
      >
        {loading ? "✨ Making it nice…" : result ? "Try another version ✨" : "Say it nicely ✨"}
      </button>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {outOfMessages ? (
        <div className="gradient-card mt-6"><div className="gradient-card-inner p-6 text-center">
          <p className="text-lg font-bold">
            {usage?.tier === "free" ? "You've used your free messages" : "You've used this month's messages"}
          </p>
          <p className="mt-2 text-ink/70">
            {usage?.tier === "free"
              ? "Pick a plan to keep saying it nicely. From £7 a month, cancel any time."
              : "Move up a plan to keep going straight away. Your messages also top up when your plan renews."}
          </p>
          <Link href="/account" className="btn-primary mt-5">
            See plans
          </Link>
        </div></div>
      ) : null}

      {/* Result */}
      {result ? (
        <div ref={resultRef} className="mt-8 scroll-mt-24">
          {result.safety === "crisis" ? (
            <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              <p className="font-semibold">You don't have to deal with this on your own.</p>
              <p className="mt-1">
                Samaritans are there day or night, free, on <a className="font-semibold underline" href="tel:116123">116 123</a>.
                If you're in danger right now, call <a className="font-semibold underline" href="tel:999">999</a>.
              </p>
            </div>
          ) : null}
          <div className="gradient-card">
          <div className="gradient-card-inner p-6 sm:p-7">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-dark">
              ✨ Ready to send · {TONES.find((t) => t.id === tone)?.label}
            </p>
            {result.subject ? (
              <p className="mt-3 text-sm">
                <span className="font-semibold">Subject:</span> {result.subject}
              </p>
            ) : null}
            <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed">{result.message}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={copy} className="btn-primary">
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <button type="button" onClick={startOver} className="btn-secondary">
                Start a new one
              </button>
            </div>
          </div>
          </div>
          {result.tip ? (
            <p className="mt-3 px-2 text-sm text-ink/60">
              <span className="font-semibold text-ink/80">Why it works:</span> {result.tip}
            </p>
          ) : null}
          <p className="mt-3 px-2 text-xs text-ink/40">
            Not quite right? Change the tone or add a note like “shorter” or “mention Friday”, then tap
            Try another version.
          </p>
        </div>
      ) : null}
    </div>
    </div>
  );
}
