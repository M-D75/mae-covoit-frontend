import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    alertDefinition,
    displayedRoutes,
    pointLabel,
    toCoordinateArray,
    toGoogleCoordinate,
} from '@/components/maps/mapSurfaceUtils.js';
import {
    getMapProvider,
    getEffectiveMapProvider,
    MAP_PROVIDER_STORAGE_KEY,
    normalizeMapProvider,
    setMapProvider,
} from '@/utils/mapProvider.js';

afterEach(() => {
    window.localStorage.removeItem(MAP_PROVIDER_STORAGE_KEY);
    vi.unstubAllEnvs();
});

describe('map provider contract', () => {
    it('normalizes every coordinate format used by Google and Leaflet', () => {
        const itineraryPoint = {
            location: { latLng: { latLngTab: [-12.7, 45.1] } },
        };

        expect(toCoordinateArray(itineraryPoint)).toEqual([-12.7, 45.1]);
        expect(toCoordinateArray({
            location: { latLng: { latitude: -12.75, longitude: 45.15 } },
        })).toEqual([-12.75, 45.15]);
        expect(toCoordinateArray({ lat: -12.8, lng: 45.2 })).toEqual([-12.8, 45.2]);
        expect(toCoordinateArray({ latLng: [-12.9, 45.3] })).toEqual([-12.9, 45.3]);
        expect(toGoogleCoordinate([-12.6, 45])).toEqual({ lat: -12.6, lng: 45 });
        expect(toCoordinateArray(['invalid', 45])).toBeNull();
    });

    it('keeps the original route index while drawing the selected route on top', () => {
        const routes = [{ id: 'fast' }, { id: 'alternative' }];

        expect(displayedRoutes(routes).map(({ route, originalIndex }) => ({
            id: route.id,
            originalIndex,
        }))).toEqual([
            { id: 'alternative', originalIndex: 1 },
            { id: 'fast', originalIndex: 0 },
        ]);
    });

    it('shares labels and safe alert definitions between renderers', () => {
        const types = [{ value: 'works', label: 'Travaux', color: '#ffa726', icon: 'mdi-traffic-cone' }];

        expect(pointLabel({ infos: { village: 'Koungou', commune: 'Koungou' } })).toBe('Koungou');
        expect(alertDefinition({ type: 'works' }, types)).toMatchObject({
            label: 'Travaux',
            color: '#ffa726',
            icon: 'mdi-traffic-cone',
        });
    });

    it.each(['google', 'leaflet'])('uses the %s renderer configured by the environment', provider => {
        vi.stubEnv('VUE_APP_MAP_PROVIDER', provider);
        vi.stubEnv('VUE_APP_API_VUE_GOOGLE_MAP', 'test-key');
        expect(getMapProvider()).toBe(provider);
        expect(getEffectiveMapProvider()).toBe(provider);
    });

    it('keeps an explicit screen override ahead of browser and environment choices', () => {
        vi.stubEnv('VUE_APP_MAP_PROVIDER', 'google');
        window.localStorage.setItem(MAP_PROVIDER_STORAGE_KEY, 'google');
        expect(getMapProvider('leaflet')).toBe('leaflet');
    });

    it('keeps the saved browser choice ahead of the environment default', () => {
        vi.stubEnv('VUE_APP_MAP_PROVIDER', 'google');
        window.localStorage.setItem(MAP_PROVIDER_STORAGE_KEY, 'leaflet');
        expect(getMapProvider()).toBe('leaflet');
        window.localStorage.removeItem(MAP_PROVIDER_STORAGE_KEY);
        expect(getMapProvider()).toBe('google');
    });

    it('falls back to Leaflet for an unknown or missing environment choice', () => {
        vi.stubEnv('VUE_APP_MAP_PROVIDER', 'unknown');
        expect(getMapProvider()).toBe('leaflet');
        vi.stubEnv('VUE_APP_MAP_PROVIDER', '');
        expect(getMapProvider()).toBe('leaflet');
    });

    it('uses Leaflet if Google is requested without its display key', () => {
        vi.stubEnv('VUE_APP_MAP_PROVIDER', 'google');
        vi.stubEnv('VUE_APP_API_VUE_GOOGLE_MAP', '');
        expect(getMapProvider()).toBe('google');
        expect(getEffectiveMapProvider()).toBe('leaflet');
    });

    it('can switch the global renderer at runtime', () => {
        const listener = vi.fn();
        window.addEventListener('mae-map-provider-changed', listener, { once: true });

        expect(normalizeMapProvider('GOOGLE')).toBe('google');
        expect(setMapProvider('google')).toBe('google');
        expect(getMapProvider()).toBe('google');
        expect(listener).toHaveBeenCalledOnce();
    });
});
