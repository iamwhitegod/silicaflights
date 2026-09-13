import { test, expect } from '../support/fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/design-system');
});
test('foundations use local fonts, rem sizing, and stable focus borders', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe(
    '10px',
  );
  const input = page.getByLabel('Your name', { exact: true });
  const before = await input.boundingBox();
  await input.focus();
  expect((await input.boundingBox()).height).toBe(before.height);
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = 'eager';
    await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
  });
  await page.screenshot({ path: 'test-results/design-system-desktop.png', fullPage: true });
});
test('combobox supports no results and keyboard selection', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'Departure airport' });
  await input.fill('zzzz');
  await expect(page.getByText('No matching places. Try another city.')).toBeVisible();
  await input.fill('lag');
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveValue('Lagos');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
});
test('tabs skip disabled choices and modal restores focus', async ({ page }) => {
  const first = page.getByRole('tab', { name: 'Overview', exact: true });
  await first.focus();
  await first.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Details', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(first).toBeFocused();
  const trigger = page.getByRole('button', { name: 'Open example modal' });
  await trigger.click();
  const modal = page.getByRole('dialog', { name: 'A place for the details' });
  await expect(modal).toBeVisible();
  const done = modal.getByRole('button', { name: 'Done' });
  await done.focus();
  await page.keyboard.press('Tab');
  await expect(modal.getByRole('button', { name: 'Close A place for the details' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
test('signup validates, simulates failure, retries, and removes chips', async ({ page }) => {
  const form = page.getByRole('form', { name: 'Weekly deals signup' });
  await form.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(form.getByText('Enter your full name.')).toBeVisible();
  await form.getByLabel('Full name').fill('Alex Morgan');
  await form.getByLabel('Email address').fill('alex@example.com');
  const places = form.getByRole('combobox', { name: 'Places of interest' });
  await places.fill('Nigeria');
  await places.press('Enter');
  await form.getByRole('button', { name: 'Remove Nigeria' }).click();
  await expect(form.getByRole('button', { name: 'Remove Nigeria' })).toHaveCount(0);
  await page.getByLabel('Simulate submission failure').check();
  await form.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(form.getByText('The demo request failed. Please try again.')).toBeVisible();
  await page.getByLabel('Simulate submission failure').uncheck();
  await form.getByRole('button', { name: 'Try again' }).click();
  await expect(form.getByRole('status')).toContainText('Nothing was submitted');
});
test('design system has no serious accessibility violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(report.violations).toEqual([]);
});
test('components fit a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/design-system-mobile.png', fullPage: true });
});
