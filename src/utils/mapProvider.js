export const MAP_PROVIDER_STORAGE_KEY = 'mae-map-provider';

const SUPPORTED_MAP_PROVIDERS = new Set(['leaflet', 'google']);

export function normalizeMapProvider(provider) {
    const normalized = String(provider || '').trim().toLowerCase();
    return SUPPORTED_MAP_PROVIDERS.has(normalized) ? normalized : null;
}

export function getMapProvider(explicitProvider) {
    const explicit = normalizeMapProvider(explicitProvider);
    if (explicit) {
        return explicit;
    }

    const stored = typeof window !== 'undefined'
        ? normalizeMapProvider(window.localStorage.getItem(MAP_PROVIDER_STORAGE_KEY))
        : null;

    return stored || normalizeMapProvider(process.env.VUE_APP_MAP_PROVIDER) || 'leaflet';
}

// Ce choix concerne uniquement l'affichage. Les itinéraires viennent toujours de
// Google Routes, y compris lorsque Leaflet dessine la carte.
export function getEffectiveMapProvider(explicitProvider) {
    const requested = getMapProvider(explicitProvider);
    if (requested === 'google' && !process.env.VUE_APP_API_VUE_GOOGLE_MAP) {
        return 'leaflet';
    }
    return requested;
}

// Permet à un futur écran de réglages de changer de moteur sans connaître les composants.
export function setMapProvider(provider) {
    const normalized = normalizeMapProvider(provider);
    if (!normalized) {
        throw new Error(`Moteur de carte inconnu : ${provider}`);
    }

    if (typeof window !== 'undefined') {
        window.localStorage.setItem(MAP_PROVIDER_STORAGE_KEY, normalized);
        window.dispatchEvent(new CustomEvent('mae-map-provider-changed', {
            detail: normalized,
        }));
    }

    return normalized;
}
