import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequestUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { runHealthChecks, type CheckStatus } from "@/lib/health";

// Owner-only setup check: every connection, in plain English. Never shows
// a secret value.

export const metadata: Metadata = { title: "Setup check", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const BADGE: Record<CheckStatus, { label: string; cls: string; icon: string }> = {
  ok: { label: "Working", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: "✓" },
  problem: { label: "Needs fixing", cls: "bg-red-50 text-red-700 ring-red-200", icon: "!" },
  off: { label: "Off", cls: "bg-ink/[.05] text-ink/55 ring-ink/10", icon: "–" },
};

export default async function SetupCheckPage() {
  const user = await getRequestUser();
  if (!isAdmin(user?.email)) notFound();

  const groups = await runHealthChecks();
  const problems = groups.flatMap((g) => g.checks).filter((c) => c.status === "problem").length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/admin" className="text-sm font-semibold text-accent hover:underline">← Dashboard</Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Setup check</h1>
      <p className="mt-2 text-ink/60">
        {problems === 0
          ? "Everything that's switched on is working."
          : `${problems} thing${problems > 1 ? "s" : ""} need${problems > 1 ? "" : "s"} fixing. Each one says what to do.`}{" "}
        Refresh this page after changing anything in Vercel and redeploying.
      </p>

      <div className="mt-8 space-y-6">
        {groups.map((g) => (
          <section key={g.title} className="card overflow-hidden">
            <h2 className="border-b border-ink/[.06] px-5 py-3 text-sm font-bold uppercase tracking-wider text-ink/55">{g.title}</h2>
            <ul className="divide-y divide-ink/[.06]">
              {g.checks.map((c) => {
                const b = BADGE[c.status];
                return (
                  <li key={c.name} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:gap-4">
                    <span className={`inline-flex w-fit flex-none items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${b.cls}`}>
                      <span aria-hidden>{b.icon}</span> {b.label}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{c.name}</p>
                      <p className="mt-0.5 break-words text-sm text-ink/65">{c.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-6 text-xs text-ink/45">This page never shows your keys, only whether they're set and what they connect to.</p>
    </main>
  );
}
