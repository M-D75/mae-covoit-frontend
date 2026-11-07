import supabase from '@/utils/supabaseClient.js';
import { normalizeTrip, isUpcomingOrActive, MAX_TRACKING_LOOKBACK_MS } from '@/services/tripPresentation.js';
export async function fetchPassengerTrips({ passengerAccountId, includeHistory = false }) {
    const now = Date.now();
    let query = supabase.from('booking').select(`id, trip_id, passenger_account_id, is_accepted, is_refused, in_car,
        trip (id, driver_id, account:public_profile (*), village_departure_id, village_arrival_id, departure_time, max_seats, price, route, cancellation_pending_at)`)
        .eq('passenger_account_id', passengerAccountId).eq('passenger_no_show', false);
    query = includeHistory
        ? query.gte('trip.departure_time', new Date(now - 30 * 86400000).toISOString()).lt('trip.departure_time', new Date(now).toISOString())
        : query.gte('trip.departure_time', new Date(now - MAX_TRACKING_LOOKBACK_MS).toISOString());
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).filter(record => record.trip && (includeHistory || isUpcomingOrActive(record.trip, now)));
}
export function normalizePassengerTrips(records, resolveVillageName) {
    return records.map(row => {
        const trip = normalizeTrip(row.trip, resolveVillageName);
        return trip ? { ...trip, booking_id: row.id, is_accepted: row.is_accepted, is_refused: row.is_refused } : null;
    }).filter(Boolean);
}
