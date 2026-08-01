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
    MAP_PROVIDER_STORAGE_KEY,
    normalizeMapProvider,
    setMapProvider,
} from '@/utils/mapProvider.js';

afterEach(() => {
    window.localStorage.removeItem(MAP_PROVIDER_STORAGE_KEY);
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

    it('can switch the global renderer at runtime', () => {
        const listener = vi.fn();
        window.addEventListener('mae-map-provider-changed', listener, { once: true });

        expect(normalizeMapProvider('GOOGLE')).toBe('google');
        expect(setMapProvider('google')).toBe('google');
        expect(getMapProvider()).toBe('google');
        expect(listener).toHaveBeenCalledOnce();
    });
});
