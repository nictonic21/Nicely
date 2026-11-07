# Nicelyy

**Say difficult things the easy way.** Type, paste or voice-note what you want to say, and Nicelyy rewrites it into a clear, calm message that's ready to send, in the tone you pick (Professional, Kind, Firm, Strong comeback, Clear & simple).

| Plan | Price | Messages |
|---|---|---|
| Free | £0 | 3 in total, no card |
| Starter | £7/month | 10 a month |
| Plus | £15/month | 30 a month |
| Unlimited | £20/month | Unlimited (fair use: 500 a month) |

Plan rules live in one file: `src/lib/plans.ts`.

**Built with:** Next.js 14 (website), Supabase (accounts and database), Stripe (subscriptions), Anthropic Claude (the AI rewriter), Vercel (hosting).

**Privacy:** what people write is never stored. Only a count of rewrites is kept.

---

## Go-live guide (step by step)

Nicelyy is **completely separate from Hatch**. Every account below must be a **new** one for Nicelyy. Never reuse Hatch's.

Do the steps in order. Keep a note open: you'll copy several keys into it, and paste them into Vercel in Step 5.

### Step 1: Supabase (accounts and database)

1. Go to **supabase.com** and log in.
2. Click **New project**. Name it `nicelyy`. Pick region **London (eu-west-2)**. Choose a strong database password and save it somewhere safe.
3. Wait for the project to finish setting up (about 2 minutes).
4. In the left menu, click **SQL Editor**, then **New query**.
5. Open the file `supabase/schema.sql` from this repository. Copy **all** of it, paste it in, and click **Run**. You should see "Success".
6. In the left menu, go to **Project Settings → API**. Copy these three into your note:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this one secret)

### Step 2: Anthropic (the AI)

1. Go to **console.anthropic.com** and sign up or log in.
2. Add a payment method under **Billing**, and add some credit (£20 is plenty to start).
3. Go to **API Keys → Create key**. Name it `nicelyy`.
4. Copy the key into your note as `ANTHROPIC_API_KEY`.
5. Optional but wise: under **Limits**, set a monthly spend limit.

### Step 3: Stripe (payments)

1. Go to **stripe.com** and create a **new account** for Nicelyy. If you already have Stripe for Hatch, use the account menu at the top left → **New account**.
2. Stay in **Test mode** (toggle at the top) until you've tested everything.
3. Go to **Product catalogue → Add product** and create three products, each with a **Recurring, Monthly** price in **GBP**:
   - `Nicelyy Starter`: £7.00
   - `Nicelyy Plus`: £15.00
   - `Nicelyy Unlimited`: £20.00
4. Open each product, click its price, and copy the **Price ID** (it starts with `price_`) into your note:
   - `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PLUS`, `STRIPE_PRICE_UNLIMITED`
5. **Yearly plans (recommended):** open each product again, click **Add another price**, and add a **Recurring, Yearly** price in GBP. These are 12 months for the price of 10:
   - Starter: £70.00 · Plus: £150.00 · Unlimited: £200.00
   - Copy each yearly Price ID into your note as `STRIPE_PRICE_STARTER_YEARLY`, `STRIPE_PRICE_PLUS_YEARLY` and `STRIPE_PRICE_UNLIMITED_YEARLY`.
   - The Monthly/Yearly switch appears on the site once all three are added.
6. Go to **Developers → API keys**. Copy the **Secret key** → `STRIPE_SECRET_KEY`.
7. Go to **Settings → Billing → Customer portal**:
   - Turn on **Customers can update subscriptions**, and add all three Nicelyy products (with both their monthly and yearly prices), so people can switch plans.
   - Turn on **Cancel subscriptions**.
   - Click **Save**.
8. You'll set up the webhook in Step 6, once the site has an address.

### Step 4: Vercel (hosting)

1. Go to **vercel.com** and click **Add New → Project**.
2. Import the **nicely** GitHub repository (the code repository keeps its original name, which is fine).
3. Leave the settings as they are (Framework: Next.js). **Don't** deploy yet. Go to Step 5 first.

### Step 5: Add the keys to Vercel

1. In the import screen (or later in **Settings → Environment Variables**), add every line from `.env.example` with the value from your note.
2. For `NICELYY_SECRET`, make a long random password (64 characters, letters and numbers, for example from 1password.com/password-generator). Never share it.
3. For `NEXT_PUBLIC_BASE_URL`, use your Vercel address for now (for example `https://nicely-xyz.vercel.app`). Change it to your own domain later.
4. Fill in `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_LEGAL_NAME` (your name, or company name and number). These appear on the Terms and Privacy pages.
5. Leave the lines marked OPTIONAL empty for now. You can switch those features on later (see "Optional extras" below).
6. Click **Deploy**.

### Step 6: Connect Stripe to the site (webhook)

1. In Stripe, go to **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-SITE/api/stripe/webhook`
3. Choose these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Save, then copy the **Signing secret** (it starts with `whsec_`).
5. In Vercel, add it as `STRIPE_WEBHOOK_SECRET`, then go to **Deployments → ⋯ → Redeploy**.

### Step 7: Supabase login emails

1. In Supabase, go to **Authentication → URL Configuration**:
   - **Site URL**: your site address.
   - **Redirect URLs**: add `https://YOUR-SITE/**`
