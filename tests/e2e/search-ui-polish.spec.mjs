import { test, expect } from '../support/fixtures.mjs';
import { sampleOffer } from '../../src/data/flight-fixtures.js';

const searchUrl =
  '/flights?origin=LOS&destination=LHR&departure=2027-01-15&originLabel=Lagos&destinationLabel=London';

async function expectSameFrame(locator, initial) {
  const current = await locator.boundingBox();
  for (const property of ['x', 'y', 'width', 'height']) {
    expect(Math.abs(current[property] - initial[property])).toBeLessThan(1);
  }
}

for (const width of [320, 393, 768, 1024, 1445]) {
  test(`search controls stay pinned and usable while results scroll at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/flights/search', (route) =>
      route.fulfill({
        json: {
          testMode: true,
          offers: Array.from({ length: 20 }, (_, index) => sampleOffer({ id: `offer-${index}` })),
        },
      }),
    );
    await page.goto(searchUrl);
    await expect(page.getByRole('article')).toHaveCount(20);
    const header = page.locator('main > header');
    const before = await header.boundingBox();
    const stops = page.getByRole('combobox', { name: 'Stops', exact: true });
    const toolbarBefore = await stops.boundingBox();
    await page.evaluate(() => window.scrollTo(0, 650));
    await expect(header).toHaveAttribute('data-scrolled', 'true');
    await expectSameFrame(header, before);
    expect((await stops.boundingBox()).y).toBeLessThan(toolbarBefore.y - 600);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/search-sticky-${width}.png` });

    if (width < 900) {
      await page.getByRole('button', { name: 'Edit flight search', exact: true }).click();
      const edit = page.getByRole('dialog', { name: 'Edit flight search', exact: true });
      await expect(edit.getByRole('combobox', { name: 'From', exact: true })).toHaveValue('Lagos');
      await page.keyboard.press('Escape');
      await expect(edit).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Edit flight search' })).toBeFocused();
    } else {
      const from = header.getByRole('combobox', { name: 'From', exact: true });
      await from.fill('Singapore');
      await page.getByRole('option', { name: /Singapore/ }).click();
      await expect(from).toHaveValue('Singapore (SIN)');
    }
    await expectSameFrame(header, before);
    await page.getByRole('link', { name: 'Back to flight search' }).click();
    await expect(page).toHaveURL('/');
  });
}

for (const { width, height, largeText } of [
  { width: 320, height: 480 },
  { width: 393, height: 900 },
  { width: 768, height: 650 },
  { width: 1445, height: 900 },
  { width: 393, height: 650, largeText: true },
]) {
  test(`advanced filters keep their frame at ${width}×${height}${largeText ? ' with enlarged text' : ''}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    if (largeText) {
      await page.addStyleTag({ content: 'html { font-size: 125%; }' });
    }
    await page.getByRole('button', { name: 'Advanced settings', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Advanced search', exact: true });
    const apply = modal.getByRole('button', { name: 'Apply filters' });
    const close = modal.getByRole('button', { name: 'Close Advanced search' });
    const clear = modal.getByRole('button', { name: 'Clear filters' });
    const initial = await modal.boundingBox();
    const footer = await apply.boundingBox();
    const closeBox = await close.boundingBox();
    const clearBox = await clear.boundingBox();
    const rem = largeText ? 20 : 10;
    expect(initial.height).toBeCloseTo(
      Math.min((width < 900 ? 44.2 : 43.4) * rem, height - 3.2 * rem),
      0,
    );
    expect(initial.x).toBeGreaterThanOrEqual(0);
    expect(initial.x + initial.width).toBeLessThanOrEqual(width);
    expect(clearBox.x + clearBox.width).toBeLessThanOrEqual(closeBox.x);
    expect(
      Math.abs(clearBox.y + clearBox.height / 2 - closeBox.y - closeBox.height / 2),
    ).toBeLessThan(1);
    expect(footer.y + footer.height).toBeLessThan(height);
    await page.screenshot({
      path: `test-results/advanced-details-${width}-${largeText ? 'large' : 'normal'}.png`,
    });

    await modal.getByRole('tab', { name: 'Schedule', exact: true }).click();
    await expectSameFrame(modal, initial);
    await expectSameFrame(apply, footer);
    await modal.getByRole('tab', { name: 'Travelers', exact: true }).click();
    await modal.getByRole('spinbutton', { name: 'Children (2–11 years)', exact: true }).fill('8');
    await apply.click();
    await expect(modal.getByRole('tab', { name: 'Travelers', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expectSameFrame(modal, initial);
    await expectSameFrame(apply, footer);
    const lastChild = modal.getByRole('spinbutton', {
      name: 'Child 8 age on departure',
      exact: true,
    });
    await lastChild.fill('8');
    await lastChild.scrollIntoViewIfNeeded();
    const panel = modal.getByRole('tabpanel');
    expect(await panel.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    const lastBox = await lastChild.boundingBox();
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(footer.y);
    await expectSameFrame(modal, initial);
    await expectSameFrame(close, closeBox);
    await page.screenshot({
      path: `test-results/advanced-travelers-${width}-${largeText ? 'large' : 'normal'}.png`,
    });
    await clear.click();
    await expect(modal.getByRole('spinbutton', { name: /Child 8 age/ })).toHaveCount(0);
    await expect(modal.getByRole('tab', { name: 'Travelers', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(modal.locator('[aria-invalid="true"]')).toHaveCount(0);
    await apply.focus();
    await page.keyboard.press('Tab');
    await expect(clear).toBeFocused();
  });
}

test('clearing advanced filters stays in the draft until Apply and selected pills use the design blue', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Advanced settings', exact: true });
  const modal = page.getByRole('dialog', { name: 'Advanced search', exact: true });
  const business = modal.getByRole('radio', { name: 'Business', exact: true });
  await open.click();
  await business.check();
  const pill = modal
    .locator('label')
    .filter({ has: page.getByRole('radio', { name: 'Business', exact: true }) })
    .locator('span');
  await expect(pill).toHaveCSS('background-color', 'rgb(67, 126, 253)');
  await expect(pill).toHaveCSS('color', 'rgb(0, 25, 65)');
  await pill.hover();
  await page.mouse.down();
  await expect(pill).toHaveCSS('background-color', 'rgb(67, 126, 253)');
  await page.mouse.up();
  await modal.getByRole('button', { name: 'Apply filters' }).click();

  for (const dismiss of ['Cancel', 'Close Advanced search', 'Escape']) {
    await open.click();
    await expect(business).toBeChecked();
    await modal.getByRole('button', { name: 'Clear filters' }).click();
    await expect(modal.getByRole('radio', { name: 'Economy', exact: true })).toBeChecked();
    if (dismiss === 'Escape') await page.keyboard.press('Escape');
    else await modal.getByRole('button', { name: dismiss, exact: true }).click();
    await expect(modal).not.toBeVisible();
  }

  await open.click();
  await expect(business).toBeChecked();
  await modal.getByRole('button', { name: 'Clear filters' }).click();
  await modal.getByRole('button', { name: 'Apply filters' }).click();
  await open.click();
  await expect(modal.getByRole('radio', { name: 'Economy', exact: true })).toBeChecked();
});
