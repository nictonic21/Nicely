"use client";

import { useState } from "react";
import ShareMenu from "@/components/ShareMenu";
import { IconBulb, IconCheck, IconCopy, IconPlus, IconRefresh, IconShare } from "@/components/Icons";
import { track } from "@/lib/analytics";

// The finished message, in one card: pick a version, copy or send it,
// adjust it with a quick tweak. Kept deliberately calm and uncluttered.

export interface Version {
  label: string;
  message: string;
}

export const TWEAK_BUTTONS = [
  { id: "shorter", label: "Shorter" },
  { id: "softer", label: "Softer" },
  { id: "firmer", label: "Firmer" },
  { id: "casual", label: "More casual" },
  { id: "formal", label: "More formal" },
] as const;
export type TweakId = (typeof TWEAK_BUTTONS)[number]["id"];

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Older browsers: fall back to a hidden text box.
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export default function ResultPanel({
  versions,
  subject,
  tip,
  safety,
  toneLabel,
  selected,
  onSelect,
  onCopied,
  tweaks,
  actions,
  footer,
  share = true,
}: {
  versions: Version[];
  subject: string;
  tip: string;
  safety: "none" | "crisis";
  toneLabel: string;
  selected: number;
  onSelect: (i: number) => void;
  onCopied?: () => void;
  tweaks?: { left: number; busy: TweakId | null; onTweak: (id: TweakId) => void; note?: string | null };
  actions?: { onRetry: () => void; onNew: () => void; busy: boolean };
  footer?: React.ReactNode;
  share?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const current = versions[Math.min(selected, versions.length - 1)];

  async function copy() {
    await copyText(subject ? `Subject: ${subject}\n\n${current.message}` : current.message);
    track("copy");
    onCopied?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3" aria-live="polite">
      {safety === "crisis" ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <p className="font-semibold">You don&apos;t have to deal with this on your own.</p>
          <p className="mt-1">
            Samaritans are there day or night, free, on{" "}
            <a className="font-semibold underline" href="tel:116123">116 123</a>. If you&apos;re in danger right
            now, call <a className="font-semibold underline" href="tel:999">999</a>.
          </p>
        </div>
      ) : null}

      <div className="gradient-card">
        <div className="gradient-card-inner overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 sm:px-6">
            {versions.length > 1 ? (
              <div role="tablist" aria-label="Versions" className="flex flex-wrap gap-1.5">
                {versions.map((v, i) => {
                  const on = i === selected;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      aria-label={`Option ${i + 1}: ${v.label}`}
                      onClick={() => onSelect(i)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 ${
                        on ? "bg-ink text-white" : "bg-ink/[.05] text-ink/60 hover:text-ink"
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <IconCheck className="h-3.5 w-3.5" /> Ready to send
              </span>
            )}
            <span className="text-xs font-semibold text-ink/45">{toneLabel}</span>
          </div>

          <div className="px-5 py-4 sm:px-6">
            {subject ? (
              <p className="mb-3 text-sm">
                <span className="font-semibold text-ink/45">Subject: </span>
                {subject}
              </p>
            ) : null}
            <p className={`whitespace-pre-wrap text-[17px] leading-relaxed transition ${tweaks?.busy ? "opacity-40" : ""}`}>
              {current.message}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-5 pb-4 sm:px-6">
            <button type="button" onClick={copy} className="btn-primary px-5 py-2.5 text-sm">
              {copied ? <IconCheck /> : <IconCopy />}
              {copied ? "Copied" : "Copy"}
            </button>
            {share ? (
              <button
                type="button"
                aria-expanded={sending}
                onClick={() => setSending((v) => !v)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                <IconShare /> Send
              </button>
            ) : null}
            {actions ? (
              <>
                <button type="button" onClick={actions.onRetry} disabled={actions.busy} className="btn-secondary px-4 py-2 text-sm">
                  <IconRefresh /> Try again
                </button>
                <button
                  type="button"
                  onClick={actions.onNew}
                  className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-sm font-semibold text-ink/55 transition hover:bg-ink/5 hover:text-ink"
                >
                  <IconPlus /> New
                </button>
              </>
            ) : null}
          </div>
          {share && sending ? (
            <div className="px-5 pb-4 sm:px-6">
              <ShareMenu message={current.message} subject={subject} />
            </div>
          ) : null}

          {tweaks ? (
            <div className="border-t border-ink/[.06] px-5 py-3.5 sm:px-6">
              <div className="flex flex-wrap items-center gap-1.5">
                {TWEAK_BUTTONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!!tweaks.busy || tweaks.left <= 0}
                    onClick={() => tweaks.onTweak(t.id)}
                    className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink/70 transition hover:border-accent/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {tweaks.busy === t.id ? "Working…" : t.label}
                  </button>
                ))}
                <span className="ml-auto text-xs text-ink/45">
                  {tweaks.left > 0 ? `${tweaks.left} free left` : "Free tweaks used"}
                </span>
              </div>
              {tweaks.note ? <p className="mt-2 text-xs text-ink/60">{tweaks.note}</p> : null}
            </div>
          ) : null}

          {tip || footer ? (
            <div className="space-y-2.5 border-t border-ink/[.06] bg-ink/[.02] px-5 py-3.5 sm:px-6">
              {tip ? (
                <p className="flex items-start gap-2 text-sm text-ink/65">
                  <IconBulb className="mt-0.5 h-4 w-4 flex-none text-accent" />
                  <span>{tip}</span>
                </p>
              ) : null}
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
