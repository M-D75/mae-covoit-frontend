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
            :actor-markers="actorMarkers"
            :shared-location-colors="sharedLocationColors"
            :alerts="alerts"
            :alert-types="alertTypes"
            @ready="handleSurfaceReady"
            @route-select="$emit('route-select', $event)"
            @alert-select="$emit('alert-select', $event)"
        />
        <div v-if="hasVillagePoints" class="village-zone-legend" :class="{ 'has-progress': Boolean(progressContext) }" aria-label="Zones des villages">
            <div v-for="zone in endpointLegend" :key="zone.key" class="village-zone-label">
                <span class="zone-swatch" :style="{ backgroundColor: zone.color, opacity: zone.phase === 'visited' ? .3 : 1 }" aria-hidden="true"></span>
                <span><strong>{{ zone.roles?.length > 1 ? 'Départ et arrivée' : zone.role === 'origin' ? 'Départ' : 'Arrivée' }}</strong> · {{ zone.label }}<small v-if="phaseLabel(zone)"> · {{ phaseLabel(zone) }}</small></span>
            </div>
            <details v-if="intermediateLegend.length" class="intermediate-zones">
                <summary>Villages traversés · {{ intermediateLegend.length }} {{ intermediateLegend.length === 1 ? 'zone' : 'zones' }}</summary>
                <div v-for="zone in intermediateLegend" :key="zone.key" class="village-zone-label">
                    <span class="zone-swatch" :style="{ backgroundColor: zone.color, opacity: zone.phase === 'visited' ? .3 : 1 }" aria-hidden="true"></span>
                    <span>{{ zone.label }}<small v-if="phaseLabel(zone)"> · {{ phaseLabel(zone) }}</small></span>
                </div>
                <small>Passage géométrique ; aucun arrêt garanti.</small>
            </details>
            <div v-if="catalogStatus === 'error'" class="village-zone-status">Villages traversés indisponibles.</div>
            <div v-if="progressContext && !visits.reliable" class="village-zone-status">Progression suspendue : position véhicule indisponible ou imprécise.</div>
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
import { defineComponent, markRaw } from 'vue';
import GoogleMapSurface from './GoogleMapSurface.vue';
import LeafletMapSurface from './LeafletMapSurface.vue';
import { loadVillageBoundaries, loadVillageBoundaryCatalog } from '@/services/villageBoundaryService.js';
import { pointLabel } from './mapSurfaceUtils.js';
import { villageIdForPoint, villageZoneLabel, VILLAGE_ZONE_STYLES } from './villageZoneUtils.js';
import { boundaryGeometryKey, traversedVillageZones, createZoneVisitTracker } from './villageRouteZones.js';
import { getEffectiveMapProvider, getMapProvider } from '@/utils/mapProvider.js';

