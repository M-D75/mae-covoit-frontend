<template>
    <div style="height: 100vh; width: 100%">
      <l-map id="map-id" @ready="isLoaded()" :zoom="zoom" :center="center" ref="mapRef">
        <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"></l-tile-layer>

        <!-- origin -->
        <l-marker 
          :lat-lng="itineraire.origin.location.latLng.latLngTab"
        >
          <l-popup>{{ itineraire.origin.infos.village }}, ({{ itineraire.origin.infos.commune }})</l-popup>
        </l-marker>

        <!-- point -->
        <l-marker 
            :lat-lng="itineraire.destination.location.latLng.latLngTab" 
            :icon="customIcon"
        >
            <!-- <l-popup>{{ itineraire.destination.infos.village }}, ({{ itineraire.destination.infos.commune }})</l-popup> -->
            <l-tooltip :options="{ permanent: true, interactive: false, direction: 'right', offset: [10, 0] }">
                <span style="font-weight: bold;"> {{ itineraire.destination.infos.village }} </span>, ({{ itineraire.destination.infos.commune }})
                <br>
                <span style="font-weight: bold; color:green;">{{ itin.duration }} min</span> 
                <br> 
                <span style="font-weight: bold; color: chocolate;"> {{ itin.distance }}</span> km
            </l-tooltip>
        </l-marker>

        <!-- route -->
        <div v-if="routeAvail">
            <l-polyline 
                v-for="(route, index) in routes.reverse()"
                :key="index"
                :lat-lngs="route.polylineDecoded" 
                :color="index == routes.length - 1 ? '#1b79cc' : '#838383'" 
                weight="10"
                @click="trajetSelected(index)"
            ></l-polyline>

            <l-polyline 
                v-for="(route, index) in routes"
                :key="index"
                :lat-lngs="route.polylineDecoded" 
                :color="index == routes.length - 1 ? '#01a9e8' : '#bcbcbc'" 
                weight="7"
                @click="trajetSelected(index)"
            ></l-polyline>
        </div>

      </l-map>
    </div>
</template>

<script>
    import { defineComponent } from 'vue';
    import polyline from '@mapbox/polyline';

    import L from "leaflet";
    
    import "leaflet/dist/leaflet.css";
    import { LMap, LTileLayer, LMarker, LPopup, LPolyline, LTooltip } from "@vue-leaflet/vue-leaflet";
    import $ from 'jquery';

    export default defineComponent({
        name: 'results-view',
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
                zoom: 10,
                routes: [],
                customIcon: L.icon({
                    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Map-circle-black.svg/2048px-Map-circle-black.svg.png', // Remplacez cela par le chemin d'accès ou l'URL de votre image
                    iconSize: [12, 12], // Taille de l'icône. Cette valeur dépend de la taille de votre image.
                    iconAnchor: [6, 6], // Point de l'icône qui correspondra géographiquement au point de coordonnées. Cette valeur dépend de la taille de votre image.
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
            // const _this = this;
            // $(document).ready(function() {
            //     _this.$nextTick(() => {
            //         setTimeout(function(){
            //             const bounds = [_this.itineraire.origin.location.latLng.latLngTab, _this.itineraire.destination.location.latLng.latLngTab]
            //             _this.$refs.mapRef.leafletObject.fitBounds(bounds, {
            //                 padding: [18, 18] // padding en pixels autour des limites.
            //             });

            //             console.log(_this.$refs.mapRef)

            //             _this.getRouteInfos();                        
            //         }, 2000)
            //     });

            //     $("#map-id").on("load", function(){
            //         console.log("MAP-ID------------------")
            //     })
            // });


        },
        methods: {
            trajetSelected(index){
                // console.log("trajetSelectd", index)
                if(index == this.routes.length - 1){
                    this.$emit("trajet-selected");
                }
                else{
                    this.routeAvail = false;
                    this.routes = this.swapWithLast(this.routes.reverse(), index);
                    this.itin.duration = this.routes[0].duration;
                    this.itin.distance = this.routes[0].distance;
                    this.routeAvail = true;
                }
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
                        const decoded = polyline.decode(data.routes[route].polyline.encodedPolyline);
                        const duration = (parseInt(data.routes[route].duration.replaceAll("s", ""))/60).toFixed(0).toString();
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

                let temp = arr[index];
                arr[index] = arr[arr.length - 1];
                arr[arr.length - 1] = temp;

                return arr;
            },
            isLoaded(){
                console.log("Map isLoaded")
                const _this = this;
                $(document).ready(function() {
                    _this.$nextTick(() => {
                        const bounds = [_this.itineraire.origin.location.latLng.latLngTab, _this.itineraire.destination.location.latLng.latLngTab]
                        _this.$refs.mapRef.leafletObject.fitBounds(bounds, {
                            padding: [18, 18] // padding en pixels autour des limites.
                        });

                        console.log(_this.$refs.mapRef)

                        _this.getRouteInfos();                        
                    });
                });
            }
        },
        watch: {
        },
    });
</script>
