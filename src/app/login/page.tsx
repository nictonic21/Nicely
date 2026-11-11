"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import OAuthButtons from "@/components/OAuthButtons";
import { AUTH_NOT_READY, AUTH_READY, createClient, friendlyError, withTimeout } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [next, setNext] = useState("/app");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get("next");
    if (n && n.startsWith("/") && !n.startsWith("//")) setNext(n);
    if (params.get("error") === "link") {
      setError("That link has expired or was already used. Please log in, or request a new one.");
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let err;
    try {
      ({ error: err } = await withTimeout(createClient().auth.signInWithPassword({ email, password })));
    } catch (e) {
      setError(friendlyError(e, "Could not log you in. Please try again."));
      setLoading(false);
      return;
    }
    if (err) {
      setError(
        err.message === "Email not confirmed"
          ? "Please confirm your email first. Check your inbox for our link."
          : "That email and password don't match. Please try again."
      );
      setLoading(false);
      return;
    }
    window.location.href = next;
  }

  return (
    <AuthShell title="Welcome back">
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
          <input type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className="field mt-1" />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={loading || !AUTH_READY} className="btn-primary w-full">
          {loading ? "Logging in…" : "Log in"}
        </button>
        <p className="text-center text-sm">
          <Link href="/reset" className="text-ink/60 hover:text-ink">Forgot your password?</Link>
        </p>
      </form>
      <p className="mt-8 text-center text-sm text-ink/70">
        New here?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-accent">
          Try Nicelyy free
        </Link>
      </p>
    </AuthShell>
  );
}
