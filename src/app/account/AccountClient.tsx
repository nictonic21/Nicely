"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PricingCards from "@/components/PricingCards";
import Glow from "@/components/Glow";
import { createClient } from "@/lib/supabase/client";
import { isPaidTier, type Tier } from "@/lib/plans";

interface Me {
  email: string;
  tier: Tier;
  planName: string;
  used: number;
  limit: number;
  unlimited: boolean;
  pastDue: boolean;
  hasBilling: boolean;
  periodStart: string | null;
}

export default function AccountClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMe)
      .catch(() => setLoadError(true));
  }, []);

  // Came from "Get Plus" on the home page before signing up: go straight to
  // checkout for that plan.
  useEffect(() => {
    if (!me || autoStarted.current || me.tier !== "free") return;
    const wanted = new URLSearchParams(window.location.search).get("plan");
    if (!isPaidTier(wanted)) return;
    autoStarted.current = true;
    setBusy("checkout");
    fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: wanted }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.url) window.location.href = d.url;
        else throw new Error(d.error);
      })
      .catch((e) => {
        setError(e?.message || "Could not start checkout.");
        setBusy(null);
      });
  }, [me]);

  async function openPortal() {
    setBusy("portal");
    setError(null);
    try {
      const r = await fetch("/api/billing/portal", { method: "POST" });
      const d = await r.json();
      if (!r.ok || !d.url) throw new Error(d.error);
      window.location.href = d.url;
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Could not open billing.");
      setBusy(null);
    }
  }

  async function signOut() {
    setBusy("signout");
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  async function deleteAccount() {
    const ok = window.confirm(
      "Delete your account for good? Any plan is cancelled straight away and this can't be undone."
    );
    if (!ok) return;
    setBusy("delete");
    setError(null);
    try {
      const r = await fetch("/api/account/delete", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await createClient().auth.signOut();
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Could not delete your account.");
      setBusy(null);
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p>We couldn't load your account. Please refresh the page.</p>
      </main>
    );
  }
  if (!me) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-ink/50 sm:px-6">Loading…</main>;
  }

  const renews = me.periodStart
    ? new Date(me.periodStart).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
    : null;

  return (
    <main className="relative isolate">
      <Glow />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-4xl font-extrabold tracking-tight">Your <span className="text-gradient">account</span></h1>
      <p className="mt-1 text-ink/60">{me.email}</p>

      {busy === "checkout" ? (
        <p className="mt-6 rounded-2xl bg-accent-soft p-4 text-accent-dark">Taking you to checkout…</p>
      ) : null}
      {me.pastDue ? (
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your last payment didn't go through. Update your card under Manage billing to keep your plan.
        </p>
      ) : null}
      {error ? <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      <section className="card mt-8 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-ink/60">Your plan</p>
            <p className="text-gradient text-3xl font-extrabold">{me.planName}</p>
            <p className="mt-1 text-sm text-ink/70">
              {me.unlimited
                ? `${me.used} messages used this month`
                : me.tier === "free"
                  ? `${me.used} of ${me.limit} free messages used`
                  : `${me.used} of ${me.limit} messages used this month`}
              {renews && me.tier !== "free" ? ` · month started ${renews}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/app" className="btn-primary">Open Nicelyy</Link>
            {me.hasBilling ? (
              <button type="button" onClick={openPortal} disabled={!!busy} className="btn-secondary">
                {busy === "portal" ? "Opening…" : "Manage billing"}
              </button>
            ) : null}
          </div>
        </div>
        {!me.unlimited ? (
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.min(100, (me.used / me.limit) * 100)}%` }}
            />
          </div>
        ) : null}
        {me.hasBilling ? (
          <p className="mt-4 text-xs text-ink/50">
            Change plan, update your card, download invoices or cancel under Manage billing.
          </p>
        ) : null}
      </section>

      {me.tier !== "unlimited" ? (
        <section className="mt-12">
          <h2 className="text-xl font-bold">
            {me.tier === "free" ? "Choose a plan" : "Need more messages?"}
          </h2>
          <div className="mt-6">
            <PricingCards mode="account" currentTier={me.tier} />
          </div>
        </section>
      ) : null}

      <section className="mt-12 flex flex-wrap gap-3 border-t border-ink/10 pt-8">
        <button type="button" onClick={signOut} disabled={!!busy} className="btn-secondary">
          {busy === "signout" ? "Signing out…" : "Sign out"}
        </button>
        <button
          type="button"
          onClick={deleteAccount}
          disabled={!!busy}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          {busy === "delete" ? "Deleting…" : "Delete my account"}
        </button>
      </section>
      </div>
    </main>
  );
}
