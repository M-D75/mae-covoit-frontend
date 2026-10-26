import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { parse, compileTemplate } from '@vue/compiler-sfc';
import * as Vue from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as utils from '@/components/maps/mapSurfaceUtils.js';
import * as zones from '@/components/maps/villageZoneUtils.js';
import * as providers from '@/utils/mapProvider.js';

const fixture = { type: 'MultiPolygon', coordinates: [[[[45, -13], [46, -13], [46, -12], [45, -13]],
    [[45.2, -12.8], [45.3, -12.8], [45.3, -12.7], [45.2, -12.8]]]] };
const points = { origin: { infos: { village: 'Hachénoi', commune: 'Tsingoni', villageId: 21 }, location: { latLng: [-12.8, 45.1] } },
    destination: { infos: { village: 'Combani', commune: 'Tsingoni', villageId: 15 }, location: { latLng: [-12.8, 45.2] } } };
const boundary = { village_id: 21, village: 'Hachénoi', resolution: 'reference', geometry: fixture,
    source: { source_properties: { libelle: 'Tsingoni' } } };
const mounted = [];
const stub = name => Vue.defineComponent({ name, inheritAttrs: false,
    props: ['latLngs', 'paths', 'position', 'latLng'], setup(props, { slots }) { return () => Vue.h('div', {
        'data-layer': name, 'data-point': props.position || props.latLng ? JSON.stringify(props.position || props.latLng) : undefined, 'data-paths': props.paths || props.latLngs ? JSON.stringify(props.paths || props.latLngs) : undefined,
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
        if (id.endsWith('mapProvider.js')) return providers;
        if (id === '@vue-leaflet/vue-leaflet') return Object.fromEntries(['LMap', 'LTileLayer', 'LMarker', 'LPolygon', 'LPolyline', 'LTooltip', 'LPopup', 'LCircleMarker'].map(n => [n, stub(n)]));
        if (id === 'leaflet') return { default: { divIcon: () => ({}) }, __esModule: true };
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
                originCoordinate: [-12.8, 45.1], destinationCoordinate: [-12.8, 45.2], routes: [],
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
            delete window.google;
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
        await Promise.resolve(); await Vue.nextTick(); await Vue.nextTick();
        expect(load).toHaveBeenLastCalledWith([21, 15], { refresh: true });
        expect(vm.boundaryStatus).toBe('ready');
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
