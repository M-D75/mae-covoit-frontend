import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/supabaseClient.js', () => ({
  default: {},
}));

import { normalizePassengerTrips } from '@/services/travels.js';

const baseRecord = {
  id: 101,
  is_accepted: true,
  is_refused: false,
  trip: {
    id: 999,
    driver_id: 'driver-1',
    account: {
      avatar: 'https://example.com/avatar.png',
      username: 'Driver',
    },
    village_departure_id: 1,
    village_arrival_id: 2,
    departure_time: '2024-01-01T10:00:00.000Z',
    max_seats: 3,
    price: 12,
    route: {
      infosGoogle: {
        duration: '0s',
      },
    },
  },
};

describe('normalizePassengerTrips', () => {
  it('normalizes booking rows into UI-friendly objects', () => {
    const resolver = (id) => (id === 1 ? 'Village A' : 'Village B');
    const [trip] = normalizePassengerTrips([baseRecord], resolver);

    expect(trip).toBeTruthy();
    expect(trip.id).toBe(999);
    expect(trip.booking_id).toBe(101);
    expect(trip.depart).toBe('Village A');
    expect(trip.destination).toBe('Village B');
    expect(trip.avatar).toBe(baseRecord.trip.account.avatar);
    expect(trip.hour_start).toMatch(/^\d{2}:\d{2}$/);
    expect(trip.hour_end).toMatch(/^\d{2}:\d{2}$/);
  });

  it('handles records without routes or price overrides', () => {
    const record = {
      ...baseRecord,
      id: 202,
      trip: {
        ...baseRecord.trip,
        price: undefined,
        route: null,
      },
    };

    const [trip] = normalizePassengerTrips([record]);

    expect(trip.route).toBeNull();
    expect(trip.price).toBeGreaterThan(0); // fallback random price
  });
});
