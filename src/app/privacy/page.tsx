import type { Metadata } from "next";
import Legal from "@/components/Legal";
import { CONTACT_EMAIL, LEGAL_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <Legal title="Privacy policy" updated="7 November 2026">
      <p>
        {LEGAL_NAME} runs Nicely and is responsible for your personal data under UK data protection
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
        or Google). The words simply appear in the text box. Nicely never receives a recording.
      </p>

      <h2>What we do keep</h2>
      <ul>
        <li>Your email address and login details, to run your account (stored with Supabase).</li>
        <li>Your plan and billing status. Card details are held by Stripe, never by us.</li>
        <li>A count of your rewrites, with the date, tone and type of recipient.</li>
      </ul>
      <p>
        We use this to provide the service you've signed up for (contract) and to keep it secure and
        fair (legitimate interests). We don't sell your data or use advertising trackers.
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
      <p>We only use the cookies needed to keep you logged in. No advertising or tracking cookies.</p>
    </Legal>
  );
}
