import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-ink/5 py-10 text-sm text-ink/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Nicely. Say it nicely.</p>
        <div className="flex gap-5">
          <Link href="/#pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
