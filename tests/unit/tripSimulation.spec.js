import {readFileSync} from 'node:fs';
import { describe, it, expect } from 'vitest';
import { createTripSimulation, distanceMeters, normalizeTripPosition, SIMULATION_SPEEDS } from '@/services/tripSimulation.js';
import { tripActorMarkers, actorMarkerAsset, summarizeBoarding } from '@/components/maps/tripActorMarkers.js';
const path = [[0, 0], [0, 0.01], [0.01, 0.01]];
describe('position source substitution', () => {
    it('interpolates physical speed separately from clock acceleration, without routing calls', () => {
        let now = 0; const delivered = [];
        const engine = createTripSimulation(path, p => delivered.push(p), () => now);
        engine.state.speed = 36; engine.start(); now = 1000; engine.tick();
        expect(engine.state.meters).toBeCloseTo(10);
        expect(distanceMeters(path[0], [delivered.at(-1).coords.latitude, delivered.at(-1).coords.longitude])).toBeCloseTo(10);
        expect(delivered.at(-1).coords.heading).toBeCloseTo(90);
        engine.state.acceleration = 5; now = 2000; engine.tick(); expect(engine.state.meters).toBeCloseTo(60);
        engine.state.speed = 0; now = 4000; engine.tick(); expect(engine.state.meters).toBeCloseTo(60);
    });
    it.each([100, 200])('supports %s km/h without confusing physical speed and elapsed time', speed => {
        let now = 0; let point;
        const engine = createTripSimulation(path, p => { point = p; }, () => now);
        engine.state.speed = speed; engine.start(); now = 3600; engine.tick();
        expect(SIMULATION_SPEEDS).toContain(speed);
        expect(engine.state.meters).toBeCloseTo(speed);
        expect(normalizeTripPosition(point).speedKmh).toBeCloseTo(speed);
    });
    it('pauses, resumes, resets and supports GPS outages and independent actor starts', () => {
        let now = 0; const delivered = [];
        const engine = createTripSimulation(path, p => delivered.push(p), () => now);
        engine.start(); engine.pause(); now = 10000; engine.tick(); expect(engine.state.meters).toBe(0);
        engine.state.gpsAvailable = false; engine.start(); now += 1000; engine.tick(); expect(delivered).toHaveLength(1);
        const before = engine.state.meters; engine.state.gpsAvailable = true; now += 1000; engine.tick(); expect(engine.state.meters).toBeGreaterThan(before);
        engine.seek(0.5); expect(engine.state.meters).toBeCloseTo(engine.total / 2);
        engine.place([0, 0.01]); expect(delivered.at(-1).coords.longitude).toBe(0.01);
        engine.reset(); expect(engine.state.running).toBe(false); expect(engine.state.meters).toBe(0);
        expect(() => createTripSimulation([], () => {})).toThrow();
    });
    it('normalizes real and simulated GPS through one pipeline and retains heading while stopped', () => {
        const first = normalizeTripPosition({ coords: { latitude: 0, longitude: 0.01 } }, [0, 0]);
        expect(first.heading).toBeCloseTo(90); expect(first.source).toBe('gps');
        expect(normalizeTripPosition({ source: 'simulation', coords: { latitude: 0, longitude: 0.01 } }, first.latLng, first.heading).heading).toBe(first.heading);
        expect(normalizeTripPosition({ coords: { latitude: 1000, longitude: 0 } })).toBeNull();
    });
});
const bookings = [{ id: 1, userId: 'p1', in_car: false }, { id: 2, userId: 'p2', in_car: false }];
const positions = ['driver', 'p1', 'p2', 'stranger'].map(from => ({ from, latLng: [0, 0], heading: 90, receivedAt: 0 }));
describe('shared actor visibility and SVG assets', () => {
    const view = (userId, rows = bookings, time = 0) => tripActorMarkers({ userId, driverId: 'driver', bookings: rows, positions, ownPosition: [0, 0], now: time });
    it('shows the driver passengers to collect; passengers see no other passengers', () => {
        expect(view('driver').map(a => a.kind).sort()).toEqual(['car', 'pedestrian', 'pedestrian']);
        expect(view('p1').map(a => a.kind).sort()).toEqual(['car', 'self']);
        expect(view('p1').map(a => a.id).sort()).toEqual(['driver', 'p1']);
    });
    it('hides each pedestrian only after all of their reservations are confirmed, including reconnect', () => {
        const one = bookings.map(b => b.id === 1 ? { ...b, in_car: true } : b);
        expect(view('driver', one).map(a => a.id).sort()).toEqual(['driver', 'p2']);
        expect(view('p1', one).map(a => a.id)).toEqual(['driver']);
        expect(view('driver', bookings.map(b => ({ ...b, in_car: true }))).map(a => a.kind)).toEqual(['car']);
        expect(view('driver', [...one, { id: 3, userId: 'p1', in_car: false }]).some(a => a.id === 'p1')).toBe(true);
    });
    it('marks a stale peer and own GPS and expires peer positions', () => {
        expect(view('driver', bookings, 11000).filter(a => a.id !== 'driver').every(a => a.stale)).toBe(true);
        expect(view('driver', bookings, 121000).map(a => a.id)).toEqual(['driver']);
        expect(tripActorMarkers({ userId: 'driver', driverId: 'driver', ownPosition: [0, 0], ownReceivedAt: 0, now: 11000 })[0].stale).toBe(true);
    });
    it('uses the same safe vector, rotation and center anchor in both renderers', () => {
        const car = actorMarkerAsset({ kind: 'car', heading: 90 });
        expect(decodeURIComponent(car.url)).toContain('rotate(90 24 24)');
        expect(car.anchor).toBe(car.size / 2);
        expect(actorMarkerAsset({ kind: 'self' }).size).toBeLessThan(car.size);
        expect(actorMarkerAsset({ kind: 'pedestrian' }).url).not.toBe(car.url);
    });
});

