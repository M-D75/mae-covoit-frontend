
<style lang="scss" model>
   .mode-publish {
      margin: auto;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translateX(-50%);
      .v-switch{
         margin: auto;
         font-weight: bold;
         color: var(--font-color-label);
         .v-input__append {
            color: var(--gray-icon-color);
         }
      }
   }
</style>

<!-- scss -->
<style lang="scss" scoped>

</style>
   
<!--  -->
<template>

   <!-- overlay -->
   <v-overlay 
      v-model="overlay" 
      contained
      persistent
      style="z-index: 20;"
      @click="close()"
   ></v-overlay>

   <BottomNav />

   <!-- Depart -->
   <Search 
      v-if="modePublish.default.slice(0, 2).some(item => item.mode == mode)"
      ref="SearchRef"
      title="D'ou partez vous ?"
      label="Saisissez une commune"
      :items="items"
      :history="communesHistory"
      @selected="getSelected()" 
      @saisi="getSaisi()"
   />

   <!-- Destination -->
   <Search 
      v-if="mode=='destination'"
      ref="SearchRef"
      title="Où allez vous ?"
      label="Saisissez une commune"
      :items="items"
      :history="communesHistory"
      @selected="getSelected()" 
      @saisi="getSaisi()"
   />

   <!-- Mode Publish -->
   <div class="mode-publish">
      <v-switch 
         dark 
         v-model="modeWork" 
         label="Travail" 
         color="blue" 
         inset
         append-icon="mdi-check-decagram"
      ></v-switch>
   </div>

   <!-- time : Hour Dep -->
   <BottomMenu
      v-if="mode=='time' || mode=='depart'"
      ref="BottomMenuRef" 
      :class-name="['time']"
      mode="time"
      labelSelectorN1="A quelle heure souhaitez-vous partir ?"

      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- Select car -->
   <SelectCar 
      v-if="mode=='select-car' || mode == 'nb-passenger'" 
      ref="SelectCarRef" 
      v-on:car-selected="getSelected()"
   />

   <!-- number : nb-pessenger -->
   <BottomMenu
      v-if="mode=='nb-passenger' || mode=='select-car'"
      ref="BottomMenuRef" 
      :class-name="['number']"
      mode="nb-passenger"
      labelSelectorN1="Combien de personnes pouvez-vous prendre à bord ?"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   

   <!-- itineraire -->
   <Itineraire 
      v-if="mode=='itineraire' || mode=='select-price' || mode=='notification'"
      :itineraire="itineraire"
      v-on:itineraire-valided="getSelected()" 
   />

   <!-- number : select-price -->
   <BottomMenu
      v-if="mode=='select-price' || mode=='itineraire'"
      ref="BottomMenuRef" 
      :class-name="['select_price']"
      mode="select-price"
      labelSelectorN1="Précisez le prix unitaire des places"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- notification -->
   <BottomMenu
      v-if="mode=='notification'"
      ref="BottomMenuRef"
      :class-name="['notification']"
      mode="notification"
      v-on:close="overlay = false; nextStepMode()"
      v-on:time-valided="getSelected()"
   />

   

   <!-- *********
      Work
   -->

   <HourProgram 
      v-if="mode=='hour-program'"
      ref="HourProgramRef"
      v-on:hour-valided="getSelected()"
   />

   <HourDepOther 
      v-if="mode=='hour-day-program'"
      :hour="infosPublish.work.hour"
      v-on:hour-dep-other-valided="getSelected()"
   />

   <!-- time : hour domicile -->
   <BottomMenu
      v-if="mode=='select-day-hour-domicile'"
      ref="BottomMenuRef"
      :class-name="['select_day_hour_domicile']"
      mode="select-day-hour-domicile"
      labelSelectorN1="Repeter quelle jour ?"
      labelSelectorN2="Heur de depart du domicile"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- test -->
   <BottomMenu
      v-if="mode=='register-credit-card'"
      ref="BottomMenuRef"
      :class-name="['notification']"
      mode="register-credit-card"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />


</template>



