import test from 'node:test';
import assert from 'node:assert/strict';
import { object, string } from 'yup';
import { validateForm } from '../../src/lib/validation.js';
import { defaultFilters } from '../../src/lib/flights/search.js';
import {
  flightPriceSchema,
  flightSearchSchema,
  flightSettingsSchema,
  searchFieldError,
  settingsFieldError,
} from '../../src/lib/flights/schemas.js';
import { founderSignupSchema, weeklyDealsSchema } from '../../src/components/signup/schemas.js';

const journey = {
  origin: 'LOS',
  destination: 'LHR',
  departure: '2096-02-29',
  filters: { ...defaultFilters },
};

test('signup schemas normalize submissions and keep founder name optional', () => {
  const input = {
    name: '  Alex Morgan  ',
    email: '  alex+deals@example.com  ',
    departures: ['Lagos'],
    interests: ['London'],
  };
  const result = validateForm(weeklyDealsSchema, input);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.values, {
    ...input,
    name: 'Alex Morgan',
    email: 'alex+deals@example.com',
  });
  assert.equal(input.name, '  Alex Morgan  ');
  assert.deepEqual(validateForm(founderSignupSchema, { email: 'alex@example.com' }).errors, {});
  assert.deepEqual(validateForm(weeklyDealsSchema, { name: '  ', email: 'invalid' }).errors, {
    name: 'Enter your full name.',
    email: 'Enter a valid email address.',
  });
  for (const email of ['', ' ', 'alex@@example.com', 'alex example.com', null, 123])
    assert.ok(validateForm(founderSignupSchema, { email }).errors.email);
  assert.ok(validateForm(weeklyDealsSchema, { email: 'a@example.com', name: 123 }).errors.name);
});

test('flight schemas reject malformed objects and coercible API values', () => {
  assert.equal(flightSearchSchema.isValidSync(journey), true);
  for (const filters of [
    undefined,
    null,
    [],
    'settings',
    {},
    { ...defaultFilters, adults: '1' },
    { ...defaultFilters, adults: 1.5 },
    { ...defaultFilters, children: true },
    { ...defaultFilters, children: 1, childAges: ['5'] },
    { ...defaultFilters, children: 1, childAges: [] },
    { ...defaultFilters, children: 0, childAges: [5] },
    { ...defaultFilters, infants: 2 },
  ]) {
    const result = validateForm(
      flightSearchSchema,
      { ...journey, filters },
      { mapError: searchFieldError },
    );
    assert.ok(result.errors.filters, JSON.stringify(filters));
    assert.equal(result.values, undefined);
  }
  for (const input of [undefined, null, [], 'search'])
    assert.ok(Object.keys(validateForm(flightSearchSchema, input).errors).length);
});

test('calendar dates remain exact strings, including leap days and date ordering', () => {
  for (const departure of ['2095-02-29', '2096-02-30', '2096-13-01', '2096-2-29', '2000-01-01'])
    assert.ok(validateForm(flightSearchSchema, { ...journey, departure }).errors.departure);
  assert.equal(flightSearchSchema.validateSync(journey).departure, '2096-02-29');
  for (const returnDate of ['', '2096-02-28', '2096-04-31']) {
    const result = validateForm(
      flightSearchSchema,
      { ...journey, filters: { ...defaultFilters, trip: 'round-trip', returnDate } },
      { mapError: searchFieldError },
    );
    assert.equal(result.errors.returnDate, 'Choose a return date on or after departure.');
  }
  assert.equal(
    flightSearchSchema.isValidSync({
      ...journey,
      filters: { ...defaultFilters, trip: 'round-trip', returnDate: journey.departure },
    }),
    true,
  );
});

test('advanced settings allow an unfinished return date but enforce time and traveler rules', () => {
  const options = { context: { departure: journey.departure }, mapError: settingsFieldError };
  const roundTrip = { ...defaultFilters, trip: 'round-trip' };
  assert.deepEqual(validateForm(flightSettingsSchema, roundTrip, options).errors, {});
  assert.ok(
    validateForm(flightSettingsSchema, { ...roundTrip, returnDate: '2096-02-28' }, options).errors
      .returnDate,
  );
  assert.equal(
    validateForm(
      flightSettingsSchema,
      { ...roundTrip, departTimeStart: '23:59', departTimeEnd: '00:00' },
      options,
    ).errors.departTimeEnd,
    'The end must be on or after the start.',
  );
  assert.ok(
    validateForm(flightSettingsSchema, { ...roundTrip, returnTimeStart: '24:00' }, options).errors
      .returnTimeStart,
  );
  assert.deepEqual(
    validateForm(flightSettingsSchema, { ...defaultFilters, returnTimeStart: '24:00' }, options)
      .errors,
    {},
  );
  assert.ok(
    validateForm(flightSettingsSchema, { ...defaultFilters, adults: 9, infants: 1 }, options).errors
      .travelers,
  );
  assert.ok(
    validateForm(flightSettingsSchema, { ...defaultFilters, children: 1, childAges: [''] }, options)
      .errors.childAges,
  );
});

test('price filters allow open ranges, parse numeric inputs, and reject invalid bounds', () => {
  assert.deepEqual(validateForm(flightPriceSchema, { minPrice: '', maxPrice: '' }).errors, {});
  assert.deepEqual(flightPriceSchema.validateSync({ minPrice: '0', maxPrice: '12.50' }), {
    minPrice: 0,
    maxPrice: 12.5,
  });
  assert.deepEqual(validateForm(flightPriceSchema, { minPrice: '50', maxPrice: '' }).errors, {});
  assert.equal(
    validateForm(flightPriceSchema, { minPrice: '50', maxPrice: '49' }).errors.maxPrice,
    'Maximum price must be at least the minimum.',
  );
  for (const maximum of ['-1', 'Infinity', 'invalid'])
    assert.equal(
      validateForm(flightPriceSchema, { minPrice: '0', maxPrice: maximum }).errors.maxPrice,
      'Enter a price of zero or more.',
    );
});

test('Yup error adapter collects fields without swallowing application errors', () => {
  const schema = object({ first: string().required('First required'), last: string().required() });
  const result = validateForm(schema, { first: '', last: '' });
  assert.equal(result.errors.first, 'First required');
  assert.ok(result.errors.last);
  const failure = new Error('Unexpected failure');
  assert.throws(
    () =>
      validateForm(
        string().test('broken', () => {
          throw failure;
        }),
        'input',
      ),
    (error) => error === failure,
  );
});
