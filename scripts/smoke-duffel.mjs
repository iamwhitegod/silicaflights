import nextEnv from '@next/env';
import { searchFlights, searchAirports } from '../src/lib/flights/duffel-client.js';
import { defaultFilters } from '../src/lib/flights/search.js';

nextEnv.loadEnvConfig(process.cwd());
const token = process.env.DUFFEL_ACCESS_TOKEN;
const date = new Date();
date.setUTCDate(date.getUTCDate() + 30);
try {
  const airports = await searchAirports('Singapore', undefined, { token });
  const result = await searchFlights(
    {
      origin: 'LHR',
      destination: 'JFK',
      departure: date.toISOString().slice(0, 10),
      filters: { ...defaultFilters },
    },
    undefined,
    { token },
  );
  console.log(
    JSON.stringify({
      testMode: result.testMode,
      airportSuggestions: airports.length,
      offers: result.offers.length,
      currencies: [...new Set(result.offers.map((o) => o.currency))],
    }),
  );
  if (!airports.length || !result.offers.length) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
