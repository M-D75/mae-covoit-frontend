import { describe, expect, it, vi } from 'vitest';
import {
    fetchAuthProfileState,
    normalizeInternalRedirect,
    resolveAuthGuardRedirect,
    resolvePostAuthPath,
} from '@/services/authProfile.js';

function accountQuery(result) {
    const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        maybeSingle: vi.fn().mockResolvedValue(result),
    };
    return query;
}

describe('authentication profile routing', () => {
    it('detects an authenticated Supabase user whose account row is missing', async () => {
        const query = accountQuery({ data: null, error: null });
        const client = {
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { id: 'user-1' } },
                    error: null,
                }),
            },
            from: vi.fn(() => query),
        };

        const state = await fetchAuthProfileState(client);

        expect(state.authenticated).toBe(true);
        expect(state.account).toBeNull();
        expect(client.from).toHaveBeenCalledWith('account');
        expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('sends an incomplete authenticated user to account-info', () => {
        expect(resolveAuthGuardRedirect({
            requiresAuth: true,
            allowMissingAccount: false,
            fullPath: '/search',
            authenticated: true,
            hasAccount: false,
        })).toEqual({
            path: '/account-info',
            query: { redirect: '/search' },
        });
    });

    it('keeps account-info accessible until the profile exists', () => {
        expect(resolveAuthGuardRedirect({
            requiresAuth: true,
            allowMissingAccount: true,
            fullPath: '/account-info',
            authenticated: true,
            hasAccount: false,
        })).toBeNull();
        expect(resolvePostAuthPath({
            authenticated: true,
            hasAccount: false,
            requestedPath: '/publish',
        })).toBe('/account-info');
    });

    it('leaves account-info when a completed profile already exists', () => {
        expect(resolveAuthGuardRedirect({
            requiresAuth: true,
            allowMissingAccount: true,
            fullPath: '/account-info?redirect=/publish',
            requestedPath: '/publish',
            authenticated: true,
            hasAccount: true,
        })).toBe('/publish');
    });

    it('rejects external and authentication-loop redirects', () => {
        expect(normalizeInternalRedirect('https://evil.example')).toBe('/search');
        expect(normalizeInternalRedirect('//evil.example')).toBe('/search');
        expect(normalizeInternalRedirect('/login')).toBe('/search');
        expect(normalizeInternalRedirect('/publish')).toBe('/publish');
    });
});
