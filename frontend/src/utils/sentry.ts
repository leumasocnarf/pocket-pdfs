import * as Sentry from "@sentry/react";
import { ApiError } from "../api/api";

export function captureApiError(err: unknown, extra?: Record<string, unknown>) {
  if (err instanceof ApiError) {
    if (err.status >= 500) {
      Sentry.captureException(err, { extra });
    }
  } else {
    Sentry.captureException(err, { extra });
  }
}
