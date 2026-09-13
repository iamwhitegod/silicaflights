import { Modal } from '@/components/ui/modal/modal';
import { Icon } from '@/components/ui/icon/icon';
import { formatDuration, formatMoney, formatLocalDate } from '@/lib/flights/offers';
import styles from './flight-details.module.scss';

function FlightEndpoint({ label, place, dateTime }) {
  return (
    <div className={styles['flight-details__endpoint']}>
      <p className={styles['flight-details__label']}>{label}</p>
      <time dateTime={dateTime}>
        <strong>{dateTime.slice(11, 16)}</strong>
        <span>{formatLocalDate(dateTime)}</span>
      </time>
      <p className={styles['flight-details__airport']}>
        <strong>{place.code}</strong> {place.city}
      </p>
      <p className={styles['flight-details__airport-name']}>{place.name}</p>
    </div>
  );
}

export function FlightDetails({ offer, onClose, expired = false }) {
  function condition(key) {
    const value = offer?.conditions?.[key];
    if (!value || typeof value.allowed !== 'boolean') return 'Not provided by the airline';
    if (!value.allowed) return 'Not allowed';
    return value.penaltyAmount != null && value.penaltyCurrency
      ? `Allowed · penalty ${formatMoney(value.penaltyAmount, value.penaltyCurrency)}`
      : 'Allowed · check with the airline for fees';
  }
  const outbound = offer?.slices[0];
  return (
    <Modal
      open={!!offer}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Itinerary details"
      description="Times are local to each airport."
      size="wide"
      stickyHeader
    >
      {offer && (
        <div className={styles['flight-details']}>
          <section className={styles['flight-details__summary']} aria-label="Fare summary">
            <div>
              <p className={styles['flight-details__label']}>Total fare</p>
              <p className={styles['flight-details__price']}>
                {formatMoney(offer.amount, offer.currency)}
              </p>
              <p className={styles['flight-details__taxes']}>All travelers · taxes included</p>
            </div>
            <div className={styles['flight-details__trip']}>
              <span>{offer.slices.length > 1 ? 'Round trip' : 'One-way'}</span>
              <p>
                <strong>{outbound.segments[0].origin.code}</strong>
                <Icon name="chevron-right" size="sm" />
                <strong>{outbound.segments.at(-1).destination.code}</strong>
              </p>
            </div>
          </section>
          {expired && (
            <p role="status" className={styles['flight-details__expired']}>
              This offer has expired. Search again to see current offers.
            </p>
          )}
          <div className={styles['flight-details__journeys']}>
            {offer.slices.map((slice, sliceIndex) => (
              <section className={styles['flight-details__journey']} key={slice.id || sliceIndex}>
                <header className={styles['flight-details__journey-header']}>
                  <h3>{sliceIndex ? 'Return' : 'Outbound'}</h3>
                  <p>
                    <Icon name="clock" size="sm" />
                    {formatDuration(slice.duration)}
                    <span>
                      ·{' '}
                      {slice.segments.length === 1
                        ? 'Nonstop'
                        : `${slice.segments.length - 1} stop${slice.segments.length > 2 ? 's' : ''}`}
                    </span>
                  </p>
                </header>
                <ol className={styles['flight-details__segments']}>
                  {slice.segments.map((segment, index) => (
                    <li key={segment.id || index}>
                      <div className={styles['flight-details__segment']}>
                        <div className={styles['flight-details__airline']}>
                          <span
                            className={styles['flight-details__airline-code']}
                            aria-hidden="true"
                          >
                            {segment.carrier.code || segment.carrier.name.slice(0, 2)}
                          </span>
                          <div>
                            <h4>{segment.carrier.name}</h4>
                            <p>
                              {segment.flightNumber} · {formatDuration(segment.duration)}
                            </p>
                          </div>
                        </div>
                        <div className={styles['flight-details__route']}>
                          <FlightEndpoint
                            label="Departure"
                            place={segment.origin}
                            dateTime={segment.departingAt}
                          />
                          <Icon
                            name="chevron-right"
                            className={styles['flight-details__route-arrow']}
                          />
                          <FlightEndpoint
                            label="Arrival"
                            place={segment.destination}
                            dateTime={segment.arrivingAt}
                          />
                        </div>
                        <div className={styles['flight-details__allowance']}>
                          <p className={styles['flight-details__label']}>Cabin &amp; baggage</p>
                          {segment.passengers.length ? (
                            <ul className={styles['flight-details__travelers']}>
                              {segment.passengers.map((passenger, passengerIndex) => (
                                <li key={passengerIndex}>
                                  <p>
                                    <strong>Traveler {passengerIndex + 1}</strong> ·{' '}
                                    {passenger.cabinName ||
                                      passenger.cabin?.replaceAll('_', ' ') ||
                                      'Cabin not supplied'}
                                  </p>
                                  <p>
                                    {passenger.baggage.length
                                      ? passenger.baggage
                                          .map(
                                            (bag) =>
                                              `${bag.quantity} ${bag.type.replaceAll('_', ' ')} bag${bag.quantity === 1 ? '' : 's'}`,
                                          )
                                          .join(' · ')
                                      : 'Baggage allowance not supplied'}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>Baggage allowance not supplied</p>
                          )}
                        </div>
                      </div>
                      {index < slice.segments.length - 1 && (
                        <p className={styles['flight-details__connection']}>
                          <Icon name="clock" size="sm" />
                          Connection at {segment.destination.name} ({segment.destination.code})
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
          <section className={styles['flight-details__conditions']}>
            <h3>Fare conditions</h3>
            <dl>
              <div>
                <dt>Changes before departure</dt>
                <dd>{condition('change_before_departure')}</dd>
              </div>
              <div>
                <dt>Refunds before departure</dt>
                <dd>{condition('refund_before_departure')}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </Modal>
  );
}
