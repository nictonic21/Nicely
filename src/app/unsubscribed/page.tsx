import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";

export const metadata: Metadata = { title: "Unsubscribed", robots: { index: false } };

export default function Unsubscribed({ searchParams }: { searchParams: { error?: string } }) {
  return searchParams.error ? (
    <AuthShell title="That link didn't work" subtitle="It may be out of date.">
      <p className="text-ink/70">
        You can turn reminder emails off any time from your{" "}
        <Link href="/account" className="font-semibold text-accent">account page</Link>.
      </p>
    </AuthShell>
  ) : (
    <AuthShell title="You're unsubscribed" subtitle="We won't send you reminder emails any more.">
      <p className="text-ink/70">
        You'll still get emails you need, like password resets and receipts. Changed your mind? Turn them back on
        from your <Link href="/account" className="font-semibold text-accent">account page</Link>.
      </p>
    </AuthShell>
  );
}
