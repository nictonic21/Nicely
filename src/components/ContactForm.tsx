"use client";

import { useRef, useState } from "react";
import Turnstile, { TURNSTILE_SITE_KEY, type TurnstileHandle } from "@/components/Turnstile";
import { IconCheck, IconInfo, IconMail } from "@/components/Icons";
import { CONTACT_TOPICS } from "@/lib/help";

export default function ContactForm({ signedInEmail }: { signedInEmail: string | null }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(CONTACT_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // hidden: only bots fill this in
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const check = useRef<TurnstileHandle>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, website, turnstileToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.retryCheck) check.current?.reset();
        throw new Error(data.error || "We couldn't send that. Please try again.");
      }
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send that. Please try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
        <IconCheck className="mt-0.5 h-5 w-5 flex-none" />
        <div>
          <p className="font-semibold">Thanks, we&apos;ve got your message.</p>
          <p className="text-sm">We&apos;ll reply by email, usually within one working day.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">Your name <span className="font-normal text-ink/45">(optional)</span></span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="field mt-1" />
        </label>
        {signedInEmail ? (
          <div>
            <span className="text-sm font-semibold">We&apos;ll reply to</span>
            <p className="field mt-1 bg-ink/[.03] text-ink/70">{signedInEmail}</p>
          </div>
        ) : (
          <label className="block">
            <span className="text-sm font-semibold">Your email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="field mt-1" />
          </label>
        )}
      </div>
      <label className="block">
        <span className="text-sm font-semibold">What&apos;s it about?</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="field mt-1 cursor-pointer">
          {CONTACT_TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Your message</span>
        <textarea
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's happening. Please don't include card numbers or passwords."
          className="field mt-1"
        />
      </label>
      {/* Hidden from people, visible to spam bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>
      <Turnstile ref={check} onToken={setToken} />
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
          <IconInfo className="mt-0.5 h-4 w-4 flex-none" /> {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={state === "sending" || (!!TURNSTILE_SITE_KEY && !token)}
        className="btn-primary"
      >
        <IconMail /> {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
