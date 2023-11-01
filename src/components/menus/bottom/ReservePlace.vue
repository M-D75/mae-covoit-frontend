
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
</template>


<script>
    import $ from 'jquery'
    
    import { mapActions, mapState } from 'vuex';
    import { Plugins } from '@capacitor/core';

    const { LocalNotifications } = Plugins;

    // Components
    export default {
        name: 'reserve-place-menu-comp',
        emits: ["test-notif-success"],
        computed: {
            ...mapState("search", ["trajetSelected"]),
            ...mapActions("search", ["reserveTrajet"]),
        },
        data() {
            return {
                model_car: "VW-GOLF 7",
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
            
                if( permission ){
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: 1,
                            title: "Tchoup Tchoup",
                            body: `Super ! Votre trajet de ${this.trajetSelected.depart} à ${this.trajetSelected.destination} à bien été validéÒÒ.`,
                            summaryText: "sumaryText!",
                            schedule: { at: new Date(Date.now() + 3000) }, // dans 5 secondes
                            iconColor: "red",
                            smallIcon: "res://large_logo",
                            largeIcon: "res://large_logo",
                        }]
                    });
                }
                else{
                    console.log("permission non accordé");
                }
            },
            async tryReserve(){
                const reserved = await this.$store.dispatch("search/reserveTrajet", {trip_id: this.$store.state.search.trajetSelected.id, user_id: this.$store.state.profil.userUid});

                if(reserved){
                this.sendNotification();
                this.$emit('test-notif-success');
                }
                else
                console.log("Erreur de reservation");
            },
        },
    };
</script>