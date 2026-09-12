import { Heading, Text } from '@/components/atoms/typography';
import { Link } from '@/components/atoms/controls';
import { Container } from '@/components/layout/layout';
import { footerDestinations } from '@/lib/content';
import s from './footer.module.scss';
export default function Footer() {
  return (
    <footer className={s.footer}>
      <Container>
        <Heading variant="section" tone="inverse" className={s.title}>
          Find flights to
          <br />
          popular destinations
        </Heading>
        <nav className={s.links} aria-label="Popular destinations">
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
      <div className={s.brand}>
        <Text className={s.tagline}>The sky at your fingertips</Text>
        <p className={s.wordmark}>Silica Flights</p>
      </div>
    </footer>
  );
}
