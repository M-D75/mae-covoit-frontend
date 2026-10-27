import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { parse, compileTemplate } from '@vue/compiler-sfc';
import * as Vue from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as utils from '@/components/maps/mapSurfaceUtils.js';
import * as zones from '@/components/maps/villageZoneUtils.js';
import * as routeZones from '@/components/maps/villageRouteZones.js';
import * as providers from '@/utils/mapProvider.js';
import * as actors from '@/components/maps/tripActorMarkers.js';

const fixture = { type: 'MultiPolygon', coordinates: [[[[45, -13], [46, -13], [46, -12], [45, -13]],
    [[45.2, -12.8], [45.3, -12.8], [45.3, -12.7], [45.2, -12.8]]]] };
const points = { origin: { infos: { village: 'Hachénoi', commune: 'Tsingoni', villageId: 21 }, location: { latLng: [-12.8, 45.1] } },
    destination: { infos: { village: 'Combani', commune: 'Tsingoni', villageId: 15 }, location: { latLng: [-12.8, 45.2] } } };
const boundary = { village_id: 21, village: 'Hachénoi', resolution: 'reference', geometry: fixture,
    source: { source_properties: { libelle: 'Tsingoni' } } };
const mounted = [];
const stub = name => Vue.defineComponent({ name, inheritAttrs: false,
    props: ['latLngs', 'paths', 'path', 'position', 'latLng', 'icon'], setup(props, { slots }) { return () => Vue.h('div', {
        'data-layer': name, 'data-icon': props.icon?.url || props.icon?.iconUrl, 'data-point': props.position || props.latLng ? JSON.stringify(props.position || props.latLng) : undefined, 'data-paths': props.paths || props.path || props.latLngs ? JSON.stringify(props.paths || props.path || props.latLngs) : undefined,
    }, slots.default?.()); } });
