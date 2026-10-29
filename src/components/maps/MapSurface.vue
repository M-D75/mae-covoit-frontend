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
    emits: ['ready', 'route-select', 'alert-select', 'zone-progress', 'route-details'],
    props: {
        vehiclePosition: { type: Object, default: null },
        progressContext: { type: String, default: '' },
        actorMarkers: { type: Array, default: null },
        extraBottomSpace: { type: Number, default: 0 },
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
            return this.reserveBottomSpace ? Math.min(Math.round(this.viewportHeight * .75), Math.min(320, Math.round(this.viewportHeight * .4)) + this.extraBottomSpace) + 24 : 24;
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
        routeDetails() {
            const origin=this.endpointLegend.filter(zone=>zone.roles?.includes('origin'));
            const destination=this.endpointLegend.filter(zone=>!zone.roles?.includes('origin'));
            return { key:`${this.progressContext}:${this.villageKey}:${this.routeKey}`,tracking:Boolean(this.progressContext),reliable:this.visits.reliable,
                boundaryStatus:this.boundaryStatus,catalogStatus:this.catalogStatus,missingBoundary:this.missingBoundary,
                zones:[...origin,...this.intermediateLegend,...destination].map(({key,label,role,roles,color,phase})=>({key,label,role,roles,color,phase})) };
        },
        missingBoundary() { return this.endpointZones.some(zone => !zone.boundary); },
        selectedProvider() {
            return getEffectiveMapProvider(this.provider || this.runtimeProvider);
        },
        surfaceComponent() {
            return this.selectedProvider === 'google' ? 'GoogleMapSurface' : 'LeafletMapSurface';
        },
    },
    watch: {
        routeDetails: {deep:true,immediate:true,handler(value){this.$emit('route-details',value);}},
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
</style>
