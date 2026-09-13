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
