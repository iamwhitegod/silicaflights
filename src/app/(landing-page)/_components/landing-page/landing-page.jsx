import { Image } from '@/components/ui/image/image';
import { Heading } from '@/components/ui/heading/heading';
import { Text } from '@/components/ui/text/text';
import { Artwork } from '@/components/ui/artwork/artwork';
import { Container } from '@/components/layout/container/container';
import { Section } from '@/components/layout/section/section';
import { Navigation } from '@/components/site/navigation/navigation';
import { Footer } from '@/components/site/footer/footer';
import { FlightSearchForm } from '@/components/flight-search/flight-search-form/flight-search-form';
import { FounderSignupForm } from '@/components/signup/founder-signup-form/founder-signup-form';
import { WeeklyDealsForm } from '@/components/signup/weekly-deals-form/weekly-deals-form';
import { FeatureGrid } from '../feature-grid/feature-grid';
import { DestinationGrid } from '../destination-grid/destination-grid';
import { LandingMotion } from '../landing-motion/landing-motion';
import { features, destinations } from '../../_data/landing-content';
import styles from './landing-page.module.scss';

export function LandingPage({ initialDestination = '' }) {
  return (
    <LandingMotion>
      <header className={styles['landing-page__hero']}>
        <div className={styles['landing-page__artwork-frame']} aria-hidden="true">
          <div className={styles['landing-page__artwork-layer']} data-motion-artwork>
            <Image
              src="/images/hero-desktop.png"
              alt=""
              fill
              sizes="100vw"
              fetchPriority="high"
              loading="eager"
              className={styles['landing-page__hero-artwork']}
            />
          </div>
        </div>
        <div className={styles['landing-page__hero-shade']} />
        <Container className={styles['landing-page__hero-inner']}>
          <Navigation />
          <div className={styles['landing-page__hero-content']}>
            <Heading level={1} variant="hero" tone="inverse">
              <span className={styles['landing-page__hero-line']} data-hero-reveal>
                Fly anywhere
              </span>
              <br />
              <span className={styles['landing-page__hero-line']} data-hero-reveal>
                pay less
              </span>
            </Heading>
            <div
              id="flight-search"
              className={styles['landing-page__search-anchor']}
              data-hero-reveal
            >
              <FlightSearchForm initialDestination={initialDestination} />
            </div>
          </div>
        </Container>
      </header>
      <main id="main">
        <Section className={styles['landing-page__how']} aria-labelledby="how-title">
          <Container>
            <div className={styles['landing-page__section-intro']} data-motion-reveal>
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
          <Container className={styles['landing-page__destinations']}>
            <div className={styles['landing-page__destination-intro']} data-motion-reveal>
              <Heading id="destinations-title">
                Top destinations
                <br />
                for your next trip
              </Heading>
            </div>
            <DestinationGrid items={destinations} />
          </Container>
        </Section>
        <Section id="founder" aria-labelledby="founder-title">
          <Container>
            <div className={styles['landing-page__founder-scene']}>
              <div className={styles['landing-page__artwork-frame']} aria-hidden="true">
                <div className={styles['landing-page__artwork-layer']} data-motion-artwork>
                  <Artwork
                    desktop="/images/founders-desktop.png"
                    mobile="/images/founders-mobile.png"
                  />
                </div>
              </div>
              <div className={styles['landing-page__founder-content']} data-motion-reveal>
                <Heading id="founder-title" tone="inverse">
                  Founding
                  <br />
                  member program
                </Heading>
                <Text>Get in early. Pay less on all trips forever.</Text>
                <FounderSignupForm />
              </div>
            </div>
          </Container>
        </Section>
        <section className={styles['landing-page__deals']} aria-labelledby="deals-title">
          <div className={styles['landing-page__artwork-frame']} aria-hidden="true">
            <div className={styles['landing-page__artwork-layer']} data-motion-artwork>
              <Artwork desktop="/images/deals-desktop.png" mobile="/images/deals-mobile.png" />
            </div>
          </div>
          <Container className={styles['landing-page__deals-inner']}>
            <Heading id="deals-title" tone="inverse" data-motion-reveal>
              Get weekly
              <br />
              flight deals
            </Heading>
            <div className={styles['landing-page__deals-form']} data-motion-reveal>
              <WeeklyDealsForm />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </LandingMotion>
  );
}
