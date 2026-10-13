import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { parse } from '@vue/compiler-sfc';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rememberAuthEntry = vi.fn();
const { descriptor } = parse(readFileSync('src/views/LoginSign.vue', 'utf8'));
const { code } = transformSync(descriptor.script.content, {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', code)(module, module.exports, name => {
    if (name === 'vue') return { inject: () => null };
    if (name === 'vuex') return { mapState: () => ({}), mapMutations: () => ({}) };
    if (name === '@capacitor/core') return { Capacitor: { isNativePlatform: () => false } };
    if (name === '@capacitor/browser' || name === '@capacitor/local-notifications') return {};
    if (name === '@/services/authCallback.js') return { buildAuthCallbackUrl: () => 'https://app.example/auth/callback' };
    if (name === '@/services/authProfile.js') return { resolvePostAuthPath: () => '/account-info' };
    if (name === '@/services/authEntry.js') return { rememberAuthEntry };
    throw new Error(`Unexpected import: ${name}`);
});
const view = module.exports.default;

function context(path = '/sign') {
    const ctx = {
        ...view.data(), overlayLoad: false, email: 'test@example.com', password: 'password123',
        $route: { path, query: { redirect: '/publish' } },
        $router: { push: vi.fn(), replace: vi.fn() },
        $nextTick: vi.fn().mockResolvedValue(undefined),
        $refs: { authForm: { validate: vi.fn().mockResolvedValue({ valid: true }), resetValidation: vi.fn() } },
        supabase: { auth: { signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) } },
    };
    Object.entries(view.methods).forEach(([name, method]) => { ctx[name] = method.bind(ctx); });
    Object.defineProperty(ctx, 'modeLogin', { get: () => view.computed.modeLogin.call(ctx) });
    return ctx;
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('email signup and login form', () => {
    it('clears signup fields and validation together, and keeps email confirmation visible', async () => {
        const ctx = context();
        await ctx.submitEmailAuth();
        expect(ctx.email).toBe('');
        expect(ctx.password).toBe('');
        expect(ctx.$refs.authForm.resetValidation).toHaveBeenCalledOnce();
        expect(ctx.confirmationPending).toBe(true);
        expect(rememberAuthEntry).toHaveBeenCalledOnce();
        expect(ctx.overlayLoad).toBe(false);
        expect(ctx.authSubmitting).toBe(false);
    });

    it('preserves fields on a failed signup and does not remember a successful entry', async () => {
        const ctx = context();
        ctx.supabase.auth.signUp.mockResolvedValue({ error: { message: 'Signup requires a valid password' } });
        await ctx.submitEmailAuth();
        expect(ctx.password).toBe('password123');
        expect(ctx.showSnackbarError).toBe(true);
        expect(ctx.confirmationPending).toBe(false);
        expect(rememberAuthEntry).not.toHaveBeenCalled();
    });

    it('continues to the profile when signup returns an immediate session', async () => {
        const ctx = context();
        ctx.supabase.auth.signUp.mockResolvedValue({ data: { session: { access_token: 'test' } }, error: null });
        ctx.checkSessionIn = vi.fn().mockResolvedValue(undefined);
        await ctx.submitEmailAuth();
        expect(ctx.checkSessionIn).toHaveBeenCalledOnce();
        expect(ctx.confirmationPending).toBe(false);
    });

    it('rejects invalid input before making a request', async () => {
        const ctx = context();
        ctx.$refs.authForm.validate.mockResolvedValue({ valid: false });
        await ctx.submitEmailAuth();
        expect(ctx.supabase.auth.signUp).not.toHaveBeenCalled();
        expect(ctx.authSubmitting).toBe(false);
    });

    it('allows retry after network failure', async () => {
        const ctx = context();
        ctx.supabase.auth.signUp.mockRejectedValueOnce(new Error('Network'));
        await ctx.submitEmailAuth();
        expect(ctx.showSnackbarError).toBe(true);
        expect(ctx.overlayLoad).toBe(false);
        expect(ctx.authSubmitting).toBe(false);
        await ctx.submitEmailAuth();
        expect(ctx.confirmationPending).toBe(true);
    });

    it('ignores duplicate submissions while validation is pending', async () => {
        const ctx = context();
        let complete;
        ctx.$refs.authForm.validate.mockReturnValue(new Promise(resolve => { complete = resolve; }));
        const pending = ctx.submitEmailAuth();
        await ctx.submitEmailAuth();
        expect(ctx.$refs.authForm.validate).toHaveBeenCalledOnce();
        complete({ valid: true });
        await pending;
        expect(ctx.supabase.auth.signUp).toHaveBeenCalledOnce();
    });

    it('preserves the intended destination when switching modes', () => {
        const ctx = context('/login');
        ctx.createOrLoginSwitchMode();
        expect(ctx.$router.push).toHaveBeenCalledWith({ path: '/sign', query: { redirect: '/publish' } });
        expect(ctx.password).toBe('');
        ctx.$route.path = '/sign';
        expect(ctx.modeLogin).toBe(false);
    });

    it('returns from password recovery to login and clears the stale password', () => {
        const ctx = context('/login');
        ctx.passwordForgetMode = true;
        ctx.createOrLoginSwitchMode();
        expect(ctx.$router.push).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/publish' } });
        expect(ctx.passwordForgetMode).toBe(false);
        expect(ctx.password).toBe('');
    });
});
