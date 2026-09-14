import { airportDetails } from '../../airports.js';
import { FlightServiceError } from '../errors.js';

const list = (value) => (Array.isArray(value) ? value : []);
const matches = (references, value) => !references?.length || references.includes(value);
const price = (value) => {
  const amount = String(value?.TotalPrice ?? '');
  const currency = value?.CurrencyCode?.value;

  return /^\d+(\.\d+)?$/.test(amount) &&
    Number.isFinite(Number(amount)) &&
    /^[A-Z]{3}$/.test(currency)
    ? { amount, currency }
    : null;
};

function baggageFor(terms, product, passenger, sequence) {
  const allowances = list(terms.BaggageAllowance).filter(
    (allowance) =>
      matches(allowance.ProductRef, product.id) &&
      matches(allowance.passengerTypeCodes, passenger.passengerTypeCode) &&
      matches(allowance.SegmentSequenceList, sequence),
  );
  const bags = new Map();
  for (const allowance of allowances) {
    const type =
      allowance.baggageType === 'CarryOn'
        ? 'carry_on'
        : /CheckedBag|AdditionalBags/.test(allowance.baggageType)
          ? 'checked'
          : allowance.baggageType === 'PersonalItem'
            ? 'personal_item'
            : null;
    if (!type) continue;
    for (const item of list(allowance.BaggageItem)) {
      const measurements = list(item.Measurement).filter(
        (m) => m.measurementType === 'Weight' && Number(m.value) > 0,
      );
      const measurement =
        measurements.find((m) => m.unit === 'Kilograms') ||
        measurements.find((m) => m.unit === 'Pounds');
      const quantity =
        item.soldByWeightInd !== true && Number.isInteger(item.quantity) && item.quantity >= 0
          ? item.quantity
          : null;
      const weight = measurement ? Number(measurement.value) : null;
      if (quantity === null && weight === null) continue;
      const included =
        item.includedInOfferPrice === 'Yes'
          ? true
          : item.includedInOfferPrice === 'No'
            ? false
            : null;
      const weightUnit = weight === null ? null : measurement.unit === 'Kilograms' ? 'kg' : 'lb';
      const key = JSON.stringify([type, weight, weightUnit, included, quantity === null]);
      const previous = bags.get(key);
      bags.set(key, {
        type,
        quantity: quantity === null ? null : quantity + (previous?.quantity || 0),
        weight,
        weightUnit,
        included,
      });
    }
  }

  return [...bags.values()];
}

function beforeDeparture(terms, product, passenger, sequence, kind, currency) {
  const rules = list(terms.Penalties)
    .filter((p) => matches(p.PassengerTypeCodes, passenger.passengerTypeCode))
    .flatMap((p) => list(p[kind]))
    .filter(
      (rule) =>
        matches(rule.ProductRefs, product.id) &&
        matches(rule.SegmentSequence, sequence) &&
        (!rule.penaltyTypes?.length ||
          rule.penaltyTypes.some((type) => ['Anytime', 'BeforeDeparture'].includes(type))),
    );
  if (!rules.length) return null;
  if (
    rules.some(
      (rule) => rule['@type'] === `${kind}NotPermitted` || String(rule.NotPermittedInd) === 'true',
    )
  )
    return { allowed: false };
  if (rules.some((rule) => rule['@type'] !== `${kind}Permitted`)) return null;
  const penalties = rules.flatMap((rule) => list(rule.Penalty));
  if (
    kind === 'Cancel' &&
    penalties.some((p) => p['@type'] === 'PenaltyPercent' && Number(p.Percent) >= 100)
  )
    return { allowed: false };
  const amounts = penalties.filter((p) => p['@type'] === 'PenaltyAmount').map((p) => p.Amount);
  if (
    amounts.length === 1 &&
    penalties.length === 1 &&
    Number(amounts[0]?.value) >= 0 &&
    (amounts[0].code || amounts[0].value === 0)
  )
    return {
      allowed: true,
      penaltyAmount: String(amounts[0].value),
      penaltyCurrency: amounts[0].code || currency,
    };

  return { allowed: true, penaltyAmount: null, penaltyCurrency: null };
}

function combineConditions(conditions) {
  if (conditions.some((condition) => condition?.allowed === false)) return { allowed: false };
  if (conditions.some((condition) => !condition)) return null;
  const first = conditions[0];
  if (!first) return null;

  return conditions.every((condition) => JSON.stringify(condition) === JSON.stringify(first))
    ? first
    : { allowed: true, penaltyAmount: null, penaltyCurrency: null };
}