<!--  -->
<script>
   import $ from 'jquery'
   import { defineComponent } from 'vue';
   import { mapState, mapGetters, mapActions } from 'vuex';

   // Components
   import BottomNav from '@/components/menus/BottomNav.vue';
   import Search from '@/components/publish/Search.vue';
   import BottomMenu from '@/components/menus/BottomMenu.vue';
   import SelectCar from '@/components/publish/SelectCar.vue';
   import Itineraire from '@/components/publish/Itineraire.vue';
   import HourProgram from '@/components/publish/HourProgram.vue';
   import HourDepOther from '@/components/publish/HourDepOther.vue';

   export default defineComponent({
      name: 'publish-view',
      components: {
         BottomNav,
         Search,
         BottomMenu,
         SelectCar,
         Itineraire,
         HourProgram,
         HourDepOther,
      },
      computed: {
         ...mapState(['villages', 'communesHistory']),
         ...mapGetters(["getVillagesByName"]),
         ...mapActions(['getVillages']),
      },
      data() {
         return {
            saisi: "",
            open: true,
            items: [],
            overlay: false,
            mode: "depart",
            indexMode: 0,
            modeWork: false,
            modePublish: {
               default: [
                  {mode: "depart"}, 
                  {mode: "time"}, 
                  {mode: "destination"}, 
                  {mode: "select-car"},
                  {mode: "nb-passenger"},
                  {mode: "itineraire"},
                  {mode: "select-price"},
                  {mode: "notification"},
               ],
               work: [
                  {mode: "depart"},
                  {mode: "hour-program"},
                  {mode: "hour-day-program"},
                  {mode: "select-day-hour-domicile"},
               ],
            },
            infosPublish: {
               default: {
                  depart: "",
                  destination: "",
                  time: "",
                  car: 0,
                  nbPassager: 0,
                  hourDep: "",
                  price: 0,
               },
               work: {
                  depart: "",
                  destination: "",
                  time: "",
                  hour: {
                     "domicile":"08:00",
                     "work":"17:00",
                  },
                  car: 0,
                  nbPassager: 0,
                  hourDep: "",
                  price: 0,
               },
            },
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
         }
      },
      mounted() {
         this.items = this.communesHistory;
         $(".mode-publish").css("display", "initial");
         if(this.villages.length == 0){
            this.getVillages;
         }
         // //For test
         // if ( this.$refs.BottomMenuRef ) {
         //    if( ! this.overlay ){
         //       this.overlay = this.$refs.BottomMenuRef.openMiddle();
         //    }
         // }
      },
      methods: {
         getSaisi(){
            const typePath = this.modeWork ? "work" : "default";

            console.log("getSaisi:", this.$refs.SearchRef.getSaisi());
            $(".mode-publish").css("display", "none");
            
            this.saisi = this.$refs.SearchRef.getSaisi();
            if( this.saisi == "" ) {
               this.items = this.communesHistory;
               if ( this.mode == "destination" ) {
                  this.items = this.communesHistory.filter((commune) => this.saisi != commune && commune != this.infosPublish[typePath].depart && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase()));
               }
               else {
                  this.items = this.communesHistory;
               }
               return;
            }

            if ( this.mode == "destination" ) {
               this.items = this.villages.filter((dataVillage) => this.saisi != dataVillage.village && dataVillage.village != this.infosPublish[typePath].depart && dataVillage.village.toLowerCase().includes(this.saisi.toLocaleLowerCase())).map((dataVillage) => dataVillage.village);
            }
            else {
               this.items = this.villages.filter((dataVillage) => this.saisi != dataVillage.village && dataVillage.village.toLowerCase().includes(this.saisi.toLocaleLowerCase())).map((dataVillage) => dataVillage.village);
            }
         },
         getSelected(){
            const typePath = this.modeWork ? "work" : "default";

            console.log("child-selected", this.infosPublish[typePath].depart, this.infosPublish[typePath].destination, this.mode)
            $(".mode-publish").css("display", "none");
            var _tmp_village = null; 
            switch (this.mode) {
               case "depart":
                  this.infosPublish[typePath].depart = this.$refs.SearchRef.getSaisi();
                  this.itineraire.origin.infos.village = this.infosPublish[typePath].depart;
                  _tmp_village = this.getVillagesByName(this.itineraire.origin.infos.village);
                  this.setItineraire("origin", _tmp_village[0]);
                  console.log("Name origin", this.itineraire.origin)
                  this.nextStepMode();
                  
                  //open
                  if (this.$refs.BottomMenuRef && !this.overlay && !this.modeWork) {
                     this.overlay = this.$refs.BottomMenuRef.open();
                  }
                  break;

               case "time":
                  if (this.$refs.BottomMenuRef) {
                     this.infosPublish.default.hourDep = this.$refs.BottomMenuRef.time;
                  }
                  
                  //close
                  this.overlay = false;
                  this.nextStepMode();
                  this.items = this.communesHistory.filter((commune) => commune.toLowerCase() !== this.infosPublish[typePath].depart.toLowerCase());
                  this.saisi = "";
                  break;

               case "destination":
                  if (this.$refs.SearchRef) {
                     this.infosPublish[typePath].destination = this.$refs.SearchRef.getSaisi();
                     this.itineraire.destination.infos.village = this.infosPublish[typePath].destination;
                     _tmp_village = this.getVillagesByName(this.itineraire.destination.infos.village);
                     this.setItineraire("destination", _tmp_village[0]);
                     console.log("Name dest", this.itineraire.destination)
                  }
                  this.nextStepMode();
                  break;
               
               case "select-car":
                  if (this.$refs.SelectCarRef) {
                     this.infosPublish.default.car = this.$refs.SelectCarRef.car;
                  }
                  this.nextStepMode();
                  
                  //open
                  if (this.$refs.BottomMenuRef && !this.overlay) {
                     this.overlay = this.$refs.BottomMenuRef.open();
                  }
                  break;

               case "nb-passenger":
                  if (this.$refs.BottomMenuRef) {
                     this.infosPublish.default.nbPassager = this.$refs.BottomMenuRef.numberSelected;
                  }
                  this.nextStepMode();
                  break;

               case "itineraire":
                  this.nextStepMode();

                  //open
                  if (this.$refs.BottomMenuRef && !this.overlay) {
                     this.overlay = this.$refs.BottomMenuRef.open();
                  }
                  break;

               case "select-price":
                  if (this.$refs.BottomMenuRef) {
                     this.infosPublish.default.price = this.$refs.BottomMenuRef.numberSelected;
                  }
                  console.log("infosPusblish:", this.infosPublish);
                  this.nextStepMode();
                  this.overlay = true;
                  break;
               
               case "select-day-hour-domicile":
                  if (this.$refs.BottomMenuRef) {
                     this.infosPublish.default.hourDep = this.$refs.BottomMenuRef.numberSelected;
                  }
                  this.nextStepMode();
                  break;

               case "hour-program":
                  this.infosPublish.work.hour = this.$refs.HourProgramRef.hour;
                  console.log("get hour", this.infosPublish.work.hour);
                  this.nextStepMode();
                  break;

               default:
                  this.nextStepMode();
                  break;
            }
         },
         nextStepMode(){

            //
            if( this.overlay ){
               this.overlay = false;
            }

            if( ! this.modeWork ){
               this.indexMode = (this.indexMode + 1) % this.modePublish.default.length;
               this.mode = this.modePublish.default[this.indexMode].mode;
            }
            else{
               this.indexMode = (this.indexMode + 1) % this.modePublish.work.length;
               this.mode = this.modePublish.work[this.indexMode].mode;
            }

            //Reinit
            if(this.mode == this.modePublish.default[0].mode || this.mode == this.modePublish.work[0].mode){
               this.items = this.communesHistory;
               $(".mode-publish").css("display", "initial");
            }
         },
         close(){
            if( this.overlay ){
               this.overlay = false;
               if(this.$refs.BottomMenuRef){
                  this.$refs.BottomMenuRef.close();
                  this.indexMode = -1;
                  this.nextStepMode();
               }
            }
         },
         setItineraire(loc, infoVillage){
            this.itineraire[loc].infos.village = infoVillage.village;
            this.itineraire[loc].infos.commune = infoVillage.commune;
            this.itineraire[loc].location.latLng.latitude = infoVillage.lat;
            this.itineraire[loc].location.latLng.longitude = infoVillage.lon;
            this.itineraire[loc].location.latLng.latLngTab = [infoVillage.lat, infoVillage.lon];
         }
      },
      watch: {
         modeWork(){
            console.log("modeWork-changed:", this.modeWork)
            this.modeWork ? $(".v-switch .v-input__append, .v-switch .v-input__control").css("color", "var(--blue-color)") : $(".v-switch .v-input__append, .v-switch .v-input__control").css("color", "")
         },
      }
   });
</script>
