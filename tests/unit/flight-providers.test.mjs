import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { createFlightService } from '../../src/lib/flights/client.js';
import { readFlightConfig } from '../../src/lib/flights/config.js';
import { defaultFilters } from '../../src/lib/flights/search.js';
import { filterOffers, formatBaggage } from '../../src/lib/flights/offers.js';
import { searchAirports } from '../../src/lib/airports.js';
import {
  createTravelportClient,
  createTravelportRequest,
  AUTH_URL,
  SEARCH_URL,
} from '../../src/lib/flights/providers/travelport.js';
import { normalizeTravelportResponse } from '../../src/lib/flights/providers/travelport-offers.js';
import { rawOffer } from '../fixtures/duffel/offer.js';
import { serviceErrorResponse } from '../../src/lib/flights/errors.js';

const travelportEnv = {
  FLIGHTS_PROVIDER: 'travelport',
  TRAVELPORT_CLIENT_ID: 'test-client',
  TRAVELPORT_CLIENT_SECRET: 'private-secret',
  TRAVELPORT_USERNAME: 'test-user',
  TRAVELPORT_PASSWORD: 'private-password',
  TRAVELPORT_PCC: 'TEST_1G',
  TRAVELPORT_CONTENT_SOURCES: 'GDS,NDC',
};
const fixtures = {};
for (const source of ['gds', 'ndc'])
  for (const trip of ['one', 'round']) {
    fixtures[`${source}-${trip}`] = JSON.parse(
      await readFile(new URL(`../fixtures/travelport/${source}-${trip}.json`, import.meta.url)),
    );
  }
const root = (data) => data.CatalogProductOfferingsResponse;
const references = (data, key) => root(data).ReferenceList.find((ref) => ref[key])[key];
const options = (data) =>
  root(data).CatalogProductOfferings.CatalogProductOffering.flatMap((c) =>
    c.ProductBrandOptions.flatMap((group) => group.ProductBrandOffering),
  );

function valuesFor(data, trip = 'one-way') {
  const offering = root(data).CatalogProductOfferings.CatalogProductOffering[0];
  const flights = references(data, 'Flight');

  return {
    origin: offering.Departure,
    destination: offering.Arrival,
    departure: flights.find((f) => f.Departure.location === offering.Departure).Departure.date,
    filters: {
      ...defaultFilters,
      trip,
      returnDate:
        trip === 'round-trip'
          ? flights.find((f) => f.Departure.location === offering.Arrival).Departure.date
          : '',
    },
  };
}

const quiet = () => {};
const fixture = fixtures['gds-one'];
const values = valuesFor(fixture);
const authResponse = (value = 'private-auth-token', lifetime = 86400) =>
  Response.json({ access_token: value, expires_in: lifetime });
const tpTransport = (url) =>
  Promise.resolve(url === AUTH_URL ? authResponse() : Response.json(fixture));

test('configuration selects one known provider and validates only its credentials', () => {
  assert.equal(
    readFlightConfig({ FLIGHTS_PROVIDER: 'duffel', DUFFEL_ACCESS_TOKEN: 'duffel_test_example' })
      .provider,
    'duffel',
  );
  assert.equal(readFlightConfig(travelportEnv).provider, 'travelport');
  for (const env of [
    {},
    { FLIGHTS_PROVIDER: 'unknown' },
    { FLIGHTS_PROVIDER: 'duffel', DUFFEL_ACCESS_TOKEN: 'duffel_live_example' },
    { ...travelportEnv, TRAVELPORT_PASSWORD: '' },
    { ...travelportEnv, TRAVELPORT_CONTENT_SOURCES: 'other' },
  ])
    assert.throws(
      () => readFlightConfig(env),
      (e) => e.category === 'configuration' && e.status === 503,
    );
});

