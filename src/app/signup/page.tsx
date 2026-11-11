"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import OAuthButtons from "@/components/OAuthButtons";
import { track } from "@/lib/analytics";
import { AUTH_NOT_READY, AUTH_READY, createClient, friendlyError, withTimeout } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "check-email">("idle");
  const [error, setError] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [next, setNext] = useState("/app");

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.startsWith("/") && !n.startsWith("//")) setNext(n);
  }, []);

  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    let result;
    try {
      result = await withTimeout(
        createClient().auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } })
      );
    } catch (e) {
      setError(friendlyError(e, "Could not create your account. Please try again."));
      setStatus("idle");
      return;
    }
    const { data, error: err } = result;
    if (err) {
      setError(err.message);
      setStatus("idle");
      return;
    }
    // Supabase signals an existing account by returning no identities.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setError("You already have an account with this email. Log in instead.");
      setStatus("idle");
      return;
    }
    track("signup");
    if (data.session) {
      window.location.href = next;
    } else {
      setStatus("check-email");
    }
  }

  async function resend() {
    setResendNote(null);
    try {
      const { error: err } = await withTimeout(
        createClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectTo() } })
      );
      setResendNote(err ? err.message : "Sent again. Check your junk folder too.");
    } catch (e) {
      setResendNote(friendlyError(e));
    }
  }

  if (status === "check-email") {
    return (
      <AuthShell title="Check your email" subtitle={`We've sent a link to ${email}.`}>
        <div className="rounded-2xl bg-brand-soft p-5">
          <p>Tap the link in the email to confirm your account. Then you're in.</p>
          <p className="mt-2 text-sm text-ink/60">Can't see it? Check your junk or spam folder.</p>
          <button type="button" onClick={resend} className="btn-secondary mt-5">
            Send it again
          </button>
          {resendNote ? <p className="mt-3 text-sm text-ink/70">{resendNote}</p> : null}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Try Nicelyy free" subtitle="3 free messages. No card needed.">
      <OAuthButtons next={next} />
      {!AUTH_READY ? (
        <p className="mb-5 rounded-2xl bg-brand-soft p-4 text-sm text-ink/80">{AUTH_NOT_READY}</p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Email</span>
          <input type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className="field mt-1" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Password</span>
          <input type="password" required minLength={8} autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className="field mt-1" />
          <span className="mt-1 block text-xs text-ink/50">At least 8 characters.</span>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={status === "loading" || !AUTH_READY} className="btn-primary w-full">
          {status === "loading" ? "Creating your account…" : "Create account"}
        </button>
        <p className="text-center text-xs text-ink/50">
          By creating an account you confirm you&apos;re 18 or over and agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
      <p className="mt-8 text-center text-sm text-ink/70">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-accent">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
