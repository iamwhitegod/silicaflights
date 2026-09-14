import { FlightServiceError, responseError, safeError } from '../errors.js';

export function createOfferRequest(values) {
  const f = values.filters;
  const slices = [
    { origin: values.origin, destination: values.destination, departure_date: values.departure },
  ];
  if (f.trip === 'round-trip')
    slices.push({
      origin: values.destination,
      destination: values.origin,
      departure_date: f.returnDate,
    });

  return {
    slices,
    cabin_class: f.cabin.replace(' ', '_'),
    passengers: [
      ...Array.from({ length: f.adults }, () => ({ type: 'adult' })),
      ...f.childAges.map((age) => ({ age })),
      ...Array.from({ length: f.infants }, () => ({ type: 'infant_without_seat' })),
    ],
  };
}

const place = (p) => ({
  code: p.iata_code,
  name: p.name,
  city: p.city_name || p.city?.name || '',
  timeZone: p.time_zone,
});
const carrier = (c) => ({
  name: c?.name || 'Airline unavailable',
  code: c?.iata_code || '',
  logo: /^https:\/\//.test(c?.logo_symbol_url || '') ? c.logo_symbol_url : null,
});

function isSimulatedOffer(offer) {
  // Duffel identifies its synthetic airline by owner; also reject simulated segments.
  const simulated = (airline) =>
    (typeof airline?.iata_code === 'string' && airline.iata_code.toUpperCase() === 'ZZ') ||
    (typeof airline?.name === 'string' && /^duffel\s+airways$/i.test(airline.name.trim()));

  return (
    simulated(offer?.owner) ||
    (Array.isArray(offer?.slices) &&
      offer.slices.some(
        (slice) =>
          Array.isArray(slice?.segments) &&
          slice.segments.some(
            (segment) =>
              simulated(segment?.operating_carrier) || simulated(segment?.marketing_carrier),
          ),
      ))
  );
}

export function normalizeOffer(offer) {
  if (
    !offer?.id ||
    !/^\d+(\.\d+)?$/.test(offer.total_amount) ||
    !Number.isFinite(Number(offer.total_amount)) ||
    !/^[A-Z]{3}$/.test(offer.total_currency) ||
    !Number.isFinite(Date.parse(offer.expires_at)) ||
    !Array.isArray(offer.slices) ||
    !offer.slices.length ||
    offer.slices.some(
      (slice) =>
        !Array.isArray(slice?.segments) ||
        !slice.segments.length ||
        slice.segments.some(
          (s) =>
            !/^[A-Z]{3}$/.test(s?.origin?.iata_code) ||
            !/^[A-Z]{3}$/.test(s?.destination?.iata_code) ||
            !Number.isFinite(Date.parse(s.departing_at)) ||
            !Number.isFinite(Date.parse(s.arriving_at)),
        ),
    )
  )
    return null;
  const conditions = {};
  for (const key of ['change_before_departure', 'refund_before_departure']) {
    const c = offer.conditions?.[key];
    conditions[key] = c
      ? { allowed: c.allowed, penaltyAmount: c.penalty_amount, penaltyCurrency: c.penalty_currency }
      : null;
  }

  return {
    id: offer.id,
    expiresAt: offer.expires_at,
    amount: offer.total_amount,
    currency: offer.total_currency,
    conditions,
    slices: offer.slices.map((slice) => ({
      id: slice.id,
      duration: slice.duration,
      segments: slice.segments.map((segment) => ({
        id: segment.id,
        origin: place(segment.origin),
        destination: place(segment.destination),
        departingAt: segment.departing_at,
        arrivingAt: segment.arriving_at,
        duration: segment.duration,
        carrier: carrier(segment.operating_carrier),
        flightNumber:
          `${segment.operating_carrier?.iata_code || ''} ${segment.operating_carrier_flight_number || ''}`.trim(),
        passengers: (Array.isArray(segment.passengers) ? segment.passengers : [])
          .filter(Boolean)
          .map((passenger) => ({
            cabin: passenger.cabin_class,
            cabinName: passenger.cabin_class_marketing_name,
            baggage: (Array.isArray(passenger.baggages) ? passenger.baggages : [])
              .filter(
                (bag) =>
                  bag &&
                  ['checked', 'carry_on', 'personal_item'].includes(bag.type) &&
                  Number.isInteger(bag.quantity) &&
                  bag.quantity >= 0,
              )
              .map((bag) => ({
                type: bag.type,
                quantity: bag.quantity,
                included: true,
              })),
          })),
      })),
    })),
  };
}

export async function duffelRequest(path, { data, signal, token, fetcher = fetch } = {}) {
  if (!token?.startsWith('duffel_test_'))
    throw new FlightServiceError('configuration', ['DUFFEL_ACCESS_TOKEN']);
  try {
    const response = await fetcher(`https://api.duffel.com${path}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
      signal,
    });
    if (!response.ok) throw responseError(response.status);
    try {
      return await response.json();
    } catch {
      throw new FlightServiceError('malformed');
    }
  } catch (error) {
    throw safeError(error);
  }
}

export function createDuffelClient(settings, { fetcher = fetch } = {}) {
  return {
    async search(values, signal) {
      const { data } = await duffelRequest(
        '/air/offer_requests?return_offers=true&supplier_timeout=20000',
        {
          data: createOfferRequest(values),
          token: settings.DUFFEL_ACCESS_TOKEN,
          signal,
          fetcher,
        },
      );
      if (!data || data.live_mode !== false || !Array.isArray(data.offers))
        throw new FlightServiceError('malformed');
      const candidates = data.offers.filter((offer) => !isSimulatedOffer(offer));
      const offers = candidates
        .map(normalizeOffer)
        .filter(
          (offer) =>
            offer &&
            offer.slices.length === (values.filters.trip === 'round-trip' ? 2 : 1) &&
            offer.slices.every(
              (slice, index) =>
                slice.segments[0].origin.code === (index ? values.destination : values.origin) &&
                slice.segments.at(-1).destination.code ===
                  (index ? values.origin : values.destination) &&
                slice.segments[0].departingAt.slice(0, 10) ===
                  (index ? values.filters.returnDate : values.departure),
            ),
        );
      if (candidates.length && !offers.length) throw new FlightServiceError('malformed');

      return { offers, testMode: true };
    },
  };
}
