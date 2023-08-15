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
        >
            <!-- origin -->
            <GMapMarker
                :position="itineraire.origin.location.latLng.latLngTab"
                :clickable="true"
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
                <GMapMarker
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
    
    // Components
    import BottomMenu from '@/components/menus/BottomMenu.vue';

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
        },
        watch: {
        },
    }
</script>
  