// Synthetic test response. Contains no real credentials or passenger information.
export const rawOffer = {
  id: 'off-test',
  total_amount: '180.50',
  total_currency: 'USD',
  expires_at: '2099-01-01T00:00:00Z',
  client_key: 'private-client-key',
  passengers: [{ id: 'private-passenger-id' }],
  conditions: { refund_before_departure: { allowed: false } },
  slices: [
    {
      id: 'slice-1',
      duration: 'PT6H',
      segments: [
        {
          id: 'segment-1',
          duration: 'PT6H',
          origin: { iata_code: 'LOS', name: 'Lagos' },
          destination: { iata_code: 'LHR', name: 'Heathrow' },
          departing_at: '2027-01-15T23:30:00',
          arriving_at: '2027-01-16T05:30:00',
          operating_carrier: {
            name: 'Operating Airline',
            iata_code: 'OP',
            logo_symbol_url: 'https://example.com/logo.svg',
          },
          passengers: [{ cabin_class: 'economy', baggages: [{ type: 'checked', quantity: 1 }] }],
        },
      ],
    },
  ],
};
