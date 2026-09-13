// Local design-system and test data. Never used as a fallback for live requests.
export function sampleOffer({
  id = 'sample-1',
  amount = '325.50',
  currency = 'USD',
  stops = 0,
  departure = '2027-01-15',
  returnDate,
  expiresAt = '2099-01-01T00:00:00Z',
  airline = 'Duffel Airways',
} = {}) {
  const carrier = { name: airline, code: 'ZZ', logo: null };
  const place = (code, city) => ({ code, city, name: `${city} Airport`, timeZone: 'Etc/UTC' });
  const segment = (n, origin, destination, date, hour) => ({
    id: `${id}-${date}-${n}`,
    origin,
    destination,
    departingAt: `${date}T${hour}:00:00`,
    arrivingAt: `${date}T${Number(hour) + 2}:30:00`,
    duration: 'PT2H30M',
    carrier,
    flightNumber: 'ZZ 123',
    passengers: [
      { cabin: 'economy', cabinName: 'Economy', baggage: [{ type: 'checked', quantity: 1 }] },
    ],
  });
  const los = place('LOS', 'Lagos'),
    lhr = place('LHR', 'London'),
    abv = place('ABV', 'Abuja');
  const segments = stops
    ? [segment(1, los, abv, departure, '10'), segment(2, abv, lhr, departure, '14')]
    : [segment(1, los, lhr, departure, '10')];
  const slices = [{ id: `${id}-outbound`, duration: stops ? 'PT6H30M' : 'PT2H30M', segments }];
  if (returnDate)
    slices.push({
      id: `${id}-return`,
      duration: 'PT2H30M',
      segments: [segment(1, lhr, los, returnDate, '10')],
    });
  return {
    id,
    amount,
    currency,
    expiresAt,
    slices,
    conditions: {
      change_before_departure: { allowed: true, penaltyAmount: '25.00', penaltyCurrency: currency },
      refund_before_departure: { allowed: false },
    },
  };
}

export async function demoFlightSearch(values) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    testMode: true,
    offers: [
      sampleOffer({
        departure: values.departure,
        returnDate: values.filters.trip === 'round-trip' ? values.filters.returnDate : undefined,
      }),
    ],
  };
}
