<template>
    <GMapMap
        ref="mapRef"
        class="mae-map-surface"
        :center="googleCenter"
        :zoom="zoom"
        :options="mapOptions"
        @tilesloaded="handleReady"
    >
        <GMapMarker v-if="originCoordinate" :position="originCoordinate">
            <GMapInfoWindow>{{ originLabel }}</GMapInfoWindow>
        </GMapMarker>

        <GMapMarker
            v-for="alert in validAlerts"
            :key="`alert-${alert.id}`"
            :position="alert.coordinate"
            :icon="alertIcon(alert.value)"
            :clickable="true"
            @click="$emit('alert-select', alert.value)"
        >
            <GMapInfoWindow>
                <strong>{{ alert.definition.label }}</strong><br>
                Signalé à {{ formatAlertTime(alert.value.createdAt) }} h<br>
                Expire à {{ formatAlertTime(alert.value.expiresAt) }} h
            </GMapInfoWindow>
        </GMapMarker>

        <template v-if="routeAvailable">
            <GMapPolyline
                v-for="item in renderedRoutes"
                :key="`route-outline-${item.route.id ?? item.originalIndex}`"
                :path="googleRoute(item.route)"
                :options="{
                    strokeColor: item.route.current ? '#1b79cc' : '#838383',
                    strokeOpacity: 0.9,
                    strokeWeight: 8,
                }"
            />

            <GMapPolyline
                v-for="item in renderedRoutes"
                :key="`route-line-${item.route.id ?? item.originalIndex}`"
                :path="googleRoute(item.route)"
                :clickable="true"
                :options="{
                    strokeColor: item.route.current ? '#01a9e8' : '#bcbcbc',
                    strokeOpacity: 0.9,
                    strokeWeight: 4,
                }"
                @click="$emit('route-select', item.originalIndex)"
            />

            <GMapMarker
                v-for="item in currentRoutes"
                :key="`route-duration-${item.route.id ?? item.originalIndex}`"
                :position="routeMidpoint(item.route)"
                :icon="transparentIcon"
                :label="{
                    text: item.route.duration || '',
                    color: '#d32f2f',
                    fontWeight: '800',
                    fontSize: '13px',
                }"
                :clickable="false"
            />
        </template>

        <GMapMarker
            v-if="destinationCoordinate"
            :position="destinationCoordinate"
            :icon="destinationIcon"
            :label="destinationLabel"
        />

        <GMapMarker
            v-if="currentCoordinate"
            :position="currentCoordinate"
            :icon="positionIcon('#33BBFF')"
            :clickable="false"
        />

        <GMapMarker
            v-for="(location, index) in validSharedLocations"
            :key="`shared-location-${index}`"
            :position="location"
            :icon="positionIcon(sharedLocationColors[index % sharedLocationColors.length] || '#43a047')"
            :clickable="false"
        />
    </GMapMap>
</template>

<script>
import { defineComponent, nextTick } from 'vue';
import {
    alertDefinition,
    displayedRoutes,
    formatAlertTime,
    pointLabel,
    toCoordinateArray,
    toGoogleCoordinate,
} from './mapSurfaceUtils.js';

