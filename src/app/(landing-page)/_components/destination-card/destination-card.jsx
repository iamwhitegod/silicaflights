import { Image } from '@/components/ui/image/image';
import { Heading } from '@/components/ui/heading/heading';
import { Text } from '@/components/ui/text/text';
import styles from './destination-card.module.scss';

export function DestinationCard({ name, image, trip = 'Round trip', destination }) {
  return (
    <a
      href={`/?destination=${encodeURIComponent(destination)}#flight-search`}
      className={styles['destination-card']}
      aria-label={`Explore flights to ${name}`}
    >
      <div className={styles['destination-card__image']}>
        <Image src={image} alt="" fill sizes="16rem" />
      </div>
      <div className={styles['destination-card__info']}>
        <div>
          <Heading level={3} variant="small" tone="default">
            {name}
          </Heading>
          <Text size="caption" tone="muted">
            {trip}
          </Text>
        </div>
        <Text size="caption">
          Flights from <span>$1,275</span>
        </Text>
      </div>
    </a>
  );
}
