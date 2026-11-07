"use client";

import { useState } from "react";
import { PAID_TIERS, PLANS, type PaidTier, type Tier } from "@/lib/plans";

// mode "public": buttons send people to sign up.
// mode "account": buttons start Stripe checkout (or switch plan).
export default function PricingCards({
  mode,
  currentTier,
}: {
  mode: "public" | "account";
  currentTier?: Tier;
}) {
  const [busy, setBusy] = useState<PaidTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(tier: PaidTier) {
    if (mode === "public") {
      window.location.href = `/signup?next=${encodeURIComponent(`/account?plan=${tier}`)}`;
      return;
    }
    setBusy(tier);
    setError(null);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
        {PAID_TIERS.map((tier) => {
          const plan = PLANS[tier];
          const popular = tier === "plus";
          const current = currentTier === tier;
          const inner = (
            <div className={`relative flex h-full flex-col p-6 `}>
              {popular ? (
                <span className="absolute -top-3.5 left-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow-glow">
                  ★ Most popular
                </span>
              ) : null}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-ink/60">{plan.blurb}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className={`text-5xl font-extrabold tracking-tight ${popular ? "text-gradient" : ""}`}>
                  £{plan.pricePounds}
                </span>
                <span className="text-ink/50">/month</span>
              </p>
              <p className="mt-4 inline-flex w-fit rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent-dark">
                {plan.unlimited ? "Unlimited messages*" : `${plan.limit} messages a month`}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink/75">
                {["Type, paste or voice note", "Every tone, from kind to comeback", "Texts and emails", "Cancel any time"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={!!busy || current}
                onClick={() => choose(tier)}
                className={`mt-6 w-full ${popular ? "btn-primary" : "btn-secondary"}`}
              >
                {current
                  ? "Your plan"
                  : busy === tier
                    ? "Opening…"
                    : mode === "account" && currentTier && currentTier !== "free"
                      ? `Switch to ${plan.name}`
                      : `Get ${plan.name}`}
              </button>
            </div>
          );
          return popular ? (
            <div key={tier} className="gradient-card md:-translate-y-3">
              <div className="gradient-card-inner">{inner}</div>
            </div>
          ) : (
            <div key={tier} className="card">
              {inner}
            </div>
          );
        })}
      </div>
      {error ? <p className="mt-4 text-center text-sm text-red-600">{error}</p> : null}
      <p className="mt-4 text-center text-xs text-ink/50">
        Prices include VAT where it applies. *Unlimited is subject to a fair-use limit of{" "}
        {PLANS.unlimited.limit} messages a month. Start with {PLANS.free.limit} free messages, no card needed.
      </p>
    </div>
  );
}
