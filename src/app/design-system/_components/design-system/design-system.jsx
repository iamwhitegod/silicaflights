import { Link } from '@/components/ui/link/link';
import { Heading } from '@/components/ui/heading/heading';
import { Text } from '@/components/ui/text/text';
import { FoundationsSection } from '../foundations-section/foundations-section';
import { ControlsSection } from '../controls-section/controls-section';
import { FieldsSection } from '../fields-section/fields-section';
import { FormsSection } from '../forms-section/forms-section';
import styles from './design-system.module.scss';

const chapters = [
  ['foundations', 'Foundations'],
  ['atoms', 'Atoms'],
  ['molecules', 'Molecules'],
  ['organisms', 'Organisms'],
];

export function DesignSystem() {
  return (
    <div className={styles['design-system']}>
      <aside className={styles['design-system__sidebar']}>
        <Link href="/" variant="navigation" className={styles['design-system__brand']}>
          Silica Flights<span>Design system / v1.0</span>
        </Link>
        <nav aria-label="Design system chapters">
          {chapters.map(([id, label], index) => (
            <Link key={id} href={'#' + id} variant="navigation">
              <small>0{index + 1}</small>
              {label}
            </Link>
          ))}
        </nav>
        <p>
          Built from small things.
          <br />
          Made for everywhere.
        </p>
      </aside>
      <main id="main" className={styles['design-system__main']}>
        <header className={styles['design-system__header']}>
          <Text size="caption" tone="muted">
            SILICAFLIGHTS · COMPONENT LIBRARY
          </Text>
          <Heading level={1} variant="hero" tone="default">
            A little system.
            <br />A world of possibility.
          </Heading>
          <Text tone="muted">
            The foundations and reusable patterns behind a simpler way to fly. Explore real
            controls, their states, and how they work together.
          </Text>
          <span className={styles['design-system__badge']}>Atomic Design · Sass · rem</span>
        </header>
        <FoundationsSection />
        <ControlsSection />
        <FieldsSection />
        <FormsSection />
        <footer className={styles['design-system__endnote']}>
          SilicaFlights · Design system · Development preview
        </footer>
      </main>
    </div>
  );
}
