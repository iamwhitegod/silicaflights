'use client';
import { useEffect, useRef, useState } from 'react';
import { Button, Icon, Status } from '@/components/atoms/controls';
import { Text } from '@/components/atoms/typography';
import { Combobox, DateField } from '@/components/molecules/fields';
import Modal from '@/components/molecules/modal';
import AdvancedSearchDialog from './advanced-search';
import { airports } from '@/lib/content';
import { defaultFilters, demoSubmit, today, validateSearch } from '@/lib/forms';
import s from './organisms.module.scss';

export default function FlightSearchForm({
  onSubmit = demoSubmit,
  idPrefix = 'flight',
  initialDestination = '',
}) {
  const [values, setValues] = useState({
    origin: '',
    destination: airports.some((airport) => airport.value === initialDestination)
      ? initialDestination
      : '',
    departure: '',
    filters: { ...defaultFilters },
  });
  const [errors, setErrors] = useState({});
  const [advanced, setAdvanced] = useState(false);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const set = (key, value) => setValues((previous) => ({ ...previous, [key]: value }));
  useEffect(() => {
    if (airports.some((airport) => airport.value === initialDestination)) {
      document.getElementById(`${idPrefix}-destination`)?.focus({ preventScroll: true });
      document.getElementById('flight-search')?.scrollIntoView();
    }
  }, [idPrefix, initialDestination]);
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const next = validateSearch(values);
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`${idPrefix}-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    pending.current = true;
    setStatus('loading');
    try {
      await onSubmit(values);
      setSummary({ ...values });
      setStatus('idle');
    } catch (error) {
      setMessage(error.message || 'The demo search failed. Try again.');
      setStatus('error');
    } finally {
      pending.current = false;
    }
  }
  const place = (code) => airports.find((airport) => airport.value === code)?.label;
  return (
    <div className={s.flightSearch}>
      <form onSubmit={submit} noValidate aria-label="Flight search">
        <div className={s.searchFrame}>
          <div className={s.searchFields}>
            <Combobox
              compact
              id={`${idPrefix}-origin`}
              label="From"
              options={airports}
              value={values.origin}
              onValueChange={(value) => set('origin', value)}
              error={errors.origin}
              disabled={status === 'loading'}
            />
            <Combobox
              compact
              id={`${idPrefix}-destination`}
              label="To"
              options={airports}
              value={values.destination}
              onValueChange={(value) => set('destination', value)}
              error={errors.destination}
              disabled={status === 'loading'}
            />
            <div className={s.searchDate}>
              <DateField
                id={`${idPrefix}-departure`}
                label="Departure date"
                min={today()}
                value={values.departure}
                onChange={(event) => set('departure', event.target.value)}
                error={errors.departure}
                disabled={status === 'loading'}
              />
            </div>
          </div>
          <Button type="submit" loading={status === 'loading'}>
            {status === 'loading'
              ? 'Searching…'
              : status === 'error'
                ? 'Try again'
                : 'Search flights'}
          </Button>
        </div>
        <div className={s.searchMeta}>
          <Text size="caption">Demo search · no live fares</Text>
          <Button
            id={`${idPrefix}-filters`}
            variant="secondary"
            size="sm"
            onClick={() => setAdvanced(true)}
          >
            <Icon name="settings" />
            Advanced settings
          </Button>
        </div>
        {errors.filters && <Status kind="error">{errors.filters}</Status>}
        {status === 'error' && <Status kind="error">{message}</Status>}
      </form>
      <AdvancedSearchDialog
        open={advanced}
        onOpenChange={setAdvanced}
        value={values.filters}
        departure={values.departure}
        onValueChange={(value) => {
          set('filters', value);
          setErrors((previous) => ({ ...previous, filters: undefined }));
        }}
      />
      <Modal
        open={!!summary}
        onOpenChange={(open) => {
          if (!open) setSummary(null);
        }}
        title="Your demo flight search"
        description="This is a preview of your search. No live fares were checked and no booking was made."
      >
        {summary && (
          <div className={s.summary}>
            <p className={s.route}>
              {place(summary.origin)} <span aria-hidden="true">→</span> {place(summary.destination)}
            </p>
            <dl>
              <dt>Departure</dt>
              <dd>{summary.departure}</dd>
              <dt>Trip</dt>
              <dd>{summary.filters.trip}</dd>
              <dt>Cabin</dt>
              <dd>{summary.filters.cabin}</dd>
              <dt>Travelers</dt>
              <dd>
                {summary.filters.adults} adult(s), {summary.filters.children} child(ren),{' '}
                {summary.filters.infants} infant(s)
              </dd>
              {(summary.filters.minPrice || summary.filters.maxPrice) && (
                <>
                  <dt>Budget (USD)</dt>
                  <dd>
                    {summary.filters.minPrice || '0'} – {summary.filters.maxPrice || 'No maximum'}
                  </dd>
                </>
              )}
              {Object.entries(summary.filters)
                .filter(
                  ([key, value]) =>
                    value &&
                    (key.startsWith('depart') ||
                      (summary.filters.trip === 'round-trip' && key.startsWith('return'))),
                )
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>{key.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
            <Button onClick={() => setSummary(null)}>Edit search</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
