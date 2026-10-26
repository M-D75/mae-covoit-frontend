import { describe, expect, it, vi } from 'vitest';
vi.mock('@/utils/supabaseClient.js', () => ({ default: {} }));
import { createVillageBoundaryLoader } from '@/services/villageBoundaryService.js';
import { isVillageGeometry, villageIdForPoint, villageZoneLabel, villageZonePolygons } from '@/components/maps/villageZoneUtils.js';

const outer = [[45, -13], [46, -13], [46, -12], [45, -12], [45, -13]];
const hole = [[45.2, -12.8], [45.4, -12.8], [45.4, -12.6], [45.2, -12.8]];
const geometry = { type: 'MultiPolygon', coordinates: [[outer, hole], [outer]] };
const row = id => ({ village_id: id, boundary_village_id: id, geometry, resolution: 'direct', village: 'Village' });
function clientFor(response) {
    const filter = vi.fn(response);
    const select = vi.fn(() => ({ in: filter }));
    return { rpc: vi.fn(() => ({ select })), filter };
}

describe('village geographic references', () => {
    it('uses stable IDs, and never resolves homonyms by name alone', () => {
        const villages = [{ id: 51, village: 'Miréréni', commune: 'Tsingoni' }, { id: 52, village: 'Miréréni', commune: 'Chirongui' }];
        expect(villageIdForPoint({ infos: { village: 'Miréréni' } }, null, villages)).toBeNull();
        expect(villageIdForPoint({ infos: villages[1] }, null, villages)).toBe(52);
        expect(villageIdForPoint({ infos: villages[0] }, 52, villages)).toBe(52);
        expect(villageIdForPoint({ infos: { villageId: 18 } })).toBe(18);
    });
    it('keeps multipart geometry and holes consistent on both engines without moving vertices', () => {
        const original = JSON.stringify(geometry);
        const polygons = villageZonePolygons([{ role: 'origin', boundary: row(1) }]);
        expect(polygons).toHaveLength(2);
        expect(polygons[0].googlePaths).toHaveLength(2);
        for (const polygon of polygons) expect(polygon.googlePaths.map(ring => ring.map(p => [p.lat, p.lng]))).toEqual(polygon.leafletPaths);
        expect(polygons[0].leafletPaths[0]).toContainEqual([-13, 45]);
        expect(JSON.stringify(geometry)).toBe(original);
        expect(isVillageGeometry({ type: 'MultiPolygon', coordinates: [[[outer[0]]]] })).toBe(false);
    });
    it('labels geographic parents explicitly without requiring arrival validation', () => {
        const boundary = { ...row(18), village: 'Doujani', resolution: 'reference', arrival_use_validated: false,
            boundary_village_id: 43, source: { source_properties: { libelle: 'Mtsapéré' } } };
        expect(villageZoneLabel(boundary, '')).toBe('Doujani · zone de Mtsapéré');
        expect(villageZonePolygons([{ role: 'destination', boundary }])).toHaveLength(2);
    });
});

describe('shared Supabase boundary cache', () => {
    it('fetches only chosen IDs, deduplicates concurrent requests and reuses cache across maps', async () => {
        let finish;
        const client = clientFor(() => new Promise(resolve => { finish = resolve; }));
        const load = createVillageBoundaryLoader(client);
        const first = load([15, 51, 15]);
        const second = load([51]);
        await Promise.resolve();
        expect(client.rpc).toHaveBeenCalledOnce();
        expect(client.rpc).toHaveBeenCalledWith('get_village_effective_boundaries', {}, { get: true });
        expect(client.filter).toHaveBeenCalledWith('village_id', [15, 51]);
        finish({ data: [row(15), row(51)], error: null });
        await first; await second; await load([15]);
        expect(client.rpc).toHaveBeenCalledOnce();
    });
    it('retries failures instead of caching them, and supports an explicit refresh', async () => {
        const client = clientFor(vi.fn().mockResolvedValueOnce({ error: new Error('offline') })
            .mockResolvedValue({ data: [row(15)], error: null }));
        const load = createVillageBoundaryLoader(client);
        await expect(load([15])).rejects.toThrow('offline');
        expect((await load([15]))[15]).toMatchObject({ village_id: 15 });
        await load([15], { refresh: true });
        expect(client.rpc).toHaveBeenCalledTimes(3);
    });
    it('expires missing/invalid geometry quickly, without inventing a polygon', async () => {
        let now = 0;
        const client = clientFor(async () => ({ data: [{ ...row(15), geometry: { type: 'Point', coordinates: [45, -13] } }], error: null }));
        const load = createVillageBoundaryLoader(client, () => now);
        expect((await load([15]))[15]).toBeNull();
        await load([15]); expect(client.rpc).toHaveBeenCalledOnce();
        now = 60001; await load([15]); expect(client.rpc).toHaveBeenCalledTimes(2);
    });
});
