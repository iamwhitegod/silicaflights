import { parseDate } from '@internationalized/date';

/** Parse a date-only value without converting it through a timezone. */
export function parseDateValue(value) {
  if (!value) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

export function formatDateValue(value) {
  const date = parseDateValue(value);
  return date
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date.toDate('UTC'))
    : '';
}
