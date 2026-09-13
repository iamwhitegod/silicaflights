'use client';
/* eslint-disable @next/next/no-img-element -- Duffel logos and exact exported Figma glyphs. */
import { useState } from 'react';
import { Button } from '@/components/ui/button/button';
import { formatDuration, formatMoney, formatLocalDate } from '@/lib/flights/offers';
import styles from './flight-offer-card.module.scss';

function AirlineLogo({ carrier }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={styles['flight-offer-card__logo']}>
      {carrier.logo && !failed ? (
        <img src={carrier.logo} alt="" width="40" height="40" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{carrier.code || carrier.name.slice(0, 2)}</span>
      )}
    </span>
  );
}

export function FlightOfferCard({ offer, travelers = 1, expired = false, onDetails }) {
  const carriers = [
    ...new Map(
      offer.slices.flatMap((slice) =>
        slice.segments.map((segment) => [segment.carrier.name, segment.carrier]),
      ),
    ).values(),
  ];
  return (
    <article
      className={styles['flight-offer-card']}
      aria-label={`Flight option with ${carriers.map((c) => c.name).join(' and ')}`}
    >
      <div className={styles['flight-offer-card__airlines']}>
        <div className={styles['flight-offer-card__logos']}>
          {carriers.map((carrier) => (
            <AirlineLogo key={carrier.name} carrier={carrier} />
          ))}
        </div>
        <p>{carriers.map((carrier) => carrier.name).join(' · ')}</p>
      </div>
      <div className={styles['flight-offer-card__journeys']}>
        {offer.slices.map((slice, index) => {
          const first = slice.segments[0],
            last = slice.segments.at(-1);
          const stops = slice.segments.length - 1;
          return (
            <div key={slice.id || index} className={styles['flight-offer-card__journey']}>
              <p className={styles['flight-offer-card__duration']}>
                {offer.slices.length > 1 ? `${index ? 'Return' : 'Outbound'} · ` : ''}
                {formatLocalDate(first.departingAt)} · {formatDuration(slice.duration)}
              </p>
              <div className={styles['flight-offer-card__route']}>
                <div>
                  <time dateTime={first.departingAt}>{first.departingAt.slice(11, 16)}</time>
                  <span>{first.origin.code}</span>
                </div>
                <div className={styles['flight-offer-card__connection']}>
                  <div className={styles['flight-offer-card__line']}>
                    <img src="/images/flight-plane.svg" alt="" width="20" height="20" />
                  </div>
                  <span>
                    {stops
                      ? `${stops} stop${stops > 1 ? 's' : ''} · ${slice.segments
                          .slice(0, -1)
                          .map((s) => s.destination.code)
                          .join(', ')}`
                      : 'Nonstop'}
                  </span>
                </div>
                <div>
                  <time dateTime={last.arrivingAt}>{last.arrivingAt.slice(11, 16)}</time>
                  <span>{last.destination.code}</span>
                </div>
              </div>
              {last.arrivingAt.slice(0, 10) !== first.departingAt.slice(0, 10) && (
                <p className={styles['flight-offer-card__arrival']}>
                  Arrives {formatLocalDate(last.arrivingAt)}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className={styles['flight-offer-card__price']}>
        <strong>{formatMoney(offer.amount, offer.currency)}</strong>
        <span>
          {offer.slices.length > 1 ? 'Round trip' : 'One-way'} · {travelers} traveler
          {travelers === 1 ? '' : 's'}
        </span>
        <span>Total including taxes</span>
        <Button size="sm" className={styles['flight-offer-card__button']} onClick={onDetails}>
          {expired ? 'View expired offer' : 'View details'}
        </Button>
        {expired && <span>Expired · search again for current offers</span>}
      </div>
    </article>
  );
}
