import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultFilters,
  validateSearch,
  createOfferRequest,
  searchFromQuery,
  searchToQuery,
} from '../../src/lib/flights/search.js';
import {
  filterOffers,
  normalizeOffer,
  formatLocalDate,
  durationMinutes,
} from '../../src/lib/flights/offers.js';
import {
  duffelRequest,
  searchFlights,
  searchAirports,
  serviceErrorResponse,
} from '../../src/lib/flights/duffel-client.js';
import { sampleOffer } from '../../src/data/flight-fixtures.js';

const values = {
  origin: 'LOS',
  destination: 'LHR',
  departure: '2027-01-15',
  filters: { ...defaultFilters },
};
const token = 'duffel_test_unit_fixture';
const rawOffer = {
  id: 'off-test',
  total_amount: '180.50',
  total_currency: 'USD',
  expires_at: '2099-01-01T00:00:00Z',
  client_key: 'private-client-key',
  passengers: [{ id: 'private-passenger-id' }],
  conditions: { refund_before_departure: { allowed: false } },
  slices: [
    {
      id: 'slice-1',
      duration: 'PT6H',
      segments: [
        {
          id: 'segment-1',
          duration: 'PT6H',
          origin: { iata_code: 'LOS', name: 'Lagos' },
          destination: { iata_code: 'LHR', name: 'Heathrow' },
          departing_at: '2027-01-15T23:30:00',
          arriving_at: '2027-01-16T05:30:00',
          operating_carrier: {
            name: 'Operating Airline',
            iata_code: 'OP',
            logo_symbol_url: 'https://example.com/logo.svg',
          },
          passengers: [{ cabin_class: 'economy', baggages: [{ type: 'checked', quantity: 1 }] }],
        },
      ],
    },
  ],
};

test('validates exact dates, airport selections, cabins, and traveler limits', () => {
  assert.deepEqual(validateSearch(values), {});
  for (const changed of [
    null,
    {},
    { ...values, origin: 'London' },
    { ...values, destination: 'LOS' },
    { ...values, departure: '2027-02-30' },
    { ...values, filters: { ...defaultFilters, adults: 10 } },
    {
      ...values,
      filters: { ...defaultFilters, adults: 2, children: 8, childAges: Array(8).fill(5) },
    },
    { ...values, filters: { ...defaultFilters, cabin: 'unknown' } },
    { ...values, filters: { ...defaultFilters, infants: 2 } },
  ])
    assert.ok(Object.keys(validateSearch(changed)).length);
});

test('round trips require a return date after departure and map children and lap infants', () => {
  const trip = {
    ...values,
    filters: {
      ...defaultFilters,
      trip: 'round-trip',
      cabin: 'premium economy',
      returnDate: '2027-01-22',
      children: 1,
      childAges: [5],
      infants: 1,
    },
  };
  assert.deepEqual(validateSearch(trip), {});
  const payload = createOfferRequest(trip);
  assert.equal(payload.cabin_class, 'premium_economy');
  assert.deepEqual(payload.passengers, [
    { type: 'adult' },
    { age: 5 },
    { type: 'infant_without_seat' },
  ]);
  assert.deepEqual(payload.slices[1], {
    origin: 'LHR',
    destination: 'LOS',
    departure_date: '2027-01-22',
  });
  for (const returnDate of ['', '2027-01-14'])
    assert.ok(validateSearch({ ...trip, filters: { ...trip.filters, returnDate } }).returnDate);
  assert.ok(validateSearch({ ...trip, filters: { ...trip.filters, childAges: [''] } }).filters);
});

test('queries round-trip correctly without allowing enormous traveler arrays', () => {
  assert.deepEqual(
    searchFromQuery(Object.fromEntries(new URLSearchParams(searchToQuery(values)))).filters,
    values.filters,
  );
  assert.equal(searchFromQuery({ children: 'Infinity' }).filters.children, 0);
  assert.equal(searchFromQuery({ children: '999999' }).filters.children, 0);
});

test('normalization keeps operating airline and baggage while excluding confidential fields', () => {
  const offer = normalizeOffer(rawOffer);
  assert.equal(offer.slices[0].segments[0].carrier.name, 'Operating Airline');
  assert.equal(offer.slices[0].segments[0].passengers[0].baggage[0].quantity, 1);
  assert.equal(offer.amount, '180.50');
  const json = JSON.stringify(offer);
  assert.ok(!json.includes('private-client-key') && !json.includes('private-passenger-id'));
  assert.equal(normalizeOffer({ ...rawOffer, total_amount: 'NaN' }), null);
  assert.equal(normalizeOffer({ ...rawOffer, expires_at: 'invalid' }), null);
});

