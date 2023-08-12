
<style lang="scss" model>
    .cont-map {
        .menu {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 9px;
            right: 15px;
            z-index: 999;

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

        <div class="menu">
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

        <l-map 
            id="map-id" 
            :zoom="zoom" 
            :center="center" 
            @ready="isLoaded()" 
            ref="mapRef"
        >
            <l-tile-layer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"></l-tile-layer>

            <!-- origin -->
            <l-marker 
                :lat-lng="itineraire.origin.location.latLng.latLngTab"
            >
                <l-popup>{{ itineraire.origin.infos.village }}, ({{ itineraire.origin.infos.commune }})</l-popup>
            </l-marker>

            <!-- route -->
            <div v-if="routeAvail">
                <l-polyline 
                    v-for="(route, index) in routes.reverse()"
                    :key="index"
                    :lat-lngs="route.polylineDecoded" 
                    :color="index == routes.length - 1 ? '#1b79cc' : '#838383'" 
                    :weight="8"
                ></l-polyline>

                <l-polyline 
                    v-for="(route, index) in routes"
                    :key="index"
                    :lat-lngs="route.polylineDecoded" 
                    :color="index == routes.length - 1 ? '#01a9e8' : '#bcbcbc'" 
                    :weight="4"
                    @click="trajetSelected(index)"
                ></l-polyline>

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
                        <br>
                        <span style="font-weight: bold; color:green;">{{ itin.duration }}</span> 
                        <br> 
                        <span style="font-weight: bold; color: chocolate;"> {{ itin.distance }}</span> km
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
                    <br>
                    <span style="font-weight: bold; color:green;">{{ itin.duration }}</span> 
                    <br> 
                    <span style="font-weight: bold; color: chocolate;"> {{ itin.distance }}</span> km
                </l-tooltip>
            </l-circle-marker>
        </l-map>
    </div>

    <BottomMenu
        mode="map"
        :class-name="['map']"
        :map-infos="{time: itin.duration, distance: `${itin.distance} km`}"
        ref="BottomMenuRef" 
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
    import { defineComponent } from 'vue';
    import polyline from '@mapbox/polyline';

    import L from "leaflet";
    
    import "leaflet/dist/leaflet.css";
    import { LMap, LTileLayer, LMarker, LPopup, LPolyline, LTooltip, LCircleMarker } from "@vue-leaflet/vue-leaflet";
    import BottomMenu from '../menus/BottomMenu.vue';
    // import $ from 'jquery';

    //componants

    export default defineComponent({
        name: 'results-view',
        emits: ["trajet-selected"],
        computed: {
            center() {
                const latitudes =  [this.itineraire.origin.location.latLng.latitude, this.itineraire.destination.location.latLng.latitude];
                const longitudes = [this.itineraire.origin.location.latLng.longitude, this.itineraire.destination.location.latLng.longitude];
                const minLat = Math.min(...latitudes);
                const maxLat = Math.max(...latitudes);
                const minLon = Math.min(...longitudes);
                const maxLon = Math.max(...longitudes);
                return [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
            }
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
                overlayLoad: false,
                zoom: 10,
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
                },
                infosItin: [],
                routeAvail: false,
            }
        },
        mounted(){
            this.$refs.BottomMenuRef.open();
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
                    this.routes = this.swapWithLast(this.routes.reverse(), 0);
                    this.itin.duration = this.routes[0].duration;
                    this.itin.distance = this.routes[0].distance;
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
                        departureTime: '2023-10-15T15:01:23.045123456Z',
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
                    for(const route in data.routes){
                        const decoded  = polyline.decode(data.routes[route].polyline.encodedPolyline);
                        const duration = (this.convertSecondsToHoursAndMinutes(parseInt(data.routes[route].duration.replaceAll("s", "")))).toString();
                        const distance = (data.routes[route].distanceMeters/1000).toFixed(2).toString();

                        this.routes.push({polylineDecoded: decoded, infosGoogle:data.routes[route], duration: duration, distance: distance});
                        
                        if(route == 0){
                            this.itin.duration = duration;
                            this.itin.distance = distance;
                        }
                    }

                    this.routeAvail = true;
                    console.log("Avail", this.itineraire)
                }).catch(error => {
                    console.error(error);
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
            isLoaded(){
                const bounds = [this.itineraire.origin.location.latLng.latLngTab, this.itineraire.destination.location.latLng.latLngTab]
                if(this.$refs.mapRef){
                    this.$refs.mapRef.leafletObject.fitBounds(bounds, {
                        padding: [18, 18] // padding en pixels autour des limites.
                    });
                }
                
                this.getRouteInfos();
            },
            convertSecondsToHoursAndMinutes(seconds) {
                const hours   = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                if(hours > 0){
                    return `${hours} h ${minutes < 10 ? '0' + minutes : minutes}`;
                }
                else {
                    return `${minutes < 10 ? '0' + minutes : minutes} min`;
                }
            },
        },
        watch: {
        },
    });
</script>
