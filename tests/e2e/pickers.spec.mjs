import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const field = (page, label) => page.getByLabel(label, { exact: true });
const picker = (page, label) => page.getByRole('dialog', { name: `${label} picker`, exact: true });

async function selectTime(page, label, hour, minute) {
  await field(page, label).click();
  const popup = picker(page, label);
  await popup
    .getByRole('listbox', { name: 'Hours' })
    .getByRole('option', { name: hour, exact: true })
    .click();
  await popup
    .getByRole('listbox', { name: 'Minutes' })
    .getByRole('option', { name: minute, exact: true })
    .click();
  await popup.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(popup).not.toBeVisible();
}

test('calendar respects date bounds, leap days, clearing, and keyboard selection', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-09-12T12:00:00Z'));
  await page.goto('/design-system');
  const trigger = field(page, 'Date with limits');
  await expect(trigger).toContainText('29 Feb 2028');
  await trigger.click();
  const popup = picker(page, 'Date with limits');
  await expect(popup.getByRole('heading')).toContainText('February 2028');
  await expect(popup.getByRole('button', { name: 'Today', exact: true })).toBeDisabled();
  await expect(popup.getByRole('button', { name: /27 February/ })).toBeDisabled();
  const leapDay = popup.getByRole('button', { name: /29 February/ });
  await expect(leapDay).toBeFocused();
  await leapDay.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(trigger).toContainText('1 Mar 2028');
  await expect(trigger).toBeFocused();
  await expect(page.locator('input[name="bounded-date"]')).toHaveValue('2028-03-01');
  await trigger.click();
  await expect(popup.getByRole('button', { name: /, 3 March/ })).toBeDisabled();
  await popup.getByRole('button', { name: /, 2 March/ }).click();
  await expect(trigger).toContainText('2 Mar 2028');
  await trigger.click();
  await popup.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(trigger).toContainText('Select date');
  await expect(page.locator('input[name="bounded-date"]')).toHaveValue('');
  await trigger.click();
  await expect(popup.getByRole('heading')).toContainText('February 2028');
});

