/**
 * @typedef {{trip: string, cabin: string, minPrice: string, maxPrice: string,
 *   departStart: string, departEnd: string, departTimeStart: string,
 *   departTimeEnd: string, returnStart: string, returnEnd: string,
 *   returnTimeStart: string, returnTimeEnd: string,
 *   adults: number, children: number, infants: number}} FlightFilters
 */

/** @type {FlightFilters} */
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