describe('boarding summary counts people independently from seats', () => {
    it('counts a multi-seat passenger once and preserves another passenger’s waiting state', () => {
        const rows = [{ userId: 'p1', in_car: true }, { userId: 'p1', in_car: true }, { userId: 'p2', in_car: false }];
        expect(summarizeBoarding(rows, 'p1')).toEqual({ total: 2, onboard: 1, waiting: 1, hasBooking: true, selfOnboard: true });
        expect(summarizeBoarding(rows, 'p2').selfOnboard).toBe(false);
        expect(summarizeBoarding([...rows, { userId: 'p1', in_car: false }], 'p1').selfOnboard).toBe(false);
    });
    it('does not count refused or absent rows and recognizes restored confirmed bookings', () => {
        const rows = [{ userId: 'p1', in_car: true }, { userId: 'p2', in_car: false, is_refused: true }, { userId: 'p3', in_car: false, passenger_no_show: true }];
        expect(summarizeBoarding(JSON.parse(JSON.stringify(rows)), 'p1').onboard).toBe(1);
        expect(summarizeBoarding(rows, 'p1').waiting).toBe(0);
    });
});

it('recolors only car body, uses a north-facing top view and keeps every orientation centered', () => {
    for(const heading of [0,90,180,270]) {
        const asset=actorMarkerAsset({kind:'car',heading,bodyColor:'#a855f7'}),svg=decodeURIComponent(asset.url);
        expect(asset.size).toBe(48);expect(asset.anchor).toBe(24);expect(svg).toContain(`rotate(${heading} 24 24)`);
        expect(svg).toContain('fill="#a855f7"');expect(svg).toContain('fill="#bfdbfe"');expect(svg).toContain('fill="#ff0000"');expect(svg).not.toContain('<rect');
        expect(svg).not.toContain('<script');expect(svg).not.toContain('https://');
    }
    const invalid=decodeURIComponent(actorMarkerAsset({kind:'car',bodyColor:'red" onload="evil'}).url);
    expect(invalid).toContain('fill="#171717"');expect(invalid).not.toContain('onload');
    expect(decodeURIComponent(actorMarkerAsset({kind:'pedestrian',heading:90}).url)).not.toContain('rotate(90');
});
it('renders only the unchanged car artwork without a surrounding disc, keeping passenger discs',()=>{
 const svg=decodeURIComponent(actorMarkerAsset({kind:'car',heading:0}).url);expect(svg).not.toContain('<circle');expect(svg).not.toContain('<rect');
 expect(decodeURIComponent(actorMarkerAsset({kind:'pedestrian'}).url)).toContain('<circle');expect(decodeURIComponent(actorMarkerAsset({kind:'self'}).url)).toContain('<circle');
});

it('keeps the shipped static car body consistent with the common map generator',()=>{
 const svg=readFileSync('src/assets/maps/car-top-view.svg','utf8');expect(svg).toContain('fill="#171717"');expect(svg).not.toContain('#737373');expect(svg).not.toContain('#e2e8f0');expect(svg).toContain('fill="#bfdbfe"');expect(svg).toContain('fill="#ff0000"');expect(svg).not.toContain('<circle');expect(svg).not.toContain('<rect');
 expect(decodeURIComponent(actorMarkerAsset({kind:'car'}).url)).toContain('fill="#171717"');
});
