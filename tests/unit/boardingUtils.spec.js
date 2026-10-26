import { describe, it, expect } from 'vitest';
import { boardingReservations, validBoardingCode } from '@/components/trip/boardingUtils.js';
const booking = (id, extra = {}) => ({ id, trip_id: 10, passenger_account_id: 20, is_accepted: true, ...extra });
describe('boarding reservations', () => {
    it('keeps independent reservations and passengers separate while grouping seats', () => {
        const rows = [booking(1, { reservation_request_id: 'a' }), booking(2, { reservation_request_id: 'a' }), booking(3, { reservation_request_id: 'b' }), booking(4), booking(5), booking(6, { passenger_account_id: 30, reservation_request_id: 'a' })];
        expect(boardingReservations(rows, true).map(row => row.id)).toEqual([1, 3, 4, 5, 6]);
        expect(boardingReservations(rows, false, '20').map(row => row.id)).toEqual([1, 3, 4, 5]);
    });
    it('excludes cancelled, refused, unaccepted and absent passengers', () => {
        expect(boardingReservations([booking(1, { is_accepted: false }), booking(2, { is_refused: true }), booking(3, { passenger_no_show: true })], true)).toEqual([]);
    });
    it('retains confirmed reservations on reconnect without asking for another PIN', () => {
        expect(boardingReservations([booking(1, { in_car: true })], false, 20)[0].in_car).toBe(true);
    });
    it('preserves leading zeroes and rejects incomplete or non-numeric input', () => {
        expect(validBoardingCode('000123')).toBe(true);
        for (const input of [123456, '12345', '1234567', '123 45', 'abcdef', undefined]) expect(validBoardingCode(input)).toBe(false);
    });
});
