
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
        <v-btn
            class="text-none"
            prepend-icon="mdi-export-variant" 
            variant="text"
            block
        >
            Partager ce traget
        </v-btn>
        <v-btn
            class="text-none"
            prepend-icon="mdi-alert-octagram" 
            variant="text"
            block
        >
            Signaler ce trajet
        </v-btn>

        <v-btn
            v-on:click="tryReserve"
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

    <!-- loading -->
    <v-overlay style="z-index: 9999;" disabled :model-value="overlayLoad" class="align-center justify-center">
        <v-progress-circular color="blue" indeterminate size="64"></v-progress-circular>
    </v-overlay>
</template>


<script>
    import axios from 'axios';
    import stripe from '@/utils/stripe.js'
    
    import { mapActions, mapState, mapMutations } from 'vuex';
    import { Plugins, Capacitor } from '@capacitor/core';

    const { LocalNotifications } = Plugins;

    const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';


    // Components
    export default {
        name: 'reserve-place-menu-comp',
        emits: ["test-notif-success", "no-source-founded", "notif-failed"],
        computed: {
            ...mapState("profil", ["userUid", "notification", "soldes", "customer_id", "darkMode", "modeCo"]),
            ...mapState("auth", ["customer_id"]),
            ...mapState("search", ["trajetSelected"]),
            ...mapActions("search", ["reserveTrajet"]),
        },
        data() {
            return {
                carInfoIsOpen: false,
                showSnackbarError: false,
                messageSnackbarError: "",
                overlayLoad: false,
                message: "",
                accepted: false,
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
                    this.car.icon = this.infosModelVehicul.find((car) => car.model == this.trajetSelected.car.model).icon;
                }
            },
            async sendNotification() {
                const permission = await LocalNotifications.requestPermissions();
            
                if( permission != undefined && permission && this.notification ){
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: 1,
                            title: "Tchoup Tchoup",
                            body: `Super ! Votre trajet de ${this.trajetSelected.depart} à destination de ${this.trajetSelected.destination} à ${this.trajetSelected.hour_start} à bien été validé.`,
                            summaryText: "sumaryText!",
                            schedule: { at: new Date(Date.now() + 3000) }, // dans 5 secondes
                            iconColor: "red",
                            smallIcon: "res://icon",
                            largeIcon: "res://icon",
                        }]
                    });
                }
                else{
                    console.log("permission non accordé");
                }

                let dateString = "";

                // Nettoyage de la chaîne pour respecter le format ISO 8601 (suppression des microsecondes et conversion de +00 en Z)
                //dateString = this.trajetSelected.departure_time.replace(' ', 'T').slice(0, -3) + 'Z';
                dateString = this.trajetSelected.departure_time;
                let date = new Date(dateString);

                // Créez une nouvelle date ajustée pour le fuseau horaire local
                date.setMinutes(date.getMinutes() - 30);
                console.log("localDate", date);

                let currentDate = new Date();

                // Calculez la différence en millisecondes
                let difference = currentDate.getTime() - date.getTime();

                // Convertissez cette différence en minutes
                let differenceInMinutes = difference / (1000 * 60);

                // Vérifiez si la différence est supérieure à 30 minutes
                if ( differenceInMinutes > 30 )
                    console.log("diff-ok");
                else
                    console.log("non-diff");

                const adresse = {local: "http://192.168.134.15:8090", online: "https://server-mae-covoit-notif.infinityinsights.fr"}
                const typeUrl = this.modeCo;
                axios.post(`${adresse[typeUrl]}/reservation`, {
                    userId: this.userUid,
                    date: date,
                    title: "Tchipou Tchipou",
                    body: `Tsiyo, soyez prêt pour vôtre départ ! Horaire : ${this.trajetSelected.hour_start}. Ne soyez pas en retard !`,
                    data: {
                        largeBody: `Tsiyo : Votre trajet de ${this.trajetSelected.depart} à ${this.trajetSelected.destination} depart à ${this.trajetSelected.hour_start} est proche. Ne soyez pas en retard.`,
                    }
                })
                .then(response => {
                    console.log(response.data);
                })
                .catch(error => {
                    console.error('Il y a eu une erreur :', error);
                });   
            },
            async tryReserve(){
                console.log("tryReserve...");
                this.overlayLoad = true;
                const res = await this.getSoldes();
                console.log(res);
                this.updateCar();
                if( this.soldes < this.trajetSelected.price ){
                    console.log("pas assez de soldes...", this.soldes, this.trajetSelected.price);
                    const customer = await stripe.customers.retrieve(this.customer_id);
                    if( !(customer.metadata.source_selected 
                            && (customer.metadata.source_selected == customer.default_source 
                                || customer.metadata.source_selected == customer.invoice_settings.default_payment_method
                                )
                        ) || !customer.metadata.source_selected
                        ){
                        console.log("no-source-founded", customer);
                        this.$emit("no-source-founded");
                        this.overlayLoad = false;
                        return;
                    }
                    else{
                        console.log("source founded", customer, (customer.metadata.source_selected 
                            && (customer.metadata.source_selected == customer.default_source 
                                || customer.metadata.source_selected == customer.invoice_settings.default_payment_method
                                )), !customer.metadata.source_selected);
                    }
                }

                const reserved = await this.$store.dispatch("search/reserveTrajet", { user_id: this.$store.state.profil.userUid });
                this.overlayLoad = false;
                if( ! reserved.valided ){
                    this.messageSnackbarError=reserved.message;
                    this.showSnackbarError=true;

                    this.message = reserved.message;
                    this.$emit("notif-failed");
                }
                else{
                    if(isAndroid || isIOS)
                        this.sendNotification();

                    this.message = reserved.message;
                    this.accepted = reserved.accepted;
                    // add for notation later
                    // TODO : changement après validation du passager et chauffeur ou à la fin du trajet
                    if( this.accepted ){
                        this.SET_RATINGS_INFO(reserved.data)
                    }


                    this.$emit('test-notif-success');
                }
            },
        },
        watch: {
            trajetSelected(){
                console.log("trajet-selected:", this.trajetSelected);
                this.updateCar();
            },
        },
    };
</script>