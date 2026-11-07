export const PUBLICATION_ROUTE_ERROR = 'Calculez puis sélectionnez un itinéraire valide avant de continuer.';
export function isPublishableRoute(route) {
    if(!route || Array.isArray(route)) return false;
    const duration = route.infosGoogle?.duration;
    if(typeof duration !== 'string' || !/^\d+(?:\.\d+)?s$/.test(duration)
        || !Number.isFinite(Number.parseFloat(duration)) || Number.parseFloat(duration) <= 0) return false;
    return Array.isArray(route.polylineDecoded) && route.polylineDecoded.length >= 2
        && route.polylineDecoded.every(point => Array.isArray(point) && point.length === 2
            && typeof point[0] === 'number' && Number.isFinite(point[0]) && Math.abs(point[0]) <= 90
            && typeof point[1] === 'number' && Number.isFinite(point[1]) && Math.abs(point[1]) <= 180);
}
