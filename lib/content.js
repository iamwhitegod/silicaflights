export const airports = [
  {
    value: 'LOS',
    label: 'Lagos',
    detail: 'LOS · Murtala Muhammed International',
  },
  {
    value: 'ABV',
    label: 'Abuja',
    detail: 'ABV · Nnamdi Azikiwe International',
  },
  {
    value: 'PHC',
    label: 'Port Harcourt',
    detail: 'PHC · Port Harcourt International',
  },
  { value: 'LHR', label: 'London', detail: 'LHR · Heathrow' },
  { value: 'MAN', label: 'Manchester', detail: 'MAN · Manchester Airport' },
  { value: 'DXB', label: 'Dubai', detail: 'DXB · Dubai International' },
  { value: 'AUH', label: 'Abu Dhabi', detail: 'AUH · Zayed International' },
  { value: 'DOH', label: 'Doha', detail: 'DOH · Hamad International' },
  {
    value: 'MEX',
    label: 'Mexico City',
    detail: 'MEX · Mexico City International',
  },
  { value: 'YYZ', label: 'Toronto', detail: 'YYZ · Toronto Pearson' },
  {
    value: 'JFK',
    label: 'New York',
    detail: 'JFK · John F. Kennedy International',
  },
  { value: 'IAD', label: 'Washington', detail: 'IAD · Dulles International' },
  {
    value: 'IAH',
    label: 'Houston',
    detail: 'IAH · George Bush Intercontinental',
  },
  { value: 'HND', label: 'Tokyo', detail: 'HND · Haneda' },
  { value: 'BOB', label: 'Bora Bora', detail: 'BOB · Bora Bora Airport' },
];

export const locations = [
  'Nigeria',
  'England',
  'Canada',
  'United Arab Emirates',
  'Japan',
  'United States',
  'Mexico',
  'Bora Bora',
  'Lagos',
  'Abuja',
  'London',
  'Dubai',
  'Toronto',
].map((label) => ({ value: label, label }));

export const features = [
  {
    title: 'Search for flights to your destination',
    description: 'Enter your destination and travel dates. We search multiple airlines instantly.',
    image: '/images/feature-search.svg',
    tone: 'cream',
  },
  {
    title: 'Compare prices of different airlines.',
    description:
      'See all your options sorted by price, duration, or stops. Filter to find exactly what you need.',
    image: '/images/feature-compare.png',
    tone: 'mint',
  },
  {
    title: 'Book trips that work with your budget',
    description: 'Click through to book directly with the airline. No middleman, no extra fees.',
    image: '/images/feature-book.svg',
    tone: 'peach',
  },
];

export const destinations = [
  { name: 'Dubai', image: '/images/dubai.png', destination: 'DXB' },
  { name: 'Mexico', image: '/images/mexico.png', destination: 'MEX' },
  { name: 'Canada', image: '/images/canada.png', destination: 'YYZ' },
  {
    name: 'United States',
    image: '/images/usa.png',
    destination: 'JFK',
    trip: 'One-way',
  },
  { name: 'Japan', image: '/images/japan.png', destination: 'HND' },
  { name: 'Bora Bora', image: '/images/bora-bora.png', destination: 'BOB' },
];

export const footerDestinations = [
  'LHR',
  'MAN',
  'DXB',
  'AUH',
  'DOH',
  'YYZ',
  'JFK',
  'IAD',
  'IAH',
].map((code) => airports.find((airport) => airport.value === code));
