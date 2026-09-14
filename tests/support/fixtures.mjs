import { test as base, expect } from '@playwright/test';
import { airports } from '../../src/data/travel-locations.js';
import { sampleOffer } from '../../src/data/flight-fixtures.js';

export const test = base.extend({
  mockFlightServices: [
    async ({ page }, use) => {
      await page.route('**/api/airports?*', async (route) => {
        const query = new URL(route.request().url()).searchParams.get('query').toLowerCase();
        await route.fulfill({
          json: {
            airports: [
              ...airports,
              { value: 'SIN', label: 'Singapore (SIN)', detail: 'Changi Airport · SG' },
            ].filter((a) => `${a.label} ${a.detail}`.toLowerCase().includes(query)),
          },
        });
      });

      await page.route('**/api/flights/search', async (route) => {
        const values = route.request().postDataJSON();
        await route.fulfill({
          json: {
            testMode: true,
            offers: [
              sampleOffer({
                departure: values.departure,
                returnDate:
                  values.filters.trip === 'round-trip' ? values.filters.returnDate : undefined,
              }),
            ],
          },
        });
      });

      await use();
    },
    { auto: true },
  ],
});

export { expect };
