"use client";

import { useState } from "react";
import { PAID_TIERS, PLANS, type Interval, type PaidTier, type Tier } from "@/lib/plans";
import { track } from "@/lib/analytics";

// mode "public": buttons send people to sign up.
// mode "account": buttons start Stripe checkout (or switch plan).
export default function PricingCards({
  mode,
  currentTier,
  yearly = false,
}: {
  mode: "public" | "account";
  currentTier?: Tier;
  yearly?: boolean; // show the Monthly / Yearly switch
}) {
  const [interval, setBilling] = useState<Interval>("month");
  const [busy, setBusy] = useState<PaidTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(tier: PaidTier) {
    if (mode === "public") {
      track("plan_click", { tier, interval });
      window.location.href = `/signup?next=${encodeURIComponent(`/account?plan=${tier}&interval=${interval}`)}`;
      return;
    }
    setBusy(tier);
    setError(null);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout.");
      track("checkout_start", { tier, interval });
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(null);
    }
  }

  return (
    <div>
      {yearly ? (
        <div className="mb-10 flex justify-center">
          <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-full border border-ink/10 bg-white p-1 shadow-soft">
            {(["month", "year"] as Interval[]).map((iv) => (
              <button
                key={iv}
                type="button"
                role="radio"
                aria-checked={interval === iv}
                onClick={() => setBilling(iv)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  interval === iv ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
                }`}
              >
                {iv === "month" ? "Monthly" : "Yearly"}
                {iv === "year" ? (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${interval === iv ? "bg-white/20" : "bg-accent-soft text-accent-dark"}`}>
                    2 months free
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
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
                  £{interval === "year" ? plan.yearlyPounds : plan.pricePounds}
                </span>
                <span className="text-ink/50">{interval === "year" ? "/year" : "/month"}</span>
              </p>
              <p className="mt-1 h-4 text-xs text-ink/50">
                {interval === "year"
                  ? `£${(plan.yearlyPounds / 12).toFixed(2)} a month · save £${plan.pricePounds * 12 - plan.yearlyPounds}`
                  : ""}
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
