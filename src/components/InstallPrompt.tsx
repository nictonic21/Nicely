"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { IconShare, IconX } from "@/components/Icons";
import { track } from "@/lib/analytics";

// A small, dismissible "Add Nicelyy to your home screen" card on phones.
// Android/Chrome: one tap installs. iPhone: shows the two Safari steps.
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
const KEY = "nicelyy:install-dismissed:v1";

export default function InstallPrompt() {
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [evt, setEvt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(KEY) === "1";
    } catch {}
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (dismissed || standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIos) setMode("ios");
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {}
    setMode(null);
  }

  async function install() {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    track("install", { outcome: choice.outcome });
    dismiss();
  }

  if (!mode) return null;

  return (
    <div className="card relative mt-6 flex items-center gap-4 p-4 pr-10 lg:hidden">
      <LogoMark size={40} className="flex-none" />
      <div className="text-sm">
        <p className="font-bold">Add Nicelyy to your home screen</p>
        {mode === "android" ? (
          <p className="text-ink/60">Open it in one tap, like an app.</p>
        ) : (
          <p className="text-ink/60">
            Tap <IconShare className="inline h-4 w-4 align-text-bottom text-accent" /> Share, then{" "}
            <strong className="text-ink/80">Add to Home Screen</strong>.
          </p>
        )}
      </div>
      {mode === "android" ? (
        <button type="button" onClick={install} className="btn-primary flex-none px-4 py-2 text-sm">
          Add
        </button>
      ) : null}
      <button type="button" aria-label="Dismiss" onClick={dismiss} className="absolute right-2 top-2 rounded-full p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink">
        <IconX />
      </button>
    </div>
  );
}
