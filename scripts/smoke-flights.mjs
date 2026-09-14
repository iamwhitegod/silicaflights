import nextEnv from '@next/env';
import { mkdir, writeFile } from 'node:fs/promises';
import { createFlightService } from '../src/lib/flights/client.js';
import { readFlightConfig } from '../src/lib/flights/config.js';
import { safeError } from '../src/lib/flights/errors.js';
import { defaultFilters } from '../src/lib/flights/search.js';

nextEnv.loadEnvConfig(process.cwd());
const args = process.argv.slice(2);
if (
  args.length &&
  (args.length !== 2 || args[0] !== '--provider' || !['duffel', 'travelport'].includes(args[1]))
) {
  console.error('Usage: npm run test:flights -- [--provider duffel|travelport]');
  process.exit(1);
}
const env = { ...process.env, FLIGHTS_PROVIDER: args[1] || process.env.FLIGHTS_PROVIDER };
let config;
try {
  config = readFlightConfig(env);
} catch (error) {
  const safe = safeError(error);
  console.error(JSON.stringify({ status: safe.category, fields: safe.fields }));
  process.exit(1);
}

// Explicit override affects this command only, never the application or its .env file.
const search = createFlightService({ env, logger: () => {} });
const routes = [
  ['LOS', 'ABV', 'domestic'],
  ['ABV', 'PHC', 'domestic'],
  ['LOS', 'LHR', 'international'],
  ['ABV', 'LHR', 'international'],
];
const started = new Date();
const checks = [];
checksLoop: for (const [origin, destination, market] of routes)
  for (const daysAhead of [7, 14, 30]) {
    const date = new Date(started);
    date.setUTCDate(date.getUTCDate() + daysAhead);
    const departure = date.toISOString().slice(0, 10);
    const began = Date.now();
    let check = { origin, destination, market, departure, daysAhead };
    try {
      const result = await search({
        origin,
        destination,
        departure,
        filters: { ...defaultFilters },
      });
      const offers = result.offers.filter(
        (offer) => Number(offer.amount) > 0 && Date.parse(offer.expiresAt) > Date.now(),
      );
      check = {
        ...check,
        status: offers.length ? 'available' : 'empty',
        offers: offers.length,
        airlines: [
          ...new Set(
            offers.flatMap((offer) =>
              offer.slices.flatMap((slice) =>
                slice.segments.map((segment) => segment.carrier.code || segment.carrier.name),
              ),
            ),
          ),
        ].sort(),
        currencies: [...new Set(offers.map((offer) => offer.currency))].sort(),
      };
    } catch (error) {
      check = { ...check, status: safeError(error).category, offers: 0 };
    }
    check.elapsedMs = Date.now() - began;
    checks.push(check);
    console.log(JSON.stringify(check));
    // Authentication/configuration failures affect every route. Avoid eleven redundant calls.
    if (['configuration', 'authentication', 'rate_limit'].includes(check.status)) break checksLoop;
  }
const passed = checks.some((check) => check.status === 'available');
const report = {
  provider: config.provider,
  mode: config.provider === 'duffel' ? 'test' : 'preproduction',
  checkedAt: started.toISOString(),
  passed,
  domesticAvailable: checks.some(
    (check) => check.market === 'domestic' && check.status === 'available',
  ),
  internationalAvailable: checks.some(
    (check) => check.market === 'international' && check.status === 'available',
  ),
  checks,
  note: 'Search-only trial coverage. The search adapter excludes simulated Duffel Airways/ZZ itineraries. A fresh priced itinerary on another airline serving Nigeria passes the initial account check; production inventory still requires separate verification.',
};
await mkdir('test-results', { recursive: true });
const path = `test-results/flights-${config.provider}-coverage.json`;
await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify({
    provider: config.provider,
    passed,
    domesticAvailable: report.domesticAvailable,
    internationalAvailable: report.internationalAvailable,
    report: path,
  }),
);
if (!passed) process.exitCode = 1;
