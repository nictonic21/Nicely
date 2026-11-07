# Project: Nicely

Helps people say difficult things well: they type, paste or voice-note what they want to say, and AI rewrites it in a chosen tone, ready to send.

## How to work on this project
- **Completely separate from Hatch** (nictonic21/paid-social-studio-v2). Never share code, accounts, keys, databases, Stripe or Vercel projects with it.
- Built to be sold on subscription and, later, to an investor. Do things properly: no shortcuts, verify before saying something is done.
- The owner isn't a developer. Explain steps simply, one small step at a time.
- Brand assets (logo, favicon) must be the owner's own artwork. Don't invent them; ask.

## Key facts
- Plans and limits: `src/lib/plans.ts` (the single source of truth). Free 3 total; Starter £7/10; Plus £15/30; Unlimited £20 (fair use 500/month).
- AI: `src/lib/rewrite.ts`, Claude via the Anthropic SDK, structured JSON output, server-side refusal fallback.
- Usage is claimed atomically by the `claim_rewrite` Postgres function (`supabase/schema.sql`), and refunded if the AI step fails.
- Message content is never stored (a privacy promise in `/privacy`). Don't add logging of user text.
- Plans change only through the Stripe webhook (`src/app/api/stripe/webhook`).
- The go-live steps are in README.md.
