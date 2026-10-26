import supabase from '@/utils/supabaseClient.js';
import { isVillageGeometry } from '@/components/maps/villageZoneUtils.js';

// Cache only public geographic references. A failed request is never cached.
export function createVillageBoundaryLoader(client, now = () => Date.now()) {
    const cache = new Map();
    const pending = new Map();
    return async function loadVillageBoundaries(ids, { refresh = false } = {}) {
        const requested = [...new Set(ids.filter(id => Number.isSafeInteger(id) && id > 0))];
        const missing = [];
        const waits = requested.map(id => {
            const cached = cache.get(id);
            if (!refresh && cached && cached.expires > now()) return Promise.resolve(cached.value);
            if (pending.has(id)) return pending.get(id).promise;
            let resolve, reject;
            const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
            pending.set(id, { promise, resolve, reject });
            missing.push(id);
            return promise;
        });
        if (missing.length) {
            // Fetch only selected places; the database resolves direct/parent contours.
            Promise.resolve().then(async () => {
                try {
                    const { data, error } = await client
                        .rpc('get_village_effective_boundaries', {}, { get: true })
                        .select('village_id,boundary_village_id,village,commune,resolution,geometry,source')
                        .in('village_id', missing);
                    if (error) throw error;
                    if (!Array.isArray(data)) throw new Error('Invalid village boundary response');
                    for (const id of missing) {
                        const row = data.find(item => Number(item.village_id) === id);
                        const value = row && isVillageGeometry(row.geometry) ? row : null;
                        cache.set(id, { value, expires: now() + (value ? 600000 : 60000) });
                        pending.get(id).resolve(value);
                    }
                }
                catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                        const code = /^[A-Z0-9_]+$/.test(error?.code || '') ? error.code
                            : String(error?.message).includes('Failed to fetch') ? 'NETWORK_REQUEST_FAILED'
                                : error instanceof TypeError ? 'CLIENT_TYPE_ERROR' : 'REQUEST_FAILED';
                        // No raw response, URL, credentials or session data in diagnostics.
                        console.warn('Village boundary load failed:', code);
                    }
                    missing.forEach(id => pending.get(id).reject(error));
                }
                finally { missing.forEach(id => pending.delete(id)); }
            });
        }
        const values = await Promise.all(waits);
        return Object.fromEntries(requested.map((id, index) => [id, values[index]]));
    };
}

export const loadVillageBoundaries = createVillageBoundaryLoader(supabase);
