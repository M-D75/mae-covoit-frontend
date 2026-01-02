import supabase from '@/utils/supabaseClient.js';

/**
 * Fetch bookings for the current passenger with server-side date filtering.
 * includeHistory=false -> upcoming + up to 2h past
 * includeHistory=true  -> last 30 days of past trips
 */
export async function fetchPassengerTrips({ passengerAccountId, includeHistory = false }) {
    const now = new Date();
    const upcomingCutoff = new Date(now.getTime() - (2 * 60 * 60 * 1000)).toISOString();
    const historyCutoff = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();

    let query = supabase
        .from('booking')
        .select(`
            id,
            trip_id,
            passenger_account_id,
            is_accepted,
            is_refused,
            trip (
                id,
                driver_id,
                account (*),
                village_departure_id,
                village_arrival_id,
                departure_time,
                max_seats,
                price,
                route
            )
        `)
        .eq('passenger_account_id', passengerAccountId)
        .eq('passenger_no_show', false);

    if (includeHistory) {
        query = query
            .gte('trip.departure_time', historyCutoff)
            .lt('trip.departure_time', now.toISOString());
    } else {
        query = query.gte('trip.departure_time', upcomingCutoff);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return (data || []).filter((record) => record.trip);
}

/**
 * Normalize supabase booking rows into the structure expected by views/stores.
 */
export function normalizePassengerTrips(records, resolveVillageName) {
    const resolve = typeof resolveVillageName === 'function' ? resolveVillageName : () => '';

    return records.map((row) => {
        const trip = row.trip;
        const routeDuration = trip.route?.infosGoogle?.duration
            ? parseInt(trip.route.infosGoogle.duration.replace('s', ''), 10)
            : 0;

        const departureDate = new Date(trip.departure_time);
        const offset = departureDate.getTimezoneOffset();
        const localDeparture = new Date(departureDate.getTime() - offset * 60000);

        const hour_start = `${localDeparture.getUTCHours().toString().padStart(2, '0')}:${localDeparture
            .getUTCMinutes()
            .toString()
            .padStart(2, '0')}`;

        const arrivalDate = new Date(localDeparture.getTime() + routeDuration * 1000);
        const hour_end = `${arrivalDate.getUTCHours().toString().padStart(2, '0')}:${arrivalDate
            .getUTCMinutes()
            .toString()
            .padStart(2, '0')}`;

        return {
            id: trip.id,
            booking_id: row.id,
            is_accepted: row.is_accepted,
            is_refused: row.is_refused,
            driver_id: trip.driver_id,
            avatar: trip.account?.avatar,
            name: trip.account?.username,
            depart: resolve(trip.village_departure_id),
            destination: resolve(trip.village_arrival_id),
            departure_time: trip.departure_time,
            hour_start,
            hour_end,
            price: trip.price ?? (Math.ceil(Math.random() * 4) + 1),
            max_seats: trip.max_seats,
            route: trip.route,
            account: trip.account,
        };
    });
}
