import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRequestUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { PLANS, type PaidTier } from "@/lib/plans";
import { TONES } from "@/lib/options";
import { FEEDBACK_REASONS } from "@/lib/feedback";
import { getRevenue } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// The owner's private dashboard. Only email addresses in ADMIN_EMAILS can
// see it; everyone else gets a "page not found". Counts only: no messages.

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

interface Stats {
  users_total: number;
  signups_7d: number;
  signups_30d: number;
  paying: Partial<Record<PaidTier, number>>;
  past_due: number;
  active_users_7d: number;
  messages_today: number;
  messages_7d: number;
  messages_30d: number;
  tweaks_30d: number;
  trials_7d: number;
  daily: { day: string; n: number }[];
  tones: { tone: string; n: number; up: number; down: number }[];
  reasons: Record<string, number>;
}

const gbp = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "–");

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-ink/50">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">{value}</p>
      {note ? <p className="mt-1 text-xs text-ink/55">{note}</p> : null}
    </div>
  );
}

function DailyChart({ daily }: { daily: Stats["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.n));
  const day = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", opts);
  return (
    <figure className="card relative z-10 p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-bold">Messages per day</span>
        <span className="text-xs text-ink/50">Last 14 days · peak {max}</span>
      </figcaption>
      <div className="relative mt-6 h-44">
        {/* Recessive gridlines at 0, half and max. */}
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-ink/[.07]" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -top-2 right-full mr-2 hidden text-[10px] tabular-nums text-ink/40 sm:block">
              {Math.round(max * f)}
            </span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {daily.map((d, i) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end justify-center">
              {/* Hit target is the whole column, bigger than the bar. */}
              <div
                className="w-full max-w-[24px] rounded-t-[4px] bg-accent transition group-hover:bg-accent-dark"
                style={{ height: `${(d.n / max) * 100}%`, minHeight: d.n > 0 ? 2 : 0 }}
              />
              <div
                className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block ${
                  i < 3 ? "left-0" : i > daily.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                }`}
              >
                <span className="font-semibold">{d.n}</span> messages · {day(d.day, { weekday: "short", day: "numeric", month: "short" })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-[2px] text-[10px] text-ink/45">
        {daily.map((d, i) => (
          <span key={d.day} className="flex-1 text-center">
            {i % 2 === 0 || i === daily.length - 1 ? day(d.day, { day: "numeric", month: "short" }) : ""}
          </span>
        ))}
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-accent">Show as table</summary>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink/50">
            <tr><th className="py-1 font-semibold">Day</th><th className="py-1 text-right font-semibold">Messages</th></tr>
          </thead>
          <tbody>
            {daily.map((d) => (
              <tr key={d.day} className="border-t border-ink/[.06]">
                <td className="py-1.5">{day(d.day, { weekday: "short", day: "numeric", month: "short" })}</td>
                <td className="py-1.5 text-right tabular-nums">{d.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export default async function AdminPage() {
  const user = await getRequestUser();
  if (!isAdmin(user?.email)) notFound();

  const [{ data, error }, revenue] = await Promise.all([
    createAdminClient().rpc("admin_stats"),
    getRevenue().catch(() => null),
  ]);
  if (error || !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p>Couldn&apos;t load the numbers. Check the database setup has been run, then refresh.</p>
      </main>
    );
  }
  const s = data as Stats;
  const paying = (["starter", "plus", "unlimited"] as PaidTier[]).map((t) => ({ tier: t, n: s.paying[t] ?? 0 }));
  const payingTotal = paying.reduce((a, p) => a + p.n, 0);
  const toneLabel = (id: string) => TONES.find((t) => t.id === id)?.label ?? id;
  const reasonLabel = (id: string) => FEEDBACK_REASONS.find((r) => r.id === id)?.label ?? id;
  const reasons = Object.entries(s.reasons).sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Owner only</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/55">Live numbers. Counts only, never anyone&apos;s messages.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Monthly revenue"
          value={revenue ? gbp(revenue.mrrPence) : "–"}
          note={revenue ? `${revenue.subscriptions} subscriptions · ${revenue.yearly} yearly · incl. VAT` : "Connect Stripe to see this"}
        />
        <Tile label="Paying customers" value={payingTotal.toLocaleString()} note={`${pct(payingTotal, s.users_total)} of all accounts${s.past_due ? ` · ${s.past_due} card failing` : ""}`} />
        <Tile label="Accounts" value={s.users_total.toLocaleString()} note={`+${s.signups_7d} this week · +${s.signups_30d} in 30 days`} />
        <Tile label="Messages today" value={s.messages_today.toLocaleString()} note={`${s.messages_7d} this week · ${s.messages_30d} in 30 days`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Tile label="Active this week" value={s.active_users_7d.toLocaleString()} note="People who wrote at least one message" />
        <Tile label="Free tries this week" value={s.trials_7d.toLocaleString()} note={`Sign-ups this week: ${s.signups_7d} (${pct(s.signups_7d, s.trials_7d)} of tries)`} />
        <Tile label="Quick tweaks (30 days)" value={s.tweaks_30d.toLocaleString()} note={`${s.messages_30d ? (s.tweaks_30d / s.messages_30d).toFixed(1) : "0"} per message`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DailyChart daily={s.daily} />
        </div>
        <div className="card p-5 sm:p-6 lg:col-span-2">
          <p className="font-bold">Paying customers by plan</p>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-ink/50">
              <tr>
                <th className="pb-2 font-semibold">Plan</th>
                <th className="pb-2 text-right font-semibold">Customers</th>
                <th className="pb-2 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {paying.map((p) => (
                <tr key={p.tier} className="border-t border-ink/[.06]">
                  <td className="py-2.5">{PLANS[p.tier].name} <span className="text-ink/45">£{PLANS[p.tier].pricePounds}</span></td>
                  <td className="py-2.5 text-right tabular-nums font-semibold">{p.n}</td>
                  <td className="py-2.5 text-right tabular-nums text-ink/60">{pct(p.n, payingTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="card p-5 sm:p-6 lg:col-span-3">
          <p className="font-bold">Tones (last 30 days)</p>
          <p className="text-xs text-ink/50">How often each is used, and how people rated it.</p>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-ink/50">
              <tr>
                <th className="pb-2 font-semibold">Tone</th>
                <th className="pb-2 text-right font-semibold">Messages</th>
                <th className="pb-2 text-right font-semibold">Thumbs up</th>
                <th className="pb-2 text-right font-semibold">Thumbs down</th>
                <th className="pb-2 text-right font-semibold">Liked</th>
              </tr>
            </thead>
            <tbody>
              {s.tones.length === 0 ? (
                <tr><td colSpan={5} className="border-t border-ink/[.06] py-4 text-center text-ink/50">No messages yet</td></tr>
              ) : (
                s.tones.map((t) => (
                  <tr key={t.tone} className="border-t border-ink/[.06]">
                    <td className="py-2.5">{toneLabel(t.tone)}</td>
                    <td className="py-2.5 text-right tabular-nums">{t.n}</td>
                    <td className="py-2.5 text-right tabular-nums">{t.up}</td>
                    <td className="py-2.5 text-right tabular-nums">{t.down}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold">{pct(t.up, t.up + t.down)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="card p-5 sm:p-6 lg:col-span-2">
          <p className="font-bold">Why people gave a thumbs down</p>
          <p className="text-xs text-ink/50">Last 30 days</p>
          {reasons.length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">None yet</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {reasons.map(([id, n]) => (
                <li key={id} className="flex items-center justify-between border-t border-ink/[.06] pt-2">
                  <span>{reasonLabel(id)}</span>
                  <span className="tabular-nums font-semibold">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
