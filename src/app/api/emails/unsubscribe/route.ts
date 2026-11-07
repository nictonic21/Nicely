import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verify } from "@/lib/secret";

// One-click unsubscribe from reminder emails. The link is signed, so it only
// works for the person it was sent to. GET is for clicks; POST is what email
// apps send for their built-in "Unsubscribe" button.
export const runtime = "nodejs";

async function unsubscribe(request: Request) {
  const url = new URL(request.url);
  const u = url.searchParams.get("u") ?? "";
  const s = url.searchParams.get("s") ?? "";
  if (!u || !s || !verify(`unsub:${u}`, s)) return false;
  const { error } = await createAdminClient().from("users").update({ email_opt_out: true }).eq("id", u);
  return !error;
}

export async function GET(request: Request) {
  const ok = await unsubscribe(request);
  const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/unsubscribed${ok ? "" : "?error=1"}`);
}

export async function POST(request: Request) {
  const ok = await unsubscribe(request);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
