import { searchAirports } from '@/lib/airports';
import { serviceErrorResponse } from '@/lib/flights/errors';

export async function GET(request) {
  const query = new URL(request.url).searchParams.get('query')?.trim() || '';
  if (query.length < 2 || query.length > 100)
    return Response.json({ message: 'Enter between 2 and 100 characters.' }, { status: 400 });
  try {
    return Response.json(
      { airports: searchAirports(query) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
