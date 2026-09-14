const errors = {
  configuration: [503, 'Flight search is temporarily unavailable. Please try again later.'],
  authentication: [503, 'Flight search is temporarily unavailable. Please try again later.'],
  rate_limit: [429, 'Too many searches. Please wait a moment and try again.'],
  invalid_search: [
    422,
    'The airline could not search these details. Check your airports, dates, and travelers.',
  ],
  timeout: [504, 'The search took too long. Please try again.'],
  upstream: [502, 'We could not reach the airlines. Please try again.'],
  malformed: [502, 'The flight service returned an unexpected response. Please try again.'],
};

export class FlightServiceError extends Error {
  constructor(category = 'upstream', fields = []) {
    const [status, message] = errors[category] || errors.upstream;
    super(message);
    this.category = category;
    this.status = status;
    this.fields = fields;
  }
}

export function responseError(status) {
  return new FlightServiceError(
    status === 429
      ? 'rate_limit'
      : [401, 403].includes(status)
        ? 'authentication'
        : [400, 422].includes(status)
          ? 'invalid_search'
          : 'upstream',
  );
}

export function safeError(error) {
  if (error instanceof FlightServiceError) return error;

  return new FlightServiceError(
    ['AbortError', 'TimeoutError'].includes(error?.name) ? 'timeout' : 'upstream',
  );
}

export function serviceErrorResponse(error) {
  const safe = safeError(error);

  return Response.json(
    { message: safe.message },
    {
      status: safe.status,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

// A caller may stop waiting without cancelling a token refresh shared by other searches.
export function abortable(promise, signal) {
  if (!signal) return promise;

  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
