import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ native: vi.fn(), check: vi.fn(), request: vi.fn(), position: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: mocks.native } }));
vi.mock('@capacitor/geolocation', () => ({ Geolocation: {
    checkPermissions: mocks.check, requestPermissions: mocks.request, getCurrentPosition: mocks.position,
} }));
import { getUserLocation } from '../../src/services/locationPermission.js';

describe('location permission flow', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.native.mockReturnValue(true);
        mocks.position.mockResolvedValue({ coords: { latitude: -12.8, longitude: 45.2 } });
    });
    it('accepts approximate location without asking again or requiring precise GPS', async () => {
        mocks.check.mockResolvedValue({ location: 'denied', coarseLocation: 'granted' });
        await getUserLocation();
        expect(mocks.request).not.toHaveBeenCalled();
        expect(mocks.position).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: false }));
    });
    it('does not acquire a position after a refusal', async () => {
        mocks.check.mockResolvedValue({ location: 'prompt', coarseLocation: 'prompt' });
        mocks.request.mockResolvedValue({ location: 'denied', coarseLocation: 'denied' });
        await expect(getUserLocation()).rejects.toThrow('LOCATION_PERMISSION_DENIED');
        expect(mocks.position).not.toHaveBeenCalled();
    });
    it('accepts approximate access returned by the system prompt', async () => {
        mocks.check.mockResolvedValue({ location: 'prompt' });
        mocks.request.mockResolvedValue({ location: 'denied', coarseLocation: 'granted' });
        await getUserLocation();
        expect(mocks.position).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: false }));
    });
    it('uses already authorized precise access', async () => {
        mocks.check.mockResolvedValue({ location: 'granted' });
        await getUserLocation();
        expect(mocks.request).not.toHaveBeenCalled();
        expect(mocks.position).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: true }));
    });
    it('lets the browser request its own permission', async () => {
        mocks.native.mockReturnValue(false);
        await getUserLocation();
        expect(mocks.check).not.toHaveBeenCalled();
        expect(mocks.request).not.toHaveBeenCalled();
        expect(mocks.position).toHaveBeenCalledOnce();
    });
});
