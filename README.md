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
5. Go to **Developers → API keys**. Copy the **Secret key** → `STRIPE_SECRET_KEY`.
6. Go to **Settings → Billing → Customer portal**:
   - Turn on **Customers can update subscriptions**, and add all three Nicelyy products, so people can switch plans.
   - Turn on **Cancel subscriptions**.
   - Click **Save**.
7. You'll set up the webhook in Step 6, once the site has an address.

### Step 4: Vercel (hosting)

1. Go to **vercel.com** and click **Add New → Project**.
2. Import the **nicely** GitHub repository (the code repository keeps its original name, which is fine).
3. Leave the settings as they are (Framework: Next.js). **Don't** deploy yet. Go to Step 5 first.

### Step 5: Add the keys to Vercel

1. In the import screen (or later in **Settings → Environment Variables**), add every line from `.env.example` with the value from your note.
2. For `NEXT_PUBLIC_BASE_URL`, use your Vercel address for now (for example `https://nicely-xyz.vercel.app`). Change it to your own domain later.
3. Fill in `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_LEGAL_NAME` (your name, or company name and number). These appear on the Terms and Privacy pages.
4. Click **Deploy**.

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

1. Open your site and sign up with your own email. Confirm it from the email.
2. Write a message, pick a tone and press **Say it nicelyy**. Check the rewrite is good.
3. Try **Voice note** on your phone.
4. Use all 3 free messages. You should see "You've used your free messages".
5. Pick a plan and pay with Stripe's test card: `4242 4242 4242 4242`, any future date, any CVC.
6. Back on the site, your account page should show the new plan.
7. Click **Manage billing**, switch plan, then cancel. Check the account page updates each time.

### Step 9: Go live

1. In Stripe, switch to **Live mode**. Create the three products again, and set up the webhook and customer portal again. Live mode has its own settings.
2. In Vercel, replace the Stripe keys, the three price IDs and the webhook secret with the **live** ones, then redeploy.
3. Buy a domain and add it under Vercel **Settings → Domains**. Then update `NEXT_PUBLIC_BASE_URL`, the Supabase Site URL, and the Stripe webhook address.

---

## Before you launch: checklist

- [ ] Ask a solicitor to review `/terms` and `/privacy`. They're solid drafts, not legal advice.
- [ ] Register with the ICO (data protection fee, about £40–£60 a year): ico.org.uk
- [ ] Set a monthly spend limit in the Anthropic console.

## Running costs (rough)

Each rewrite costs about **1–2p** in AI. Even a heavy Unlimited user who hits the 500 fair-use cap costs well under the £20 they pay. Stripe takes about 1.5% + 20p per UK card payment.
