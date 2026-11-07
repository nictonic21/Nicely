import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRow } from "@/lib/plans";

// The signed-in user for this request, or null.
export async function getRequestUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const { data } = await createClient().auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export interface FullUserRow extends UserRow {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  email_opt_out: boolean;
}

// Read the person's row, creating it if the sign-up trigger ever missed it.
export async function getUserRow(id: string, email: string | null): Promise<FullUserRow> {
  const admin = createAdminClient();
  const cols =
    "id, email, plan, payment_status, period_start, stripe_customer_id, stripe_subscription_id, email_opt_out";
  const { data } = await admin.from("users").select(cols).eq("id", id).maybeSingle();
  if (data) return data as FullUserRow;
  await admin
    .from("users")
    .upsert({ id, email }, { onConflict: "id", ignoreDuplicates: true });
  const { data: created, error } = await admin
    .from("users")
    .select(cols)
    .eq("id", id)
    .single();
  if (error || !created) throw new Error("Could not load your account.");
  return created as FullUserRow;
}

// How many rewrites the person has used since a given moment.
export async function countRewritesSince(userId: string, since: Date): Promise<number> {
  const { count } = await createAdminClient()
    .from("rewrites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
  return count ?? 0;
}

// Only same-site paths, so ?next=//evil.com cannot bounce people away.
export function safeNext(raw: string | null, fallback = "/app"): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
