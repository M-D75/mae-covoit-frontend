export const validBoardingCode = (code, digits = 4) => typeof code === 'string' && (digits === 4 ? /^\d{4}$/.test(code) : digits === 6 ? /^\d{6}$/.test(code) : false);

export function boardingReservations(bookings, isDriver, userId, userUid) {
    const groups = new Map();
    for (const booking of bookings) {
        if (!booking.is_accepted || booking.is_refused || booking.passenger_no_show) continue;
        if (!isDriver && !isOwnPassengerBooking(booking, userId, userUid)) continue;
        const base = `${booking.trip_id}:${booking.passenger_account_id}`;
        const key = booking.reservation_request_id ? `${base}:r:${booking.reservation_request_id}`
            : booking.payment_intent_id ? `${base}:p:${booking.payment_intent_id}` : `b:${booking.id}`;
        const previous = groups.get(key);
        if (!previous || (previous.in_car && !booking.in_car)) groups.set(key, booking);
    }
    return [...groups.values()];
}

// account.id is numeric; account.user_id is the authentication UUID.
export function isOwnPassengerBooking(booking, userId, userUid) {
    return (userId != null && userId !== '' && booking.passenger_account_id != null
        && String(booking.passenger_account_id) === String(userId))
        || Boolean(userUid && booking.account?.user_id === userUid);
}

export const BOARDING_EARLY_MINUTES = 30;
export const BOARDING_LATE_MINUTES = 60;

export function passengerBoardingAccess(bookings = [], userId, userUid, departureTime, now = Date.now()) {
    const own = bookings.filter(booking => isOwnPassengerBooking(booking, userId, userUid)
        && !booking.is_refused && !booking.passenger_no_show);
    const accepted = own.filter(booking => booking.is_accepted);
    if (!accepted.length) return { status: 'pending', canOpen: false, message: own.length
        ? 'Code disponible après acceptation de votre réservation.' : 'Aucune réservation acceptée pour ce compte.' };
    if (accepted.every(booking => booking.in_car)) return { status: 'onboard', canOpen: false, message: 'À bord · montée confirmée' };
    const departure = new Date(departureTime).getTime();
    if (!departureTime || !Number.isFinite(departure)) return { status: 'unavailable', canOpen: false, message: 'Horaire du trajet indisponible. Actualisez le suivi.' };
    const availableAt = departure - BOARDING_EARLY_MINUTES * 60000;
    const expiresAt = departure + BOARDING_LATE_MINUTES * 60000;
    if (now < availableAt) return { status: 'early', canOpen: false, availableAt, expiresAt,
        message: `Le bouton devient actif ${BOARDING_EARLY_MINUTES} minutes avant le départ.` };
    if (now > expiresAt) return { status: 'expired', canOpen: false, availableAt, expiresAt,
        message: 'La fenêtre de montée est expirée (une heure après le départ).' };
    return { status: 'available', canOpen: true, availableAt, expiresAt, message: 'En attente du véhicule' };
}

export function boardingFailure(error){
 const code=error?.response?.data?.code||'BOARDING_UNAVAILABLE';
 const kinds={BOARDING_RECOVERY_REQUIRED:'payment',BOARDING_SETTLEMENT_PENDING:'payment',BOARDING_WRONG_CODE:'code',BOARDING_LOCKED:'blocked',BOARDING_TOO_EARLY:'window',BOARDING_EXPIRED:'window',BOARDING_FORBIDDEN:'access',BOARDING_INVALID:'reservation',BOARDING_GROUP_CHANGED:'reservation',BOARDING_NOT_ISSUED:'reservation',SIMULATION_OPERATION_DISABLED:'simulation',SIMULATION_GROUP_FORBIDDEN:'simulation',APP_UPDATE_REQUIRED:'version',AUTH_REQUIRED:'session',SESSION_INVALID:'session'};
 return {code,kind:kinds[code]||'service',message:error?.response?.data?.message||'Validation indisponible. Actualisez l’état avant de réessayer.'};
}
