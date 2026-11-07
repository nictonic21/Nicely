import type { Metadata } from "next";
import Legal from "@/components/Legal";
import { FAIR_USE_CAP, PLANS } from "@/lib/plans";
import { CONTACT_EMAIL, LEGAL_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <Legal title="Terms of use" updated="7 November 2026">
      <p>
        These terms cover your use of Nicely, run by {LEGAL_NAME} (&ldquo;we&rdquo;). By creating an
        account you agree to them.
      </p>

      <h2>What Nicely does</h2>
      <p>
        Nicely uses artificial intelligence to suggest a rewritten version of a message you give it.
        Suggestions can be wrong or not suit your situation. You decide whether to send them, and you
        are responsible for what you send. Nicely is not legal, employment, medical or financial advice.
      </p>

      <h2>Plans and payment</h2>
      <ul>
        <li>Free accounts include {PLANS.free.limit} messages in total.</li>
        <li>
          Starter (£{PLANS.starter.pricePounds}/month) includes {PLANS.starter.limit} messages a month,
          Plus (£{PLANS.plus.pricePounds}/month) includes {PLANS.plus.limit}, and Unlimited
          (£{PLANS.unlimited.pricePounds}/month) has no set monthly number, subject to fair use below.
        </li>
        <li>A message is one rewrite you receive. Rewrites that fail on our side are not counted.</li>
        <li>Unused messages don't roll over to the next month.</li>
        <li>
          Plans renew monthly until you cancel. Payments are handled by Stripe. You can cancel any time
          from your account page, and keep your plan until the end of the month you've paid for.
        </li>
        <li>
          If you change your mind, you can cancel within 14 days of first subscribing. If you haven't
          used any paid messages, contact us and we'll refund you in full.
        </li>
      </ul>

      <h2>Fair use on Unlimited</h2>
      <p>
        Unlimited is for one person's own use. To keep the service fast and fair for everyone, it
        includes up to {FAIR_USE_CAP} messages a month. That's far more than people normally need. If
        you reach it, your messages top up when your plan renews.
      </p>

      <h2>Using Nicely properly</h2>
      <p>Don't use Nicely to harass, threaten, deceive or harm anyone, or to break the law. Don't try to
        get around usage limits, or share your account. We may suspend accounts that do.</p>

      <h2>Our responsibility</h2>
      <p>
        We work hard to keep Nicely available and useful, but can't promise it will always be. Nothing in
        these terms limits rights you have by law as a consumer. We're not responsible for how a message
        you choose to send is received.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms and will tell you about important changes by email. These terms are
        governed by the law of England and Wales.
        {CONTACT_EMAIL ? <> Questions? Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</> : null}
      </p>
    </Legal>
  );
}
