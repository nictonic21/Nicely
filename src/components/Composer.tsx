"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import VoiceButton from "@/components/VoiceButton";
import Glow from "@/components/Glow";
import { LogoMark } from "@/components/Logo";
import ResultPanel, { type TweakId } from "@/components/ResultPanel";
import InstallPrompt from "@/components/InstallPrompt";
import RateRewrite from "@/components/RateRewrite";
import { loadPrefs, savePrefs, saveToHistory, takeDraft } from "@/lib/device";
import { track } from "@/lib/analytics";
import {
  IconAlign,
  IconArrowRight,
  IconBolt,
  IconBriefcase,
  IconBulb,
  IconChat,
  IconCheck,
  IconCopy,
  IconHeartHand,
  IconInfo,
  IconMail,
  IconPlus,
  IconRefresh,
  IconReply,
  IconShield,
  IconSparkle,
  IconX,
} from "@/components/Icons";
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
  versions: { label: string; message: string }[];
  subject: string;
  tip: string;
  safety: "none" | "crisis";
  tone: ToneId;
  rewriteId: string;
  tweaksLeft: number;
  historyId: string;
  // What was asked, so tweaks adjust the same request.
  request: { text: string; received: string; tone: ToneId; recipient: RecipientId; format: FormatId };
}

const TONE_ICONS: Record<ToneId, (p: { className?: string }) => JSX.Element> = {
  professional: IconBriefcase,
  kind: IconHeartHand,
  firm: IconShield,
  comeback: IconBolt,
  simple: IconAlign,
};