test('price comparisons stay within currency and combine stops and time filters', () => {
  const offers = [
    sampleOffer({ id: 'expensive', amount: '900' }),
    sampleOffer({ id: 'cheap', amount: '300', stops: 1 }),
    sampleOffer({ id: 'gbp', currency: 'GBP', amount: '100' }),
  ];
  assert.deepEqual(
    filterOffers(offers, { currency: 'USD' }).map((o) => o.id),
    ['cheap', 'expensive'],
  );
  assert.deepEqual(
    filterOffers(offers, { currency: 'USD', stops: '0' }).map((o) => o.id),
    ['expensive'],
  );
  assert.deepEqual(
    filterOffers(offers, { currency: 'USD', maxPrice: '400' }).map((o) => o.id),
    ['cheap'],
  );
  assert.equal(filterOffers(offers, { currency: 'USD' }, { departTimeStart: '11:00' }).length, 0);
  assert.equal(filterOffers(offers, { currency: 'USD', sort: 'shortest' })[0].id, 'expensive');
});

test('duration and date formatting preserve airport-local calendar days', () => {
  assert.equal(durationMinutes('P1DT2H30M'), 1590);
  assert.equal(formatLocalDate('2027-01-15T23:30:00'), '15 Jan 2027');
});

test('transport authenticates on the server, requests v2 test offers, and uses no-store', async () => {
  let captured;
  const result = await searchFlights(values, undefined, {
    token,
    fetcher: async (url, options) => {
      captured = { url, options };
      return Response.json({ data: { id: 'orq-test', live_mode: false, offers: [rawOffer] } });
    },
  });
  assert.ok(captured.url.includes('supplier_timeout=20000'));
  assert.equal(captured.options.headers.Authorization, `Bearer ${token}`);
  assert.equal(captured.options.headers['Duffel-Version'], 'v2');
  assert.equal(captured.options.cache, 'no-store');
  assert.equal(JSON.parse(captured.options.body).data.slices.length, 1);
  assert.equal(result.offers.length, 1);
  assert.ok(!JSON.stringify(result).includes(token));
});

test('airport lookup expands city airports and removes duplicates', async () => {
  const airport = {
    type: 'airport',
    iata_code: 'SIN',
    name: 'Changi',
    city_name: 'Singapore',
    iata_country_code: 'SG',
  };
  const result = await searchAirports('Singapore', undefined, {
    token,
    fetcher: async () =>
      Response.json({ data: [airport, { type: 'city', name: 'Singapore', airports: [airport] }] }),
  });
  assert.deepEqual(result, [{ value: 'SIN', label: 'Singapore (SIN)', detail: 'Changi · SG' }]);
});

test('missing/live tokens fail before any external request', async () => {
  for (const token of [undefined, 'duffel_live_unit_fixture']) {
    await assert.rejects(
      duffelRequest('/places/suggestions', {
        token,
        fetcher: () => {
          assert.fail('Must not call Duffel');
        },
      }),
      (e) => e.status === 503,
    );
  }
});

test('service failures and timeouts expose only safe messages', async () => {
  for (const [upstream, expected] of [
    [401, 503],
    [403, 503],
    [429, 429],
    [422, 422],
    [500, 502],
  ]) {
    await assert.rejects(
      duffelRequest('/test', {
        token,
        fetcher: async () => Response.json({ message: token }, { status: upstream }),
      }),
      (e) => e.status === expected && !e.message.includes(token),
    );
  }
  await assert.rejects(
    duffelRequest('/test', {
      token,
      fetcher: async () => {
        throw new DOMException(token, 'TimeoutError');
      },
    }),
    (e) => e.status === 504 && !e.message.includes(token),
  );
  const response = serviceErrorResponse(new Error(token));
  assert.ok(!(await response.text()).includes(token));
});

test('unexpected or live-mode upstream data cannot become test results', async () => {
  for (const data of [
    { live_mode: true, offers: [rawOffer] },
    null,
    { live_mode: false, offers: null },
  ])
    await assert.rejects(
      searchFlights(values, undefined, { token, fetcher: async () => Response.json({ data }) }),
    );
});
