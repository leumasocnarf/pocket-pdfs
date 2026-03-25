import axios from "axios";
import * as Sentry from "@sentry/react";

export function captureApiError(err: unknown, extra?: Record<string, unknown>) {
  if (axios.isAxiosError(err)) {
    if (err.response?.status && err.response.status >= 500) {
      Sentry.captureException(err, { extra });
    }
  } else {
    Sentry.captureException(err, { extra });
  }
}
