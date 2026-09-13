import 'server-only';
import { searchFlights as flights, searchAirports as airports } from './duffel-client';
export { serviceErrorResponse } from './duffel-client';

export function searchFlights(values, signal) {
  return flights(values, signal, { token: process.env.DUFFEL_ACCESS_TOKEN });
}
export function searchAirports(query, signal) {
  return airports(query, signal, { token: process.env.DUFFEL_ACCESS_TOKEN });
}
