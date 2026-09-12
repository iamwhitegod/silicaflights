import { Grid } from '@/components/layout/grid/grid';
import { DestinationCard } from '../destination-card/destination-card';

export function DestinationGrid({ items }) {
  return (
    <Grid data-motion-group>
      {items.map((item) => (
        <DestinationCard key={item.name} {...item} />
      ))}
    </Grid>
  );
}