test('airport search works without supplier credentials, handles Nigeria, accents, names, and worldwide codes', () => {
  assert.equal(searchAirports('LOS')[0].value, 'LOS');
  assert.equal(searchAirports('Abuja')[0].value, 'ABV');
  assert.ok(searchAirports('Port Harcourt').some((airport) => airport.value === 'PHC'));
  assert.ok(searchAirports('Changi').some((airport) => airport.value === 'SIN'));
  assert.ok(searchAirports('Sao Paulo').length);
  assert.equal(searchAirports('LHR')[0].value, 'LHR');
  assert.equal(searchAirports('a').length, 0);
  assert.equal(searchAirports('x'.repeat(101)).length, 0);
  const london = searchAirports('London');
  assert.ok(london.length <= 20);
  assert.equal(new Set(london.map((a) => a.value)).size, london.length);
  assert.deepEqual(Object.keys(london[0]), ['value', 'label', 'detail']);
});

test('Travelport request preserves journeys, child ages, cabins, and infants without restricting airlines', () => {
  const request = createTravelportRequest(
    {
      ...values,
      filters: {
        ...defaultFilters,
        trip: 'round-trip',
        returnDate: '2027-01-22',
        adults: 2,
        children: 2,
        childAges: [4, 9],
        infants: 1,
        cabin: 'premium economy',
      },
    },
    ['GDS', 'NDC'],
  ).CatalogProductOfferingsRequest;
  assert.deepEqual(
    request.PassengerCriteria.map((p) => [p.passengerTypeCode, p.number, p.age]),
    [
      ['ADT', 2, undefined],
      ['CNN', 1, 4],
      ['CNN', 1, 9],
      ['INF', 1, undefined],
    ],
  );
  assert.equal(request.SearchCriteriaFlight[1].From.value, values.destination);
  assert.equal(request.SearchCriteriaFlight[1].departureDate, '2027-01-22');
  assert.deepEqual(request.SearchModifiersAir.CabinPreference[0].cabins, ['PremiumEconomy']);
  assert.equal(request.SearchModifiersAir.CarrierPreference, undefined);
  assert.equal(request.CustomResponseModifiersAir.SearchRepresentation, 'Journey');
  assert.equal(request.offersPerPage, 100);
});

for (const source of ['gds', 'ndc'])
  for (const trip of ['one', 'round']) {
    test(`${source} ${trip}: official response references resolve into complete priced itineraries`, () => {
      const data = fixtures[`${source}-${trip}`];
      const criteria = valuesFor(data, trip === 'round' ? 'round-trip' : 'one-way');
      const result = normalizeTravelportResponse(data, criteria, Date.parse('2025-01-01'));
      assert.ok(result.offers.length);
      for (const offer of result.offers) {
        assert.equal(offer.slices.length, trip === 'round' ? 2 : 1);
        assert.ok(Number(offer.amount) > 0);
        assert.equal(offer.currency, 'AUD');
        assert.ok(offer.slices.every((s) => s.segments.length));
        assert.ok(Date.parse(offer.expiresAt) <= Date.parse('2025-01-01T00:10:00Z'));
      }
      const expected = options(data)[0].BestCombinablePrice.TotalPrice;
      assert.ok(result.offers.some((o) => Number(o.amount) === expected));
    });
  }

test('round trips never sum journey totals or combine unrelated / split-ticket products', () => {
  const data = structuredClone(fixtures['gds-round']);
  const criteria = valuesFor(data, 'round-trip');
  const initial = normalizeTravelportResponse(data, criteria);
  assert.ok(initial.offers.some((o) => Number(o.amount) === 921.8));
  const inbound = root(data).CatalogProductOfferings.CatalogProductOffering[1];
  for (const group of inbound.ProductBrandOptions)
    for (const option of group.ProductBrandOffering) option.CombinabilityCode = ['unrelated'];
  assert.throws(
    () => normalizeTravelportResponse(data, criteria),
    (e) => e.category === 'malformed',
  );
  for (const option of options(data)) option.CombinabilityCode = ['j0'];
  assert.throws(
    () => normalizeTravelportResponse(data, criteria),
    (e) => e.category === 'malformed',
  );
});

