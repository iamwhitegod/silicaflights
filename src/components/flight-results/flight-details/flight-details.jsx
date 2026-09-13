import { Modal } from '@/components/ui/modal/modal';
import { formatDuration, formatMoney, formatLocalDate } from '@/lib/flights/offers';
import styles from './flight-details.module.scss';

export function FlightDetails({ offer, onClose, expired = false }) {
  function condition(key) {
    const value = offer?.conditions?.[key];
    if (!value || typeof value.allowed !== 'boolean') return 'Not provided by the airline';
    if (!value.allowed) return 'Not allowed';
    return value.penaltyAmount != null && value.penaltyCurrency
      ? `Allowed · penalty ${formatMoney(value.penaltyAmount, value.penaltyCurrency)}`
      : 'Allowed · check with the airline for fees';
  }
  return (
    <Modal
      open={!!offer}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Itinerary details"
      description="Test offer · times are local to each airport. Booking is not available."
    >
      {offer && (
        <div className={styles['flight-details']}>
          <p className={styles['flight-details__price']}>
            {formatMoney(offer.amount, offer.currency)}{' '}
            <span>Total for all travelers, including taxes</span>
          </p>
          {expired && (
            <p role="status">This offer has expired. Search again to see current offers.</p>
          )}
          {offer.slices.map((slice, sliceIndex) => (
            <section key={slice.id || sliceIndex}>
              <h3>
                {sliceIndex ? 'Return' : 'Outbound'} · {formatDuration(slice.duration)}
              </h3>
              <ol className={styles['flight-details__segments']}>
                {slice.segments.map((segment, index) => (
                  <li key={segment.id || index}>
                    <h4>
                      {segment.carrier.name} · {segment.flightNumber}
                    </h4>
                    <p>
                      {segment.origin.city} ({segment.origin.code}) → {segment.destination.city} (
                      {segment.destination.code})
                    </p>
                    <p>
                      <time dateTime={segment.departingAt}>
                        {formatLocalDate(segment.departingAt)} · {segment.departingAt.slice(11, 16)}
                      </time>{' '}
                      —{' '}
                      <time dateTime={segment.arrivingAt}>
                        {formatLocalDate(segment.arrivingAt)} · {segment.arrivingAt.slice(11, 16)}
                      </time>
                    </p>
                    <p>
                      {segment.origin.name} → {segment.destination.name}
                    </p>
                    <p>{formatDuration(segment.duration)}</p>
                    {segment.passengers.length ? (
                      segment.passengers.map((passenger, passengerIndex) => (
                        <p key={passengerIndex}>
                          Traveler {passengerIndex + 1} ·{' '}
                          {passenger.cabinName ||
                            passenger.cabin?.replaceAll('_', ' ') ||
                            'Cabin not supplied'}
                          <br />
                          {passenger.baggage.length
                            ? passenger.baggage
                                .map(
                                  (bag) =>
                                    `${bag.quantity} ${bag.type.replaceAll('_', ' ')} bag${bag.quantity === 1 ? '' : 's'}`,
                                )
                                .join(' · ')
                            : 'Baggage allowance not supplied'}
                        </p>
                      ))
                    ) : (
                      <p>Baggage allowance not supplied</p>
                    )}
                    {index < slice.segments.length - 1 && (
                      <p className={styles['flight-details__connection']}>
                        Connection at {segment.destination.name} ({segment.destination.code})
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
          <section>
            <h3>Fare conditions</h3>
            <dl>
              <dt>Changes before departure</dt>
              <dd>{condition('change_before_departure')}</dd>
              <dt>Refunds before departure</dt>
              <dd>{condition('refund_before_departure')}</dd>
            </dl>
          </section>
        </div>
      )}
    </Modal>
  );
}
