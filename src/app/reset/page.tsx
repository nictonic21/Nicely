"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset/update`,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <AuthShell title="Reset your password">
      {sent ? (
        <div className="card p-6">
          <p>If there's an account for {email}, we've sent a link to set a new password.</p>
          <p className="mt-2 text-sm text-ink/60">Check your junk folder if it doesn't arrive.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Email</span>
            <input type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="field mt-1" />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
