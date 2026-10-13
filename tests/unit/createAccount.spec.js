import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { parse } from '@vue/compiler-sfc';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePostAuthPath } from '@/services/authProfile.js';

function loadOptions(source, dependencies) {
    const { code } = transformSync(source, {
        babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
    });
    const module = { exports: {} };
    new Function('module', 'exports', 'require', code)(module, module.exports, name => {
        if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
        return dependencies[name];
    });
    return module.exports.default;
}

const getUser = vi.fn();
const serverRequest = vi.fn();
const auth = loadOptions(readFileSync('src/store/auth.js', 'utf8'), {
    '../router': {}, '../store': {},
    '@/utils/supabaseClient.js': { auth: { getUser } },
    '@/utils/serverApi.js': { serverRequest },
});
const { descriptor } = parse(readFileSync('src/views/CreateAccount.vue', 'utf8'));
const view = loadOptions(descriptor.script.content, {
    vuex: { mapActions: () => ({}), mapState: () => ({}) },
    '@/services/authProfile.js': { resolvePostAuthPath },
});

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
});

function context() {
    const state = { ...auth.state };
    const rootState = { profil: { modeCo: 'local' } };
    const commit = vi.fn((name, value) => auth.mutations[name](state, value));
    return { state, rootState, commit };
}

describe('profile creation action', () => {
    const info = { name: "D'Angelo", firstname: 'Anne-Marie', village: '' };

    it('returns a handled error for a missing or expired session', async () => {
        getUser.mockResolvedValue({ data: null, error: new Error('Expired') });
        expect((await auth.actions.createAccount(context(), info)).status).toBe(1);
        expect(serverRequest).not.toHaveBeenCalled();
    });

    it('handles a rejected authentication request', async () => {
        getUser.mockRejectedValue(new Error('Network'));
        expect((await auth.actions.createAccount(context(), info)).status).toBe(2);
        expect(serverRequest).not.toHaveBeenCalled();
    });

    it('does not mark a failed profile creation as completed', async () => {
        serverRequest.mockRejectedValue({ response: { status: 500, data: { message: 'Profile failed' } } });
        const ctx = context();
        expect(await auth.actions.createAccount(ctx, info)).toEqual({ status: 500, message: 'Profile failed' });
        expect(ctx.state.account_created).toBe(false);
        expect(serverRequest).toHaveBeenCalledTimes(1);
    });

    it('keeps a created profile successful when Stripe initialization fails', async () => {
        serverRequest.mockResolvedValueOnce({ data: { account: { id: 42 }, replayed: true } });
        serverRequest.mockRejectedValueOnce(new Error('Stripe unavailable'));
        const ctx = context();
        expect((await auth.actions.createAccount(ctx, info)).status).toBe(0);
        expect(ctx.state.account_created).toBe(true);
        expect(ctx.rootState.profil.userId).toBe(42);
        expect(serverRequest).toHaveBeenNthCalledWith(1, 'post', '/account/profile', {
            mode: 'local', data: { lastname: info.name, firstname: info.firstname, village: '' },
        });
    });
});

function viewContext() {
    return {
        ...view.data(), name: " D'Angelo ", firstname: ' Anne-Marie ',
        createAccount: vi.fn().mockResolvedValue({ status: 0 }), account_created: true,
        $router: { replace: vi.fn().mockResolvedValue(undefined) },
        $route: { query: { redirect: '/publish' } },
    };
}

describe('profile completion form', () => {
    it('rejects blank or overlong names before requesting account creation', async () => {
        for (const name of ['   ', 'a'.repeat(101)]) {
            const ctx = { ...viewContext(), name };
            await view.methods.tryCreateAccount.call(ctx);
            expect(ctx.createAccount).not.toHaveBeenCalled();
            expect(ctx.showSnakBarInfo.showError).toBe(true);
        }
    });

    it('ignores double submission and preserves apostrophes and hyphens', async () => {
        const ctx = viewContext();
        let finish;
        ctx.createAccount.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
        const pending = view.methods.tryCreateAccount.call(ctx);
        await view.methods.tryCreateAccount.call(ctx);
        expect(ctx.submitting).toBe(true);
        expect(ctx.createAccount).toHaveBeenCalledTimes(1);
        expect(ctx.createAccount).toHaveBeenCalledWith({ name: "D'Angelo", firstname: 'Anne-Marie', village: '' });
        finish({ status: 0 });
        await pending;
        expect(ctx.submitting).toBe(false);
        expect(ctx.$router.replace).toHaveBeenCalledWith('/publish');
    });

    it('allows retry after an unexpected rejection', async () => {
        const ctx = viewContext();
        ctx.createAccount.mockRejectedValueOnce(new Error('Network'));
        await view.methods.tryCreateAccount.call(ctx);
        expect(ctx.submitting).toBe(false);
        expect(ctx.showSnakBarInfo.showError).toBe(true);
        await view.methods.tryCreateAccount.call(ctx);
        expect(ctx.$router.replace).toHaveBeenCalledWith('/publish');
    });

    it('displays a server failure without navigating', async () => {
        const ctx = viewContext();
        ctx.createAccount.mockResolvedValue({ status: 500, message: 'Profile failed' });
        await view.methods.tryCreateAccount.call(ctx);
        expect(ctx.showSnakBarInfo.messageError).toBe('Profile failed');
        expect(ctx.submitting).toBe(false);
        expect(ctx.$router.replace).not.toHaveBeenCalled();
    });

    it.each(['false', 'rejection'])('opens the form when village loading fails (%s)', async failure => {
        const ctx = viewContext();
        ctx.getVillages = failure === 'false'
            ? vi.fn().mockResolvedValue(false)
            : vi.fn().mockRejectedValue(new Error('Network'));
        await view.mounted.call(ctx);
        expect(ctx.dialog).toBe(true);
        expect(ctx.overlayLoad).toBe(false);
        expect(ctx.showSnakBarInfo.showError).toBe(true);
    });
});
