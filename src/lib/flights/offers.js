export function durationMinutes(value = '') {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);

  return match
    ? Number(match[1] || 0) * 1440 +
        Number(match[2] || 0) * 60 +
        Number(match[3] || 0) +
        Number(match[4] || 0) / 60
    : 0;
}

export function formatDuration(value) {
  const minutes = Math.round(durationMinutes(value));

  return minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : 'Duration unavailable';
}

export function formatMoney(amount, currency) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(Number(amount));
}

export function formatLocalDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

export function filterOffers(
  offers,
  { currency, stops = 'any', minPrice = '', maxPrice = '', sort = 'cheapest' },
  schedule = {},
) {
  const filtered = offers.filter((offer) => {
    if (currency && offer.currency !== currency) return false;
    if (stops !== 'any' && offer.slices.some((slice) => slice.segments.length - 1 > Number(stops)))
      return false;
    const price = Number(offer.amount);
    if (
      (minPrice !== '' && price < Number(minPrice)) ||
      (maxPrice !== '' && price > Number(maxPrice))
    )
      return false;

    return offer.slices.every((slice, index) => {
      const prefix = index ? 'return' : 'depart';
      const time = slice.segments[0]?.departingAt.slice(11, 16);

      return (
        (!schedule[`${prefix}TimeStart`] || time >= schedule[`${prefix}TimeStart`]) &&
        (!schedule[`${prefix}TimeEnd`] || time <= schedule[`${prefix}TimeEnd`])
      );
    });
  });
  const duration = (offer) =>
    offer.slices.some((slice) => !durationMinutes(slice.duration))
      ? Infinity
      : offer.slices.reduce((sum, slice) => sum + durationMinutes(slice.duration), 0);

  return filtered.sort((a, b) => {
    if (sort === 'shortest')
      return duration(a) - duration(b) || Number(a.amount) - Number(b.amount);
    if (sort === 'earliest')
      return (
        a.slices[0].segments[0].departingAt.localeCompare(b.slices[0].segments[0].departingAt) ||
        Number(a.amount) - Number(b.amount)
      );

    return Number(a.amount) - Number(b.amount) || duration(a) - duration(b);
  });
}

export function formatBaggage(bag) {
  const name = bag.type.replaceAll('_', ' ');
  const quantity = Number.isInteger(bag.quantity)
    ? `${bag.quantity} ${name} bag${bag.quantity === 1 ? '' : 's'}`
    : `${name} baggage`;
  const weight =
    bag.quantity !== 0 && bag.weight > 0 && ['kg', 'lb'].includes(bag.weightUnit)
      ? ` · ${bag.weight} ${bag.weightUnit}${bag.quantity > 0 ? ' per bag' : ''}`
      : '';
  const inclusion =
    bag.included === false
      ? ' · additional charge'
      : bag.included === null
        ? ' · inclusion not supplied'
        : '';

  return `${quantity}${weight}${inclusion}`;
}
