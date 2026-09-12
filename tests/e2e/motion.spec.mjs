import { test, expect } from '@playwright/test';

test.use({ video: 'on' });

const advanced = (page) => page.getByRole('button', { name: 'Advanced settings', exact: true });
const modal = (page) => page.getByRole('dialog', { name: 'Advanced search', exact: true });

test('smooth anchors arrive at their targets and restore focus without interrupting search', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await page.getByRole('link', { name: 'Join Founders', exact: true }).click();
  await expect(page.locator('#founder-email')).toBeFocused();
  await expect
    .poll(() =>
      page.locator('#founder').evaluate((node) => Math.round(node.getBoundingClientRect().top)),
    )
    .toBe(32);
  await page.getByRole('link', { name: 'Explore flights to Dubai', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'To', exact: true })).toHaveValue('Dubai');
  await expect(page.getByRole('combobox', { name: 'To', exact: true })).toBeFocused();
  await expect
    .poll(() =>
      page
        .locator('#flight-search')
        .evaluate((node) => Math.round(node.getBoundingClientRect().top)),
    )
    .toBe(72);
  await page.keyboard.press('Escape');
  await advanced(page).click();
  await expect(modal(page)).toBeVisible();
});

test('modal locks smooth scrolling while nested time lists remain scrollable', async ({ page }) => {
  await page.goto('/');
  await advanced(page).click();
  await modal(page).getByRole('tab', { name: 'Schedule', exact: true }).click();
  await page.getByLabel('Earliest departure time', { exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Earliest departure time picker', exact: true });
  const minutes = popup.getByRole('listbox', { name: 'Minutes' });
  const before = await page.evaluate(() => window.scrollY);
  await minutes.hover();
  await page.mouse.wheel(0, 240);
  await expect.poll(() => minutes.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await page.mouse.move(2, 2);
  await page.mouse.wheel(0, 600);
  await expect(page.locator('html')).toHaveClass(/lenis-stopped/);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  await page.keyboard.press('Escape');
  await expect(popup).not.toBeVisible();
  await expect(modal(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal(page)).not.toBeVisible();
  await expect(advanced(page)).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 200);
});

test('rapid tab changes and repeated dialog closes retain a usable form', async ({ page }) => {
  await page.goto('/');
  for (let pass = 0; pass < 3; pass++) {
    await advanced(page).click();
    const first = modal(page).getByRole('tab', { name: 'Flight details', exact: true });
    await first.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(modal(page).getByRole('tab', { name: 'Schedule', exact: true })).toBeFocused();
    await expect(modal(page).getByRole('tabpanel')).toHaveCount(1);
    await expect(modal(page).getByRole('tabpanel')).toHaveCSS('opacity', '1');
    await page.keyboard.press('Escape');
    await expect(modal(page)).not.toBeVisible();
    await expect(advanced(page)).toBeFocused();
  }
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('changing reduced motion removes smoothing and reveals all content, even during a dialog', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await advanced(page).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await expect(modal(page)).toHaveCSS('opacity', '1');
  await page.keyboard.press('Escape');
  await expect(modal(page)).not.toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  for (const node of await page.locator('[data-motion-reveal], [data-hero-reveal]').all()) {
    await expect(node).toHaveCSS('opacity', '1');
    await expect(node).toHaveCSS('transform', 'none');
  }
  await page.getByRole('link', { name: 'Join Founders', exact: true }).click();
  await expect(page.locator('#founder-email')).toBeFocused();
  await expect(page.locator('#founder-email')).toBeInViewport();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).toHaveClass(/lenis/);
});

test('route changes and back navigation restore a working scroller without duplicate motion', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Join Founders', exact: true }).click();
  await expect(page.locator('#founder-email')).toBeInViewport();
  await page.goto('/design-system');
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await page.goBack();
  await expect(page.locator('html')).toHaveClass(/lenis/);
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(2, 2);
  await page.mouse.wheel(0, -300);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(before - 150);
  expect(errors).toEqual([]);
});

for (const width of [393, 1445]) {
  test.describe(`motion preview ${width}`, () => {
    test.use({
      viewport: { width, height: 900 },
      hasTouch: width < 768,
      isMobile: width < 768,
    });
    test('continuous scroll reveals sections without clipping and records the motion', async ({
      page,
    }, testInfo) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('#flight-search')).toHaveCSS('transform', 'none');
      if (width < 768) await expect(page.locator('html')).not.toHaveClass(/lenis/);
      await page.screenshot({ path: testInfo.outputPath('hero.png') });
      for (const selector of [
        '#how-title',
        '#destinations-title',
        '#founder-title',
        '#deals-title',
      ]) {
        const distance = await page
          .locator(selector)
          .evaluate((node) => node.getBoundingClientRect().top - window.innerHeight / 3);
        if (width < 768) {
          await page.evaluate(
            (delta) => window.scrollBy({ top: delta, behavior: 'smooth' }),
            distance,
          );
        } else {
          await page.mouse.move(2, 2);
          await page.mouse.wheel(0, distance);
        }
        await expect(page.locator(selector)).toBeInViewport();
        await expect
          .poll(() =>
            page
              .locator(selector)
              .evaluate((node) =>
                Math.abs(node.getBoundingClientRect().top - window.innerHeight / 3),
              ),
          )
          .toBeLessThan(35);
        const reveal = page
          .locator(selector)
          .locator('xpath=ancestor-or-self::*[@data-motion-reveal][1]');
        await expect(reveal).toHaveCSS('transform', 'none');
        await page.screenshot({ path: testInfo.outputPath(`${selector.slice(1)}.png`) });
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const video = page.video();
      await page.close();
      await testInfo.attach('Motion recording', {
        path: await video.path(),
        contentType: 'video/webm',
      });
    });
  });
}

test('keyboard skip link takes focus past the hero immediately', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await expect
    .poll(() =>
      page.locator('#main').evaluate((node) => Math.round(node.getBoundingClientRect().top)),
    )
    .toBe(32);
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Explore flights to Dubai', exact: true }),
  ).toBeFocused();
});
