
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

        <!-- L-map -->
        <l-map 
            id="map-id" 
            :zoom="zoom" 
            :center="center" 
            @ready="isLoaded()" 
            ref="mapRef"
        >            
            <!-- <l-tile-layer url="https://api.maptiler.com/maps/winter-v2/{z}/{x}/{y}.png?key=faY6afh2tnFprZqdoyZP"/> -->
            <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>


            <!-- origin -->
            <l-marker 
                :lat-lng="itineraire.origin.location.latLng.latLngTab"
            >
                <l-popup>{{ itineraire.origin.infos.village }}, ({{ itineraire.origin.infos.commune }})</l-popup>
            </l-marker>

            <l-marker
                v-for="alert in activeAlerts"
                :key="`alert-${alert.id}`"
                :lat-lng="alert.coordinates"
                :icon="resolveAlertIcon(alert.type)"
            >
                <l-tooltip :options="{ direction: 'top', offset: [0, -10] }">
                    <div class="alert-tooltip">
                        <strong>{{ alertLabel(alert.type) }}</strong><br>
                        Signalé à {{ formatAlertCreation(alert.createdAt) }} h<br>
                        Expire à {{ formatAlertExpiration(alert.expiresAt) }} h
                    </div>
                </l-tooltip>
            </l-marker>

            <!-- route -->
            <div v-if="routeAvail">
                <l-polyline 
                    v-for="(route, index) in routes.slice().reverse()"
                    :key="route.id"
                    :lat-lngs="route.polylineDecoded" 
                    :color="index == routes.length - 1 ? '#1b79cc' : '#838383'" 
                    :weight="8"
                >
                    <l-tooltip
                        v-if="route.current"
                        :options="{ permanent: true, interactive: false, direction: 'right', offset: [10, 0] }"
                    >
                        <span :style="{'font-weight': 800, color: 'red' }"> {{ route.duration }} </span>
                    </l-tooltip>  
                </l-polyline>

                <l-polyline 
                    v-for="(route, index) in routes.slice().reverse()"
                    :key="index"
                    :lat-lngs="route.polylineDecoded" 
                    :color="index == routes.length - 1 ? '#01a9e8' : '#bcbcbc'" 
                    :weight="4"
                    @click="trajetSelected(index)"
                />

                <!-- point -->
                <l-circle-marker 
                    :lat-lng="itineraire.destination.location.latLng.latLngTab"
                    :radius="5"
                    :weight="2"
                    :color="'black'"
                    :fillColor="'white'" 
                    :fillOpacity="1"
                >
                    <!-- <l-popup>{{ itineraire.destination.infos.village }}, ({{ itineraire.destination.infos.commune }})</l-popup> -->
                    <l-tooltip :options="{ permanent: true, interactive: false, direction: 'right', offset: [10, 0] }">
                        <span style="font-weight: bold;"> {{ itineraire.destination.infos.village }} </span>, ({{ itineraire.destination.infos.commune }})
                        <!-- <br>
                        <span style="font-weight: bold; color:green;">{{ itin.duration }}</span> 
                        <br> 
                        <span style="font-weight: bold; color: chocolate;"> {{ itin.distance }}</span> km -->
                    </l-tooltip>
                </l-circle-marker>
            </div>

            <!-- point-dest -->
            <l-circle-marker 
                v-if="!routeAvail"
                :lat-lng="itineraire.destination.location.latLng.latLngTab"
                :radius="5"
                :weight="2"
                :color="'black'"
                :fillColor="'white'" 
                :fillOpacity="1"
                style="z-index: 999;"
            >
                <!-- <l-popup>{{ itineraire.destination.infos.village }}, ({{ itineraire.destination.infos.commune }})</l-popup> -->
                <l-tooltip :options="{ permanent: true, interactive: false, direction: 'right', offset: [10, 0] }">
                    <span style="font-weight: bold;"> {{ itineraire.destination.infos.village }} </span>, ({{ itineraire.destination.infos.commune }})
                    <!-- <br>
                    <span style="font-weight: bold; color:green;">{{ itin.duration }}</span> 
                    <br> 
                    <span style="font-weight: bold; color: chocolate;"> {{ itin.distance }}</span> km -->
                </l-tooltip>
            </l-circle-marker>

            <!-- point-dest -->
            <l-circle-marker 
                v-if="currentLocation.current.length >= 2"
                :lat-lng="currentLocation.current"
                :radius="9"
                :weight="2"
                :color="'white'"
                :fillColor="'#33BBFF'" 
                :fillOpacity="0.7"
                style="z-index: 9999;"
            >
            </l-circle-marker>
        </l-map>
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
    import polyline from '@mapbox/polyline';

    import supabase from '@/utils/supabaseClient.js';

    import L from "leaflet";
    
    import "leaflet/dist/leaflet.css";
    import { LMap, LTileLayer, LMarker, LPopup, LPolyline, LTooltip, LCircleMarker } from "@vue-leaflet/vue-leaflet";
    import { SafeAreaController } from '@aashu-dubey/capacitor-statusbar-safe-area';
    // import $ from 'jquery';
    
    //componants
    import BottomMenu from '../menus/BottomMenu.vue';

    export default defineComponent({
        name: 'results-view',
        emits: ["trajet-selected"],
        computed: {
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
            LMap,
            LTileLayer,
            LMarker,
            LPopup,
            LPolyline,
            LTooltip,
            LCircleMarker,
            BottomMenu,
        },
        props: {
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
                currentLocation: {
                    current: [],
                    passedPoints: [],
                },
                alertTypes: [
                    { value: 'traffic', label: 'Bouchon', color: '#ff9800', abbr: 'B' },
                    { value: 'danger', label: 'Menace', color: '#d32f2f', abbr: '!' },
                    { value: 'works', label: 'Travaux', color: '#ffa726', abbr: 'T' },
                    { value: 'weather', label: 'Intempérie', color: '#4fc3f7', abbr: '~' },
                ],
                activeAlerts: [],
                alertDurationMs: 60 * 60 * 1000,
                alertCleanupTimer: null,
                alertChannel: null,
                alertIconCache: {},
            }
        },
        mounted(){
            SafeAreaController.injectCSSVariables();
            console.log("itineraire", this.itineraire);
            this.$refs.BottomMenuRef.open();
            this.initializeAlertSync();
        },
        beforeUnmount(){
            this.stopAlertCleanupTimer();
            this.unsubscribeAlertChannel();
        },
        methods: {
            trajetSelected(index){
                // console.log("trajetSelectd", index)
                if(index == this.routes.length - 1){
                    this.$emit("trajet-selected");
                }
                else{
                    this.overlayLoad = true;

                    setTimeout(function(){
                        this.routeAvail = false;
                        this.routes = this.swapWithLast(this.routes, index);
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
            getRouteInfos(){
                this.overlayLoad = true;
                fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': process.env.VUE_APP_API_GOOGLE_ROUTE_API_KEY,
                        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
                    },
                    body: JSON.stringify({
                        origin: {
                            location: {
                                latLng: {
                                    latitude: this.itineraire.origin.location.latLng.latitude,
                                    longitude: this.itineraire.origin.location.latLng.longitude
                                }
                            }
                        },
                        destination: {
                            location: {
                                latLng: {
                                    latitude: this.itineraire.destination.location.latLng.latitude,
                                    longitude: this.itineraire.destination.location.latLng.longitude,
                                }
                            }
                        },
                        travelMode: 'DRIVE',
                        routingPreference: 'TRAFFIC_AWARE',
                        departureTime: this.itineraire.departureTime,
                        computeAlternativeRoutes: true,
                        routeModifiers: {
                            avoidTolls: true,
                            avoidHighways: true,
                            avoidFerries: true
                        },
                        languageCode: 'en-US',
                        units: 'IMPERIAL'
                    }),
                }).then(response => response.json()).then(data => { 
                    console.log(data);

                    this.routeAvail = false;

                    var tmp_routes = [];
                    var first = true;
                    for(const route in data.routes){
                        const decoded  = polyline.decode(data.routes[route].polyline.encodedPolyline);
                        const duration = (this.convertSecondsToHoursAndMinutes(parseInt(data.routes[route].duration.replaceAll("s", "")))).toString();
                        const distance = (data.routes[route].distanceMeters/1000).toFixed(2).toString();

                        tmp_routes.push({
                            id: route, 
                            polylineDecoded: decoded, 
                            infosGoogle: data.routes[route], 
                            duration: duration, 
                            distance: distance, 
                            faster: first,
                            current: first,
                        });
                        
                        if(route == 0){
                            this.itin.duration = duration;
                            this.itin.distance = distance;
                        }
                        first = false;
                    }

                    this.routeAvail = true;
                    console.log("Avail", this.itineraire);

                    this.routes = tmp_routes;
                    this.overlayLoad = false;
                    
                }).catch(error => {
                    console.error(error);
                    console.log("Error", error.message);

                    this.overlayLoad = false;
                });
            },
            getCurrentRouteInfos(){
                this.overlayLoad = true;
                fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': process.env.VUE_APP_API_GOOGLE_ROUTE_API_KEY,
                        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
                    },
                    body: JSON.stringify({
                        origin: {
                            location: {
                                latLng: {
                                    latitude: this.currentLocation.current[0],
                                    longitude: this.currentLocation.current[1],
                                }
                            }
                        },
                        destination: {
                            location: {
                                latLng: {
                                    latitude:  43.60460024300767,
                                    longitude: 3.8807644833742567,
                                }
                            }
                        },
                        travelMode: 'DRIVE',
                        routingPreference: 'TRAFFIC_AWARE',
                        computeAlternativeRoutes: true,
                        routeModifiers: {
                            avoidTolls: true,
                            avoidHighways: true,
                            avoidFerries: true
                        },
                        languageCode: 'en-US',
                        units: 'IMPERIAL'
                    }),
                }).then(response => response.json()).then(data => { 
                    console.log(data);

                    this.routeAvail = false;

                    var tmp_routes = [];
                    var first = true;
                    for(const route in data.routes){
                        const decoded  = polyline.decode(data.routes[route].polyline.encodedPolyline);
                        const duration = (this.convertSecondsToHoursAndMinutes(parseInt(data.routes[route].duration.replaceAll("s", "")))).toString();
                        const distance = (data.routes[route].distanceMeters/1000).toFixed(2).toString();

                        tmp_routes.push({
                            id: route, 
                            polylineDecoded: decoded, 
                            infosGoogle: data.routes[route], 
                            duration: duration, 
                            distance: distance, 
                            faster: first,
                            current: first,
                        });
                        
                        if(route == 0){
                            this.itin.duration = duration;
                            this.itin.distance = distance;
                        }
                        first = false;
                    }

                    this.routeAvail = true;
                    console.log("Avail", this.itineraire, tmp_routes);

                    this.routes = tmp_routes.slice(0, 1);
                    this.overlayLoad = false;
                    
                }).catch(error => {
                    console.error(error);
                    console.log("Error", error.message);

                    this.overlayLoad = false;
                });
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
                //const bounds = [this.itineraire.origin.location.latLng.latLngTab, this.itineraire.destination.location.latLng.latLngTab]
                // if(this.$refs.mapRef){
                //     this.$refs.mapRef.leafletObject.fitBounds(bounds, {
                //         padding: [18, 18] // padding en pixels autour des limites.
                //     });
                // }
                
                this.getRouteInfos();
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
                this.subscribeToAlertChannel();
            },
            async fetchRemoteAlerts(){
                try{
                    const { data, error } = await supabase
                        .from('road_alert')
                        .select('*')
                        .gt('expires_at', new Date().toISOString())
                        .order('created_at', { ascending: true });
                    if( error ){
                        throw error;
                    }
                    const alerts = (data || []).map((row) => this.mapAlertRow(row));
                    this.activeAlerts = alerts;
                    if( alerts.length ){
                        this.startAlertCleanupTimer();
                    }
                }
                catch(error){
                    console.error("fetchRemoteAlerts error", error);
                }
            },
            subscribeToAlertChannel(){
                this.unsubscribeAlertChannel();
                this.alertChannel = supabase.channel('road_alert_global');

                this.alertChannel.on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'road_alert' },
                    (payload) => {
                        if( payload?.new ){
                            const alert = this.mapAlertRow(payload.new);
                            this.addOrReplaceAlert(alert);
                        }
                    }
                );

                this.alertChannel.on(
                    'postgres_changes',
                    { event: 'DELETE', schema: 'public', table: 'road_alert' },
                    (payload) => {
                        const alertId = payload?.old?.id;
                        if( alertId ){
                            this.removeAlertById(alertId);
                        }
                    }
                );

                this.alertChannel.subscribe();
            },
            unsubscribeAlertChannel(){
                if( this.alertChannel ){
                    this.alertChannel.unsubscribe();
                    this.alertChannel = null;
                }
            },
            mapAlertRow(row){
                if( !row ){
                    return null;
                }
                return {
                    id: row.id,
                    type: row.alert_type,
                    coordinates: [row.lat, row.lng],
                    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
                    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : Date.now() + this.alertDurationMs,
                    accountId: row.account_id || null,
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
