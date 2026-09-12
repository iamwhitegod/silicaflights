import { Grid } from '@/components/layout/layout';
import { FeatureCard, DestinationCard } from '@/components/molecules/cards';
export function FeatureGrid({ items }) {
  return (
    <Grid>
      {items.map((item) => (
        <FeatureCard key={item.title} {...item} />
      ))}
    </Grid>
  );
}
export function DestinationGrid({ items }) {
  return (
    <Grid>
      {items.map((item) => (
        <DestinationCard key={item.name} {...item} />
      ))}
    </Grid>
  );
}
