
<style lang="scss">
   .v-list-item i.v-icon {
      font-weight: bold;
      color: #2e8dff;
   }
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
      &.car {
         box-shadow: 2px 2px 10px #eee;
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
            // width: 100%;
            margin: 10px 0px;
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
         class="mr-4 text-none "
         prepend-icon="mdi-credit-card"
         rounded="xl" 
         size="large"
         variant="outlined"
         block
      >
         Réserver
      </v-btn>
   </v-card>
</template>


<script>
   import $ from 'jquery'

   // Components
   export default {
      name: 'reserve-place-menu',
      data() {
         return {
            model_car: "VW-GOLF 7",
         }
      },
      props: {
         message: {
            type: String,
            // default: () => "notification message",
         },
      },
      mounted (){
         // const vue = this;
         $(document).ready(function() {
            $(".cont-btn-switch").on("click", function(){
               console.log("switch")
            });
         });
      },
   };
</script>