import Link from "next/link";
import { getRequestUser } from "@/lib/auth";

export default async function Nav() {
  const user = await getRequestUser();
  return (
    <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">
          nicely<span className="text-accent">.</span>
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold sm:gap-4">
          <Link href="/#pricing" className="hidden px-2 text-ink/70 hover:text-ink sm:inline">
            Pricing
          </Link>
          {user ? (
            <>
              <Link href="/account" className="px-2 text-ink/70 hover:text-ink">
                Account
              </Link>
              <Link href="/app" className="btn-primary px-4 py-2">
                Open Nicely
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 text-ink/70 hover:text-ink">
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
