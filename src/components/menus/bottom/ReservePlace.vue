
<!-- model -->
<style lang="scss" model>
    .v-list-item i.mdi-car.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default {
        color: #2e8dff !important;
    }

    // car model
    .car.v-list-item .v-list-item-title {
        font-weight: bold;
    }

    .v-btn__prepend i.v-icon {
        font-size: 1.7em;
        margin: 0 !important;
    }

    .v-dialog.car-info {
        .v-overlay__content{
            .v-card.car-info {
                background-color: var(--bg-app-color);
                .v-toolbar{
                    background-color: var(--bg-app-color);
                    color: var(--font-color-label);
                }
                .v-list {
                    background-color: var(--bg-app-color);
                    .v-field__field {
                        background-color: var(--bg-app-color);
                        color: var(--font-color-label);
                    }

                    .v-list-item:nth-child(2) {
                        border-bottom: 1px solid #11100022 !important;
                        border-top: 1px solid #11100022 !important;
                    }

                    .v-list-item {
                        .v-list-item__content {
                            color: var(--font-color-label);
                            .v-list-item-title {
                                text-transform: capitalize;
                            }
                        }
                        .v-list-item__prepend {
                            .v-icon {
                                font-weight: bold;
                                color: var(--gray-icon-color);
                            }
                        }
                        .v-list-item__append {
                            color: var(--font-color-label);
                            .v-chip {
                                border-radius: 100px;
                                width: 24px;
                                height: 24px;
                            }
                        }
                    }
                }
            }
        }
    }
</style>

<!-- scoped -->
<style lang="scss" scoped>
    .v-card {
        width: 85%;
        background-color: var(--white-bg-color);
        color: var(--font-color-label);
        &.car {
            box-shadow: var(--box-shadow-card);
            height: 60px;
            .v-list-item {
                height: 100%;
                i.v-icon {
                    font-weight: bold;
                    color: #2e8dff;
                }
                .v-list-item-title {
                    font-weight: bold;
                }

                .v-chip {
                    position: absolute;
                    right: 15px;
                    top: 7px;
                    width: 32px;
                    border-radius: 100px;
                }
            }
        }

        &.reserve {
            box-shadow: none;
            border-radius: none;
            .wallet-infos {
                border: 1px solid rgba(0,0,0,0.05);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 16px;
                background-color: var(--bg-app-color);
                .wallet-line {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.95rem;
                    margin-bottom: 6px;
                    strong {
                        font-weight: 600;
                    }
                }
                .wallet-hint {
                    font-size: 0.85rem;
                    color: var(--font-color-label);
                    margin: 8px 0 0;
                }
            }
            .v-btn {
                margin: 15px 0px;
                margin-top: 0;
                .v-btn__prepend i.v-icon {
                font-size: 2em;
                }
            }
            .v-list-item {

                text-align: center;
                border-radius: none;
                box-shadow: none;
            }
        }
    }

   

</style>

