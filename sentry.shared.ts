import type { ErrorEvent, init } from "@sentry/nextjs";

// Nicelyy promises never to keep what people write. Error reports must not
// carry it either, so every kind of content collection is switched off here,
// including request/response bodies and AI prompts and replies, and anything
// that slips through is stripped in beforeSend.
export const sentryOptions: Parameters<typeof init>[0] = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
  },
  beforeSend(event: ErrorEvent): ErrorEvent {
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      delete event.request.headers;
      delete event.request.query_string;
    }
    delete event.user;
    return event;
  },
};
