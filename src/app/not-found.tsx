import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-extrabold">We can't find that page</h1>
      <p className="mt-3 text-ink/70">It may have moved. Let's get you back.</p>
      <Link href="/" className="btn-primary mt-8">Go home</Link>
    </main>
  );
}
