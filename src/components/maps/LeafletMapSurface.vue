<style lang="scss">
.mae-map-surface {
    width: 100%;
    height: 100%;

    .leaflet-control-zoom {
        display: none;
    }

    .alert-marker-wrapper {
        background: transparent;
        border: 0;

        .alert-marker {
            width: 38px;
            height: 38px;
            border-radius: 14px;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--alert-color, #ff9800);
            border: 2px solid #fff;
            box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);

            .mdi {
                font-size: 20px;
                line-height: 1;
            }
        }
    }

    .alert-tooltip {
        font-size: 12px;
    }
}
</style>

<template>
    <l-map
        ref="mapRef"
        class="mae-map-surface"
        :zoom="zoom"
        :center="leafletCenter"
        @ready="handleReady"
    >
        <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
        />

        <l-polygon v-for="zone in zonePolygons" :key="zone.key"
            :lat-lngs="zone.leafletPaths" :color="zone.color" :weight="zone.weight" :opacity="zone.strokeOpacity"
            :fill-color="zone.color" :fill-opacity="zone.fillOpacity" :interactive="false" />

        <l-marker v-if="originCoordinate" :lat-lng="originCoordinate">

        </l-marker>

        <l-marker
            v-for="alert in validAlerts"
            :key="`alert-${alert.id}`"
            :lat-lng="alert.coordinate"
            :icon="alertIcon(alert.value)"
            @click="$emit('alert-select', alert.value)"
        >
            <l-tooltip :options="{ direction: 'top', offset: [0, -10] }">
                <div class="alert-tooltip">
                    <strong>{{ alert.definition.label }}</strong><br>
                    Signalé à {{ formatAlertTime(alert.value.createdAt) }} h<br>
                    Expire à {{ formatAlertTime(alert.value.expiresAt) }} h
                </div>
            </l-tooltip>
        </l-marker>

        <template v-if="routeAvailable">
            <l-polyline
                v-for="item in renderedRoutes"
                :key="`route-outline-${item.route.id ?? item.originalIndex}`"
                :lat-lngs="item.route.polylineDecoded"
                :color="item.route.current ? '#1b79cc' : '#838383'"
                :weight="8"
            >
                <l-tooltip
                    v-if="item.route.current"
                    :options="{ permanent: true, interactive: false, direction: 'right', offset: [10, 0] }"
                >
                    <span class="route-duration">{{ item.route.duration }}</span>
                </l-tooltip>
            </l-polyline>

            <l-polyline
                v-for="item in renderedRoutes"
                :key="`route-line-${item.route.id ?? item.originalIndex}`"
                :lat-lngs="item.route.polylineDecoded"
                :color="item.route.current ? '#01a9e8' : '#bcbcbc'"
                :weight="4"
                @click="$emit('route-select', item.originalIndex)"
            />
        </template>

        <l-circle-marker
            v-if="destinationCoordinate"
            :lat-lng="destinationCoordinate"
            :radius="5"
            :weight="2"
            color="black"
            fill-color="white"
            :fill-opacity="1"
        >
            <l-tooltip :options="{ permanent: true, interactive: false, direction: 'right', offset: [10, 0] }">
                <strong>{{ destinationLabel }}</strong>
            </l-tooltip>
        </l-circle-marker>

        <l-circle-marker
            v-if="actorMarkers === null && currentCoordinate"
            :lat-lng="currentCoordinate"
            :radius="9"
            :weight="2"
            color="white"
            fill-color="#33BBFF"
            :fill-opacity="0.7"
        />

        <l-circle-marker
            v-for="(location, index) in (actorMarkers === null ? validSharedLocations : [])"
            :key="`shared-location-${index}`"
            :lat-lng="location"
            :radius="9"
            :weight="2"
            color="white"
            :fill-color="sharedLocationColors[index % sharedLocationColors.length] || '#43a047'"
            :fill-opacity="0.7"
        />
        <l-marker v-for="actor in actorAssets" :key="`actor-${actor.id}`" :lat-lng="actor.latLng"
            :icon="actorLeafletIcon(actor)" :options="{ title: actor.label, alt: actor.label, keyboard: true }">
            <l-tooltip>{{ actor.label }}</l-tooltip>
        </l-marker>
    </l-map>
</template>

