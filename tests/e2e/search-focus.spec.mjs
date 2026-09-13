import { test, expect } from '../support/fixtures.mjs';

test.use({ hasTouch: true });

const resultsUrl =
  '/flights?origin=LOS&destination=LHR&departure=2027-01-15&originLabel=Lagos&destinationLabel=London';

for (const [surface, inputMethod] of [
  ['homepage', 'mouse'],
  ['homepage', 'keyboard'],
  ['homepage', 'touch'],
  ['desktop results', 'mouse'],
  ['mobile edit', 'touch'],
]) {
  test(`${surface} advances focus after ${inputMethod} selection without opening or submitting`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: inputMethod === 'touch' ? 393 : 1445, height: 900 });
    let searches = 0;
    page.on('request', (request) => {
      if (request.url().endsWith('/api/flights/search') && request.method() === 'POST') searches++;
    });
    await page.goto(surface === 'homepage' ? '/' : resultsUrl);
    let scope = page;
    if (surface !== 'homepage') await expect(page.getByRole('article').first()).toBeVisible();
    if (surface === 'mobile edit') {
      await page.getByRole('button', { name: 'Edit flight search', exact: true }).tap();
      scope = page.getByRole('dialog', { name: 'Edit flight search', exact: true });
    }
    const form = scope.getByRole('form', { name: 'Flight search', exact: true });
    const from = form.getByRole('combobox', { name: 'From', exact: true });
    const to = form.getByRole('combobox', { name: 'To', exact: true });
    const departure = form.getByRole('combobox', { name: 'Departure date', exact: true });
    const originalDestination = await to.inputValue();
    const originalDate = await departure.textContent();
    const originalUrl = page.url();
    const initialSearches = searches;
    async function choose(field, query, optionName) {
      if (inputMethod === 'touch') await field.tap();
      await field.fill(query);
      const option = form.getByRole('option', { name: optionName });
      await expect(option).toBeVisible();
      if (inputMethod === 'keyboard') {
        await field.press('ArrowDown');
        await field.press('Enter');
      } else if (inputMethod === 'touch') await option.tap();
      else await option.click();
    }
    await choose(from, 'Singapore', /Singapore/);
    await expect(from).toHaveValue('Singapore (SIN)');
    await expect(from).toHaveAttribute('aria-expanded', 'false');
    await expect(to).toBeFocused();
    await expect(to).toHaveValue(originalDestination);
    await expect(to).toHaveAttribute('aria-expanded', 'false');
    await expect(form.getByRole('listbox')).toHaveCount(0);

    await choose(to, 'Dubai', /Dubai/);
    await expect(to).toHaveValue('Dubai');
    await expect(to).toHaveAttribute('aria-expanded', 'false');
    await expect(departure).toBeFocused();
    await expect(departure).toHaveAttribute('aria-expanded', 'false');
    await expect(departure).toHaveText(originalDate);
    await expect(page.getByRole('dialog', { name: 'Departure date picker' })).toHaveCount(0);
    await expect(page).toHaveURL(originalUrl);
    expect(searches).toBe(initialSearches);
    if (surface === 'mobile edit') await expect(scope).toBeVisible();
  });
}

test('typing, clearing, suggestions and Escape preserve focus, with manual Tab and picker opening', async ({
  page,
}) => {
  await page.goto('/');
  const form = page.getByRole('form', { name: 'Flight search', exact: true });
  const from = form.getByRole('combobox', { name: 'From', exact: true });
  const to = form.getByRole('combobox', { name: 'To', exact: true });
  const departure = form.getByRole('combobox', { name: 'Departure date', exact: true });
  await from.focus();
  await expect(from).toHaveAttribute('aria-expanded', 'false');
  await from.fill('Singapore');
  await expect(form.getByRole('option', { name: /Singapore/ })).toBeVisible();
  await expect(from).toBeFocused();
  await from.fill('');
  await expect(from).toBeFocused();
  await from.press('Escape');
  await expect(from).toBeFocused();
  await from.press('Tab');
  await expect(to).toBeFocused();
  await expect(to).toHaveAttribute('aria-expanded', 'false');
  await to.press('ArrowDown');
  await expect(to).toHaveAttribute('aria-expanded', 'true');
  await to.press('Escape');
  await expect(to).toBeFocused();
  await to.press('Tab');
  await expect(departure).toBeFocused();
  await expect(departure).toHaveAttribute('aria-expanded', 'false');
  await departure.press('ArrowDown');
  const picker = page.getByRole('dialog', { name: 'Departure date picker' });
  await expect(picker).toBeVisible();
  await picker.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(picker).not.toBeVisible();
  await expect(departure).toBeFocused();
  await expect(page).toHaveURL('/');
});

test('failed airport lookup does not advance focus', async ({ page }) => {
  await page.route('**/api/airports?*', (route) =>
    route.fulfill({ status: 503, json: { message: 'Airport search unavailable.' } }),
  );
  await page.goto('/');
  const from = page.getByRole('combobox', { name: 'From', exact: true });
  await from.fill('Singapore');
  await expect(page.getByRole('button', { name: 'Retry airport search' })).toBeVisible();
  await expect(from).toBeFocused();
  await expect(page.getByRole('combobox', { name: 'To', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});