test('time selection commits midnight and end of day, while dismissing discards edits', async ({
  page,
}) => {
  await page.goto('/design-system');
  const trigger = field(page, 'Travel time');
  const popup = picker(page, 'Travel time');
  await expect(trigger).toContainText('HH:mm');
  await selectTime(page, 'Travel time', '23', '59');
  await expect(trigger).toContainText('23:59');
  await expect(trigger).toBeFocused();
  await trigger.click();
  const hours = popup.getByRole('listbox', { name: 'Hours' });
  await expect(hours.getByRole('option', { name: '23', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await hours.getByRole('option', { name: '00', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(popup).not.toBeVisible();
  await expect(trigger).toContainText('23:59');
  await trigger.click();
  await expect(hours.getByRole('option', { name: '23', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await popup.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(trigger).toContainText('HH:mm');
  await selectTime(page, 'Travel time', '00', '00');
  await expect(trigger).toContainText('00:00');
});

test('picker states and open calendar/time dialogs pass accessibility checks', async ({ page }) => {
  await page.goto('/design-system');
  await expect(field(page, 'Unavailable date')).toBeDisabled();
  await field(page, 'Read-only time').click();
  await expect(picker(page, 'Read-only time')).not.toBeVisible();
  await expect(field(page, 'Time needing attention')).toHaveAttribute('aria-invalid', 'true');
  for (const label of ['Date with limits', 'Travel time']) {
    await field(page, label).click();
    await expect(picker(page, label)).toBeVisible();
    await expect(page.locator('[data-picker-popover]')).toHaveCSS('opacity', '1');
    const report = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(report.violations).toEqual([]);
    await page.keyboard.press('Escape');
  }
});

test('time lists support keyboard selection and outside dismissal discards the draft', async ({
  page,
}) => {
  await page.goto('/design-system');
  const trigger = field(page, 'Travel time');
  const popup = picker(page, 'Travel time');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  const hours = popup.getByRole('listbox', { name: 'Hours' });
  await hours.getByRole('option', { name: '00', exact: true }).focus();
  await page.keyboard.press('End');
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(popup.getByRole('status', { name: 'Selected time' })).toHaveText('23:01');
  await popup.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(trigger).toContainText('23:01');
  await trigger.click();
  await hours.getByRole('option', { name: '00', exact: true }).click();
  await page.mouse.click(2, 2);
  await expect(popup).not.toBeVisible();
  await expect(trigger).toContainText('23:01');
});

for (const [timezoneId, localDay] of [
  ['America/Los_Angeles', 11],
  ['Pacific/Kiritimati', 12],
]) {
  test.describe(timezoneId, () => {
    test.use({ timezoneId });
    test('date-only values do not shift and Today follows the local date', async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-09-12T00:30:00Z'));
      await page.goto('/design-system');
      const bounded = field(page, 'Date with limits');
      await expect(bounded).toContainText('29 Feb 2028');
      await bounded.click();
      await picker(page, 'Date with limits')
        .getByRole('button', { name: /, 28 February/ })
        .click();
      await expect(bounded).toContainText('28 Feb 2028');
      await expect(page.locator('input[name="bounded-date"]')).toHaveValue('2028-02-28');
      await page.goto('/');
      const departure = field(page, 'Departure date');
      await departure.click();
      const popup = picker(page, 'Departure date');
      await expect(
        popup.getByRole('button', { name: new RegExp(`, ${localDay - 1} September`) }),
      ).toBeDisabled();
      await popup.getByRole('button', { name: 'Today', exact: true }).click();
      await expect(departure).toContainText(`${localDay} Sept 2026`);
    });
  });
}

for (const width of [320, 1445]) {
  test(`nested pickers fit ${width}px, contain focus, and close before the parent dialog`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const advanced = page.getByRole('button', { name: 'Advanced settings', exact: true });
    await advanced.click();
    const modal = page.getByRole('dialog', { name: 'Advanced search', exact: true });
    await modal.getByRole('radio', { name: 'Round trip', exact: true }).check();
    await modal.getByRole('tab', { name: 'Schedule', exact: true }).click();
    for (const label of ['Earliest departure', 'Earliest return time']) {
      const trigger = field(page, label);
      await trigger.click();
      const popup = picker(page, label);
      await expect(popup).toBeVisible();
      const box = await page.locator('[data-picker-popover]').boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(15);
      expect(box.x + box.width).toBeLessThanOrEqual(width - 15);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(900);
      const last = popup.getByRole('button', {
        name: label.includes('time') ? 'Done' : 'Today',
        exact: true,
      });
      await last.focus();
      await page.keyboard.press('Tab');
      expect(await popup.evaluate((element) => element.contains(document.activeElement))).toBe(
        true,
      );
      await page.screenshot({
        path: `test-results/${label.includes('time') ? 'time' : 'date'}-picker-${width}.png`,
      });
      await page.keyboard.press('Escape');
      await expect(popup).not.toBeVisible();
      await expect(modal).toBeVisible();
      await expect(trigger).toBeFocused();
    }
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
    await expect(advanced).toBeFocused();
  });
}

test('advanced schedule retains validation, applies values, and cancels or clears drafts', async ({
  page,
}) => {
  await page.goto('/');
  const advanced = page.getByRole('button', { name: 'Advanced settings', exact: true });
  const modal = page.getByRole('dialog', { name: 'Advanced search', exact: true });
  await advanced.click();
  await modal.getByRole('radio', { name: 'Round trip', exact: true }).check();
  await modal.getByRole('tab', { name: 'Schedule', exact: true }).click();
  await selectTime(page, 'Earliest departure time', '23', '59');
  await selectTime(page, 'Latest departure time', '00', '00');
  await modal.getByRole('button', { name: 'Apply filters' }).click();
  await expect(modal.getByText('The end must be on or after the start.')).toBeVisible();
  await expect(field(page, 'Latest departure time')).toHaveAttribute('aria-invalid', 'true');
  await selectTime(page, 'Latest departure time', '23', '59');
  await selectTime(page, 'Earliest return time', '00', '00');
  await selectTime(page, 'Latest return time', '21', '50');
  await modal.getByRole('button', { name: 'Apply filters' }).click();
  await expect(modal).not.toBeVisible();
  await advanced.click();
  await modal.getByRole('tab', { name: 'Schedule', exact: true }).click();
  await expect(field(page, 'Latest return time')).toContainText('21:50');
  await selectTime(page, 'Latest return time', '22', '30');
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  await advanced.click();
  await modal.getByRole('tab', { name: 'Schedule', exact: true }).click();
  await expect(field(page, 'Latest return time')).toContainText('21:50');
  await modal.getByRole('button', { name: 'Clear filters' }).click();
  await expect(field(page, 'Earliest departure time')).toContainText('HH:mm');
});
