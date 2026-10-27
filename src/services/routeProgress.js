import { distanceMeters } from './tripSimulation.js';
const valid = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180;
const scaleY = 6371000 * Math.PI / 180;

// Local projection of each observation onto actual polyline segments. No API,
// no mutation of the full route and no proximity-to-every-vertex requirement.
export function createRouteProgress(path) {
    const points = Array.isArray(path) && path.every(valid) ? path.map(p => [...p]) : [];
    const lengths = points.slice(1).map((p, i) => distanceMeters(points[i], p));
    const cumulative = [0]; lengths.forEach(n => cumulative.push(cumulative.at(-1) + n));
    const totalMeters = cumulative.at(-1);
    let progress = null, acceptedAt = null;
    function snapshot() {
        if (progress === null) return { progressed: false, meters: 0, totalMeters, remainingMeters: totalMeters, path: points.map(p => [...p]) };
        let index = lengths.findIndex((n, i) => cumulative[i + 1] > progress);
        if (index < 0) return { progressed: true, meters: progress, totalMeters, remainingMeters: 0, path: [] };
        const ratio = lengths[index] ? (progress - cumulative[index]) / lengths[index] : 0;
        const foot = points[index].map((n, axis) => n + (points[index + 1][axis] - n) * ratio);
        return { progressed: true, meters: progress, totalMeters, remainingMeters: totalMeters - progress,
            path: [foot, ...points.slice(index + 1).map(p => [...p])] };
    }
    return {
        update(sample, now = Date.now()) {
            const at = sample?.observedAt;
            if (!valid(sample?.latLng) || !Number.isFinite(at) || !Number.isFinite(sample.measuredAt)
                || now - at < -2000 || now - at > 10000 || Math.abs(now - sample.measuredAt) > 10000
                || !Number.isFinite(sample.accuracyMeters) || sample.accuracyMeters < 0 || sample.accuracyMeters > 30
                || (acceptedAt !== null && at <= acceptedAt)) return snapshot();
            const tolerance = Math.max(25, sample.accuracyMeters * 2);
            const elapsed = acceptedAt === null ? 0 : Math.max(0, at - acceptedAt) / 1000;
            // Simulation can run at 200 km/h ×20; real GPS is bounded to 288
            // km/h. At crossings, prefer the earliest plausible forward branch.
            const maxAdvance = Math.max(60, elapsed * (sample.source === 'simulation' ? 1200 : 80) + tolerance);
            const candidates = [];
            const scaleX = scaleY * Math.cos(sample.latLng[0] * Math.PI / 180);
            for (let i = 0; i < lengths.length; i++) {
                if (!lengths[i]) continue;
                const a = points[i], b = points[i + 1];
                const dx = (b[1] - a[1]) * scaleX, dy = (b[0] - a[0]) * scaleY;
                const px = (sample.latLng[1] - a[1]) * scaleX, py = (sample.latLng[0] - a[0]) * scaleY;
                const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
                const distance = Math.hypot(px - t * dx, py - t * dy);
                const meters = cumulative[i] + t * lengths[i];
                if (distance > tolerance || (progress !== null && (meters < progress - tolerance || meters > progress + maxAdvance))) continue;
                candidates.push({ distance, meters });
            }
            if (!candidates.length) return snapshot();
            const closest = Math.min(...candidates.map(p => p.distance));
            const candidate = candidates.filter(p => p.distance <= closest + 5).sort((a, b) => a.meters - b.meters)[0];
            progress = Math.max(progress ?? 0, candidate.meters); acceptedAt = at;
            return snapshot();
        },
        snapshot,
        reset() { progress = null; acceptedAt = null; return snapshot(); },
    };
}
