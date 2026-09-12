import { airports } from '@/data/travel-locations';
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
