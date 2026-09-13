import { today } from '../dates.js';

export const cabins = ['economy', 'premium economy', 'business', 'first'];
export const defaultFilters = {
  trip: 'one-way',
  cabin: 'economy',
  returnDate: '',
  departTimeStart: '',
  departTimeEnd: '',
  returnTimeStart: '',
  returnTimeEnd: '',
  adults: 1,
  children: 0,
  infants: 0,
  childAges: [],
};

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateFilters(values, departure = '') {
  if (!values || typeof values !== 'object') return { travelers: 'Review your search settings.' };
  const errors = {};
  if (!['one-way', 'round-trip'].includes(values.trip))
    errors.trip = 'Choose a supported trip type.';
  if (!cabins.includes(values.cabin)) errors.cabin = 'Choose a cabin class.';
  for (const key of ['adults', 'children', 'infants']) {
    if (
      !Number.isInteger(values[key]) ||
      values[key] < (key === 'adults' ? 1 : 0) ||
      values[key] > 9
    )
      errors.travelers = 'Choose between 1 and 9 travelers, including an adult.';
  }
  if (values.adults + values.children + values.infants > 9)
    errors.travelers = 'Search for up to 9 travelers at a time.';
  if (values.infants > values.adults) errors.infants = 'Include at least one adult per infant.';
  if (
    !Array.isArray(values.childAges) ||
    values.childAges.length !== values.children ||
    values.childAges.some((age) => !Number.isInteger(age) || age < 2 || age > 11)
  )
    errors.childAges = 'Enter an age from 2 to 11 for each child on the departure date.';
  if (
    values.trip === 'round-trip' &&
    values.returnDate &&
    (!validDate(values.returnDate) || values.returnDate < (departure || today()))
  )
    errors.returnDate = 'Return must be on or after departure.';
  for (const prefix of ['depart', ...(values.trip === 'round-trip' ? ['return'] : [])]) {
    const start = `${prefix}TimeStart`,
      end = `${prefix}TimeEnd`;
    for (const key of [start, end]) {
      if (
        typeof values[key] !== 'string' ||
        (values[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(values[key]))
      )
        errors[key] = 'Choose a valid time.';
    }
    if (values[start] && values[end] && values[end] < values[start])
      errors[end] = 'The end must be on or after the start.';
  }
  return errors;
}

export function validateSearch(values) {
  const errors = {};
  for (const [key, label] of [
    ['origin', 'departure'],
    ['destination', 'destination'],
  ]) {
    if (!/^[A-Z]{3}$/.test(values?.[key] || '')) errors[key] = `Choose a ${label} airport.`;
  }
  if (values?.origin && values.origin === values.destination)
    errors.destination = 'Choose a different destination airport.';
  if (!validDate(values?.departure) || values.departure < today())
    errors.departure = 'Choose today or a future departure date.';
  if (Object.keys(validateFilters(values?.filters, values?.departure)).length)
    errors.filters = 'Review the dates, times, and travelers in advanced settings.';
  if (
    values?.filters?.trip === 'round-trip' &&
    (!validDate(values.filters.returnDate) || values.filters.returnDate < values.departure)
  )
    errors.returnDate = 'Choose a return date on or after departure.';
  return errors;
}

export function createOfferRequest(values) {
  const f = values.filters;
  const slices = [
    { origin: values.origin, destination: values.destination, departure_date: values.departure },
  ];
  if (f.trip === 'round-trip')
    slices.push({
      origin: values.destination,
      destination: values.origin,
      departure_date: f.returnDate,
    });
  return {
    slices,
    cabin_class: f.cabin.replace(' ', '_'),
    passengers: [
      ...Array.from({ length: f.adults }, () => ({ type: 'adult' })),
      ...f.childAges.map((age) => ({ age })),
      ...Array.from({ length: f.infants }, () => ({ type: 'infant_without_seat' })),
    ],
  };
}

export function searchToQuery(values) {
  const query = new URLSearchParams();
  for (const key of ['origin', 'destination', 'departure', 'originLabel', 'destinationLabel'])
    if (values[key]) query.set(key, values[key]);
  for (const key of Object.keys(defaultFilters)) {
    const value = values.filters[key];
    if (Array.isArray(value)) {
      if (value.length) query.set(key, value.join(','));
    } else if (value !== '') query.set(key, String(value));
  }
  return query.toString();
}

export function searchFromQuery(params) {
  const get = (key) => (typeof params[key] === 'string' ? params[key] : '');
  const filters = { ...defaultFilters };
  for (const key of Object.keys(filters)) {
    if (!get(key)) continue;
    filters[key] =
      key === 'childAges'
        ? get(key).split(',').map(Number)
        : ['adults', 'children', 'infants'].includes(key)
          ? Number(get(key))
          : get(key);
  }
  for (const key of ['adults', 'children', 'infants']) {
    if (!Number.isInteger(filters[key]) || filters[key] < 0 || filters[key] > 9) filters[key] = 0;
  }
  return {
    origin: get('origin'),
    destination: get('destination'),
    departure: get('departure'),
    originLabel: get('originLabel').slice(0, 160),
    destinationLabel: get('destinationLabel').slice(0, 160),
    filters,
  };
}
