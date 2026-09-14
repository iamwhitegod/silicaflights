import { readFile } from 'node:fs/promises';
import { test, expect } from '../support/fixtures.mjs';
import { createFlightService } from '../../src/lib/flights/client.js';
import { defaultFilters, searchToQuery } from '../../src/lib/flights/search.js';
import { AUTH_URL } from '../../src/lib/flights/providers/travelport.js';
import { rawOffer } from '../fixtures/duffel/offer.js';

async function providerResult(provider, trip) {
  let payload, values;
  if (provider === 'duffel') {
    const offer = structuredClone(rawOffer);
    values = {
      origin: 'LOS',
      destination: 'LHR',
      departure: '2027-01-15',
      filters: { ...defaultFilters, trip, returnDate: trip === 'round-trip' ? '2027-01-22' : '' },
    };
    if (trip === 'round-trip') {
      const inbound = structuredClone(offer.slices[0]);
      const segment = inbound.segments[0];
      [segment.origin, segment.destination] = [segment.destination, segment.origin];
      segment.departing_at = '2027-01-22T23:30:00';
      segment.arriving_at = '2027-01-23T05:30:00';
      offer.slices.push(inbound);
    }
    payload = { data: { live_mode: false, offers: [offer] } };
  } else {
    const name = trip === 'round-trip' ? 'gds-round' : 'ndc-one';
    payload = JSON.parse(
      await readFile(new URL(`../fixtures/travelport/${name}.json`, import.meta.url)),
    );
    const root = payload.CatalogProductOfferingsResponse;
    const flights = root.ReferenceList.flatMap((ref) => ref.Flight || []);
    const earliest = Math.min(...flights.map((flight) => Date.parse(flight.Departure.date)));
    const shift = Date.parse('2027-01-15') - earliest;
    for (const flight of flights)
      for (const point of [flight.Departure, flight.Arrival])
        point.date = new Date(Date.parse(point.date) + shift).toISOString().slice(0, 10);
    for (const terms of root.ReferenceList.flatMap((ref) => ref.TermsAndConditions || []))
      terms.ExpiryDate = '2099-01-01T00:00:00Z';
    const first = root.CatalogProductOfferings.CatalogProductOffering[0];
    values = {
      origin: first.Departure,
      destination: first.Arrival,
      departure: '2027-01-15',
      filters: {
        ...defaultFilters,
        trip,
        returnDate:
          trip === 'round-trip'
            ? flights.find((flight) => flight.Departure.location === first.Arrival).Departure.date
            : '',
      },
    };
  }
  const service = createFlightService({
    env: {
      FLIGHTS_PROVIDER: provider,
      DUFFEL_ACCESS_TOKEN: 'duffel_test_fixture',
      TRAVELPORT_CLIENT_ID: 'fixture',
      TRAVELPORT_CLIENT_SECRET: 'fixture',
      TRAVELPORT_USERNAME: 'fixture',
      TRAVELPORT_PASSWORD: 'fixture',
      TRAVELPORT_PCC: 'TEST_1G',
    },
    logger: () => {},
    fetcher: async (url) =>
      Response.json(url === AUTH_URL ? { access_token: 'fixture', expires_in: 3600 } : payload),
  });

  return { values, result: await service(values) };
}

for (const provider of ['duffel', 'travelport'])
  for (const trip of ['one-way', 'round-trip'])
    for (const width of [393, 1445]) {
      test(`${provider} ${trip} normalized results use the shared UI at ${width}px`, async ({
        page,
      }) => {
        const { values, result } = await providerResult(provider, trip);
        if (provider === 'travelport' && trip === 'one-way')
          result.offers = result.offers.filter((offer) =>
            offer.slices[0].segments[0].passengers[0].baggage.some(
              (bag) => bag.quantity > 0 && bag.weight > 0,
            ),
          );
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.route('**/api/flights/search', (route) => route.fulfill({ json: result }));
        await page.goto(`/flights?${searchToQuery(values)}`);
        await expect(page.getByRole('article').first()).toBeVisible();
        await expect(page.getByText(/Powered by|Travelport/i)).toHaveCount(0);
        await page.getByRole('button', { name: 'View details', exact: true }).first().click();
        const dialog = page.getByRole('dialog', { name: 'Itinerary details' });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('heading', { name: 'Outbound', exact: true })).toBeVisible();
        if (trip === 'round-trip')
          await expect(dialog.getByRole('heading', { name: 'Return', exact: true })).toBeVisible();
        await expect(dialog).toContainText('checked bag');
        if (provider === 'travelport' && trip === 'one-way')
          await expect(dialog).toContainText('kg per bag');
        expect(
          await dialog.evaluate((element) => {
            const viewport = element.querySelector('[data-lenis-prevent]');

            return viewport.scrollWidth <= viewport.clientWidth + 1;
          }),
        ).toBe(true);
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
      });
    }

test('real airport route serves Nigeria and worldwide queries from its local catalog', async ({
  request,
}) => {
  for (const [query, code] of [
    ['Lagos', 'LOS'],
    ['Abuja', 'ABV'],
    ['Port Harcourt', 'PHC'],
    ['Changi', 'SIN'],
  ]) {
    const response = await request.get(`/api/airports?query=${encodeURIComponent(query)}`);
    expect(response.status()).toBe(200);
    const { airports } = await response.json();
    expect(airports.some((airport) => airport.value === code)).toBe(true);
  }
});

test('simulated-only supplier results show the normal empty state and no generated fares', async ({
  page,
}) => {
  const simulated = { ...rawOffer, owner: { iata_code: 'ZZ', name: 'Duffel Airways' } };
  const search = createFlightService({
    env: { FLIGHTS_PROVIDER: 'duffel', DUFFEL_ACCESS_TOKEN: 'duffel_test_fixture' },
    logger: () => {},
    fetcher: async () => Response.json({ data: { live_mode: false, offers: [simulated] } }),
  });
  await page.route('**/api/flights/search', async (route) =>
    route.fulfill({ json: await search(route.request().postDataJSON()) }),
  );
  await page.goto('/flights?origin=LOS&destination=LHR&departure=2027-01-15');
  await expect(page.getByRole('heading', { name: 'No flights found' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByText('Duffel Airways')).toHaveCount(0);
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
});
