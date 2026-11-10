import type { Metadata } from "next";
import Legal from "@/components/Legal";
import { CONTACT_EMAIL, LEGAL_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <Legal title="Privacy policy" updated="7 November 2026">
      <p>
        {LEGAL_NAME} runs Nicelyy and is responsible for your personal data under UK data protection
        law. In short: <strong>we don't keep what you write.</strong>
      </p>

      <h2>Your messages</h2>
      <p>
        What you type, paste or say is sent securely to our AI provider, Anthropic, only to create your
        rewrite. We don't store your messages or rewrites in our database. We only record that a rewrite
        happened, with the tone and who it was for, so we can count it against your plan. Anthropic
        processes the text on our behalf and doesn't use it to train its models.
      </p>
      <p>
        Voice notes use your browser's built-in speech-to-text, run by your browser maker (such as Apple
        or Google). The words simply appear in the text box. Nicelyy never receives a recording.
      </p>

      <p>
        Your history is saved in your own browser, on your own device, so you can find past messages again. It
        never reaches our servers. You can turn it off or clear it any time from the History page.
      </p>

      <h2>What we do keep</h2>
      <ul>
        <li>Your email address and login details, to run your account (stored with Supabase).</li>
        <li>Your plan and billing status. Card details are held by Stripe, never by us.</li>
        <li>
          A count of your rewrites, with the date, tone and type of recipient, and a scrambled one-way
          fingerprint so quick tweaks only apply to the right message. The fingerprint can&apos;t be turned back
          into your words.
        </li>
        <li>
          If you use the free try without an account: a scrambled one-way version of your IP address, kept for 7
          days, so each visitor gets one free try a day.
        </li>
        <li>
          If you rate a rewrite: the thumbs up or down, and a reason you pick from a list (like &ldquo;Too
          long&rdquo;). Never the words.
        </li>
        <li>Whether you&apos;ve turned off tips and reminder emails.</li>
      </ul>
      <p>
        We use this to provide the service you've signed up for (contract) and to keep it secure and
        fair (legitimate interests). We don't sell your data or use advertising trackers.
      </p>

      <h2>Who helps us run Nicelyy</h2>
      <p>These companies process data for us, only to provide the service:</p>
      <ul>
        <li>Anthropic: writes the rewrites.</li>
        <li>Supabase: accounts and database.</li>
        <li>Stripe: payments.</li>
        <li>Vercel: hosting, and anonymous visit counts with no cookies.</li>
        <li>Resend: sends our emails.</li>
        <li>Cloudflare Turnstile: checks free-try visitors are human, not bots.</li>
        <li>Sentry: tells us when something breaks. Error reports never include what you write.</li>
        <li>Google or Apple: only if you choose to sign in with them.</li>
      </ul>
      <p>Some are based outside the UK. Where they are, your data is protected by approved safeguards, such as the UK International Data Transfer Addendum.</p>

      <h2>If you contact us</h2>
      <p>
        Messages you send through our Help page go to our support inbox (sent by Resend), so we can reply. We keep
        them only as long as we need to help you.
      </p>

      <h2>Emails</h2>
      <p>
        We send emails you need (confirming your account, password resets, receipts). We also send a few helpful
        ones, like a welcome and a heads-up when you&apos;re nearly out of messages. You can turn those off from
        your account page or with the link in any of them.
      </p>

      <h2>How long</h2>
      <p>
        We keep your account data until you delete your account. You can do that any time from your
        account page, and it's removed straight away. Stripe keeps payment records as the law requires.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask for a copy of your data, ask us to correct or delete it, or object to how we use it.
        You can also complain to the Information Commissioner's Office (ico.org.uk).
        {CONTACT_EMAIL ? <> To contact us, email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</> : null}
      </p>

      <h2>Cookies</h2>
      <p>
        We only use the cookies needed to keep you logged in, plus one from Cloudflare that checks free-try
        visitors aren&apos;t bots. No advertising or tracking cookies. Our visit counts don&apos;t use cookies.
      </p>
    </Legal>
  );
}
