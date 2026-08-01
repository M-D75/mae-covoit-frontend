import { describe, expect, it } from 'vitest';
import { getDefaultDepartureTime } from '@/utils/utils.js';

describe('default departure time', () => {
    it('proposes approximately fifteen minutes ahead on a five-minute step', () => {
        const now = new Date(2026, 7, 1, 16, 31, 4);
        const result = getDefaultDepartureTime(now, 15, 5);

        expect(result.time).toBe('16:45');
        expect(result.hourInit).toBe(16);
        expect(result.minuteInit).toBe(45);
        expect(result.date.getTime()).toBeGreaterThan(now.getTime());
    });

    it('handles the transition to the following day', () => {
        const now = new Date(2026, 7, 1, 23, 50, 30);
        const result = getDefaultDepartureTime(now, 15, 5);

        expect(result.time).toBe('00:05');
        expect(result.date.getDate()).toBe(2);
    });
});
