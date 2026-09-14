import { FlightServiceError, abortable, responseError, safeError } from '../errors.js';
import { normalizeTravelportResponse } from './travelport-offers.js';

// Pre-production endpoints from the provisioned MyTravelport trial dashboard.
export const AUTH_URL = 'https://auth.pp.travelport.com/oauth/token';

export const SEARCH_URL =
  'https://api.pp.travelport.net/11/air/catalog/search/catalogproductofferings';

export function createTravelportRequest(values, contentSources) {
  const f = values.filters;
  const leg = (origin, destination, departure) => ({
    '@type': 'SearchCriteriaFlight',
    departureDate: departure,
    From: { value: origin },
    To: { value: destination },
  });
  const legs = [leg(values.origin, values.destination, values.departure)];
  if (f.trip === 'round-trip') legs.push(leg(values.destination, values.origin, f.returnDate));
  const passengers = [{ '@type': 'PassengerCriteria', number: f.adults, passengerTypeCode: 'ADT' }];
  for (const age of f.childAges)
    passengers.push({ '@type': 'PassengerCriteria', number: 1, passengerTypeCode: 'CNN', age });
  if (f.infants)
    passengers.push({ '@type': 'PassengerCriteria', number: f.infants, passengerTypeCode: 'INF' });

  return {
    '@type': 'CatalogProductOfferingsQueryRequest',
    CatalogProductOfferingsRequest: {
      '@type': 'CatalogProductOfferingsRequestAir',
      offersPerPage: 100,
      maxNumberOfUpsellsToReturn: 4,
      contentSourceList: contentSources,
      PassengerCriteria: passengers,
      SearchCriteriaFlight: legs,
      SearchModifiersAir: {
        '@type': 'SearchModifiersAir',
        CabinPreference: [
          {
            '@type': 'CabinPreference',
            preferenceType: 'Permitted',
            cabins: [
              {
                economy: 'Economy',
                'premium economy': 'PremiumEconomy',
                business: 'Business',
                first: 'First',
              }[f.cabin],
            ],
          },
        ],
      },
      CustomResponseModifiersAir: {
        '@type': 'CustomResponseModifiersAir',
        SearchRepresentation: 'Journey',
      },
    },
  };
}

export function createTravelportClient(settings, { fetcher = fetch, now = Date.now } = {}) {
  let cachedToken;
  let refreshing;

  async function token(signal) {
    if (cachedToken && now() < cachedToken.expiresAt) return cachedToken;
    if (!refreshing) {
      refreshing = (async () => {
        const response = await fetcher(AUTH_URL, {
          method: 'POST',
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            client_id: settings.TRAVELPORT_CLIENT_ID,
            client_secret: settings.TRAVELPORT_CLIENT_SECRET,
            username: settings.TRAVELPORT_USERNAME,
            password: settings.TRAVELPORT_PASSWORD,
            grant_type: 'password',
          }),
        });
        if (!response.ok)
          throw [400, 422].includes(response.status)
            ? new FlightServiceError('authentication')
            : responseError(response.status);
        let data;
        try {
          data = await response.json();
        } catch {
          throw new FlightServiceError('malformed');
        }
        if (
          typeof data?.access_token !== 'string' ||
          !data.access_token.trim() ||
          !Number.isFinite(Number(data.expires_in)) ||
          Number(data.expires_in) <= 0
        )
          throw new FlightServiceError('malformed');
        const lifetime = Number(data.expires_in) * 1000;
        cachedToken = {
          value: data.access_token,
          expiresAt: now() + lifetime - Math.min(60000, lifetime / 10),
        };

        return cachedToken;
      })().finally(() => {
        refreshing = null;
      });
    }

    return abortable(refreshing, signal);
  }

  return {
    async search(values, signal) {
      try {
        const startedAt = now();
        const data = createTravelportRequest(values, [
          ...new Set(settings.TRAVELPORT_CONTENT_SOURCES.split(',')),
        ]);
        let response;
        for (let attempt = 0; attempt < 2; attempt++) {
          signal?.throwIfAborted();
          const auth = await token(signal);
          signal?.throwIfAborted();
          response = await fetcher(SEARCH_URL, {
            method: 'POST',
            cache: 'no-store',
            signal,
            headers: {
              Authorization: `Bearer ${auth.value}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Accept-Version': '11',
              'Content-Version': '11',
              'TVP-PCC-Core': settings.TRAVELPORT_PCC,
              TraceId: crypto.randomUUID(),
            },
            body: JSON.stringify(data),
          });
          if (response.status !== 401 || attempt === 1) break;
          await response.body?.cancel();
          if (cachedToken === auth) cachedToken = null;
        }
        if (!response.ok) throw responseError(response.status);
        let payload;
        try {
          payload = await response.json();
        } catch {
          throw new FlightServiceError('malformed');
        }

        return normalizeTravelportResponse(payload, values, startedAt);
      } catch (error) {
        throw safeError(error);
      }
    },
  };
}