<script>
import { defineComponent, nextTick } from 'vue';
import { actorMarkerAsset } from './tripActorMarkers.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    LCircleMarker,
    LMap,
    LMarker,
    LPolyline,
    LPolygon,
    LTileLayer,
    LTooltip,
} from '@vue-leaflet/vue-leaflet';
import {
    alertDefinition,
    displayedRoutes,
    formatAlertTime,
    pointLabel,
    toCoordinateArray,
} from './mapSurfaceUtils.js';

import { villageZonePolygons } from './villageZoneUtils.js';

export default defineComponent({
    name: 'LeafletMapSurface',
    components: {
        LCircleMarker,
        LMap,
        LMarker,
        LPolyline,
        LPolygon,
            LTileLayer,
        LTooltip,
    },
    emits: ['ready', 'route-select', 'alert-select'],
    props: {
        actorMarkers: { type: Array, default: null },
        bottomPadding: { type: Number, default: 24 },
        villageZones: { type: Array, default: () => [] },
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
            ready: false,
            alertIconCache: {},
        };
    },
    computed: {
        zoneGeometryKey() { return this.zonePolygons.map(zone => zone.key).join(':'); },
        routeBoundsKey() { const route = this.routes.find(route => route.current) || this.routes[0]; return JSON.stringify(route ? [route.id, route.originalPolyline || route.polylineDecoded] : []); },
        actorAssets() { return (this.actorMarkers || []).map(actor => ({ ...actor, asset: actorMarkerAsset(actor) })); },
        zonePolygons() { return villageZonePolygons(this.villageZones); },
        leafletCenter() {
            return toCoordinateArray(this.center) || [-12.7850694, 45.1658908];
        },
        originCoordinate() {
            return toCoordinateArray(this.origin);
        },
        destinationCoordinate() {
            return toCoordinateArray(this.destination);
        },
        currentCoordinate() {
            return toCoordinateArray(this.currentLocation);
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
        validSharedLocations() {
            return this.sharedLocations
                .map((location) => toCoordinateArray(location))
                .filter(Boolean);
        },
        validAlerts() {
            return this.alerts
                .map((alert) => ({
                    id: alert.id,
                    value: alert,
                    coordinate: toCoordinateArray(alert),
                    definition: alertDefinition(alert, this.alertTypes),
                }))
                .filter((alert) => alert.coordinate);
        },
    },
    watch: {
        bottomPadding() { this.fitRouteBounds(); },
        zoneGeometryKey() { this.fitRouteBounds(); },
        origin() { this.fitRouteBounds(); },
        destination() { this.fitRouteBounds(); },
        routeBoundsKey() { this.fitRouteBounds(); },
    },
    methods: {
        actorLeafletIcon(actor) { return L.icon({ iconUrl: actor.asset.url, iconSize: [actor.asset.size, actor.asset.size], iconAnchor: [actor.asset.anchor, actor.asset.anchor] }); },
        formatAlertTime,
        handleReady() {
            if (this.ready) {
                return;
            }
            this.ready = true;
            this.$emit('ready');
            this.fitRouteBounds();
        },
        alertIcon(alert) {
            const definition = alertDefinition(alert, this.alertTypes);
            const cacheKey = `${alert.type}-${definition.color}-${definition.icon}`;
            if (!this.alertIconCache[cacheKey]) {
                this.alertIconCache[cacheKey] = L.divIcon({
                    className: 'alert-marker-wrapper',
                    html: `<div class="alert-marker" style="--alert-color:${definition.color};"><span class="mdi ${definition.icon}"></span></div>`,
                    iconSize: [38, 38],
                    iconAnchor: [19, 19],
                });
            }
            return this.alertIconCache[cacheKey];
        },
        async fitRouteBounds() {
            if (!this.ready) {
                return;
            }
            await nextTick();
            const route = this.routes.find(route => route.current) || this.routes[0];
            const routePoints = route?.originalPolyline || route?.polylineDecoded || [];
            const zonePoints = this.zonePolygons.flatMap(zone => zone.leafletPaths.flat());
            const bounds = [this.originCoordinate, this.destinationCoordinate, ...routePoints, ...zonePoints]
                .map((point) => toCoordinateArray(point))
                .filter(Boolean);
            if (bounds.length >= 2 && this.$refs.mapRef?.leafletObject) {
                this.$refs.mapRef.leafletObject.fitBounds(bounds, { paddingTopLeft: [24, 90], paddingBottomRight: [24, this.bottomPadding] });
            }
        },
    },
});
</script>

<style scoped>
.route-duration {
    color: #d32f2f;
    font-weight: 800;
}
</style>
