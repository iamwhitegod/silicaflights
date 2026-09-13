import { array, mixed, number, object, ref, string } from 'yup';
import { today } from '../dates.js';
import { cabins } from './search.js';

const travelerMessage = 'Choose between 1 and 9 travelers, including an adult.';
const childAgeMessage = 'Enter an age from 2 to 11 for each child on the departure date.';
const searchReturnMessage = 'Choose a return date on or after departure.';
const priceMessage = 'Enter a price of zero or more.';

// Keep date-only strings intact; casting to Date would normalize impossible dates.
const calendarDate = (message) =>
  string()
    .typeError(message)
    .test('calendar-date', message, (value) => {
      if (!value) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T12:00:00Z`);

      return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
    });

const returnDate = (departure, message) =>
  calendarDate(message).test(
    'after-departure',
    message,
    (value) => !value || value >= (departure || today()),
  );

const travelerCount = (minimum) =>
  number()
    .typeError(travelerMessage)
    .required(travelerMessage)
    .integer(travelerMessage)
    .min(minimum, travelerMessage)
    .max(9, travelerMessage);

const time = () =>
  string()
    .typeError('Choose a valid time.')
    .defined('Choose a valid time.')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
      message: 'Choose a valid time.',
      excludeEmptyString: true,
    });

const endTime = (start) =>
  time().test('time-order', 'The end must be on or after the start.', (value, context) => {
    const earliest = context.parent[start];

    return !value || !earliest || value >= earliest;
  });

export const flightSettingsSchema = object({
  trip: string()
    .typeError('Choose a supported trip type.')
    .oneOf(['one-way', 'round-trip'], 'Choose a supported trip type.')
    .required('Choose a supported trip type.'),
  cabin: string()
    .typeError('Choose a cabin class.')
    .oneOf(cabins, 'Choose a cabin class.')
    .required('Choose a cabin class.'),
  adults: travelerCount(1),
  children: travelerCount(0),
  infants: travelerCount(0).max(ref('adults'), 'Include at least one adult per infant.'),
  childAges: array()
    .typeError(childAgeMessage)
    .required(childAgeMessage)
    .of(
      number()
        .typeError(childAgeMessage)
        .required(childAgeMessage)
        .integer(childAgeMessage)
        .min(2, childAgeMessage)
        .max(11, childAgeMessage),
    )
    .length(ref('children'), childAgeMessage),
  returnDate: mixed()
    .nullable()
    .when(['trip', '$departure'], ([trip, departure], schema) =>
      trip === 'round-trip'
        ? returnDate(departure, 'Return must be on or after departure.')
        : schema,
    ),
  departTimeStart: time(),
  departTimeEnd: endTime('departTimeStart'),
  returnTimeStart: mixed()
    .nullable()
    .when('trip', { is: 'round-trip', then: () => time() }),
  returnTimeEnd: mixed()
    .nullable()
    .when('trip', { is: 'round-trip', then: () => endTime('returnTimeStart') }),
})
  .strict()
  .typeError('Review your search settings.')
  .required('Review your search settings.')
  .test('traveler-total', 'Search for up to 9 travelers at a time.', (values, context) => {
    if (!values) return true;
    const counts = [values.adults, values.children, values.infants];

    return (
      !counts.every(Number.isInteger) ||
      counts.reduce((total, count) => total + count, 0) <= 9 ||
      context.createError({ path: context.path ? `${context.path}.travelers` : 'travelers' })
    );
  });

const airport = (label) =>
  string()
    .typeError(`Choose a ${label} airport.`)
    .matches(/^[A-Z]{3}$/, `Choose a ${label} airport.`)
    .required(`Choose a ${label} airport.`);

export const flightSearchSchema = object({
  origin: airport('departure'),
  destination: airport('destination').when('origin', ([origin], schema) =>
    origin ? schema.notOneOf([origin], 'Choose a different destination airport.') : schema,
  ),
  departure: calendarDate('Choose today or a future departure date.')
    .required('Choose today or a future departure date.')
    .test(
      'not-past',
      'Choose today or a future departure date.',
      (value) => !value || value >= today(),
    ),
  filters: flightSettingsSchema.when('departure', ([departure], schema) =>
    schema.shape({
      returnDate: mixed()
        .nullable()
        .when('trip', {
          is: 'round-trip',
          then: () => returnDate(departure, searchReturnMessage).required(searchReturnMessage),
        }),
    }),
  ),
})
  .strict()
  .typeError('Check your search details.')
  .required('Check your search details.');

/** Preserve the search form/API error keys while Yup validates nested settings. */
export function searchFieldError(issue) {
  if (issue.path === 'filters.returnDate') return { path: 'returnDate', message: issue.message };
  if (issue.path === 'filters' || issue.path?.startsWith('filters.'))
    return {
      path: 'filters',
      message: 'Review the dates, times, and travelers in advanced settings.',
    };

  return issue;
}

/** Traveler number controls share a group-level error in the settings editor. */
export function settingsFieldError(issue) {
  if (['adults', 'children'].includes(issue.path) || !issue.path)
    return { path: 'travelers', message: issue.message };

  return issue;
}

const price = () =>
  number()
    .transform((value, original) => (original === '' ? undefined : value))
    .typeError(priceMessage)
    .min(0, priceMessage)
    .max(Number.MAX_VALUE, priceMessage)
    .optional();

export const flightPriceSchema = object({
  minPrice: price(),
  maxPrice: price().test(
    'price-order',
    'Maximum price must be at least the minimum.',
    (maximum, context) => {
      const minimum = context.parent.minPrice;

      return (
        !Number.isFinite(minimum) ||
        minimum < 0 ||
        !Number.isFinite(maximum) ||
        maximum < 0 ||
        maximum >= minimum
      );
    },
  ),
});
