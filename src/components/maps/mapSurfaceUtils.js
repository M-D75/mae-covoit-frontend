export function toCoordinateArray(value) {
    const nestedLatLng = value?.location?.latLng;
    const candidate = nestedLatLng?.latLngTab
        || nestedLatLng
        || value?.latLng
        || value?.coordinates
        || value;

    if (Array.isArray(candidate) && candidate.length >= 2) {
        const latitude = Number(candidate[0]);
        const longitude = Number(candidate[1]);
        return Number.isFinite(latitude) && Number.isFinite(longitude)
            ? [latitude, longitude]
            : null;
    }

    const latitude = Number(candidate?.lat ?? candidate?.latitude);
    const longitude = Number(candidate?.lng ?? candidate?.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
        ? [latitude, longitude]
        : null;
}

export function toGoogleCoordinate(value) {
    const coordinate = toCoordinateArray(value);
    return coordinate ? { lat: coordinate[0], lng: coordinate[1] } : null;
}

export function pointLabel(point) {
    const village = point?.infos?.village || '';
    const commune = point?.infos?.commune || '';

    if (village && commune && village !== commune) {
        return `${village}, (${commune})`;
    }
    return village || commune;
}

export function alertDefinition(alert, alertTypes) {
    const fallback = {
        label: 'Alerte',
        color: '#ff9800',
        icon: 'mdi-alert',
        abbr: '!',
    };
    const definition = alertTypes.find((item) => item.value === alert?.type) || fallback;
    const color = /^#[0-9a-f]{3,8}$/i.test(definition.color || '')
        ? definition.color
        : fallback.color;
    const icon = /^mdi-[a-z0-9-]+$/i.test(definition.icon || '')
        ? definition.icon
        : fallback.icon;

    return {
        ...fallback,
        ...definition,
        color,
        icon,
        abbr: String(definition.abbr || definition.label || '!').slice(0, 1).toUpperCase(),
    };
}

export function formatAlertTime(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return '--:--';
    }
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function displayedRoutes(routes) {
    return routes
        .map((route, originalIndex) => ({ route, originalIndex }))
        .reverse()
        .map((item, displayIndex) => ({ ...item, displayIndex }));
}
