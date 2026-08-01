import polyline from '@mapbox/polyline';
import { toCoordinateArray } from '@/components/maps/mapSurfaceUtils.js';

export class RoutingError extends Error {
    constructor(code, message, { provider, status } = {}) {
        super(message);
        this.name = 'RoutingError';
        this.code = code;
        this.provider = provider;
        this.status = status;
    }
}

export function formatRouteDuration(seconds) {
    const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const paddedMinutes = minutes < 10 ? `0${minutes}` : String(minutes);
    return hours > 0 ? `${hours} h ${paddedMinutes} min` : `${paddedMinutes} min`;
}

function durationInSeconds(value) {
    if (typeof value === 'string') {
        return Number(value.replace(/s$/i, ''));
    }
    return Number(value);
}

function normalizeRoute(route, index, provider, decodedPolyline) {
    const seconds = durationInSeconds(route.duration);
    const distanceMeters = Number(route.distanceMeters ?? route.distance);

    if (!Number.isFinite(seconds) || !Number.isFinite(distanceMeters) || !decodedPolyline.length) {
        throw new RoutingError(
            'INVALID_ROUTE_RESPONSE',
            `Le moteur ${provider} a renvoyé un itinéraire incomplet.`,
            { provider },
        );
    }

    const compatibleInfos = {
        ...(provider === 'google' ? route : {}),
        duration: `${Math.round(seconds)}s`,
        distanceMeters: Math.round(distanceMeters),
    };

    return {
        id: String(index),
        polylineDecoded: decodedPolyline,
        // Nom historique conservé car le suivi utilise ces deux propriétés.
        infosGoogle: compatibleInfos,
        duration: formatRouteDuration(seconds),
        distance: (distanceMeters / 1000).toFixed(2),
        faster: index === 0,
        current: index === 0,
        routingProvider: provider,
    };
}

function googleRequestBody(origin, destination, { alternatives, departureTime }) {
    const body = {
        origin: {
            location: {
                latLng: { latitude: origin[0], longitude: origin[1] },
            },
        },
        destination: {
            location: {
                latLng: { latitude: destination[0], longitude: destination[1] },
            },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: alternatives,
        routeModifiers: {
            avoidTolls: true,
            avoidHighways: true,
            avoidFerries: true,
        },
        languageCode: 'fr-FR',
        units: 'METRIC',
    };

    if (departureTime) {
        body.departureTime = departureTime;
    }
    return body;
}

async function responseJson(response, provider) {
    let payload;
    try {
        payload = await response.json();
    }
    catch (_error) {
        throw new RoutingError(
            'INVALID_ROUTE_RESPONSE',
            `Réponse illisible du moteur ${provider}.`,
            { provider, status: response.status },
        );
    }

    if (!response.ok) {
        const providerMessage = payload?.error?.message || payload?.message;
        throw new RoutingError(
            'ROUTING_REQUEST_FAILED',
            providerMessage || `Le moteur ${provider} a refusé le calcul.`,
            { provider, status: response.status },
        );
    }
    return payload;
}

async function calculateGoogleRoutes(origin, destination, options) {
    const apiKey = process.env.VUE_APP_API_GOOGLE_ROUTE_API_KEY;
    if (!apiKey) {
        throw new RoutingError(
            'GOOGLE_ROUTES_KEY_MISSING',
            "La clé Google Routes n'est pas configurée.",
            { provider: 'google' },
        );
    }

    // `window.fetch` est une Web API qui exige le bon contexte dans certains
    // navigateurs. Appeler `options.fetchImpl(...)` lui donnerait `options` comme
    // `this` et Chrome lèverait alors "Illegal invocation".
    const response = await options.fetchImpl.call(
        window,
        'https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
            },
            body: JSON.stringify(googleRequestBody(origin, destination, options)),
            signal: options.signal,
        },
    );
    const payload = await responseJson(response, 'google');
    const routes = Array.isArray(payload.routes) ? payload.routes : [];

    return routes.map((route, index) => {
        const encodedPolyline = route?.polyline?.encodedPolyline;
        const decoded = encodedPolyline ? polyline.decode(encodedPolyline) : [];
        return normalizeRoute(route, index, 'google', decoded);
    });
}

/**
 * Calcule les itinéraires avec Google Routes, quel que soit le moteur d'affichage.
 * Exemple : une géométrie Google peut être rendue aussi bien par Leaflet que Google Maps.
 */
export async function calculateRoutes({
    origin,
    destination,
    departureTime,
    alternatives = true,
    signal,
    fetchImpl = fetch,
}) {
    const normalizedOrigin = toCoordinateArray(origin);
    const normalizedDestination = toCoordinateArray(destination);
    if (!normalizedOrigin || !normalizedDestination) {
        throw new RoutingError(
            'INVALID_COORDINATES',
            "Les coordonnées de départ ou d'arrivée sont invalides.",
        );
    }
    if (typeof fetchImpl !== 'function') {
        throw new RoutingError('FETCH_UNAVAILABLE', "Le calcul d'itinéraire est indisponible.");
    }

    const options = { alternatives, departureTime, signal, fetchImpl };
    const routes = await calculateGoogleRoutes(
        normalizedOrigin,
        normalizedDestination,
        options,
    );

    if (!routes.length) {
        throw new RoutingError(
            'NO_ROUTE_FOUND',
            "Aucun itinéraire n'a été trouvé.",
            { provider: 'google' },
        );
    }
    return routes;
}
