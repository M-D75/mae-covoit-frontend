import { describe, it, expect } from 'vitest';
import { boundaryGeometryKey, prepareVillageGeometry, routeVillageIntersection, traversedVillageZones, createZoneVisitTracker } from '@/components/maps/villageRouteZones.js';
const ring = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
const shape = (x0 = 45, y0 = -12.8, x1 = 45.01, y1 = -12.79) => ({ type: 'Polygon', coordinates: [ring(x0, y0, x1, y1)] });
const boundary = (id, geometry = shape(), extra = {}) => ({ village_id: id, boundary_village_id: id, village: `Village ${id}`, geometry, ...extra });
const zone = { key: 'boundary:1', role: 'origin', boundary: boundary(1) };
const sample = (latLng, time, accuracyMeters = 5) => ({ latLng, observedAt: time, measuredAt: time, accuracyMeters });
const inside = [-12.795, 45.005], outside = [-12.795, 45.012];
function feed(tracker, points, start = 0) { let result; points.forEach((point, i) => { const time = start + i * 1000; result = tracker.update([zone], sample(point, time), time); }); return result; }
describe('real polyline/geometry intersections', () => {
    it('finds a small polygon crossed by a long segment with both vertices outside', () => {
        const prepared = prepareVillageGeometry(shape(45, -12.8, 45.0002, -12.7998));
        expect(routeVillageIntersection([[-12.7999, 44.99], [-12.7999, 45.02]], prepared)?.insideMeters).toBeGreaterThan(20);
    });
    it('does not confuse overlapping bounding boxes, tangency or a boundary-following segment with an interior crossing', () => {
        const prepared = prepareVillageGeometry(shape());
        expect(routeVillageIntersection([[-12.801, 45], [-12.8, 45.01]], prepared)).toBeNull();
        expect(routeVillageIntersection([[-12.8, 44.99], [-12.8, 45.02]], prepared)).toBeNull();
        expect(routeVillageIntersection([[-12.801, 45.011], [-12.79, 45.012]], prepared)).toBeNull();
    });
    it('accounts for holes and disconnected MultiPolygons', () => {
        const geometry = { type: 'MultiPolygon', coordinates: [[ring(45, -12.8, 45.01, -12.79), ring(45.002, -12.798, 45.008, -12.792)], [ring(45.02, -12.8, 45.03, -12.79)]] };
        const prepared = prepareVillageGeometry(geometry);
        expect(routeVillageIntersection([[-12.795, 45.003], [-12.795, 45.007]], prepared)).toBeNull();
        expect(routeVillageIntersection([[-12.795, 45.021], [-12.795, 45.029]], prepared)).not.toBeNull();
        const hit = routeVillageIntersection([[-12.795, 44.99], [-12.795, 45.04]], prepared);
        expect(hit.insideMeters).toBeGreaterThan(1000);
    });
    it('orders candidates on the selected route, deduplicates aliases, retains homonyms by ID and excludes endpoint geometry', () => {
        const catalog = [boundary(70), boundary(21, shape(), { boundary_village_id: 70, village: 'Hachénoi', resolution: 'reference' }),
            boundary(2, shape(45.02, -12.8, 45.03, -12.79), { village: 'Homonyme' }),
            boundary(3, shape(45.04, -12.8, 45.05, -12.79), { village: 'Homonyme' })];
        const route = [[-12.795, 44.99], [-12.795, 45.06]];
        expect(traversedVillageZones(catalog, route).map(z => z.key)).toEqual(['boundary:70', 'boundary:2', 'boundary:3']);
        expect(traversedVillageZones(catalog, route, [boundaryGeometryKey(catalog[1])]).map(z => z.key)).toEqual(['boundary:2', 'boundary:3']);
        expect(traversedVillageZones(catalog, [...route].reverse()).map(z => z.key)).toEqual(['boundary:3', 'boundary:2', 'boundary:70']);
        expect(traversedVillageZones(catalog, [[-12.7, 44.99], [-12.7, 45.06]])).toEqual([]);
    });
    it('does not bridge malformed route vertices and requires five meters of interior passage', () => {
        expect(routeVillageIntersection([inside, null, outside], prepareVillageGeometry(shape()))).toBeNull();
        expect(routeVillageIntersection([[-12.795, 44.99], [-12.795, 45.02]], prepareVillageGeometry(shape(45, -12.8, 45.00001, -12.79)))).toBeNull();
    });
});
describe('confirmed entry/exit and local progression', () => {
    it('never fades an unvisited zone; confirms entry and exit with samples plus dwell', () => {
        const tracker = createZoneVisitTracker();
        expect(feed(tracker, [outside, outside, outside]).phases[zone.key]).toBe('upcoming');
        expect(feed(tracker, [inside, inside], 3000).phases[zone.key]).toBe('upcoming');
        expect(feed(tracker, [inside], 5000).phases[zone.key]).toBe('active');
        expect(feed(tracker, [outside, outside], 6000).phases[zone.key]).toBe('active');
        expect(feed(tracker, [outside], 8000).phases[zone.key]).toBe('visited');
        expect(feed(tracker, [inside, inside, inside], 9000).phases[zone.key]).toBe('active');
    });
    it('ignores jitter, duplicate timestamps and poor/stale positions without inventing visits', () => {
        const tracker = createZoneVisitTracker();
        for (const now of [0, 1000, 2000]) tracker.update([zone], sample(inside, 0), now);
        expect(tracker.update([zone], sample(inside, 0), 3000).phases[zone.key]).toBe('upcoming');
        expect(feed(tracker, [inside, inside, inside], 4000).phases[zone.key]).toBe('active');
        expect(feed(tracker, [[-12.795, 45.01005], [-12.795, 45.00995], [-12.795, 45.01005]], 7000).phases[zone.key]).toBe('active');
        expect(tracker.update([zone], sample(outside, 10000, 100), 10000).phases[zone.key]).toBe('uncertain');
        expect(tracker.update([zone], sample(outside, 1000), 20000).reliable).toBe(false);
        tracker.reset();
        expect(feed(tracker, [outside, outside, outside], 21000).phases[zone.key]).toBe('upcoming');
    });
    it('does not infer passage from a jump across a zone; trackers are isolated', () => {
        const first = createZoneVisitTracker(), second = createZoneVisitTracker();
        feed(first, [inside, inside, inside]);
        expect(feed(second, [[-12.795, 44.99], outside, outside]).phases[zone.key]).toBe('upcoming');
        expect(first.update([zone], null, 4000).phases[zone.key]).toBe('uncertain');
    });
});
