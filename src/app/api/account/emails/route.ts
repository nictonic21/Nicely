import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { readJson } from "@/lib/input";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/account/emails  Body: { reminders: boolean }
// Turns tips and reminder emails on or off. Account emails (password
// resets, receipts) always still send.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const body = await readJson(request);
  if (typeof body.reminders !== "boolean") {
    return NextResponse.json({ error: "Something went wrong." }, { status: 400 });
  }
  const { error } = await createAdminClient()
    .from("users")
    .update({ email_opt_out: !body.reminders })
    .eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  return NextResponse.json({ reminders: body.reminders });
}
