'use client';

/* eslint-disable @next/next/no-img-element -- Exact exported Figma glyphs. */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlightSearchForm } from '@/components/flight-search/flight-search-form/flight-search-form';
import { Button } from '@/components/ui/button/button';
import { Modal } from '@/components/ui/modal/modal';
import { Status } from '@/components/ui/status/status';
import { Spinner } from '@/components/ui/spinner/spinner';
import { Icon } from '@/components/ui/icon/icon';
import { cabins, searchToQuery } from '@/lib/flights/search';
import { flightPriceSchema, flightSearchSchema } from '@/lib/flights/schemas';
import { validateForm } from '@/lib/validation';
import { filterOffers, formatLocalDate } from '@/lib/flights/offers';
import { FlightOfferCard } from '../flight-offer-card/flight-offer-card';
import { FlightDetails } from '../flight-details/flight-details';
import styles from './flight-results.module.scss';

const initialFilters = { stops: 'any', sort: 'cheapest', currency: '', minPrice: '', maxPrice: '' };

export function FlightResults({ initialValues }) {
  const router = useRouter();
  const valid = flightSearchSchema.isValidSync(initialValues);
  const [status, setStatus] = useState(valid ? 'loading' : 'idle');
  const [offers, setOffers] = useState([]);
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [limit, setLimit] = useState(20);
  const [details, setDetails] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState(initialValues);
  const [now, setNow] = useState(() => Date.now());
  const budgetRef = useRef(null);
  useEffect(() => {
    function dismiss(event) {
      if (budgetRef.current && !budgetRef.current.contains(event.target))
        budgetRef.current.open = false;
    }

    document.addEventListener('pointerdown', dismiss);

    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!valid) return;
    const controller = new AbortController();

    async function run() {
      try {
        const response = await fetch('/api/flights/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initialValues),
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Search failed. Please try again.');
        if (data.testMode !== true || !Array.isArray(data.offers))
          throw new Error('Unexpected search response. Please try again.');
        if (controller.signal.aborted) return;
        setOffers(data.offers);
        const counts = new Map();
        for (const offer of data.offers)
          counts.set(offer.currency, (counts.get(offer.currency) || 0) + 1);
        const currency =
          [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || '';
        setFilters({ ...initialFilters, currency });
        setNow(Date.now());
        setStatus('success');
      } catch (error) {
        if (controller.signal.aborted) return;
        setMessage(
          error.name === 'TimeoutError'
            ? 'The search took too long. Please try again.'
            : error.message || 'Search unavailable. Please try again.',
        );
        setStatus('error');
      }
    }

    run();

    return () => controller.abort();
  }, [initialValues, valid, attempt]);

  function retry() {
    setStatus('loading');
    setDetails(null);
    setLimit(20);
    setAttempt((value) => value + 1);
  }

  function submit(values) {
    setEditing(false);
    const query = searchToQuery(values);
    if (query === searchToQuery(initialValues)) retry();
    else router.push(`/flights?${query}`);
  }

  function changeSearch(key, value) {
    const next = { ...initialValues, filters: { ...initialValues.filters, [key]: value } };
    if (!flightSearchSchema.isValidSync(next)) {
      setEditValues(next);
      setEditing(true);
    } else submit(next);
  }

  function setFilter(key, value) {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setLimit(20);
  }

  const liveOffers = offers.filter((offer) => Date.parse(offer.expiresAt) > now);
  const { errors: priceErrors } = validateForm(flightPriceSchema, filters);
  const priceError = priceErrors.minPrice || priceErrors.maxPrice || '';
  const visible = filterOffers(
    liveOffers,
    priceError ? { ...filters, minPrice: '', maxPrice: '' } : filters,
    initialValues.filters,
  );
  const currencies = [...new Set(liveOffers.map((offer) => offer.currency))].sort();
  const travelers =
    initialValues.filters.adults + initialValues.filters.children + initialValues.filters.infants;
  const select = (label, value, options, change) => (
    <label className={styles['flight-results__select']}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => change(event.target.value)}
        disabled={status === 'loading'}
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
      <Icon name="chevron-right" size="sm" className={styles['flight-results__chevron']} />
    </label>
  );

  return (
    <main id="main" className={styles['flight-results']}>
      <div className={styles['flight-results__background']} aria-hidden="true" />
      <header className={styles['flight-results__header']}>
        <div className={styles['flight-results__header-backdrop']} aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <div className={styles['flight-results__header-inner']}>
          <Link
            href="/"
            className={styles['flight-results__back']}
            aria-label="Back to flight search"
          >
            <img src="/images/flight-back.svg" alt="" width="24" height="24" />
          </Link>
          <h1 className="sr-only">Compare flights</h1>
          <div className={styles['flight-results__desktop-search']}>
            <FlightSearchForm
              results
              busy={status === 'loading'}
              initialValues={initialValues}
              idPrefix="results"
              onSubmit={submit}
            />
          </div>
          <button
            className={styles['flight-results__mobile-search']}
            type="button"
            onClick={() => {
              setEditValues(initialValues);
              setEditing(true);
            }}
            aria-label="Edit flight search"
            aria-describedby={valid ? 'results-journey-details' : undefined}
          >
            <span>{initialValues.originLabel || initialValues.origin || 'From'}</span>
            <img src="/images/flight-forward.svg" width="24" height="24" alt="to" />
            <span>{initialValues.destinationLabel || initialValues.destination || 'To'}</span>
          </button>
        </div>
      </header>
      <div className={styles['flight-results__content']}>
        {valid && (
          <p id="results-journey-details" className={styles['flight-results__journey-details']}>
            {formatLocalDate(initialValues.departure)}
            {initialValues.filters.trip === 'round-trip'
              ? ` — ${formatLocalDate(initialValues.filters.returnDate)}`
              : ''}{' '}
            · {travelers} traveler{travelers === 1 ? '' : 's'}
          </p>
        )}
        <div className={styles['flight-results__toolbar']}>
          <p role="status" className={styles['flight-results__count']}>
            {status === 'loading'
              ? 'Searching for flights…'
              : status === 'success'
                ? `${visible.length} flight option${visible.length === 1 ? '' : 's'} available`
                : 'Find your next flight'}
          </p>
          <div className={styles['flight-results__filters']}>
            {select(
              'Stops',
              filters.stops,
              [
                ['any', 'Stops: Any'],
                ['0', 'Nonstop'],
                ['1', 'Up to 1 stop'],
                ['2', 'Up to 2 stops'],
              ],
              (v) => setFilter('stops', v),
            )}
            {select(
              'Cabin class',
              initialValues.filters.cabin,
              cabins.map((c) => [c, c[0].toUpperCase() + c.slice(1)]),
              (v) => changeSearch('cabin', v),
            )}
            {select(
              'Trip type',
              initialValues.filters.trip,
              [
                ['one-way', 'One-way'],
                ['round-trip', 'Round trip'],
              ],
              (v) => changeSearch('trip', v),
            )}
            {select(
              'Sort flights',
              filters.sort,
              [
                ['cheapest', 'Sort: Cheapest'],
                ['shortest', 'Sort: Shortest'],
                ['earliest', 'Sort: Earliest'],
              ],
              (v) => setFilter('sort', v),
            )}
            {status === 'success' && liveOffers.length > 0 && (
              <details
                ref={budgetRef}
                className={styles['flight-results__budget']}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.currentTarget.open = false;
                    event.currentTarget.querySelector('summary').focus();
                  }
                }}
              >
                <summary>
                  Filter by price{filters.currency ? ` (${filters.currency})` : ''}
                  <Icon
                    name="chevron-right"
                    size="sm"
                    className={styles['flight-results__chevron']}
                  />
                </summary>
                <div className={styles['flight-results__budget-fields']}>
                  {currencies.length > 1 &&
                    select(
                      'Fare currency',
                      filters.currency,
                      currencies.map((c) => [c, c]),
                      (v) => {
                        setFilters((p) => ({ ...p, currency: v, minPrice: '', maxPrice: '' }));
                        setLimit(20);
                      },
                    )}
                  {['minPrice', 'maxPrice'].map((key) => (
                    <label key={key}>
                      {key === 'minPrice' ? 'Minimum' : 'Maximum'} total ({filters.currency})
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={filters[key]}
                        onChange={(event) => setFilter(key, event.target.value)}
                        aria-invalid={!!priceError}
                      />
                    </label>
                  ))}
                  <Button
                    size="sm"
                    variant="neutral"
                    onClick={() => {
                      setFilters((p) => ({ ...initialFilters, currency: p.currency }));
                      setLimit(20);
                    }}
                  >
                    Clear result filters
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      budgetRef.current.open = false;
                      budgetRef.current.querySelector('summary').focus();
                    }}
                  >
                    Done
                  </Button>
                  {priceError && <Status kind="error">{priceError}</Status>}
                </div>
              </details>
            )}
          </div>
        </div>
        {!valid && (
          <div className={styles['flight-results__message']}>
            <h2>Choose your journey</h2>
            <p>Enter your airports, dates, and travelers to compare flights.</p>
            <Button onClick={() => setEditing(true)}>Edit search</Button>
          </div>
        )}
        {status === 'loading' && (
          <div className={styles['flight-results__message']} role="status">
            <Spinner />
            <h2>Finding your flight options</h2>
            <p>Checking airline offers. This can take up to 30 seconds.</p>
          </div>
        )}
        {status === 'error' && (
          <div className={styles['flight-results__message']}>
            <Status kind="error">{message}</Status>
            <Button onClick={retry}>Try again</Button>
          </div>
        )}
        {status === 'success' && visible.length === 0 && (
          <div className={styles['flight-results__message']}>
            <h2>
              {!offers.length
                ? 'No flights found'
                : !liveOffers.length
                  ? 'These offers have expired'
                  : 'No options match your filters'}
            </h2>
            <p>
              {!offers.length
                ? 'Try another date or nearby airport.'
                : !liveOffers.length
                  ? 'Search again for a fresh set of fares.'
                  : 'Adjust price, stops, or departure times to see more options.'}
            </p>
            <Button
              onClick={
                !liveOffers.length && offers.length
                  ? retry
                  : () => {
                      setEditValues(initialValues);
                      setEditing(true);
                    }
              }
            >
              {!liveOffers.length && offers.length ? 'Search again' : 'Edit search'}
            </Button>
            {!!liveOffers.length && (
              <Button
                variant="neutral"
                onClick={() => {
                  setFilters((p) => ({ ...initialFilters, currency: p.currency }));
                  setLimit(20);
                }}
              >
                Clear result filters
              </Button>
            )}
          </div>
        )}
        {status === 'success' && (
          <div className={styles['flight-results__list']}>
            {visible.slice(0, limit).map((offer) => (
              <FlightOfferCard
                key={offer.id}
                offer={offer}
                travelers={travelers}
                onDetails={() => setDetails(offer)}
              />
            ))}
          </div>
        )}
        {status === 'success' && visible.length > limit && (
          <Button
            className={styles['flight-results__more']}
            onClick={() => setLimit((value) => value + 20)}
          >
            Show more ({visible.length - limit} remaining)
          </Button>
        )}
      </div>
      <Modal open={editing} onOpenChange={setEditing} title="Edit flight search">
        <FlightSearchForm
          key={searchToQuery(editValues)}
          initialValues={editValues}
          idPrefix="edit"
          onSubmit={submit}
        />
      </Modal>
      <FlightDetails
        offer={details}
        expired={!!details && Date.parse(details.expiresAt) <= now}
        onClose={() => setDetails(null)}
      />
    </main>
  );
}