export default defineComponent({
    name: 'MapSurface',
    components: {
        GoogleMapSurface,
        LeafletMapSurface,
    },
    emits: ['ready', 'route-select', 'alert-select', 'zone-progress'],
    props: {
        vehiclePosition: { type: Object, default: null },
        progressContext: { type: String, default: '' },
        actorMarkers: { type: Array, default: null },
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
            boundaryStatus: 'idle', catalogStatus: 'idle', catalog: [],
            visitTracker: markRaw(createZoneVisitTracker()), visits: { reliable: false, phases: {} }, progressTimer: null,
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
        fullRoute() {
            const route = this.routes.find(route => route.current) || this.routes[0];
            return route?.originalPolyline || route?.polylineDecoded || [];
        },
        routeKey() { return JSON.stringify(this.fullRoute); },
        endpointZones() {
            return ['origin', 'destination'].map((role, index) => {
                const boundary = this.boundaries[this.villageIds[index]] || null;
                return { key: boundaryGeometryKey(boundary) || role, role, roles: [role], boundary,
                    color: VILLAGE_ZONE_STYLES[role].color, label: villageZoneLabel(boundary, pointLabel(this[role])) };
            }).filter(zone => Boolean(this[zone.role]));
        },
        geometryZones() {
            const endpointZones = [];
            for (const zone of this.endpointZones) {
                const previous = zone.boundary && endpointZones.find(item => item.key === zone.key);
                if (previous) { previous.roles = [...previous.roles, ...zone.roles]; previous.label += ` / ${zone.label}`; }
                else endpointZones.push({ ...zone });
            }
            const intermediate = this.origin && this.destination
                ? traversedVillageZones(this.catalog, this.fullRoute, endpointZones.filter(z => z.boundary).map(z => z.key)) : [];
            return [...endpointZones, ...intermediate.map(zone => ({ ...zone, color: VILLAGE_ZONE_STYLES.intermediate.color }))];
        },
        geometryKey() { return this.geometryZones.map(zone => zone.key).join(':'); },
        villageZones() { return this.geometryZones.map(zone => ({ ...zone, phase: this.visits.phases[zone.key] || 'upcoming' })); },
        endpointLegend() { return this.villageZones.filter(zone => zone.role !== 'intermediate'); },
        intermediateLegend() { return this.villageZones.filter(zone => zone.role === 'intermediate'); },
        missingBoundary() { return this.endpointZones.some(zone => !zone.boundary); },
        selectedProvider() {
            return getEffectiveMapProvider(this.provider || this.runtimeProvider);
        },
        surfaceComponent() {
            return this.selectedProvider === 'google' ? 'GoogleMapSurface' : 'LeafletMapSurface';
        },
    },
    watch: {
        villageKey: { immediate: true, handler() { this.fetchBoundaries(); this.resetVisits(); } },
        routeKey() { this.resetVisits(); },
        progressContext() { this.resetVisits(); },
        geometryKey() { this.resetVisits(); },
        vehiclePosition() { this.updateVisits(); },
    },
    mounted() {
        this.progressTimer = setInterval(() => { if (this.progressContext) this.updateVisits(); }, 1000);
        window.addEventListener('resize', this.updateViewport);
        window.addEventListener('mae-map-provider-changed', this.handleProviderChange);
    },
    beforeUnmount() {
        clearInterval(this.progressTimer);
        window.removeEventListener('resize', this.updateViewport);
        this.boundaryRequest += 1;
        window.removeEventListener('mae-map-provider-changed', this.handleProviderChange);
    },
    methods: {
        updateViewport() { this.viewportHeight = window.innerHeight; },
        phaseLabel(zone) {
            if (!this.progressContext) return '';
            return { upcoming: 'À venir', active: 'Zone actuelle', visited: 'Quittée', uncertain: 'Dernière zone observée' }[zone.phase];
        },
        resetVisits() {
            this.visitTracker.reset(); this.visits = { reliable: false, phases: {} }; this.emitZoneProgress(); this.updateVisits();
        },
        updateVisits() {
            if (!this.progressContext) return;
            const next = this.visitTracker.update(this.geometryZones, this.vehiclePosition);
            if (JSON.stringify(next) !== JSON.stringify(this.visits)) { this.visits = next; this.emitZoneProgress(); }
        },
        emitZoneProgress() {
            const active = this.visits.reliable ? this.geometryZones.filter(zone => this.visits.phases[zone.key] === 'active') : [];
            active.sort((a, b) => (b.firstEntry ?? -1) - (a.firstEntry ?? -1) || a.key.localeCompare(b.key));
            const zone = active[0];
            const canonical = zone && this.catalog.find(row => Number(row.village_id) === Number(zone.boundary?.boundary_village_id));
            this.$emit('zone-progress', { reliable: this.visits.reliable, current: zone ? {
                key: zone.key, label: canonical?.village || zone.boundary?.source?.source_properties?.libelle || zone.boundary?.village || zone.label,
            } : null });
        },
        async fetchBoundaries(refresh = false) {
            const request = ++this.boundaryRequest;
            this.boundaries = {}; this.catalog = [];
            const ids = this.villageIds.filter(Boolean);
            if (!ids.length) { this.boundaryStatus = 'idle'; this.catalogStatus = 'idle'; return; }
            this.boundaryStatus = 'loading'; this.catalogStatus = 'loading';
            const [endpoints, catalog] = await Promise.allSettled([
                loadVillageBoundaries(ids, { refresh }),
                this.origin && this.destination ? Promise.resolve().then(() => loadVillageBoundaryCatalog({ refresh })) : Promise.resolve([]),
            ]);
            if (request !== this.boundaryRequest) return;
            this.boundaries = endpoints.status === 'fulfilled' ? endpoints.value : {};
            this.boundaryStatus = endpoints.status === 'fulfilled' ? 'ready' : 'error';
            this.catalog = catalog.status === 'fulfilled' ? catalog.value : [];
            this.catalogStatus = catalog.status === 'fulfilled' ? 'ready' : 'error';
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
    background: rgba(var(--v-theme-surface), .96); color: rgb(var(--v-theme-on-surface)); border: 1px solid rgba(var(--v-theme-on-surface), .12); box-shadow: 0 2px 10px #0002;
    font-size: 12px; max-height: 32vh; overflow-y: auto; pointer-events: auto; }
.village-zone-label { display: flex; align-items: baseline; gap: 7px; margin: 2px 0; }
.zone-swatch { width: 10px; height: 10px; border-radius: 3px; flex: 0 0 10px; }
.village-zone-status { font-size: 11px; color: rgba(var(--v-theme-on-surface), .75); }
.village-zone-status button { min-height: 44px; padding: 4px 6px; pointer-events: auto; text-decoration: underline; margin-left: 6px; }
 .village-zone-legend.has-progress { top: calc(64px + var(--safe-area-inset-top, 0px)); }
.intermediate-zones summary { min-height: 44px; display: list-item; align-content: center; cursor: pointer; margin-top: 4px; color: rgb(var(--v-theme-primary)); font-weight: 600; }
</style>
