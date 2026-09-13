import { searchAirports, serviceErrorResponse } from '@/lib/flights/duffel';

export async function GET(request) {
  const query = new URL(request.url).searchParams.get('query')?.trim() || '';
  if (query.length < 2 || query.length > 100)
    return Response.json({ message: 'Enter between 2 and 100 characters.' }, { status: 400 });
  try {
    return Response.json(
      { airports: await searchAirports(query, request.signal) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
