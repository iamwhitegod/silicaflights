import { Image } from '@/components/ui/image/image';
import { Heading } from '@/components/ui/heading/heading';
import { Text } from '@/components/ui/text/text';
import { cx } from '@/lib/cx';
import styles from './feature-card.module.scss';

const toneClasses = {
  cream: styles['feature-card--tone-cream'],
  mint: styles['feature-card--tone-mint'],
  peach: styles['feature-card--tone-peach'],
};

export function FeatureCard({ title, description, image, tone = 'cream' }) {
  return (
    <article className={cx(styles['feature-card'], toneClasses[tone])}>
      <Image
        src={image}
        alt=""
        width={132}
        height={100}
        className={styles['feature-card__image']}
      />
      <div>
        <Heading level={3} variant="card" tone="default">
          {title}
        </Heading>
        <Text size="compact">{description}</Text>
      </div>
    </article>
  );
}
