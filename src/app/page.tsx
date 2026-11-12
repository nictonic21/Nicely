import Link from "next/link";
import PricingCards from "@/components/PricingCards";
import TryIt from "@/components/TryIt";
import {
  IconAlign,
  IconArrowRight,
  IconBolt,
  IconBriefcase,
  IconChat,
  IconHeartHand,
  IconReply,
  IconShield,
  IconWand,
} from "@/components/Icons";
import { yearlyAvailable } from "@/lib/stripe";

// Home page. Copy supplied by the owner; keep it word for word.

const EXAMPLES = [
  {
    n: "01",
    situation: "When your boss denies your annual leave.",
    tone: "Professional",
    before: "I wasn’t asking. I was telling you. I’ve booked my holiday, thanks.",
    after:
      "I’d like to revisit my annual leave request. I’ve made arrangements around these dates and would appreciate discussing how we can accommodate this.",
    note: "Same point. Slightly better delivery.",
  },
  {
    n: "02",
    situation: "When your ex just won’t get the hint.",
    tone: "Firm",
    before: "Do you ever get tired of being the problem?",
    after:
      "I don’t think continuing this conversation is productive. I’d appreciate it if we could keep communication focused on what’s actually necessary.",
  },
  {
    n: "03",
    situation: "When your friend asks to borrow money. Again.",
    tone: "Kind",
    before: "Do I look like a bank?",
    after: "I’m sorry, but I’m not in a position to lend money right now. I hope you understand.",
  },
  {
    n: "04",
    situation: "When someone sends you a passive-aggressive message.",
    tone: "Clear & firm",
    before: "Not sure what tone you’re going for, but it’s not working.",
    after: "I’m happy to have a conversation, but I’d appreciate us keeping it respectful.",
  },
  {
    n: "05",
    situation: "When your manager emails at 5:01pm.",
    tone: "Professional",
    before: "Absolutely not. See you tomorrow.",
    after: "Thanks for sending this over. I’ll pick it up first thing tomorrow and come back to you.",
  },
];

const ABILITIES = [
  {
    title: "Write it",
    text: "Got something on your mind? Get your thoughts out and turn them into a message that says exactly what you mean.",
    Icon: IconChat,
  },
  {
    title: "Reply to it",
    text: "Received a message and don’t know what to say? Paste it in and find a response that fits the situation.",
    Icon: IconReply,
  },
  {
    title: "Make it better",
    text: "Already written something? Refine it, change the tone or make your point a little clearer.",
    Icon: IconWand,
  },
];

const TONE_CARDS = [
  { title: "Professional", text: "For when your inside voice needs an outside voice filter.", Icon: IconBriefcase },
  { title: "Kind", text: "Say what you mean without hurting someone’s feelings.", Icon: IconHeartHand },
  { title: "Firm", text: "Boundaries. Without the essay.", Icon: IconShield },
  { title: "Clear & simple", text: "Straight to the point. No unnecessary paragraphs.", Icon: IconAlign },
  { title: "Strong comeback", text: "Because sometimes you’ve got something to say.", Icon: IconBolt },
];

const STEPS = [
  {
    n: "01",
    title: "Start with what you’ve got",
    text: "Type your thoughts, paste a message or say it out loud. No need to edit yourself first.",
  },
  {
    n: "02",
    title: "Choose your tone",
    text: "Decide how you want to come across. Professional, kind, firm, clear and simple, or a strong comeback.",
  },
  {
    n: "03",
    title: "Get your words",
    text: "Nicelyy helps you turn your thoughts into a message or craft a reply that’s ready to copy, edit and send.",
  },
];

const FAQS = [
  {
    q: "What is Nicelyy?",
    a: "Nicelyy is an AI-powered communication assistant that helps you write messages, craft replies and express yourself in the right tone.",
  },
  {
    q: "Can I use Nicelyy to reply to messages I’ve received?",
    a: "Absolutely. Paste in the message you’ve received and Nicelyy can help you find a response that suits the situation.",
  },
  {
    q: "What kind of messages can I use it for?",
    a: "Pretty much anything. Work emails, awkward conversations, relationship messages, friendships, setting boundaries and everyday replies.",
  },
  {
    q: "Do I have to know exactly what I want to say?",
    a: "Not at all. Start with your unfiltered thoughts. They don’t need to be perfectly written.",
  },
  {
    q: "Can I choose how my message sounds?",
    a: "Yes. You can choose from the available tones to help get your message across in the way you want.",
  },
  {
    q: "Is Nicelyy free?",
    a: "You can try your first three messages free. No payment card required.",
  },
  {
    q: "Do I need to sign up?",
    a: "You can try Nicelyy without signing up, subject to the available free-message allowance.",
  },
];