<template>

    <!-- Infos voiture -->
    <v-card
        class="car mx-auto rounded-lg"
    >
        <v-list-item
            class="car"
            :prepend-icon="car.icon"
            :title="car.license_plate"
            @click="carInfoIsOpen = true;"
        >
            <v-chip
                class="ma-2 prix"
                :color="car.color"
                label
            >
            
            </v-chip>
        </v-list-item>
        
    </v-card>

    <!-- Partie reservation -->
    <v-card
        class="reserve mx-auto mt-5"
    >
        <div class="wallet-infos">
            <div class="wallet-line">
                <span>Crédits disponibles</span>
                <strong>{{ formatCurrency(soldes || 0) }}</strong>
            </div>
            <div class="wallet-line">
                <span>Coût total ({{ $store.state.search.nbPassenger || 1 }} place<span v-if="($store.state.search.nbPassenger || 1)>1">s</span>)</span>
                <strong>{{ reservationAvailable ? formatCurrency(totalPrice) : "Tarif indisponible" }}</strong>
            </div>
            <p class="wallet-hint">
                {{ paymentHint }}
            </p>
        </div>
        <v-btn
            class="text-none"
            prepend-icon="mdi-export-variant"
            :loading="sharing"
            :disabled="sharing || !trajetSelected?.id"
            @click="shareSelectedTrip"
            variant="text"
            block
        >
            Partager ce trajet
        </v-btn>
        <v-btn
            class="text-none"
            prepend-icon="mdi-alert-octagram"
            variant="text"
            :disabled="!trajetSelected?.id || trajetSelected.driver_id === userUid"
            @click="reportDialog = true"
            block
        >
            Signaler ce trajet
        </v-btn>

        <v-btn
            v-on:click="tryReserve"
            :disabled="overlayLoad || !reservationAvailable"
            :loading="overlayLoad"
            class="mr-4 text-none"
            prepend-icon="mdi-credit-card"
            rounded="xl" 
            size="x-large"
            variant="outlined"
            block
        >
            Réserver
        </v-btn>
    </v-card>


    <v-dialog
        v-model="carInfoIsOpen"
        class="car-info"
        :class="{'dark-mode': darkMode, 'ligth-mode': !darkMode}"
        style="z-index: 10000;"
    >
        <v-card class="car-info mx-auto">
            <v-toolbar color="gray" title="Véhicule"></v-toolbar>
            <v-list>    
                <!-- color -->
                <v-list-item
                    title="couleur"
                >
                    <template v-slot:prepend>
                        <v-icon
                            icon="mdi-palette"
                            color="gray"
                        />
                    </template>
            
                    <template v-slot:append>
                        <v-chip
                            class="ma-2 prix"
                            :color="car.color"
                            label
                        />
                    </template>
                </v-list-item>

                <!-- plaque -->
                <v-list-item
                    title="plaque"
                >
                    <template v-slot:prepend>
                        <v-icon
                            icon="mdi-card-account-details"
                            color="gray"
                        />
                    </template>
            
                    <template v-slot:append>
                        <span
                            variant="text"
                        >{{ car.license_plate }}</span>
                    </template>
                </v-list-item>

                <!-- model -->
                <v-list-item
                    title="carrosserie"
                >
                    <template v-slot:prepend>
                        <v-icon
                            :icon="car.icon"
                            color="gray"
                        />
                    </template>
            
                    <template v-slot:append>
                        <span
                            variant="text"
                        >{{ car.model }}</span>
                    </template>
                </v-list-item>

                <!-- brand -->
                <!-- <v-list-item
                    title="marque"
                >
                    <template v-slot:prepend>
                        <v-icon
                            icon
                            color="gray"
                        ><font-awesome-icon :icon="['fas', 'copyright']" /></v-icon>
                    </template>
            
                    <template v-slot:append>
                        <v-btn
                            variant="text"
                        >{{ car.brand }}</v-btn>
                    </template>
                </v-list-item> -->
            </v-list>

            <div class="contain-btn">
                <v-btn
                    class="search-btn mr-4 text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="plain"
                    block
                    @click="carInfoIsOpen = false;"
                >
                    OK
                </v-btn>
            </div>

        </v-card>
    </v-dialog>

    <v-snackbar v-model="shareCopied" color="primary" :timeout="3000" role="status">Le lien du trajet a été copié.</v-snackbar>
    <TripReportDialog v-model="reportDialog" :trip-id="trajetSelected?.id" />

    <!-- message error -->
    <v-snackbar
        v-model="showSnackbarError"
        :timeout="4000"
        color="error"
        style="z-index: 9999;"
    >
        <div class="contain-ico">
            <v-icon icon="mdi-alert-circle"></v-icon> 
        </div>
        <div>
            <span>{{ messageSnackbarError }}</span>
        </div>
    </v-snackbar>

    <v-snackbar
        v-model="showRetrySnackbar"
        :timeout="4000"
        color="warning"
        style="z-index: 9999;"
    >
        <div class="contain-ico">
            <v-icon icon="mdi-server-off"></v-icon> 
        </div>
        <div>
            <span>{{ messageSnackbarError }}</span>
        </div>
        <template #actions>
            <v-btn color="black" variant="text" @click="retryReservation">
                Réessayer
            </v-btn>
        </template>
    </v-snackbar>

    <!-- loading -->
    <v-overlay style="z-index: 9999;" disabled :model-value="overlayLoad" class="align-center justify-center">
        <v-progress-circular color="blue" indeterminate size="64"></v-progress-circular>
    </v-overlay>
