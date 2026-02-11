
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
                align-items: flex-end;
            }
            &.left {
                left: 15px;
            }

            .v-btn {
                margin: 7px 0;
                background-color: var(--white-bg-color);
                color: var(--font-color-label);
                .notif-chat {
                    background-color: red;
                    border-radius: 50px;
                    width: 10px;
                    height: 10px;
                    position: absolute;
                    right: 3px;
                    top: 0;
                }
            }

            .confirmation-chip{
                margin-top: 6px;
                font-weight: 600;
                color: white;
                align-self: flex-end;
                white-space: nowrap;
            }
        }

        .leaflet-control-zoom {
            display: none;
        }

        .overlay-load {
            z-index: 9999;
        }

        .passenger-status-panel {
            position: absolute;
            right: 15px;
            top: 80px;
            width: 280px;
            z-index: 1000;

            .v-card {
                max-height: 60vh;
                overflow-y: auto;
                background-color: var(--white-bg-color);
                color: var(--font-color-label);

                .v-list-item-title {
                    color: var(--font-color-label);
                }
            }
        }

        .alert-marker-wrapper {
            .alert-marker {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                border: 2px solid #fff;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
            }
        }

        .alert-tooltip {
            font-size: 12px;
        }

        .alert-menu-card {
            min-width: 240px;
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
                icon
                @click="$router.push('/message')"
            >
                <v-icon>mdi-chat-processing-outline</v-icon>
                <span v-if="notifChat" class="notif-chat"></span>
            </v-btn>

            <v-btn
                :icon=" shareLocalisation ? 'mdi-map-marker-outline' : 'mdi-map-marker-off-outline'"
                @click="shareLocalisation = !shareLocalisation; checkSharedLoc()"  
            />

            <v-btn
                icon
                @click="openAlertMenu"
            >
                <v-icon :color="activeAlerts.length ? 'red-darken-1' : undefined">
                    {{ currentModeButton === 'alert' ? 'mdi-arrow-u-left-bottom' : 'mdi-map-marker-alert' }}
                </v-icon>
            </v-btn>

            <v-btn 
                v-if="mode_driver"
                icon="mdi-account-group"
                @click="openPassengerMenu"
            >
                <v-icon>
                    {{ currentModeButton === 'passengers' ? 'mdi-arrow-u-left-bottom' : 'mdi-account-group' }}
                </v-icon>
            </v-btn>

            <!-- <v-btn 
                v-if="isBeforeThreshold"
                icon
            >
                <v-icon>mdi-check</v-icon>
            </v-btn> -->

            <!-- <v-btn 
                v-else-if="mode_driver"
                icon
                @click="console.log('test')"
            >
                <v-icon>mdi-check</v-icon>
            </v-btn> -->

            <v-btn 
                v-if="!mode_driver && !isBeforeThreshold"
                icon
                @click="dialog_annuler = true"
            >
                <v-icon>mdi-close</v-icon>
            </v-btn>

            <v-btn 
                v-else-if="!mode_driver && !passengerConfirmedInCar"
                icon
                @click="InCar()"
            >
                <v-icon>mdi-check</v-icon>
            </v-btn>

            <v-chip
                v-if="!mode_driver && passengerConfirmedInCar"
                size="small"
                color="green-darken-2"
                prepend-icon="mdi-check-circle"
                class="confirmation-chip"
            >
                Présence validée
            </v-chip>
        </div>

        <div class="menu left">
            <v-btn 
                icon="mdi-chevron-left"
                @click="back()"
            />
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
            
            <!-- our-position -->
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

            <div>
                <l-circle-marker 
                    v-for="(loc, index) in localisation"
                    :key="index"
                    :lat-lng="loc.latLng"
                    :radius="9"
                    :weight="2"
                    :color="'white'"
                    :fillColor="colorsLoc[index % colorsLoc.length]" 
                    :fillOpacity="0.7"
                    style="z-index: 9999;"
                >
                </l-circle-marker>
            </div>

            <l-marker
                v-for="alert in activeAlerts"
                :key="alert.id"
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

            <!-- origin -->
            <l-marker 
                :lat-lng="itineraire.origin.location.latLng.latLngTab"
            >
                <l-popup>{{ itineraire.origin.infos.village }}, ({{ itineraire.origin.infos.commune }})</l-popup>
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

            
        </l-map>
    </div>

    <!-- <BottomMenuTrip
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
    /> -->

    <BottomMenuTrip
        :mode="bottomMenuMode"
        :class-name="['alert']"
        :mapInfos="{time: itin.duration, distance: itin.distance, depart: itineraire['origin'].infos.commune, destination: itineraire['destination'].infos.commune, infosSup: 'Le plus rapide selon l\'etat actuel de la circulation'}"
        :alert-types="alertTypeItems"
        :selected-alert-type="selectedAlertType"
        :alert-duration-label="alertDurationLabel"
        :can-signal="canCreateAlert"
        :share-localisation="shareLocalisation"
        :passenger-bookings="passengerBookings"
        :no-show-processing-id="noShowProcessingId"
        :is-driver="mode_driver"
        :is-dark-mode="darkMode"
        ref="BottomMenuRef"
        @select-alert-type="selectedAlertType = $event"
        @confirm-alert="createLocalAlert"
        @mark-passenger-no-show="markPassengerNoShow"
        @close="handleBottomMenuClose"
        @opened="open_b = true"
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


    <v-dialog 
        v-model="dialog"
        style="z-index: 9999;"
    >
        <template v-slot:activator="{ props }">
            <v-btn v-bind="props" text="Open Dialog"> </v-btn>
        </template>

        <template v-slot:default="{ isActive }">
            <v-card>
                <v-card-title>
                    Localisation
                    <v-icon icon="mdi-map-marker-off-outline"></v-icon>
                </v-card-title>

                <v-card-text>
                    Nous n'avons pas pu obtenir votre localisation, vérifier les permessions.
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>

                    <v-btn
                        text="Ok"
                        @click="isActive.value = false"
                    ></v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>

    <!-- annuler trajet dialog -->
    <v-dialog 
        v-model="dialog_annuler"
        style="z-index: 9999;"
    >
        <template v-slot:activator="{ props }">
            <v-btn v-bind="props" text="Open Dialog"> </v-btn>
        </template>

        <template v-slot:default="{ isActive }">
            <v-card>
                <v-card-title>
                    Annuer trajet
                    <v-icon icon="mdi-map-marker-off-outline"></v-icon>
                </v-card-title>

                <v-card-text>
                    êtes-vous sûr de vouloir annuler ce trajet ?
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>

                    <v-btn
                        text="Non"
                        @click="isActive.value = false"
                    ></v-btn>

                    <v-btn
                        text="Oui"
                        @click="isActive.value = false; annulerTrajet()"
                    ></v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>

    <v-snackbar
        v-model="snackbarError"
        :timeout="4000"
        color="error"
        location="top"
        style="z-index: 12000;"
    >
        <v-icon icon="mdi-alert-circle"></v-icon>
        <span>{{ snackbarMessage }}</span>
    </v-snackbar>

    <v-snackbar
        v-model="snackbarSuccess"
        :timeout="4000"
        color="green-darken-1"
        location="top"
        style="z-index: 12000;"
    >
        <v-icon icon="mdi-check-circle-outline"></v-icon>
        <span>{{ snackbarSuccessMessage }}</span>
    </v-snackbar>
</template>

<script>
    import { defineComponent } from 'vue';
    import polyline from '@mapbox/polyline';
    import { Geolocation } from '@capacitor/geolocation';
    import { mapActions, mapState, mapGetters, mapMutations } from 'vuex';
    import axios from 'axios';
    import io from 'socket.io-client';
    import supabase from '@/utils/supabaseClient.js';
    import { sendServerNotification } from '@/utils/notifications.js';

    import L from "leaflet";
    
    import "leaflet/dist/leaflet.css";
    import { LMap, LTileLayer, LMarker, LPopup, LPolyline, LTooltip, LCircleMarker } from "@vue-leaflet/vue-leaflet";
    import { SafeAreaController } from '@aashu-dubey/capacitor-statusbar-safe-area';
    // import $ from 'jquery';

    import { Capacitor } from '@capacitor/core';

    const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';
    
    //componants
    import BottomMenuTrip from '@/components/menus/trip/BottomMenuTrip.vue';

    export default defineComponent({
        name: 'results-view',
        emits: ["trajet-selected"],
        computed: {
            ...mapState("profil", ["modeCo", "userUid", "userId", "userName", "profil", "darkMode"]),
            ...mapState("trip", ["tripSelected", "notMessageVue", "chat"]),
            ...mapGetters("search", ["getVillagesByName", "GET_ID_VILLAGE_BY_NAME"]),
            passengerBookings(){
                if(!this.tripSelected || !Array.isArray(this.tripSelected.bookings)){
                    return [];
                }
                return this.tripSelected.bookings.filter((booking) => !booking.passenger_no_show);
            },
            passengerConfirmedInCar(){
                const booking = this.getPassengerBooking();
                return booking ? Boolean(booking.in_car) : false;
            },
            center() {
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
            alertTypeItems(){
                return this.alertTypes;
            },
            alertDurationLabel(){
                const minutes = Math.round(this.alertDurationMs / 60000);
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                if(hours > 0){
                    return remainingMinutes ? `${hours}h${remainingMinutes.toString().padStart(2, '0')}` : `${hours}h`;
                }
                return `${minutes} min`;
            },
            canCreateAlert(){
                return this.shareLocalisation && Array.isArray(this.currentLocation.current) && this.currentLocation.current.length >= 2;
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
            BottomMenuTrip,
        },
        props: {
            // itineraire: {
            //     type: Object,
            //     default: () => {
            //         return {
            //             origin: {
            //                 location: {
            //                     latLng: {
            //                         latitude: -12.7243245,
            //                         longitude: 45.0589372,
            //                         latLngTab: [-12.7243245, 45.0589372]
            //                     }
            //                 },
            //                 infos: {
            //                     village: "Acoua",
            //                     commune: "Acoua",
            //                 }
            //             },
            //             destination: {
            //                 location: {
            //                     latLng: {
            //                         latitude: -12.9292776,
            //                         longitude: 45.1763906,
            //                         latLngTab: [-12.9292776, 45.1763906]
            //                     }
            //                 },
            //                 infos: {
            //                     village: "Bambo-Est",
            //                     commune: "Bandrélé",
            //                 }
            //             },
            //         }
            //     }
            // },
        },
        data() {
            return {
                
                nowDate: new Date(),
                timer: null,
                isBeforeThreshold: false,
                minutesBefore: 15,
                dialog: false, //localisation dialog
                dialog_annuler: false,
                notifChat: false,
                open_b: true, //open bottom menu
                bottomMenuMode: "map",
                currentModeButton: null,
                overlayLoad: false,
                zoom: 10,
                routes: [],
                currentContact: {
                    username: "Username",
                    avatarContact: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light'",
                    userUid: "",
                },
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
                updateLocTimerId: null,
                rerouteCooldownMs: 60000,
                lastRerouteAt: 0,
                rerouteDistanceThresholdM: 200,
                currentLocation: {
                    current: [],
                    passedPoints: [],
                },
                simuleMovement: {
                    segmentActuel: 0,
                    vitesse: 20,
                    intervalId: null,
                },
                routeTmp: [{"id":"0","polylineDecoded":[[43.60245,3.86996],[43.60374,3.86797],[43.60363,3.86778],[43.60328,3.86785],[43.60169,3.86807],[43.60147,3.86809],[43.60136,3.86804],[43.60112,3.86785],[43.60112,3.86777],[43.60108,3.86772],[43.60102,3.86775],[43.60101,3.86784],[43.60106,3.86788],[43.60111,3.86785],[43.60136,3.86804],[43.60143,3.86821],[43.60152,3.86855],[43.60151,3.86869],[43.60141,3.86908],[43.60128,3.86944],[43.60094,3.87008],[43.60006,3.87153],[43.59973,3.87205],[43.59961,3.8723],[43.59956,3.87244],[43.59942,3.87297],[43.59939,3.87318],[43.59939,3.87359],[43.59971,3.87535],[43.59975,3.87551],[43.59979,3.87585],[43.59995,3.87673],[43.60032,3.87825],[43.60055,3.87911],[43.6006,3.87938],[43.60119,3.88158],[43.60214,3.88126],[43.60222,3.88122],[43.60227,3.88127],[43.60219,3.88142],[43.60289,3.8822],[43.60315,3.88253],[43.60302,3.88053],[43.60303,3.88038],[43.60323,3.88015],[43.60341,3.87984],[43.60346,3.87981],[43.60353,3.87986],[43.60437,3.88107]],"infosGoogle":{"distanceMeters":2458,"duration":"429s","polyline":{"encodedPolyline":"ibciGgzrVaGlKTd@dAM|Hk@j@CTHn@d@?NFHJE@QIGIDq@e@Ma@QcA@[RmAXgAbA_CnDaH`AgBVq@H[ZiBDi@?qA_A_JG_@GcA_@oDiAoHm@kDIu@uBwL}D~@OFIIN]kC{Cs@aAXnKA\\g@l@c@|@IDMIgDqF"}},"duration":"07 min","distance":"2.46","faster":true,"current":true},{"id":"1","polylineDecoded":[[43.60245,3.86996],[43.60374,3.86797],[43.60363,3.86778],[43.60328,3.86785],[43.60169,3.86807],[43.60147,3.86809],[43.60136,3.86804],[43.60112,3.86785],[43.60112,3.86777],[43.60108,3.86772],[43.60102,3.86775],[43.60101,3.86784],[43.60104,3.86788],[43.60085,3.86825],[43.60046,3.86896],[43.59981,3.87036],[43.59976,3.87054],[43.59977,3.87057],[43.59853,3.87295],[43.59825,3.87355],[43.59789,3.87426],[43.59739,3.87531],[43.5973,3.8755],[43.59701,3.87705],[43.59691,3.87772],[43.59685,3.87769],[43.59648,3.87767],[43.5964,3.87764],[43.59614,3.87764],[43.59619,3.87738],[43.59637,3.87697],[43.59662,3.87662],[43.59667,3.87662],[43.59693,3.87634],[43.59707,3.8762],[43.5975,3.87603],[43.59764,3.87595],[43.5979,3.87587],[43.59872,3.87577],[43.59905,3.8758],[43.59977,3.87575],[43.59995,3.87673],[43.60032,3.87825],[43.60055,3.87911],[43.6006,3.87938],[43.60119,3.88158],[43.60214,3.88126],[43.60222,3.88122],[43.60227,3.88127],[43.60219,3.88142],[43.60289,3.8822],[43.60315,3.88253],[43.60302,3.88053],[43.60303,3.88038],[43.60323,3.88015],[43.60341,3.87984],[43.60346,3.87981],[43.60353,3.87986],[43.60437,3.88107]],"infosGoogle":{"distanceMeters":3191,"duration":"492s","polyline":{"encodedPolyline":"ibciGgzrVaGlKTd@dAM|Hk@j@CTHn@d@?NFHJE@QEGd@iAlAmC`CwGHc@AEvF{Mv@wBfAmCbBqEPe@x@uHReCJDhABNDr@?Ir@c@pAq@dAI?s@v@[ZuA`@[Ns@NcDRaAEoCHc@cEiAoHm@kDIu@uBwL}D~@OFIIN]kC{Cs@aAXnKA\\g@l@c@|@IDMIgDqF"}},"duration":"08 min","distance":"3.19","faster":false,"current":false},{"id":"2","polylineDecoded":[[43.60245,3.86996],[43.60374,3.86797],[43.60363,3.86778],[43.60328,3.86785],[43.60169,3.86807],[43.60147,3.86809],[43.60136,3.86804],[43.60112,3.86785],[43.60112,3.86777],[43.60108,3.86772],[43.60102,3.86775],[43.60073,3.86775],[43.60055,3.86761],[43.6003,3.86731],[43.59999,3.86766],[43.59802,3.86869],[43.59754,3.8689],[43.59705,3.86891],[43.59701,3.86886],[43.59694,3.86887],[43.59693,3.86895],[43.59694,3.869],[43.59694,3.86936],[43.59698,3.86964],[43.59707,3.86983],[43.59751,3.87044],[43.59792,3.87115],[43.59745,3.8718],[43.59697,3.87252],[43.59569,3.87432],[43.59489,3.87542],[43.59458,3.87563],[43.5945,3.87579],[43.59511,3.87624],[43.59532,3.87632],[43.59588,3.87623],[43.59622,3.87609],[43.59643,3.87604],[43.59666,3.87611],[43.59683,3.87619],[43.59693,3.87617],[43.59707,3.8762],[43.5975,3.87603],[43.59764,3.87595],[43.5979,3.87587],[43.59872,3.87577],[43.59905,3.8758],[43.59977,3.87575],[43.59995,3.87673],[43.60032,3.87825],[43.60055,3.87911],[43.6006,3.87938],[43.60119,3.88158],[43.60214,3.88126],[43.60222,3.88122],[43.60227,3.88127],[43.60219,3.88142],[43.60289,3.8822],[43.60315,3.88253],[43.60302,3.88053],[43.60303,3.88038],[43.60323,3.88015],[43.60341,3.87984],[43.60346,3.87981],[43.60353,3.87986],[43.60437,3.88107]],"infosGoogle":{"distanceMeters":3560,"duration":"532s","polyline":{"encodedPolyline":"ibciGgzrVaGlKTd@dAM|Hk@j@CTHn@d@?NFHJEx@?b@Zp@z@|@eAhKmE~Ai@`BAFHLA@OAI?gAGw@Qe@wAyBqAmC|AaC~AoC~FgJ~C{E|@i@N_@yByAi@OoBPcAZi@Hm@Ma@OSB[EuA`@[Ns@NcDRaAEoCHc@cEiAoHm@kDIu@uBwL}D~@OFIIN]kC{Cs@aAXnKA\\g@l@c@|@IDMIgDqF"}},"duration":"08 min","distance":"3.56","faster":false,"current":false}],
                itineraire: {
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
                },
                getGeolocalisation: false,
                shareLocalisation: true,
                watchId: null,
                socket: null,
                mode_driver: false,
                colorsLoc: ["red", "black", "green", "yellow"],
                localisation: [
                    // {type: "driver", latLng: [-12.7997252, 45.1038055]}, {type: "passenger", latLng: [-12.7797252, 45.1038055]}
                ],
                alertTypes: [
                    { value: 'traffic', label: 'Bouchon', color: '#ff9800', icon: 'mdi-traffic-light', abbr: 'B' },
                    { value: 'danger', label: 'Menace', color: '#d32f2f', icon: 'mdi-shield-cross', abbr: '!' },
                    { value: 'works', label: 'Travaux', color: '#ffa726', icon: 'mdi-traffic-cone', abbr: 'T' },
                    { value: 'weather', label: 'Intempérie', color: '#4fc3f7', icon: 'mdi-weather-pouring', abbr: '~' },
                ],
                selectedAlertType: 'traffic',
                activeAlerts: [],
                alertDurationMs: 60 * 60 * 1000,
                alertCleanupTimer: null,
                alertIconCache: {},
                alertChannel: null,
            snackbarError: false,
                snackbarMessage: "",
                snackbarSuccess: false,
                snackbarSuccessMessage: "",
                noShowProcessingId: null,
        }
    },
        beforeMount(){
            let _tmp_village = this.getVillagesByName(this.tripSelected.depart);
            this.setItineraire("origin", _tmp_village);

            _tmp_village = this.getVillagesByName(this.tripSelected.destination);
            this.setItineraire("destination", _tmp_village);

            console.log(this.itineraire);
        },
        async mounted(){
            SafeAreaController.injectCSSVariables

            const isPassenger = this.tripSelected && this.tripSelected.driver_id
                ? this.userUid != this.tripSelected.driver_id
                : false;
            this.mode_driver = !isPassenger;

            await this.getContacts();
            await this.ensurePassengerBookings();

            if( isPassenger && !this.getPassengerBooking() ){
                this.showError("Ce trajet n'est plus disponible.");
                if( this.$router ){
                    this.$router.replace('/profil');
                }
                return;
            }

            try {
                if( isAndroid || isIOS ){
                    const requestPermissions = await Geolocation.requestPermissions();
                    console.log("check-requestPermissions", requestPermissions);

                    const coordinates = await Geolocation.getCurrentPosition();
                    const { latitude, longitude } = coordinates.coords;
                    if( this.$refs.mapRef ){
                        this.currentLocation.current = [latitude, longitude];
                    }
                }
                else{
                    const coordinates = await Geolocation.getCurrentPosition();
                    const { latitude, longitude } = coordinates.coords;
                    if( this.$refs.mapRef ){
                        this.currentLocation.current = [latitude, longitude];
                    }
                }

                const checkPermissions = await Geolocation.checkPermissions();
                this.getGeolocalisation = checkPermissions.location == 'granted';
                if( ! this.getGeolocalisation ){
                    this.dialog = true;
                }
                console.log("check-checkPermissions", checkPermissions);

            }
            catch(error){
                console.log("Error get localisation");
                if( ! this.getGeolocalisation ){
                    this.dialog = true;
                }
            }
            
            // this.askNewMessage();
            
            console.log("itineraire", this.itineraire);
            this.$nextTick(function(){
                if(this.$refs.BottomMenuRef)
                    this.$refs.BottomMenuRef.open();
            })
            

            // real-time
            const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}

            const typeUrl = this.modeCo;
            if( Object.keys(this.tripSelected).length > 0 && this.userUid != this.tripSelected.driver_id ){//mode passager
                this.mode_driver = false;
                this.socket = io(adresse[typeUrl], {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 60,
                    query: {
                        userId: this.userUid,
                        chatIds: [[this.userUid, this.tripSelected.driver_id].sort((a, b) => {
                                return a.localeCompare(b);
                            }).join(":")],
                        registerDeviceToken: this.registerDeviceToken,
                    }
                });

                this.currentContact.userUid = this.tripSelected.driver_id;

                // this.updateName(this.tripSelected.driver_id);
            }
            else{
                this.mode_driver = true;
                this.contacts = this.chat.contacts;

                console.log("this.contacts", this.contacts);
                let chatIds = [];
                for (let index = 0; index < this.contacts.length; index++) {
                    chatIds.push([this.userUid, this.contacts[index].user_id].sort((a, b) => {
                                return a.localeCompare(b);
                            }).join(":"));
                }

                this.socket = io(adresse[typeUrl], {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 60,
                    query: {
                        userId: this.userUid,
                        chatIds: chatIds,
                        registerDeviceToken: this.registerDeviceToken,
                    }
                });

                this.currentContact.username = this.contacts[0].username;
                this.currentContact.avatarContact = this.contacts[0].avatar;
                this.currentContact.userUid = this.contacts[0].user_id;
            }

            this.socket.on('connect', () => {
                console.log('Map-Connecté au serveur Socket.IO!');
                this.overlayLoad = false;
                const engine = this.socket.io.engine;
                console.log(engine.transport.name);
            });

            this.socket.on('get-localisation', (loc) => {
                console.log('Localisation reçu:', loc);
                const indexLoc = this.localisation.findIndex(loca => loca.from == loc.from);

                if( this.shareLocalisation ){
                    if(indexLoc !== -1 ){
                        this.localisation[indexLoc].latLng = loc.latLng;
                    }
                    else{
                        let newLoc = {
                            idTrip: loc.idTrip,
                            from: loc.from,
                            to: loc.to,
                            latLng: loc.latLng,
                        };

                        this.localisation.push(newLoc);
                    }
                }

            });

            this.socket.on('stop-shared-loc', (infos) => {
                console.log("shared-stoped", infos);
                this.localisation = this.localisation.filter((loc) => loc.idTrip != infos.idTrip);
            });

            this.socket.on('check-passenger-in-car', (infos) => {
                console.log("check-passenger-in-car", infos);
                const markBooking = () => {
                    this.tripSelected.bookings.map((booking) => {
                        if( booking.id == infos.idBooking ){
                            booking.in_car = true;
                        }
                    });
                };

                if( this.mode_driver ){
                    markBooking();
                }
                else if( infos.from == this.userUid ){
                    markBooking();
                }
            });
            
            console.log("tripSelected", this.tripSelected);

            this.now = new Date();
            this.updateThresholdCheck();
            this.timer = setInterval(() => {
                this.now = new Date();
                this.updateThresholdCheck();
            }, 10000);

            console.log("this.tripSelected", this.tripSelected);

            await this.initializeAlertSync();
            
        },
        beforeUnmount() {
            clearInterval(this.timer);
            if (this.updateLocTimerId) {
                clearInterval(this.updateLocTimerId);
                this.updateLocTimerId = null;
            }
            if (this.watchId) {
                Geolocation.clearWatch({ id: this.watchId });
                this.watchId = null;
            }
            this.stopAlertCleanupTimer();
            this.unsubscribeAlertChannel();
        },
        methods: {
            ...mapActions("search", ['getVillages']),
            ...mapActions("trip", ["getContacts"]),
            ...mapMutations("trip", ["SET_NOT_MESSAGE_VUE", "SET_TRIP_SELECTED"]),
            updateThresholdCheck() {
                const departure = new Date(this.tripSelected.departure_time);
                const diffInMs = departure - this.now;
                const diffInMin = diffInMs / (1000 * 60);
                this.isBeforeThreshold = diffInMin <= this.minutesBefore;
                console.log("updateThresholdCheck", this.isBeforeThreshold, departure, diffInMin, this.minutesBefore);
                
            },
            /***
             * Mark the user as in car for the selected trip
             */
            async InCar(){
                console.log("InCar", this.tripSelected);

                try{
                    const trip_id = this.tripSelected.id;
                    let { data, error } = await supabase
                        .from('booking')
                        .update({ in_car: true })
                        .eq('passenger_account_id', this.userId)
                        .eq('trip_id', trip_id)
                        .select();


                    if(error){
                        throw new Error("Impossible de confirmer votre présence. Réessayez.");
                    }

                    console.log("Booking updated successfully", data);
                    const updatedBooking = Array.isArray(data) && data.length > 0 ? data[0] : null;
                    const passengerBooking = updatedBooking || this.getPassengerBooking();

                    if( !passengerBooking ){
                        throw new Error("Réservation introuvable pour ce trajet.");
                    }

                    if( passengerBooking && passengerBooking.payment_intent_id ){
                        await this.captureDeferredPayment(passengerBooking.payment_intent_id);
                    }

                    if( passengerBooking ){
                        passengerBooking.in_car = true;
                    }

                    this.showSuccess("Présence validée, bon trajet !");

                    const infos = {
                        idBooking: passengerBooking ? passengerBooking.id : null,
                        from: this.userUid,
                        to: this.currentContact.userUid,
                    };
                    this.socket.emit("in_car", infos);
                }
                catch(error){
                    this.handleServerError(error, error?.message || "Nous n'avons pas pu valider votre présence.");
                }

            },
            async ensurePassengerBookings(){
                if(this.mode_driver || !this.tripSelected){
                    return;
                }

                if(Array.isArray(this.tripSelected.bookings) && this.tripSelected.bookings.length > 0){
                    return;
                }

                try{
                    const { data, error } = await supabase
                        .from('trip')
                        .select(`
                            id,
                            booking (
                                *,
                                account (*)
                            )
                        `)
                        .eq('id', this.tripSelected.id)
                        .single();

                    if(error){
                        this.handleServerError(error, "Impossible de récupérer les passagers du trajet.");
                        return;
                    }

                    const bookings = data?.booking || [];
                    const sanitizedBookings = bookings.filter((booking) => !booking.passenger_no_show);
                    const updatedTrip = {
                        ...this.tripSelected,
                        passenger_number: sanitizedBookings.filter((booking) => booking.is_accepted).length,
                        bookings: sanitizedBookings,
                        booking: sanitizedBookings,
                    };

                    this.SET_TRIP_SELECTED(updatedTrip);
                }
                catch(error){
                    this.handleServerError(error, "Impossible de récupérer les passagers du trajet.");
                }
            },
            async annulerTrajet(){
                // suppression avant un certains temps

                console.log("annuler", this.tripSelected, this.userId);

                const trip_id = this.tripSelected.id;
                const passengerBooking = this.getPassengerBooking();
                const passengerBookings = Array.isArray(this.tripSelected.bookings)
                    ? this.tripSelected.bookings.filter((booking) => booking.passenger_account_id == this.userId)
                    : [];
                const bookingIds = passengerBookings.map((booking) => booking.id);
                const seatsCount = passengerBookings.length > 0 ? passengerBookings.length : (passengerBooking ? 1 : 0);
                const rawSeatPrice = Number(this.tripSelected.price || 0) || Number(passengerBookings[0]?.price || passengerBooking?.price || 0) || 0;
                const walletRefundAmount = rawSeatPrice * seatsCount;

                if( passengerBooking && passengerBooking.payment_intent_id && passengerBooking.payment_status === 'requires_capture' ){
                    await this.cancelDeferredPayment(passengerBooking.payment_intent_id);
                }

                if(
                    passengerBooking &&
                    passengerBooking.payment_status === 'wallet_reserved' &&
                    walletRefundAmount > 0
                ){
                    const targetIds = bookingIds.length > 0 ? bookingIds : (passengerBooking.id ? [passengerBooking.id] : []);
                    await this.releaseWalletReservation(targetIds, walletRefundAmount);
                }

                let { error: error_booking } = await supabase
                    .from('booking')
                    .delete()
                    .eq('passenger_account_id', this.userId)
                    .eq('trip_id', trip_id);

                console.log("Error booking", error_booking);
                if(error_booking){
                    this.handleServerError(error_booking, "Impossible d'annuler votre réservation.");
                }
                else{
                    console.log("Booking deleted successfully");
                }

                await this.notifyDriverCancellation();
                if(this.tripSelected && this.tripSelected.departure_time){
                    this.$store.commit('profil/REMOVE_HISTORY_DATE_BY_VALUE', {
                        type: 'passenger',
                        departure_time: this.tripSelected.departure_time,
                    });
                }

                if(this.$router){
                    this.$router.replace('/profil');
                }
                
                // for (let index = 0; index < this.tripSelected.bookings.length; index++) {
                //     const passenger_account_id = this.tripSelected.bookings[index].passenger_account_id;
                //     const trip_id = this.tripSelected.id;

                //     console.log("annulerTrajet", passenger_account_id, trip_id);
                    

                //     let { error: error_booking } = await supabase
                //         .from('booking')
                //         .delete()
                //         .eq('passenger_account_id', this.userId)
                //         .eq('trip_id', trip_id);

                //     console.log("Error booking", error_booking);
                //     if(error_booking){
                //         console.error("Error deleting booking:", error_booking);
                //     }
                //     else{
                //         console.log("Booking deleted successfully");
                //     }
                    
                // }
               
            },
            askNewMessage(){
                const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}

                const typeUrl = this.modeCo;
                axios.post(`${adresse[typeUrl]}/askNewMessage`, {
                        userId: this.userUid,
                    })
                    .then(response => {
                        console.log("askNewMessage", response.data);
                        const data = response.data;

                        this.SET_NOT_MESSAGE_VUE(data.idsTrip);
                        this.notifChat = this.notMessageVue.includes(this.tripSelected.id + "");
                    })
                    .catch(error => {
                        this.handleServerError(error, "Impossible de charger les messages.");
                    });
            },
            getPassengerBooking(){
                console.log("getPassengerBooking", this.tripSelected, this.userId);

                if( !this.tripSelected || !this.tripSelected.bookings ){
                    return null;
                }

                return this.tripSelected.bookings.find((booking) => booking.passenger_account_id == this.userId && !booking.passenger_no_show) || null;
            },
            passengerDisplayName(){
                const infosPerso = this.profil && this.profil.infos_perso ? this.profil.infos_perso : {};
                const composed = `${infosPerso.prenom || ''} ${infosPerso.nom || ''}`.trim();
                return composed || this.userName || "Passager";
            },
            async notifyDriverCancellation(){
                if( !this.tripSelected || !this.tripSelected.driver_id ){
                    return;
                }

                const passengerName = this.passengerDisplayName();
                const departureName = this.tripSelected.depart || (this.tripSelected.itineraire?.origin?.infos?.village) || "Départ";
                const destinationName = this.tripSelected.destination || (this.tripSelected.itineraire?.destination?.infos?.village) || "Destination";
                const departureTime = this.tripSelected.departure_time ? new Date(this.tripSelected.departure_time) : null;
                const formattedHour = departureTime ? `${departureTime.getHours().toString().padStart(2, '0')}:${departureTime.getMinutes().toString().padStart(2, '0')}` : "";

                await sendServerNotification({
                    mode: this.modeCo,
                    userId: this.tripSelected.driver_id,
                    title: "Réservation annulée",
                    body: `${passengerName} s'est désisté pour ${departureName} → ${destinationName}.`,
                    data: {
                        largeBody: formattedHour
                            ? `${passengerName} ne participera plus au trajet ${departureName} → ${destinationName} (${formattedHour}).`
                            : `${passengerName} ne participera plus au trajet ${departureName} → ${destinationName}.`,
                        actions: {
                            goTo: "/profil/open-trip-driver",
                        }
                    }
                });
            },
            async markPassengerNoShow(booking){
                if(
                    !this.mode_driver ||
                    !booking ||
                    booking.in_car ||
                    booking.passenger_no_show ||
                    this.noShowProcessingId === booking.id
                ){
                    return;
                }

                const confirmation = typeof window !== 'undefined'
                    ? window.confirm("Signaler ce passager comme absent ? Cette action annule sa réservation.")
                    : true;

                if( !confirmation ){
                    return;
                }

                this.noShowProcessingId = booking.id;

                try{
                    if( booking.payment_status === 'requires_capture' && booking.payment_intent_id ){
                        await this.cancelDeferredPayment(booking.payment_intent_id);
                    }

                    const walletAmount = booking.payment_status === 'wallet_reserved'
                        ? this.resolveBookingPrice(booking)
                        : 0;

                    if( walletAmount > 0 && booking.passenger_account_id ){
                        await this.releaseWalletReservation([booking.id], walletAmount, booking.passenger_account_id);
                    }

                    const { error } = await supabase
                        .from('booking')
                        .update({
                            passenger_no_show: true,
                            passenger_no_show_at: new Date().toISOString(),
                            is_refused: true,
                        })
                        .eq('id', booking.id);

                    if( error ){
                        throw error;
                    }

                    const remainingBookings = (this.tripSelected.bookings || []).filter((item) => item.id !== booking.id);
                    const updatedTrip = {
                        ...this.tripSelected,
                        passenger_number: remainingBookings.filter((item) => item.is_accepted).length,
                        bookings: remainingBookings,
                        booking: remainingBookings,
                    };
                    this.SET_TRIP_SELECTED(updatedTrip);

                    await this.notifyPassengerNoShow(booking);

                    this.showSuccess("Passager marqué absent. Les montants ont été libérés.");
                }
                catch(error){
                    this.handleServerError(error, "Impossible de signaler l'absence du passager.");
                }
                finally{
                    this.noShowProcessingId = null;
                }
            },
            async notifyPassengerNoShow(booking){
                if( !booking ){
                    return;
                }

                let passengerAccount = booking.account;
                if( (!passengerAccount || !passengerAccount.user_id) && booking.passenger_account_id ){
                    const { data } = await supabase
                        .from('account')
                        .select('user_id, firstname, lastname, username')
                        .eq('id', booking.passenger_account_id)
                        .single();
                    if( data ){
                        passengerAccount = { ...passengerAccount, ...data };
                    }
                }

                if( !passengerAccount?.user_id ){
                    return;
                }

                const nameFromAccount = `${passengerAccount.firstname || ''} ${passengerAccount.lastname || ''}`.trim();
                const infosPerso = this.profil?.infos_perso || {};
                const driverName = `${infosPerso.prenom || ''} ${infosPerso.nom || ''}`.trim() || "Votre chauffeur";
                const departureName = this.tripSelected?.depart || this.tripSelected?.itineraire?.origin?.infos?.village || "Départ";
                const destinationName = this.tripSelected?.destination || this.tripSelected?.itineraire?.destination?.infos?.village || "Destination";
                const departureTime = this.tripSelected?.departure_time ? new Date(this.tripSelected.departure_time) : null;
                const formattedHour = departureTime
                    ? `${departureTime.getHours().toString().padStart(2, '0')}:${departureTime.getMinutes().toString().padStart(2, '0')}`
                    : "";

                await sendServerNotification({
                    mode: this.modeCo,
                    userId: passengerAccount.user_id,
                    title: "Absence signalée",
                    body: `${driverName} a indiqué que ${nameFromAccount || 'vous'} étiez absent pour ${departureName} → ${destinationName}.`,
                    data: {
                        largeBody: formattedHour
                            ? `${driverName} a clôturé le trajet (${formattedHour}) en signalant votre absence.`
                            : `${driverName} a clôturé ce trajet en signalant votre absence.`,
                        actions: {
                            goTo: "/profil/open-trip-passenger",
                        }
                    }
                });
            },
            async captureDeferredPayment(paymentIntentId){
                const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}
                const typeUrl = this.modeCo;

                try {
                    const { data } = await axios.post(`${adresse[typeUrl]}/payments/capture-now`, {
                        paymentIntentId,
                        tripId: this.tripSelected.id,
                    });
                    console.log("capture-now result:", data);
                    await this.$store.dispatch("profil/getSoldes");
                }
                catch(error){
                    this.handleServerError(error, "Nous n'avons pas pu valider le paiement.");
                }
            },
            async cancelDeferredPayment(paymentIntentId){
                const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}
                const typeUrl = this.modeCo;

                try {
                    const { data } = await axios.post(`${adresse[typeUrl]}/payments/cancel`, {
                        paymentIntentId,
                        tripId: this.tripSelected.id,
                    });
                    console.log("cancel deferred result:", data);
                    await this.$store.dispatch("profil/getSoldes");
                }
                catch(error){
                    this.handleServerError(error, "Nous n'avons pas pu annuler le paiement.");
                }
            },
            async releaseWalletReservation(bookingIds, amount, targetAccountId = null){
                if(!amount || amount <= 0){
                    return;
                }

                const accountId = targetAccountId || this.userId;

                try {
                    const { data: accountRow, error: accountError } = await supabase
                        .from('account')
                        .select('credit')
                        .eq('id', accountId)
                        .single();

                    if(accountError){
                        this.handleServerError(accountError, "Impossible de rembourser vos crédits.");
                        return;
                    }

                    const currentCredit = accountRow?.credit || 0;
                    const newCredit = currentCredit + amount;

                    const { error: creditUpdateError } = await supabase
                        .from('account')
                        .update({ credit: newCredit })
                        .eq('id', accountId);

                    if(creditUpdateError){
                        this.handleServerError(creditUpdateError, "Impossible de mettre à jour vos crédits.");
                        return;
                    }

                    if(Array.isArray(bookingIds) && bookingIds.length > 0){
                        const { error: bookingUpdateError } = await supabase
                            .from('booking')
                            .update({ payment_status: 'wallet_released' })
                            .in('id', bookingIds);

                        if(bookingUpdateError){
                            this.handleServerError(bookingUpdateError, "Impossible de libérer la réservation.");
                        }
                    }

                    if( accountId === this.userId ){
                        await this.$store.dispatch('profil/getSoldes');
                    }
                }
                catch(error){
                    this.handleServerError(error, "Erreur lors du remboursement.");
                }
            },
            showError(message){
                this.snackbarMessage = message || "Une erreur est survenue.";
                this.snackbarError = true;
            },
            showSuccess(message){
                this.snackbarSuccessMessage = message || "Action effectuée avec succès.";
                this.snackbarSuccess = true;
            },
            handleServerError(error, fallback){
                console.error(fallback || 'Server error', error);
                this.showError(fallback || "Une erreur serveur est survenue.");
            },
            passengerName(booking){
                if(booking.account){
                    if(booking.account.firstname || booking.account.lastname){
                        return `${booking.account.firstname || ''} ${booking.account.lastname || ''}`.trim() || booking.account.username || "Passager";
                    }
                    return booking.account.username || "Passager";
                }
                return "Passager";
            },
            passengerInitials(booking){
                if(booking.account){
                    const first = booking.account.firstname ? booking.account.firstname.charAt(0) : '';
                    const last = booking.account.lastname ? booking.account.lastname.charAt(0) : '';
                    const initials = `${first}${last}`.trim();
                    if(initials.length > 0){
                        return initials.toUpperCase();
                    }
                    if(booking.account.username){
                        return booking.account.username.substring(0, 2).toUpperCase();
                    }
                }
                return "P";
            },
            resolveBookingPrice(booking){
                if( booking && typeof booking.price !== 'undefined' ){
                    const parsed = Number(booking.price);
                    if( !isNaN(parsed) ){
                        return parsed;
                    }
                }

                if( this.tripSelected && typeof this.tripSelected.price !== 'undefined' ){
                    const tripPrice = Number(this.tripSelected.price);
                    if( !isNaN(tripPrice) ){
                        return tripPrice;
                    }
                }

                return 0;
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
            async getRouteInfos(){
                this.overlayLoad = true;
                await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
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
                            originalPolyline: decoded.slice(),
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
                    this.handleServerError(error, "Impossible de calculer l'itinéraire.");
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
                            originalPolyline: decoded.slice(),
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
                    console.log("Avail", this.itineraire, JSON.stringify(tmp_routes));

                    this.routes = tmp_routes.slice(0, 1);
                    this.overlayLoad = false;
                    
                }).catch(error => {
                    this.handleServerError(error, "Impossible de calculer l'itinéraire.");
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
            async isLoaded(){
                // const bounds = [this.itineraire.origin.location.latLng.latLngTab, this.itineraire.destination.location.latLng.latLngTab]
                // if(this.$refs.mapRef){
                //     this.$refs.mapRef.leafletObject.fitBounds(bounds, {
                //         padding: [18, 18] // padding en pixels autour des limites.
                //     });
                // }
                
                // await this.getRouteInfos();
                console.log("this.tripSelected:", this.tripSelected);
                this.routes = [this.tripSelected.route].map((route, index) => {
                    const polylineDecoded = Array.isArray(route.polylineDecoded) ? route.polylineDecoded : [];
                    return {
                        ...route,
                        id: typeof route.id !== 'undefined' ? route.id : index,
                        polylineDecoded,
                        originalPolyline: polylineDecoded.slice(),
                        current: index === 0,
                    };
                });
                this.itin.duration = this.routes[0]?.duration || this.itin.duration;
                this.itin.distance = this.routes[0]?.distance || this.itin.distance;
                this.routeAvail = true;
                this.updateLoc();
                // this.getRouteInfos();
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
                this.setBottomMenuMode('map');
            },
            openAlertMenu(){
                this.setBottomMenuMode('alert');
            },
            openPassengerMenu(){
                if( !this.mode_driver ){
                    return;
                }
                this.setBottomMenuMode('passengers');
            },
            setBottomMenuMode(mode){
                const shouldToggleToMap = this.bottomMenuMode === mode && mode !== 'map' && this.open_b;
                this.bottomMenuMode = shouldToggleToMap ? 'map' : mode;
                this.currentModeButton = shouldToggleToMap ? null : (mode === 'map' ? null : mode);
                if( this.$refs.BottomMenuRef ){
                    this.$refs.BottomMenuRef.open();
                }
            },
            handleBottomMenuClose(){
                this.open_b = false;
                this.bottomMenuMode = 'map';
                this.currentModeButton = null;
            },
            async createLocalAlert(){
                if( !this.canCreateAlert ){
                    if( !this.shareLocalisation ){
                        this.showError("Activez le partage de localisation pour créer un signalement.");
                    }
                    else{
                        this.showError("Localisation indisponible. Réessayez dans un instant.");
                    }
                    return;
                }

                const typeDef = this.alertTypes.find((item) => item.value === this.selectedAlertType) || this.alertTypes[0];
                const now = Date.now();
                const coordinates = [...this.currentLocation.current];
                const expiresAt = new Date(now + this.alertDurationMs).toISOString();

                try{
                    const { data, error } = await supabase
                        .from('road_alert')
                        .insert({
                            trip_id: this.tripSelected?.id || null,
                            account_id: this.userId,
                            alert_type: typeDef.value,
                            lat: coordinates[0],
                            lng: coordinates[1],
                            expires_at: expiresAt,
                            metadata: {
                                created_from: 'app',
                            },
                        })
                        .select()
                        .single();

                    if( error ){
                        throw error;
                    }

                    const alert = this.mapAlertRow(data);
                    this.addOrReplaceAlert(alert);
                    this.showSuccess(`Signalement "${typeDef.label}" ajouté sur la carte.`);
                }
                catch(error){
                    this.handleServerError(error, "Impossible d'enregistrer le signalement.");
                }
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
                if( !this.tripSelected?.id ){
                    return;
                }
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
                if( this.activeAlerts.length === 0 ){
                    this.stopAlertCleanupTimer();
                }
            },
            checkSharedLoc(){
                if(!this.shareLocalisation){
                    if(this.mode_driver){
                        for (let index = 0; index < this.contacts.length; index++) {
                            let infos = {
                                idTrip: this.tripSelected.id,
                                from: this.userUid,
                                to: this.contacts[index].user_id,
                            }
                            this.socket.emit("stop-shared-localisation", infos);
                        }
                    }
                    else{
                        let infos = {
                            idTrip: this.tripSelected.id,
                            from: this.userUid,
                            to: this.currentContact.userUid,
                        }
                        this.socket.emit("stop-shared-localisation", infos);
                    }
                }
            },
            async updateLoc(){
                // Obtention de la position actuelle
                //const coordinates = await Geolocation.getCurrentPosition();
                //const { latitude, longitude } = coordinates.coords;

                
                //await this.getCurrentRouteInfos();

                // const latitude = this.routes[0].polylineDecoded[0][0];
                // const longitude = this.routes[0].polylineDecoded[0][1];
                // this.currentLocation.current = [latitude, longitude];

                //console.log("localisation", latitude, longitude, this.itineraire.destination.location.latLng.latLngTab);
                // const bounds = [[latitude, longitude], [43.60461578085957, 3.880710839194244]]
                // if(this.$refs.mapRef){
                //     this.currentLocation.current = [latitude, longitude];
                //     this.$refs.mapRef.leafletObject.fitBounds(bounds, {
                //         padding: [18, 18] // padding en pixels autour des limites.
                //     });
                // }

                // this.routeAvail = true;
                // this.routes = this.routeTmp.slice(0, 1);
                //console.log(this.routes);

                // this.shareLoc();

                if (this.updateLocTimerId) {
                    clearInterval(this.updateLocTimerId);
                    this.updateLocTimerId = null;
                }

                this.updateLocTimerId = setInterval(async function () {
                    if( this.getGeolocalisation ){
                        const coordinates = await Geolocation.getCurrentPosition();
                        const { latitude, longitude } = coordinates.coords;
                        const currentPosition = [latitude, longitude]; // Obtenez la position actuelle
                        this.updatePassedPoints(currentPosition);
                        this.updateRemainingEstimates(currentPosition);

                        // const bounds = [[latitude, longitude], [43.60461578085957, 3.880710839194244]]
                        if(this.$refs.mapRef){
                            this.currentLocation.current = [latitude, longitude];

                            if( this.shareLocalisation ){
                                if(this.mode_driver){
                                    for (let index = 0; index < this.contacts.length; index++) {
                                        let newLoc = {
                                            idTrip: this.tripSelected.id,
                                            from: this.userUid,
                                            to: this.contacts[index].user_id,
                                            latLng: this.currentLocation.current, 
                                            status: "send=",
                                        }
                                        this.socket.emit("send-localisation", newLoc);
                                    }
                                }
                                else{
                                    let newLoc = {
                                        idTrip: this.tripSelected.id,
                                        from: this.userUid,
                                        to: this.currentContact.userUid,
                                        latLng: this.currentLocation.current, 
                                        status: "send=--",
                                    }
                                    this.socket.emit("send-localisation", newLoc);
                                }
                            }
                            
                            // this.$refs.mapRef.leafletObject.fitBounds(bounds, {
                            //     padding: [18, 18] // padding en pixels autour des limites.
                            // });
                        }
                        this.checkAndRerouteIfNeeded(currentPosition);
                    }

                }.bind(this), 10000); // Met à jour toutes les secondes, par exemple
            },
            sendIsIn(){
                if(this.mode_driver){
                    for (let index = 0; index < this.contacts.length; index++) {
                        let newLoc = {
                            idTrip: this.tripSelected.id,
                            from: this.userUid,
                            to: this.contacts[index].user_id,
                            latLng: this.currentLocation.current, 
                            status: "send=:-",
                        }
                        this.socket.emit("send-is-in", newLoc);
                    }
                }
                else{
                    let newLoc = {
                        idTrip: this.tripSelected.id,
                        from: this.userUid,
                        to: this.currentContact.userUid,
                        latLng: this.currentLocation.current, 
                        status: "send=--",
                    }
                    this.socket.emit("send-localisation", newLoc);
                }
            },
            shareLoc(){
                if( this.getGeolocalisation ){
                    this.watchId = Geolocation.watchPosition({}, async (position, err) => {
                        if (err) {
                            this.handleServerError(err, "Erreur lors de la mise à jour de votre position.");
                            return;
                        }

                        console.log('New position:', position);

                        const { latitude, longitude } = position.coords || {};
                        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                            return;
                        }
                        const currentPosition = [latitude, longitude]; // Obtenez la position actuelle
                        this.updatePassedPoints(currentPosition);

                        // const bounds = [[latitude, longitude], [43.60461578085957, 3.880710839194244]]
                        if(this.$refs.mapRef){
                            this.currentLocation.current = [latitude, longitude];

                            if( this.shareLocalisation ){
                                if(this.mode_driver){
                                    for (let index = 0; index < this.contacts.length; index++) {
                                        let newLoc = {
                                            idTrip: this.tripSelected.id,
                                            from: this.userUid,
                                            to: this.contacts[index].user_id,
                                            latLng: this.currentLocation.current, 
                                            status: "send=",
                                        }
                                        this.socket.emit("send-localisation", newLoc);
                                    }
                                }
                                else{
                                    let newLoc = {
                                        idTrip: this.tripSelected.id,
                                        from: this.userUid,
                                        to: this.currentContact.userUid,
                                        latLng: this.currentLocation.current, 
                                        status: "send=--",
                                    }
                                    this.socket.emit("send-localisation", newLoc);
                                }
                            }
                        }
                    });
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
            // updatePassedPoints(currentPosition) {
            //     // console.log("updatePassedPoints", currentPosition);
            //     // Ajoute le point actuel à la liste des points de passage
            //     this.currentLocation.passedPoints.push(currentPosition);

            //     // Vérifie chaque point de la route
            //     for (let index = 0; index < this.routes.length; index++) {
            //         this.routes[index].polylineDecoded = this.routes[index].polylineDecoded.filter(routePoint => {
            //             return !this.isPointCloseToAnyPassedPoint(routePoint, this.currentLocation.passedPoints);
            //         });
            //     }
                
            // },
            updatePassedPoints(currentPosition) {
                // Ajoute le point actuel à la liste des points de passage
                this.currentLocation.passedPoints.push(currentPosition);

                // Parcourir chaque route
                for (let routeIndex = 0; routeIndex < this.routes.length; routeIndex++) {
                    const basePolyline = Array.isArray(this.routes[routeIndex].originalPolyline)
                        ? this.routes[routeIndex].originalPolyline
                        : this.routes[routeIndex].polylineDecoded;
                    let indexPointSuivant = -1;

                    // Identifier le point suivant après le dernier point "passé"
                    for (let pointIndex = 0; pointIndex < basePolyline.length - 1; pointIndex++) {
                        const routePointActuel = basePolyline[pointIndex];
                        const routePointSuivant = basePolyline[pointIndex + 1];

                        if (this.isPointCloseToAnyPassedPoint(routePointActuel, this.currentLocation.passedPoints) &&
                            !this.isPointCloseToAnyPassedPoint(routePointSuivant, this.currentLocation.passedPoints)) {
                            indexPointSuivant = pointIndex + 1;
                            break;
                        }
                    }

                    // Supprimer tous les points jusqu'au point suivant après le dernier point "passé"
                    if (indexPointSuivant !== -1) {
                        this.routes[routeIndex].polylineDecoded = basePolyline.slice(indexPointSuivant);
                    }
                }
            },
            checkAndRerouteIfNeeded(currentPosition) {
                if (!this.routes.length || !Array.isArray(this.routes[0].polylineDecoded)) {
                    return;
                }
                const now = Date.now();
                if (now - this.lastRerouteAt < this.rerouteCooldownMs) {
                    return;
                }

                const minDistance = this.getMinDistanceToRoute(currentPosition, this.routes[0].polylineDecoded);
                if (minDistance > this.rerouteDistanceThresholdM) {
                    this.lastRerouteAt = now;
                    this.getCurrentRouteInfos();
                }
            },
            getMinDistanceToRoute(currentPosition, polyline) {
                let minDistance = Infinity;
                for (let i = 0; i < polyline.length; i++) {
                    const point = polyline[i];
                    const distance = this.calculateDistance(point, currentPosition);
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                }
                return minDistance;
            },
            updateRemainingEstimates(currentPosition) {
                if (!this.routes.length || !Array.isArray(this.routes[0].polylineDecoded)) {
                    return;
                }
                const itineraire = this.routes[0].polylineDecoded;
                if (!itineraire.length) {
                    return;
                }
                const reste = this.calculerDistanceRestante(currentPosition, itineraire);
                this.itin.distance = (reste / 1000).toFixed(2);

                const totalDistance = this.routes[0]?.infosGoogle?.distanceMeters || 0;
                const totalDurationSeconds = this.routes[0]?.infosGoogle?.duration
                    ? parseInt(this.routes[0].infosGoogle.duration.replaceAll("s", ""))
                    : 0;

                if (totalDistance > 0 && totalDurationSeconds > 0) {
                    const percent = Math.min(Math.max(reste / totalDistance, 0), 1);
                    this.itin.duration = this.convertSecondsToHoursAndMinutes(Math.round(percent * totalDurationSeconds)).toString();
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
            async avancerSurItineraire() {
                let itineraire = this.routes[0].polylineDecoded;
                let prochainPoint = itineraire[this.simuleMovement.segmentActuel + 1];
                let positionActuelle = this.currentLocation.current;
                
                const reste = this.calculerDistanceRestante(positionActuelle, itineraire);
                this.itin.distance = (reste/1000).toFixed(2);//distance en kilo-mètre
                
                const percent = reste/this.routes[0].infosGoogle.distanceMeters;
                
                this.itin.duration = this.convertSecondsToHoursAndMinutes(percent*parseInt(this.routes[0].infosGoogle.duration.replaceAll("s", ""))).toString();
                //console.log(parseInt(this.routes[0].infosGoogle.duration.replaceAll("s", "")), percent, this.routes[0].infosGoogle.distanceMeters);
                //this.updatePassedPoints(positionActuelle);
                //console.log("positionActuel", positionActuelle, prochainPoint);
                if ( prochainPoint ) {
                    // Mettre à jour la position de l'individu
                    //positionActuelle = this.calculerNouvellePosition(positionActuelle, prochainPoint, this.simuleMovement.vitesse);
                    
                    const coordinates = await Geolocation.getCurrentPosition();
                    const { latitude, longitude } = coordinates.coords;
                    positionActuelle = [latitude, longitude];
                    //console.log("positionActuel--", positionActuelle);
                    if ( this.aAtteintPoint(positionActuelle, prochainPoint) ) {
                        //console.log("Next");
                        this.simuleMovement.segmentActuel++; // Passer au segment suivant
                    }

                    this.currentLocation.current = positionActuelle;
                    //this.updatePassedPoints(positionActuelle);
                }

                // Vérifier si l'itinéraire est terminé
                if (this.simuleMovement.segmentActuel >= itineraire.length - 1) {
                    // L'itinéraire est terminé
                    clearInterval(this.simuleMovement.intervalId);
                    console.log("End");
                }
            },
            calculerDistanceRestante(pointActuel, itineraire) {
                let indexActuel = this.trouverIndexLePlusProche(pointActuel, itineraire);
                let distanceRestante = 0;

                for (let i = indexActuel; i < itineraire.length - 1; i++) {
                    distanceRestante += this.calculateDistance(itineraire[i], itineraire[i + 1]);
                }

                return distanceRestante;
            },
            trouverIndexLePlusProche(point, itineraire) {
                let indexLePlusProche = 0;
                let distanceMin = Number.MAX_VALUE;

                for (let i = 0; i < itineraire.length; i++) {
                    let distance = this.calculateDistance(point, itineraire[i]);
                    if (distance < distanceMin) {
                        distanceMin = distance;
                        indexLePlusProche = i;
                    }
                }

                return indexLePlusProche;
            },
            calculerNouvellePosition(positionActuelle, positionCible, vitesse) {
                const R = 6371e3; // Rayon de la Terre en mètres
                // Convertir les coordonnées en radians
                const lat1 = this.degresVersRadians(positionActuelle[0]);
                const lon1 = this.degresVersRadians(positionActuelle[1]);
                const lat2 = this.degresVersRadians(positionCible[0]);
                const lon2 = this.degresVersRadians(positionCible[1]);

                // Calculer la différence de coordonnées
                const dLat = lat2 - lat1;
                const dLon = lon2 - lon1;

                // Calculer la distance entre les points (approximation sur une sphère terrestre)
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distanceTotale = R * c; // R est le rayon de la Terre (environ 6371 km)

                // Calculer le ratio de la distance à parcourir sur la distance totale
                const ratio = Math.min(vitesse / distanceTotale, 1); // Assurez-vous que le ratio ne dépasse pas 1

                // Calculer les nouvelles coordonnées en utilisant le ratio
                const nouvelleLat = lat1 + ratio * dLat;
                const nouvelleLon = lon1 + ratio * dLon;

                //console.log("nouvelleLat", nouvelleLat, ratio, this.radiansVersDegres(nouvelleLat));

                // return {
                //     lat: this.radiansVersDegres(nouvelleLat),
                //     lon: this.radiansVersDegres(nouvelleLon)
                // };

                return [
                    this.radiansVersDegres(nouvelleLat),
                    this.radiansVersDegres(nouvelleLon)
                ];
            },
            degresVersRadians(degres) {
                return degres * (Math.PI / 180);
            },
            radiansVersDegres(radians) {
                return radians * (180 / Math.PI);
            },
            aAtteintPoint(positionActuelle, positionCible, seuil = 10) {
                // Calculer la distance entre la position actuelle et la position cible
                const distance = this.calculateDistance(positionActuelle, positionCible);

                // Vérifier si la distance est inférieure à un certain seuil
                return distance < seuil;
            },
            back(){
                window.location = "/profil";
            },
            setItineraire(loc, infoVillage){
                this.itineraire[loc].infos.village = infoVillage.village;
                this.itineraire[loc].infos.commune = infoVillage.commune;
                this.itineraire[loc].location.latLng.latitude = infoVillage.lat;
                this.itineraire[loc].location.latLng.longitude = infoVillage.lon;
                this.itineraire[loc].location.latLng.latLngTab = [infoVillage.lat, infoVillage.lon];
            },
            async updateName(userUid){
                //Check if account are created
                let { data: account, error: error_account } = await supabase
                    .from('account')
                    .select('*')
                    .eq('user_id', userUid);
                
                if(error_account){
                    this.handleServerError(error_account, "Impossible de récupérer le profil du conducteur.");
                }

                this.currentContact.username = account[0].username;
            }
        },
        watch: {
            tripSelected: {
                handler(newTrip, oldTrip){
                    this.ensurePassengerBookings();
                    if( newTrip?.id && (!oldTrip || newTrip.id !== oldTrip.id) ){
                        this.initializeAlertSync();
                    }
                },
                deep: false,
            },
        },
    });
</script>
