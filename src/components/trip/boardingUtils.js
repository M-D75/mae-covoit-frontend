export const validBoardingCode = code => typeof code === 'string' && /^\d{6}$/.test(code);

export function boardingReservations(bookings, isDriver, userId) {
    const seen = new Set();
    return bookings.filter(booking => {
        if (!booking.is_accepted || booking.is_refused || booking.passenger_no_show) return false;
        if (!isDriver && String(booking.passenger_account_id) !== String(userId)) return false;
        const base = `${booking.trip_id}:${booking.passenger_account_id}`;
        const key = booking.reservation_request_id ? `${base}:r:${booking.reservation_request_id}`
            : booking.payment_intent_id ? `${base}:p:${booking.payment_intent_id}` : `b:${booking.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
