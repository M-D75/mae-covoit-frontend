
<!-- model -->
<style lang="scss" model>
   .blc-text.trajet-search-comp {
      .v-input .v-input__prepend {
         margin-right: -17px !important;
         text-align: center;
      }
      // Surcharge TrajetMember navigation incon
      .mdi-navigation.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
         top: 4px;
      }

      .v-autocomplete {
         .v-field__append-inner {
            i.v-icon.mdi-menu-down.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
               display: none;
            }
         }
      }
   }

   .blc-calendar {
      display: flex;
      height: 58px;
   }

   .mdi-account-plus.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default {
      margin-right: 15px;
      font-size: 1.4em;
   }
   .part-list {
      padding: 10px;
   }
   .card-trajet i.v-icon {
      font-size: 1.2em;
      margin-right: 10px !important;
   }
   .calendar .v-list-item-title{
      font-weight: bold;
   }


   .cont-btn-switch{
      position: absolute;
      width: 100%;
      top: -78px;
      left: 9px;
      // swap
      .v-btn {
         position: relative;
         left: 22px;
         .mdi-swap-horizontal.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
            position: absolute;
            right: 0px;
            transform: rotate(90deg);
            font-size: 1.8em;
            color: gray;
         }
      }
   }

   .nb-person.v-list-item i.v-icon {
      margin-right: 20px;
      color: gray !important;
   }
   .v-list-item i.v-icon {
      color: gray !important;
   }
</style>

<!-- scoped -->
<style lang="scss" scoped>
   .v-card {
      margin: 35px;
      margin-top: 10px;
      width: 85%;
      border-radius: 20px;
      box-shadow: 2px 2px 10px #eee;
      .v-btn.search-btn {
         position: relative;
         bottom: -8px;
         margin-top: 16px;
      }
   }
   
   .v-list-item {
      &.calendar {
         width: 70%;
         .v-list-item-title{
            font-weight: bold;
         }
         i.v-icon {
            margin-right: 10px;
         }
      }
      &.nb-person {
         .v-list-item__prepend {
            .v-list-item i.v-icon {
               margin-right: 20px;
               color: gray !important;
            }
         }
      }
      &.blc-text .v-autocomplete {
         width: 85%;
         height: 50px;
         .v-field__append-inner {
            i.v-icon.mdi-menu-down.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
               display: none;
            }
         }
      }
   }
</style>

<template>
   <v-card
      class="trajet-search-comp card-trajet mx-auto"
      max-width="500"
    >
      <v-list>
         <div class="part-list">
            <v-list-item
               class="blc-text trajet-search-comp"
            >
               <v-autocomplete
                  v-model="depart"
                  :items="communes.filter(address => address != destination)"
                  label="Départ"
                  persistent-hint
                  prepend-icon="mdi-navigation"
                  variant="solo"
                  clearable
               ></v-autocomplete>
            </v-list-item>
            
            <v-list-item
               class="blc-text trajet-search-comp"
            >
               <v-autocomplete
                  v-model="destination"
                  :items="communes.filter(address => address != depart)"
                  label="Destination"
                  persistent-hint
                  prepend-icon="mdi-navigation"
                  variant="solo"
                  clearable
               ></v-autocomplete>
            </v-list-item>

            <div class="blc-calendar">
               <v-list-item
                  class="calendar"
                  prepend-icon="mdi-calendar-month-outline"
                  title="Aujourd'hui"
               ></v-list-item>

               <v-list-item
                  class="nb-person"
                  prepend-icon="mdi-account-plus"
                  :title="number_trajet"
               >
                  <div class="cont-btn-switch">
                     <v-btn 
                        icon
                        variant="text"
                     >
                        <v-icon
                           class=""
                           @click="switch_commune()"
                           variant="text"
                        >mdi-swap-horizontal</v-icon>
                     </v-btn>
                  </div>
               </v-list-item>
            </div>
         </div>

         <v-btn
            class="search-btn mr-4 text-none"
            rounded="xl" 
            size="x-large"
            variant="outlined"
            block
            @click="testGoResult"
         >
            Rechercher
         </v-btn>
      </v-list>
  </v-card>
</template>


<script>
   import $ from 'jquery'
   import { mapState } from 'vuex';

   // Components
   export default {
      name: 'trajet-search-comp',
      computed: {
         ...mapState(['communes']),
      },
      data() {
         return {
            depart: null,
            destination: null,
            number_trajet: 1,
         }
      },
      mounted (){
         // const vue = this;
         $(document).ready(function() {
            
         });
      },
      methods: {
         switch_commune (){
            var tmp = this.depart;
            this.depart = this.destination;
            this.destination = tmp;
         },
         testGoResult(){
            // this.$router.replace("/results");
            window.location.assign("/results")
         },
      }
   };
</script>