function SectionHead({ eyebrow, title, children }: { eyebrow?: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h2>
      {children ? <div className="mx-auto mt-5 max-w-2xl space-y-3 text-lg text-ink/70">{children}</div> : null}
    </div>
  );
}

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-night text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-40 h-[520px] w-[520px] animate-float rounded-full bg-violet-600/40 blur-3xl" />
          <div className="absolute -right-24 top-0 h-[460px] w-[460px] animate-float rounded-full bg-pink-600/30 blur-3xl [animation-delay:-4s]" />
          <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] animate-float rounded-full bg-amber-500/25 blur-3xl [animation-delay:-8s]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-24">
          <h1 className="mx-auto max-w-4xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
            Got something to say?
            <span className="mt-1 block bg-gradient-to-r from-violet-300 via-pink-400 to-amber-300 bg-clip-text pb-2 text-transparent">
              Say it Nicelyy.
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-balance text-xl font-semibold text-white/90 sm:text-2xl">
            The awkward reply. The difficult conversation. The email that needs a little less attitude.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/70">
            Whether you need to write something, reply to someone or find a better way to get your point across,
            Nicelyy helps you find just the right words.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-white/70">
            Funny, firm, professional, kind or somewhere in between. You’ve got options.
          </p>
          <div className="mt-9 flex justify-center">
            <Link href="/signup" className="btn-primary px-8 py-4 text-lg">
              Try 3 messages free <IconArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/55">No judgement. No overthinking. Just better words.</p>
        </div>
      </section>

      {/* The problem */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
            You know what you want to say. <span className="highlight">It’s how to say it</span> that’s the problem.
          </h2>
          <div className="space-y-4 text-lg leading-relaxed text-ink/75">
            <p className="font-semibold text-ink">We’ve all been there.</p>
            <p>You’ve typed it. Deleted it. Rewritten it. Sent it to your best friend for approval.</p>
            <p>You’ve stared at an email for 20 minutes trying to sound professional when you’re anything but.</p>
            <p>Or you’ve received a message and genuinely have no idea how to respond.</p>
            <p>
              Sometimes you need to be a little nicer. Sometimes you need to be a little firmer. And sometimes you
              just need someone to help you find the words.
            </p>
            <p className="font-semibold text-ink">That’s what Nicelyy is here for.</p>
          </div>
        </div>
      </section>

      {/* Real-life examples */}
      <section className="relative isolate overflow-hidden py-20 sm:py-24">
        <div aria-hidden className="absolute inset-0 -z-10 bg-brand-soft" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead title="Life would be easier if everyone came with a reply button.">
            <p>Here are a few situations where Nicelyy comes in handy.</p>
          </SectionHead>
          <div className="mt-14 grid gap-5 md:grid-cols-6">
            {EXAMPLES.map((ex, i) => (
              <article
                key={ex.n}
                className={`card flex flex-col !bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-glow md:col-span-3 ${
                  i < 3 ? "lg:col-span-2" : "lg:col-span-3"
                }`}
              >
                <p className="text-xs font-bold tracking-widest text-accent">{ex.n}</p>
                <h3 className="mt-1 font-bold leading-snug">{ex.situation}</h3>
                <div className="mt-4 rounded-2xl bg-ink/[.04] p-4 text-sm text-ink/60">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">What you want to say</p>
                  <p className="italic">&ldquo;{ex.before}&rdquo;</p>
                </div>
                <div className="my-2 flex justify-center">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white shadow-glow">↓</span>
                </div>
                <div className="flex-1 rounded-2xl bg-brand-soft p-4 text-sm leading-relaxed ring-1 ring-accent/10">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-accent-dark">
                    Say it Nicelyy · {ex.tone}
                  </p>
                  <p>&ldquo;{ex.after}&rdquo;</p>
                </div>
                {ex.note ? <p className="mt-3 text-sm font-semibold text-ink/60">{ex.note}</p> : null}
              </article>
            ))}
          </div>
          <p className="mt-12 text-center text-xl font-bold">
            Whatever the situation, there’s a <span className="text-gradient">better way to say it.</span>
          </p>
        </div>
      </section>

      {/* What can Nicelyy do? */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionHead eyebrow="What can Nicelyy do?" title="It’s not just about what you say. It’s about what you say back.">
          <p>
            Sometimes you need help getting your own thoughts into words. Other times, someone sends you a message and
            you’re completely lost on what to reply.
          </p>
          <p className="font-semibold text-ink">Nicelyy has you covered.</p>
        </SectionHead>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {ABILITIES.map(({ title, text, Icon }) => (
            <div key={title} className="card p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-glow">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-ink/70">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Choose your tone */}
      <section className="relative isolate overflow-hidden bg-night py-20 text-white sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-violet-600/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-pink-600/25 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/90">
              Choose your tone
            </p>
            <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
              There’s a Nicelyy for every mood.
            </h2>
            <div className="mx-auto mt-5 max-w-2xl space-y-3 text-lg text-white/70">
              <p>Not every message needs to sound like it was written by HR.</p>
              <p>
                Sometimes you need to be professional. Sometimes you need to be kind. And sometimes you need to stand
                your ground.
              </p>
              <p className="font-semibold text-white">Choose the tone that feels right.</p>
            </div>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {TONE_CARDS.map(({ title, text, Icon }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[.06] p-5 backdrop-blur transition hover:border-white/25 hover:bg-white/[.09]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-bold uppercase tracking-wider">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-12 max-w-2xl text-balance text-center text-xl font-bold">
            Because saying it nicely doesn’t mean you can’t{" "}
            <span className="bg-gradient-to-r from-pink-300 to-amber-300 bg-clip-text text-transparent">say it firmly.</span>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
        <SectionHead eyebrow="How it works" title="Getting the words right has never been easier." />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-7">
              <p className="text-gradient text-4xl font-extrabold tracking-tight">{s.n}</p>
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-ink/70">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-lg font-semibold">That’s it. No overthinking required.</p>
      </section>

      {/* Try it now */}
      <section id="try" className="relative isolate scroll-mt-20 overflow-hidden py-20 sm:py-24">
        <div aria-hidden className="absolute inset-0 -z-10 bg-brand-soft" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead eyebrow="Free · No sign-up" title={<>Try it <span className="text-gradient">right now</span></>}>
            <p>Type something you’ve been struggling to say. See what Nicelyy does with it.</p>
          </SectionHead>
          <div className="mt-12">
            <TryIt />
          </div>
        </div>
      </section>

      {/* The benefit */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
          Say what you mean. <span className="text-gradient">Without second-guessing every word.</span>
        </h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-2 text-lg text-ink/70">
          <p>No more staring at a blank screen.</p>
          <p>No more asking five different people what you should reply.</p>
          <p>No more rewriting the same message until it doesn’t even sound like you.</p>
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-xl font-semibold">
          Get your point across. Find your confidence. Feel better about pressing send.
        </p>
        <p className="mt-6 text-2xl font-extrabold">
          You’ve got something to say. <span className="text-gradient">Say it Nicelyy.</span>
        </p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative isolate mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6 sm:pb-24">
        <SectionHead title={<>Simple <span className="text-gradient">pricing</span></>}>
          <p>
            Start with <span className="highlight font-semibold text-ink">3 free messages</span>. Upgrade when you
            need more, and cancel any time.
          </p>
        </SectionHead>
        <div className="mt-14">
          <PricingCards mode="public" yearly={yearlyAvailable()} />
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 sm:pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Frequently asked questions</h2>
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
          <p className="mt-6 text-center text-sm text-ink/55">
            More questions? Visit our{" "}
            <Link href="/help" className="font-semibold text-accent hover:underline">Help page</Link>.
          </p>
        </div>
      </section>

      {/* Final call to action */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-brand px-6 py-16 text-center text-white shadow-glow sm:py-20">
          <div aria-hidden className="absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-16 -z-10 h-72 w-72 rounded-full bg-night/30 blur-3xl" />
          <h2 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">Got something to say?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-white/90">
            The reply you’ve been overthinking. The conversation you’ve been avoiding. The email that’s testing your
            patience.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-white/90">Whatever it is, let’s find the words.</p>
          <p className="mt-6 text-2xl font-extrabold">Say it Nicelyy.</p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-accent-dark shadow-lg transition hover:-translate-y-0.5"
          >
            Try 3 messages free <IconArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-white/80">No judgement. No awkwardness. Just better words.</p>
        </div>
      </section>
    </main>
  );
}
