import { Link } from '@/components/ui/link/link';
import { Heading } from '@/components/ui/heading/heading';
import { Text } from '@/components/ui/text/text';
import { Container } from '@/components/layout/container/container';
import { footerDestinations } from './footer-destinations';
import styles from './footer.module.scss';

export function Footer() {
  return (
    <footer className={styles['footer']}>
      <Container data-motion-reveal>
        <Heading variant="section" tone="inverse" className={styles['footer__title']}>
          Find flights to
          <br />
          popular destinations
        </Heading>
        <nav className={styles['footer__links']} aria-label="Popular destinations">
          {footerDestinations.map((place) => (
            <Link
              key={place.value}
              variant="footer"
              href={'/?destination=' + place.value + '#flight-search'}
            >
              Flights to {place.label}
            </Link>
          ))}
        </nav>
      </Container>
      <div className={styles['footer__brand']} data-motion-reveal>
        <Text className={styles['footer__tagline']}>The sky at your fingertips</Text>
        <p className={styles['footer__wordmark']}>Silica Flights</p>
      </div>
    </footer>
  );
}
