import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="relative bg-night text-white/60">
      <div aria-hidden className="h-1 w-full bg-brand" />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 text-sm sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Logo light />
          <p>© {new Date().getFullYear()} Nicelyy · Say it nicelyy.</p>
        </div>
        <div className="flex gap-6">
          <Link href="/#pricing" className="transition hover:text-white">Pricing</Link>
          <Link href="/help" className="transition hover:text-white">Help</Link>
          <Link href="/terms" className="transition hover:text-white">Terms</Link>
          <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
