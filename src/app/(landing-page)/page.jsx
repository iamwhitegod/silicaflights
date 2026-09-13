import { LandingPage } from './_components/landing-page/landing-page';

export default async function Home({ searchParams }) {
  const params = await searchParams;

  return (
    <LandingPage
      initialDestination={typeof params.destination === 'string' ? params.destination : ''}
    />
  );
}
