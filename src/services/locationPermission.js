import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export function hasLocationPermission(permissions) {
    return permissions?.location === 'granted' || permissions?.coarseLocation === 'granted';
}

// Called only after the user accepts the explanation in the map.
export async function getUserLocation() {
    if (Capacitor.isNativePlatform()) {
        let permissions = await Geolocation.checkPermissions();
        if (!hasLocationPermission(permissions)) {
            permissions = await Geolocation.requestPermissions({ permissions: ['location'] });
        }
        if (!hasLocationPermission(permissions)) {
            throw new Error('LOCATION_PERMISSION_DENIED');
        }
        const coordinates = await Geolocation.getCurrentPosition({
            enableHighAccuracy: permissions.location === 'granted',
            timeout: 15000,
            maximumAge: 10000,
        });
        return { ...coordinates, precisePermission: permissions.location === 'granted' };
    }
    return Geolocation.getCurrentPosition({ timeout: 15000, maximumAge: 10000 });
}
