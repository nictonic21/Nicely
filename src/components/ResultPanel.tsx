"use client";

import { useState } from "react";
import ShareMenu from "@/components/ShareMenu";
import { IconBulb, IconCheck, IconCopy, IconPlus, IconRefresh, IconWand } from "@/components/Icons";
import { track } from "@/lib/analytics";

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
  share?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const current = versions[Math.min(selected, versions.length - 1)];

  async function copy() {
    await copyText(subject ? `Subject: ${subject}\n\n${current.message}` : current.message);
    track("copy");
    onCopied?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4" aria-live="polite">
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
          <div className="flex items-center justify-between gap-3 border-b border-ink/[.06] px-5 py-3.5 sm:px-6">
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <IconCheck className="h-3 w-3" />
              </span>
              Ready to send
            </span>
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-dark">{toneLabel}</span>
          </div>

          {versions.length > 1 ? (
            <div role="tablist" aria-label="Versions" className="flex gap-1.5 overflow-x-auto px-5 pt-4 sm:px-6">
              {versions.map((v, i) => {
                const on = i === selected;
                return (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => onSelect(i)}
                    className={`flex-none rounded-xl px-3 py-1.5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 ${
                      on ? "bg-ink text-white" : "bg-ink/[.05] text-ink/65 hover:bg-ink/[.08] hover:text-ink"
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider opacity-60">Option {i + 1}</span>
                    <span className="block whitespace-nowrap text-xs font-semibold">{v.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="px-5 py-5 sm:px-6">
            {subject ? (
              <p className="mb-4 rounded-xl bg-ink/[.03] px-3 py-2 text-sm">
                <span className="font-semibold text-ink/50">Subject </span>
                {subject}
              </p>
            ) : null}
            <p className={`whitespace-pre-wrap text-[17px] leading-relaxed transition ${tweaks?.busy ? "opacity-40" : ""}`}>
              {current.message}
            </p>
          </div>

          <div className="space-y-3 border-t border-ink/[.06] bg-ink/[.02] px-5 py-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copy} className="btn-primary px-5 py-2.5 text-sm">
                {copied ? <IconCheck /> : <IconCopy />}
                {copied ? "Copied" : "Copy message"}
              </button>
              {actions ? (
                <>
                  <button type="button" onClick={actions.onRetry} disabled={actions.busy} className="btn-secondary px-4 py-2 text-sm">
                    <IconRefresh /> Try again
                  </button>
                  <button
                    type="button"
                    onClick={actions.onNew}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink/60 transition hover:bg-ink/5 hover:text-ink"
                  >
                    <IconPlus /> New
                  </button>
                </>
              ) : null}
            </div>
            {share ? <ShareMenu message={current.message} subject={subject} /> : null}
          </div>
        </div>
      </div>

      {tweaks ? (
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-bold">
              <IconWand className="h-4 w-4 text-accent" /> Quick tweaks
            </p>
            <span className="text-xs text-ink/50">
              {tweaks.left > 0 ? `${tweaks.left} free left` : "Free tweaks used"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TWEAK_BUTTONS.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={!!tweaks.busy || tweaks.left <= 0}
                onClick={() => tweaks.onTweak(t.id)}
                className="rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-sm font-semibold text-ink/75 transition hover:-translate-y-0.5 hover:border-accent/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {tweaks.busy === t.id ? "Working…" : t.label}
              </button>
            ))}
          </div>
          {tweaks.note ? <p className="mt-3 text-xs text-ink/60">{tweaks.note}</p> : null}
        </div>
      ) : null}

      {tip ? (
        <div className="flex items-start gap-3 rounded-2xl bg-brand-soft p-4 text-sm ring-1 ring-accent/10">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-white text-accent shadow-soft">
            <IconBulb />
          </span>
          <p className="text-ink/75">
            <span className="font-semibold text-ink">Why it works. </span>
            {tip}
          </p>
        </div>
      ) : null}
    </div>
  );
}
