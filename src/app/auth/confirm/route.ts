import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { nextFromEmailLink } from "@/lib/next-path";

// Email links using a token hash. These work even when the email is opened on
// a different device from the one used to sign up.
// Supabase email templates link here, e.g.
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&redirect_to={{ .RedirectTo }}
// redirect_to carries the page they were heading to (e.g. checkout for the
// plan they picked); without it they land in the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = nextFromEmailLink(request.url);
  if (tokenHash && type) {
    const { error } = await createClient().auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
