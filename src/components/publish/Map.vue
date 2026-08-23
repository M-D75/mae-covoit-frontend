
<style lang="scss" model>
    .cont-map {
        .menu {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 9px;
            z-index: 999;
            // natif notif safe-zone
            // padding-top: var(--safe-area-inset-top);
            margin-top: var(--safe-area-inset-top);
            &.rigth {
                right: 15px;
            }
            &.left {
                left: 15px;
            }

            .v-btn {
                margin: 7px 0;
                background-color: var(--white-bg-color);
                color: var(--font-color-label);
            }
        }

        .leaflet-control-zoom {
            display: none;
        }

        .overlay-load {
            z-index: 9999;
        }

        .routing-error {
            position: absolute;
            top: calc(75px + var(--safe-area-inset-top));
            left: 16px;
            right: 16px;
            z-index: 1000;
        }
    }
</style>


<template>
    <div class="cont-map" style="height: 100vh; width: 100%">

        <!-- Menu -->
        <div class="menu rigth">
            <v-btn
                v-if="routes.length > 1"
                icon="mdi-map-marker-path"
                :disabled="routes.length <= 1"
                @click="swapRoute()"  
            />
            <v-btn 
                icon="mdi-check-bold"
                @click="$emit('trajet-selected')"
            />
        </div>

        <div class="menu left">
            <v-btn 
                v-if="!open_b"
                icon="mdi-information-slab-circle-outline"
                @click="openBottomMenuInfos()"
            />
        </div>

        <v-alert
            v-if="routingErrorMessage"
            class="routing-error"
            type="error"
            variant="tonal"
            closable
            @click:close="routingErrorMessage = ''"
        >
            {{ routingErrorMessage }}
        </v-alert>

        <!-- Le contrôleur métier reste identique ; seul le moteur de rendu change. -->
        <MapSurface
            :provider="mapProvider"
            :zoom="zoom"
            :center="center"
            :origin="itineraire.origin"
            :destination="itineraire.destination"
            :routes="routes"
            :route-available="routeAvail"
            :current-location="currentLocation.current"
            :alerts="activeAlerts"
            :alert-types="alertTypes"
            @ready="isLoaded"
            @route-select="trajetSelected"
        />
    </div>

    <BottomMenu
        mode="map"
        :class-name="['map']"
        :map-infos="{
                time: itin.duration,
                distance: `${itin.distance} km`, 
                infosSup: routes.length > 0 && routes[0].faster ? 'Le plus rapide selon l\'etat actuel de la circulation' : '',
                depart: itineraire.origin.infos.village,
                destination: itineraire.destination.infos.village,
            }"
        ref="BottomMenuRef"
        v-on:close="open_b = false"
        v-on:opened="open_b = true"
    />

    <!-- Load -->
    <v-overlay
        :model-value="overlayLoad"
        class="overlay-load align-center justify-center"
    >
        <v-progress-circular
            color="black"
            indeterminate
            size="64"
        />
    </v-overlay>


</template>

