import 'server-only';
import { createFlightService } from './client.js';

export { serviceErrorResponse } from './errors.js';

export const searchFlights = createFlightService();
