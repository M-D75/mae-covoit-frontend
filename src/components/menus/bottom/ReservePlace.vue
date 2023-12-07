
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
                min-width: 50px;
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
            prepend-icon="mdi-car"
            :title="model_car"
        >
            <v-chip
                class="ma-2 prix"
                color="blue"
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

    <v-snackbar
        v-model="showSnackbarError"
        :timeout="4000"
        color="error"
        style="z-index: 9999;"
    >
        <v-icon icon="mdi-alert-circle"></v-icon> <span>{{ messageSnackbarError }}</span>
    </v-snackbar>

    <!-- loading -->
    <v-overlay style="z-index: 9999;" disabled :model-value="overlayLoad" class="align-center justify-center">
        <v-progress-circular color="blue" indeterminate size="64"></v-progress-circular>
    </v-overlay>
</template>


<script>
    import $ from 'jquery'
    import axios from 'axios';
    
    import { mapActions, mapState } from 'vuex';
    import { Plugins, Capacitor } from '@capacitor/core';

    const { LocalNotifications } = Plugins;

    const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';


    // Components
    export default {
        name: 'reserve-place-menu-comp',
        emits: ["test-notif-success"],
        computed: {
            ...mapState("profil", ["userUid", "notification"]),
            ...mapState("search", ["trajetSelected"]),
            ...mapActions("search", ["reserveTrajet"]),
        },
        data() {
            return {
                model_car: "VW-GOLF 7",
                showSnackbarError: false,
                messageSnackbarError: "",
                overlayLoad: false,
                message: "",
                accepted: false,
            }
        },
        props: {
        },
        mounted (){
            // const vue = this;
            $(document).ready(function() {
            });
        },
        methods: {
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

                    let dateString = "";

                    // Nettoyage de la chaîne pour respecter le format ISO 8601 (suppression des microsecondes et conversion de +00 en Z)
                    //dateString = this.trajetSelected.departure_time.replace(' ', 'T').slice(0, -3) + 'Z';
                    dateString = this.trajetSelected.departure_time;
                    let date = new Date(dateString);

                    // Créez une nouvelle date ajustée pour le fuseau horaire local
                    date.setMinutes(date.getMinutes() - 5);
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
                    axios.post(`${adresse.online}/reservation`, {
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

                    // await LocalNotifications.schedule({
                    //     notifications: [{
                    //         id: 1,
                    //         title: "Tchipou Tchipou",
                    //         body: "Tsiyo, soyez prêt pour vôtre départ !",
                    //         largeBody: `Tsiyo : Votre trajet de ${this.trajetSelected.depart} à ${this.trajetSelected.destination} depart à ${this.trajetSelected.hour_start} est proche. Ne soyez pas en retard.`,
                    //         summaryText: "",
                    //         schedule: { at: date }, // dans 5 secondes
                    //         iconColor: "red",
                    //         smallIcon: "res://icon",
                    //         largeIcon: "res://icon",
                    //     }]
                    // });
                //} 
                }
                else{
                    console.log("permission non accordé");
                }
            },
            async tryReserve(){
                this.overlayLoad = true;
                const reserved = await this.$store.dispatch("search/reserveTrajet", { user_id: this.$store.state.profil.userUid });
                this.overlayLoad = false;
                if( ! reserved.valided ){
                    this.messageSnackbarError=reserved.message;
                    this.showSnackbarError=true;
                }
                else{
                    if(isAndroid || isIOS)
                        this.sendNotification();

                    this.message = reserved.message;
                    this.accepted = reserved.accepted;
                    this.$emit('test-notif-success');
                }
            },
        },
    };
</script>