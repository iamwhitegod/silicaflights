import { randomUUID } from 'node:crypto';
import { readFlightConfig } from './config.js';
import { abortable, FlightServiceError, safeError } from './errors.js';
import { createDuffelClient } from './providers/duffel.js';
import { createTravelportClient } from './providers/travelport.js';

// Explicit serialization: no supplier identifiers, raw payloads, or credentials escape.
function publicOffer(offer) {
  const condition = (value) =>
    value && typeof value.allowed === 'boolean'
      ? {
          allowed: value.allowed,
          penaltyAmount: value.penaltyAmount ?? null,
          penaltyCurrency: value.penaltyCurrency ?? null,
        }
      : null;

  return {
    id: randomUUID(),
    amount: offer.amount,
    currency: offer.currency,
    expiresAt: offer.expiresAt,
    conditions: {
      change_before_departure: condition(offer.conditions?.change_before_departure),
      refund_before_departure: condition(offer.conditions?.refund_before_departure),
    },
    slices: offer.slices.map((slice) => ({
      id: randomUUID(),
      duration: slice.duration,
      segments: slice.segments.map((segment) => ({
        id: randomUUID(),
        origin: {
          code: segment.origin.code,
          name: segment.origin.name,
          city: segment.origin.city,
          timeZone: segment.origin.timeZone,
        },
        destination: {
          code: segment.destination.code,
          name: segment.destination.name,
          city: segment.destination.city,
          timeZone: segment.destination.timeZone,
        },
        departingAt: segment.departingAt,
        arrivingAt: segment.arrivingAt,
        duration: segment.duration,
        carrier: {
          name: segment.carrier.name,
          code: segment.carrier.code,
          logo: segment.carrier.logo,
        },
        flightNumber: segment.flightNumber,
        passengers: segment.passengers.map((passenger) => ({
          cabin: passenger.cabin,
          cabinName: passenger.cabinName,
          baggage: passenger.baggage.map((bag) => ({
            type: bag.type,
            quantity: bag.quantity ?? null,
            weight: bag.weight ?? null,
            weightUnit: bag.weightUnit ?? null,
            included: bag.included ?? null,
          })),
        })),
      })),
    })),
  };
}

export function createFlightService({
  env = process.env,
  fetcher = fetch,
  now = Date.now,
  logger = console.info,
  timeoutMs = 30000,
} = {}) {
  let active;

  return async function searchFlights(values, signal) {
    const startedAt = now();
    let config;
    try {
      config = readFlightConfig(env);
      const key = JSON.stringify(config);
      if (active?.key !== key)
        active = {
          key,
          client: (config.provider === 'duffel' ? createDuffelClient : createTravelportClient)(
            config.settings,
            { fetcher, now },
          ),
        };
      const deadline = AbortSignal.timeout(timeoutMs);
      const requestSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
      requestSignal.throwIfAborted();
      const result = await abortable(active.client.search(values, requestSignal), requestSignal);
      if (result.testMode !== true || !Array.isArray(result.offers))
        throw new FlightServiceError('malformed');
      logger({
        event: 'flight_search',
        provider: config.provider,
        elapsedMs: now() - startedAt,
        offers: result.offers.length,
        status: 'success',
      });

      return { id: randomUUID(), testMode: true, offers: result.offers.map(publicOffer) };
    } catch (error) {
      const safe = safeError(error);
      logger({
        event: 'flight_search',
        provider: config?.provider || 'unconfigured',
        elapsedMs: now() - startedAt,
        status: signal?.aborted ? 'cancelled' : safe.category,
        fields: safe.fields,
      });
      throw safe;
    }
  };
}
