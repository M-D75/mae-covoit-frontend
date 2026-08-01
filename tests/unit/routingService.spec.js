import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    calculateRoutes,
    formatRouteDuration,
} from '@/services/routingService.js';

const originalGoogleRouteKey = process.env.VUE_APP_API_GOOGLE_ROUTE_API_KEY;

function restoreEnvironmentValue(name, value) {
    if (typeof value === 'undefined') {
        delete process.env[name];
        return;
    }
    process.env[name] = value;
}

afterEach(() => {
    restoreEnvironmentValue('VUE_APP_API_GOOGLE_ROUTE_API_KEY', originalGoogleRouteKey);
    vi.restoreAllMocks();
});

describe('Google routing service', () => {
    it('normalizes Google Routes without changing its coordinate contract', async () => {
        process.env.VUE_APP_API_GOOGLE_ROUTE_API_KEY = 'routes-key';
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                routes: [{
                    duration: '429s',
                    distanceMeters: 2458,
                    polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@' },
                }],
            }),
        });

        const routes = await calculateRoutes({
            provider: 'google',
            origin: [-12.7, 45.1],
            destination: [-12.8, 45.2],
            departureTime: '2026-08-02T08:00:00Z',
            fetchImpl,
        });

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://routes.googleapis.com/directions/v2:computeRoutes',
            expect.objectContaining({ method: 'POST' }),
        );
        const request = JSON.parse(fetchImpl.mock.calls[0][1].body);
        expect(request.origin.location.latLng).toEqual({ latitude: -12.7, longitude: 45.1 });
        expect(request.computeAlternativeRoutes).toBe(true);
        expect(routes[0]).toMatchObject({
            duration: '07 min',
            distance: '2.46',
            faster: true,
            current: true,
            routingProvider: 'google',
            infosGoogle: { duration: '429s', distanceMeters: 2458 },
        });
        expect(routes[0].polylineDecoded).toHaveLength(3);
    });

    it('still uses Google Routes when Leaflet renders the map', async () => {
        process.env.VUE_APP_API_GOOGLE_ROUTE_API_KEY = 'routes-key';
        const fetchImpl = vi.fn(function browserFetchWithRequiredContext() {
            if (this !== window) {
                throw new TypeError('Illegal invocation');
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                json: async () => ({
                    routes: [{
                        duration: '600s',
                        distanceMeters: 12000,
                        polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@' },
                    }],
                }),
            });
        });

        const routes = await calculateRoutes({
            provider: 'leaflet',
            origin: { location: { latLng: { latitude: -12.7, longitude: 45.1 } } },
            destination: { location: { latLng: { latitude: -12.8, longitude: 45.2 } } },
            fetchImpl,
        });

        expect(fetchImpl.mock.calls[0][0]).toBe(
            'https://routes.googleapis.com/directions/v2:computeRoutes',
        );
        expect(routes).toHaveLength(1);
        expect(routes[0]).toMatchObject({
            duration: '10 min',
            distance: '12.00',
            faster: true,
            current: true,
            routingProvider: 'google',
            infosGoogle: { duration: '600s', distanceMeters: 12000 },
        });
    });

    it('returns an explicit error when the Google Routes key is missing', async () => {
        delete process.env.VUE_APP_API_GOOGLE_ROUTE_API_KEY;
        await expect(calculateRoutes({
            provider: 'leaflet',
            origin: [-12.7, 45.1],
            destination: [-12.8, 45.2],
            fetchImpl: vi.fn(),
        })).rejects.toMatchObject({ code: 'GOOGLE_ROUTES_KEY_MISSING', provider: 'google' });
    });

    it('keeps duration formatting stable', () => {
        expect(formatRouteDuration(59)).toBe('00 min');
        expect(formatRouteDuration(3660)).toBe('1 h 01 min');
    });

    it('returns an explicit error when no route exists', async () => {
        process.env.VUE_APP_API_GOOGLE_ROUTE_API_KEY = 'routes-key';
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ routes: [] }),
        });

        await expect(calculateRoutes({
            provider: 'leaflet',
            origin: [-12.7, 45.1],
            destination: [-12.8, 45.2],
            fetchImpl,
        })).rejects.toMatchObject({ code: 'NO_ROUTE_FOUND', provider: 'google' });
    });
});