test('normalization distinguishes zero results, supplier errors, and malformed references', () => {
  assert.deepEqual(
    normalizeTravelportResponse(
      {
        CatalogProductOfferingsResponse: {
          CatalogProductOfferings: { CatalogProductOffering: [] },
        },
      },
      values,
    ),
    { testMode: true, offers: [] },
  );
  for (const data of [
    {},
    { CatalogProductOfferingsResponse: {} },
    {
      CatalogProductOfferingsResponse: {
        Result: { Error: [{ Message: 'private supplier message' }] },
      },
    },
  ])
    assert.throws(() => normalizeTravelportResponse(data, values));
  const malformed = structuredClone(fixture);
  root(malformed).ReferenceList = [];
  assert.throws(
    () => normalizeTravelportResponse(malformed, values),
    (e) => e.category === 'malformed',
  );
});

test('expired supplier terms win over the ten-minute display freshness cap', () => {
  const data = structuredClone(fixture);
  for (const term of references(data, 'TermsAndConditions'))
    term.ExpiryDate = '2027-01-01T00:01:00Z';
  const result = normalizeTravelportResponse(data, values, Date.parse('2027-01-01T00:00:00Z'));
  assert.ok(result.offers.every((o) => o.expiresAt === '2027-01-01T00:01:00.000Z'));
});

test('baggage keeps weights, quantities, and paid/unknown inclusion distinct', () => {
  const ndc = normalizeTravelportResponse(fixtures['ndc-one'], valuesFor(fixtures['ndc-one']));
  const bag = ndc.offers
    .flatMap((o) => o.slices[0].segments[0].passengers[0].baggage)
    .find((b) => b.type === 'checked' && b.weight === 32);
  assert.equal(bag.weight, 32);
  assert.equal(bag.weightUnit, 'kg');
  assert.equal(bag.quantity, 2);
  assert.equal(bag.included, null);
  assert.match(formatBaggage(bag), /2 checked bags · 32 kg per bag · inclusion not supplied/);
  assert.equal(
    formatBaggage({
      type: 'checked',
      quantity: null,
      weight: 23,
      weightUnit: 'kg',
      included: true,
    }),
    'checked baggage · 23 kg',
  );
  assert.match(
    formatBaggage({ type: 'checked', quantity: 1, included: false }),
    /additional charge/,
  );
  assert.equal(
    formatBaggage({ type: 'checked', quantity: 0, weight: 23, weightUnit: 'kg' }),
    '0 checked bags',
  );
  const gds = normalizeTravelportResponse(fixture, values);
  assert.ok(
    gds.offers[0].slices[0].segments[0].passengers[0].baggage.some((b) => b.included === false),
  );
});

test('missing durations sort after known durations in shortest sort', () => {
  const offers = normalizeTravelportResponse(fixture, values).offers.slice(0, 2);
  offers[0].slices[0].duration = null;
  offers[0].amount = '1';
  offers[1].slices[0].duration = 'PT9H';
  assert.equal(filterOffers(offers, { currency: 'AUD', sort: 'shortest' })[0], offers[1]);
});

test('shared response hides supplier references and credentials and only calls the configured provider', async () => {
  const calls = [],
    logs = [];
  const service = createFlightService({
    env: travelportEnv,
    logger: (log) => logs.push(log),
    fetcher: async (url, options) => {
      calls.push({ url, options });

      return tpTransport(url);
    },
  });
  const result = await service(values);
  assert.deepEqual(Object.keys(result), ['id', 'testMode', 'offers']);
  assert.match(result.id, /^[\da-f-]{36}$/);
  assert.match(result.offers[0].id, /^[\da-f-]{36}$/);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, AUTH_URL);
  assert.equal(calls[1].url, SEARCH_URL);
  assert.equal(calls[1].options.headers['TVP-PCC-Core'], 'TEST_1G');
  for (const text of [JSON.stringify(result), JSON.stringify(logs)]) {
    for (const secret of ['private-secret', 'private-password', 'private-auth-token'])
      assert.ok(!text.includes(secret));
  }
  for (const key of [
    'CatalogProductOfferings',
    'ProductRef',
    'BestCombinablePrice',
    'transactionId',
    'ContentSource',
    'travelport',
    'duffel',
  ])
    assert.ok(!JSON.stringify(result).includes(key));
});