2. Go to **Authentication → Emails**. In the **Confirm signup** template, change the link to:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app`
   This makes confirmation links work even if someone opens the email on a different device.
3. Before launch, set up your own email sender under **Authentication → SMTP** (for example Resend). Supabase's built-in email only sends a few emails an hour.

### Step 8: Test everything (still in Stripe test mode)

1. On the home page, use the **Try it right now** box once without an account. Check you get 3 versions. Try again: it should ask you to sign up.
2. Sign up with your own email. Confirm it from the email.
3. Write a message, pick a tone and press **Say it nicelyy**. Check all 3 versions are good.
4. Press a quick tweak (Shorter, Softer...) and check the message changes.
5. Try **Send via WhatsApp** and **Email** on your phone, and **Voice note**.
6. Open **History** and check your messages are there. Press **Use again**.
7. On your phone, add Nicelyy to your home screen and open it from there.
8. Use all 3 free messages. You should see "You've used your free messages".
9. Pick a plan and pay with Stripe's test card: `4242 4242 4242 4242`, any future date, any CVC.
10. Back on the site, your account page should show the new plan.
11. Click **Manage billing**, switch plan (try monthly to yearly too), then cancel. Check the account page updates each time.

### Step 9: Go live

1. In Stripe, switch to **Live mode**. Create the three products again (with their yearly prices), and set up the webhook and customer portal again. Live mode has its own settings.
2. In Vercel, replace the Stripe keys, the three price IDs and the webhook secret with the **live** ones, then redeploy.
3. Buy a domain and add it under Vercel **Settings → Domains**. Then update `NEXT_PUBLIC_BASE_URL`, the Supabase Site URL, and the Stripe webhook address.

---

## Optional extras (switch on any time)

Each of these switches itself on as soon as its keys are added in Vercel (then redeploy). Until then, the site works without them.

### Visitor and sign-up numbers (Vercel Analytics)
1. In Vercel, open the project and click the **Analytics** tab, then **Enable**.
2. That's it. You'll see visitors, and how many try it, sign up, start checkout and copy messages. No cookies, no personal data.

### Welcome and reminder emails (Resend)
1. Sign up at **resend.com**. Go to **Domains → Add domain**, add your domain, and follow the steps to add the DNS records where you bought the domain. Wait until it shows **Verified**.
2. Go to **API Keys → Create API key**. Add it in Vercel as `RESEND_API_KEY`.
3. Add `EMAIL_FROM` in Vercel, for example `Nicelyy <hello@yourdomain.com>`.
4. Also use Resend for login emails: in Supabase, go to **Authentication → SMTP Settings**, turn on custom SMTP and enter: host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key, sender = the same address as `EMAIL_FROM`.

### "Are you human" check for the free try (Cloudflare Turnstile)
1. Sign up at **cloudflare.com** (free). Go to **Turnstile → Add widget**.
2. Name it `nicelyy`, add your domain (and your `.vercel.app` address), choose **Managed**.
3. Add the **Site key** as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the **Secret key** as `TURNSTILE_SECRET_KEY` in Vercel.

### Continue with Google
1. In **Google Cloud Console** (console.cloud.google.com), create a project, then **APIs & Services → OAuth consent screen** (External, add your app name, logo and email).
2. **Credentials → Create credentials → OAuth client ID → Web application**. Under **Authorised redirect URIs**, paste the callback URL shown in Supabase under **Authentication → Providers → Google**.
3. Copy the Client ID and Client secret into Supabase's Google provider page and turn it on.
4. In Vercel, set `NEXT_PUBLIC_AUTH_PROVIDERS` to `google` (or `google,apple` once Apple is on too).

### Continue with Apple
This needs a paid Apple Developer account (£79/year). Follow Supabase's guide under **Authentication → Providers → Apple**, then add `apple` to `NEXT_PUBLIC_AUTH_PROVIDERS`.

### Error alerts (Sentry)
1. Sign up at **sentry.io** (free plan). Create a project and choose **Next.js**.
2. Copy the **DSN** into Vercel as `NEXT_PUBLIC_SENTRY_DSN`. You'll get an email when something breaks.
3. Optional, for clearer error details: create an auth token in Sentry and add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT`.
4. Nicelyy is set up so error reports never include what people write.

---

## Before you launch: checklist

- [ ] Ask a solicitor to review `/terms` and `/privacy`. They're solid drafts, not legal advice.
- [ ] Register with the ICO (data protection fee, about £40–£60 a year): ico.org.uk
- [ ] Set a monthly spend limit in the Anthropic console.

## Running costs (rough)

Each message (3 versions) costs about **2p** in AI, and each quick tweak about the same. Free tweaks are capped at 3 per message and 200 a month, so even an Unlimited user who hits every limit costs around £12–13, under the £20 they pay. Most people use a tiny fraction of that.

The free try on the home page is capped at one per visitor per day and `TRIAL_DAILY_CAP` (default 300) a day in total, so it costs at most about £6 a day.

Stripe takes about 1.5% + 20p per UK card payment.
