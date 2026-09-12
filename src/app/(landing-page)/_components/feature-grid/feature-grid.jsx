import { Grid } from '@/components/layout/grid/grid';
import { FeatureCard } from '../feature-card/feature-card';

export function FeatureGrid({ items }) {
  return (
    <Grid data-motion-group>
      {items.map((item) => (
        <FeatureCard key={item.title} {...item} />
      ))}
    </Grid>
  );
}
