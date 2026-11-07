import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry.shared";

// Error alerts (server). Off until NEXT_PUBLIC_SENTRY_DSN is set.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) Sentry.init(sentryOptions);
