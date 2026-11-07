"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await createClient().auth.updateUser({ password });
    if (err) {
      setError("That link has expired. Please request a new one from the reset page.");
      setLoading(false);
      return;
    }
    window.location.href = "/app";
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">New password</span>
          <input type="password" required minLength={8} autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className="field mt-1" />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Saving…" : "Save password"}
        </button>
      </form>
    </AuthShell>
  );
}
