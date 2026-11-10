import type { Metadata } from "next";
import Legal from "@/components/Legal";
import { FAIR_USE_CAP, PLANS } from "@/lib/plans";
import { CONTACT_EMAIL, LEGAL_NAME } from "@/lib/site";
import { yearlyAvailable } from "@/lib/stripe";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <Legal title="Terms of use" updated="10 November 2026">
      <p>
        These terms cover your use of Nicelyy, run by {LEGAL_NAME} (&ldquo;we&rdquo;). By creating an
        account you agree to them.
      </p>

      <h2>Who can use Nicelyy</h2>
      <p>
        You must be 18 or over to create an account or buy a plan. Accounts are for one person&apos;s own use.
      </p>

      <h2>What Nicelyy does</h2>
      <p>
        Nicelyy uses artificial intelligence to suggest a rewritten version of a message you give it.
        Suggestions can be wrong or not suit your situation. You decide whether to send them, and you
        are responsible for what you send. Nicelyy is not legal, employment, medical or financial advice.
      </p>

      <h2>Plans and payment</h2>
      <ul>
        <li>Free accounts include {PLANS.free.limit} messages in total.</li>
        <li>
          Starter (£{PLANS.starter.pricePounds}/month) includes {PLANS.starter.limit} messages a month,
          Plus (£{PLANS.plus.pricePounds}/month) includes {PLANS.plus.limit}, and Unlimited
          (£{PLANS.unlimited.pricePounds}/month) has no set monthly number, subject to fair use below.
        </li>
        <li>
          A message is one press of &ldquo;Say it nicelyy&rdquo; or &ldquo;Try again&rdquo;, which gives you
          three versions to choose from. Each message comes with 3 free quick tweaks (up to 200 a month), which
          don&apos;t use a message. Anything that fails on our side is not counted.
        </li>
        {yearlyAvailable() ? (
        <li>
          Yearly plans cost the same as 10 months, are paid upfront, and include the same number of messages each
          month as the monthly plan.
        </li>
        ) : null}
        <li>The free try on the home page is limited to one per person per day.</li>
        <li>Unused messages don't roll over to the next month.</li>
        <li>
          Plans renew monthly until you cancel. Payments are handled by Stripe. You can cancel any time
          from your account page, and keep your plan until the end of the month you've paid for.
        </li>
        <li>
          If you change your mind, you can cancel within 14 days of first subscribing . If you
          haven&apos;t used any paid messages, contact us and we&apos;ll refund you in full.
        </li>
      </ul>

      <h2>Fair use on Unlimited</h2>
      <p>
        Unlimited is for one person's own use. To keep the service fast and fair for everyone, it
        includes up to {FAIR_USE_CAP} messages a month. That's far more than people normally need. If
        you reach it, your messages top up when your plan renews.
      </p>

      <h2>Using Nicelyy properly</h2>
      <p>Don't use Nicelyy to harass, threaten, deceive or harm anyone, or to break the law. Don't try to
        get around usage limits, or share your account. We may suspend accounts that do.</p>

      <h2>Our responsibility</h2>
      <p>
        We work hard to keep Nicelyy available and useful, but can't promise it will always be. Nothing in
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
