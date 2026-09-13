export function durationMinutes(value = '') {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
  return match
    ? Number(match[1] || 0) * 1440 +
        Number(match[2] || 0) * 60 +
        Number(match[3] || 0) +
        Number(match[4] || 0) / 60
    : 0;
}

export function formatDuration(value) {
  const minutes = Math.round(durationMinutes(value));
  return minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : 'Duration unavailable';
}

export function formatMoney(amount, currency) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(Number(amount));
}

export function formatLocalDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

export function filterOffers(
  offers,
  { currency, stops = 'any', minPrice = '', maxPrice = '', sort = 'cheapest' },
  schedule = {},
) {
  const filtered = offers.filter((offer) => {
    if (currency && offer.currency !== currency) return false;
    if (stops !== 'any' && offer.slices.some((slice) => slice.segments.length - 1 > Number(stops)))
      return false;
    const price = Number(offer.amount);
    if (
      (minPrice !== '' && price < Number(minPrice)) ||
      (maxPrice !== '' && price > Number(maxPrice))
    )
      return false;
    return offer.slices.every((slice, index) => {
      const prefix = index ? 'return' : 'depart';
      const time = slice.segments[0]?.departingAt.slice(11, 16);
      return (
        (!schedule[`${prefix}TimeStart`] || time >= schedule[`${prefix}TimeStart`]) &&
        (!schedule[`${prefix}TimeEnd`] || time <= schedule[`${prefix}TimeEnd`])
      );
    });
  });
  const duration = (offer) =>
    offer.slices.reduce((sum, slice) => sum + durationMinutes(slice.duration), 0);
  return filtered.sort((a, b) => {
    if (sort === 'shortest')
      return duration(a) - duration(b) || Number(a.amount) - Number(b.amount);
    if (sort === 'earliest')
      return (
        a.slices[0].segments[0].departingAt.localeCompare(b.slices[0].segments[0].departingAt) ||
        Number(a.amount) - Number(b.amount)
      );
    return Number(a.amount) - Number(b.amount) || duration(a) - duration(b);
  });
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

export function normalizeOffer(offer) {
  if (
    !offer?.id ||
    !/^\d+(\.\d+)?$/.test(offer.total_amount) ||
    !/^[A-Z]{3}$/.test(offer.total_currency) ||
    !Number.isFinite(Date.parse(offer.expires_at)) ||
    !offer.slices?.length ||
    offer.slices.some(
      (slice) =>
        !slice.segments?.length ||
        slice.segments.some(
          (s) => !s.origin || !s.destination || !s.departing_at || !s.arriving_at,
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
        passengers: (segment.passengers || []).map((passenger) => ({
          cabin: passenger.cabin_class,
          cabinName: passenger.cabin_class_marketing_name,
          baggage: (passenger.baggages || []).map((bag) => ({
            type: bag.type,
            quantity: bag.quantity,
          })),
        })),
      })),
    })),
  };
}