test('authentication refresh is shared, cached, and refreshed before expiry', async () => {
  let clock = 0,
    authCalls = 0;
  const client = createTravelportClient(travelportEnv, {
    now: () => clock,
    fetcher: async (url) => {
      if (url === AUTH_URL) {
        authCalls++;
        await delay(5);

        return authResponse(`token-${authCalls}`, 100);
      }

      return Response.json(fixture);
    },
  });
  await Promise.all([client.search(values), client.search(values)]);
  assert.equal(authCalls, 1);
  await client.search(values);
  assert.equal(authCalls, 1);
  clock = 91000;
  await client.search(values);
  assert.equal(authCalls, 2);
});

test('401 refreshes once; repeated authentication failure never falls back to another supplier', async () => {
  let authCalls = 0,
    searches = 0;
  const service = createFlightService({
    env: travelportEnv,
    logger: quiet,
    fetcher: async (url) => {
      if (url === AUTH_URL) {
        authCalls++;

        return authResponse();
      }
      searches++;

      return Response.json({}, { status: 401 });
    },
  });
  await assert.rejects(service(values), (e) => e.category === 'authentication');
  assert.equal(authCalls, 2);
  assert.equal(searches, 2);
});

test('one cancelled caller does not cancel another caller sharing authentication', async () => {
  let authCalls = 0;
  const service = createFlightService({
    env: travelportEnv,
    logger: quiet,
    fetcher: async (url) => {
      if (url === AUTH_URL) {
        authCalls++;
        await delay(30);

        return authResponse();
      }

      return Response.json(fixture);
    },
  });
  const controller = new AbortController();
  const first = service(values, controller.signal);
  const second = service(values);
  controller.abort();
  await assert.rejects(first, (e) => e.category === 'timeout');
  assert.ok((await second).offers.length);
  assert.equal(authCalls, 1);
});

