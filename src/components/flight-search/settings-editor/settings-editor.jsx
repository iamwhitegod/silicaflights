'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button/button';
import { Status } from '@/components/ui/status/status';
import { Text } from '@/components/ui/text/text';
import { TextField } from '@/components/ui/text-field/text-field';
import { DateField } from '@/components/ui/date-field/date-field';
import { TimeField } from '@/components/ui/time-field/time-field';
import { NumberStepper } from '@/components/ui/number-stepper/number-stepper';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { Tabs } from '@/components/ui/tabs/tabs';
import { Stack } from '@/components/layout/stack/stack';
import { today } from '@/lib/dates';
import { defaultFilters } from '../defaults';
import { validateFilters } from '../validation';
import styles from './settings-editor.module.scss';

export function SettingsEditor({ initial, onApply, onCancel, departure }) {
  const [draft, setDraft] = useState(initial);
  const [tab, setTab] = useState('details');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setDraft((previous) => ({ ...previous, [key]: value }));
  const field = (key, label, type = 'number') => (
    <TextField
      key={key}
      label={label}
      type={type}
      min={type === 'number' ? '0' : undefined}
      step={type === 'number' ? '0.01' : undefined}
      value={draft[key]}
      onChange={(event) => set(key, event.target.value)}
      error={errors[key]}
    />
  );
  const date = (key, label) => (
    <DateField
      key={key}
      label={label}
      min={today()}
      value={draft[key]}
      onValueChange={(value) => set(key, value)}
      error={errors[key]}
    />
  );
  const time = (key, label) => (
    <TimeField
      key={key}
      label={label}
      value={draft[key]}
      onValueChange={(value) => set(key, value)}
      error={errors[key]}
    />
  );
  const items = [
    {
      value: 'details',
      label: 'Flight details',
      content: (
        <Stack>
          <SegmentedControl
            label="Trip type"
            value={draft.trip}
            onValueChange={(value) => set('trip', value)}
            options={[
              { value: 'one-way', label: 'One-way' },
              { value: 'round-trip', label: 'Round trip' },
              { value: 'multi-city', label: 'Multi-city', disabled: true },
            ]}
          />
          <Text size="caption" tone="muted">
            Multi-city search is coming later.
          </Text>
          <SegmentedControl
            label="Cabin class"
            value={draft.cabin}
            onValueChange={(value) => set('cabin', value)}
            options={['economy', 'premium economy', 'business', 'first'].map((value) => ({
              value,
              label: value[0].toUpperCase() + value.slice(1),
            }))}
          />
        </Stack>
      ),
    },
    {
      value: 'price',
      label: 'Price range',
      content: (
        <div className={styles['settings-editor__pair']}>
          {field('minPrice', 'Minimum price (USD)')}
          {field('maxPrice', 'Maximum price (USD)')}
        </div>
      ),
    },
    {
      value: 'schedule',
      label: 'Schedule',
      content: (
        <Stack>
          <div className={styles['settings-editor__pair']}>
            {date('departStart', 'Earliest departure')}
            {date('departEnd', 'Latest departure')}
            {time('departTimeStart', 'Earliest departure time')}
            {time('departTimeEnd', 'Latest departure time')}
          </div>
          {draft.trip === 'round-trip' && (
            <div className={styles['settings-editor__pair']}>
              {date('returnStart', 'Earliest return')}
              {date('returnEnd', 'Latest return')}
              {time('returnTimeStart', 'Earliest return time')}
              {time('returnTimeEnd', 'Latest return time')}
            </div>
          )}
        </Stack>
      ),
    },
    {
      value: 'travelers',
      label: 'Travelers',
      content: (
        <Stack>
          {[
            ['adults', 'Adults (12+ years)', 1],
            ['children', 'Children (2–11 years)', 0],
            ['infants', 'Infants (under 2)', 0],
          ].map(([key, label, min]) => (
            <NumberStepper
              key={key}
              label={label}
              value={draft[key]}
              min={min}
              onValueChange={(value) => set(key, value)}
            />
          ))}
          {errors.infants && <Status kind="error">{errors.infants}</Status>}
        </Stack>
      ),
    },
  ];
  return (
    <form
      className={styles['settings-editor']}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const next = validateFilters(draft, departure);
        setErrors(next);
        if (Object.keys(next).length) {
          setTab(
            next.minPrice || next.maxPrice ? 'price' : next.infants ? 'travelers' : 'schedule',
          );
          return;
        }
        onApply(draft);
      }}
    >
      <div className={styles['settings-editor__clear-row']}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDraft({ ...defaultFilters });
            setErrors({});
          }}
        >
          Clear filters
        </Button>
      </div>
      <Tabs label="Advanced search filters" items={items} value={tab} onValueChange={setTab} />
      <div className={styles['settings-editor__actions']}>
        <Button variant="neutral" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Apply filters</Button>
      </div>
    </form>
  );
}
