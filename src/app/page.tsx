import Link from "next/link";
import PricingCards from "@/components/PricingCards";

const EXAMPLES = [
  {
    situation: "Your manager called you out",
    tone: "Professional",
    before:
      "are you serious?? ive stayed late every night this week and you call ME out in front of everyone. absolute joke",
    after:
      "I'd like to talk about this morning's meeting. I've stayed late every evening this week to hit the deadline, so being called out in front of the team felt unfair. Could we find ten minutes today to go through it?",
  },
  {
    situation: "Someone won't stop arguing",
    tone: "Strong comeback",
    before: "you always twist everything i say and then act like the victim, i'm done",
    after:
      "I'm not going to keep going round in circles. You know what I said and what I meant. When you're ready to talk about it honestly, I'm here.",
  },
  {
    situation: "You don't know how to say it",
    tone: "Kind",
    before: "need to tell my friend i cant be her bridesmaid cos of money but dont want her to hate me",
    after:
      "I've been putting off saying this because I love you and I'm so happy for you. Money's really tight for me right now, and I don't think I can afford to be a bridesmaid. I'd still love to be there and help however I can.",
  },
];

const FAQS = [
  {
    q: "What counts as a message?",
    a: "Each time you press “Say it nicely” and get a rewrite, that's one message. If something goes wrong on our side, it isn't counted.",
  },
  {
    q: "Do you keep what I write?",
    a: "No. Your words are used to write your rewrite and then they're gone. We only count how many rewrites you've used, never what they said.",
  },
  {
    q: "Can I use voice notes?",
    a: "Yes. Tap the microphone and just talk, as messy as you like. Nicelyy tidies it up.",
  },
  {
    q: "Can I cancel?",
    a: "Any time, in two taps from your account page. You keep your plan until the end of the month you've paid for.",
  },
  {
    q: "Will it make me sound like a robot?",
    a: "No. Nicelyy keeps your point and your voice. It just takes the heat out and makes it clear.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero: dark, with glowing colour */}
      <section className="relative isolate overflow-hidden bg-night text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-40 h-[520px] w-[520px] animate-float rounded-full bg-violet-600/40 blur-3xl" />
          <div className="absolute -right-24 top-0 h-[460px] w-[460px] animate-float rounded-full bg-pink-600/30 blur-3xl [animation-delay:-4s]" />
          <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] animate-float rounded-full bg-amber-500/25 blur-3xl [animation-delay:-8s]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-40 pt-16 text-center sm:px-6 sm:pt-24">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/90 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-brand" />
            For the messages you&apos;d rather not write
          </p>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
            Say what you mean.
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Nicelyy.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/75 sm:text-xl">
            Angry, awkward or lost for words? Type it, paste it or say it out loud. Nicelyy turns it
            into a <span className="font-semibold text-white">clear, calm message</span> that&apos;s ready to send.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary px-8 py-4 text-lg">
              Try 3 messages free →
            </Link>
            <Link href="#how" className="btn-ghost-light px-8 py-4 text-lg">
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/50">No card needed · Cancel any time</p>
        </div>
      </section>

      {/* Examples, overlapping the hero */}
      <section className="relative z-10 mx-auto -mt-28 max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {EXAMPLES.map((ex) => (
            <div key={ex.situation} className="card flex flex-col !bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-glow">
              <p className="font-bold">{ex.situation}</p>
              <div className="mt-3 rounded-2xl bg-ink/[.04] p-4 text-sm text-ink/60">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
                  😤 What you want to say
                </p>
                <span className="italic">&ldquo;{ex.before}&rdquo;</span>
              </div>
              <div className="my-2 flex justify-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-glow">↓</span>
              </div>
              <div className="flex-1 rounded-2xl bg-brand-soft p-4 text-sm leading-relaxed ring-1 ring-accent/10">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-accent-dark">
                  ✨ Nicelyy · {ex.tone}
                </p>
                {ex.after}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative isolate scroll-mt-20 overflow-hidden py-24">
        <div aria-hidden className="absolute inset-0 -z-10 bg-brand-soft" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
            Three steps. <span className="highlight">About ten seconds.</span>
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              ["1", "🎙️", "Get it off your chest", "Type it, paste it, or tap the mic and say it out loud. Swearing allowed."],
              ["2", "🎚️", "Pick a tone", "Professional, kind, firm, clear and simple, or a strong comeback."],
              ["3", "📋", "Copy and send", "Get a calm, clear message in seconds. Copy it with one tap."],
            ].map(([n, icon, title, text]) => (
              <div key={n} className="card relative p-7 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl shadow-glow">
                  {icon}
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-accent">Step {n}</p>
                <h3 className="mt-1 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-ink/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative isolate mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <h2 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
          Simple <span className="text-gradient">pricing</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-ink/70">
          Start with <span className="highlight font-semibold text-ink">3 free messages</span>. Upgrade when
          you need more, and cancel any time.
        </p>
        <div className="mt-14">
          <PricingCards mode="public" />
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-4xl font-extrabold tracking-tight">Questions</h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="card group p-5 open:shadow-glow">
                <summary className="cursor-pointer list-none font-semibold">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand text-white transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-ink/70">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-brand px-6 py-16 text-center text-white shadow-glow sm:py-20">
          <div aria-hidden className="absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-16 -z-10 h-72 w-72 rounded-full bg-night/30 blur-3xl" />
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Next time, say it nicely.</h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/85">
            The calm, clear words you wish you&apos;d thought of, in seconds.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-bold text-accent-dark shadow-lg transition hover:-translate-y-0.5"
          >
            Try 3 messages free →
          </Link>
        </div>
      </section>
    </main>
  );
}
