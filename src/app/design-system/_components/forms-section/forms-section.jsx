'use client';

import { useState } from 'react';
import { Text } from '@/components/ui/text/text';
import { Navigation } from '@/components/site/navigation/navigation';
import { FlightSearchForm } from '@/components/flight-search/flight-search-form/flight-search-form';
import { FounderSignupForm } from '@/components/signup/founder-signup-form/founder-signup-form';
import { WeeklyDealsForm } from '@/components/signup/weekly-deals-form/weekly-deals-form';
import { demoSubmit, demoFailure } from '@/lib/demo-submission';
import { demoFlightSearch } from '@/data/flight-fixtures';
import { Chapter } from '../chapter/chapter';
import { Specimen } from '../specimen/specimen';
import styles from './forms-section.module.scss';

export function FormsSection() {
  const [failure, setFailure] = useState(false);

  return (
    <Chapter id="organisms" number="04" title="Organisms">
      <div className={styles['forms-section__search-preview']}>
        <Navigation />
        <FlightSearchForm
          demo
          idPrefix="showcase-flight"
          onSubmit={failure ? demoFailure : demoFlightSearch}
        />
      </div>
      <div className={styles['forms-section__demo-control']}>
        <label>
          <input
            type="checkbox"
            checked={failure}
            onChange={(event) => setFailure(event.target.checked)}
          />{' '}
          Simulate submission failure
        </label>
        <Text size="caption" tone="muted">
          Applies to all forms below and the search above. Turn off to retry successfully.
        </Text>
      </div>
      <div className={styles['forms-section__specimens']}>
        <Specimen title="Founder signup">
          <div className={styles['forms-section__founder-preview']}>
            <FounderSignupForm
              idPrefix="showcase-founder"
              onSubmit={failure ? demoFailure : demoSubmit}
            />
          </div>
        </Specimen>
        <Specimen title="Weekly deals">
          <WeeklyDealsForm
            idPrefix="showcase-weekly"
            onSubmit={failure ? demoFailure : demoSubmit}
          />
        </Specimen>
      </div>
    </Chapter>
  );
}
