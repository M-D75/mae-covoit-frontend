export const SIMULATION_SPEEDS = [0, 5, 25, 50, 100, 200];
const radians = value => value * Math.PI / 180;
export function distanceMeters(a, b) {
    const dLat = radians(b[0] - a[0]), dLng = radians(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)));
}
export function movementHeading(a, b) {
    if (!a || distanceMeters(a, b) < 0.2) return null;
    const delta = radians(b[1] - a[1]);
    return (Math.atan2(Math.sin(delta) * Math.cos(radians(b[0])),
        Math.cos(radians(a[0])) * Math.sin(radians(b[0])) - Math.sin(radians(a[0])) * Math.cos(radians(b[0])) * Math.cos(delta)) * 180 / Math.PI + 360) % 360;
}
export function normalizeTripPosition(position, previous, previousHeading = 0) {
    const { latitude, longitude, heading } = position?.coords || {};
    if (![latitude, longitude].every(Number.isFinite) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    const latLng = [latitude, longitude];
    return { latLng, accuracyMeters: Number.isFinite(position.coords.accuracy) && position.coords.accuracy >= 0 ? position.coords.accuracy : null, heading: Number.isFinite(heading) && heading >= 0 ? heading % 360 : movementHeading(previous, latLng) ?? previousHeading,
        speedKmh: Number.isFinite(position.coords.speed) && position.coords.speed >= 0 ? position.coords.speed * 3.6 : null,
        timestamp: Number.isFinite(position.timestamp) ? position.timestamp : Date.now(), source: position.source === 'simulation' ? 'simulation' : 'gps' };
}
export function createTripSimulation(path, onPosition, now = Date.now) {
    const points = path.filter(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)).map(p => [...p]);
    if (points.length < 2) throw new Error('Un itinéraire déjà calculé est nécessaire.');
    const segments = points.slice(1).map((p, i) => distanceMeters(points[i], p));
    const total = segments.reduce((a, b) => a + b, 0);
    if (total < 1) throw new Error('L’itinéraire est trop court.');
    const state = { running: false, meters: 0, speed: 25, acceleration: 1, gpsAvailable: true };
    let last = now();
    function at(meters) {
        let rest = Math.max(0, Math.min(total, meters));
        for (let i = 0; i < segments.length; i++) {
            if (rest <= segments[i] || i === segments.length - 1) {
                const ratio = segments[i] ? rest / segments[i] : 0;
                return { latLng: points[i].map((v, axis) => v + (points[i + 1][axis] - v) * ratio), heading: movementHeading(points[i], points[i + 1]) || 0 };
            }
            rest -= segments[i];
        }
    }
    function emit(point = at(state.meters)) {
        if (state.gpsAvailable) onPosition({ coords: { latitude: point.latLng[0], longitude: point.latLng[1], heading: point.heading,
            speed: state.speed / 3.6, accuracy: 5 }, timestamp: now(), source: 'simulation' });
    }
    return { state, total, start() { state.running = true; last = now(); emit(); },
        pause() { state.running = false; }, reset() { state.running = false; state.meters = 0; last = now(); emit(); },
        tick() { const time = now(); if (!state.running) { last = time; return; }
            state.meters = Math.min(total, state.meters + Math.max(0, time - last) / 1000 * state.speed / 3.6 * state.acceleration);
            last = time; emit(); if (state.meters >= total) state.running = false; },
        seek(fraction) { state.meters = Math.max(0, Math.min(1, Number(fraction) || 0)) * total; emit(); },
        place(latLng) { if (!Array.isArray(latLng) || !latLng.every(Number.isFinite) || Math.abs(latLng[0]) > 90 || Math.abs(latLng[1]) > 180) throw new Error('Position invalide.');
            let nearest = 0, best = Infinity, meters = 0;
            points.forEach((p, i) => { const d = distanceMeters(p, latLng); if (d < best) { best = d; nearest = meters; } meters += segments[i] || 0; });
            state.meters = nearest; emit({ latLng, heading: at(nearest).heading }); },
    };
}
