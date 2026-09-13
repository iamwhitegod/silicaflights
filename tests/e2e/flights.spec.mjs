import { test, expect } from '../support/fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';
import { sampleOffer } from '../../src/data/flight-fixtures.js';

const searchUrl =
  '/flights?origin=LOS&destination=LHR&departure=2027-01-15&originLabel=Lagos&destinationLabel=London';

test('worldwide airport selection keeps its label and rejects unselected text', async ({
  page,
}) => {
  await page.goto('/');
  const from = page.getByRole('combobox', { name: 'From', exact: true });
  await from.fill('Singapore');
  await expect(page.getByRole('option', { name: /Singapore/ })).toBeVisible();
  await from.press('ArrowDown');
  await from.press('Enter');
  await expect(from).toHaveValue('Singapore (SIN)');
  await from.fill('Unknown destination');
  await from.press('Escape');
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await expect(page.getByText('Choose a departure airport.')).toBeVisible();
});

test('late airport suggestions cannot replace a newer query, and retry works', async ({ page }) => {
  await page.route('**/api/airports?*', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('query');
    if (query === 'Paris') {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({
        json: { airports: [{ value: 'CDG', label: 'Paris', detail: 'CDG' }] },
      });
    } else
      await route.fulfill({
        json: { airports: [{ value: 'SIN', label: 'Singapore (SIN)', detail: 'Changi' }] },
      });
  });
  await page.goto('/');
  const from = page.getByRole('combobox', { name: 'From', exact: true });
  await from.fill('Paris');
  await page.waitForRequest('**/api/airports?query=Paris');
  await from.fill('Singapore');
  await expect(page.getByRole('option', { name: /Singapore/ })).toBeVisible();
  await page.waitForTimeout(900);
  await expect(page.getByRole('option', { name: /Paris/ })).toHaveCount(0);
  await page.route('**/api/airports?*', (route) =>
    route.fulfill({ status: 503, json: { message: 'Airport search unavailable.' } }),
  );
  await from.fill('London');
  await expect(page.getByRole('button', { name: 'Retry airport search' })).toBeVisible();
});

test('results sort, filter, paginate, and display accessible itinerary details', async ({
  page,
}) => {
  const offers = Array.from({ length: 25 }, (_, i) =>
    sampleOffer({ id: `offer-${i}`, amount: String(500 - i * 10), stops: i % 2 }),
  );
  offers.push(sampleOffer({ id: 'gbp', currency: 'GBP', amount: '50' }));
  await page.route('**/api/flights/search', (route) =>
    route.fulfill({ json: { testMode: true, offers } }),
  );
  await page.goto(searchUrl);
  await expect(page.getByRole('article')).toHaveCount(20);
  await expect(page.getByRole('article').first()).toContainText('USD 260.00');
  await page.getByRole('button', { name: /Show more/ }).click();
  await expect(page.getByRole('article')).toHaveCount(25);
  await page.getByRole('combobox', { name: 'Stops', exact: true }).selectOption('0');
  await expect(page.getByRole('article')).toHaveCount(13);
  await page.getByText('Filter by price (USD)', { exact: true }).click();
  await page.getByLabel('Maximum total (USD)').fill('300');
  await expect(page.getByRole('article')).toHaveCount(3);
  await page.getByLabel('Fare currency').selectOption('GBP');
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  const details = page.getByRole('button', { name: 'View details', exact: true }).first();
  await details.click();
  const dialog = page.getByRole('dialog', { name: 'Itinerary details' });
  await expect(dialog).toContainText('1 checked bag');
  await expect(dialog).toContainText('Changes before departure');
  await expect(dialog).toContainText('Booking is not available');
  await expect(dialog).toContainText('Duffel Airways');
  await expect(dialog).toHaveCSS('opacity', '1');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(details).toBeFocused();
});

test('round-trip cabin changes submit two-date criteria and show both journeys', async ({
  page,
}) => {
  let sent;
  await page.route('**/api/flights/search', (route) => {
    sent = route.request().postDataJSON();
    return route.fulfill({
      json: { testMode: true, offers: [sampleOffer({ returnDate: sent.filters.returnDate })] },
    });
  });
  await page.goto(`${searchUrl}&trip=round-trip&returnDate=2027-01-22`);
  await expect(page.getByRole('article')).toContainText('Return');
  await page.getByRole('combobox', { name: 'Cabin class', exact: true }).selectOption('business');
  await expect.poll(() => sent.filters.cabin).toBe('business');
  expect(sent.filters.returnDate).toBe('2027-01-22');
  await expect(page).toHaveURL(/cabin=business/);
});

test('empty, failed, filtered-out, and expired offers have recovery actions', async ({ page }) => {
  await page.route('**/api/flights/search', (route) =>
    route.fulfill({
      status: 504,
      json: { message: 'The search took too long. Please try again.' },
    }),
  );
  await page.goto(searchUrl);
  await expect(page.getByRole('main').getByRole('alert')).toContainText('too long');
  await page.route('**/api/flights/search', (route) =>
    route.fulfill({ json: { testMode: true, offers: [] } }),
  );
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No flights found' })).toBeVisible();
  await page.route('**/api/flights/search', (route) =>
    route.fulfill({
      json: { testMode: true, offers: [sampleOffer({ expiresAt: '2020-01-01T00:00:00Z' })] },
    }),
  );
  await page.reload();
  await expect(page.getByRole('heading', { name: 'These offers have expired' })).toBeVisible();
  await page.route('**/api/flights/search', (route) =>
    route.fulfill({ json: { testMode: true, offers: [sampleOffer()] } }),
  );
  await page.getByRole('button', { name: 'Search again', exact: true }).click();
  await page.getByText('Filter by price (USD)', { exact: true }).click();
  await page.getByLabel('Maximum total (USD)').fill('1');
  await expect(page.getByRole('heading', { name: 'No options match your filters' })).toBeVisible();
});

for (const width of [320, 393, 768, 1024, 1445]) {
  test(`results fit ${width}px and match accessible desktop/mobile layouts`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/flights/search', (route) =>
      route.fulfill({
        json: {
          testMode: true,
          offers: [sampleOffer(), sampleOffer({ id: 'other', amount: '462.00', stops: 1 })],
        },
      }),
    );
    await page.goto(searchUrl);
    await expect(page.getByRole('article')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/flights-${width}.png`, fullPage: true });
    if (width < 900) {
      await page.getByRole('button', { name: 'Edit flight search', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Edit flight search', exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('combobox', { name: 'From', exact: true })).toHaveValue(
        'Lagos',
      );
    }
  });
}

test('invalid URLs stay editable and malformed API inputs are rejected', async ({
  page,
  request,
}) => {
  await page.goto('/flights?children=999999999&departure=not-a-date');
  await expect(page.getByRole('heading', { name: 'Choose your journey' })).toBeVisible();
  expect((await request.post('/api/flights/search', { data: {} })).status()).toBe(400);
  expect(
    (
      await request.post('/api/flights/search', {
        data: 'invalid',
        headers: { 'Content-Type': 'application/json' },
      })
    ).status(),
  ).toBe(400);
  expect((await request.get('/api/airports?query=a')).status()).toBe(400);
});