</template>


<script>
    import {shareTrip} from '@/services/tripSharing.js';
    import TripReportDialog from '@/components/trip/TripReportDialog.vue';
    import {requestContextHelp} from '@/services/contextualHelp.js';
    import { serverRequest } from '@/utils/serverApi.js';
    
    import { mapActions, mapState, mapMutations } from 'vuex';
    import { Capacitor } from '@capacitor/core';


    const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';
    let stripePromise;

    /** Create an RFC 4122 v4 id used to make reservation retries idempotent. */
    function createReservationRequestId() {
        const browserCrypto = typeof window !== 'undefined' ? window.crypto : null;
        if (browserCrypto?.randomUUID) {
            return browserCrypto.randomUUID();
        }

        const bytes = new Uint8Array(16);
        if (browserCrypto?.getRandomValues) {
            browserCrypto.getRandomValues(bytes);
        }
        else {
            for (let index = 0; index < bytes.length; index += 1) {
                bytes[index] = Math.floor(Math.random() * 256);
            }
        }
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
        return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
    }


    // Components
    export default {
        name: 'reserve-place-menu-comp',
        components: {TripReportDialog},
        emits: ["test-notif-success", "no-source-founded", "notif-failed"],
        computed: {
            ...mapState("profil", ["userUid", "notification", "soldes", "customer_id", "darkMode", "modeCo"]),
            ...mapState("auth", ["customer_id"]),
            ...mapState("search", ["trajetSelected"]),
            reservationAvailable(){
                const trip=this.trajetSelected, seats=Number(this.$store.state.search.nbPassenger);
                return trip?.canReserve!==false && Number(trip?.price)>0 && Number.isInteger(seats) && seats>0
                    && Number(trip.max_seats)-Number(trip.reserved_seats??trip.passenger_number??0)>=seats && new Date(trip.departure_time).getTime()>Date.now();
            },
            totalPrice(){
                const nbPassengers = this.$store.state.search.nbPassenger || 1;
                const price = this.trajetSelected && this.trajetSelected.price ? this.trajetSelected.price : 0;
                return price * nbPassengers;
            },
            paymentHint(){
                if (!this.reservationAvailable) return 'La réservation reste indisponible tant que les informations du trajet sont incomplètes.';
                if( this.soldes >= this.totalPrice ){
                    return "Vos crédits seront réservés puis débités une fois votre présence confirmée au départ.";
                }
                return "Votre carte sera débitée uniquement après confirmation de votre présence au départ.";
            }
        },
        data() {
            return {
                reservationDisposed: false,
                carInfoIsOpen: false,
                reportDialog: false,
                sharing: false,
                shareCopied: false,
                showSnackbarError: false,
                messageSnackbarError: "",
                overlayLoad: false,
                message: "",
                accepted: false,
                showRetrySnackbar: false,
                reservationRequestId: null,
                reservationTripId: null,
                reservationSeats: null, reservationOwner: null, reservationGeneration: null,
                car: {
                    model: "AUCUN VEHICULE",
                    color: 'var(--bg-app-color)',
                    icon: "mdi-car-off",
                    brand: 'VW-GOLF',
                    license_plate: "XX-000-XX",
                },
                infosModelVehicul: [
                    {model: "Moto", color: "silver", icon:"mdi-motorbike", maxSeats:1},
                    {model: "Compact", color: "white", icon:"mdi-car-hatchback", maxSeats:4},
                    {model: "Berline", color: "red", icon:"mdi-car-sports", maxSeats:4},
                    {model: "SUV", color: "navy", icon:"mdi-car-estate", maxSeats:8},
                    {model: "Monospace", color: "gray", icon:"mdi-car-estate", maxSeats:8},
                ],
            }
        },
        props: {
        },
        mounted (){
            // const vue = this;
            this.updateCar();
        },
        beforeUnmount(){this.reservationDisposed=true;},
        methods: {
            ...mapActions("profil", ["getSoldes"]),
            ...mapMutations("trip", ["SET_RATINGS_INFO"]),
            updateCar(){
                if ( this.trajetSelected != undefined && Object.keys(this.trajetSelected).length > 0 && this.trajetSelected.car != undefined && this.trajetSelected.car ) {
                    this.car.model = this.trajetSelected.car.brand != "UNKNOWN" ? this.trajetSelected.car.brand : this.trajetSelected.car.license_plate;
                    this.car.model = this.trajetSelected.car.model;
                    this.car.brand = this.trajetSelected.car.brand;
                    this.car.license_plate = this.trajetSelected.car.license_plate;
                    this.car.color = this.trajetSelected.car.color;
                    this.car.icon = this.infosModelVehicul.find((car) => car.model == this.trajetSelected.car.model)?.icon || 'mdi-car';
                }
            },
            async shareSelectedTrip(){
                if(this.sharing)return;
                const owner=this.userUid,trip=this.trajetSelected;this.sharing=true;
                try{
                    const outcome=await shareTrip(trip);
                    if(this.userUid!==owner||this.trajetSelected!==trip)return;
                    if(outcome==='copied'){this.shareCopied=true;}
                }catch{
                    if(this.userUid===owner){this.messageSnackbarError='Impossible de partager ce trajet. Réessayez.';this.showSnackbarError=true;}
                }finally{this.sharing=false;}
            },
            async sendNotification() {
                try { await serverRequest('post','/reservation',{mode:this.modeCo,data:{tripId:this.trajetSelected.id}}); }
                catch { /* The reservation remains valid if its reminder is unavailable. */ }
            },
            async tryReserve(){
                if (!this.reservationAvailable) {
                    this.messageSnackbarError = 'Les informations du trajet sont incomplètes. La réservation est indisponible.';
                    this.showSnackbarError = true;
                    return;
                }
                const helpOwner=this.userUid,generation=this.$store.state.profil.accountGeneration;
                const tripId=this.trajetSelected?.id,seats=Number(this.$store.state.search.nbPassenger);
                const current=()=>!this.reservationDisposed&&this.userUid===helpOwner
                    &&this.$store.state.profil.accountGeneration===generation
                    &&this.trajetSelected?.id===tripId&&Number(this.$store.state.search.nbPassenger)===seats;
                if( this.overlayLoad ){
                    return;
                }

                console.log("tryReserve...");
                this.overlayLoad = true;
                if( !this.reservationRequestId || this.reservationTripId !== tripId || this.reservationSeats!==seats
                    ||this.reservationOwner!==helpOwner||this.reservationGeneration!==generation ){
                    this.reservationRequestId = createReservationRequestId();
                    this.reservationTripId = tripId;
                    this.reservationSeats=seats;this.reservationOwner=helpOwner;this.reservationGeneration=generation;
                }

                try {
                    const res = await this.getSoldes();
                    if(!current())return;
                    console.log(res);
                    if( !res || res.status !== 0 ){
                        throw new Error(
                            res?.message || "Impossible de vérifier votre solde avant la réservation."
                        );
                    }
                    this.updateCar();
                    let reserved = await this.$store.dispatch("search/reserveTrajet", {
                        requestId: this.reservationRequestId,expectedOwner:helpOwner,expectedGeneration:generation,
                    });

                    if(!current()||reserved?.stale)return;
                    if( reserved?.status === 'PAYMENT_ACTION_REQUIRED' ){
                        reserved = await this.completePaymentAuthentication(reserved,{current,owner:helpOwner,requestId:this.reservationRequestId,generation});
                    }
                    if(!current()||reserved?.stale)return;

                    if( !reserved?.valided ){
                        const message = reserved?.message || "La réservation n'a pas pu être effectuée.";
                        this.messageSnackbarError = message;
                        this.showSnackbarError = true;
                        this.showRetrySnackbar = Boolean(reserved?.retriable);
                        this.message = message;

                        // A business error (no seat, invalid card, etc.) starts a
                        // new operation on the next click. A network/server error
                        // keeps the same id so a retry cannot book twice.
                        if( !reserved?.retriable ){
                            this.reservationRequestId = null;
                            this.reservationTripId = null;
                        }
                        if( [
                            'PAYMENT_METHOD_REQUIRED',
                            'PAYMENT_PROFILE_REQUIRED',
                            'PAYMENT_RESOURCE_NOT_FOUND',
                        ].includes(reserved?.status) ){
                            this.$emit("no-source-founded");
                            return;
                        }
                        if( reserved?.retriable ){
                            return;
                        }
                        this.$emit("notif-failed");
                        return;
                    }

                    if((isAndroid || isIOS) && !reserved.replayed){
                        this.sendNotification();
                    }

                    if(!reserved.replayed&&helpOwner===this.userUid)requestContextHelp(helpOwner,'passenger',{accepted:Boolean(reserved.accepted),tripId:this.trajetSelected.id});
                    this.message = reserved.message;
                    this.accepted = reserved.accepted;
                    // Keep the candidate even when driver approval is pending;
                    // the router later verifies acceptance, presence and date.
                    this.SET_RATINGS_INFO(reserved.data);

                    this.showRetrySnackbar = false;
                    this.reservationRequestId = null;
                    this.reservationTripId = null;
                    this.$emit('test-notif-success');
                }
                catch(error){
                    if(!current())return;
                    console.error("tryReserve error:", error);
                    this.messageSnackbarError = error?.message || "Nos serveurs sont indisponibles. Vous pouvez réessayer sans risque de réserver deux fois.";
                    this.showSnackbarError = true;
                    this.showRetrySnackbar = true;
                }
                finally {
                    this.overlayLoad = false;
                }
            },
            retryReservation(){
                this.showRetrySnackbar = false;
                this.tryReserve();
            },
            async completePaymentAuthentication(action,context){
                if(!context?.current())return {valided:false,stale:true};
                if( !action?.clientSecret || !action?.paymentIntentId ){
                    throw new Error("L'authentification bancaire ne peut pas être démarrée.");
                }
                if( !stripePromise ){
                    const { loadStripe } = await import('@stripe/stripe-js');
                    stripePromise = loadStripe(process.env.VUE_APP_API_STRIPE_PK);
                }
                const stripe = await stripePromise;
                if(!context.current())return {valided:false,stale:true};
                const result = await stripe.confirmCardPayment(action.clientSecret);
                if(!context.current())return {valided:false,stale:true};
                if( result.error ){
                    throw new Error(result.error.message || "L'authentification bancaire a été annulée.");
                }
                if( result.paymentIntent?.status !== 'requires_capture' ){
                    throw new Error("L'autorisation bancaire n'a pas été validée.");
                }

                await serverRequest('post', '/bookings/authorization-finalize', {
                    expectedUserId:context.owner,
                    mode: this.modeCo,
                    data: {
                        paymentIntentId: action.paymentIntentId,
                        requestId: context.requestId,
                    },
                });
                if(!context.current())return {valided:false,stale:true};
                await this.getSoldes();
                if(!context.current())return {valided:false,stale:true};
                return this.$store.dispatch("search/reserveTrajet", {
                    requestId: context.requestId,expectedOwner:context.owner,expectedGeneration:context.generation,
                });
            },
            formatCurrency(amount){
                const value = typeof amount === "number" ? amount : parseFloat(amount) || 0;
                return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
            }
        },
        watch: {
            trajetSelected(newTrip, previousTrip){
                console.log("trajet-selected:", this.trajetSelected);
                if( newTrip?.id !== previousTrip?.id ){
                    this.reservationRequestId = null;
                    this.reservationTripId = null;
                }
                this.updateCar();
            },
        },
    };
</script>
