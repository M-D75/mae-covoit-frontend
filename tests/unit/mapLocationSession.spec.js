import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { parse } from '@vue/compiler-sfc';
import * as actorHelpers from '@/components/maps/tripActorMarkers.js';
import * as routeProgress from '@/services/routeProgress.js';
import * as tripSimulation from '@/services/tripSimulation.js';
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
    if (name.endsWith('routeProgress.js')) return routeProgress;
    if (name.endsWith('tripSimulation.js')) return tripSimulation;
    if (name.endsWith('tripActorMarkers.js')) return actorHelpers;
    if (name.endsWith('locationPermission.js')) return { getUserLocation };
    if (name === 'leaflet') return { icon: () => ({}) };
    return {};
});
const component = module.exports.default;
function createMap() {
    const map = { ...component.data(), isPublicMap: false, socket: { emit: vi.fn(), connected: true }, mode_driver: true,
        contacts: [{ user_id: 'passenger' }], userUid: 'driver', tripSelected: { id: 1, driver_id: 'driver' } };
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
    it('uses one real/simulated pipeline; simulated ticks do not reroute or buffer disconnected positions', () => {
        const map = createMap(); map.shareLocalisation = true;
        map.applyTripPosition({ source: 'simulation', coords: { latitude: -12.8, longitude: 45.2 }, timestamp: Date.now() });
        expect(map.updatePassedPoints).toHaveBeenCalled(); expect(map.checkAndRerouteIfNeeded).not.toHaveBeenCalled();
        expect(map.socket.emit).toHaveBeenCalledWith('send-localisation', expect.objectContaining({ idTrip: 1, source: 'simulation', sequence: 1 }));
        map.socket.connected = false; map.socket.emit.mockClear();
        map.applyTripPosition({ source: 'simulation', coords: { latitude: -12.8, longitude: 45.3 } });
        expect(map.socket.emit).not.toHaveBeenCalled();
        map.applyTripPosition({ coords: { latitude: -12.8, longitude: 45.4 } });
        expect(map.checkAndRerouteIfNeeded).toHaveBeenCalled();
    });
    it('applies preselected speed and resets only local motion after boarding', async () => {
        vi.useFakeTimers();
        const map = createMap(); map.simulationAllowed = true;
        map.tripSelected.bookings = [{ id: 11, in_car: true }];
        map.routes = [{ current: true, polylineDecoded: [[0, 0], [0, 0.01]], originalPolyline: [[0, 0], [0, 0.01]] }];
        try {
            await map.simulationCommand('configure', { speed: 5, acceleration: 20, gpsAvailable: true });
            await map.simulationCommand('start');
            expect(map.simulationEngine.state.speed).toBe(5);
            expect(map.simulationEngine.state.acceleration).toBe(20);
            expect(geo.watchPosition).not.toHaveBeenCalled();
            await map.simulationCommand('reset');
            expect(map.simulationEngine.state.meters).toBe(0);
            expect(map.tripSelected.bookings[0].in_car).toBe(true);
        } finally { clearInterval(map.simulationTimer); vi.useRealTimers(); }
    });
    it('after the server PIN response, follows only the driver and blocks passenger movement after reconnect', async () => {
        const map = createMap(); map.mode_driver = false; map.userUid = 'passenger';
        map.tripSelected = { id: 1, driver_id: 'driver', bookings: [{ id: 11, in_car: false }] };
        map.liveTripState = { bookings: [{ id: 11, userId: 'passenger', in_car: false }] };
        map.routes = []; map.simulationAllowed = true;
        map.liveNow = Date.now();
        for (const name of ['liveBookings', 'boardingSummary', 'passengerIsBoarded', 'driverPosition', 'vehicleSpeed']) {
            Object.defineProperty(map, name, { get: () => component.computed[name].call(map), configurable: true });
        }
        map.SET_TRIP_SELECTED = trip => { map.tripSelected = trip; };
        map.$store = { dispatch: vi.fn() }; map.simulationEngine = { pause: vi.fn() };
        map.receiveTripPosition({ idTrip: 1, from: 'driver', latLng: [0, 0.01], heading: 90, speedKmh: 100, receivedAt: map.liveNow });
        expect(map.passengerIsBoarded).toBe(false);
        map.applyBoardingConfirmation({ bookingIds: [11], bookings: [{ id: 11, in_car: true }] });
        expect(map.passengerIsBoarded).toBe(true);
        map.enterVehicleFollow();
        expect(map.simulationEngine.pause).toHaveBeenCalled();
        expect(map.currentLocation.current).toEqual([0, 0.01]);
        map.socket.emit.mockClear();
        map.applyTripPosition({ source: 'simulation', coords: { latitude: 50, longitude: 50 } });
        await map.simulationCommand('place', [50, 50]);
        expect(map.currentLocation.current).toEqual([0, 0.01]); expect(map.socket.emit).not.toHaveBeenCalled();
        map.receiveTripPosition({ idTrip: 1, from: 'driver', latLng: [0, 0.02], heading: 90, speedKmh: 200, receivedAt: map.liveNow + 1000 });
        expect(map.currentLocation.current).toEqual([0, 0.02]); expect(map.vehicleSpeed).toBe(200);
        map.localisation = []; map.enterVehicleFollow(); expect(map.currentLocation.current).toEqual([]);
        map.receiveTripPosition({ idTrip: 1, from: 'driver', latLng: [0, 0.03], heading: 90, speedKmh: 0, receivedAt: map.liveNow + 2000 });
        expect(map.currentLocation.current).toEqual([0, 0.03]);
        expect(map.tripSelected.bookings[0].in_car).toBe(true);
    });
    it('uses only the driver position for zone history, never a waiting pedestrian', () => {
        const map = createMap(); map.tripSelected.driver_id = 'driver'; map.userUid = 'passenger';
        map.currentLocation.current = [-12.5, 45.5];
        map.driverPosition = { latLng: [-12.8, 45.1], receivedAt: 1000, timestamp: 1000, accuracyMeters: 5 };
        expect(component.computed.zoneVehiclePosition.call(map).latLng).toEqual([-12.8, 45.1]);
        map.driverPosition = null; expect(component.computed.zoneVehiclePosition.call(map)).toBeNull();
        map.userUid = 'driver'; map.shareLocalisation = true; map.ownAccuracyMeters = 5; map.ownMeasuredAt = 1000;
        expect(component.computed.zoneVehiclePosition.call(map).accuracyMeters).toBe(5);
        map.shareLocalisation = false; expect(component.computed.zoneVehiclePosition.call(map)).toBeNull();
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

it('clips a boarded passenger route from fresh driver segments and keeps pedestrian GPS out of it', () => {
    const map=createMap(); const start=Date.now(); vi.spyOn(Date,'now').mockReturnValue(start);
    map.userUid='passenger'; map.passengerIsBoarded=true; map.userId=3; map.localisation=[];
    map.routes=[{id:1,current:true,originalPolyline:[[-12.8,45],[-12.8,45.01],[-12.8,45.02]],polylineDecoded:[[-12.8,45],[-12.8,45.01],[-12.8,45.02]],infosGoogle:{duration:'1200s'}}];
    map.updatePassedPoints=component.methods.updatePassedPoints.bind(map);map.updateRemainingEstimates=component.methods.updateRemainingEstimates.bind(map);
    Object.defineProperty(map,'driverPosition',{get:()=>map.localisation.find(p=>p.from==='driver')});
    map.receiveTripPosition({idTrip:1,from:'driver',latLng:[-12.8,45.002],accuracyMeters:5,source:'simulation',receivedAt:start,timestamp:start});
    const remaining=map.routes[0].remainingMeters;expect(map.routes[0].polylineDecoded[0][1]).toBeCloseTo(45.002,6);
    vi.mocked(Date.now).mockReturnValue(start+1000);
    map.receiveTripPosition({idTrip:1,from:'driver',latLng:[-12.8,45.01],accuracyMeters:5,source:'simulation',receivedAt:start+1000,timestamp:start+1000});
    expect(map.routes[0].remainingMeters).toBeLessThan(remaining);expect(map.routes[0].polylineDecoded.length).toBeGreaterThan(1);
    const after=JSON.stringify(map.routes[0].polylineDecoded);
    map.applyTripPosition({coords:{latitude:-12.8,longitude:45.02,accuracy:5},timestamp:start+1000});expect(JSON.stringify(map.routes[0].polylineDecoded)).toBe(after);
    map.receiveTripPosition({idTrip:1,from:'driver',latLng:[-12.8,45.018],accuracyMeters:100,source:'simulation',receivedAt:start+2000,timestamp:start+2000});expect(JSON.stringify(map.routes[0].polylineDecoded)).toBe(after);
    map.resetRouteProgress();expect(map.routes[0].polylineDecoded).toEqual(map.routes[0].originalPolyline);
    vi.restoreAllMocks();
});
it('keeps map center based on the selected full route during vehicle progress', () => {
    const map=createMap();map.itineraire={origin:{location:{latLng:{latitude:-12.8,longitude:45}}},destination:{location:{latLng:{latitude:-12.8,longitude:45.02}}}};
    map.routes=[{current:true,originalPolyline:[[-12.8,45],[-12.79,45.01],[-12.8,45.02]],polylineDecoded:[[-12.8,45],[-12.79,45.01],[-12.8,45.02]]}];
    const center=component.computed.center.call(map);map.routes[0].polylineDecoded=[[-12.8,45.019],[-12.8,45.02]];
    expect(component.computed.center.call(map)).toEqual(center);
});

it('derives the chat badge from unread trips and clears it for another selected trip', () => {
    const vm={notMessageVue:['1'],tripSelected:{id:1}};
    expect(component.computed.notifChat.call(vm)).toBe(true);
    vm.tripSelected={id:2};expect(component.computed.notifChat.call(vm)).toBe(false);
    vm.tripSelected={id:1};vm.notMessageVue=[];expect(component.computed.notifChat.call(vm)).toBe(false);
});
