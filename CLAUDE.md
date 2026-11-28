# Project: Nicelyy

Helps people say difficult things well: they type, paste or voice-note what they want to say, and AI rewrites it in a chosen tone, ready to send.

## How to work on this project
- **Completely separate from Hatch** (nictonic21/paid-social-studio-v2). Never share code, accounts, keys, databases, Stripe or Vercel projects with it.
- Built to be sold on subscription and, later, to an investor. Do things properly: no shortcuts, verify before saying something is done.
- The owner isn't a developer. Explain steps simply, one small step at a time.
- Logo: designed in-house at the owner's request (speech bubble + sparkle mark, "nicelyy" wordmark with gradient final "y"). Source: `src/components/Logo.tsx` and `public/brand/`. Don't redraw or alter it without the owner asking.

## Key facts
- Live site: https://www.nicelyy.co.uk (main; nicelyy.co.uk redirects to it). Domain bought at Namecheap, DNS: A @ → Vercel, CNAME www → Vercel. Hosted on Vercel project "nicelyy" (deploys from `main`). Supabase project ref `bfxtucuwzbzbgwzxtnjy`. Stripe test mode uses the "Nicelyy sandbox" account; live will use the real "Nicelyy" account.
- Plans and limits: `src/lib/plans.ts` (the single source of truth). Free 3 total; Starter £7/10; Plus £15/30; Unlimited £20 (fair use 500/month). Yearly = 10x monthly, allowance still tops up monthly (`allowanceStart`). Each message returns 3 versions and includes 3 free tweaks (max 200 tweaks/month).
- Free try on the home page: `/api/try`, one per hashed IP per day, global daily cap, optional Turnstile.
- On-device only (never server): history, remembered choices (`src/lib/device.ts`).
- Optional integrations switch on by env var: yearly Stripe prices, Google/Apple sign-in, Resend emails, Turnstile, Sentry (all content collection disabled in `sentry.shared.ts`). See `.env.example`.
- AI: `src/lib/rewrite.ts`, Claude via the Anthropic SDK, structured JSON output, server-side refusal fallback.
- Usage is claimed atomically by the `claim_rewrite` Postgres function (`supabase/schema.sql`), and refunded if the AI step fails.
- Message content is never stored (a privacy promise in `/privacy`). Don't add logging of user text.
- Plans change only through the Stripe webhook (`src/app/api/stripe/webhook`).
- Stripe setup is code: `scripts/stripe-setup.mjs` (idempotent, lookup keys `nicelyy_<tier>_<monthly|yearly>`, VAT-inclusive GBP prices, portal config tagged `metadata.nicelyy=portal`, webhook). Run once per mode (test, then live). Never print the webhook signing secret. Nicelyy uses Stripe Billing only; Connect isn't needed.
- In cloud sessions the Stripe key is injected by the session proxy for api.stripe.com: run the CLI/script with a placeholder key (`sk_test_proxyinjected`), and for Node add `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`.
- Owner dashboard `/admin` (emails in `ADMIN_EMAILS`), numbers from `admin_stats()` + Stripe `getRevenue()`. Setup check at `/admin/setup` (`src/lib/health.ts`): tests every integration, never returns secret values. Point the owner there first when something isn't working.
- Help page `/help` with contact form (`/api/contact`, Resend, rate-limited by `hit_rate_limit`).
- Meta Pixel: `NEXT_PUBLIC_META_PIXEL_ID`; loads only after cookie consent (`src/lib/consent.ts`, `CookieBanner`, `MetaPixel` with autoConfig off). Events via `metaTrack()` in `src/lib/analytics.ts`: Lead, CompleteRegistration, InitiateCheckout, Subscribe (`PurchaseTracker` reads `?plan=&interval=` from Stripe's success URL). Never send user text to Meta. Consent tests in `tests/e2e/consent.spec.ts` (CI builds with a dummy pixel ID).
- Thumbs up/down stored as `rating` + fixed `rating_reason` on `rewrites`, never text.
- Tests: `npm test` (unit + DB, DB needs `DATABASE_URL`), `npm run test:e2e` (Playwright, mocked APIs). CI in `.github/workflows/ci.yml`. Keep them green; add tests with new features.
- The go-live steps are in README.md.
