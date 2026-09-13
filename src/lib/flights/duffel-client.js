import { createOfferRequest } from './search.js';
import { normalizeOffer } from './offers.js';

export class FlightServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

export async function duffelRequest(path, { data, signal, token, fetcher = fetch } = {}) {
  if (!token?.startsWith('duffel_test_'))
    throw new FlightServiceError(
      'Flight search is temporarily unavailable. Please try again later.',
      503,
    );
  try {
    const response = await fetcher(`https://api.duffel.com${path}`, {
      method: data ? 'POST' : 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify({ data }) : undefined,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(30000)])
        : AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      if (response.status === 429)
        throw new FlightServiceError('Too many searches. Please wait a moment and try again.', 429);
      if ([401, 403].includes(response.status))
        throw new FlightServiceError(
          'Flight search is temporarily unavailable. Please try again later.',
          503,
        );
      if ([400, 422].includes(response.status))
        throw new FlightServiceError(
          'The airline could not search these details. Check your airports, dates, and travelers.',
          422,
        );
      throw new FlightServiceError('We could not reach the airlines. Please try again.', 502);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof FlightServiceError) throw error;
    if (error.name === 'TimeoutError' || error.name === 'AbortError')
      throw new FlightServiceError('The search took too long. Please try again.', 504);
    throw new FlightServiceError('We could not reach the airlines. Please try again.', 502);
  }
}

export async function searchFlights(values, signal, options = {}) {
  const { data } = await duffelRequest(
    '/air/offer_requests?return_offers=true&supplier_timeout=20000',
    { ...options, data: createOfferRequest(values), signal },
  );
  if (!data || data.live_mode !== false || !Array.isArray(data.offers))
    throw new FlightServiceError(
      'The flight service returned an unexpected response. Please try again.',
    );
  return { id: data.id, testMode: true, offers: data.offers.map(normalizeOffer).filter(Boolean) };
}

export async function searchAirports(query, signal, options = {}) {
  const { data } = await duffelRequest(`/places/suggestions?query=${encodeURIComponent(query)}`, {
    ...options,
    signal,
  });
  if (!Array.isArray(data))
    throw new FlightServiceError('Airport search is unavailable. Please try again.');
  const airports = data.flatMap((p) =>
    p.type === 'airport'
      ? [p]
      : (p.airports || []).map((a) => ({ ...a, city_name: a.city_name || p.name })),
  );
  const seen = new Set();
  return airports
    .filter((a) => {
      if (!/^[A-Z]{3}$/.test(a.iata_code) || seen.has(a.iata_code)) return false;
      seen.add(a.iata_code);
      return true;
    })
    .map((a) => ({
      value: a.iata_code,
      label: `${a.city_name || a.city?.name || a.name} (${a.iata_code})`,
      detail: `${a.name} · ${a.iata_country_code || ''}`,
    }))
    .slice(0, 20);
}

export function serviceErrorResponse(error) {
  return Response.json(
    {
      message:
        error instanceof FlightServiceError
          ? error.message
          : 'Flight search is unavailable. Please try again.',
    },
    {
      status: error instanceof FlightServiceError ? error.status : 500,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
