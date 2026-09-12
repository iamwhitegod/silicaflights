import { Heading } from '@/components/ui/heading/heading';
import { Text } from '@/components/ui/text/text';
import { Chapter } from '../chapter/chapter';
import { Specimen } from '../specimen/specimen';
import styles from './foundations-section.module.scss';
const colors = [
  ['Yellow', 'yellow', '#FCCB5F'],
  ['Sky blue', 'sky', '#0089FC'],
  ['Brand blue', 'blue', '#4F86FD'],
  ['Action', 'action', '#0045D7'],
  ['Surface', 'surface', '#F5F5F5'],
  ['Ink', 'text', '#1E1E1E'],
  ['Cream', 'cream', '#FFFDEA'],
  ['Mint', 'mint', '#E6FBF4'],
  ['Peach', 'peach', '#FFEADB'],
  ['Error', 'error', '#B42318'],
  ['Success', 'success', '#166534'],
];
export function FoundationsSection() {
  return (
    <Chapter id="foundations" number="01" title="Foundations">
      <p className={styles['foundations-section__intro']}>
        A warm yellow, an open sky, and typography with a little personality.
      </p>
      <div className={styles['foundations-section__colors']}>
        {colors.map(([label, token, value]) => (
          <div className={styles['foundations-section__color']} key={token}>
            <div style={{ background: 'var(--color-' + token + ')' }} />
            <strong>{label}</strong>
            <code>{value}</code>
          </div>
        ))}
      </div>
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
        Root: 62.5%. Semantic CSS properties supply component values; Sass supplies structure and
        breakpoints. Dark blue replaces bright selection blue where small white text needs stronger
        contrast.
      </Text>
    </Chapter>
  );
}
