<style lang="scss" model>
    .cont-map {
        .menu {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 9px;
            z-index: 999;
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
            ></v-btn>
            <v-btn 
                icon="mdi-check-bold"
                @click="$emit('trajet-selected')"
            ></v-btn>
        </div>

        <div class="menu left">
            <v-btn 
                v-if="!open_b"
                icon="mdi-information-slab-circle-outline"
                @click="openBottomMenuInfos()"
            ></v-btn>
        </div>

        <!-- Map -->
        <GMapMap
            :center="center"
            :zoom="11"
            :options="mapOptions"
            style="width: 100vw; height: 100vh"
            @tilesloaded="isLoaded()"
            @click="touch($event)"
        >
            <!-- origin -->
            <GMapMarker
                :position="itineraire.origin.location.latLng.latLngTab"
                :clickable="true"
                :icon= '{
                        url: require("@/assets/icon-only.png"),
                        scaledSize: {width: 50, height: 50},
                        labelOrigin: {x: -5, y: -5},
                    }'
            >
                <GMapInfoWindow>
                    {{ itineraire.origin.infos.village }}, ({{ itineraire.origin.infos.commune }})
                </GMapInfoWindow>
            </GMapMarker>

            <div v-if="routeAvail">

                <GMapPolyline 
                    v-for="(route, index) in routes.reverse()"
                    :key="route.id"
                    :path="route.polylineDecoded"
                    :clickable="true"
                    :options="{
                        strokeColor: index == routes.length - 1 ? '#1b79cc' : '#838383',
                        strokeOpacity: 0.9,
                        strokeWeight: 8,
                    }"
                >
                    <GMapInfoWindow>
                        <span :style="{'font-weight': 800, color: 'red' }"> {{ route.duration }} </span>
                    </GMapInfoWindow>
                </GMapPolyline>

                <GMapPolyline 
                    v-for="(route, index) in routes"
                    :key="index"
                    :path="route.polylineDecoded"
                    :options="{
                        strokeColor: index == routes.length - 1 ? '#01a9e8' : '#bcbcbc',
                        strokeOpacity: 0.9,
                        strokeWeight: 4,
                    }"
                />

                <!-- point-destination -->
                <!-- <GMapMarker
                    :position="itineraire.destination.location.latLng.latLngTab"
                    :clickable="true"
                    :anchorPoint="{x: -10, y: 100}"
                    :icon= '{
                        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Map-circle-black.svg/2048px-Map-circle-black.svg.png",
                        scaledSize: {width: 10, height: 10},
                        labelOrigin: {x: -5, y: -5},
                    }'
                >
                    <GMapInfoWindow>
                        <span style="font-weight: bold;"> {{ itineraire.destination.infos.village }} </span>, ({{ itineraire.destination.infos.commune }})
                    </GMapInfoWindow>
                    <v-icon color="orange">mdi-message-alert</v-icon>
                </GMapMarker> -->

                <GMapMarker
                    v-for="(marker, index) in alert.groupMark"
                    :key="index"
                    :position="marker"
                    :clickable="true"
                    :anchorPoint="{x: -10, y: 100}"
                    :icon= '{
                        url: require("@/assets/icon-only.png"),
                        scaledSize: {width: 50, height: 50},
                        labelOrigin: {x: -5, y: -5},
                    }'
                >
                    <!-- <GMapInfoWindow>
                        <span style="font-weight: bold;"> {{ itineraire.destination.infos.village }} </span>, ({{ itineraire.destination.infos.commune }})
                    </GMapInfoWindow> -->
                </GMapMarker>
                
            </div>

        </GMapMap>

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
    >
    </BottomMenu>

    <!-- Load -->
    <v-overlay
        :model-value="overlayLoad"
        class="overlay-load align-center justify-center"
    >
        <v-progress-circular
            color="black"
            indeterminate
            size="64"
        ></v-progress-circular>
    </v-overlay>