function Step({ n, title, aside, children }: { n: number; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-b border-ink/[.06] px-5 py-6 last:border-b-0 sm:px-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-[15px] font-bold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{n}</span>
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Composer({ welcome }: { welcome: boolean }) {
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [showReceived, setShowReceived] = useState(false);
  const [received, setReceived] = useState("");
  const [tone, setTone] = useState<ToneId>("professional");
  const [recipient, setRecipient] = useState<RecipientId>("work");
  const [format, setFormat] = useState<FormatId>("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outOfMessages, setOutOfMessages] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState(0);
  const [tweakBusy, setTweakBusy] = useState<TweakId | null>(null);
  const [tweakNote, setTweakNote] = useState<string | null>(null);
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

  // Remember their usual choices, and pick up "Use again" from history.
  const prefsReady = useRef(false);
  useEffect(() => {
    const draft = takeDraft();
    const prefs = draft ?? loadPrefs();
    if (prefs) {
      setTone(prefs.tone);
      setRecipient(prefs.recipient);
      setFormat(prefs.format);
    }
    if (draft) {
      setText(draft.text);
      if (draft.received) {
        setReceived(draft.received);
        setShowReceived(true);
      }
    }
    prefsReady.current = true;
  }, []);
  useEffect(() => {
    if (prefsReady.current) savePrefs({ tone, recipient, format });
  }, [tone, recipient, format]);

  // Keep the on-device history in step with the version they're looking at.
  useEffect(() => {
    if (!result) return;
    const v = result.versions[selected] ?? result.versions[0];
    saveToHistory({
      id: result.historyId,
      at: new Date().toISOString(),
      tone: result.request.tone,
      recipient: result.request.recipient,
      format: result.request.format,
      text: result.request.text,
      received: result.request.received,
      message: v.message,
      subject: result.subject,
    });
  }, [result, selected]);

  const left = usage ? Math.max(0, usage.limit - usage.used) : null;

  function revealResult() {
    // On phones the result sits below the form, so bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  async function submit() {
    if (loading || !text.trim()) return;
    setLoading(true);
    setError(null);
    setOutOfMessages(false);
    setTweakNote(null);
    revealResult();
    const request = { text, received: showReceived ? received : "", tone, recipient, format };
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (res.status === 402) {
        setOutOfMessages(true);
        loadUsage();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setResult({
        versions: data.versions,
        subject: data.subject,
        tip: data.tip,
        safety: data.safety,
        tone,
        rewriteId: data.rewriteId,
        tweaksLeft: data.tweaksLeft,
        historyId: data.rewriteId,
        request,
      });
      setSelected(0);
      track("rewrite", { tone, format });
      if (data.usage && usage) setUsage({ ...usage, used: data.usage.used });
      else loadUsage();
      revealResult();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function tweak(id: TweakId) {
    if (!result || tweakBusy) return;
    setTweakBusy(id);
    setTweakNote(null);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.request,
          rewriteId: result.rewriteId,
          current: result.versions[selected]?.message ?? result.versions[0].message,
          tweak: id,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setResult({ ...result, tweaksLeft: 0 });
        setTweakNote(data.message);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setResult({
        ...result,
        versions: data.versions,
        subject: data.subject || result.subject,
        tip: data.tip || result.tip,
        safety: data.safety,
        tweaksLeft: data.tweaksLeft,
      });
      setSelected(0);
      track("tweak", { tweak: id });
    } catch (err) {
      setTweakNote(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setTweakBusy(null);
    }
  }

  function startOver() {
    setText("");
    setReceived("");
    setShowReceived(false);
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const toneLabel = (id: ToneId) => TONES.find((t) => t.id === id)?.label ?? "";

  return (
    <div className="relative isolate">
      <Glow />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">New message</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              What do you want to <span className="text-gradient">say?</span>
            </h1>
            <p className="mt-2 text-ink/60">Write it how you feel it. We&apos;ll make it clear, calm and ready to send.</p>
          </div>
          {usage ? (
            <div className="card flex min-w-[230px] items-center gap-4 px-4 py-3">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold uppercase tracking-wider text-ink/50">{usage.planName} plan</span>
                  {usage.tier !== "unlimited" ? (
                    <Link href="/account" className="font-semibold text-accent hover:underline">
                      {usage.tier === "free" ? "Get more" : "Upgrade"}
                    </Link>
                  ) : null}
                </div>
                {usage.unlimited ? (
                  <p className="mt-1 text-sm font-semibold">Unlimited messages</p>
                ) : (
                  <>
                    <p className="mt-1 text-sm">
                      <span className="font-bold">{left}</span>
                      <span className="text-ink/60">
                        {" "}of {usage.limit} {usage.tier === "free" ? "free messages left" : "left this month"}
                      </span>
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${Math.min(100, ((left ?? 0) / usage.limit) * 100)}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <InstallPrompt />

        {welcome ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <IconCheck className="mt-0.5 h-5 w-5 flex-none" />
            <div>
              <p className="font-semibold">Welcome aboard. Your plan is active.</p>
              <p className="text-sm">It can take a few seconds to show. Refresh if it hasn&apos;t updated.</p>
            </div>
          </div>
        ) : null}
        {usage?.pastDue ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <IconInfo className="mt-0.5 h-5 w-5 flex-none" />
            <p>
              Your last payment didn&apos;t go through.{" "}
              <Link href="/account" className="font-semibold underline">Update your card</Link> to keep your plan.
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left: the form */}
          <div className="card overflow-hidden lg:col-span-7">
            <Step
              n={1}
              title="Your message"
              aside={
                <VoiceButton
                  disabled={loading}
                  onInterim={setInterim}
                  onNote={setVoiceNote}
                  onFinal={(t) => setText((prev) => (prev.trim() ? `${prev.trimEnd()} ${t}` : t).slice(0, MAX_CHARS))}
                />
              }
            >
              {showReceived ? (
                <div className="mb-4 rounded-2xl border border-ink/10 bg-ink/[.025] p-3">
                  <div className="flex items-center justify-between px-1">
                    <label htmlFor="received" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink/50">
                      <IconReply className="h-3.5 w-3.5" /> Replying to
                    </label>
                    <button
                      type="button"
                      aria-label="Remove the message you're replying to"
                      onClick={() => {
                        setShowReceived(false);
                        setReceived("");
                      }}
                      className="rounded-full p-1 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
                    >
                      <IconX />
                    </button>
                  </div>
                  <textarea
                    id="received"
                    value={received}
                    onChange={(e) => setReceived(e.target.value.slice(0, MAX_CHARS))}
                    rows={3}
                    placeholder="Paste the email or message you got"
                    className="mt-2 w-full resize-y rounded-xl bg-white px-3 py-2.5 text-[15px] outline-none ring-1 ring-ink/10 transition placeholder:text-ink/35 focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              ) : null}

              <div className="rounded-2xl border border-ink/10 bg-white transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
                <label htmlFor="text" className="sr-only">
                  What you want to say
                </label>
                <textarea
                  id="text"
                  value={interim ? `${text}${text ? " " : ""}${interim}` : text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                  readOnly={!!interim}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                  }}
                  rows={7}
                  placeholder="Type it, paste it, or tap Voice note. Don't hold back, we'll make it nice."
                  className="block w-full resize-y rounded-t-2xl bg-transparent px-4 pt-4 text-[17px] leading-relaxed outline-none placeholder:text-ink/35"
                />
                <div className="flex items-center justify-between gap-3 border-t border-ink/[.06] px-3 py-2">
                  {!showReceived ? (
                    <button
                      type="button"
                      onClick={() => setShowReceived(true)}
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-accent transition hover:bg-accent-soft"
                    >
                      <IconPlus /> <span className="sm:hidden">Replying to a message?</span><span className="hidden sm:inline">Add the message you&apos;re replying to</span>
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="whitespace-nowrap text-xs tabular-nums text-ink/40">
                    {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                  </span>
                </div>
              </div>
              {voiceNote ? <p className="mt-2 text-xs text-ink/60">{voiceNote}</p> : null}
            </Step>

            <Step n={2} title="Tone">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6">
                {TONES.map((t, i) => {
                  const Icon = TONE_ICONS[t.id];
                  const on = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setTone(t.id)}
                      className={`group relative rounded-2xl border p-3.5 text-left transition ${i < 3 ? "sm:col-span-2" : "sm:col-span-3"} ${i === 4 ? "col-span-2" : ""} duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 ${
                        on
                          ? "border-accent bg-accent-soft/70 shadow-[0_0_0_1px_rgba(124,58,237,1)]"
                          : "border-ink/10 bg-white hover:border-ink/25"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                          on ? "bg-brand text-white shadow-glow" : "bg-ink/[.05] text-ink/70 group-hover:text-ink"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="mt-2.5 block text-sm font-bold">{t.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-ink/55">{t.hint}</span>
                      {on ? (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                          <IconCheck className="h-3 w-3" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </Step>

            <Step n={3} title="Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/50">Who&apos;s it to?</span>
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value as RecipientId)}
                    className="field mt-2 cursor-pointer py-2.5"
                  >
                    {RECIPIENTS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/50">Sending it as</span>
                  <div role="radiogroup" className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-ink/[.05] p-1">
                    {FORMATS.map((f) => {
                      const on = format === f.id;
                      const Icon = f.id === "email" ? IconMail : IconChat;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setFormat(f.id)}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 ${
                            on ? "bg-white text-ink shadow-soft" : "text-ink/55 hover:text-ink"
                          }`}
                        >
                          <Icon /> <span title={f.label}>{f.short}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Step>

            <div className="bg-ink/[.02] px-5 py-5 sm:px-7">
              <button
                type="button"
                onClick={submit}
                disabled={loading || !text.trim()}
                className={`btn-primary w-full py-4 text-base ${loading ? "animate-shimmer disabled:opacity-100" : ""}`}
                style={
                  loading
                    ? {
                        backgroundImage: "linear-gradient(90deg,#7C3AED,#DB2777,#F59E0B,#DB2777,#7C3AED)",
                        backgroundSize: "200% 100%",
                      }
                    : undefined
                }
              >
                <IconSparkle className="h-5 w-5" />
                {loading ? "Writing your message…" : result ? "Try another version" : "Say it nicelyy"}
              </button>
              <p className="mt-2.5 text-center text-xs text-ink/45">
                Uses 1 message<span className="hidden sm:inline"> · Press Ctrl + Enter to send</span>
              </p>
              {error ? (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
                  <IconInfo className="mt-0.5 h-4 w-4 flex-none" /> {error}
                </p>
              ) : null}
            </div>
          </div>

          {/* Right: the result */}
          <div ref={resultRef} className="scroll-mt-24 lg:sticky lg:top-24 lg:col-span-5">
            {outOfMessages ? (
              <div className="gradient-card">
                <div className="gradient-card-inner p-7 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-glow">
                    <IconSparkle className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-lg font-bold">
                    {usage?.tier === "free" ? "You've used your free messages" : "You've used this month's messages"}
                  </p>
                  <p className="mt-2 text-sm text-ink/65">
                    {usage?.tier === "free"
                      ? "Choose a plan to keep going. From £7 a month, cancel any time."
                      : "Move up a plan to keep going now. Your messages also top up when your plan renews."}
                  </p>
                  <Link href="/account" className="btn-primary mt-5">
                    See plans <IconArrowRight />
                  </Link>
                </div>
              </div>
            ) : loading ? (
              <div className="card p-6 sm:p-7" aria-live="polite">
                <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <IconSparkle className="h-4 w-4 animate-pulse" /> Writing your message…
                </div>
                <div className="mt-5 space-y-3">
                  {[92, 100, 85, 96, 60].map((w, i) => (
                    <div
                      key={i}
                      className="h-3.5 animate-pulse rounded-full bg-gradient-to-r from-ink/[.07] to-ink/[.03]"
                      style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : result ? (
              <div className="space-y-3">
                <ResultPanel
                  versions={result.versions}
                  subject={result.subject}
                  tip={result.tip}
                  safety={result.safety}
                  toneLabel={toneLabel(result.tone)}
                  selected={selected}
                  onSelect={setSelected}
                  tweaks={{ left: result.tweaksLeft, busy: tweakBusy, onTweak: tweak, note: tweakNote }}
                  actions={{ onRetry: submit, onNew: startOver, busy: loading }}
                />
                <RateRewrite rewriteId={result.rewriteId} />
                <p className="px-1 text-xs leading-relaxed text-ink/45">
                  Quick tweaks are free. Try again writes a fresh set and uses 1 message.{" "}
                  <Link href="/app/history" className="font-semibold text-accent hover:underline">
                    See your history
                  </Link>
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-ink/10 bg-white/50 p-8 text-center backdrop-blur">
                <LogoMark size={52} className="mx-auto opacity-90" />
                <p className="mt-4 font-bold">Your message will appear here</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-ink/55">Ready to copy and send, in the tone you choose.</p>
                <ul className="mx-auto mt-6 max-w-xs space-y-2.5 text-left text-sm text-ink/65">
                  {[
                    "Be as blunt or messy as you like",
                    "Add the message you're replying to for a better answer",
                    "Not right? Try again or switch the tone",
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-accent-soft text-accent">
                        <IconCheck className="h-2.5 w-2.5" />
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