function buildSlice(candidate, references, currency) {
  const { product, terms, brand } = candidate;
  const changes = [],
    refunds = [];
  const flightSegments = [...list(product.FlightSegment)].sort((a, b) => a.sequence - b.sequence);
  if (!flightSegments.length) return null;
  const segments = [];
  for (const segment of flightSegments) {
    const flight = references.Flight.get(segment.Flight?.FlightRef) || segment.Flight;
    const departure = flight?.Departure,
      arrival = flight?.Arrival;
    if (!/^[A-Z]{3}$/.test(departure?.location) || !/^[A-Z]{3}$/.test(arrival?.location))
      return null;
    const departingAt = `${departure.date}T${departure.time}`;
    const arrivingAt = `${arrival.date}T${arrival.time}`;
    if (!Number.isFinite(Date.parse(departingAt)) || !Number.isFinite(Date.parse(arrivingAt)))
      return null;
    const passengers = [];
    for (const passenger of list(product.PassengerFlight)) {
      if (
        !Number.isInteger(passenger.passengerQuantity) ||
        passenger.passengerQuantity < 1 ||
        passenger.passengerQuantity > 9
      )
        return null;
      const cabin = list(passenger.FlightProduct).find((p) =>
        matches(p.segmentSequence, segment.sequence),
      );
      changes.push(
        beforeDeparture(terms, product, passenger, segment.sequence, 'Change', currency),
      );
      refunds.push(
        beforeDeparture(terms, product, passenger, segment.sequence, 'Cancel', currency),
      );
      for (let i = 0; i < passenger.passengerQuantity; i++)
        passengers.push({
          cabin: cabin?.cabin?.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() || null,
          cabinName: references.Brand.get(cabin?.Brand?.BrandRef)?.name || brand?.name || null,
          baggage: baggageFor(terms, product, passenger, segment.sequence),
        });
    }
    const carrierCode =
      flight.operatingCarrier || (flight.operatingCarrierName ? '' : flight.carrier) || '';
    segments.push({
      origin: airportDetails(departure.location),
      destination: airportDetails(arrival.location),
      departingAt,
      arrivingAt,
      duration: flight.duration || null,
      carrier: {
        code: carrierCode,
        name: flight.operatingCarrierName || carrierCode || 'Airline unavailable',
        logo: null,
      },
      // Marketing flight numbers remain useful when a codeshare has no operating number.
      flightNumber: `${flight.carrier || ''} ${flight.number || ''}`.trim(),
      passengers,
    });
  }
  if (
    segments.some((segment, i) => i > 0 && segment.origin.code !== segments[i - 1].destination.code)
  )
    return null;

  return { slice: { duration: product.totalDuration || null, segments }, changes, refunds };
}

function makeOffer(candidates, references, values, startedAt) {
  const fare = candidates[0].fare;
  const built = candidates.map((candidate) => buildSlice(candidate, references, fare.currency));
  if (built.some((slice) => !slice)) return null;
  const slices = built.map((item) => item.slice);
  if (
    slices.some((slice, index) => {
      const expectedOrigin = index ? values.destination : values.origin;
      const expectedDestination = index ? values.origin : values.destination;
      const expectedDate = index ? values.filters.returnDate : values.departure;

      return (
        slice.segments[0].origin.code !== expectedOrigin ||
        slice.segments.at(-1).destination.code !== expectedDestination ||
        slice.segments[0].departingAt.slice(0, 10) !== expectedDate
      );
    })
  )
    return null;
  const expiries = candidates
    .map((candidate) => Date.parse(candidate.terms.ExpiryDate))
    .filter(Number.isFinite);
  const expiresAt = new Date(Math.min(startedAt + 10 * 60000, ...expiries)).toISOString();

  return {
    ...fare,
    expiresAt,
    slices,
    conditions: {
      change_before_departure: combineConditions(built.flatMap((item) => item.changes)),
      refund_before_departure: combineConditions(built.flatMap((item) => item.refunds)),
    },
  };
}

export function normalizeTravelportResponse(payload, values, startedAt = Date.now()) {
  const root = payload?.CatalogProductOfferingsResponse;
  if (!root || list(root.Result?.Error).length)
    throw new FlightServiceError(root ? 'upstream' : 'malformed');
  const offerings = root.CatalogProductOfferings?.CatalogProductOffering;
  if (!Array.isArray(offerings)) throw new FlightServiceError('malformed');
  if (!offerings.length) return { offers: [], testMode: true };
  const references = Object.fromEntries(
    ['Flight', 'Product', 'Brand', 'TermsAndConditions'].map((key) => [
      key,
      new Map(
        list(root.ReferenceList)
          .flatMap((ref) => list(ref[key]))
          .map((value) => [value.id, value]),
      ),
    ]),
  );
  const byLeg = [[], []];
  for (const offering of offerings) {
    const leg = Number(offering.sequence) - 1;
    if (![0, 1].includes(leg)) continue;
    for (const option of list(offering.ProductBrandOptions).flatMap((group) =>
      list(group.ProductBrandOffering),
    )) {
      const fare = price(option.BestCombinablePrice);
      if (!fare) continue;
      const terms =
        references.TermsAndConditions.get(option.TermsAndConditions?.termsAndConditionsRef) || {};
      for (const ref of list(option.Product)) {
        const product = references.Product.get(ref.productRef);
        if (product)
          byLeg[leg].push({
            product,
            fare,
            terms,
            brand: references.Brand.get(option.Brand?.BrandRef),
            codes: list(option.CombinabilityCode).filter(
              (code) => typeof code === 'string' && !/(^|f\d+)j0$/.test(code),
            ),
            source: option.ContentSource || '',
          });
      }
    }
  }
  const offers = [],
    seen = new Set();

  function add(candidates) {
    const identity = JSON.stringify(
      candidates.map((c) => [c.product.id, c.terms.id, c.brand?.id, c.fare]),
    );
    if (seen.has(identity)) return;
    seen.add(identity);
    const offer = makeOffer(candidates, references, values, startedAt);
    if (offer) offers.push(offer);
  }

  if (values.filters.trip === 'one-way') byLeg[0].forEach((candidate) => add([candidate]));
  else {
    // BestCombinablePrice is a WHOLE JOURNEY total, never the sum of leg prices.
    // Match both code and total: one NDC product can participate in several fare combinations.
    const inbound = new Map();
    const key = (c, code) =>
      JSON.stringify([c.source, code, c.fare.currency, Number(c.fare.amount)]);
    for (const candidate of byLeg[1])
      for (const code of candidate.codes) {
        const id = key(candidate, code);
        const group = inbound.get(id) || [];
        group.push(candidate);
        inbound.set(id, group);
      }
    for (const outbound of byLeg[0])
      for (const code of outbound.codes)
        for (const candidate of inbound.get(key(outbound, code)) || []) add([outbound, candidate]);
  }
  if (!offers.length) throw new FlightServiceError('malformed');

  return { offers, testMode: true };
}
