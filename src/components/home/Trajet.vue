
<style type="text/css">
   .mdi-account-plus.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default {
      margin-right: 15px;
      font-size: 1.4em;
   }
   .part-list {
      padding: 10px;
   }
   i.v-icon {
      font-size: 1.2em;
      margin-right: 10px !important;
   }
   .calendar .v-list-item-title{
      font-weight: bold;
   }

   .cont-btn-switch{
      position: absolute;
      width: 100%;
      top: -69px;
      left: 0px;
      cursor: pointer;
   }

   .cont-btn-switch .mdi-swap-horizontal.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
      position: absolute;
      right: 0px;
      transform: rotate(90deg);
      font-size: 1.8em;
   }
</style>

<style lang="scss" scoped>
   .v-card {
      margin: 35px;
      width: 85%;
      border-radius: 20px;
      box-shadow: 2px 2px 10px #eee;
   }
   .v-btn {
      position: relative;
      bottom: -8px;
      margin-top: 16px;
   }
   .v-list-item {
      // font-size: 0.9em;
      // color: gray;
      &.calendar {
         // font-weight: bold;
         width: 70%;
         .v-list-item-title{
            font-weight: bold;
         }
         i.v-icon {
            margin-right: 10px;
         }
      }
      &.day {
         .v-list-item__prepend {
            i.v-icon {
               margin-right: 20px;
            }
         }
      }
   }

</style>

<template>
   <v-card
      class="mx-auto"
      max-width="500"
    >
      <v-list>
         <div class="part-list">
            <v-list-item
              prepend-icon="mdi-navigation"
              title="Départ"
            ></v-list-item>

            <!-- <v-divider inset></v-divider> -->
            

            <v-list-item
              prepend-icon="mdi-navigation"
              title="Destination"
            ></v-list-item>

            <div style="display:flex;">
               <v-list-item
                  class="calendar"
                  prepend-icon="mdi-calendar-month-outline"
                  title="Aujourd'hui"
               ></v-list-item>

               <v-list-item
                  class="day"
                  prepend-icon="mdi-account-plus"
                  :title="number_trajet"
               >
                  <div class="cont-btn-switch">
                     <v-list-item
                        prepend-icon="mdi-swap-horizontal"
                        title=""
                     ></v-list-item>
                  </div>
               </v-list-item>
            </div>
         </div>

         <v-btn
            class="mr-4"
            rounded="xl" 
            size="large"
            variant="outlined"
            block
         >
            Rechercher
         </v-btn>
      </v-list>
  </v-card>
</template>


<script>
   import $ from 'jquery'

   // Components
   export default {
      name: 'trajet-view',
      data() {
         return {
            number_trajet: 1,
         }
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