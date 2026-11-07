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
      <div className="grid gap-4 md:grid-cols-3">
        {PAID_TIERS.map((tier) => {
          const plan = PLANS[tier];
          const popular = tier === "plus";
          const current = currentTier === tier;
          return (
            <div
              key={tier}
              className={`card relative flex flex-col p-6 ${popular ? "border-2 border-accent" : ""}`}
            >
              {popular ? (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
                  Most popular
                </span>
              ) : null}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-ink/60">{plan.blurb}</p>
              <p className="mt-5">
                <span className="text-4xl font-extrabold">£{plan.pricePounds}</span>
                <span className="text-ink/60"> /month</span>
              </p>
              <p className="mt-3 font-semibold">
                {plan.unlimited ? "Unlimited messages*" : `${plan.limit} messages a month`}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-ink/70">
                <li>✓ Type, paste or voice note</li>
                <li>✓ Every tone, from kind to comeback</li>
                <li>✓ Texts and emails</li>
                <li>✓ Cancel any time</li>
              </ul>
              <button
                type="button"
                disabled={!!busy || current}
                onClick={() => choose(tier)}
                className={`mt-6 ${popular ? "btn-primary" : "btn-secondary"}`}
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
