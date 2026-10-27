import { isVillageGeometry } from './villageZoneUtils.js';

// Local affine projection: exact line/polygon topology in lon/lat, approximate
// metric distances for Mayotte. No route resampling, API calls or centroid test.
const RADIANS = Math.PI / 180, EARTH = 6371000;
const X_SCALE = EARTH * RADIANS * Math.cos(-12.8 * RADIANS), Y_SCALE = EARTH * RADIANS;
const preparedCache = new WeakMap();
const EPSILON = 1e-6;
const project = ([lon, lat]) => [(lon - 45) * X_SCALE, (lat + 12.8) * Y_SCALE];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]];
const length = p => Math.hypot(p[0], p[1]);
function bounds(points) {
    return points.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
}
function overlaps(a, b) { return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]; }
function pointSegmentDistance(point, a, b) {
    const ab = subtract(b, a), ap = subtract(point, a), square = ab[0] ** 2 + ab[1] ** 2;
    const t = square ? Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1]) / square)) : 0;
    return Math.hypot(point[0] - a[0] - t * ab[0], point[1] - a[1] - t * ab[1]);
}
export function prepareVillageGeometry(geometry) {
    if (!isVillageGeometry(geometry)) return null;
    if (preparedCache.has(geometry)) return preparedCache.get(geometry);
    const coordinates = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    const polygons = coordinates.map(polygon => {
        const rings = polygon.map(ring => ring.map(project));
        const edges = rings.flatMap(ring => ring.slice(1).map((point, index) => [ring[index], point, bounds([ring[index], point])]));
        return { rings, edges, bounds: bounds(rings[0]) };
    });
    const prepared = { polygons, bounds: bounds(polygons.flatMap(p => [[p.bounds[0], p.bounds[1]], [p.bounds[2], p.bounds[3]]])) };
    preparedCache.set(geometry, prepared);
    return prepared;
}
function inRing(point, ring) {
    let inside = false;
    for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1], b = ring[i];
        if (pointSegmentDistance(point, a, b) < EPSILON) return 'boundary';
        if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
}
function inPolygon(point, polygon) {
    if (inRing(point, polygon.rings[0]) !== true) return false;
    return polygon.rings.slice(1).every(ring => inRing(point, ring) === false);
}
function segmentCuts(a, b, c, d) {
    const direction = subtract(b, a), edge = subtract(d, c), delta = subtract(c, a);
    const denominator = cross(direction, edge);
    if (Math.abs(denominator) < EPSILON) {
        if (Math.abs(cross(delta, direction)) > EPSILON) return [];
        const square = direction[0] ** 2 + direction[1] ** 2;
        return square ? [c, d].map(p => ((p[0] - a[0]) * direction[0] + (p[1] - a[1]) * direction[1]) / square).filter(t => t >= 0 && t <= 1) : [];
    }
    const t = cross(delta, edge) / denominator, u = cross(delta, direction) / denominator;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [t] : [];
}
export function routeVillageIntersection(path, prepared, minimumInsideMeters = 5) {
    if (!prepared || !Array.isArray(path) || path.length < 2) return null;
    let insideMeters = 0, along = 0, firstEntry = null;
    if (path.some(p => !Array.isArray(p) || p.length < 2 || !p.every(Number.isFinite) || Math.abs(p[0]) > 90 || Math.abs(p[1]) > 180)) return null;
    const points = path.map(([lat, lon]) => project([lon, lat]));
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i], distance = length(subtract(b, a));
        if (!distance) continue;
        const segmentBounds = bounds([a, b]);
        if (overlaps(segmentBounds, prepared.bounds)) {
            // Split at every exterior/hole intersection. Midpoints are inside
            // or outside a whole interval, even when both route vertices lie outside.
            const cuts = [0, 1];
            for (const polygon of prepared.polygons) {
                if (!overlaps(segmentBounds, polygon.bounds)) continue;
                for (const [c, d, edgeBounds] of polygon.edges) if (overlaps(segmentBounds, edgeBounds)) cuts.push(...segmentCuts(a, b, c, d));
            }
            cuts.sort((x, y) => x - y);
            for (let j = 1; j < cuts.length; j++) {
                const start = cuts[j - 1], end = cuts[j];
                if (end - start < 1e-10) continue;
                const t = (start + end) / 2, point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
                if (prepared.polygons.some(p => inPolygon(point, p))) {
                    if (firstEntry === null) firstEntry = along + start * distance;
                    insideMeters += (end - start) * distance;
                }
            }
        }
        along += distance;
    }
    return insideMeters >= minimumInsideMeters ? { insideMeters, firstEntry } : null;
}
export function boundaryGeometryKey(boundary) {
    if (!boundary?.geometry) return null;
    return `boundary:${boundary.boundary_village_id ?? boundary.village_id}`;
}
export function traversedVillageZones(catalog, path, endpointKeys = []) {
    const groups = new Map();
    for (const boundary of catalog) {
        const key = boundaryGeometryKey(boundary);
        if (!key || endpointKeys.includes(key)) continue;
        const previous = groups.get(key);
        if (!previous || Number(boundary.village_id) === Number(boundary.boundary_village_id)) groups.set(key, boundary);
    }
    return [...groups].flatMap(([key, boundary]) => {
        const intersection = routeVillageIntersection(path, prepareVillageGeometry(boundary.geometry));
        if (!intersection) return [];
        return [{ key, role: 'intermediate', boundary, label: boundary.village, firstEntry: intersection.firstEntry }];
    }).sort((a, b) => a.firstEntry - b.firstEntry);
}
export function classifyVillagePosition(latLng, prepared) {
    if (!prepared || !Array.isArray(latLng) || !latLng.every(Number.isFinite)) return null;
    const point = project([latLng[1], latLng[0]]);
    const inside = prepared.polygons.some(p => inPolygon(point, p));
    const box = prepared.bounds;
    const boxDistance = Math.hypot(Math.max(box[0] - point[0], 0, point[0] - box[2]), Math.max(box[1] - point[1], 0, point[1] - box[3]));
    // Far outside needs no scan over every ring edge.
    if (boxDistance > 15) return { inside: false, clearance: boxDistance };
    let clearance = Infinity;
    for (const polygon of prepared.polygons) for (const [a, b] of polygon.edges) clearance = Math.min(clearance, pointSegmentDistance(point, a, b));
    return { inside, clearance };
}
export function createZoneVisitTracker({ marginMeters = 15, confirmSamples = 2, dwellMs = 2000, maxAgeMs = 10000, maxGapMs = 15000, maxAccuracy = 30 } = {}) {
    const states = new Map();
    let lastObserved = null, lastAcceptedAt = null;
    function update(zones, sample, now = Date.now()) {
        const reliable = Boolean(sample && Array.isArray(sample.latLng) && sample.latLng.length === 2 && sample.latLng.every(Number.isFinite)
            && Math.abs(sample.latLng[0]) <= 90 && Math.abs(sample.latLng[1]) <= 180
            && Number.isFinite(sample.accuracyMeters) && sample.accuracyMeters >= 0 && sample.accuracyMeters <= maxAccuracy
            && Number.isFinite(sample.observedAt) && Number.isFinite(sample.measuredAt)
            && now - sample.observedAt >= -2000 && now - sample.observedAt <= maxAgeMs
            && Math.abs(now - sample.measuredAt) <= maxAgeMs);
        if (!reliable) {
            for (const state of states.values()) state.pending = null;
        } else if (sample.observedAt !== lastObserved) {
            const gap = lastAcceptedAt !== null && sample.observedAt - lastAcceptedAt > maxGapMs;
            if (lastObserved === null || sample.observedAt > lastObserved) {
                for (const zone of zones) {
                    if (!zone.boundary) continue;
                    let state = states.get(zone.key);
                    if (!state) { state = { phase: 'upcoming', pending: null }; states.set(zone.key, state); }
                    if (gap) state.pending = null;
                    const point = classifyVillagePosition(sample.latLng, prepareVillageGeometry(zone.boundary.geometry));
                    let target = null;
                    if (point && point.clearance >= Math.max(marginMeters, sample.accuracyMeters)) {
                        if (point.inside && state.phase !== 'active') target = 'active';
                        if (!point.inside && state.phase === 'active') target = 'visited';
                    }
                    if (!target) { state.pending = null; continue; }
                    if (state.pending?.target !== target) state.pending = { target, count: 0, since: sample.observedAt };
                    state.pending.count++;
                    if (state.pending.count >= confirmSamples && sample.observedAt - state.pending.since >= dwellMs) {
                        state.phase = target; state.pending = null;
                    }
                }
                lastObserved = sample.observedAt; lastAcceptedAt = sample.observedAt;
            }
        }
        return { reliable, phases: Object.fromEntries(zones.map(zone => [zone.key,
            states.get(zone.key)?.phase === 'active' && !reliable ? 'uncertain' : states.get(zone.key)?.phase || 'upcoming'])) };
    }
    return { update, reset() { states.clear(); lastObserved = null; lastAcceptedAt = null; } };
}
