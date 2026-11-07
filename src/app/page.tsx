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
    a: "Yes. Tap the microphone and just talk, as messy as you like. Nicely tidies it up.",
  },
  {
    q: "Can I cancel?",
    a: "Any time, in two taps from your account page. You keep your plan until the end of the month you've paid for.",
  },
  {
    q: "Will it make me sound like a robot?",
    a: "No. Nicely keeps your point and your voice. It just takes the heat out and makes it clear.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="mx-auto inline-block rounded-full bg-accent-soft px-4 py-1.5 text-sm font-semibold text-accent-dark">
          For the messages you'd rather not write
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Say what you mean. <span className="text-accent">Nicely.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink/70 sm:text-xl">
          Angry, awkward or lost for words? Type it, paste it or say it out loud. Nicely turns it
          into a clear, calm message that's ready to send.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary px-8 py-4 text-lg">
            Try 3 messages free
          </Link>
          <Link href="#how" className="btn-secondary px-8 py-4 text-lg">
            See how it works
          </Link>
        </div>
        <p className="mt-3 text-sm text-ink/50">No card needed.</p>
      </section>

      {/* Examples */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {EXAMPLES.map((ex) => (
            <div key={ex.situation} className="card flex flex-col p-5">
              <p className="text-sm font-bold">{ex.situation}</p>
              <div className="mt-3 rounded-2xl bg-ink/5 p-4 text-sm text-ink/70">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
                  What you want to say
                </p>
                {ex.before}
              </div>
              <div className="mt-3 flex-1 rounded-2xl bg-accent-soft p-4 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent-dark">
                  Nicely · {ex.tone}
                </p>
                {ex.after}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Three steps. About ten seconds.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              ["1", "Get it off your chest", "Type it, paste it, or tap the mic and say it out loud. Swearing allowed."],
              ["2", "Pick a tone", "Professional, kind, firm, clear and simple, or a strong comeback."],
              ["3", "Copy and send", "Get a calm, clear message in seconds. Copy it with one tap."],
            ].map(([n, title, text]) => (
              <div key={n} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-extrabold text-white">
                  {n}
                </div>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-ink/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Simple pricing
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink/70">
          Start with 3 free messages. Upgrade when you need more, and cancel any time.
        </p>
        <div className="mt-12">
          <PricingCards mode="public" />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">Questions</h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-ink/10 p-5">
                <summary className="cursor-pointer list-none font-semibold">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-accent transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-ink/70">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Next time, say it nicely.
        </h2>
        <Link href="/signup" className="btn-primary mt-8 px-8 py-4 text-lg">
          Try 3 messages free
        </Link>
      </section>
    </main>
  );
}
