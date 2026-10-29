import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { describe, it, expect, vi } from 'vitest';
const module = { exports: {} };
const { code } = transformSync(readFileSync('src/services/nativeTripTracking.js', 'utf8'), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] });
new Function('module','exports','require',code)(module,module.exports,id => id === '@capacitor/core' ? { registerPlugin: () => ({}) } : {});
const { createNativeTripTracking } = module.exports;
function fixture() {
    const callbacks = {};
    const session = { token: 'secret-fixture', tripId: 1, userId: 'driver', expiresAt: 99999999 };
    const bridge = { stop: vi.fn().mockResolvedValue(), start: vi.fn().mockResolvedValue(), getStatus: vi.fn().mockResolvedValue({ active: true, tripId: 1, userId: 'driver' }), addListener: vi.fn(async (event, cb) => { callbacks[event] = cb; }) };
    const request = vi.fn().mockResolvedValue({ data: { data: session } }), revoke = vi.fn().mockResolvedValue();
    const dependencies = { bridge, request, revoke, isNative: () => true, baseUrl: () => 'https://dev.example' };
    return { dependencies, bridge, request, revoke, callbacks, session, options: { tripId: 1, userId: 'driver', simulation: false } };
}
describe('native tracking lifecycle', () => {
    it('passes scoped credential only to native code and never to observed state', async () => {
        const h = fixture(), service = createNativeTripTracking(h.dependencies), observer = vi.fn(); service.observe(observer);
        expect(await service.start(h.options)).toBe(true);
        expect(h.bridge.start).toHaveBeenCalledWith({ ...h.session, endpoint: 'https://dev.example/native-tracking/position' });
        expect(JSON.stringify(observer.mock.calls)).not.toContain(h.session.token);
        await service.stop(); expect(service.status().active).toBe(false);
    });
    it('refuses web, simulation and insecure servers before any session request', async () => {
        for (const override of [{ isNative: () => false }, { baseUrl: () => 'http://localhost:3001' }, {}]) {
            const h = fixture(), service = createNativeTripTracking({ ...h.dependencies, ...override });
            await expect(service.start({ ...h.options, simulation: !Object.keys(override).length })).rejects.toThrow();
            expect(h.request).not.toHaveBeenCalled();
        }
    });
    it('revokes a late session response after stop and never starts GPS', async () => {
        const h = fixture(); let resolve; h.request.mockImplementation(() => new Promise(r => { resolve = r; }));
        const service = createNativeTripTracking(h.dependencies), pending = service.start(h.options);
        await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
        await service.stop(); resolve({ data: { data: h.session } });
        expect(await pending).toBe(false); expect(h.bridge.start).not.toHaveBeenCalled(); expect(h.revoke).toHaveBeenCalled();
    });
    it('rejects another owner and stops a restored session from another trip', async () => {
        const h = fixture(), service = createNativeTripTracking(h.dependencies);
        expect(await service.start({ ...h.options, userId: 'other' })).toBe(false);
        expect(h.revoke).toHaveBeenCalled(); expect(h.bridge.start).not.toHaveBeenCalled();
        await service.restore('driver', 2); expect(service.status().active).toBe(false);
    });
    it('clears old fixes when the service stops or loses network', async () => {
        const h = fixture(), service = createNativeTripTracking(h.dependencies); await service.start(h.options);
        h.callbacks.position({ latLng: [-12.8, 45.1] }); expect(service.status().position).toBeTruthy();
        h.callbacks.status({ active: false, reason: 'server_ended' }); expect(service.status().position).toBeNull(); expect(service.status().active).toBe(false);
    });
});
