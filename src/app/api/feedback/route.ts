import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { isFeedbackReason } from "@/lib/feedback";
import { readJson } from "@/lib/input";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/feedback  Body: { rewriteId, rating: 1 | -1, reason? }
// Saves a thumbs up/down on one of the person's own rewrites.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const body = await readJson(request);
  const { rewriteId, rating, reason } = body;
  if (typeof rewriteId !== "string" || (rating !== 1 && rating !== -1)) {
    return NextResponse.json({ error: "Something went wrong." }, { status: 400 });
  }
  const { error } = await createAdminClient()
    .from("rewrites")
    .update({ rating, rating_reason: rating === -1 && isFeedbackReason(reason) ? reason : null })
    .eq("id", rewriteId)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  return NextResponse.json({ saved: true });
}
