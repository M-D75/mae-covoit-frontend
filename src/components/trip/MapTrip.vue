
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
                width: 38px;
                height: 38px;
                border-radius: 14px;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--alert-color, #ff9800);
                border: 1px solid rgba(var(--v-theme-on-surface), .14);
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
                v-if="!isPublicMap && routes.length > 1"
                icon="mdi-map-marker-path"
                :disabled="routes.length <= 1"
                @click="swapRoute()"  
            />

            <v-btn 
                v-if="!isPublicMap"
                icon
                @click="$router.push({path:'/message',query:{tripId:String(tripSelected.id)}})"
                :aria-label="notifChat ? 'Messages du trajet, messages non lus' : 'Messages du trajet'"
            >
                <v-icon>mdi-chat-processing-outline</v-icon>
                <span v-if="notifChat" class="notif-chat"></span>
            </v-btn>

            <v-btn
                :icon=" shareLocalisation ? 'mdi-map-marker-outline' : 'mdi-map-marker-off-outline'"
                @click="toggleOwnLocation"
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
                v-if="!isPublicMap && mode_driver"
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
                v-if="!isPublicMap && !mode_driver && !isBeforeThreshold"
                icon
                @click="dialog_annuler = true"
            >
                <v-icon>mdi-close</v-icon>
            </v-btn>

        </div>

        <div class="menu left">
            <v-btn 
                icon="mdi-chevron-left"
                @click="back()"
            />
            <v-btn 
                v-if="!isPublicMap && !open_b"
                icon="mdi-information-slab-circle-outline"
                @click="openBottomMenuInfos()"
            />
        </div>

        <!-- Les interactions trajet/alertes sont identiques quel que soit le moteur. -->
        <MapSurface ref="MapSurfaceRef"
            :provider="mapProvider"
            :reserve-bottom-space="open_b"
            :extra-bottom-space="routeDetailsHeight"
            :zoom="zoom"
            :center="center"
            :origin="isPublicMap ? null : itineraire.origin"
            :origin-village-id="isPublicMap ? null : tripSelected.village_departure_id"
            :destination-village-id="isPublicMap ? null : tripSelected.village_arrival_id"
            :destination="isPublicMap ? null : itineraire.destination"
            :routes="isPublicMap ? [] : routes"
            :route-available="!isPublicMap && routeAvail"
            :current-location="shareLocalisation ? currentLocation.current : []"
            :shared-locations="isPublicMap ? [] : localisation"
            :shared-location-colors="colorsLoc"
            :actor-markers="isPublicMap ? null : visibleTripActors"
            :vehicle-position="zoneVehiclePosition"
            :progress-context="isPublicMap ? '' : `${tripSelected.id}:${userUid}:${zoneProgressRevision}`"
            :alerts="activeAlerts"
            :alert-types="alertTypes"
            @route-details="routeDetails = $event"
            @ready="isLoaded"
            @zone-progress="currentVillage = $event.current"
            @route-select="trajetSelected"
            @alert-select="openAlertDetails"
        />
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
        :show-route-info="!isPublicMap"
        :alert-types="alertTypeItems"
        :selected-alert-type="selectedAlertType"
        :alert-duration-label="alertDurationLabel"
        :can-signal="canCreateAlert"
        :share-localisation="shareLocalisation"
        :passenger-bookings="passengerBookings"
        :no-show-processing-id="noShowProcessingId"
        :is-driver="mode_driver"
        :passenger-boarding-access="isBoardingPassenger ? passengerCodeAccess : null"
        :show-boarding-code="passengerCodeOpen"
        :show-boarding-reason="passengerCodeNotice"
        :current-village="currentVillage"
        :native-tracking-state="{ active: nativeTrackingActive, reason: nativeTrackingReason }"
        :can-end-native-tracking="userUid === tripSelected.driver_id"
        @stop-native-tracking="stopOwnLocation"
        @end-native-tracking="endNativeTracking"
        :is-dark-mode="darkMode"
        :selected-alert="selectedAlert"
        :selected-alert-context-message="selectedAlertContextMessage"
        :can-vote-selected-alert="canVoteSelectedAlert"
        :selected-alert-vote-state="selectedAlertVoteState"
        :selected-alert-is-owner="selectedAlertIsOwner"
        :alert-vote-loading="alertVoteLoading"
        :alert-vote-action="alertVoteAction"
        :route-details="routeDetails"
        :route-details-blocked="boardingDialog || passengerCodeOpen"
        @route-details-height="routeDetailsHeight = $event"
        @retry-route-details="$refs.MapSurfaceRef?.fetchBoundaries(true)"
        ref="BottomMenuRef"
        @select-alert-type="selectedAlertType = $event"
        @confirm-alert="createLocalAlert"
        @vote-alert="voteSelectedAlert"
        @mark-passenger-no-show="markPassengerNoShow"
        @confirm-boarding="isBoardingPassenger ? openPassengerCode() : boardingDialog = true"
        @close="handleBottomMenuClose"
        @opened="open_b = true"
    >
        <template #boarding-code>
            <BoardingCode v-if="passengerCodeOpen" inline :model-value="true" :bookings="tripSelected?.bookings || []"
                :user-id="userId" :user-uid="userUid" :mode="modeCo" @update:model-value="hidePassengerCode" @confirmed="applyBoardingConfirmation" />
        </template>
    </BottomMenuTrip>

    <BoardingCode v-if="!isBoardingPassenger" v-model="boardingDialog" :is-driver="userUid === tripSelected.driver_id" :bookings="tripSelected?.bookings || []" :user-id="userId" :user-uid="userUid" :mode="modeCo" @confirmed="applyBoardingConfirmation" />

    <div v-if="!isPublicMap" class="trip-boarding-status" :class="{ 'has-boarding-access': isBoardingPassenger }" role="status" aria-live="polite">
        <template v-if="userUid === tripSelected.driver_id"><v-icon size="16" icon="mdi-account-check-outline" aria-hidden="true" /> {{ boardingSummary.onboard }} à bord <span class="status-divider">·</span> <v-icon size="16" icon="mdi-account-clock-outline" aria-hidden="true" /> {{ boardingSummary.waiting }} à récupérer</template>
        <template v-else-if="isBoardingPassenger"><span v-if="!passengerIsBoarded" class="passenger-waiting-label">En attente du véhicule</span><PassengerBoardingAccess compact :access="passengerCodeAccess" @open="openPassengerCode" @explain="explainPassengerCode" /><span v-if="passengerIsBoarded && !driverPosition"> · position indisponible</span></template>
        <template v-else-if="passengerIsBoarded">À bord · véhicule du conducteur<span v-if="!driverPosition"> · position indisponible</span></template>
        <template v-else-if="boardingSummary.hasBooking">En attente du véhicule</template>
        <template v-else>Suivi du trajet</template>
    </div>
    <TripSimulationPanel v-if="simulationAllowed" :onboard="passengerIsBoarded" :vehicle-speed="vehicleSpeed" :role="liveTripState.role" :connected="liveConnected"
        :payments="liveTripState.testPaymentsConfirmed" :message="simulationMessage" @command="simulationCommand" />

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
                    Votre position est indisponible. Vous pouvez continuer sans localisation. Pour l’activer, autorisez la localisation dans les réglages de l’application et vérifiez que la localisation du téléphone est activée.
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

    <v-dialog v-model="locationConsentDialog" max-width="480">
        <v-card title="Utiliser ma position">
            <v-card-text>
                <p v-if="isPublicMap">Votre position permet de vous situer sur la carte et de placer les signalements routiers. Elle n’est pas partagée en direct avec les autres utilisateurs de cette carte.</p>
                <p v-else>Votre position permet de suivre le trajet. Lorsque vous activez cette option, elle est envoyée au serveur MAE Solutions et partagée en direct avec les participants de votre trajet.</p>
                <p>La localisation approximative est acceptée. Une position précise améliore le suivi. Sur le web et sans suivi natif, le partage s’arrête en arrière-plan. Avec le suivi natif activé, la collecte et l’envoi continuent pendant le trajet, même si la carte est fermée ; arrêtez-les via le bouton de partage ou la notification Android.</p>
                <v-checkbox v-if="nativeTrackingAvailable" v-model="backgroundTrackingRequested" label="Continuer en arrière-plan et écran verrouillé" hide-details />
                <p v-if="nativeTrackingAvailable" class="text-caption">Notification Android ou indicateur de localisation iOS visible. Autorisation temporaire de suivi, sans accès aux paiements. L’arrêt forcé de l’app peut interrompre le suivi.</p>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="locationConsentDialog = false">Continuer sans</v-btn>
                <v-btn color="primary" :loading="locationBusy" @click="enableOwnLocation">{{ isPublicMap ? 'Utiliser ma position' : 'Activer le partage' }}</v-btn>
            </v-card-actions>
        </v-card>
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
    import { Geolocation } from '@capacitor/geolocation';
    import { getUserLocation } from '@/services/locationPermission.js';
    import { mapActions, mapState, mapGetters, mapMutations } from 'vuex';
    import io from 'socket.io-client';
    import supabase from '@/utils/supabaseClient.js';
    import { attachClientVersionListeners, createSocketAuth, getServerUrl, serverRequest } from '@/utils/serverApi.js';
    import { calculateRoutes } from '@/services/routingService.js';

    import L from "leaflet";
    import { nativeTripTracking, installNativeTrackingLifecycle } from '@/services/nativeTripTracking.js';
    import { createRouteProgress } from '@/services/routeProgress.js';
    import { createTripSimulation, normalizeTripPosition } from '@/services/tripSimulation.js';
    import { tripActorMarkers, summarizeBoarding } from '@/components/maps/tripActorMarkers.js';
    import TripSimulationPanel from '@/components/trip/TripSimulationPanel.vue';
    import { SafeAreaController } from '@aashu-dubey/capacitor-statusbar-safe-area';
    // import $ from 'jquery';

    import { Capacitor } from '@capacitor/core';


    
    //componants
    import BottomMenuTrip from '@/components/menus/trip/BottomMenuTrip.vue';
    import MapSurface from '@/components/maps/MapSurface.vue';
    import BoardingCode from '@/components/trip/BoardingCode.vue';
    import { passengerBoardingAccess, isOwnPassengerBooking } from '@/components/trip/boardingUtils.js';
    import PassengerBoardingAccess from '@/components/trip/PassengerBoardingAccess.vue';

    function mapOperation(vm){
        const profile=vm.$store.state.profil, owner=profile.userUid, generation=profile.accountGeneration;
        const trip=vm.tripSelected, epoch=vm.tripOperationEpoch;
        const accountCurrent=()=>vm.$store.state.profil.userUid===owner && vm.$store.state.profil.accountGeneration===generation;
        return {trip,owner,accountCurrent,options:{mode:vm.modeCo,expectedUserId:owner},
            current:()=>!vm.tripOperationsDisposed && vm.tripOperationEpoch===epoch
                && vm.$store.state.profil.userUid===owner && vm.$store.state.profil.accountGeneration===generation
                && String(vm.tripSelected?.id || '')===String(trip?.id || '')};
    }

    export default defineComponent({
        name: 'results-view',
        emits: ["trajet-selected"],
        computed: {
            notifChat() { return this.notMessageVue.includes(String(this.tripSelected?.id)); },
            simulationAllowed() { return process.env.NODE_ENV !== 'production' && process.env.VUE_APP_SIMULATION_ENABLED === 'true'
                && !this.isPublicMap && this.liveTripState?.simulation === true; },
            liveBookings() {
                return this.liveTripState?.bookings || (this.tripSelected.bookings || [])
                    .filter(b => b.is_accepted && !b.is_refused && !b.passenger_no_show)
                    .map(b => ({ id: b.id, userId: b.account?.user_id, in_car: Boolean(b.in_car) }));
            },
            boardingSummary() { return summarizeBoarding(this.liveBookings, this.userUid); },
            passengerIsBoarded() { return this.userUid !== this.tripSelected.driver_id && this.boardingSummary.selfOnboard; },
            driverPosition() { return this.localisation.find(p => p.from === this.tripSelected.driver_id
                && Number(p.idTrip) === Number(this.tripSelected.id) && this.liveNow - p.receivedAt <= 120000) || null; },
            vehicleSpeed() { return Number.isFinite(this.driverPosition?.speedKmh) ? Math.round(this.driverPosition.speedKmh) : null; },
            zoneVehiclePosition() {
                if (this.isPublicMap) return null;
                if (this.userUid === this.tripSelected.driver_id) {
                    if (!this.shareLocalisation || this.currentLocation.current.length !== 2) return null;
                    return { latLng: this.currentLocation.current, observedAt: this.ownPositionAt,
                        measuredAt: this.ownMeasuredAt, accuracyMeters: this.ownAccuracyMeters };
                }
                const position = this.driverPosition;
                return position ? { latLng: position.latLng, observedAt: position.receivedAt,
                    measuredAt: position.timestamp, accuracyMeters: position.accuracyMeters } : null;
            },
            visibleTripActors() {
                const bookings = this.liveBookings;
                return tripActorMarkers({ userId: this.userUid, driverId: this.tripSelected.driver_id, bookings,
                    positions: this.localisation.filter(p => Number(p.idTrip) === Number(this.tripSelected.id)), ownPosition: this.shareLocalisation ? this.currentLocation.current : [],
                    ownHeading: this.currentHeading, ownReceivedAt: this.ownPositionAt, now: this.liveNow });
            },
            ...mapState("profil", ["modeCo", "userUid", "userId", "userName", "profil", "darkMode"]),
            ...mapState("trip", ["tripSelected", "notMessageVue", "chat"]),
            ...mapGetters("search", ["getVillagesByName", "GET_ID_VILLAGE_BY_NAME"]),
            nativeTrackingAvailable() { return Capacitor.isNativePlatform() && !this.isPublicMap && !this.passengerIsBoarded && this.liveTripState?.simulation === false; },
            isPublicMap(){
                return this.context === 'public';
            },
            passengerBookings(){
                if(!this.tripSelected || !Array.isArray(this.tripSelected.bookings)){
                    return [];
                }
                return this.tripSelected.bookings.filter((booking) => !booking.passenger_no_show);
            },
            isBoardingPassenger() {
                return !this.isPublicMap && Boolean(this.userUid && this.tripSelected?.driver_id)
                    && this.userUid !== this.tripSelected.driver_id;
            },
            passengerCodeAccess() {
                if (this.passengerIsBoarded) return { status: 'onboard', canOpen: false, message: 'À bord · montée confirmée' };
                return passengerBoardingAccess(this.tripSelected?.bookings || [], this.userId, this.userUid, this.tripSelected?.departure_time, this.liveNow);
            },
            routeProgressKey() {
                const route = this.routes.find(route => route.current) || this.routes[0];
                return JSON.stringify([this.tripSelected?.id, this.userUid, route?.id, route?.originalPolyline || route?.polylineDecoded || []]);
            },
            center() {
                if(this.isPublicMap && Array.isArray(this.currentLocation.current) && this.currentLocation.current.length >= 2){
                    return this.currentLocation.current;
                }
                if(this.routes.length == 0){
                    return [ -12.7850694, 45.1658908 ]
                }
                const selected = this.routes.find(route => route.current) || this.routes[0];
                const polylinePoints = selected.originalPolyline || selected.polylineDecoded || [];


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
            selectedAlert(){
                if( !this.selectedAlertId ){
                    return null;
                }
                return this.activeAlerts.find((alert) => String(alert.id) === String(this.selectedAlertId)) || null;
            },
            selectedAlertContextMessage(){
                return this.selectedAlertContext?.message || "";
            },
            selectedAlertVoteState(){
                return this.getAlertVoteState(this.selectedAlert);
            },
            selectedAlertIsOwner(){
                return this.isAlertOwner(this.selectedAlert);
            },
            canVoteSelectedAlert(){
                return Boolean(this.selectedAlert) && !this.selectedAlertIsOwner && this.userId != null;
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
                return !this.alertCreateLoading && this.shareLocalisation && Array.isArray(this.currentLocation.current) && this.currentLocation.current.length >= 2;
            },
        },
        components: {
            BottomMenuTrip,
            MapSurface,
            BoardingCode,
            PassengerBoardingAccess,
            TripSimulationPanel,
        },
        props: {
            mapProvider: {
                type: String,
                default: '',
            },
            context: {
                type: String,
                default: 'trip',
                validator: (value) => ['trip', 'public'].includes(value),
            },
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
                routeDetails:null,routeDetailsHeight:0,
                tripOperationsDisposed:false,tripOperationEpoch:0,passengerRequest:0,cancelBookingBusy:false,
                nativeTrackingActive: false, nativeTrackingReason: 'stopped', nativeTrackingUnsubscribe: null, backgroundTrackingRequested: false,
                boardingDialog: false, passengerCodeOpen: false, passengerCodeNotice: false, currentVillage: null, routeProgressTrackers: new Map(),
                liveTripState: null, liveNow: Date.now(), liveTimer: null, liveConnected: false,
                zoneProgressRevision: 0, ownAccuracyMeters: null, ownMeasuredAt: null, currentHeading: 0, ownPositionAt: Date.now(), simulationSettings: { speed: 25, acceleration: 1, gpsAvailable: true }, positionSequence: 0, simulationEngine: null, simulationTimer: null,
                simulationMessage: '', simulationNetworkPaused: false,
                
                nowDate: new Date(),
                timer: null,
                isBeforeThreshold: false,
                minutesBefore: 15,
                dialog: false, //localisation dialog
                dialog_annuler: false,
                messageBadgeTimer: null,
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
                shareLocalisation: false,
                locationConsentDialog: false,
                locationBusy: false,
                locationSessionActive: true,
                locationForeground: true,
                locationEpoch: 0,
                preciseLocationAllowed: false,
                locationStateListener: null,
                watchId: null,
                socket: null,
                mode_driver: false,
                colorsLoc: ["red", "black", "green", "yellow"],
                localisation: [
                    // {type: "driver", latLng: [-12.7997252, 45.1038055]}, {type: "passenger", latLng: [-12.7797252, 45.1038055]}
                ],
                alertTypes: [
                    { value: 'traffic', label: 'Bouchon', color: '#ff9800', icon: 'mdi-car-brake-alert', description: 'Circulation ralentie, bouchon ou route bloquée.' },
                    { value: 'danger', label: 'Danger humain', color: '#d32f2f', icon: 'mdi-shield-alert', description: 'Coupeurs de route, menace humaine ou zone risquée.' },
                    { value: 'works', label: 'Travaux', color: '#ffa726', icon: 'mdi-traffic-cone', description: 'Chantier, voie neutralisée ou déviation.' },
                    { value: 'weather', label: 'Intempérie', color: '#4fc3f7', icon: 'mdi-weather-pouring', description: 'Pluie forte, chaussée glissante ou visibilité réduite.' },
                    { value: 'obstacle', label: 'Obstacle', color: '#8e24aa', icon: 'mdi-road-variant', description: 'Arbre, débris, pierre ou obstacle dangereux sur la route.' },
                ],
                selectedAlertType: 'traffic',
                activeAlerts: [],
                alertDurationMs: 60 * 60 * 1000,
                alertDuplicateDistanceM: 180,
                alertCleanupTimer: null,
                alertIconCache: {},
                selectedAlertId: null,
                selectedAlertContext: null,
                alertVoteLoading: false,
                alertCreateLoading: false,
                alertsDisposed: false,
                alertVoteAction: "",
            snackbarError: false,
                snackbarMessage: "",
                snackbarSuccess: false,
                snackbarSuccessMessage: "",
                noShowProcessingId: null,
        }
    },
        async mounted(){
            const operation=mapOperation(this);
            SafeAreaController.injectCSSVariables();

            // The public map deliberately skips every trip prerequisite. It
            // loads alerts without requiring location or a booking.
            document.addEventListener('visibilitychange', this.handleLocationVisibility);
            if (Capacitor.isNativePlatform()) {
                installNativeTrackingLifecycle();
                if (!this.isPublicMap) {
                    this.nativeTrackingUnsubscribe = nativeTripTracking.observe(state => {
                        if (state.active && (Number(state.tripId) !== Number(this.tripSelected.id) || state.userId !== this.userUid)) return;
                        this.nativeTrackingActive = Boolean(state.active); this.nativeTrackingReason = state.reason;
                        if (!state.active) { this.shareLocalisation = false; return; }
                        this.shareLocalisation = true;
                        if (state.position && this.locationForeground && !document.hidden) this.applyNativePosition(state.position);
                    });
                    await nativeTripTracking.restore(this.userUid, this.tripSelected.id);
                    if(!operation.current())return;
                }
                const { App } = await import('@capacitor/app');
                if(!this.locationSessionActive || !operation.current()) return;
                this.locationStateListener = await App.addListener('appStateChange', ({ isActive }) => {
                    this.locationForeground = isActive;
                    if (!isActive && !this.nativeTrackingActive) this.stopOwnLocation();
                    if (isActive && !this.isPublicMap) nativeTripTracking.restore(this.userUid, this.tripSelected.id).catch(() => {});
                });
                if(!this.locationSessionActive || !operation.current()){
                    await this.locationStateListener.remove();
                    return;
                }
            }

            if(this.isPublicMap){
                this.open_b = false;
                this.bottomMenuMode = 'alert';
                this.mode_driver = false;
                this.routeAvail = false;
                this.routes = [];
                this.socket = io(getServerUrl(this.modeCo), {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 60,
                    auth: createSocketAuth(),
                });
                this.bindAlertSocket();
                await this.initializeAlertSync();
                if(!operation.current())return;
                this.shareLoc();
                this.overlayLoad = false;
                return;
            }

            const villagesReady = await this.getVillages();
            if(!operation.current())return;
            const originVillage = this.getVillagesByName(this.tripSelected?.depart);
            const destinationVillage = this.getVillagesByName(this.tripSelected?.destination);
            if(!villagesReady || !originVillage || !destinationVillage) {
                this.showError("Les informations géographiques du trajet sont indisponibles.");
                return;
            }
            this.setItineraire("origin", originVillage);
            this.setItineraire("destination", destinationVillage);

            const isPassenger = this.tripSelected && this.tripSelected.driver_id
                ? this.userUid != this.tripSelected.driver_id
                : false;
            this.mode_driver = !isPassenger;

            await this.getContacts();
            if(!operation.current())return;
            await this.ensurePassengerBookings();
            if(!operation.current())return;

            if( isPassenger && !this.getPassengerBooking() ){
                this.showError("Ce trajet n'est plus disponible.");
                if( this.$router ){
                    this.$router.replace('/profil');
                }
                return;
            }

            this.askNewMessage();
            this.messageBadgeTimer=setInterval(()=>{if(!document.hidden)this.askNewMessage();},15000);
            
            console.log("itineraire", this.itineraire);
            this.$nextTick(function(){
                if(operation.current() && this.$refs.BottomMenuRef)
                    this.$refs.BottomMenuRef.open();
            })
            

            // real-time
            const serverUrl = getServerUrl(this.modeCo);
            if( Object.keys(this.tripSelected).length > 0 && this.userUid != this.tripSelected.driver_id ){//mode passager
                this.mode_driver = false;
                this.socket = io(serverUrl, {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 60,
                    auth: createSocketAuth(),
                    query: {
                        chatIds: [[this.userUid, this.tripSelected.driver_id].sort((a, b) => {
                                return a.localeCompare(b);
                            }).join(":")],
                    }
                });

                this.currentContact.userUid = this.tripSelected.driver_id;

                // this.updateName(this.tripSelected.driver_id);
            }
            else{
                this.mode_driver = true;
                this.contacts = Array.isArray(this.chat?.contacts) ? this.chat.contacts : [];

                console.log("this.contacts", this.contacts);
                let chatIds = [];
                for (let index = 0; index < this.contacts.length; index++) {
                    chatIds.push([this.userUid, this.contacts[index].user_id].sort((a, b) => {
                                return a.localeCompare(b);
                            }).join(":"));
                }

                this.socket = io(serverUrl, {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 60,
                    auth: createSocketAuth(),
                    query: {
                        chatIds: chatIds,
                    }
                });

                const firstContact = this.contacts[0];
                if (firstContact) {
                    this.currentContact.username = firstContact.username;
                    this.currentContact.avatarContact = firstContact.avatar;
                    this.currentContact.userUid = firstContact.user_id;
                }
            }

            this.bindAlertSocket();

            attachClientVersionListeners(this.socket);
            this.socket.on('connect', () => {
                console.log('Map-Connecté au serveur Socket.IO!');
                this.overlayLoad = false;
                this.liveConnected = true;
                this.socket.emit('trip-location-subscribe', { idTrip: this.tripSelected.id });
                this.refreshLiveTripState();
                this.askNewMessage();
                const engine = this.socket.io.engine;
                console.log(engine.transport.name);
            });

            this.socket.on('chat:changed',()=>this.askNewMessage());
            this.socket.on('get-localisation', this.receiveTripPosition);
            this.socket.on('trip-location-state', state => {
                if (Number(state.tripId) !== Number(this.tripSelected.id)) return;
                this.liveTripState = { ...this.liveTripState, ...state };
                for (const position of state.positions || []) this.receiveTripPosition(position);
            });
            this.socket.on('disconnect', () => { this.liveConnected = false; });
            this.liveTimer = setInterval(() => {
                this.liveNow = Date.now();
                if (this.passengerIsBoarded && !this.driverPosition) this.currentLocation.current = [];
                if (this.liveConnected && this.locationForeground && !document.hidden && this.liveNow - (this.lastLiveRefresh || 0) >= 5000) this.refreshLiveTripState();
            }, 1000);

            this.socket.on('stop-shared-loc', (infos) => {
                console.log("shared-stoped", infos);
                this.localisation = this.localisation.filter(loc => !(Number(loc.idTrip) === Number(infos.idTrip) && loc.from === infos.from));
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
            this.tripOperationsDisposed=true;this.tripOperationEpoch++;
            this.alertsDisposed = true;
            this.nativeTrackingUnsubscribe?.();
            clearInterval(this.messageBadgeTimer);
            clearInterval(this.liveTimer); clearInterval(this.simulationTimer); this.simulationEngine?.pause();
            this.locationSessionActive = false;
            document.removeEventListener('visibilitychange', this.handleLocationVisibility);
            if (this.locationStateListener) this.locationStateListener.remove();
            clearInterval(this.timer);
            if (this.updateLocTimerId) {
                clearInterval(this.updateLocTimerId);
                this.updateLocTimerId = null;
            }
            this.locationEpoch++;
            this.shareLocalisation = false;
            if(this.socket && !this.nativeTrackingActive) this.checkSharedLoc();
            if (this.watchId) {
                Geolocation.clearWatch({ id: this.watchId });
                this.watchId = null;
            }
            this.stopAlertCleanupTimer();
            if (this.socket) {
                this.socket.off('road-alerts:changed');
                this.socket.disconnect();
                this.socket = null;
            }
        },
        methods: {
            ...mapActions("search", ['getVillages']),
            ...mapActions("trip", ["getContacts"]),
            ...mapMutations("trip", ["SET_NOT_MESSAGE_VUE", "SET_TRIP_SELECTED"]),
            explainPassengerCode() { this.switchToMapMenu(); this.passengerCodeNotice = true; },
            openPassengerCode() {
                if (!this.isBoardingPassenger || !this.passengerCodeAccess.canOpen || this.passengerCodeOpen) return;
                this.switchToMapMenu(); this.passengerCodeNotice = false; this.passengerCodeOpen = true;
            },
            hidePassengerCode() { this.passengerCodeOpen = false; },
            handleLocationVisibility(){
                this.locationForeground = !document.hidden;
                if(document.hidden) { this.hidePassengerCode(); this.simulationEngine?.pause(); if (!this.nativeTrackingActive) this.stopOwnLocation(); }
            },
            applyNativePosition(position) {
                const [latitude, longitude] = position.latLng || [];
                this.applyTripPosition({ native: true, source: 'gps', timestamp: position.timestamp,
                    coords: { latitude, longitude, accuracy: position.accuracyMeters, heading: position.heading, speed: position.speedKmh / 3.6 } });
            },
            async endNativeTracking() {
                try { await serverRequest('post', `/trips/${this.tripSelected.id}/tracking/end`, { mode: this.modeCo }); }
                catch { this.showError('Fin du suivi non transmise. Votre partage local est arrêté ; réessayez lorsque le réseau revient.'); }
                finally { await this.stopOwnLocation(); }
            },
            async stopOwnLocation(){
                if (this.nativeTrackingActive || (this.locationBusy && this.backgroundTrackingRequested)) await nativeTripTracking.stop();
                this.simulationEngine?.pause();
                this.locationEpoch++;
                this.shareLocalisation = false;
                if(this.updateLocTimerId){
                    clearInterval(this.updateLocTimerId);
                    this.updateLocTimerId = null;
                }
                const watchId = this.watchId;
                this.watchId = null;
                if(this.socket) this.checkSharedLoc();
                if(watchId){
                    try{
                        await Geolocation.clearWatch({ id: watchId });
                    }
                    catch(error){
                        console.warn('Location watcher cleanup failed');
                    }
                }
            },
            async initializeCurrentLocation(){
                const epoch = this.locationEpoch;
                try{
                    const coordinates = await getUserLocation();
                    if(!this.locationSessionActive || !this.locationForeground || document.hidden || epoch !== this.locationEpoch) return false;
                    const { latitude, longitude } = coordinates.coords;
                    this.currentLocation.current = [latitude, longitude];
                    this.ownPositionAt = Date.now();
                    this.preciseLocationAllowed = Boolean(coordinates.precisePermission);
                    this.getGeolocalisation = true;
                    return true;
                }
                catch(error){
                    this.getGeolocalisation = false;
                    if(this.locationSessionActive && this.locationForeground && epoch === this.locationEpoch) this.dialog = true;
                    return false;
                }
            },
            async enableOwnLocation(){
                if (this.passengerIsBoarded) { this.locationConsentDialog = false; return; }
                if(this.locationBusy) return;
                this.locationConsentDialog = false;
                this.locationBusy = true;
                try{
                    if (this.backgroundTrackingRequested && this.nativeTrackingAvailable) {
                        const started = await nativeTripTracking.start({ tripId: this.tripSelected.id, userId: this.userUid, mode: this.modeCo, simulation: false });
                        if (started) { this.shareLocalisation = true; this.nativeTrackingActive = true; }
                        return;
                    }
                    if(await this.initializeCurrentLocation()){
                        this.shareLocalisation = true;
                        await this.shareLoc();
                    }
                }
                catch(error){
                    await this.stopOwnLocation();
                    if (this.backgroundTrackingRequested) this.showError(error.message || 'Suivi natif indisponible.'); else this.dialog = true;
                }
                finally{
                    this.locationBusy = false;
                }
            },
            /** Refresh alerts after a server-side mutation, without DB exposure. */
            bindAlertSocket(){
                if(!this.socket) return;
                this.socket.off('road-alerts:changed');
                this.socket.on('road-alerts:changed', () => this.fetchRemoteAlerts());
            },
            async toggleOwnLocation(){
                if(this.shareLocalisation){
                    await this.stopOwnLocation();
                }
                else{
                    this.locationConsentDialog = true;
                }
            },
            updateThresholdCheck() {
                const departure = new Date(this.tripSelected.departure_time);
                const diffInMs = departure - this.now;
                const diffInMin = diffInMs / (1000 * 60);
                this.isBeforeThreshold = diffInMin <= this.minutesBefore;
                console.log("updateThresholdCheck", this.isBeforeThreshold, departure, diffInMin, this.minutesBefore);
                
            },
            applyBoardingConfirmation(result){
                const ids = new Set((result.bookingIds || []).map(Number));
                if (this.liveTripState) this.liveTripState.bookings = this.liveTripState.bookings.map(b => ids.has(Number(b.id)) ? { ...b, in_car: true } : b);
                if (!(this.tripSelected.bookings || []).some(booking => ids.has(Number(booking.id)) && !booking.in_car)) return;
                const updates = new Map((result.bookings || []).map(booking => [Number(booking.id), booking]));
                const bookings = (this.tripSelected.bookings || []).map(booking => ids.has(Number(booking.id))
                    ? { ...booking, ...updates.get(Number(booking.id)), in_car: true } : booking);
                this.SET_TRIP_SELECTED({ ...this.tripSelected, bookings, booking: bookings });
                if (!this.mode_driver) this.$store.dispatch('profil/getSoldes');
            },
            async ensurePassengerBookings(){
                const request=++this.passengerRequest;
                if(this.mode_driver || !this.tripSelected?.id || this.tripOperationsDisposed)return;
                const op=mapOperation(this);
                if(Array.isArray(op.trip.bookings) && op.trip.bookings.length)return;
                try{
                    const {data,error}=await supabase.from('trip').select(`id, booking (*, account:public_profile (*))`).eq('id',op.trip.id).single();
                    if(!op.current() || request!==this.passengerRequest)return;
                    if(error)throw error;
                    if(Number(data?.id)!==Number(op.trip.id))throw new Error('Trajet introuvable.');
                    const bookings=(data.booking || []).filter(booking=>!booking.passenger_no_show);
                    this.SET_TRIP_SELECTED({...this.tripSelected,passenger_number:bookings.filter(booking=>booking.is_accepted).length,bookings,booking:bookings});
                }catch(error){if(op.current() && request===this.passengerRequest)this.handleServerError(error,"Impossible de récupérer les passagers du trajet.");}
            },
            async annulerTrajet(){
                if(this.cancelBookingBusy || this.tripOperationsDisposed)return;
                const op=mapOperation(this);
                if(!op.owner || !op.trip?.id)return;
                this.cancelBookingBusy=true;
                try{
                    const response=await serverRequest('delete',`/bookings/trip/${op.trip.id}`,op.options);
                    if(!op.accountCurrent())return;
                    const cancellation=response.data?.data;
                    if(response.data?.status!=='ok' || Number(cancellation?.tripId || cancellation?.trip?.id)!==Number(op.trip.id))throw new Error("Confirmation d'annulation invalide.");
                    const departure=cancellation.trip?.departure_time || op.trip.departure_time;
                    if(departure)this.$store.commit('profil/REMOVE_HISTORY_DATE_BY_VALUE',{type:'passenger',departure_time:departure});
                    if(!op.current())return;
                    await this.$store.dispatch('profil/getSoldes');
                    if(!op.current())return;
                    this.showSuccess('Réservation annulée.');this.$router?.replace('/profil');
                }catch(error){if(op.current())this.handleServerError(error,"Impossible d'annuler votre réservation.");}
                finally{if(op.current())this.cancelBookingBusy=false;}
            },
            askNewMessage(){ return this.$store.dispatch('trip/refreshUnread'); },
            getPassengerBooking(){
                console.log("getPassengerBooking", this.tripSelected, this.userId);

                if( !this.tripSelected || !this.tripSelected.bookings ){
                    return null;
                }

                return this.tripSelected.bookings.find((booking) => isOwnPassengerBooking(booking, this.userId, this.userUid) && !booking.passenger_no_show) || null;
            },
            async markPassengerNoShow(booking){
                const op=mapOperation(this);
                if(!op.owner || !op.current())return;
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
                    const response = await serverRequest('post', `/bookings/${booking.id}/no-show`, {
                        ...op.options,
                    });
                    if(!op.current())return;
                    const removedIds = new Set(response.data?.data?.bookingIds || [booking.id]);
                    const remainingBookings = (this.tripSelected.bookings || [])
                        .filter((item) => !removedIds.has(item.id));
                    const updatedTrip = {
                        ...this.tripSelected,
                        passenger_number: remainingBookings.filter((item) => item.is_accepted).length,
                        bookings: remainingBookings,
                        booking: remainingBookings,
                    };
                    this.SET_TRIP_SELECTED(updatedTrip);

                    this.showSuccess("Passager marqué absent. Les montants ont été libérés.");
                }
                catch(error){
                    if(op.current())this.handleServerError(error, "Impossible de signaler l'absence du passager.");
                }
                finally{
                    if(op.current())this.noShowProcessingId = null;
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
                const serverMessage = error?.response?.data?.message;
                this.showError(serverMessage || fallback || "Une erreur serveur est survenue.");
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
                try {
                    const routes = await calculateRoutes({
                        provider: this.mapProvider,
                        origin: this.itineraire.origin,
                        destination: this.itineraire.destination,
                        departureTime: this.itineraire.departureTime,
                        alternatives: true,
                    });
                    this.routeAvail = false;
                    this.routes = routes.map((route) => ({
                        ...route,
                        originalPolyline: route.polylineDecoded.slice(),
                    }));
                    this.itin.duration = this.routes[0].duration;
                    this.itin.distance = this.routes[0].distance;
                    this.routeAvail = true;
                }
                catch (error) {
                    this.handleServerError(error, "Impossible de calculer l'itinéraire.");
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
                    this.routes = routes.slice(0, 1).map((route) => ({
                        ...route,
                        originalPolyline: route.polylineDecoded.slice(),
                    }));
                    this.itin.duration = this.routes[0].duration;
                    this.itin.distance = this.routes[0].distance;
                    this.routeAvail = true;
                }
                catch (error) {
                    this.handleServerError(error, "Impossible de calculer l'itinéraire.");
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
            async isLoaded(){
                if(this.isPublicMap){
                    this.routeAvail = false;
                    return;
                }
                // const bounds = [this.itineraire.origin.location.latLng.latLngTab, this.itineraire.destination.location.latLng.latLngTab]
                // if(this.$refs.mapRef){
                //     this.$refs.mapRef.leafletObject.fitBounds(bounds, {
                //         padding: [18, 18] // padding en pixels autour des limites.
                //     });
                // }
                
                // await this.getRouteInfos();
                console.log("this.tripSelected:", this.tripSelected);
                if (!this.tripSelected?.route || !Array.isArray(this.tripSelected.route.polylineDecoded) || this.tripSelected.route.polylineDecoded.length < 2) {
                    this.routes = []; this.routeAvail = false;
                    this.showError('L’itinéraire de ce trajet est incomplet. Le suivi ne peut pas être affiché.');
                    return;
                }
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
                if(this.isPublicMap){
                    return;
                }
                this.switchToMapMenu();
            },
            openAlertMenu(){
                if( this.currentModeButton === 'alert' && this.open_b ){
                    if(this.isPublicMap){
                        this.$refs.BottomMenuRef?.close();
                    }
                    else{
                        this.switchToMapMenu();
                    }
                    return;
                }
                this.selectedAlertId = null;
                this.selectedAlertContext = null;
                this.setBottomMenuMode('alert', 'alert');
            },
            openPassengerMenu(){
                if( !this.mode_driver ){
                    return;
                }
                if( this.currentModeButton === 'passengers' && this.open_b ){
                    this.switchToMapMenu();
                    return;
                }
                this.selectedAlertId = null;
                this.selectedAlertContext = null;
                this.setBottomMenuMode('passengers', 'passengers');
            },
            switchToMapMenu(){
                this.selectedAlertId = null;
                this.selectedAlertContext = null;
                if(this.isPublicMap){
                    this.bottomMenuMode = 'alert';
                    this.currentModeButton = null;
                    this.$refs.BottomMenuRef?.close();
                    return;
                }
                this.bottomMenuMode = 'map';
                this.currentModeButton = null;
                if( this.$refs.BottomMenuRef ){
                    this.$refs.BottomMenuRef.open();
                }
            },
            setBottomMenuMode(mode, button = null){
                if (mode !== 'map') this.hidePassengerCode();
                this.bottomMenuMode = mode;
                this.currentModeButton = button;
                if( this.$refs.BottomMenuRef ){
                    this.$refs.BottomMenuRef.open();
                }
            },
            openAlertDetails(alert, contextMessage = ""){
                if( !alert ){
                    return;
                }
                this.selectedAlertId = alert.id;
                this.selectedAlertContext = contextMessage ? { message: contextMessage } : null;
                this.setBottomMenuMode('alert-detail', 'alert');
            },
            handleBottomMenuClose(){
                this.hidePassengerCode();
                this.open_b = false;
                this.selectedAlertId = null;
                this.selectedAlertContext = null;
                this.bottomMenuMode = this.isPublicMap ? 'alert' : 'map';
                this.currentModeButton = null;
            },
            getAlertActorKey(value){
                return value == null ? null : String(value);
            },
            getAlertVoteState(alert){
                if( !alert ){
                    return "";
                }
                if( this.isAlertOwner(alert) ){
                    return "owner";
                }
                return alert.currentUserVote || "";
            },
            isAlertOwner(alert){
                if( !alert ){
                    return false;
                }
                if(typeof alert.isOwner === 'boolean'){
                    return alert.isOwner;
                }
                const actorKey = this.getAlertActorKey(this.userId);
                return actorKey !== null && this.getAlertActorKey(alert.accountId) === actorKey;
            },
            findNearbyAlert(type, coordinates){
                if( !Array.isArray(coordinates) || coordinates.length < 2 ){
                    return null;
                }

                let nearestAlert = null;
                let nearestDistance = Infinity;

                for (const alert of this.activeAlerts) {
                    if( !alert || alert.type !== type || alert.expiresAt <= Date.now() ){
                        continue;
                    }
                    const distance = this.calculateDistance(coordinates, alert.coordinates);
                    if( distance <= this.alertDuplicateDistanceM && distance < nearestDistance ){
                        nearestDistance = distance;
                        nearestAlert = alert;
                    }
                }

                return nearestAlert;
            },
            buildNearbyAlertMessage(alert){
                const label = this.alertLabel(alert?.type);
                const voteState = this.getAlertVoteState(alert);
                if( this.isAlertOwner(alert) ){
                    return `Vous avez déjà signalé "${label}" à proximité. Inutile d'ajouter un doublon.`;
                }
                if( voteState === 'confirm' ){
                    return `Un signalement "${label}" existe déjà ici et vous l'avez déjà validé.`;
                }
                if( voteState === 'invalidate' ){
                    return `Un signalement "${label}" existe déjà ici. Vous pouvez changer votre vote si la situation a évolué.`;
                }
                return `Un signalement similaire existe déjà à proximité. Confirmez-le si le problème est toujours présent.`;
            },
            async createLocalAlert(){
                if(this.alertCreateLoading)return;
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
                const coordinates = [...this.currentLocation.current];
                const nearbyAlert = this.findNearbyAlert(typeDef.value, coordinates);

                if( nearbyAlert ){
                    this.openAlertDetails(nearbyAlert, this.buildNearbyAlertMessage(nearbyAlert));
                    if( this.isAlertOwner(nearbyAlert) ){
                        this.showError("Un signalement similaire est déjà actif à cet endroit.");
                    }
                    else{
                        this.showSuccess("Signalement similaire trouvé. Vous pouvez le valider au lieu d'en créer un nouveau.");
                    }
                    return;
                }

                const owner = this.userUid;
                const generation = this.$store.state.profil.accountGeneration;
                this.alertCreateLoading = true;
                try{
                    const response = await serverRequest('post', '/road-alerts', {
                        mode: this.modeCo,
                        data: {
                            type: typeDef.value,
                            lat: coordinates[0],
                            lng: coordinates[1],
                            tripId: this.isPublicMap ? null : this.tripSelected?.id || null,
                        },
                    });
                    if(!this.isAlertRequestCurrent(owner,generation))return;
                    const alert = this.mapAlertRow(response.data?.data?.alert);
                    if(response.data?.status !== 'ok' || !alert)throw new Error('Confirmation de signalement invalide.');
                    this.addOrReplaceAlert(alert);
                    this.openAlertDetails(alert, `Signalement "${typeDef.label}" ajouté. Les autres usagers peuvent maintenant le confirmer ou l'infirmer.`);
                    this.showSuccess(`Signalement "${typeDef.label}" ajouté sur la carte.`);
                }
                catch(error){
                    if(this.isAlertRequestCurrent(owner,generation))this.handleServerError(error, "Impossible d'enregistrer le signalement.");
                }
                finally{this.alertCreateLoading = false;}
            },
            async voteSelectedAlert(vote){
                if(this.alertVoteLoading || !['confirm','invalidate'].includes(vote))return;
                const alert = this.selectedAlert;
                if( !alert ){
                    this.showError("Ce signalement n'est plus disponible.");
                    return;
                }

                if( this.isAlertOwner(alert) ){
                    this.showError("Vous avez créé ce signalement. Un vote supplémentaire n'est pas nécessaire.");
                    return;
                }

                const currentVote = this.getAlertVoteState(alert);
                if( currentVote === vote ){
                    this.showError(vote === 'confirm' ? "Vous avez déjà validé ce signalement." : "Vous avez déjà infirmé ce signalement.");
                    return;
                }

                const owner = this.userUid;
                const generation = this.$store.state.profil.accountGeneration;
                this.alertVoteLoading = true;
                this.alertVoteAction = vote;

                try{
                    const response = await serverRequest('post', `/road-alerts/${alert.id}/vote`, {
                        mode: this.modeCo,
                        data: { vote },
                    });
                    if(!this.isAlertRequestCurrent(owner,generation))return;
                    const updatedAlert = this.mapAlertRow(response.data?.data?.alert);
                    if(response.data?.status !== 'ok' || !updatedAlert || String(updatedAlert.id)!==String(alert.id)
                        || updatedAlert.currentUserVote!==vote)throw new Error('Confirmation de vote invalide.');
                    this.addOrReplaceAlert(updatedAlert);
                    this.openAlertDetails(updatedAlert);
                    this.showSuccess(vote === 'confirm'
                        ? "Signalement validé."
                        : "Signalement infirmé.");
                }
                catch(error){
                    if(this.isAlertRequestCurrent(owner,generation))this.handleServerError(error, "Impossible d'enregistrer votre vote.");
                }
                finally{
                    this.alertVoteLoading = false;
                    this.alertVoteAction = "";
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
                    html: `<div class="alert-marker" style="--alert-color:${typeDef.color};"><span class="mdi ${typeDef.icon}"></span></div>`,
                    iconSize: [38, 38],
                    iconAnchor: [19, 19],
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
                    if( this.selectedAlertId && !filtered.some((alert) => String(alert.id) === String(this.selectedAlertId)) ){
                        this.selectedAlertId = null;
                        this.selectedAlertContext = null;
                        if( this.bottomMenuMode === 'alert-detail' ){
                            this.switchToMapMenu();
                        }
                    }
                }
                if( this.activeAlerts.length === 0 ){
                    this.stopAlertCleanupTimer();
                }
            },
            async initializeAlertSync(){
                await this.fetchRemoteAlerts();
            },
            isAlertRequestCurrent(owner,generation){
                return !this.alertsDisposed && this.userUid===owner && this.$store.state.profil.accountGeneration===generation;
            },
            async fetchRemoteAlerts(){
                const owner=this.userUid, generation=this.$store.state.profil.accountGeneration;
                try{
                    const response = await serverRequest('get', '/road-alerts', { mode: this.modeCo });
                    if(!this.isAlertRequestCurrent(owner,generation))return;
                    const rows = response.data?.data?.alerts;
                    if(response.data?.status !== 'ok' || !Array.isArray(rows))throw new Error('Liste de signalements invalide.');
                    const alerts = rows.map((row) => this.mapAlertRow(row)).filter(Boolean);
                    this.activeAlerts = alerts;
                    if( this.selectedAlertId && !alerts.some((alert) => String(alert.id) === String(this.selectedAlertId)) ){
                        this.selectedAlertId = null;
                        this.selectedAlertContext = null;
                    }
                    if( alerts.length ){
                        this.startAlertCleanupTimer();
                    }
                }
                catch(error){
                    console.error("fetchRemoteAlerts error", error);
                    if(this.isAlertRequestCurrent(owner,generation))this.showError("Impossible de charger les signalements.");
                }
            },
            mapAlertRow(row){
                if( !row ){
                    return null;
                }
                const coordinates=Array.isArray(row.coordinates)?row.coordinates:[row.lat,row.lng];
                const type=row.type||row.alert_type;
                const createdAt=new Date(row.createdAt||row.created_at).getTime();
                const expiresAt=new Date(row.expiresAt||row.expires_at).getTime();
                if(!row.id || !['traffic','danger','works','weather','obstacle'].includes(type)
                    || coordinates.length!==2 || !coordinates.every(Number.isFinite)
                    || Math.abs(coordinates[0])>90 || Math.abs(coordinates[1])>180
                    || !Number.isFinite(createdAt) || !Number.isFinite(expiresAt) || expiresAt<=createdAt)return null;
                const votes = Array.isArray(row.road_alert_vote) ? row.road_alert_vote : [];
                const actorKey = this.getAlertActorKey(this.userId);
                const legacyCurrentVote = actorKey
                    ? votes.find((vote) => this.getAlertActorKey(vote.account_id) === actorKey)?.vote_type || ""
                    : "";
                const confirmCount = Number.isInteger(row.confirmCount ?? row.confirm_count)
                    ? row.confirmCount ?? row.confirm_count
                    : votes.filter((vote) => vote.vote_type === 'confirm').length;
                const invalidateCount = Number.isInteger(row.invalidateCount ?? row.invalidate_count)
                    ? row.invalidateCount ?? row.invalidate_count
                    : votes.filter((vote) => vote.vote_type === 'invalidate').length;
                return {
                    id: row.id,
                    type,
                    coordinates,
                    createdAt,
                    expiresAt,
                    isOwner: Boolean(row.isOwner),
                    accountId: row.account_id || null,
                    currentUserVote: row.currentUserVote || legacyCurrentVote,
                    confirmCount,
                    invalidateCount,
                };
            },
            addOrReplaceAlert(alert){
                if( !alert ){
                    return;
                }
                if( alert.expiresAt <= Date.now() ){
                    this.removeAlertById(alert.id);
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
                if( this.selectedAlertId && String(this.selectedAlertId) === String(alertId) ){
                    this.selectedAlertId = null;
                    this.selectedAlertContext = null;
                    if( this.bottomMenuMode === 'alert-detail' ){
                        this.switchToMapMenu();
                    }
                }
                if( this.activeAlerts.length === 0 ){
                    this.stopAlertCleanupTimer();
                }
            },
            checkSharedLoc(){
                if (this.isPublicMap || this.shareLocalisation || !this.socket?.connected) return;
                this.socket.emit('stop-shared-localisation', { idTrip: this.tripSelected.id });
            },
            async updateLoc(){
                // One watcher owns position acquisition and stops with the sharing session.
                await this.shareLoc();
            },
            receiveTripPosition(position) {
                if (Number(position?.idTrip) !== Number(this.tripSelected.id) || !position.from || !Number.isFinite(position.receivedAt)) return;
                const index = this.localisation.findIndex(p => p.from === position.from);
                if (index >= 0 && this.localisation[index].receivedAt > position.receivedAt) return;
                if (index >= 0) this.localisation.splice(index, 1, position); else this.localisation.push(position);
                if (this.passengerIsBoarded && position.from === this.tripSelected.driver_id) this.syncPassengerToVehicle();
            },
            async refreshLiveTripState() {
                if (this.isPublicMap || !this.tripSelected?.id || this.simulationNetworkPaused) return;
                const op=mapOperation(this);
                if(!op.current())return;
                this.lastLiveRefresh = Date.now();
                try {
                    const response = await serverRequest('get', `/trips/${op.trip.id}/live-state`, op.options);
                    if(!op.current())return;
                    if (Number(response.data.data?.tripId) !== Number(this.tripSelected.id)) return;
                    this.liveTripState = response.data.data;
                    const confirmed = this.liveTripState.bookings.filter(b => b.in_car).map(b => b.id);
                    if (confirmed.length) this.applyBoardingConfirmation({ bookingIds: confirmed });
                } catch { if(op.current())this.simulationMessage = 'État du trajet indisponible. Vérifiez la connexion et le backend.'; }
            },
            enterVehicleFollow() {
                if (this.nativeTrackingActive || (this.locationBusy && this.backgroundTrackingRequested)) nativeTripTracking.stop().catch(() => {});
                this.resetRouteProgress();
                this.simulationEngine?.pause(); clearInterval(this.simulationTimer); this.simulationTimer = null;
                this.locationEpoch++;
                if (this.watchId) { Geolocation.clearWatch({ id: this.watchId }).catch(() => {}); this.watchId = null; }
                this.simulationMessage = 'À bord : déplacement piloté par le conducteur.';
                this.syncPassengerToVehicle();
            },
            syncPassengerToVehicle() {
                if (!this.passengerIsBoarded) return;
                const position = this.driverPosition;
                if (!position) { this.currentLocation.current = []; return; }
                this.currentLocation.current = [...position.latLng]; this.currentHeading = position.heading;
                this.ownPositionAt = position.receivedAt;
                this.updatePassedPoints({ latLng: position.latLng, accuracyMeters: position.accuracyMeters,
                    observedAt: position.receivedAt, measuredAt: position.timestamp, source: position.source });
                this.updateRemainingEstimates();
            },
            applyTripPosition(position) {
                if (this.passengerIsBoarded) return;
                if (!this.shareLocalisation || !this.locationSessionActive || !this.locationForeground || document.hidden) return;
                const point = normalizeTripPosition(position, this.currentLocation.current, this.currentHeading);
                if (!point) return;
                this.currentLocation.current = point.latLng; this.currentHeading = point.heading; this.ownPositionAt = Date.now(); this.ownMeasuredAt = point.timestamp;
                this.ownAccuracyMeters = point.accuracyMeters; this.liveNow = Date.now();
                if (!this.isPublicMap) {
                    if (this.userUid === this.tripSelected.driver_id) {
                        this.updatePassedPoints({ ...point, observedAt: this.ownPositionAt, measuredAt: point.timestamp }); this.updateRemainingEstimates();
                        if (point.source === 'gps') this.checkAndRerouteIfNeeded(point.latLng);
                    }
                    if (!position.native && this.socket?.connected) this.socket.emit('send-localisation', { ...point, idTrip: this.tripSelected.id, sequence: ++this.positionSequence });
                }
            },
            async simulationCommand(command, value) {
                if (!this.simulationAllowed) return;
                if (this.passengerIsBoarded && command !== 'network') {
                    this.simulationMessage = 'À bord : la session conducteur pilote le véhicule.'; return;
                }
                try {
                    if (command === 'configure') { this.simulationSettings = value; if (this.simulationEngine) Object.assign(this.simulationEngine.state, value); return; }
                    if (command === 'real') {
                        await this.stopOwnLocation(); clearInterval(this.simulationTimer); this.simulationEngine = null; this.zoneProgressRevision++; this.resetRouteProgress();
                        this.simulationNetworkPaused = false; this.socket?.connect(); this.locationConsentDialog = true; return;
                    }
                    if (command === 'network') {
                        this.simulationNetworkPaused = value;
                        if (value) this.socket?.disconnect(); else this.socket?.connect(); return;
                    }
                    if (!this.simulationEngine) {
                        if (!['start', 'reset', 'seek', 'place'].includes(command)) return;
                        const route = this.routes.find(r => r.current) || this.routes[0];
                        const engine = createTripSimulation(route?.originalPolyline || route?.polylineDecoded || [], position => this.applyTripPosition(position));
                        await this.stopOwnLocation(); this.simulationEngine = engine; this.zoneProgressRevision++; Object.assign(engine.state, this.simulationSettings);
                        this.simulationTimer = setInterval(() => this.simulationEngine?.tick(), 1000);
                    }
                    if (command === 'configure') { Object.assign(this.simulationEngine.state, value); return; }
                    if (command === 'pause') { this.simulationEngine.pause(); return; }
                    this.shareLocalisation = true; this.getGeolocalisation = true;
                    if (command === 'start') this.simulationEngine.start();
                    if (command === 'reset') { this.zoneProgressRevision++; this.resetRouteProgress(); this.simulationEngine.reset(); }
                    if (command === 'seek') this.simulationEngine.seek(value);
                    if (command === 'place') this.simulationEngine.place(value);
                    this.simulationMessage = 'Simulation de position active. La montée reste indépendante et exige le vrai PIN.';
                } catch (error) { this.simulationMessage = error.message; }
            },
            async shareLoc(){
                if (this.simulationEngine || this.passengerIsBoarded || this.nativeTrackingActive) return;
                if (this.getGeolocalisation && this.shareLocalisation && !this.watchId) {
                    const epoch = this.locationEpoch;
                    const watchId = await Geolocation.watchPosition({ enableHighAccuracy: this.preciseLocationAllowed, timeout: 15000 }, async (position, err) => {
                        if (!this.shareLocalisation || !this.locationSessionActive || !this.locationForeground || document.hidden || epoch !== this.locationEpoch) return;
                        if (err) { await this.stopOwnLocation(); this.dialog = true; return; }
                        this.applyTripPosition(position);
                    });
                    if (!this.shareLocalisation || !this.locationSessionActive || !this.locationForeground || document.hidden || epoch !== this.locationEpoch) await Geolocation.clearWatch({ id: watchId });
                    else this.watchId = watchId;
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
            resetRouteProgress() {
                this.routeProgressTrackers = new Map();
                this.currentLocation.passedPoints = [];
                for (const route of this.routes) {
                    if (route.originalPolyline) route.polylineDecoded = route.originalPolyline.slice();
                    route.remainingMeters = null; route.totalPolylineMeters = null;
                }
            },
            updatePassedPoints(sample) {
                for (const route of this.routes) {
                    if (!route.originalPolyline) route.originalPolyline = (route.polylineDecoded || []).slice();
                    let tracker = this.routeProgressTrackers.get(route.originalPolyline);
                    if (!tracker) { tracker = createRouteProgress(route.originalPolyline); this.routeProgressTrackers.set(route.originalPolyline, tracker); }
                    const result = tracker.update(sample);
                    if (result.progressed) {
                        route.polylineDecoded = result.path; route.remainingMeters = result.remainingMeters;
                        route.totalPolylineMeters = result.totalMeters;
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
            updateRemainingEstimates() {
                const route = this.routes.find(route => route.current) || this.routes[0];
                if (!route || !Number.isFinite(route.remainingMeters)) return;
                this.itin.distance = (route.remainingMeters / 1000).toFixed(2);
                const totalDurationSeconds = typeof route.infosGoogle?.duration === 'string'
                    ? parseInt(route.infosGoogle.duration.replaceAll('s', '')) : 0;
                if (route.totalPolylineMeters > 0 && totalDurationSeconds > 0) {
                    this.itin.duration = this.convertSecondsToHoursAndMinutes(Math.round(totalDurationSeconds * route.remainingMeters / route.totalPolylineMeters));
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
                if ( prochainPoint && this.shareLocalisation && this.locationSessionActive && this.locationForeground && !document.hidden ) {
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
                this.$router.push(this.isPublicMap ? '/search' : '/profil');
            },
            setItineraire(loc, infoVillage){
                if(!this.itineraire?.[loc] || !infoVillage) return false;
                this.itineraire[loc].infos.village = infoVillage.village;
                this.itineraire[loc].infos.commune = infoVillage.commune;
                this.itineraire[loc].location.latLng.latitude = infoVillage.lat;
                this.itineraire[loc].location.latLng.longitude = infoVillage.lon;
                this.itineraire[loc].location.latLng.latLngTab = [infoVillage.lat, infoVillage.lon];
                return true;
            },
            async updateName(userUid){
                const owner=this.userUid,contact=this.currentContact;
                //Check if account are created
                let { data: account, error: error_account } = await supabase
                    .from('public_profile')
                    .select('*')
                    .eq('user_id', userUid);
                
                if(this.userUid!==owner||this.currentContact!==contact)return;
                if(error_account||!account?.length){
                    this.handleServerError(error_account, "Impossible de récupérer le profil du conducteur.");return;
                }
                this.currentContact.username = account[0].username;
            }
        },
        watch: {
            routeProgressKey() { this.resetRouteProgress(); if (this.passengerIsBoarded) this.syncPassengerToVehicle(); },
            passengerCodeAccess(access) { if (!access.canOpen && this.passengerCodeOpen) this.hidePassengerCode(); if (access.canOpen) this.passengerCodeNotice = false; },
            userUid() { this.tripOperationEpoch++;this.cancelBookingBusy=false;this.noShowProcessingId=null; if (this.nativeTrackingActive || (this.locationBusy && this.backgroundTrackingRequested)) nativeTripTracking.stop().catch(() => {}); this.boardingDialog = false; this.passengerCodeNotice = false; this.hidePassengerCode(); this.resetRouteProgress(); this.currentVillage = null; },
            passengerIsBoarded: { immediate: true, handler(boarded) { if (boarded) this.enterVehicleFollow(); } },
            tripSelected: {
                handler(newTrip, oldTrip){
                    if(this.isPublicMap){
                        return;
                    }
                    if(newTrip?.id!==oldTrip?.id){this.tripOperationEpoch++;this.cancelBookingBusy=false;this.noShowProcessingId=null;}
                    if( newTrip?.id && (!oldTrip || newTrip.id !== oldTrip.id) ){
                        this.boardingDialog = false; this.passengerCodeNotice = false; this.hidePassengerCode(); this.currentVillage = null; this.resetRouteProgress();
                        if (oldTrip?.id && this.socket?.connected) this.socket.emit('stop-shared-localisation', { idTrip: oldTrip.id });
                        this.simulationEngine?.pause(); clearInterval(this.simulationTimer); this.simulationEngine = null;
                        this.localisation = []; this.liveTripState = null;
                        this.mode_driver = newTrip.driver_id === this.userUid;
                        this.stopOwnLocation();
                        if (this.socket?.connected) this.socket.emit('trip-location-subscribe', { idTrip: newTrip.id });
                        this.refreshLiveTripState();
                        this.initializeAlertSync();
                    }
                    this.ensurePassengerBookings();
                },
                deep: false,
            },
        },
    });
</script>

<style scoped>
.trip-boarding-status { position: absolute; top: calc(var(--safe-top, 0px) + 12px); left: 50%; transform: translateX(-50%); z-index: 2200; max-width: calc(100% - 130px); border: 1px solid rgba(var(--v-theme-on-surface), .14); border-radius: 12px; padding: 3px 10px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; text-align: center; box-shadow: 0 2px 8px #0004; }
</style>

<style scoped>
.trip-boarding-status.has-boarding-access { width: max-content; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; }
.passenger-waiting-label { font-size: 12px; }
.status-divider { margin: 0 3px; opacity: .6; }
@media (max-width: 430px) { .passenger-waiting-label { display: none; } }
</style>
