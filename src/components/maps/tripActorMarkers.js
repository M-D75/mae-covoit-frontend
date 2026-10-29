import { mdiWalk } from '@mdi/js';
import { CAR_TOP_VIEW } from './actorMarkerPaths.js';

// Counts people, not seats: the server's accepted booking rows are grouped by
// passenger identity. Independent unconfirmed reservations remain outstanding.
export function summarizeBoarding(bookings = [], userId) {
    const groups = new Map();
    for (const booking of bookings) {
        if (!booking.userId || booking.is_accepted === false || booking.is_refused || booking.passenger_no_show) continue;
        if (!groups.has(booking.userId)) groups.set(booking.userId, []);
        groups.get(booking.userId).push(booking);
    }
    const onboardUsers = [...groups].filter(([, rows]) => rows.every(row => row.in_car === true)).map(([id]) => id);
    return { total: groups.size, onboard: onboardUsers.length, waiting: groups.size - onboardUsers.length,
        hasBooking: groups.has(userId), selfOnboard: onboardUsers.includes(userId) };
}

export function tripActorMarkers({ userId, driverId, bookings = [], positions = [], ownPosition = [], ownHeading = 0, now = Date.now(), ownReceivedAt = now }) {
    const driverView = userId === driverId;
    const actors = new Map(positions.filter(p => p.from !== userId).map(p => [p.from, p]));
    if (ownPosition.length === 2) actors.set(userId, { from: userId, latLng: ownPosition, heading: ownHeading, receivedAt: ownReceivedAt });
    return [...actors.values()].flatMap(p => {
        if (!Array.isArray(p.latLng) || p.latLng.length !== 2 || !p.latLng.every(Number.isFinite) || now - p.receivedAt > 120000) return [];
        const car = p.from === driverId;
        const rows = bookings.filter(b => b.userId === p.from);
        if (!car && (!rows.length || rows.every(b => b.in_car) || (!driverView && p.from !== userId))) return [];
        const stale = now - p.receivedAt > 10000;
        const kind = car ? 'car' : driverView ? 'pedestrian' : 'self';
        return [{ id: p.from, latLng: p.latLng, heading: p.heading || 0, kind, stale,
            label: `${car ? 'Véhicule du trajet' : driverView ? 'Passager à récupérer' : 'Votre position'}${stale ? ' — position ancienne' : ''}` }];
    });
}
// One local SVG/anchor/rotation definition for both SDKs. No remote asset fetch.
// Car: SHMECTOR CC0; pedestrian: mdiWalk Apache-2.0 (docs/licenses).
export function actorMarkerAsset(actor) {
    const bodyColor = /^#[0-9a-f]{6}$/i.test(actor.bodyColor || '') ? actor.bodyColor : '#737373';
    const size = actor.kind === 'car' ? 48 : 44;
    const heading = Number.isFinite(actor.heading) ? ((actor.heading % 360) + 360) % 360 : 0;
    const shape = actor.kind === 'car'
        ? `<g transform="rotate(${heading} 24 24)">${CAR_TOP_VIEW.replaceAll('__CAR_BODY__', bodyColor)}</g>`
        : `<path transform="translate(8 8) scale(1.3)" fill="#fff" d="${mdiWalk}"/>`;
    const backing = actor.kind === 'car' ? '' : '<circle cx="24" cy="24" r="22" fill="#0f766e" stroke="#fff" stroke-width="2"/>';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}" role="img"${actor.stale ? ' opacity="0.55"' : ''}>${backing}${shape}</svg>`;
    return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, size, anchor: size / 2 };
}