<script>
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';
    import io from 'socket.io-client';

    import { createSocketAuth, getServerUrl, serverRequest } from '@/utils/serverApi.js';
    import { calculateRoutes } from '@/services/routingService.js';

    import L from "leaflet";
    import { SafeAreaController } from '@aashu-dubey/capacitor-statusbar-safe-area';
    // import $ from 'jquery';
    
    //componants
    import BottomMenu from '../menus/BottomMenu.vue';
    import MapSurface from '@/components/maps/MapSurface.vue';

    export default defineComponent({
        name: 'results-view',
        emits: ["trajet-selected"],
        computed: {
            ...mapState("profil", ["modeCo"]),
            center() {
                // const latitudes =  [this.itineraire.origin.location.latLng.latitude, this.itineraire.destination.location.latLng.latitude];
                // const longitudes = [this.itineraire.origin.location.latLng.longitude, this.itineraire.destination.location.latLng.longitude];
                // const minLat = Math.min(...latitudes);
                // const maxLat = Math.max(...latitudes);
                // const minLon = Math.min(...longitudes);
                // const maxLon = Math.max(...longitudes);
                // console.log("min-max", [(minLat + maxLat) / 2, (minLon + maxLon) / 2]);
                // return [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
                //return [ -12.830601788401163, 45.14134475613337 ];
                if(this.routes.length == 0){
                    return [ -12.7850694, 45.1658908 ]
                }
                const polylinePoints = this.routes.slice().reverse()[this.routes.length - 1].polylineDecoded // Vous devrez remplir ceci en fonction de vos données


                const latitudes = [
                    this.itineraire.origin.location.latLng.latitude, 
                    this.itineraire.destination.location.latLng.latitude,
                    ...polylinePoints.map(point => point[0])
                ];
                const longitudes = [
                    this.itineraire.origin.location.latLng.longitude, 
                    this.itineraire.destination.location.latLng.longitude,
                    ...polylinePoints.map(point => point[1])
                ];
                const minLat = Math.min(...latitudes);
                const maxLat = Math.max(...latitudes);
                const minLon = Math.min(...longitudes);
                const maxLon = Math.max(...longitudes);

                return [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
            },
        },
        components: {
            BottomMenu,
            MapSurface,
        },
        props: {
            mapProvider: {
                type: String,
                default: '',
            },
            itineraire: {
                type: Object,
                default: () => {
                    return {
                        origin: {
                            location: {
                                latLng: {
                                    latitude: -12.7243245,
                                    longitude: 45.0589372,
                                    latLngTab: [-12.7243245, 45.0589372]
                                }
                            },
                            infos: {
                                village: "Acoua",
                                commune: "Acoua",
                            }
                        },
                        destination: {
                            location: {
                                latLng: {
                                    latitude: -12.9292776,
                                    longitude: 45.1763906,
                                    latLngTab: [-12.9292776, 45.1763906]
                                }
                            },
                            infos: {
                                village: "Bambo-Est",
                                commune: "Bandrélé",
                            }
                        },
                    }
                }
            },
        },
        data() {
            return {
                open_b: true, //open bottom menu
                overlayLoad: false,
                zoom: 11,
                routes: [],
                customIcon: L.icon({
                    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Map-circle-black.svg/2048px-Map-circle-black.svg.png', // Remplacez cela par le chemin d'accès ou l'URL de l'image
                    iconSize: [12, 12], // Taille de l'icône. Cette valeur dépend de la taille de  l'image.
                    iconAnchor: [6, 6], // Point de l'icône qui correspondra géographiquement au point de coordonnées. Cette valeur dépend de la taille de l'image.
                    popupAnchor: [-3, -3] // Point à partir duquel le popup devrait s'ouvrir, relativement à l'iconAnchor.
                }),
                itin: {
                    duration: "33",
                    distance: "100",
                    faster: true,
                },
                infosItin: [],
                routeAvail: false,
                routingErrorMessage: '',
                currentLocation: {
                    current: [],
                    passedPoints: [],
                },
                alertTypes: [
                    { value: 'traffic', label: 'Bouchon', color: '#ff9800', abbr: 'B' },
                    { value: 'danger', label: 'Menace', color: '#d32f2f', abbr: '!' },
                    { value: 'works', label: 'Travaux', color: '#ffa726', abbr: 'T' },
                    { value: 'weather', label: 'Intempérie', color: '#4fc3f7', abbr: '~' },
                    { value: 'obstacle', label: 'Obstacle', color: '#8e24aa', abbr: '!' },
                ],
                activeAlerts: [],
                alertDurationMs: 60 * 60 * 1000,
                alertCleanupTimer: null,
                alertSocket: null,
                alertIconCache: {},
            }
        },
        mounted(){
            SafeAreaController.injectCSSVariables();
            console.log("itineraire", this.itineraire);
            this.$refs.BottomMenuRef.open();
            this.alertSocket = io(getServerUrl(this.modeCo), {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 60,
                auth: createSocketAuth(),
            });
            this.alertSocket.on('road-alerts:changed', () => this.fetchRemoteAlerts());
            this.initializeAlertSync();
            // Une route calculée avant la fin du chargement de la carte sera dessinée
            // dès que Leaflet ou Google Maps sera prêt.
            this.$nextTick(() => this.getRouteInfos());
        },
        beforeUnmount(){
            this.stopAlertCleanupTimer();
            if(this.alertSocket){
                this.alertSocket.off('road-alerts:changed');
                this.alertSocket.disconnect();
                this.alertSocket = null;
            }
        },
        methods: {
            trajetSelected(index){
                const selectedRoute = this.routes[index];
                if( !selectedRoute ){
                    return;
                }
                if( selectedRoute.current ){
                    this.$emit("trajet-selected");
                }
                else{
                    this.overlayLoad = true;

                    setTimeout(function(){
                        this.routeAvail = false;
                        this.routes = [
                            selectedRoute,
                            ...this.routes.filter((route) => route !== selectedRoute),
                        ];
                        this.itin.duration = this.routes[0].duration;
                        this.itin.distance = this.routes[0].distance;
                        
                        this.routes.map((route) => (route.current = false))
                        this.routes[0].current = true;
                        this.routeAvail = true;

                        this.overlayLoad = false;
                    }.bind(this), 500)
                }
            },
            swapRoute() {
                this.overlayLoad = true;

                setTimeout(function(){
                    this.routeAvail = false;
                    this.routes = this.shiftRight(this.routes);
                    this.itin.duration = this.routes[0].duration;
                    this.itin.distance = this.routes[0].distance;
                    
                    this.routes.map((route) => (route.current = false))
                    this.routes[0].current = true;
                    this.routeAvail = true;

                    this.overlayLoad = false;
                }.bind(this), 500); 
            },
            async getRouteInfos(){
                this.overlayLoad = true;
                this.routingErrorMessage = '';
                try {
                    const routes = await calculateRoutes({
                        provider: this.mapProvider,
                        origin: this.itineraire.origin,
                        destination: this.itineraire.destination,
                        departureTime: this.itineraire.departureTime,
                        alternatives: true,
                    });
                    this.routeAvail = false;
                    this.routes = routes;
                    this.itin.duration = routes[0].duration;
                    this.itin.distance = routes[0].distance;
                    this.routeAvail = true;
                }
                catch (error) {
                    console.error(error);
                    this.routeAvail = false;
                    this.routes = [];
                    this.routingErrorMessage = error?.message
                        || "Impossible de calculer l'itinéraire pour le moment.";
                }
                finally {
                    this.overlayLoad = false;
                }
            },
            async getCurrentRouteInfos(){
                this.overlayLoad = true;
                try {
                    const routes = await calculateRoutes({
                        provider: this.mapProvider,
                        origin: this.currentLocation.current,
                        destination: this.itineraire.destination,
                        alternatives: true,
                    });
                    this.routeAvail = false;
                    this.routes = routes.slice(0, 1);
                    this.itin.duration = this.routes[0].duration;
                    this.itin.distance = this.routes[0].distance;
                    this.routeAvail = true;
                }
                catch (error) {
                    console.error(error);
                }
                finally {
                    this.overlayLoad = false;
                }
            },
            swapWithLast(arr, index) {
                if (index < 0 || index >= arr.length) {
                    throw new Error('Index hors limites')
                }

                let temp            = arr[index];
                arr[index]          = arr[arr.length - 1];
                arr[arr.length - 1] = temp;

                return arr;
            },
            shiftRight(arr) {
                var lastElement = arr.pop();
                arr.unshift(lastElement);
                return arr;
            },
            shiftLeft(arr) {
                const firstElement = arr.shift();  
                arr.push(firstElement);          
                return arr;
            },
            isLoaded(){
                // La surface ajuste elle-même les limites. Le calcul est lancé au
                // montage et ne dépend donc plus du timing de cet événement.
            },
            convertSecondsToHoursAndMinutes(seconds) {
                const hours   = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                if(hours > 0){
                    return `${hours} h ${minutes < 10 ? '0' + minutes : minutes} min`;
                }
                else {
                    return `${minutes < 10 ? '0' + minutes : minutes} min`;
                }
            },
            openBottomMenuInfos(){
                if( this.$refs.BottomMenuRef )
                    this.$refs.BottomMenuRef.open();
            },
            alertLabel(type){
                const typeDef = this.alertTypes.find((item) => item.value === type);
                return typeDef ? typeDef.label : "Alerte";
            },
            formatAlertExpiration(timestamp){
                const date = new Date(timestamp);
                return date.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
            },
            formatAlertCreation(timestamp){
                const date = new Date(timestamp);
                return date.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
            },
            resolveAlertIcon(type){
                if( this.alertIconCache[type] ){
                    return this.alertIconCache[type];
                }

                const typeDef = this.alertTypes.find((item) => item.value === type) || this.alertTypes[0];
                this.alertIconCache[type] = L.divIcon({
                    className: 'alert-marker-wrapper',
                    html: `<div class="alert-marker" style="background:${typeDef.color};">${typeDef.abbr || '!'}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                });

                return this.alertIconCache[type];
            },
            startAlertCleanupTimer(){
                if( this.alertCleanupTimer ){
                    return;
                }
                this.alertCleanupTimer = setInterval(() => {
                    this.cleanupExpiredAlerts();
                }, 60000);
            },
            stopAlertCleanupTimer(){
                if( this.alertCleanupTimer ){
                    clearInterval(this.alertCleanupTimer);
                    this.alertCleanupTimer = null;
                }
            },
            cleanupExpiredAlerts(){
                const now = Date.now();
                const filtered = this.activeAlerts.filter((alert) => alert.expiresAt > now);
                if( filtered.length !== this.activeAlerts.length ){
                    this.activeAlerts = filtered;
                }
                if( this.activeAlerts.length === 0 ){
                    this.stopAlertCleanupTimer();
                }
            },
            async initializeAlertSync(){
                await this.fetchRemoteAlerts();
            },
            async fetchRemoteAlerts(){
                try{
                    const response = await serverRequest('get', '/road-alerts', { mode: this.modeCo });
                    const rows = response.data?.data?.alerts || [];
                    const alerts = rows.map((row) => this.mapAlertRow(row)).filter(Boolean);
                    this.activeAlerts = alerts;
                    if( alerts.length ){
                        this.startAlertCleanupTimer();
                    }
                }
                catch(error){
                    console.error("fetchRemoteAlerts error", error);
                }
            },
            mapAlertRow(row){
                if( !row ){
                    return null;
                }
                return {
                    id: row.id,
                    type: row.type || row.alert_type,
                    coordinates: Array.isArray(row.coordinates) ? row.coordinates : [row.lat, row.lng],
                    createdAt: new Date(row.createdAt || row.created_at || Date.now()).getTime(),
                    expiresAt: new Date(row.expiresAt || row.expires_at || Date.now() + this.alertDurationMs).getTime(),
                };
            },
            addOrReplaceAlert(alert){
                if( !alert || alert.expiresAt <= Date.now() ){
                    return;
                }
                const index = this.activeAlerts.findIndex((item) => item.id === alert.id);
                if( index !== -1 ){
                    const updated = [...this.activeAlerts];
                    updated[index] = alert;
                    this.activeAlerts = updated;
                }
                else{
                    this.activeAlerts = [...this.activeAlerts, alert];
                }
                this.startAlertCleanupTimer();
            },
            removeAlertById(alertId){
                const filtered = this.activeAlerts.filter((alert) => alert.id !== alertId);
                if( filtered.length !== this.activeAlerts.length ){
                    this.activeAlerts = filtered;
                }
            },
            formatDate(date) {
                function padTo2Digits(num) {
                    return num.toString().padStart(2, '0');
                }

                function padTo3Digits(num) {
                    return num.toString().padStart(3, '0');
                }

                const year = date.getFullYear();
                const month = padTo2Digits(date.getMonth() + 1);
                const day = padTo2Digits(date.getDate());
                const hours = padTo2Digits(date.getHours());
                const minutes = padTo2Digits(date.getMinutes());
                const seconds = padTo2Digits(date.getSeconds());
                const milliseconds = padTo3Digits(date.getMilliseconds());

                // Pour le fuseau horaire, nous utilisons toISOString et extrayons la partie pertinente
                const timezoneOffset = -date.getTimezoneOffset();
                const sign = timezoneOffset >= 0 ? '+' : '-';
                const offsetHours = padTo2Digits(Math.floor(Math.abs(timezoneOffset) / 60));
                const offsetMinutes = padTo2Digits(Math.abs(timezoneOffset) % 60);

                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}${sign}${offsetHours}${offsetMinutes}`;
            },
        },
        watch: {
        },
    });
</script>
