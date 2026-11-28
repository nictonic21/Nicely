"use client";

import { useEffect } from "react";
import { metaTrack, track } from "@/lib/analytics";
import { isPaidTier, PLANS } from "@/lib/plans";

// After a successful Stripe checkout, Stripe sends people back to
// /app?welcome=1&plan=plus&interval=month. Record the subscription once, with
// the plan's price, then tidy the address so a refresh doesn't count it again.
export default function PurchaseTracker() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const plan = url.searchParams.get("plan");
    const interval = url.searchParams.get("interval") === "year" ? "year" : "month";
    if (url.searchParams.get("welcome") !== "1" || !isPaidTier(plan)) return;
    const value = interval === "year" ? PLANS[plan].yearlyPounds : PLANS[plan].pricePounds;
    const eventId = `sub-${plan}-${interval}-${new Date().toISOString().slice(0, 13)}`;
    let already = false;
    try {
      already = window.sessionStorage.getItem(eventId) === "1";
      window.sessionStorage.setItem(eventId, "1");
    } catch {}
    if (!already) {
      track("subscribe", { plan, interval, value });
      metaTrack("Subscribe", { value, currency: "GBP", predicted_ltv: PLANS[plan].pricePounds * 12 }, eventId);
    }
    url.searchParams.delete("plan");
    url.searchParams.delete("interval");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);
  return null;
}