function loadComponent(name, overrides = {}) {
    const { descriptor } = parse(readFileSync(`src/components/maps/${name}.vue`, 'utf8'));
    const cjs = input => transformSync(input, { babelrc: false, configFile: false,
        plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
    const module = { exports: {} };
    const resolve = id => {
        if (overrides[id]) return overrides[id];
        if (id === 'vue') return Vue;
        if (id.endsWith('mapSurfaceUtils.js')) return utils;
        if (id.endsWith('villageZoneUtils.js')) return zones;
        if (id.endsWith('villageRouteZones.js')) return routeZones;
        if (id.endsWith('mapProvider.js')) return providers;
        if (id.endsWith('tripActorMarkers.js')) return actors;
        if (id === '@vue-leaflet/vue-leaflet') return Object.fromEntries(['LMap', 'LTileLayer', 'LMarker', 'LPolygon', 'LPolyline', 'LTooltip', 'LPopup', 'LCircleMarker'].map(n => [n, stub(n)]));
        if (id === 'leaflet') return { default: { divIcon: () => ({}), icon: options => options }, __esModule: true };
        return { default: stub(id), __esModule: true };
    };
    new Function('module', 'exports', 'require', cjs(descriptor.script.content))(module, module.exports, resolve);
    const component = module.exports.default;
    const template = { exports: {} };
    new Function('module', 'exports', 'require', cjs(compileTemplate({ source: descriptor.template.content, filename: name, id: name }).code))(template, template.exports, resolve);
    component.render = template.exports.render;
    return component;
}
function mount(component, props) {
    const host = document.createElement('div'); document.body.appendChild(host);
    const app = Vue.createApp(component, props);
    for (const n of ['GMapMap', 'GMapPolygon', 'GMapMarker', 'GMapPolyline', 'GMapInfoWindow']) app.component(n, stub(n));
    const vm = app.mount(host); mounted.push(() => { app.unmount(); host.remove(); });
    return { host, vm };
}
afterEach(() => { mounted.splice(0).forEach(clean => clean()); vi.restoreAllMocks(); });

describe('actual map adapter templates', () => {
    for (const [engine, polygon, marker] of [['LeafletMapSurface', 'LPolygon', 'LMarker'], ['GoogleMapSurface', 'GMapPolygon', 'GMapMarker']]) {
        for (const count of [0, 1, 2]) {
            it(`${engine} keeps both reference markers and the stored route alongside ${count} zones`, () => {
                const route = { id: 'stored', current: true, duration: '5 min',
                    polylineDecoded: [[-12.8, 45.1], [-12.81, 45.15], [-12.8, 45.2]] };
                const villageZones = [{ role: 'origin', boundary }, { role: 'destination', boundary }].slice(0, count);
                const { host } = mount(loadComponent(engine), { center: [-12.8, 45.1], ...points,
                    villageZones, routes: [route], routeAvailable: true });
                const polygons = host.querySelectorAll(`[data-layer="${polygon}"]`);
                expect(polygons).toHaveLength(count);
                if (count) expect(JSON.parse(polygons[0].dataset.paths)).toHaveLength(2);
                const layers = engine === 'LeafletMapSurface' ? '[data-layer="LMarker"], [data-layer="LCircleMarker"]' : `[data-layer="${marker}"]`;
                const markerPoints = [...host.querySelectorAll(layers)].map(node => JSON.parse(node.dataset.point));
                expect(markerPoints).toContainEqual(engine === 'LeafletMapSurface' ? [-12.8, 45.1] : { lat: -12.8, lng: 45.1 });
                expect(markerPoints).toContainEqual(engine === 'LeafletMapSurface' ? [-12.8, 45.2] : { lat: -12.8, lng: 45.2 });
                expect(host.querySelectorAll(`[data-layer="${engine === 'LeafletMapSurface' ? 'LPolyline' : 'GMapPolyline'}"]`)).toHaveLength(2);
                expect(route.polylineDecoded).toEqual([[-12.8, 45.1], [-12.81, 45.15], [-12.8, 45.2]]);
            });
        }
        it(`${engine} includes the full zone in viewport bounds`, async () => {
            const component = loadComponent(engine); const fitBounds = vi.fn();
            const context = { ready: true, bottomPadding: 320, origin: points.origin, destination: points.destination,
                originCoordinate: [-12.8, 45.1], destinationCoordinate: [-12.8, 45.2], routes: [{ current: false, polylineDecoded: [[0, 0], [1, 1]] }, { current: true, originalPolyline: [[-12.8, 45.1], [-12.8, 45.2]] }],
                zonePolygons: zones.villageZonePolygons([{ role: 'origin', boundary }]),
                $refs: { mapRef: { leafletObject: { fitBounds }, $mapPromise: Promise.resolve({ fitBounds }) } } };
            const extendsPoint = vi.fn();
            if (engine === 'GoogleMapSurface') window.google = { maps: { LatLngBounds: function () { this.extend = extendsPoint; } } };
            await component.methods.fitRouteBounds.call(context);
            expect(fitBounds).toHaveBeenCalledOnce();
            if (engine === 'LeafletMapSurface') expect(fitBounds.mock.calls[0][1].paddingBottomRight[1]).toBe(320);
            else expect(fitBounds.mock.calls[0][1].bottom).toBe(320);
            if (engine === 'LeafletMapSurface') expect(fitBounds.mock.calls[0][0]).toContainEqual([-13, 46]);
            else expect(extendsPoint).toHaveBeenCalledWith({ lat: -13, lng: 46 });
            if (engine === 'LeafletMapSurface') expect(fitBounds.mock.calls[0][0]).not.toContainEqual([0, 0]);
            else expect(extendsPoint).not.toHaveBeenCalledWith({ lat: 0, lng: 0 });
            delete window.google;
        });
    }
    for (const [engine, marker] of [['GoogleMapSurface', 'GMapMarker'], ['LeafletMapSurface', 'LMarker']]) {
        it(`${engine} renders the shared vehicle/pedestrian assets alongside zones and route`, async () => {
            const { vm, host } = mount(loadComponent(engine), { center: [-12.8, 45.1], ...points,
                routeAvailable: true, routes: [{ id: 'stored', current: true, duration: '15 min', polylineDecoded: [[-12.8, 45.1], [-12.8, 45.2]] }], villageZones: [{ role: 'origin', boundary, color: '#15803d' }],
                currentLocation: [-12.8, 45.1], sharedLocations: [[-12.8, 45.2]],
                actorMarkers: [{ id: 'driver', kind: 'car', latLng: [-12.8, 45.1], heading: 90, label: 'Véhicule du trajet' },
                    { id: 'p1', kind: 'pedestrian', latLng: [-12.8, 45.2], label: 'Passager à récupérer' }] });
            await Vue.nextTick();
            expect(vm.actorAssets).toHaveLength(2);
            expect(decodeURIComponent(vm.actorAssets[0].asset.url)).toContain('rotate(90 24 24)');
            expect(decodeURIComponent(vm.actorAssets[0].asset.url)).toContain('fill="#737373"');
            expect(host.querySelectorAll(`[data-layer="${marker}"]`).length).toBe(engine === 'LeafletMapSurface' ? 3 : 5);
            expect(vm.zonePolygons).toHaveLength(1);
        });
    }
    for (const [engine, marker] of [['GoogleMapSurface', 'GMapMarker'], ['LeafletMapSurface', 'LMarker']]) {
        it(`${engine} keeps one car while confirmed passengers disappear independently`, async () => {
            const rows = Vue.ref([{ userId: 'p1', in_car: false }, { userId: 'p1', in_car: false }, { userId: 'p2', in_car: false }]);
            const adapter = loadComponent(engine);
            const wrapper = Vue.defineComponent({ setup: () => () => Vue.h(adapter, {
                center: [-12.8, 45.1], ...points, actorMarkers: actors.tripActorMarkers({ userId: 'driver', driverId: 'driver',
                    bookings: rows.value, ownPosition: [-12.8, 45.1], now: 0,
                    positions: [{ from: 'p1', latLng: [-12.8, 45.15], receivedAt: 0 }, { from: 'p2', latLng: [-12.8, 45.2], receivedAt: 0 }] }),
            }) });
            const { host } = mount(wrapper, {});
            const actorCount = () => [...host.querySelectorAll(`[data-layer="${marker}"]`)]
                .filter(node => decodeURIComponent(node.getAttribute('data-icon') || '').includes('viewBox="0 0 48 48"')).length;
            expect(actorCount()).toBe(3);
            rows.value = rows.value.map(row => row.userId === 'p1' ? { ...row, in_car: true } : row);
            await Vue.nextTick(); expect(actorCount()).toBe(2);
            rows.value = rows.value.map(row => ({ ...row, in_car: true }));
            await Vue.nextTick(); expect(actorCount()).toBe(1);
        });
    }
    it('uses the full selected route for intermediate aliases, with no GPS-driven refetch or publication history', async () => {
        const square = (x, id) => ({ village_id: id, boundary_village_id: id, village: `Village ${id}`,
            geometry: { type: 'Polygon', coordinates: [[[x, -12.8], [x + .01, -12.8], [x + .01, -12.79], [x, -12.79], [x, -12.8]]] } });
        const rows = [square(45, 1), square(45.02, 2), square(45.04, 3)];
        const load = vi.fn().mockResolvedValue({ 1: rows[0], 3: rows[2] });
        const catalog = vi.fn().mockResolvedValue([...rows, { ...rows[1], village_id: 22, resolution: 'reference' }]);
        const routes = Vue.reactive([{ current: true, polylineDecoded: [[-12.795, 45.04], [-12.795, 45.05]],
            originalPolyline: [[-12.795, 45], [-12.795, 45.05]] }, { current: false, polylineDecoded: [[-12.78, 45], [-12.78, 45.05]] }]);
        const component = loadComponent('MapSurface', { '@/services/villageBoundaryService.js': { loadVillageBoundaries: load, loadVillageBoundaryCatalog: catalog } });
        const { vm, host } = mount(component, { center: [-12.8, 45.1], origin: points.origin, destination: points.destination,
            originVillageId: 1, destinationVillageId: 3, routes });
        await vm.fetchBoundaries(); await Vue.nextTick();
        expect(vm.intermediateLegend.map(zone => zone.key)).toEqual(['boundary:2']);
        expect(host.textContent).toContain('Villages traversés');
        const reads = catalog.mock.calls.length;
        vm.updateVisits(); vm.updateVisits();
        expect(vm.villageZones.every(zone => zone.phase === 'upcoming')).toBe(true);
        expect(catalog).toHaveBeenCalledTimes(reads);
        routes[0].current = false; routes[1].current = true;
        await Vue.nextTick(); expect(vm.intermediateLegend).toEqual([]);
        expect(catalog).toHaveBeenCalledTimes(reads);
    });
    for (const engine of ['GoogleMapSurface', 'LeafletMapSurface']) {
        it(`${engine} applies the common exited-zone style without refitting camera on status changes`, async () => {
            const zoneRows = Vue.reactive([
                { key: 'boundary:1', role: 'origin', boundary, phase: 'visited' },
                { key: 'boundary:2', role: 'intermediate', boundary, phase: 'active' }]);
            const { vm } = mount(loadComponent(engine), { center: [-12.8, 45.1], villageZones: zoneRows });
            const fit = vi.spyOn(vm, 'fitRouteBounds');
            expect(vm.zonePolygons[0].fillOpacity).toBe(.025);
            expect(vm.zonePolygons[0].strokeOpacity).toBe(.25);
            expect(vm.zonePolygons.at(-1).fillOpacity).toBe(.20);
            expect(loadComponent(engine).watch.villageZones).toBeUndefined();
            expect(loadComponent(engine).watch.zoneGeometryKey).toBeTypeOf('function');
            zoneRows[0].phase = 'active'; zoneRows[1].phase = 'visited'; await Vue.nextTick();
            expect(vm.zonePolygons[0].fillOpacity).toBe(.20);
            expect(vm.zonePolygons.at(-1).fillOpacity).toBe(.025);
            expect(fit).not.toHaveBeenCalled();
        });
    }
    it('keeps point fallback after a network error and lets the user retry', async () => {
        const load = vi.fn().mockRejectedValue(new Error('offline'));
        const component = loadComponent('MapSurface', { '@/services/villageBoundaryService.js': { loadVillageBoundaries: load } });
        const { vm, host } = mount(component, { center: [-12.8, 45.1], ...points });
        await vm.fetchBoundaries(); await Vue.nextTick();
        expect(vm.boundaryStatus).toBe('error');
        expect(vm.villageZones.every(zone => !zone.boundary)).toBe(true);
        expect(host.textContent).toContain('repère affiché');
        load.mockResolvedValue({ 21: boundary });
        host.querySelector('button').click();
        await vi.waitFor(() => expect(vm.boundaryStatus).toBe('ready'));
        expect(load).toHaveBeenLastCalledWith([21, 15], { refresh: true });
    });
    it('ignores a stale selection response and presents parent labels with a usable retry', async () => {
        const resolvers = [];
        const load = vi.fn(() => new Promise(resolve => resolvers.push(resolve)));
        const component = loadComponent('MapSurface', { '@/services/villageBoundaryService.js': { loadVillageBoundaries: load } });
        const { vm, host } = mount(component, { center: [-12.8, 45.1], ...points });
        const next = vm.fetchBoundaries();
        resolvers[1]({ 21: boundary }); await next; await Vue.nextTick();
        expect(host.textContent).toContain('Hachénoi · zone de Tsingoni');
        expect(host.querySelector('button').textContent).toBe('Réessayer');
        resolvers[0]({}); await Promise.resolve(); await Vue.nextTick();
        expect(vm.boundaries[21]).toEqual(boundary);
    });
});

for (const [engine, layer] of [['GoogleMapSurface','GMapPolyline'], ['LeafletMapSurface','LPolyline']]) {
    it(`${engine} redraws the remaining segment without recentering or losing the original route`, async () => {
        const full=[[-12.8,45],[-12.8,45.01],[-12.8,45.02]];
        const routes=Vue.reactive([{id:1,current:true,originalPolyline:full,polylineDecoded:full.slice()}]);
        const {vm,host}=mount(loadComponent(engine),{center:[-12.8,45.01],routes,routeAvailable:true});
        const fit=vi.spyOn(vm,'fitRouteBounds'); const boundsKey=vm.routeBoundsKey;
        routes[0].polylineDecoded=[[-12.8,45.005],[-12.8,45.01],[-12.8,45.02]]; await Vue.nextTick();
        const paths=JSON.parse(host.querySelector(`[data-layer="${layer}"]`).dataset.paths);
        expect(paths[0]).toEqual(engine==='GoogleMapSurface'?{lat:-12.8,lng:45.005}:[-12.8,45.005]);
        expect(vm.routeBoundsKey).toBe(boundsKey); expect(fit).not.toHaveBeenCalled(); expect(routes[0].originalPolyline).toEqual(full);
    });
}
it('publishes only a confirmed fresh village, with the canonical alias label, and clears stale state', async () => {
    let now=1000; vi.spyOn(Date,'now').mockImplementation(()=>now);
    const b={...boundary,boundary_village_id:70}; const emit=vi.fn();
    const component=loadComponent('MapSurface',{'@/services/villageBoundaryService.js':{
        loadVillageBoundaries:vi.fn().mockResolvedValue({21:b}),loadVillageBoundaryCatalog:vi.fn().mockResolvedValue([{...b,village_id:70,village:'Tsingoni'}])}});
    const position={latLng:[-12.95,45.1],accuracyMeters:5,observedAt:now,measuredAt:now};
    const {vm}=mount(component,{center:[-12.95,45.1],...points,progressContext:'trip:user',vehiclePosition:position,onZoneProgress:emit});
    await vm.fetchBoundaries(); await Vue.nextTick();
    expect(emit.mock.calls.at(-1)[0].current).toBeNull();
    for (now of [2000,3000]) { position.observedAt=now;position.measuredAt=now;vm.updateVisits(); }
    expect(emit.mock.calls.at(-1)[0].current).toEqual({key:'boundary:70',label:'Tsingoni'});
    now=20000;vm.updateVisits();expect(emit.mock.calls.at(-1)[0].current).toBeNull();
    vm.resetVisits();expect(emit.mock.calls.at(-1)[0].current).toBeNull();
});
