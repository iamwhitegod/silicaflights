'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button/button';
import { Combobox } from '@/components/ui/combobox/combobox';
import { DateField } from '@/components/ui/date-field/date-field';
import { Icon } from '@/components/ui/icon/icon';
import { Status } from '@/components/ui/status/status';
import { Text } from '@/components/ui/text/text';
import { Modal } from '@/components/ui/modal/modal';
import { cx } from '@/lib/cx';
import { today } from '@/lib/dates';
import { searchToQuery } from '@/lib/flights/search';
import { defaultFilters } from '../defaults';
import { validateSearch } from '../validation';
import { AdvancedSearchDialog } from '../advanced-search-dialog/advanced-search-dialog';
import { loadAirports } from '../airport-search';
import { airports } from '@/data/travel-locations';
import { usePageScroll } from '@/components/ui/scroll-provider/scroll-provider';
import { FlightOfferCard } from '@/components/flight-results/flight-offer-card/flight-offer-card';
import { FlightDetails } from '@/components/flight-results/flight-details/flight-details';
import styles from './flight-search-form.module.scss';

/** onSubmit resolves with an optional fixture search response; default navigates to /flights. */
export function FlightSearchForm({
  onSubmit,
  idPrefix = 'flight',
  initialDestination = '',
  initialValues,
  demo = false,
  results = false,
  busy = false,
}) {
  const router = useRouter();
  const { scrollTo } = usePageScroll();
  const [values, setValues] = useState(
    () =>
      initialValues || {
        origin: '',
        destination: airports.some((airport) => airport.value === initialDestination)
          ? initialDestination
          : '',
        departure: '',
        filters: { ...defaultFilters },
      },
  );
  const [selectedAirports, setSelectedAirports] = useState(() => {
    const selected = [...airports];
    for (const key of ['origin', 'destination']) {
      if (initialValues?.[key] && !selected.some((a) => a.value === initialValues[key]))
        selected.push({
          value: initialValues[key],
          label: initialValues[`${key}Label`] || initialValues[key],
        });
    }
    return selected;
  });
  const [errors, setErrors] = useState({});
  const [advanced, setAdvanced] = useState(false);
  const [preview, setPreview] = useState(null);
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const loading = busy || status === 'loading';
  const set = (key, value) => setValues((previous) => ({ ...previous, [key]: value }));
  useEffect(() => {
    if (initialDestination && airports.some((airport) => airport.value === initialDestination)) {
      scrollTo('#flight-search', {
        immediate: true,
        focus: document.getElementById(`${idPrefix}-destination`),
      });
    }
  }, [idPrefix, initialDestination, scrollTo]);
  async function submit(event) {
    event.preventDefault();
    if (pending.current || busy) return;
    const next = validateSearch(values);
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`${idPrefix}-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    pending.current = true;
    setStatus('loading');
    try {
      const search = {
        ...values,
        originLabel:
          selectedAirports.find((a) => a.value === values.origin)?.label || values.origin,
        destinationLabel:
          selectedAirports.find((a) => a.value === values.destination)?.label || values.destination,
      };
      if (onSubmit) {
        const result = await onSubmit(search);
        if (demo) setPreview(result);
      } else router.push(`/flights?${searchToQuery(search)}`);
      setStatus('idle');
    } catch (error) {
      setMessage(error.message || 'The search failed. Try again.');
      setStatus('error');
    } finally {
      pending.current = false;
    }
  }
  const travelers = values.filters.adults + values.filters.children + values.filters.infants;
  return (
    <div
      className={cx(styles['flight-search-form'], results && styles['flight-search-form--results'])}
    >
      <form onSubmit={submit} noValidate aria-label="Flight search">
        <div className={styles['flight-search-form__frame']}>
          <div className={styles['flight-search-form__fields']}>
            {['origin', 'destination'].map((key) => (
              <Combobox
                key={key}
                compact
                id={`${idPrefix}-${key}`}
                label={key === 'origin' ? 'From' : 'To'}
                options={selectedAirports}
                value={values[key]}
                loadOptions={demo ? undefined : loadAirports}
                openOnFocus={false}
                onValueChange={(value, option) => {
                  set(key, value);
                  if (option) {
                    setSelectedAirports((previous) => [
                      ...previous.filter((a) => a.value !== value),
                      option,
                    ]);
                    const nextField = document.getElementById(
                      `${idPrefix}-${key === 'origin' ? 'destination' : 'departure'}`,
                    );
                    if (nextField && !nextField.disabled && nextField.getClientRects().length)
                      nextField.focus();
                  }
                }}
                error={errors[key]}
                disabled={loading}
              />
            ))}
            <DateField
              compact
              id={`${idPrefix}-departure`}
              label="Departure date"
              min={today()}
              value={values.departure}
              onValueChange={(value) => set('departure', value)}
              error={errors.departure}
              disabled={loading}
            />
            {values.filters.trip === 'round-trip' && (
              <DateField
                compact
                id={`${idPrefix}-returnDate`}
                label="Return date"
                min={values.departure || today()}
                value={values.filters.returnDate}
                onValueChange={(value) => set('filters', { ...values.filters, returnDate: value })}
                error={errors.returnDate}
                disabled={loading}
              />
            )}
          </div>
          <Button type="submit" loading={loading}>
            {status === 'loading'
              ? 'Searching…'
              : status === 'error'
                ? 'Try again'
                : 'Search flights'}
          </Button>
        </div>
        <div className={styles['flight-search-form__meta']}>
          {!results && (
            <Text size="caption">
              {travelers} traveler
              {travelers === 1 ? '' : 's'}
            </Text>
          )}
          <Button
            id={`${idPrefix}-filters`}
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => setAdvanced(true)}
          >
            <Icon name="settings" /> Advanced settings
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
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        title="Flight results"
        description="Compare flights for your selected journey."
      >
        <div className={styles['flight-search-form__preview']}>
          {preview?.offers.map((offer) => (
            <FlightOfferCard
              key={offer.id}
              offer={offer}
              travelers={travelers}
              onDetails={() => {
                setPreview(null);
                setDetail(offer);
              }}
            />
          ))}
        </div>
      </Modal>
      <FlightDetails offer={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
