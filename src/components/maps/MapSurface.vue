<template>
    <div class="village-map-wrapper">
        <component
            :is="surfaceComponent"
            :center="center"
            :zoom="zoom"
            :origin="origin"
            :village-zones="villageZones"
            :bottom-padding="bottomPadding"
            :destination="destination"
            :routes="routes"
            :route-available="routeAvailable"
            :current-location="currentLocation"
            :shared-locations="sharedLocations"
            :shared-location-colors="sharedLocationColors"
            :alerts="alerts"
            :alert-types="alertTypes"
            @ready="handleSurfaceReady"
            @route-select="$emit('route-select', $event)"
            @alert-select="$emit('alert-select', $event)"
        />
        <div v-if="hasVillagePoints" class="village-zone-legend" aria-label="Zones des villages">
            <div v-for="zone in villageZones" :key="zone.role" class="village-zone-label">
                <span class="zone-swatch" :style="{ backgroundColor: zone.color }" aria-hidden="true"></span>
                <span><strong>{{ zone.role === 'origin' ? 'Départ' : 'Arrivée' }}</strong> · {{ zone.label }}</span>
            </div>
            <div class="village-zone-status" role="status" aria-live="polite">
                <span v-if="boundaryStatus === 'loading'">Chargement des zones…</span>
                <template v-else-if="boundaryStatus === 'error' || missingBoundary">
                    <span>Zone indisponible : repère affiché.</span>
                    <button type="button" @click="fetchBoundaries(true)">Réessayer</button>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import GoogleMapSurface from './GoogleMapSurface.vue';
import LeafletMapSurface from './LeafletMapSurface.vue';
import { loadVillageBoundaries } from '@/services/villageBoundaryService.js';
import { pointLabel } from './mapSurfaceUtils.js';
import { villageIdForPoint, villageZoneLabel, VILLAGE_ZONE_STYLES } from './villageZoneUtils.js';
import { getEffectiveMapProvider, getMapProvider } from '@/utils/mapProvider.js';

export default defineComponent({
    name: 'MapSurface',
    components: {
        GoogleMapSurface,
        LeafletMapSurface,
    },
    emits: ['ready', 'route-select', 'alert-select'],
    props: {
        reserveBottomSpace: { type: Boolean, default: false },
        originVillageId: { type: [Number, String], default: null },
        destinationVillageId: { type: [Number, String], default: null },
        provider: { type: String, default: '' },
        center: { type: [Array, Object], required: true },
        zoom: { type: Number, default: 11 },
        origin: { type: Object, default: null },
        destination: { type: Object, default: null },
        routes: { type: Array, default: () => [] },
        routeAvailable: { type: Boolean, default: false },
        currentLocation: { type: Array, default: () => [] },
        sharedLocations: { type: Array, default: () => [] },
        sharedLocationColors: { type: Array, default: () => [] },
        alerts: { type: Array, default: () => [] },
        alertTypes: { type: Array, default: () => [] },
    },
    data() {
        return {
            viewportHeight: typeof window === 'undefined' ? 800 : window.innerHeight,
            boundaryStatus: 'idle',
            boundaries: {},
            boundaryRequest: 0,
            runtimeProvider: getMapProvider(this.provider),
            hasEmittedReady: false,
        };
    },
    computed: {
        bottomPadding() {
            return this.reserveBottomSpace ? Math.min(320, Math.round(this.viewportHeight * 0.4)) + 24 : 24;
        },
        villageIds() {
            const villages = this.$store?.state?.search?.villages || [];
            return [villageIdForPoint(this.origin, this.originVillageId, villages),
                villageIdForPoint(this.destination, this.destinationVillageId, villages)];
        },
        villageKey() { return this.villageIds.join(':'); },
        hasVillagePoints() { return Boolean(this.origin || this.destination); },
        villageZones() {
            return ['origin', 'destination'].map((role, index) => {
                const point = this[role];
                const boundary = this.boundaries[this.villageIds[index]] || null;
                return { role, boundary, color: VILLAGE_ZONE_STYLES[role].color,
                    label: villageZoneLabel(boundary, pointLabel(point)) };
            }).filter(zone => Boolean(this[zone.role]));
        },
        missingBoundary() { return this.villageZones.some(zone => !zone.boundary); },
        selectedProvider() {
            return getEffectiveMapProvider(this.provider || this.runtimeProvider);
        },
        surfaceComponent() {
            return this.selectedProvider === 'google' ? 'GoogleMapSurface' : 'LeafletMapSurface';
        },
    },
    watch: { villageKey: { immediate: true, handler() { this.fetchBoundaries(); } } },
    mounted() {
        window.addEventListener('resize', this.updateViewport);
        window.addEventListener('mae-map-provider-changed', this.handleProviderChange);
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.updateViewport);
        this.boundaryRequest += 1;
        window.removeEventListener('mae-map-provider-changed', this.handleProviderChange);
    },
    methods: {
        updateViewport() { this.viewportHeight = window.innerHeight; },
        async fetchBoundaries(refresh = false) {
            const request = ++this.boundaryRequest;
            this.boundaries = {};
            const ids = this.villageIds.filter(Boolean);
            if (!ids.length) { this.boundaryStatus = 'idle'; return; }
            this.boundaryStatus = 'loading';
            try {
                const boundaries = await loadVillageBoundaries(ids, { refresh });
                if (request !== this.boundaryRequest) return;
                this.boundaries = boundaries;
                this.boundaryStatus = 'ready';
            }
            catch (_error) {
                if (request === this.boundaryRequest) this.boundaryStatus = 'error';
            }
        },
        handleSurfaceReady() {
            // Un changement de moteur ne doit pas relancer GPS, sockets ou calcul d'itinéraire.
            if (!this.hasEmittedReady) {
                this.hasEmittedReady = true;
                this.$emit('ready');
            }
        },
        handleProviderChange(event) {
            if (!this.provider) {
                this.runtimeProvider = getMapProvider(event.detail);
            }
        },
    },
});
</script>

<style scoped>
.village-map-wrapper { position: relative; width: 100%; height: 100%; }
.village-zone-legend { position: absolute; top: calc(12px + var(--safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%); z-index: 500;
    width: max-content; max-width: min(330px, calc(100% - 148px)); padding: 9px 12px; border-radius: 12px;
    background: rgba(255, 255, 255, .95); color: #263238; box-shadow: 0 2px 10px #0002;
    font-size: 12px; pointer-events: none; }
.village-zone-label { display: flex; align-items: baseline; gap: 7px; margin: 2px 0; }
.zone-swatch { width: 10px; height: 10px; border-radius: 3px; flex: 0 0 10px; }
.village-zone-status { font-size: 11px; color: #52606d; }
.village-zone-status button { pointer-events: auto; text-decoration: underline; margin-left: 6px; }
</style>
