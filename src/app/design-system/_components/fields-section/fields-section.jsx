'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button/button';
import { Text } from '@/components/ui/text/text';
import { DateField } from '@/components/ui/date-field/date-field';
import { TimeField } from '@/components/ui/time-field/time-field';
import { Combobox } from '@/components/ui/combobox/combobox';
import { Chip } from '@/components/ui/chip/chip';
import { NumberStepper } from '@/components/ui/number-stepper/number-stepper';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { Tabs } from '@/components/ui/tabs/tabs';
import { FeatureCard } from '@/app/(landing-page)/_components/feature-card/feature-card';
import { DestinationCard } from '@/app/(landing-page)/_components/destination-card/destination-card';
import { airports } from '@/data/travel-locations';
import { features, destinations } from '@/app/(landing-page)/_data/landing-content';
import { Chapter } from '../chapter/chapter';
import { Specimen } from '../specimen/specimen';
import { ExampleModal } from '../example-modal/example-modal';
import styles from './fields-section.module.scss';
export function FieldsSection() {
  const [city, setCity] = useState('');
  const [trip, setTrip] = useState('one-way');
  const [tab, setTab] = useState('one');
  const [count, setCount] = useState(1);
  const [modal, setModal] = useState(false);
  const [chip, setChip] = useState(true);
  return (
    <>
      <Chapter id="molecules" number="03" title="Molecules">
        <div className={styles['fields-section']}>
          <Specimen title="Airport combobox">
            <Combobox
              label="Departure airport"
              options={airports}
              value={city}
              onValueChange={setCity}
              hint="Type to search. Use arrow keys and Enter to select."
            />
          </Specimen>
          <Specimen title="Date and travelers">
            <DateField label="Travel date" />
            <TimeField label="Travel time" />
            <NumberStepper label="Adults" value={count} onValueChange={setCount} min={1} />
          </Specimen>
          <Specimen title="Picker states">
            <DateField
              label="Date with limits"
              name="bounded-date"
              min="2028-02-28"
              max="2028-03-02"
              defaultValue="2028-02-29"
              hint="Example: 28 February–2 March 2028."
            />
            <DateField label="Date needing attention" error="Choose a departure date." />
            <TimeField
              label="Time needing attention"
              defaultValue="09:00"
              error="Time must be after departure."
            />
            <DateField label="Unavailable date" disabled />
            <TimeField label="Read-only time" defaultValue="21:50" readOnly />
          </Specimen>
          <Specimen title="Selection and chips">
            <SegmentedControl
              label="Trip type"
              options={[
                { value: 'one-way', label: 'One-way' },
                { value: 'round-trip', label: 'Round trip' },
                { value: 'multi-city', label: 'Multi-city', disabled: true },
              ]}
              value={trip}
              onValueChange={setTrip}
            />
            <div className={styles['fields-section__row']}>
              {chip ? (
                <Chip selected onRemove={() => setChip(false)}>
                  Nigeria
                </Chip>
              ) : (
                <Chip onClick={() => setChip(true)}>Add Nigeria</Chip>
              )}
              <Chip disabled>Unavailable</Chip>
            </div>
          </Specimen>
          <Specimen title="Tabs and modal">
            <Tabs
              label="Example tabs"
              value={tab}
              onValueChange={setTab}
              items={[
                {
                  value: 'one',
                  label: 'Overview',
                  content: <Text>Tabs keep related information in one place.</Text>,
                },
                {
                  value: 'two',
                  label: 'Details',
                  content: <Text>Use Left, Right, Home, and End to navigate.</Text>,
                },
                { value: 'three', label: 'Unavailable', disabled: true, content: null },
              ]}
            />
            <Button onClick={() => setModal(true)}>Open example modal</Button>
          </Specimen>
          <Specimen title="Feature card">
            <FeatureCard {...features[0]} />
          </Specimen>
          <Specimen title="Destination card">
            <DestinationCard {...destinations[0]} />
            <Text size="caption" tone="muted">
              Sample fare. Selecting the card prefills search.
            </Text>
          </Specimen>
        </div>
      </Chapter>
      <ExampleModal open={modal} onOpenChange={setModal} />
    </>
  );
}
