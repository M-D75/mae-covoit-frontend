import { describe, expect, it, vi } from 'vitest';
import {
    buildAuthCallbackUrl,
    completeAuthCallback,
    isNativeAuthCallbackUrl,
    parseAuthCallbackParameters,
} from '@/services/authCallback.js';

describe('Supabase OAuth callbacks', () => {
    it('builds distinct browser and native callback URLs', () => {
        expect(buildAuthCallbackUrl({
            native: false,
            origin: 'https://app.example.com/',
        })).toBe('https://app.example.com/auth/callback');
        expect(buildAuthCallbackUrl({
            native: true,
            scheme: 'my-app',
            requestedPath: '/publish',
        })).toBe('my-app://callback/auth?redirect=%2Fpublish');
    });

    it('recognizes only the OAuth path of the configured mobile scheme', () => {
        expect(isNativeAuthCallbackUrl('my-app://callback/auth#access_token=a', 'my-app')).toBe(true);
        expect(isNativeAuthCallbackUrl('my-app://callback/stripe-connect', 'my-app')).toBe(false);
        expect(isNativeAuthCallbackUrl('other-app://callback/auth', 'my-app')).toBe(false);
    });

    it('reads implicit-flow tokens from the URL fragment', () => {
        const parameters = parseAuthCallbackParameters(
            'my-app://callback/auth?redirect=%2Fsearch#access_token=access&refresh_token=refresh'
        );
        expect(parameters.get('redirect')).toBe('/search');
        expect(parameters.get('access_token')).toBe('access');
        expect(parameters.get('refresh_token')).toBe('refresh');
    });

    it('restores a Supabase session from a native implicit callback', async () => {
        const setSession = vi.fn().mockResolvedValue({
            data: { session: { access_token: 'access' } },
            error: null,
        });
        const client = { auth: { setSession } };

        const session = await completeAuthCallback(
            client,
            'my-app://callback/auth#access_token=access&refresh_token=refresh'
        );

        expect(setSession).toHaveBeenCalledWith({
            access_token: 'access',
            refresh_token: 'refresh',
        });
        expect(session.access_token).toBe('access');
    });

    it('exchanges a PKCE authorization code when Supabase returns one', async () => {
        const exchangeCodeForSession = vi.fn().mockResolvedValue({
            data: { session: { access_token: 'pkce-access' } },
            error: null,
        });
        const client = { auth: { exchangeCodeForSession } };

        const session = await completeAuthCallback(
            client,
            'https://app.example.com/auth/callback?code=oauth-code'
        );

        expect(exchangeCodeForSession).toHaveBeenCalledWith('oauth-code');
        expect(session.access_token).toBe('pkce-access');
    });
});
