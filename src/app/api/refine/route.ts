import { NextResponse } from "next/server";
import { getRequestUser, getUserRow } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DECLINED_MESSAGE, FAILED_MESSAGE, parseRewriteBody, readJson } from "@/lib/input";
import { inputHash, isTweak, rewriteMessage, RewriteDeclined } from "@/lib/rewrite";
import { MAX_CHARS } from "@/lib/options";
import { entitlementFor, FREE_TWEAKS, MONTHLY_TWEAK_CAP } from "@/lib/plans";

// POST /api/refine
// Body: { rewriteId, current, tweak, text, received?, tone, recipient, format }
// A one-tap tweak ("Shorter", "Softer"...) of a message the person already
// has. Each rewrite comes with a few free tweaks; they don't use a message.
export const runtime = "nodejs";
export const maxDuration = 60;


export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const body = await readJson(request);
  const input = parseRewriteBody(body);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

  const { rewriteId, current, tweak } = body;
  if (
    typeof rewriteId !== "string" ||
    typeof current !== "string" ||
    !current.trim() ||
    current.length > MAX_CHARS ||
    !isTweak(tweak)
  ) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const admin = createAdminClient();
  const hash = await inputHash(input);
  let since: Date;
  try {
    since = entitlementFor(await getUserRow(user.id, user.email ?? null)).since;
  } catch {
    return NextResponse.json({ error: "Could not load your account. Please try again." }, { status: 500 });
  }
  const { data: outcome, error } = await admin.rpc("use_refine", {
    p_user: user.id,
    p_id: rewriteId,
    p_input_hash: hash,
    p_max: FREE_TWEAKS,
    p_since: since.toISOString(),
    p_month_cap: MONTHLY_TWEAK_CAP,
  });
  if (error) {
    console.error("use_refine failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (outcome !== "ok") {
    return NextResponse.json(
      {
        error: "tweaks_used",
        message:
          outcome === "month_cap"
            ? "You've used this month's free tweaks. Press Try again for a fresh set (uses 1 message)."
            : "You've used the free tweaks for this message. Press Try again for a fresh set (uses 1 message).",
      },
      { status: 409 }
    );
  }

  // How many are left now, to show on the buttons.
  const { data: rw } = await admin.from("rewrites").select("refines").eq("id", rewriteId).maybeSingle();
  const tweaksLeft = Math.max(0, FREE_TWEAKS - (rw?.refines ?? FREE_TWEAKS));

  try {
    const result = await rewriteMessage({ ...input, current, tweak });
    return NextResponse.json({ ...result, rewriteId, tweaksLeft });
  } catch (err) {
    // Give the tweak back.
    await admin.rpc("give_back_refine", { p_id: rewriteId }).then(
      () => {},
      () => {}
    );
    if (err instanceof RewriteDeclined) {
      return NextResponse.json({ error: DECLINED_MESSAGE }, { status: 422 });
    }
    console.error("refine failed:", err);
    return NextResponse.json({ error: FAILED_MESSAGE }, { status: 502 });
  }
}
