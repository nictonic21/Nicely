import { NextResponse } from "next/server";
import { getRequestUser, getUserRow } from "@/lib/auth";
import { entitlementFor } from "@/lib/plans";
import { contactConfigured, sendContactMessage } from "@/lib/emails";
import { readJson } from "@/lib/input";
import { CONTACT_TOPICS } from "@/lib/help";
import { clientIp, humanCheck } from "@/lib/request";
import { sign } from "@/lib/secret";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/contact  Body: { name?, email, topic, message, website, turnstileToken }
// Emails a help request to your support inbox. Nothing is saved in the
// database. Protected against spam by a hidden "website" field that only
// bots fill in, the human check, and a limit of 3 messages an hour per visitor.
export const runtime = "nodejs";

const TOPICS = CONTACT_TOPICS;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!contactConfigured()) {
    return NextResponse.json({ error: "Please email us instead." }, { status: 503 });
  }
  const body = await readJson(request);
  const user = await getRequestUser();

  // Bots fill in the hidden field: pretend it worked.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ sent: true });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const email = (user?.email ?? (typeof body.email === "string" ? body.email.trim() : "")).slice(0, 200);
  const topic = typeof body.topic === "string" && TOPICS.includes(body.topic) ? body.topic : "Something else";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter your email so we can reply." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Please tell us a little more." }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Please keep it under 5,000 characters." }, { status: 400 });
  }

  const ip = clientIp(request);
  if (!(await humanCheck(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Please complete the quick check, then try again.", retryCheck: true }, { status: 403 });
  }

  try {
    const { data: allowed } = await createAdminClient().rpc("hit_rate_limit", {
      p_key: sign(`contact:${ip}`),
      p_window_seconds: 3600,
      p_max: 3,
    });
    if (allowed === false) {
      return NextResponse.json(
        { error: "You've sent a few messages already. We'll reply soon, or email us directly." },
        { status: 429 }
      );
    }
  } catch {
    // If the limiter can't run (e.g. secret not set), still let the message through.
  }

  let account: { id: string; plan: string } | null = null;
  if (user) {
    try {
      account = { id: user.id, plan: entitlementFor(await getUserRow(user.id, user.email ?? null)).plan.name };
    } catch {}
  }

  const ok = await sendContactMessage({ from: email, name, topic, message, account });
  if (!ok) {
    return NextResponse.json({ error: "We couldn't send that just now. Please email us directly." }, { status: 502 });
  }
  return NextResponse.json({ sent: true });
}
