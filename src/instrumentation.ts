import * as Sentry from "@sentry/nextjs";

// Starts error alerts on the server. Does nothing until the Sentry key is set.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("../sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("../sentry.edge.config");
}

export const onRequestError = Sentry.captureRequestError;
