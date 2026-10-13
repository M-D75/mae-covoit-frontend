import { describe, expect, it, vi } from 'vitest';
import { getDefaultAuthPath, rememberAuthEntry } from '@/services/authEntry.js';
import { resolveAuthGuardRedirect } from '@/services/authProfile.js';

describe('authentication entry preference', () => {
    it('opens signup on a new device and login after successful authentication', () => {
        const values = new Map();
        const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
        expect(getDefaultAuthPath(storage)).toBe('/sign');
        rememberAuthEntry(storage);
        expect(getDefaultAuthPath(storage)).toBe('/login');
        expect([...values.values()]).toEqual(['login']);
    });

    it('keeps the entry usable when storage is unavailable', () => {
        const storage = {
            getItem: vi.fn(() => { throw new Error('Storage disabled'); }),
            setItem: vi.fn(() => { throw new Error('Storage full'); }),
        };
        expect(getDefaultAuthPath(storage)).toBe('/sign');
        expect(() => rememberAuthEntry(storage)).not.toThrow();
    });

    it('retains the requested destination when directing a first visit to signup', () => {
        expect(resolveAuthGuardRedirect({
            requiresAuth: true, authenticated: false,
            fullPath: '/publish?seats=2', unauthenticatedPath: '/sign',
        })).toEqual({ path: '/sign', query: { redirect: '/publish?seats=2' } });
    });
});
