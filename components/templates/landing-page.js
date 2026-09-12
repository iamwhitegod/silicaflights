import { Heading, Text } from '@/components/atoms/typography';
import { Image } from '@/components/atoms/controls';
import Artwork from '@/components/atoms/artwork';
import { Container, Section } from '@/components/layout/layout';
import Navigation from '@/components/organisms/navigation';
import FlightSearchForm from '@/components/organisms/flight-search';
import { FounderSignupForm, WeeklyDealsForm } from '@/components/organisms/signup-forms';
import { FeatureGrid, DestinationGrid } from '@/components/organisms/content-grids';
import Footer from '@/components/organisms/footer';
import { features, destinations } from '@/lib/content';
import s from './landing-page.module.scss';

export default function LandingPage({ initialDestination = '' }) {
  return (
    <>
      <header className={s.hero}>
        <Image
          src="/images/hero-desktop.png"
          alt=""
          fill
          sizes="100vw"
          fetchPriority="high"
          className={s.heroArtwork}
        />
        <div className={s.heroShade} />
        <Container className={s.heroInner}>
          <Navigation />
          <div className={s.heroContent}>
            <Heading level={1} variant="hero" tone="inverse">
              Fly anywhere
              <br />
              pay less
            </Heading>
            <div id="flight-search" className={s.searchAnchor}>
              <FlightSearchForm initialDestination={initialDestination} />
            </div>
          </div>
        </Container>
      </header>
      <main id="main">
        <Section className={s.how} aria-labelledby="how-title">
          <Container>
            <div className={s.sectionIntro}>
              <Heading id="how-title">How it works</Heading>
              <Text>
                SilicaFlights is built for the best user experience, helping visitors book flights
                cheaper and faster.
              </Text>
            </div>
            <FeatureGrid items={features} />
          </Container>
        </Section>
        <Section aria-labelledby="destinations-title">
          <Container className={s.destinations}>
            <div className={s.destinationIntro}>
              <Heading id="destinations-title">
                Top destinations
                <br />
                for your next trip
              </Heading>
            </div>
            <DestinationGrid items={destinations} />
            <Text size="caption" tone="muted" className={s.fareNote}>
              Sample fares for inspiration. Prices are not live.
            </Text>
          </Container>
        </Section>
        <Section id="founder" aria-labelledby="founder-title">
          <Container>
            <div className={s.founderScene}>
              <Artwork
                desktop="/images/founders-desktop.png"
                mobile="/images/founders-mobile.png"
              />
              <div className={s.founderContent}>
                <Heading id="founder-title" tone="inverse">
                  Founding
                  <br />
                  member program
                </Heading>
                <Text>Get in early. Pay less on all trips forever.</Text>
                <FounderSignupForm />
                <Text size="caption" className={s.spots}>
                  53 founder spots left · sample availability
                </Text>
              </div>
            </div>
          </Container>
        </Section>
        <section className={s.deals} aria-labelledby="deals-title">
          <Artwork desktop="/images/deals-desktop.png" mobile="/images/deals-mobile.png" />
          <Container className={s.dealsInner}>
            <Heading id="deals-title" tone="inverse">
              Get weekly
              <br />
              flight deals
            </Heading>
            <WeeklyDealsForm />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
