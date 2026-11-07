"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Glow from "@/components/Glow";
import { copyText } from "@/components/ResultPanel";
import { IconCheck, IconClock, IconCopy, IconRefresh, IconTrash } from "@/components/Icons";
import { RECIPIENTS, TONES } from "@/lib/options";
import {
  clearHistory,
  historyEnabled,
  loadHistory,
  removeFromHistory,
  setDraft,
  setHistoryEnabled,
  type HistoryItem,
} from "@/lib/device";

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryClient() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [on, setOn] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    setItems(loadHistory());
    setOn(historyEnabled());
  }, []);

  async function copy(item: HistoryItem) {
    await copyText(item.subject ? `Subject: ${item.subject}\n\n${item.message}` : item.message);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 2000);
  }

  function useAgain(item: HistoryItem) {
    setDraft({ text: item.text, received: item.received, tone: item.tone, recipient: item.recipient, format: item.format });
    window.location.href = "/app";
  }

  function toggle() {
    const next = !on;
    if (!next && items?.length && !window.confirm("Turn off history? This also clears what's saved on this device.")) return;
    setHistoryEnabled(next);
    setOn(next);
    if (!next) setItems([]);
  }

  function clearAll() {
    if (!window.confirm("Clear all history on this device? This can't be undone.")) return;
    clearHistory();
    setItems([]);
  }

  return (
    <main className="relative isolate">
      <Glow />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Your messages</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          History
        </h1>
        <p className="mt-2 text-ink/60">
          Saved on this device only. Nicelyy never stores what you write.
        </p>

        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
            <button
              type="button"
              role="switch"
              aria-checked={on}
              onClick={toggle}
              className={`relative h-6 w-11 rounded-full transition ${on ? "bg-brand" : "bg-ink/20"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
            </button>
            Save history on this device
          </label>
          {items && items.length ? (
            <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline">
              <IconTrash /> Clear all
            </button>
          ) : null}
        </div>

        {items === null ? null : items.length === 0 ? (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-ink/10 bg-white/50 p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <IconClock className="h-6 w-6" />
            </span>
            <p className="mt-4 font-bold">{on ? "Nothing here yet" : "History is off"}</p>
            <p className="mt-1 text-sm text-ink/55">
              {on ? "Your rewrites will show up here." : "Turn it on above to keep your rewrites on this device."}
            </p>
            <Link href="/app" className="btn-primary mt-6">Write a message</Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="card p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-ink/50">{when(item.at)}</span>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 font-bold text-accent-dark">
                    {TONES.find((t) => t.id === item.tone)?.label}
                  </span>
                  <span className="rounded-full bg-ink/[.05] px-2 py-0.5 font-semibold text-ink/60">
                    {RECIPIENTS.find((r) => r.id === item.recipient)?.label}
                  </span>
                </div>
                {item.subject ? <p className="mt-3 text-sm"><span className="font-semibold text-ink/50">Subject </span>{item.subject}</p> : null}
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap leading-relaxed">{item.message}</p>
                {open === item.id ? (
                  <p className="mt-3 whitespace-pre-wrap rounded-xl bg-ink/[.03] p-3 text-sm italic text-ink/60">
                    &ldquo;{item.text}&rdquo;
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => copy(item)} className="btn-primary px-4 py-2 text-sm">
                    {copied === item.id ? <IconCheck /> : <IconCopy />} {copied === item.id ? "Copied" : "Copy"}
                  </button>
                  <button type="button" onClick={() => useAgain(item)} className="btn-secondary px-4 py-2 text-sm">
                    <IconRefresh /> Use again
                  </button>
                  <button type="button" onClick={() => setOpen(open === item.id ? null : item.id)}
                    className="rounded-full px-3 py-2 text-sm font-semibold text-ink/55 hover:bg-ink/5 hover:text-ink">
                    {open === item.id ? "Hide original" : "Show original"}
                  </button>
                  <button type="button" aria-label="Delete" onClick={() => { removeFromHistory(item.id); setItems(loadHistory()); }}
                    className="ml-auto rounded-full p-2 text-ink/35 hover:bg-red-50 hover:text-red-600">
                    <IconTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
