import { ScrollProvider } from '@/components/ui/scroll-provider/scroll-provider';
import { FlightResults } from '@/components/flight-results/flight-results/flight-results';
import { searchFromQuery, searchToQuery } from '@/lib/flights/search';

export const metadata = {
  title: 'Compare flights — SilicaFlights',
  robots: { index: false, follow: false },
};

export default async function FlightsPage({ searchParams }) {
  const values = searchFromQuery(await searchParams);

  return (
    <ScrollProvider>
      <FlightResults key={searchToQuery(values)} initialValues={values} />
    </ScrollProvider>
  );
}
