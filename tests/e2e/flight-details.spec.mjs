import { test, expect } from '../support/fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';
import { sampleOffer } from '../../src/data/flight-fixtures.js';

for (const width of [320, 393, 1445]) {
  test(`round-trip itinerary remains readable and closable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const offer = sampleOffer({
      amount: '10409.46',
      returnDate: '2027-01-19',
      airline: 'American Airlines',
    });
    const origin = { code: 'ABV', city: 'Abuja', name: 'Nnamdi Azikiwe International Airport' };
    const destination = {
      code: 'YYZ',
      city: 'Toronto',
      name: 'Toronto Pearson International Airport',
    };
    for (const [index, slice] of offer.slices.entries()) {
      slice.duration = 'PT12H40M';
      const segment = slice.segments[0];
      segment.origin = index ? destination : origin;
      segment.destination = index ? origin : destination;
      segment.carrier.code = 'AA';
      segment.flightNumber = 'AA 4';
      segment.duration = 'PT12H40M';
      segment.passengers[0].cabinName = 'First';
      segment.passengers[0].baggage.push({ type: 'carry_on', quantity: 1 });
    }
    offer.slices[1].segments[0].arrivingAt = '2027-01-20T06:03:00';
    await page.route('**/api/flights/search', (route) =>
      route.fulfill({ json: { testMode: true, offers: [offer] } }),
    );
    await page.goto(
      '/flights?origin=ABV&destination=YYZ&departure=2027-01-15&trip=round-trip&returnDate=2027-01-19',
    );
    const trigger = page.getByRole('button', { name: 'View details', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Itinerary details' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('region', { name: 'Fare summary' })).toContainText(
      'USD 10,409.46',
    );
    await expect(dialog.getByText('20 Jan 2027', { exact: true })).toBeVisible();
    await expect(dialog.getByText('1 checked bag · 1 carry on bag', { exact: true })).toHaveCount(
      2,
    );
    expect(
      await dialog.evaluate((element) => {
        const viewport = element.querySelector('[data-lenis-prevent]');
        return viewport.scrollWidth <= viewport.clientWidth + 1;
      }),
    ).toBe(true);
    const outbound = await dialog
      .getByRole('heading', { name: 'Outbound', exact: true })
      .boundingBox();
    const inbound = await dialog
      .getByRole('heading', { name: 'Return', exact: true })
      .boundingBox();
    if (width >= 900) expect(inbound.y).toBe(outbound.y);
    else expect(inbound.y).toBeGreaterThan(outbound.y);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/itinerary-${width}.png` });
    await dialog.getByRole('heading', { name: 'Fare conditions' }).scrollIntoViewIfNeeded();
    const close = dialog.getByRole('button', { name: 'Close Itinerary details' });
    await expect(close).toBeInViewport();
    await close.click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}
