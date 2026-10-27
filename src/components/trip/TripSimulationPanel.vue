<template>
    <details class="simulation-panel" :style="dockStyle" @keydown.stop>
        <summary><span>Essai · {{ role === 'driver' ? 'conducteur' : 'passager' }}</span><button class="move-panel" type="button" aria-label="Déplacer le panneau d’essai" @click.stop.prevent="dock = (dock + 1) % 4"><v-icon size="18" icon="mdi-drag-vertical" /></button></summary>
        <p>{{ onboard ? 'À bord : la position et l’allure suivent le véhicule du conducteur.' : 'Avant la montée, votre déplacement est indépendant de celui du véhicule.' }}</p>
        <p v-if="onboard && vehicleSpeed !== null">Vitesse déclarée du véhicule : {{ vehicleSpeed }} km/h</p>
        <p>{{ connected ? 'Connecté au trajet' : 'Réseau coupé' }} · {{ payments ? 'Paiements de test confirmés' : 'Positions seulement — PIN bloqué' }}</p>
        <fieldset v-show="!onboard" :disabled="onboard || undefined">
        <legend>{{ onboard ? 'Déplacement personnel désactivé à bord' : 'Déplacement de votre position' }}</legend>
        <button @click="$emit('command', 'start')">Démarrer / reprendre</button>
        <button @click="$emit('command', 'pause')">Pause</button>
        <button @click="$emit('command', 'reset')">Revenir au départ</button>
        <label>Allure physique<select v-model.number="speed" @change="configure"><option v-for="value in speeds" :key="value" :value="value">{{ value === 0 ? 'À l’arrêt' : value === 5 ? 'À pied · 5 km/h' : `Voiture · ${value} km/h` }}</option></select></label>
        <label>Accélération du temps<select v-model.number="acceleration" @change="configure"><option :value="1">Temps réel</option><option :value="5">× 5</option><option :value="20">× 20</option></select></label>
        <label>Position sur le trajet<input v-model.number="progress" type="range" min="0" max="100" @input="$emit('command', 'seek', progress / 100)"></label>
        <label>Latitude<input v-model="latitude" type="number" step="0.00001"></label>
        <label>Longitude<input v-model="longitude" type="number" step="0.00001"></label>
        <button @click="$emit('command', 'place', [Number(latitude), Number(longitude)])">Placer ma position</button>
        <label><input v-model="gpsMissing" type="checkbox" @change="configure">Coupure GPS</label>
        <button @click="$emit('command', 'real')">Revenir au GPS réel</button>
        </fieldset>
        <label><input v-model="networkMissing" type="checkbox" @change="$emit('command', 'network', networkMissing)">Coupure réseau du suivi</label>
        <p role="status">{{ message }}</p>
    </details>
</template>
<script>
import { SIMULATION_SPEEDS } from '@/services/tripSimulation.js';
export default {
    props: { onboard: Boolean, vehicleSpeed: { type: Number, default: null }, role: String, connected: Boolean, payments: Boolean, message: String },
    emits: ['command'],
    data: () => ({ dock: 0, speeds: SIMULATION_SPEEDS, speed: 25, acceleration: 1, progress: 0, latitude: -12.7897, longitude: 45.1038, gpsMissing: false, networkMissing: false }),
    computed: {
        dockStyle() {
            return [
                { top: 'calc(var(--safe-top, 0px) + 200px)', left: '8px' },
                { bottom: 'calc(var(--safe-bottom, 0px) + 8px)', left: '8px' },
                { top: 'calc(var(--safe-top, 0px) + 200px)', right: '8px' },
                { bottom: 'calc(var(--safe-bottom, 0px) + 8px)', right: '8px' },
            ][this.dock];
        },
    },
    methods: { configure() { this.$emit('command', 'configure', { speed: this.speed, acceleration: this.acceleration, gpsAvailable: !this.gpsMissing }); } },
};
</script>
<style scoped>
.simulation-panel { position: fixed; z-index: 2300; max-width: min(310px, calc(100vw - 16px)); max-height: 65vh; overflow: auto; padding: 8px 12px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); border: 1px solid rgba(var(--v-theme-on-surface), .2); border-radius: 10px; box-shadow: 0 3px 10px #0003; font-size: 12px; }
.simulation-panel:not([open]) { max-width: 220px; padding: 0 8px; }
.simulation-panel summary { display: flex; align-items: center; justify-content: space-between; gap: 6px; min-height: 44px; cursor: pointer; font-weight: 600; }
.move-panel { min-width: 44px; min-height: 44px; border: 0 !important; margin: 0 !important; }
.simulation-panel fieldset { border: 0; padding: 0; }
.simulation-panel fieldset:disabled { opacity: .6; }
.simulation-panel legend { font-weight: 600; margin-top: 6px; }
.simulation-panel label { display: block; margin-top: 8px; min-height: 44px; }
.simulation-panel button, .simulation-panel input, .simulation-panel select { border: 1px solid rgba(var(--v-theme-on-surface), .25); color: inherit; background: rgb(var(--v-theme-surface)); border-radius: 6px; padding: 6px; margin: 3px; }
.simulation-panel button, .simulation-panel select, .simulation-panel input:not([type='checkbox']):not([type='range']) { min-height: 44px; }
.simulation-panel button:focus-visible, .simulation-panel input:focus-visible, .simulation-panel select:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
</style>
