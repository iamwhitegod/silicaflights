import catalog from '../data/airport-catalog.json' with { type: 'json' };

const normalize = (value) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim();
const entries = catalog.airports.map(([code, name, city, country, region, scheduled, type]) => ({
  code,
  name,
  city,
  country,
  region,
  scheduled,
  type,
  terms: [code, city, name].map(normalize),
}));
const byCode = new Map(entries.map((airport) => [airport.code, airport]));

export function airportDetails(code) {
  const airport = byCode.get(code);

  return { code, name: airport?.name || code, city: airport?.city || '' };
}

export function searchAirports(query) {
  const term = normalize(query);
  if (term.length < 2 || term.length > 100) return [];

  return entries
    .map((airport) => {
      const [code, city, name] = airport.terms;
      const rank =
        code === term
          ? 0
          : code.startsWith(term)
            ? 1
            : city === term
              ? 2
              : city.startsWith(term)
                ? 3
                : name.startsWith(term)
                  ? 4
                  : `${city} ${name}`.includes(term)
                    ? 5
                    : Infinity;

      return { airport, rank };
    })
    .filter(({ rank }) => Number.isFinite(rank))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        Number(b.airport.scheduled) - Number(a.airport.scheduled) ||
        Number(b.airport.type === 'large_airport') - Number(a.airport.type === 'large_airport') ||
        a.airport.code.localeCompare(b.airport.code),
    )
    .slice(0, 20)
    .map(({ airport }) => ({
      value: airport.code,
      label: `${airport.city || airport.name} (${airport.code})`,
      detail: `${airport.name} · ${airport.country}`,
    }));
}
