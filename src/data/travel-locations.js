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
