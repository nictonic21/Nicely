import { createClient } from "@supabase/supabase-js";

// Service role client. Bypasses row level security.
// SERVER ONLY: never import this into a browser component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
