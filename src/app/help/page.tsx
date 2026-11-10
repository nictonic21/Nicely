import type { Metadata } from "next";
import Link from "next/link";
import Glow from "@/components/Glow";
import ContactForm from "@/components/ContactForm";
import { IconMail } from "@/components/Icons";
import { getRequestUser } from "@/lib/auth";
import { contactConfigured } from "@/lib/emails";
import { HELP_FAQS } from "@/lib/help";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help",
  description: "Answers to common questions about Nicelyy, and how to contact us.",
};

export default async function HelpPage() {
  const user = await getRequestUser();
  const canSend = contactConfigured();
  return (
    <main className="relative isolate">
      <Glow />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Help</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
          How can we <span className="text-gradient">help?</span>
        </h1>
        <p className="mt-3 text-ink/65">
          Quick answers below. Can&apos;t find what you need?{" "}
          <a href="#contact" className="font-semibold text-accent hover:underline">Contact us</a>.
        </p>

        <div className="mt-10 space-y-10">
          {HELP_FAQS.map((g) => (
            <section key={g.group}>
              <h2 className="text-lg font-bold">{g.group}</h2>
              <div className="mt-3 space-y-2.5">
                {g.items.map((f) => (
                  <details key={f.q} className="card group p-5 open:shadow-glow">
                    <summary className="cursor-pointer list-none font-semibold">
                      <span className="flex items-center justify-between gap-4">
                        {f.q}
                        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-soft text-accent transition group-open:rotate-45">
                          +
                        </span>
                      </span>
                    </summary>
                    <p className="mt-3 text-ink/70">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section id="contact" className="mt-14 scroll-mt-24">
          <div className="card p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold tracking-tight">Contact us</h2>
            <p className="mt-1 text-ink/65">We&apos;re a small team and read every message.</p>
            <div className="mt-6">
              {canSend ? (
                <ContactForm signedInEmail={user?.email ?? null} />
              ) : CONTACT_EMAIL ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="btn-primary">
                  <IconMail /> Email {CONTACT_EMAIL}
                </a>
              ) : (
                <p className="text-ink/60">Our contact details are coming soon.</p>
              )}
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-ink/50">
            Need to change plan or cancel? You can do it yourself on your{" "}
            <Link href="/account" className="font-semibold text-accent hover:underline">account page</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
