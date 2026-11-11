import { createBrowserClient } from "@supabase/ssr";

// Whether accounts are switched on (the Supabase keys are set in Vercel).
export const AUTH_READY = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const AUTH_NOT_READY =
  "Accounts aren't open yet. We're launching very soon, so please check back shortly.";

// Browser Supabase client (log in, sign up, sign out). Throws a friendly
// message if accounts aren't switched on yet, instead of failing silently.
export function createClient() {
  if (!AUTH_READY) throw new Error(AUTH_NOT_READY);
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Never leave someone staring at a spinner: give up after 20 seconds with a
// message that helps (in-app browsers like Instagram's often block log in).
export function withTimeout<T>(promise: Promise<T>, ms = 20000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "That took too long. Please check your connection and try again. If you opened this from Instagram or another app, open it in Safari or Chrome instead."
            )
          ),
        ms
      )
    ),
  ]);
}

export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
