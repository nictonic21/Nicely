"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import VoiceButton from "@/components/VoiceButton";
import Glow from "@/components/Glow";
import ResultPanel, { type TweakId } from "@/components/ResultPanel";
import InstallPrompt from "@/components/InstallPrompt";
import RateRewrite from "@/components/RateRewrite";
import { loadPrefs, savePrefs, saveToHistory, takeDraft } from "@/lib/device";
import { track } from "@/lib/analytics";
import {
  IconArrowRight,
  IconChat,
  IconCheck,
  IconChevronDown,
  IconInfo,
  IconMail,
  IconReply,
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
  const [showMore, setShowMore] = useState(false);
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
    // The result sits below the form, so bring it into view.
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
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
  const recipientLabel = RECIPIENTS.find((r) => r.id === recipient)?.label ?? "";

  return (
    <div className="relative isolate">
      <Glow />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          What do you want to <span className="text-gradient">say?</span>
        </h1>
        {usage ? (
          <p className="mt-2 text-sm text-ink/55">
            {usage.unlimited
              ? `${usage.planName} plan`
              : `${left} of ${usage.limit} ${usage.tier === "free" ? "free messages" : "messages this month"} left`}
            {usage.tier !== "unlimited" ? (
              <>
                {" · "}
                <Link href="/account" className="font-semibold text-accent hover:underline">
                  {usage.tier === "free" ? "Get more" : "Upgrade"}
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        {welcome ? (
          <p className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-sm text-emerald-800">
            <IconCheck className="h-4 w-4 flex-none" /> Welcome aboard. Your plan is active.
          </p>
        ) : null}
        {usage?.pastDue ? (
          <p className="mt-5 flex items-start gap-2 rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-800">
            <IconInfo className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              Your last payment didn&apos;t go through.{" "}
              <Link href="/account" className="font-semibold underline">Update your card</Link> to keep your plan.
            </span>
          </p>
        ) : null}

        <div className="card mt-6 p-4 sm:p-5">
          {showReceived ? (
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <label htmlFor="received" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/45">
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
                placeholder="Paste the message you got"
                className="field mt-1.5 bg-ink/[.02] text-[15px]"
              />
            </div>
          ) : null}

          <label htmlFor="text" className="sr-only">What you want to say</label>
          <textarea
            id="text"
            value={interim ? `${text}${text ? " " : ""}${interim}` : text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            readOnly={!!interim}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={5}
            placeholder="Say it how you feel it. We'll make it nice."
            className="field text-[17px] leading-relaxed"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <VoiceButton
              disabled={loading}
              onInterim={setInterim}
              onNote={setVoiceNote}
              onFinal={(t) => setText((prev) => (prev.trim() ? `${prev.trimEnd()} ${t}` : t).slice(0, MAX_CHARS))}
            />
            {!showReceived ? (
              <button
                type="button"
                onClick={() => setShowReceived(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink/[.05] px-3.5 py-1.5 text-sm font-semibold text-ink/80 transition hover:bg-ink/[.08]"
              >
                <IconReply /> Replying to a message?
              </button>
            ) : null}
          </div>
          {voiceNote ? <p className="mt-2 text-xs text-ink/60">{voiceNote}</p> : null}

          <div className="mt-5">
            <p className="text-sm font-bold">Tone</p>
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
            <p className="mt-2 text-xs text-ink/50">{TONES.find((t) => t.id === tone)?.hint}</p>
          </div>

          <div className="mt-4 border-t border-ink/[.06] pt-3">
            <button
              type="button"
              aria-expanded={showMore}
              onClick={() => setShowMore((v) => !v)}
              className="flex w-full items-center justify-between gap-3 text-left text-sm"
            >
              <span className="text-ink/60">
                To <span className="font-semibold text-ink/85">{recipientLabel}</span> · as{" "}
                <span className="font-semibold text-ink/85">{format === "email" ? "an email" : "a text"}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-accent">
                {showMore ? "Done" : "Change"}
                <IconChevronDown className={`h-4 w-4 transition ${showMore ? "rotate-180" : ""}`} />
              </span>
            </button>
            {showMore ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="sr-only">Who&apos;s it to?</span>
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value as RecipientId)}
                    className="field cursor-pointer py-2.5"
                  >
                    {RECIPIENTS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div role="radiogroup" aria-label="Sending it as" className="grid grid-cols-2 gap-1 rounded-2xl bg-ink/[.05] p-1">
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
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          on ? "bg-white text-ink shadow-soft" : "text-ink/55 hover:text-ink"
                        }`}
                      >
                        <Icon /> <span title={f.label}>{f.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={loading || !text.trim()}
            className={`btn-primary mt-5 w-full py-4 text-base ${loading ? "animate-shimmer disabled:opacity-100" : ""}`}
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
          {error ? (
            <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
              <IconInfo className="mt-0.5 h-4 w-4 flex-none" /> {error}
            </p>
          ) : null}
        </div>

        <div ref={resultRef} className="mt-6 scroll-mt-24">
          {outOfMessages ? (
            <div className="gradient-card">
              <div className="gradient-card-inner p-6 text-center">
                <p className="text-lg font-bold">
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
            <div className="card p-6" aria-live="polite">
              <div className="space-y-3">
                {[92, 100, 85, 60].map((w, i) => (
                  <div
                    key={i}
                    className="h-3.5 animate-pulse rounded-full bg-ink/[.07]"
                    style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : result ? (
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
              footer={<RateRewrite rewriteId={result.rewriteId} />}
            />
          ) : null}
        </div>

        <InstallPrompt />
      </div>
    </div>
  );
}
