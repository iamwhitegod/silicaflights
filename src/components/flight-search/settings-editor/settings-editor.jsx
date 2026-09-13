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
      value: 'schedule',
      label: 'Schedule',
      content: (
        <Stack>
          <div className={styles['settings-editor__pair']}>
            {time('departTimeStart', 'Earliest departure time')}
            {time('departTimeEnd', 'Latest departure time')}
          </div>
          {draft.trip === 'round-trip' && (
            <div className={styles['settings-editor__pair']}>
              {date('returnDate', 'Return date')}
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
            ['infants', 'Infants on lap (under 2)', 0],
          ].map(([key, label, min]) => (
            <NumberStepper
              key={key}
              label={label}
              value={draft[key]}
              min={min}
              onValueChange={(value) => {
                setDraft((previous) => ({
                  ...previous,
                  [key]: value,
                  ...(key === 'children'
                    ? {
                        childAges: Array.from(
                          { length: value },
                          (_, index) => previous.childAges[index] ?? '',
                        ),
                      }
                    : {}),
                }));
              }}
            />
          ))}
          {Array.from({ length: draft.children }, (_, index) => (
            <TextField
              key={index}
              label={`Child ${index + 1} age on departure`}
              type="number"
              min="2"
              max="11"
              step="1"
              value={draft.childAges[index] ?? ''}
              onChange={(event) => {
                const ages = [...draft.childAges];
                ages[index] = event.target.value === '' ? '' : Number(event.target.value);
                set('childAges', ages);
              }}
              error={errors.childAges}
            />
          ))}
          <Text size="caption" tone="muted">
            Up to 9 travelers. Each infant travels on an adult’s lap.
          </Text>
          {errors.travelers && <Status kind="error">{errors.travelers}</Status>}
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
            next.travelers || next.infants || next.childAges
              ? 'travelers'
              : next.trip || next.cabin
                ? 'details'
                : 'schedule',
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
