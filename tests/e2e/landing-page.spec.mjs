import { test, expect } from '../support/fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

async function choose(page, label, value) {
  const input = page.getByRole('combobox', { name: label, exact: true });
  await input.fill(value);
  await input.press('Enter');
}

for (const width of [320, 393, 768, 1024, 1445]) {
  test(`landing page fits ${width}px and shows all destinations`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Fly anywhere');
    await expect(page.getByRole('link', { name: /Explore flights to/ })).toHaveCount(6);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      for (const image of document.images) image.loading = 'eager';
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
    expect(
      await page
        .locator('img')
        .evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)),
    ).toBe(true);
    await mkdir('/tmp/silicaflights-preview', { recursive: true });
    // Capture every section in its settled state; motion recordings cover the reveals.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.screenshot({
      path: `/tmp/silicaflights-preview/landing-${width}.png`,
      fullPage: true,
    });
  });
}
test('search validates airports and dates, then opens flight results', async ({ page }) => {
  await page.goto('/');
  const form = page.getByRole('form', { name: 'Flight search', exact: true });
  await form.getByRole('button', { name: 'Search flights' }).click();
  await expect(form.getByText('Choose a departure airport.')).toBeVisible();
  await choose(page, 'From', 'Lagos');
  await choose(page, 'To', 'Lagos');
  await page.getByRole('combobox', { name: 'Departure date', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Departure date picker' })
    .getByRole('button', { name: 'Today', exact: true })
    .click();
  await form.getByRole('button', { name: 'Search flights' }).click();
  await expect(form.getByText('Choose a different destination airport.')).toBeVisible();
  await choose(page, 'To', 'Dubai');
  await form.getByRole('button', { name: 'Search flights' }).click();
  await expect(page).toHaveURL(/\/flights\?/);
  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.getByText(/Test mode · sample fares and schedules/)).toBeVisible();
});
test('advanced filters apply, cancel, clear, and validate ranges', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Advanced settings' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Advanced search', exact: true });
  await dialog.getByRole('radio', { name: 'Round trip', exact: true }).check();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await trigger.click();
  await expect(dialog.getByRole('radio', { name: 'One-way', exact: true })).toBeChecked();
  await dialog.getByRole('tab', { name: 'Travelers', exact: true }).click();
  await dialog.getByRole('button', { name: 'Increase Children (2–11 years)', exact: true }).click();
  await dialog.getByRole('button', { name: 'Apply filters' }).click();
  await expect(
    dialog.getByText('Enter an age from 2 to 11 for each child on the departure date.'),
  ).toBeVisible();
  await dialog.getByLabel('Child 1 age on departure').fill('5');
  await dialog.getByRole('button', { name: 'Apply filters' }).click();
  await trigger.click();
  await dialog.getByRole('tab', { name: 'Travelers', exact: true }).click();
  await expect(dialog.getByLabel('Child 1 age on departure')).toHaveValue('5');
  await dialog.getByRole('button', { name: 'Clear filters' }).click();
  await expect(dialog.getByLabel('Child 1 age on departure')).toHaveCount(0);
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(report.violations).toEqual([]);
});
test('destination links prefill search and founder navigation focuses email', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore flights to Dubai', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'To', exact: true })).toHaveValue('Dubai');
  await page.getByRole('link', { name: 'Join Founders', exact: true }).click();
  await expect(page.locator('#founder-email')).toBeFocused();
});
test('landing page meets automated accessibility checks', async ({ page }) => {
  // Audit the fully revealed page, with motion covered separately by motion.spec.mjs.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(report.violations).toEqual([]);
});
test('larger text reflows without clipping', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 125%; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
