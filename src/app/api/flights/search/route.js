import { flightSearchSchema, searchFieldError } from '@/lib/flights/schemas';
import { validateForm } from '@/lib/validation';
import { searchFlights, serviceErrorResponse } from '@/lib/flights/duffel';

export async function POST(request) {
  if (!request.headers.get('content-type')?.includes('application/json'))
    return Response.json({ message: 'Send search details as JSON.' }, { status: 415 });
  let values;
  try {
    const body = await request.text();
    if (body.length > 10000)
      return Response.json({ message: 'Search details are too large.' }, { status: 413 });
    values = JSON.parse(body);
  } catch {
    return Response.json({ message: 'Invalid search details.' }, { status: 400 });
  }
  const { errors } = validateForm(flightSearchSchema, values, { mapError: searchFieldError });
  if (Object.keys(errors).length)
    return Response.json({ message: 'Check your search details.', errors }, { status: 400 });
  try {
    return Response.json(await searchFlights(values, request.signal), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
