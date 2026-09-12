'use client';
import { useState } from 'react';
import Modal from '@/components/molecules/modal';
import { Tabs, SegmentedControl } from '@/components/molecules/selection';
import { TextField, DateField, NumberStepper } from '@/components/molecules/fields';
import { Button, Status } from '@/components/atoms/controls';
import { Text } from '@/components/atoms/typography';
import { Stack } from '@/components/layout/layout';
import { defaultFilters, today, validateFilters } from '@/lib/forms';
import s from './organisms.module.scss';

function SettingsEditor({ initial, onApply, onCancel, departure }) {
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
      onChange={(event) => set(key, event.target.value)}
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
        <div className={s.pair}>
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
          <div className={s.pair}>
            {date('departStart', 'Earliest departure')}
            {date('departEnd', 'Latest departure')}
            {field('departTimeStart', 'Earliest departure time', 'time')}
            {field('departTimeEnd', 'Latest departure time', 'time')}
          </div>
          {draft.trip === 'round-trip' && (
            <div className={s.pair}>
              {date('returnStart', 'Earliest return')}
              {date('returnEnd', 'Latest return')}
              {field('returnTimeStart', 'Earliest return time', 'time')}
              {field('returnTimeEnd', 'Latest return time', 'time')}
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
      <div className={s.clearRow}>
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
      <div className={s.actions}>
        <Button variant="neutral" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Apply filters</Button>
      </div>
    </form>
  );
}
export default function AdvancedSearchDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  departure,
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Advanced search">
      <SettingsEditor
        initial={value}
        departure={departure}
        onCancel={() => onOpenChange(false)}
        onApply={(next) => {
          onValueChange(next);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}
