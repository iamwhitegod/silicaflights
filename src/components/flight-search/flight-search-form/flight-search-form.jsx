'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/icon/icon';
import { Button } from '@/components/ui/button/button';
import { Status } from '@/components/ui/status/status';
import { Text } from '@/components/ui/text/text';
import { DateField } from '@/components/ui/date-field/date-field';
import { Combobox } from '@/components/ui/combobox/combobox';
import { Modal } from '@/components/ui/modal/modal';
import { AdvancedSearchDialog } from '../advanced-search-dialog/advanced-search-dialog';
import { today } from '@/lib/dates';
import { defaultFilters } from '../defaults';
import { validateSearch } from '../validation';
import { airports } from '@/data/travel-locations';
import { demoSubmit } from '@/lib/demo-submission';
import { usePageScroll } from '@/components/ui/scroll-provider/scroll-provider';
import styles from './flight-search-form.module.scss';

/**
 * @typedef {{origin: string, destination: string, departure: string,
 *   filters: import('../defaults').FlightFilters}} SearchValues
 */

/**
 * @param {{onSubmit?: (values: SearchValues) => Promise<void>,
 *   idPrefix?: string, initialDestination?: string}} props
 */
export function FlightSearchForm({
  onSubmit = demoSubmit,
  idPrefix = 'flight',
  initialDestination = '',
}) {
  const { scrollTo } = usePageScroll();
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
      scrollTo('#flight-search', {
        immediate: true,
        focus: document.getElementById(`${idPrefix}-destination`),
      });
    }
  }, [idPrefix, initialDestination, scrollTo]);
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
    <div className={styles['flight-search-form']}>
      <form onSubmit={submit} noValidate aria-label="Flight search">
        <div className={styles['flight-search-form__frame']}>
          <div className={styles['flight-search-form__fields']}>
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
            <DateField
              compact
              id={`${idPrefix}-departure`}
              label="Departure date"
              min={today()}
              value={values.departure}
              onValueChange={(value) => set('departure', value)}
              error={errors.departure}
              disabled={status === 'loading'}
            />
          </div>
          <Button type="submit" loading={status === 'loading'}>
            {status === 'loading'
              ? 'Searching…'
              : status === 'error'
                ? 'Try again'
                : 'Search flights'}
          </Button>
        </div>
        <div className={styles['flight-search-form__meta']}>
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
          <div className={styles['flight-search-form__summary']}>
            <p className={styles['flight-search-form__route']}>
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
