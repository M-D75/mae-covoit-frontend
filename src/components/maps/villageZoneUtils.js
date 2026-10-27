export const VILLAGE_ZONE_STYLES = {
    origin: { color: '#15803d', fillOpacity: 0.12 },
    destination: { color: '#c2410c', fillOpacity: 0.12 },
    intermediate: { color: '#6d28d9', fillOpacity: 0.08 },
};

export function villageIdForPoint(point, explicitId, villages = []) {
    const candidate = explicitId ?? point?.infos?.villageId;
    if (candidate !== undefined && candidate !== null && candidate !== '') {
        const id = Number(candidate);
        return Number.isSafeInteger(id) && id > 0 ? id : null;
    }
    const name = point?.infos?.village;
    const commune = point?.infos?.commune;
    if (!name || !commune) return null;
    const normalize = text => String(text).trim().toLocaleLowerCase('fr');
    const matches = villages.filter(row => normalize(row.village) === normalize(name)
        && normalize(row.commune) === normalize(commune));
    return matches.length === 1 ? Number(matches[0].id) : null;
}

export function isVillageGeometry(geometry) {
    const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates]
        : geometry?.type === 'MultiPolygon' ? geometry.coordinates : null;
    return Array.isArray(polygons) && polygons.length > 0 && polygons.every(polygon =>
        Array.isArray(polygon) && polygon.length > 0 && polygon.every(ring =>
            Array.isArray(ring) && ring.length >= 4 && ring.every(point =>
                Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0])
                && Number.isFinite(point[1]) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90)
            && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]));
}

const polygonPathCache = new WeakMap();

export function villageZonePolygons(zones) {
    return zones.flatMap(zone => {
        if (!zone.boundary || !isVillageGeometry(zone.boundary.geometry)) return [];
        const geometry = zone.boundary.geometry;
        let paths = polygonPathCache.get(geometry);
        if (!paths) {
            const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
            paths = polygons.map(rings => {
                const oriented = rings.map((ring, ringIndex) => {
                    const area = ring.slice(1).reduce((sum, point, i) => sum + ring[i][0] * point[1] - point[0] * ring[i][1], 0);
                    return (area > 0) === (ringIndex === 0) ? ring : [...ring].reverse();
                });
                return { leafletPaths: oriented.map(ring => ring.map(([lon, lat]) => [lat, lon])),
                    googlePaths: oriented.map(ring => ring.map(([lon, lat]) => ({ lat, lng: lon }))) };
            });
            polygonPathCache.set(geometry, paths);
        }
        const base = VILLAGE_ZONE_STYLES[zone.role] || VILLAGE_ZONE_STYLES.intermediate;
        const visited = zone.phase === 'visited', active = zone.phase === 'active';
        return paths.map((path, index) => ({ ...path, key: `${zone.key || zone.role}-${index}`, role: zone.role,
            color: base.color, fillOpacity: visited ? 0.025 : active ? 0.20 : base.fillOpacity,
            strokeOpacity: visited ? 0.25 : active ? 1 : 0.65, weight: visited ? 1 : active ? 3 : 2 }));
    });
}

export function villageZoneLabel(boundary, fallback) {
    const name = boundary?.village || fallback;
    const parent = boundary?.source?.source_properties?.libelle;
    return boundary?.resolution === 'reference' && parent ? `${name} · zone de ${parent}` : name;
}
