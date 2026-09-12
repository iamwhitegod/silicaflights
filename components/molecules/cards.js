import { Heading, Text } from '@/components/atoms/typography';
import { Image } from '@/components/atoms/controls';
import { cx } from '@/lib/cx';
import s from './molecules.module.scss';

export function FeatureCard({ title, description, image, tone = 'cream' }) {
  return (
    <article className={cx(s.featureCard, s[tone])}>
      <Image src={image} alt="" width={132} height={100} className={s.featureImage} />
      <div>
        <Heading level={3} variant="card" tone="default">
          {title}
        </Heading>
        <Text size="compact">{description}</Text>
      </div>
    </article>
  );
}
export function DestinationCard({ name, image, trip = 'Round trip', destination }) {
  return (
    <a
      href={`/?destination=${encodeURIComponent(destination)}#flight-search`}
      className={s.destinationCard}
      aria-label={`Explore flights to ${name}`}
    >
      <div className={s.destinationImage}>
        <Image src={image} alt="" fill sizes="16rem" />
      </div>
      <div className={s.destinationInfo}>
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