test('deadline applies across authentication and search, and already-cancelled calls make no request', async () => {
  let calls = 0;
  const service = createFlightService({
    env: travelportEnv,
    logger: quiet,
    timeoutMs: 10,
    fetcher: async (url) => {
      calls++;
      await delay(35);

      return tpTransport(url);
    },
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(service(values, controller.signal));
  assert.equal(calls, 0);
  await assert.rejects(service(values), (e) => e.category === 'timeout');
  await delay(40);
  assert.equal(calls, 1);
});

test('configuration failures identify field names in logs without logging supplied values', async () => {
  const logs = [];
  const service = createFlightService({
    env: { ...travelportEnv, TRAVELPORT_PCC: 'private-invalid-value' },
    logger: (entry) => logs.push(entry),
    fetcher: () => assert.fail('No network call'),
  });
  await assert.rejects(service(values), (e) => e.category === 'configuration');
  assert.deepEqual(logs[0].fields, ['TRAVELPORT_PCC']);
  assert.ok(!JSON.stringify(logs).includes('private-invalid-value'));
});

test('changing the server configuration switches adapters while preserving the public contract', async () => {
  const env = {
    ...travelportEnv,
    FLIGHTS_PROVIDER: 'duffel',
    DUFFEL_ACCESS_TOKEN: 'duffel_test_fixture',
  };
  const calls = [];
  const service = createFlightService({
    env,
    logger: quiet,
    fetcher: async (url) => {
      calls.push(url);

      return url.startsWith('https://api.duffel.com/')
        ? Response.json({ data: { live_mode: false, offers: [rawOffer] } })
        : tpTransport(url);
    },
  });
  const duffel = await service({
    origin: 'LOS',
    destination: 'LHR',
    departure: '2027-01-15',
    filters: { ...defaultFilters },
  });
  assert.equal(calls.length, 1);
  env.FLIGHTS_PROVIDER = 'travelport';
  const travelport = await service(values);
  assert.equal(calls.length, 3);
  assert.deepEqual(Object.keys(duffel), Object.keys(travelport));
  assert.deepEqual(Object.keys(duffel.offers[0]), Object.keys(travelport.offers[0]));
  assert.notEqual(duffel.offers[0].id, rawOffer.id);
  assert.ok(!JSON.stringify(duffel).includes('private-client-key'));
});

test('a successful 401 refresh retries with the new token and caches it', async () => {
  let authCalls = 0,
    searches = 0;
  const client = createTravelportClient(travelportEnv, {
    fetcher: async (url, options) => {
      if (url === AUTH_URL) return authResponse(`token-${++authCalls}`);
      searches++;
      assert.equal(options.headers.Authorization, `Bearer token-${authCalls}`);

      return searches === 1 ? Response.json({}, { status: 401 }) : Response.json(fixture);
    },
  });
  assert.ok((await client.search(values)).offers.length);
  await client.search(values);
  assert.equal(authCalls, 2);
  assert.equal(searches, 3);
});

test('failed token refreshes recover on later calls and never expose auth errors', async () => {
  let fail = true;
  const client = createTravelportClient(travelportEnv, {
    fetcher: async (url) => {
      if (url === AUTH_URL)
        return fail
          ? Response.json({ error: 'private-auth-error' }, { status: 400 })
          : authResponse();

      return Response.json(fixture);
    },
  });
  await assert.rejects(
    client.search(values),
    (e) => e.category === 'authentication' && !e.message.includes('private'),
  );
  fail = false;
  assert.ok((await client.search(values)).offers.length);
});

test('supplier rate limits, failures, invalid JSON, and malformed tokens have safe categories', async () => {
  for (const [status, category] of [
    [429, 'rate_limit'],
    [403, 'authentication'],
    [500, 'upstream'],
    [422, 'invalid_search'],
  ]) {
    const client = createTravelportClient(travelportEnv, {
      fetcher: async (url) =>
        url === AUTH_URL ? authResponse() : Response.json({ message: 'private-body' }, { status }),
    });
    await assert.rejects(
      client.search(values),
      (e) => e.category === category && !e.message.includes('private-body'),
    );
  }
  for (const response of [
    () => Response.json(null),
    () => Response.json({ access_token: 'test' }),
    () => new Response('private-invalid-json'),
  ]) {
    const client = createTravelportClient(travelportEnv, { fetcher: async () => response() });
    await assert.rejects(client.search(values), (e) => e.category === 'malformed');
  }
  const brokenSearch = createTravelportClient(travelportEnv, {
    fetcher: async (url) =>
      url === AUTH_URL ? authResponse() : new Response('private-invalid-json'),
  });
  await assert.rejects(brokenSearch.search(values), (e) => e.category === 'malformed');
  const error = serviceErrorResponse(new Error('private credential'));
  assert.equal(error.status, 502);
  assert.ok(!(await error.text()).includes('private'));
});

test('weight-based allowances do not become bag counts; missing fare conditions remain unknown', () => {
  const data = structuredClone(fixture);
  for (const terms of references(data, 'TermsAndConditions')) {
    delete terms.Penalties;
    terms.BaggageAllowance = [
      {
        baggageType: 'FirstCheckedBag',
        BaggageItem: [
          {
            soldByWeightInd: true,
            quantity: 23,
            includedInOfferPrice: 'Yes',
            Measurement: [{ measurementType: 'Weight', unit: 'Kilograms', value: 23 }],
          },
        ],
      },
    ];
  }
  const offer = normalizeTravelportResponse(data, values).offers[0];
  assert.equal(offer.conditions.refund_before_departure, null);
  assert.equal(offer.conditions.change_before_departure, null);
  const bag = offer.slices[0].segments[0].passengers[0].baggage[0];
  assert.equal(bag.quantity, null);
  assert.equal(formatBaggage(bag), 'checked baggage · 23 kg');
});
