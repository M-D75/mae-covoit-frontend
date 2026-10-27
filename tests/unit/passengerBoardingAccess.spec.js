import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { parse, compileTemplate } from '@vue/compiler-sfc';
import * as Vue from 'vue';
import { describe, it, expect, vi } from 'vitest';
import * as boarding from '@/components/trip/boardingUtils.js';
const request = vi.fn();
const DEPARTURE = '2026-10-26T18:15:00Z';
const NOW = Date.parse(DEPARTURE);
const access = (rows, id, uid) => boarding.passengerBoardingAccess(rows, id, uid, DEPARTURE, NOW);
const row = (id, extra = {}) => ({ id, trip_id: 344, passenger_account_id: 3, is_accepted: true, account: { user_id: 'passenger' }, ...extra });
function load(name, template = false) {
    const { descriptor } = parse(readFileSync(`src/components/${name}.vue`, 'utf8'));
    const cjs = source => transformSync(source, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
    const module = { exports: {} };
    const resolve = name => name === 'vue' ? Vue : name === 'vuex'
        ? Object.fromEntries(['mapState', 'mapGetters', 'mapActions', 'mapMutations'].map(key => [key, () => ({})]))
        : name.endsWith('serverApi.js') ? { serverRequest: request }
            : name.endsWith('boardingUtils.js') ? boarding
            : name.endsWith('PassengerBoardingAccess.vue') ? { __esModule: true, default: accessComponent }
                : name.endsWith('sheetLayout.js') ? { __esModule: true, default: { data: () => ({ y: 0, open_b: true, isDragging: false, viewportTracking: false }), computed: { bottomMenuStyle: () => ({}) }, methods: { onDragStart() {}, onDrag() {}, onDragStop() {}, setSheetState() {} } } } : { default: Vue.defineComponent({ render: () => null }), __esModule: true };
    new Function('module', 'exports', 'require', cjs(descriptor.script.content))(module, module.exports, resolve);
    if (template) {
        const render = { exports: {} };
        new Function('module', 'exports', 'require', cjs(compileTemplate({ source: descriptor.template.content, filename: name, id: 'access' }).code))(render, render.exports, resolve);
        module.exports.default.render = render.exports.render;
    }
    const button = Vue.defineComponent({ inheritAttrs: false, props: ['disabled'], setup(props,{attrs,slots}) { return () => Vue.h('button',{...attrs,type:'button',disabled:props.disabled},slots.default?.()); } });
    const chip = Vue.defineComponent({ setup(_,{slots}) { return () => Vue.h('span',slots.default?.()); } });
    module.exports.default.components = { ...module.exports.default.components, VBtn: button, VChip: chip, VIcon: Vue.defineComponent({render:()=>null}) };
    return module.exports.default;
}
const accessComponent = load('trip/PassengerBoardingAccess', true);
const map = load('trip/MapTrip');
describe('passenger boarding entry', () => {
    it('keeps accepted passenger access before and inside the legacy cancellation threshold', () => {
        const context = { userUid: 'passenger', userId: '3', liveNow: NOW, tripSelected: { driver_id: 'driver', departure_time: DEPARTURE, bookings: [row(153)] }, isPublicMap: false, passengerIsBoarded: false };
        expect(map.computed.isBoardingPassenger.call(context)).toBe(true);
        for (const isBeforeThreshold of [false, true]) expect(map.computed.passengerCodeAccess.call({ ...context, isBeforeThreshold }).canOpen).toBe(true);
        expect(map.computed.isBoardingPassenger.call({ ...context, userUid: 'driver' })).toBe(false);
        expect(map.computed.isBoardingPassenger.call({ ...context, isPublicMap: true })).toBe(false);
    });
    it('uses account ID or its associated UUID and never offers another passenger’s code', () => {
        expect(boarding.boardingReservations([row(153)], false, '3')).toHaveLength(1);
        expect(boarding.boardingReservations([row(153)], false, null, 'passenger')).toHaveLength(1);
        expect(access([row(153)], 6, 'driver').canOpen).toBe(false);
        expect(access([row(153)], null, '').canOpen).toBe(false);
    });
    it('explains pending acceptance and omits refused/no-show reservations', () => {
        expect(access([row(1, { is_accepted: false })], 3).message).toContain('après acceptation');
        for (const extra of [{ is_refused: true }, { passenger_no_show: true }]) expect(access([row(1, extra)], 3).canOpen).toBe(false);
    });
    it('keeps the action while any accepted seat/reservation awaits boarding; server confirmation takes precedence', () => {
        const rows = [row(1, { in_car: true, reservation_request_id: 'r1' }), row(2, { in_car: false, reservation_request_id: 'r2' })];
        expect(access(rows, 3).canOpen).toBe(true);
        rows[1].in_car = true;
        expect(access(rows, 3)).toEqual({ status: 'onboard', canOpen: false, message: 'À bord · montée confirmée' });
        expect(map.computed.passengerCodeAccess.call({ passengerIsBoarded: true })).toEqual({ status: 'onboard', canOpen: false, message: 'À bord · montée confirmée' });
    });
    it('renders a labelled native button, opens on click, then replaces it with onboard status', async () => {
        const props = Vue.reactive({ access: access([row(1)], 3) });
        const open = vi.fn(); const host = document.createElement('div');
        const app = Vue.createApp({ render: () => Vue.h(accessComponent, { ...props, onOpen: open }) }); app.mount(host);
        try {
            const button = host.querySelector('button'); expect(button.type).toBe('button');
            expect(button.textContent).toBe('Code'); button.click(); expect(open).toHaveBeenCalledOnce();
            props.access = access([row(1, { in_car: true })], 3); await Vue.nextTick();
            expect(host.querySelector('button')).toBeNull(); expect(host.textContent).toContain('À bord');
        } finally { app.unmount(); }
    });
});

it('keeps the passenger action inside the actual bottom sheet and forwards its open event', () => {
    const bottom = load('menus/trip/BottomMenuTrip', true);
    const open = vi.fn(); const host = document.createElement('div');
    const app = Vue.createApp(bottom, { mode: 'map', showRouteInfo: true, passengerBoardingAccess: access([row(1)], 3), onConfirmBoarding: open });
    const wrapper = Vue.defineComponent({ setup(_, { slots }) { return () => Vue.h('div', slots.default?.()); } });
    for (const tag of new Set(readFileSync('src/components/menus/trip/BottomMenuTrip.vue', 'utf8').match(/v-[a-z-]+(?=[\s>])/g))) app.component(tag, wrapper);
    app.mount(host);
    try { const button = host.querySelector('.passenger-code-entry button'); expect(button.textContent).toContain('Code'); button.click(); expect(open).toHaveBeenCalledOnce(); }
    finally { app.unmount(); }
});

it('retains the server window explanation in the passenger dialog without revealing a code', async () => {
    const dialog = load('trip/BoardingCode');
    request.mockRejectedValueOnce({ response: { data: { message: 'Le code sera disponible 30 minutes avant le départ.' } } });
    const context = { busy: false, modelValue: true, generation: 1, isDriver: false, reservations: [row(153)], mode: 'dev', states: {}, errors: {}, $emit: vi.fn() };
    await dialog.methods.refresh.call(context);
    expect(request).toHaveBeenCalledWith('get', '/bookings/153/boarding-code', { mode: 'dev', signal: expect.any(AbortSignal) });
    expect(context.errors[153]).toContain('30 minutes'); expect(context.states[153]).toBeUndefined();
    expect(context.$emit).not.toHaveBeenCalled();
});

it('uses the exact -30min/+1h window, including boundaries and missing departure', () => {
    const at = offset => boarding.passengerBoardingAccess([row(1)], 3, 'passenger', DEPARTURE, NOW + offset);
    expect(at(-1800001).canOpen).toBe(false); expect(at(-1800001).message).toContain('30 minutes');
    expect(at(-1800000).canOpen).toBe(true); expect(at(3600000).canOpen).toBe(true);
    expect(at(3600001).status).toBe('expired');
    expect(boarding.passengerBoardingAccess([row(1)], 3, 'passenger', null, NOW).canOpen).toBe(false);
});
it('explains a disabled action on click without emitting open, then follows the live clock', async () => {
    const props = Vue.reactive({ access: boarding.passengerBoardingAccess([row(1)], 3, 'passenger', DEPARTURE, NOW - 1800001) });
    const open = vi.fn(); const host = document.createElement('div');
    const app = Vue.createApp({ render: () => Vue.h(accessComponent, { access: props.access, onOpen: open }) }); app.mount(host);
    try {
        const button = host.querySelector('button'); expect(button.getAttribute('aria-disabled')).toBe('true');
        button.click(); await Vue.nextTick(); expect(host.textContent).toContain('30 minutes'); expect(open).not.toHaveBeenCalled();
        props.access = boarding.passengerBoardingAccess([row(1)], 3, 'passenger', DEPARTURE, NOW - 1800000); await Vue.nextTick();
        expect(button.getAttribute('aria-disabled')).toBe('false'); button.click(); expect(open).toHaveBeenCalledOnce();
    } finally { app.unmount(); }
});
it('opens one inline instance and cleans its pending request, timer and local secret on hiding', async () => {
    const context = { isBoardingPassenger: true, passengerCodeAccess: { canOpen: false }, passengerCodeOpen: false, switchToMapMenu: vi.fn() };
    map.methods.openPassengerCode.call(context); expect(context.passengerCodeOpen).toBe(false);
    context.passengerCodeAccess.canOpen = true;
    map.methods.openPassengerCode.call(context); map.methods.openPassengerCode.call(context); expect(context.switchToMapMenu).toHaveBeenCalledOnce();
    expect(context.passengerCodeOpen).toBe(true); context.hidePassengerCode=map.methods.hidePassengerCode.bind(context); map.watch.passengerCodeAccess.call(context,{canOpen:false,status:'onboard'}); expect(context.passengerCodeOpen).toBe(false);
    const dialog = load('trip/BoardingCode'); let resolve;
    request.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const code = { ...dialog.data(), modelValue: true, isDriver: false, reservations: [row(1)], $emit: vi.fn() };
    code.refresh = dialog.methods.refresh.bind(code); code.clearSecrets = dialog.methods.clearSecrets.bind(code);
    const pending = code.refresh(); await code.refresh(); const signal = code.requestController.signal;
    code.states = { 1: { code: 'masked-fixture' } }; code.timer = setInterval(() => {}, 1000);
    code.clearSecrets(); expect(signal.aborted).toBe(true); expect(code.states).toEqual({}); expect(code.timer).toBeNull();
    resolve({ data: { data: { code: 'late-masked-fixture' } } }); await pending; expect(code.states).toEqual({});
});
it('replaces route information with the inline slot, and restores village info on hiding', async () => {
    const bottom = load('menus/trip/BottomMenuTrip', true); const props = Vue.reactive({ showBoardingCode: true });
    const host = document.createElement('div'); const app = Vue.createApp({ render: () => Vue.h(bottom,
        { mode: 'map', showRouteInfo: true, ...props, currentVillage: {label:'Tsingoni'}, mapInfos:{time:'20 min',distance:'15 km',infosSup:''} },
        { 'boarding-code': () => Vue.h('section', { 'data-inline': true }, 'Emplacement du code') }) });
    const wrapper = Vue.defineComponent({ setup(_, { slots }) { return () => Vue.h('div', slots.default?.()); } });
    for (const tag of new Set(readFileSync('src/components/menus/trip/BottomMenuTrip.vue', 'utf8').match(/v-[a-z-]+(?=[\s>])/g))) app.component(tag, wrapper);
    app.mount(host);
    try {
        expect(host.querySelector('[data-inline]')).not.toBeNull(); expect(host.textContent).not.toContain('20 min'); expect(host.textContent).not.toContain('Village actuel');
        props.showBoardingCode=false; await Vue.nextTick(); expect(host.querySelector('[data-inline]')).toBeNull(); expect(host.textContent).toContain('20 min'); expect(host.textContent).toContain('Village actuel · Tsingoni');
    } finally { app.unmount(); }
});
it('selects an unconfirmed representative for seats sharing the same logical reservation', () => {
    const rows=[row(1,{reservation_request_id:'same',in_car:true}),row(2,{reservation_request_id:'same',in_car:false})];
    expect(boarding.boardingReservations(rows,false,3).map(b=>b.id)).toEqual([2]);
});

it('renders passenger content inline while keeping a separate raised driver dialog and status-only fetch', async () => {
    const component = load('trip/BoardingCode', true);
    const mount = props => {
        const host = document.createElement('div'); const app = Vue.createApp(component, props);
        const wrapper = Vue.defineComponent({ props: ['modelValue'], setup(_, { slots }) { return () => Vue.h('div', slots.default?.()); } });
        for (const tag of ['v-dialog','v-card','v-card-title','v-card-text','v-card-actions','v-btn','v-text-field']) app.component(tag, wrapper);
        const vm = app.mount(host); return {host,app,vm};
    };
    request.mockResolvedValueOnce({data:{data:{confirmed:false}}});
    const passenger=mount({inline:true,modelValue:true,bookings:[row(1)],userId:3});
    try {
        await Vue.nextTick(); expect(passenger.host.querySelector('section.boarding-inline')).not.toBeNull();
        expect(passenger.host.textContent).toContain('Cacher'); expect(passenger.host.textContent).not.toContain('Confirmer la montée');
    } finally { passenger.app.unmount(); }
    request.mockResolvedValueOnce({data:{data:{confirmed:false}}});
    const driver=mount({modelValue:true,isDriver:true,bookings:[row(1)],mode:'dev'});
    try {
        await Vue.nextTick(); expect(driver.host.querySelector('section.boarding-inline')).toBeNull();
        expect(driver.host.textContent).toContain('Confirmer la montée');
        expect(request).toHaveBeenLastCalledWith('get','/bookings/1/boarding-status',expect.objectContaining({mode:'dev'}));
    } finally { driver.app.unmount(); }
});

it('routes the compact unavailable explanation into the sheet without covering the map legend', () => {
    const host=document.createElement('div'), explain=vi.fn(), open=vi.fn();
    const app=Vue.createApp(accessComponent,{compact:true,access:{canOpen:false,message:'30 minutes'},onExplain:explain,onOpen:open});app.mount(host);
    try {host.querySelector('button').click();expect(explain).toHaveBeenCalledOnce();expect(open).not.toHaveBeenCalled();expect(host.querySelector('p')).toBeNull();}
    finally {app.unmount();}
});

it('defaults driver validation to four digits and requires explicit legacy mode for six without truncating pasted codes', () => {
    const dialog=load('trip/BoardingCode'); const booking=row(1);
    const context={...dialog.data(),validCode:boarding.validBoardingCode};
    context.codeDigits=dialog.methods.codeDigits.bind(context);
    context.codes[1]='0007';expect(context.codeDigits(booking)).toBe(4);expect(context.validCode(context.codes[1],4)).toBe(true);
    const preventDefault=vi.fn();dialog.methods.handleCodePaste.call(context,{clipboardData:{getData:()=> '000123'},preventDefault},booking);
    expect(preventDefault).toHaveBeenCalledOnce();expect(context.codes[1]).toBe('');expect(context.errors[1]).toContain('Ancien code');
    dialog.methods.handleCodePaste.call(context,{clipboardData:{getData:()=> ' 0007 '},preventDefault:vi.fn()},booking);expect(context.codes[1]).toBe('0007');
    dialog.methods.toggleLegacy.call(context,booking);expect(context.codeDigits(booking)).toBe(6);expect(context.validCode('000123',context.codeDigits(booking))).toBe(true);
    expect(context.validCode('0007',context.codeDigits(booking))).toBe(false);
    dialog.methods.toggleLegacy.call(context,booking);expect(context.codeDigits(booking)).toBe(4);expect(context.codes[1]).toBe('');
});
it('keeps the persisted six-digit passenger display intact while making its transitional format explicit', async () => {
    const component=load('trip/BoardingCode',true);request.mockResolvedValueOnce({data:{data:{confirmed:false,code:'••••••'}}});
    const host=document.createElement('div'),app=Vue.createApp(component,{inline:true,modelValue:true,bookings:[row(1)],userId:3});
    const wrapper=Vue.defineComponent({setup(_,{slots}) {return()=>Vue.h('div',slots.default?.());}});
    for(const tag of ['v-card','v-card-title','v-card-text','v-card-actions'])app.component(tag,wrapper);
    app.mount(host);try{await new Promise(resolve=>setTimeout(resolve,0));expect(host.textContent).toContain('Code déjà émis : 6 chiffres');expect(host.querySelector('.boarding-pin').textContent).toBe('••••••');}finally{app.unmount();}
});
it('binds the real app shell theme to the reactive app setting rather than an OS preference', async () => {
    const {descriptor}=parse(readFileSync('src/App.vue','utf8')); const module={exports:{}};
    const cjs=transformSync(compileTemplate({source:descriptor.template.content,filename:'App.vue',id:'theme'}).code,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code;
    new Function('module','exports','require',cjs)(module,module.exports,()=>Vue);
    const wrapper=Vue.defineComponent({props:['theme'],setup(props,{slots}) {return()=>Vue.h('div',{'data-theme':props.theme},slots.default?.());}});
    const host=document.createElement('div'),app=Vue.createApp({data:()=>({darkMode:false,isMobileOrSmallScreen:false,bottomNav:false}),render:module.exports.render});
    app.component('BottomNav',wrapper);app.component('v-app',wrapper);app.component('router-view',wrapper);app.component('v-main',wrapper);
    const vm=app.mount(host);try{expect(host.querySelector('[data-theme]').dataset.theme).toBe('light');vm.darkMode=true;await Vue.nextTick();expect(host.querySelector('[data-theme]').dataset.theme).toBe('dark');expect(host.querySelector('[data-theme]').classList.contains('dark-mode')).toBe(true);}finally{app.unmount();}
});
