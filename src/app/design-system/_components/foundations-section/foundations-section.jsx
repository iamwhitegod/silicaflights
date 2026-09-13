import { Heading } from '@/components/ui/heading/heading';
import { Text } from '@/components/ui/text/text';
import { Chapter } from '../chapter/chapter';
import { ColorPalette } from '../color-palette/color-palette';
import { Specimen } from '../specimen/specimen';
import styles from './foundations-section.module.scss';

export function FoundationsSection() {
  return (
    <Chapter id="foundations" number="01" title="Foundations">
      <p className={styles['foundations-section__intro']}>
        A warm yellow, an open sky, and typography with a little personality.
      </p>
      <ColorPalette />
      <div className={styles['foundations-section__specimens']}>
        <Specimen title="Recoleta Alt / Display">
          <Heading level={3} variant="hero">
            Fly anywhere
          </Heading>
          <Heading level={3}>Pay less</Heading>
          <Text size="caption" tone="muted">
            Bold · 3.2–5.6rem
          </Text>
        </Specimen>
        <Specimen title="Switzer / Everyday">
          <Heading level={3} variant="card" tone="default">
            Your next adventure starts here.
          </Heading>
          <Text>Clear, friendly, and easy to read. Body text uses Switzer Regular at 1.6rem.</Text>
          <Text size="label" tone="muted">
            Labels at 1.4rem · Captions at 1.2rem
          </Text>
          <p className={styles['foundations-section__script']}>The sky at your fingertips</p>
        </Specimen>
      </div>
      <Specimen title="Spacing / 0.4rem base" wide>
        <div className={styles['foundations-section__spacing']}>
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map((step) => (
            <div key={step}>
              <span style={{ width: 'var(--space-' + step + ')' }} />
              <code>{(step * 0.4).toFixed(1)}rem</code>
            </div>
          ))}
        </div>
      </Specimen>
      <Text size="label" tone="muted">
        Root: 62.5%. Colors use numbered families, ordered from light to dark, with opacity supplied
        separately. These are SilicaFlights shades; missing steps are intentional. Sass maps supply
        the swatches and their values, while typography uses explicit sizes at each breakpoint.
      </Text>
    </Chapter>
  );
}
