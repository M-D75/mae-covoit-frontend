// Normalize legacy routes without fabricating prices or travel times.
export const MAX_TRACKING_LOOKBACK_MS = 13 * 3600000;
export function routeDurationSeconds(route) {
    const values = (Array.isArray(route) ? route : [route]).map(item => {
        const raw = item?.infosGoogle?.duration;
        return typeof raw === 'string' && /^\d+(?:\.\d+)?s$/.test(raw) ? Number.parseFloat(raw) : NaN;
    }).filter(Number.isFinite);
    return values.length ? Math.max(...values) : null;
}
export function trackingUntil(trip) {
    const start = trip?.departure_time ? new Date(trip.departure_time).getTime() : NaN;
    const seconds = routeDurationSeconds(trip?.route);
    const duration = seconds === null ? 4 * 3600 : Math.min(12 * 3600, Math.max(600, seconds));
    return start + (duration + 3600) * 1000;
}
export function isUpcomingOrActive(trip, now = Date.now()) {
    return Boolean(trip && !trip.cancellation_pending_at && Number.isFinite(trackingUntil(trip)) && trackingUntil(trip) >= now);
}
export function validTripPrice(value) {
    if ((typeof value !== 'number' && typeof value !== 'string') || value === '') return null;
    const price = Number(value);
    return Number.isFinite(price) && price > 0 ? price : null;
}
const timeLabel = date => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
export function normalizeTrip(trip, resolveVillage = () => '') {
    if (!trip || !trip.id || !trip.departure_time || !Number.isFinite(new Date(trip.departure_time).getTime())) return null;
    const account = Array.isArray(trip.account) ? trip.account[0] : trip.account;
    const bookings = (trip.booking || trip.bookings || []).filter(b => !b.passenger_no_show);
    const duration = routeDurationSeconds(trip.route);
    const start = new Date(trip.departure_time);
    const price = validTripPrice(trip.price);
    const routes = Array.isArray(trip.route) ? trip.route : [trip.route];
    const route = routes.find(r => r?.current) || routes.find(r => r && typeof r === 'object') || null;
    return { ...trip, route, account,
        driver_account_id: account?.id || null,
        name: [account?.firstname, account?.lastname].filter(Boolean).join(' ') || account?.username || 'Chauffeur',
        avatar: account?.avatar || null,
        depart: resolveVillage(trip.village_departure_id), destination: resolveVillage(trip.village_arrival_id),
        hour_start: timeLabel(start), hour_end: duration === null ? '—' : timeLabel(new Date(start.getTime() + duration * 1000)),
        price, canReserve: price !== null && duration !== null && Array.isArray(route?.polylineDecoded) && route.polylineDecoded.length >= 2,
        reserved_seats: bookings.filter(b => !b.is_refused).length,
        passenger_number: bookings.filter(b => b.is_accepted && !b.is_refused).length,
        bookings, booking: bookings,
    };
}
export async function fetchAccessibleTrip(client, { tripId, userUid, accountId, resolveVillage }) {
    if (!Number.isSafeInteger(tripId) || tripId <= 0 || !userUid) throw new Error('Trajet introuvable.');
    const { data, error } = await client.from('trip').select('*, account:public_profile(*), car(*), booking(*, account:public_profile(*))').eq('id', tripId).maybeSingle();
    if (error) throw new Error('Impossible de charger ce trajet. Veuillez réessayer.');
    const ownBooking = (data?.booking || []).some(b => !b.is_refused && !b.passenger_no_show && b.is_accepted
        && ((accountId != null && String(b.passenger_account_id) === String(accountId)) || b.account?.user_id === userUid));
    if (!data || (data.driver_id !== userUid && !ownBooking)) throw new Error('Ce trajet ne vous est pas accessible.');
    const normalized = normalizeTrip(data, resolveVillage);
    if (!normalized) throw new Error('Les informations du trajet sont incomplètes.');
    return normalized;
}

// Reviews become available after estimated arrival. Missing legacy durations
// use four hours, consistently with the database guard in migration 036.
export function ratingAvailableAt(trip) {
    const start = trip?.departure_time ? new Date(trip.departure_time).getTime() : NaN;
    const duration = routeDurationSeconds(trip?.route);
    return start + Math.max(600, duration ?? 4 * 3600) * 1000;
}
export function canRateCompletedTrip(trip, now = Date.now()) {
    const availableAt = ratingAvailableAt(trip);
    return Boolean(trip && !trip.cancellation_pending_at && Number.isFinite(availableAt) && now >= availableAt);
}
