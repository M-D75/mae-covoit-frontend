import { describe, it, expect } from 'vitest';
import { createRouteProgress } from '@/services/routeProgress.js';
const path = [[-12.8,45],[-12.8,45.01],[-12.8,45.02]];
const sample = (x, time, extra = {}) => ({latLng:[-12.8,x],accuracyMeters:5,observedAt:time,measuredAt:time,source:'gps',...extra});
describe('monotone vehicle projection onto route segments', () => {
    it('clips inside sparse segments without requiring any route vertex within ten meters', () => {
        const tracker=createRouteProgress(path); const before=JSON.stringify(path);
        const a=tracker.update(sample(45.002,0),0); const b=tracker.update(sample(45.005,5000),5000);
        expect(b.meters).toBeGreaterThan(a.meters); expect(b.path[0][1]).toBeCloseTo(45.005,6);
        expect(b.path).toHaveLength(3); expect(b.remainingMeters).toBeLessThan(a.remainingMeters); expect(JSON.stringify(path)).toBe(before);
    });
    it('handles a large accelerated jump, then the endpoint, without hiding the entire route after boarding', () => {
        const tracker=createRouteProgress(path);tracker.update(sample(45,0),0);
        const mid=tracker.update(sample(45.01,1000,{source:'simulation'}),1000);
        expect(mid.path.length).toBeGreaterThan(1);expect(mid.remainingMeters).toBeGreaterThan(1000);
        const end=tracker.update(sample(45.02,2000,{source:'simulation'}),2000);
        expect(end.path).toEqual([]);expect(end.remainingMeters).toBe(0);
    });
    it('freezes for off-route, inaccurate, stale and duplicate observations; never grows the route on jitter', () => {
        const tracker=createRouteProgress(path); const first=tracker.update(sample(45.005,0),0);
        for (const s of [sample(45.006,1000,{latLng:[-12.81,45.006]}),sample(45.006,1000,{accuracyMeters:80}),sample(45.006,0)]) expect(tracker.update(s,1000).meters).toBe(first.meters);
        expect(tracker.update(sample(45.006,1000),20000).meters).toBe(first.meters);
        expect(tracker.update(sample(45.0049,2000),2000).meters).toBe(first.meters);
        expect(tracker.update(sample(45.02,2500),2500).meters).toBe(first.meters);
    });
    it('selects the earliest plausible branch at a loop crossing and retains progress on reconnect', () => {
        const loop=[[-12.8,45],[-12.8,45.01],[-12.79,45.01],[-12.79,45],[-12.8,45],[-12.8,45.02]];
        const tracker=createRouteProgress(loop);
        expect(tracker.update(sample(45,0),0).meters).toBe(0);
        const next=tracker.update(sample(45.0005,1000),1000);expect(next.meters).toBeLessThan(100);
        const resumed=tracker.update(sample(45.008,21000),21000);expect(resumed.meters).toBeGreaterThan(800);expect(resumed.meters).toBeLessThan(1000);
        expect(tracker.reset().path).toEqual(loop);expect(tracker.snapshot().meters).toBe(0);
    });
});
