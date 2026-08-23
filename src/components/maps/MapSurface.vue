<template>
    <component
        :is="surfaceComponent"
        :center="center"
        :zoom="zoom"
        :origin="origin"
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
</template>

<script>
import { defineComponent } from 'vue';
import GoogleMapSurface from './GoogleMapSurface.vue';
import LeafletMapSurface from './LeafletMapSurface.vue';
import { getEffectiveMapProvider, getMapProvider } from '@/utils/mapProvider.js';

export default defineComponent({
    name: 'MapSurface',
    components: {
        GoogleMapSurface,
        LeafletMapSurface,
    },
    emits: ['ready', 'route-select', 'alert-select'],
    props: {
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
            runtimeProvider: getMapProvider(this.provider),
            hasEmittedReady: false,
        };
    },
    computed: {
        selectedProvider() {
            return getEffectiveMapProvider(this.provider || this.runtimeProvider);
        },
        surfaceComponent() {
            return this.selectedProvider === 'google' ? 'GoogleMapSurface' : 'LeafletMapSurface';
        },
    },
    mounted() {
        window.addEventListener('mae-map-provider-changed', this.handleProviderChange);
    },
    beforeUnmount() {
        window.removeEventListener('mae-map-provider-changed', this.handleProviderChange);
    },
    methods: {
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