</template>

<script>
    import polyline from '@mapbox/polyline';
    import { Geolocation } from '@capacitor/geolocation';
    
    // Components
    import BottomMenu from '@/components/menus/BottomMenu.vue';
    // import GmapCustomMarker from 'vue3-gmap-custom-marker';

    export default {
        name: 'App',
        emits: ["trajet-selected"],
        computed: {
            center() {
                const latitudes =  [this.itineraire.origin.location.latLng.latitude, this.itineraire.destination.location.latLng.latitude];
                const longitudes = [this.itineraire.origin.location.latLng.longitude, this.itineraire.destination.location.latLng.longitude];
                const minLat = Math.min(...latitudes);
                const maxLat = Math.max(...latitudes);
                const minLon = Math.min(...longitudes);
                const maxLon = Math.max(...longitudes);
                return this.convertArrayToObject([(minLat + maxLat) / 2, (minLon + maxLon) / 2]);
            },
            faster(){
                return this.routes.length > 0 && this.routes[0].faster;
            },
        },
        components: {
            BottomMenu,
            // 'gmap-custom-marker': GmapCustomMarker,
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
                                    latLngTab: {lat:-12.7243245, lng:45.0589372}
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
                                    latLngTab: {lat:-12.9292776, lng:45.1763906}
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
                mapOptions: {
                    mapId:'b52fd250ff4720fe',
                    zoomControl: false,
                    mapTypeControl: false,
                    scaleControl: false,
                    streetViewControl: false,
                    rotateControl: false,
                    fullscreenControl: false,
                },
                open_b: true, //open bottom menu
                overlayLoad: false,
                zoom: 10,
                routes: [],
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
                alert: {
                    groupMark: [
                    ],
                }
            }
        },
        mounted(){
            this.$refs.BottomMenuRef.open();
        },
        methods: {
            touch(e){
                console.log("e", e, e.latLng);
                this.alert.groupMark.push({lat:e.latLng.lat(), lng:e.latLng.lng()})
            },
            trajetSelected(index){
                // console.log("trajetSelectd", index)
                if(index == this.routes.length - 1){
                    this.$emit("trajet-selected");
                }
                else{
                    this.overlayLoad = true;

                    setTimeout(function(){
                        this.routeAvail = false;
                        this.routes = this.swapWithLast(this.routes.reverse(), index);
                        this.itin.duration = this.routes[0].duration;
                        this.itin.distance = this.routes[0].distance;
                        this.routeAvail = true;

                        this.overlayLoad = false;
                    }.bind(this), 500)
                }
            },
            swapRoute() {
                this.overlayLoad = true;

                setTimeout(function(){
                    this.routeAvail = false;
                    this.routes = this.shiftRight(this.routes.reverse());
                    console.log(this.routes)
                    this.itin.duration = this.routes[0].duration;
                    this.itin.distance = this.routes[0].distance;
                    this.routes.map((route) => (route.current = false))
                    this.routes[0].current = true;
                    this.routeAvail = true;

                    this.overlayLoad = false;
                }.bind(this), 500); 
            },
            getRouteInfos(){
                fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': "AIzaSyCGJAwx8DvEm8JxtfxhLCLtC_mg_jJzUs8",
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
                    console.log(data)

                    this.routes = [];
                    var first = true;
                    for(const route in data.routes){
                        const decoded  = polyline.decode(data.routes[route].polyline.encodedPolyline);
                        const duration = (this.convertSecondsToHoursAndMinutes(parseInt(data.routes[route].duration.replaceAll("s", "")))).toString();
                        const distance = (data.routes[route].distanceMeters/1000).toFixed(2).toString();

                        this.routes.push({
                            id: route, 
                            polylineDecoded: decoded.map(arr => this.convertArrayToObject(arr)), 
                            infosGoogle:data.routes[route], 
                            duration: duration, 
                            distance: distance, 
                            faster: first,
                            current: first,
                        });
                        
                        if(route == 0){
                            console.log("decoded", decoded, decoded.map(arr => this.convertArrayToObject(arr)));
                            this.itin.duration = duration;
                            this.itin.distance = distance;
                        }
                        first = false;
                    }

                    this.routeAvail = true;
                    console.log("Avail", this.itineraire)
                }).catch(error => {
                    console.error(error);
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
            convertArrayToObject(arr) {
                if (arr.length === 2) {
                    return { lat: arr[0], lng: arr[1] };
                } else {
                    return null;
                }
            },
            isLoaded(){
                const bounds = [this.itineraire.origin.location.latLng.latLngTab, this.itineraire.destination.location.latLng.latLngTab]
                if(this.$refs.mapRef){
                    this.$refs.mapRef.leafletObject.fitBounds(bounds, {
                        padding: [18, 18] // padding en pixels autour des limites.
                    });
                }
                
                // this.getRouteInfos();
                this.updateLoc();
            },
            async updateLoc(){
                // Obtention de la position actuelle
                const coordinates = await Geolocation.getCurrentPosition();
                const { latitude, longitude } = coordinates.coords;
                //console.log("localisation", latitude, longitude, this.itineraire.destination.location.latLng.latLngTab);
                const bounds = [[latitude, longitude], [43.60461578085957, 3.880710839194244]]
                if(this.$refs.mapRef){
                    this.currentLocation.current = [latitude, longitude];
                    this.$refs.mapRef.leafletObject.fitBounds(bounds, {
                        padding: [18, 18] // padding en pixels autour des limites.
                    });
                }
                this.getCurrentRouteInfos();

                setInterval(async function () {
                    const coordinates = await Geolocation.getCurrentPosition();
                    const { latitude, longitude } = coordinates.coords;
                    const currentPosition = [latitude, longitude]; // Obtenez la position actuelle
                    this.updatePassedPoints(currentPosition);

                    // const bounds = [[latitude, longitude], [43.60461578085957, 3.880710839194244]]
                    if(this.$refs.mapRef){
                        this.currentLocation.current = [latitude, longitude];
                        // this.$refs.mapRef.leafletObject.fitBounds(bounds, {
                        //     padding: [18, 18] // padding en pixels autour des limites.
                        // });
                    }
                }.bind(this), 10000); // Met à jour toutes les secondes, par exemple
            },
            updatePassedPoints(currentPosition) {
                // console.log("updatePassedPoints", currentPosition);
                // Ajoute le point actuel à la liste des points de passage
                this.currentLocation.passedPoints.push(currentPosition);

                // Vérifie chaque point de la route
                for (let index = 0; index < this.routes.length; index++) {
                    this.routes[index].polylineDecoded = this.routes[index].polylineDecoded.filter(routePoint => {
                        return !this.isPointCloseToAnyPassedPoint(routePoint, this.currentLocation.passedPoints);
                    });
                }
                
            },
            isPointCloseToAnyPassedPoint(routePoint, passedPoints) {
                const threshold = 10; // Seuil de distance en mètres

                // Vérifie si le point de la route est proche de l'un des points de passage
                return passedPoints.some(passedPoint => {
                    const distance = this.calculateDistance(routePoint, passedPoint);
                    // console.log("dist", distance);
                    return distance < threshold;
                });
            },
            calculateDistance(latln, latln2) {
                // console.log('latln:', latln, latln2);
                const R = 6371e3; // Rayon de la Terre en mètres
                const rad = Math.PI / 180;
                const deltaLat = (latln2[0] - latln[0]) * rad;
                const deltaLon = (latln2[1] - latln[1]) * rad;

                const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                        Math.cos(latln[0] * rad) * Math.cos(latln2[0] * rad) *
                        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                // console.log("distance", R * c);
                return R * c; // Distance en mètres
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
        },
        watch: {
        },
    }
</script>
  