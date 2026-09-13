import { test, expect } from '../support/fixtures.mjs';

test('palette previews group every generated color and show matching values', async ({ page }) => {
  await page.goto('/design-system');
  const blue = page.getByRole('region', { name: 'Blue', exact: true });
  await expect(blue.getByText('blue-700', { exact: true })).toBeVisible();

  const palette = await page.locator('[data-color-token]').evaluateAll((elements) => ({
    properties: Array.from(getComputedStyle(document.documentElement))
      .filter((name) => name.startsWith('--color-'))
      .map((name) => name.slice('--color-'.length))
      .sort(),
    swatches: elements.map((element) => ({
      token: element.dataset.colorToken,
      value: element.querySelector('code').textContent,
      background: getComputedStyle(element.querySelector('div')).backgroundColor,
      group: element.closest('section').getAttribute('aria-labelledby'),
    })),
  }));
  expect(palette.swatches.map(({ token }) => token).sort()).toEqual(palette.properties);

  for (const { token, value, background, group } of palette.swatches) {
    expect(value).toMatch(/^#[\dA-F]{3}(?:[\dA-F]{3})?$/);
    const hex =
      value.length === 4 ? [...value.slice(1)].map((part) => part + part).join('') : value.slice(1);
    const channels = hex.match(/../g).map((part) => parseInt(part, 16));
    expect(background).toBe(`rgb(${channels.join(', ')})`);
    expect(group).toBe(`palette-${token.match(/^(.+)-\d+$/)?.[1] ?? 'base'}`);
  }

  const blueNames = await blue
    .locator('[data-color-token]')
    .evaluateAll((elements) => elements.map((element) => element.dataset.colorToken));
  expect(blueNames).toEqual(
    [...blueNames].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })),
  );

  await page.addStyleTag({ content: ':root { --color-blue-700: #123456; }' });
  const changedSwatch = blue.locator('[data-color-token="blue-700"]');
  await expect(changedSwatch.locator('code')).toHaveText('#123456');
  await expect(changedSwatch.locator('div')).toHaveCSS('background-color', 'rgb(18, 52, 86)');
});

test('raw typography tokens preserve heading and footer sizes across breakpoints', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  for (const width of [393, 768, 1023, 1024, 1445]) {
    await page.setViewportSize({ width, height: 900 });
    const desktop = width >= 1024;
    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS(
      'font-size',
      desktop ? '56px' : '32px',
    );
    await expect(page.getByRole('heading', { name: 'How it works', exact: true })).toHaveCSS(
      'font-size',
      desktop ? '48px' : '32px',
    );
    await expect(page.getByRole('contentinfo').getByRole('heading')).toHaveCSS(
      'font-size',
      desktop ? '48px' : width >= 768 ? '32px' : '24px',
    );
    await expect(page.getByRole('button', { name: 'Search flights', exact: true })).toHaveCSS(
      'background-color',
      'rgb(252, 203, 95)',
    );
  }
});
