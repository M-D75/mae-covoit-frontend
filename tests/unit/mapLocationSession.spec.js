import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { parse } from '@vue/compiler-sfc';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Exercise the map's actual methods without mounting its cartography/payment UI.
const geo = { watchPosition: vi.fn(), clearWatch: vi.fn() };
const getUserLocation = vi.fn();
const { descriptor } = parse(readFileSync('src/components/trip/MapTrip.vue', 'utf8'));
const { code } = transformSync(descriptor.script.content, {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', code)(module, module.exports, name => {
    if (name === 'vue') return { defineComponent: component => component };
    if (name === 'vuex') return Object.fromEntries(['mapState', 'mapGetters', 'mapActions', 'mapMutations'].map(key => [key, () => ({})]));
    if (name === '@capacitor/geolocation') return { Geolocation: geo };
    if (name.endsWith('locationPermission.js')) return { getUserLocation };
    if (name === 'leaflet') return { icon: () => ({}) };
    return {};
});
const component = module.exports.default;
function createMap() {
    const map = { ...component.data(), isPublicMap: false, socket: { emit: vi.fn() }, mode_driver: true,
        contacts: [{ user_id: 'passenger' }], userUid: 'driver', tripSelected: { id: 1 } };
    for (const [key, method] of Object.entries(component.methods)) map[key] = method.bind(map);
    map.updatePassedPoints = vi.fn();
    map.updateRemainingEstimates = vi.fn();
    map.checkAndRerouteIfNeeded = vi.fn();
    return map;
}

describe('map location sharing sessions', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        geo.clearWatch.mockResolvedValue();
        Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    });
    it('starts disabled and explains the purpose before accessing the position', async () => {
        const map = createMap();
        expect(map.shareLocalisation).toBe(false);
        await map.toggleOwnLocation();
        expect(map.locationConsentDialog).toBe(true);
        expect(getUserLocation).not.toHaveBeenCalled();
        expect(geo.watchPosition).not.toHaveBeenCalled();
    });
    it('keeps sharing disabled after a system permission refusal', async () => {
        const map = createMap();
        getUserLocation.mockRejectedValue(new Error('LOCATION_PERMISSION_DENIED'));
        await map.enableOwnLocation();
        expect(map.shareLocalisation).toBe(false);
        expect(map.dialog).toBe(true);
        expect(geo.watchPosition).not.toHaveBeenCalled();
        expect(map.socket.emit).not.toHaveBeenCalled();
    });
    it('ignores position callbacks after backgrounding, including after a later reactivation', async () => {
        const map = createMap();
        map.getGeolocalisation = true;
        map.shareLocalisation = true;
        geo.watchPosition.mockResolvedValue('watch-1');
        await map.shareLoc();
        const callback = geo.watchPosition.mock.calls[0][1];
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        map.handleLocationVisibility();
        await Promise.resolve();
        expect(map.shareLocalisation).toBe(false);
        expect(geo.clearWatch).toHaveBeenCalledWith({ id: 'watch-1' });
        Object.defineProperty(document, 'hidden', { configurable: true, value: false });
        map.locationForeground = true;
        map.shareLocalisation = true;
        map.socket.emit.mockClear();
        await callback({ coords: { latitude: -12.8, longitude: 45.2 } }, null);
        expect(map.socket.emit).not.toHaveBeenCalled();
        expect(map.currentLocation.current).toEqual([]);
    });
    it('clears a watcher whose registration completes after sharing is disabled', async () => {
        const map = createMap();
        map.getGeolocalisation = true;
        map.shareLocalisation = true;
        let resolveWatch;
        geo.watchPosition.mockImplementation(() => new Promise(resolve => { resolveWatch = resolve; }));
        const started = map.shareLoc();
        await map.stopOwnLocation();
        resolveWatch('late-watch');
        await started;
        expect(map.watchId).toBeFalsy();
        expect(geo.clearWatch).toHaveBeenCalledWith({ id: 'late-watch' });
    });
    it('does not enable sharing when initial position acquisition completes after backgrounding', async () => {
        const map = createMap();
        let resolvePosition;
        getUserLocation.mockImplementation(() => new Promise(resolve => { resolvePosition = resolve; }));
        const started = map.enableOwnLocation();
        map.locationForeground = false;
        await map.stopOwnLocation();
        resolvePosition({ coords: { latitude: -12.8, longitude: 45.2 } });
        await started;
        expect(map.shareLocalisation).toBe(false);
        expect(geo.watchPosition).not.toHaveBeenCalled();
    });
});
