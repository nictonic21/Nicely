import Link from "next/link";
import Logo from "@/components/Logo";
import { getRequestUser } from "@/lib/auth";

export default async function Nav() {
  const user = await getRequestUser();
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-cream/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Nicely home">
          <Logo />
        </Link>
        <div className="flex items-center gap-1 text-sm font-semibold sm:gap-3">
          <Link href="/#pricing" className="hidden rounded-full px-3 py-2 text-ink/70 transition hover:bg-white hover:text-ink sm:inline">
            Pricing
          </Link>
          {user ? (
            <>
              <Link href="/account" className="rounded-full px-3 py-2 text-ink/70 transition hover:bg-white hover:text-ink">
                Account
              </Link>
              <Link href="/app" className="btn-primary px-4 py-2">
                Open Nicely
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 text-ink/70 transition hover:bg-white hover:text-ink">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary px-4 py-2">
                Try free
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
