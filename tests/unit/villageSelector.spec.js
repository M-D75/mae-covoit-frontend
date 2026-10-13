import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { parse } from '@vue/compiler-sfc';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const app = { addListener: vi.fn() };
const { descriptor } = parse(readFileSync('src/components/menus/PaneGetValue.vue', 'utf8'));
const { code } = transformSync(descriptor.script.content, {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', code)(module, module.exports, name => {
    if (name === 'vue') return { defineComponent: component => component };
    if (name === 'vuex') return Object.fromEntries(['mapState', 'mapGetters', 'mapActions', 'mapMutations'].map(key => [key, () => ({})]));
    if (name === '@capacitor/core') return { Capacitor: { getPlatform: () => 'android' } };
    if (name === '@capacitor/app') return { App: app };
    return {};
});
const component = module.exports.default;
function selector() {
    const value = { ...component.data(), openP: true, villages: [], getVillages: vi.fn(), $emit: vi.fn() };
    for (const [key, method] of Object.entries(component.methods)) value[key] = method.bind(value);
    return value;
}
describe('village selector', () => {
    beforeEach(() => vi.resetAllMocks());
    it('keeps an exact village match selectable and excludes the opposite endpoint', () => {
        const value = { saisi: 'Sada', villages: [{ village: 'Sada' }, { village: 'Mamoudzou' }], depart: '', destination: 'Mamoudzou', matchValue: component.methods.matchValue };
        expect(component.computed.villagesSortedFiltered.call(value)).toEqual(['Sada']);
    });
    it('loads villages and recovers after a failed attempt', async () => {
        const value = selector();
        value.getVillages.mockResolvedValueOnce(false).mockImplementationOnce(async () => {
            value.villages = [{ village: 'Sada' }];
            return true;
        });
        await value.loadVillages();
        expect(value.villagesError).toBe(true);
        expect(value.villagesLoading).toBe(false);
        await value.loadVillages();
        expect(value.villagesError).toBe(false);
    });
    it('closes the panel on Android back', async () => {
        const value = selector();
        app.addListener.mockResolvedValue({ remove: vi.fn() });
        await value.listenForBack();
        app.addListener.mock.calls[0][1]();
        expect(value.$emit).toHaveBeenCalledWith('close');
    });
    it('removes a back listener that finishes registering after the panel closes', async () => {
        const value = selector();
        let resolve;
        const remove = vi.fn();
        app.addListener.mockReturnValue(new Promise(done => { resolve = done; }));
        const pending = value.listenForBack();
        value.removeBackListener();
        resolve({ remove });
        await pending;
        expect(remove).toHaveBeenCalledOnce();
        expect(value.backListener).toBeNull();
    });
});