const svgDataUrl = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export default defineComponent({
    name: 'GoogleMapSurface',
    emits: ['ready', 'route-select', 'alert-select'],
    props: {
        center: { type: [Array, Object], required: true },
        zoom: { type: Number, default: 11 },
        origin: { type: Object, required: true },
        destination: { type: Object, required: true },
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
            ready: false,
            alertIconCache: {},
            positionIconCache: {},
            mapOptions: {
                zoomControl: false,
                mapTypeControl: false,
                scaleControl: false,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: false,
            },
            transparentIcon: {
                url: svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'),
                scaledSize: { width: 1, height: 1 },
            },
            destinationIcon: {
                url: svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="5" fill="white" stroke="black" stroke-width="2"/></svg>'),
                scaledSize: { width: 16, height: 16 },
                anchor: { x: 8, y: 8 },
                labelOrigin: { x: 8, y: 26 },
            },
        };
    },
    computed: {
        googleCenter() {
            return toGoogleCoordinate(this.center) || { lat: -12.7850694, lng: 45.1658908 };
        },
        originCoordinate() {
            return toGoogleCoordinate(this.origin);
        },
        destinationCoordinate() {
            return toGoogleCoordinate(this.destination);
        },
        currentCoordinate() {
            return toGoogleCoordinate(this.currentLocation);
        },
        originLabel() {
            return pointLabel(this.origin);
        },
        destinationLabel() {
            return pointLabel(this.destination);
        },
        renderedRoutes() {
            return displayedRoutes(this.routes);
        },
        currentRoutes() {
            return this.renderedRoutes.filter((item) => item.route.current && this.routeMidpoint(item.route));
        },
        validSharedLocations() {
            return this.sharedLocations
                .map((location) => toGoogleCoordinate(location))
                .filter(Boolean);
        },
        validAlerts() {
            return this.alerts
                .map((alert) => ({
                    id: alert.id,
                    value: alert,
                    coordinate: toGoogleCoordinate(alert),
                    definition: alertDefinition(alert, this.alertTypes),
                }))
                .filter((alert) => alert.coordinate);
        },
    },
    watch: {
        routes() {
            this.fitRouteBounds();
        },
    },
    methods: {
        formatAlertTime,
        googleRoute(route) {
            return (route.polylineDecoded || [])
                .map((point) => toGoogleCoordinate(point))
                .filter(Boolean);
        },
        routeMidpoint(route) {
            const points = this.googleRoute(route);
            return points.length ? points[Math.floor(points.length / 2)] : null;
        },
        alertIcon(alert) {
            const definition = alertDefinition(alert, this.alertTypes);
            const cacheKey = `${alert.type}-${definition.color}-${definition.abbr}`;
            if (!this.alertIconCache[cacheKey]) {
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38"><rect x="2" y="2" width="34" height="34" rx="12" fill="${definition.color}" stroke="white" stroke-width="2"/><text x="19" y="25" text-anchor="middle" font-size="18" font-family="Arial" font-weight="700" fill="white">${definition.abbr}</text></svg>`;
                this.alertIconCache[cacheKey] = {
                    url: svgDataUrl(svg),
                    scaledSize: { width: 38, height: 38 },
                    anchor: { x: 19, y: 19 },
                };
            }
            return this.alertIconCache[cacheKey];
        },
        positionIcon(color) {
            const safeColor = /^#[0-9a-f]{3,8}$/i.test(color || '') ? color : '#43a047';
            if (!this.positionIconCache[safeColor]) {
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><circle cx="11" cy="11" r="9" fill="${safeColor}" fill-opacity="0.7" stroke="white" stroke-width="2"/></svg>`;
                this.positionIconCache[safeColor] = {
                    url: svgDataUrl(svg),
                    scaledSize: { width: 22, height: 22 },
                    anchor: { x: 11, y: 11 },
                };
            }
            return this.positionIconCache[safeColor];
        },
        handleReady() {
            if (this.ready) {
                return;
            }
            this.ready = true;
            this.$emit('ready');
            this.fitRouteBounds();
        },
        async fitRouteBounds() {
            if (!this.ready || !window.google?.maps) {
                return;
            }
            await nextTick();
            const map = await this.$refs.mapRef?.$mapPromise;
            if (!map) {
                return;
            }
            const coordinates = [
                toCoordinateArray(this.origin),
                toCoordinateArray(this.destination),
                ...this.routes.flatMap((route) => route.polylineDecoded || []).map(toCoordinateArray),
            ].filter(Boolean);
            if (coordinates.length < 2) {
                return;
            }
            const bounds = new window.google.maps.LatLngBounds();
            coordinates.forEach(([latitude, longitude]) => bounds.extend({ lat: latitude, lng: longitude }));
            map.fitBounds(bounds, 18);
        },
    },
});
</script>

<style scoped>
.mae-map-surface {
    width: 100%;
    height: 100%;
}
</style>
