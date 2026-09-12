export const defaultFilters = {
  trip: 'one-way',
  cabin: 'economy',
  minPrice: '',
  maxPrice: '',
  departStart: '',
  departEnd: '',
  departTimeStart: '',
  departTimeEnd: '',
  returnStart: '',
  returnEnd: '',
  returnTimeStart: '',
  returnTimeEnd: '',
  adults: 1,
  children: 0,
  infants: 0,
};

export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validateSignup(values, weekly = false) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Enter a valid email address.';
  if (weekly && !values.name?.trim()) errors.name = 'Enter your full name.';
  return errors;
}

export function validateFilters(values, departure = '') {
  const errors = {};

  for (const key of ['minPrice', 'maxPrice'])
    if (values[key] !== '' && (!Number.isFinite(Number(values[key])) || Number(values[key]) < 0))
      errors[key] = 'Enter a price of zero or more.';

  if (
    values.minPrice !== '' &&
    values.maxPrice !== '' &&
    Number(values.minPrice) > Number(values.maxPrice)
  )
    errors.maxPrice = 'Maximum price must be at least the minimum.';

  for (const key of ['departStart', 'departEnd', 'returnStart', 'returnEnd']) {
    if (key.startsWith('return') && values.trip !== 'round-trip') continue;
    if (values[key] && values[key] < today()) errors[key] = 'Choose today or a future date.';
  }

  for (const [start, end] of [
    ['departStart', 'departEnd'],
    ['departTimeStart', 'departTimeEnd'],
    ...(values.trip === 'round-trip'
      ? [
          ['returnStart', 'returnEnd'],
          ['returnTimeStart', 'returnTimeEnd'],
        ]
      : []),
  ]) {
    if (values[start] && values[end] && values[end] < values[start])
      errors[end] = 'The end must be on or after the start.';
  }
  if (
    values.trip === 'round-trip' &&
    values.returnStart &&
    values.returnStart < (values.departStart || departure)
  )
    errors.returnStart = 'Return must be on or after departure.';

  if (values.infants > values.adults) errors.infants = 'Include at least one adult per infant.';

  return errors;
}

export function validateSearch(values) {
  const errors = {};

  if (!values.origin) errors.origin = 'Choose a departure airport.';

  if (!values.destination) errors.destination = 'Choose a destination airport.';

  if (values.origin && values.origin === values.destination)
    errors.destination = 'Choose a different destination airport.';

  if (!values.departure || values.departure < today())
    errors.departure = 'Choose today or a future departure date.';

  if (Object.keys(validateFilters(values.filters, values.departure)).length)
    errors.filters = 'Review the dates and ranges in advanced settings.';

  return errors;
}
export async function demoSubmit() {
  await new Promise((resolve) => setTimeout(resolve, 700));
}
export async function demoFailure() {
  await demoSubmit();
  throw new Error('The demo request failed. Please try again.');
}
