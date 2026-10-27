import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { parse, compileTemplate } from '@vue/compiler-sfc';
import * as Vue from 'vue';
import * as simulation from '@/services/tripSimulation.js';
import { it, expect } from 'vitest';
const { descriptor } = parse(readFileSync('src/components/trip/TripSimulationPanel.vue', 'utf8'));
const cjs = input => transformSync(input, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
const resolve = id => id === 'vue' ? Vue : simulation;
const module = { exports: {} };
new Function('module', 'exports', 'require', cjs(descriptor.script.content))(module, module.exports, resolve);
const template = { exports: {} };
new Function('module', 'exports', 'require', cjs(compileTemplate({ source: descriptor.template.content, filename: 'TripSimulationPanel.vue', id: 'panel' }).code))(template, template.exports, resolve);
const component = { ...module.exports.default, render: template.exports.render };
it('shows high speeds but disables own movement after boarding while retaining the network test control', async () => {
    const props = Vue.reactive({ onboard: false, role: 'passenger', connected: true, payments: true, vehicleSpeed: null });
    const host = document.createElement('div'); const app = Vue.createApp({ render: () => Vue.h(component, props) });
    app.component('v-icon', Vue.defineComponent({render:()=>null})); app.mount(host);
    try {
        expect(host.querySelector('details').hasAttribute('open')).toBe(false);
        const previous=host.querySelector('details').style.cssText;host.querySelector('.move-panel').click();await Vue.nextTick();host.querySelector('.move-panel').click();await Vue.nextTick();expect(host.querySelector('details').style.cssText).not.toBe(previous);expect(host.querySelector('details').hasAttribute('open')).toBe(false);
        expect([...host.querySelectorAll('select')[0].options].map(option => option.value)).toContain('200');
        expect(host.querySelector('fieldset').hasAttribute('disabled')).toBe(false);
        props.onboard = true; props.vehicleSpeed = 100; await Vue.nextTick();
        expect(host.querySelector('fieldset').hasAttribute('disabled')).toBe(true);
        expect(host.querySelector('fieldset').style.display).toBe('none');
        expect(host.textContent).toContain('Vitesse déclarée du véhicule : 100 km/h');
        expect(host.querySelector('fieldset + label input').disabled).toBe(false);
    } finally { app.unmount(); }
});
