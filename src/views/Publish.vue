
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
   <!-- <v-overlay 
      v-model="overlay" 
      contained
      persistent
      style="z-index: 0;"
      @click="overlay = false"
   ></v-overlay> -->

   <BottomNav />
   <!-- Depart -->
   <Search 
      v-if="mode=='depart' || mode=='notification'"
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
   <TimeCard v-if="false"/>
   <SelectNumber v-if="false"/>

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

   <!-- time -->
   <BottomMenu
      v-if="mode=='time' || mode=='depart'"
      ref="BottomMenuRef" 
      :class-name="['time']"
      :mode="mode"
      labelSelectorN1="A quelle heure souhaitez-vous partir ?"

      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <SelectCar ref="SelectCarRef" v-if="mode=='select-car'" v-on:car-selected="getSelected()"/>

   <!-- number -->
   <BottomMenu
      v-if="mode=='nb-passenger' || mode=='select-car'"
      ref="BottomMenuRef" 
      :class-name="['number']"
      :mode="mode"
      labelSelectorN1="Combien de personnes pouvez-vous prendre à bord ?"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- time hour domicile -->
   <BottomMenu
      v-if="mode=='select-day-hour-domicile'"
      ref="BottomMenuRef"
      :class-name="['select_day_hour_domicile']"
      :mode="mode"
      labelSelectorN1="Repeter quelle jour ?"
      labelSelectorN2="Heur de depart du domicile"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- number -->
   <BottomMenu
      v-if="mode=='select-price'"
      ref="BottomMenuRef" 
      :class-name="['select_price']"
      :mode="mode"
      labelSelectorN1="Précisez le prix unitaire des places"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- notification -->
   <BottomMenu
      v-if="mode=='notification'"
      ref="BottomMenuRef"
      :class-name="['notification']"
      :mode="mode"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- itineraire -->
   <Itineraire 
      v-if="mode=='itineraire'"
      v-on:itineraire-valided="getSelected()" 
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

   <!-- test -->
   <BottomMenu
      v-if="mode=='register-credit-card'"
      ref="BottomMenuRef"
      :class-name="['notification']"
      :mode="mode"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />


</template>



<!--  -->
<script>
   import $ from 'jquery'
   import { defineComponent } from 'vue';
   import { mapState } from 'vuex';

   // Components
   import BottomNav from '@/components/menus/BottomNav.vue';
   import Search from '@/components/publish/Search.vue';
   import TimeCard from '@/components/menus/bottom/TimeCard.vue';
   import BottomMenu from '@/components/menus/BottomMenu.vue';
   import SelectNumber from '@/components/menus/bottom/SelectNumber.vue';
   import SelectCar from '@/components/publish/SelectCar.vue';
   import Itineraire from '@/components/publish/Itineraire.vue';
   import HourProgram from '@/components/publish/HourProgram.vue';
   import HourDepOther from '@/components/publish/HourDepOther.vue';

   export default defineComponent({
      name: 'publish-view',
      components: {
         BottomNav,
         Search,
         TimeCard,
         BottomMenu,
         SelectNumber,
         SelectCar,
         Itineraire,
         HourProgram,
         HourDepOther,
      },
      computed: {
         ...mapState(['communes', 'communesHistory']),
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
         }
      },
      mounted() {
         this.items = this.communesHistory;
         $(".mode-publish").css("display", "initial");

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
               this.items = this.communes.filter((commune) => this.saisi != commune && commune != this.infosPublish[typePath].depart && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase()));
            }
            else {
               this.items = this.communes.filter((commune) => this.saisi != commune && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase()));
            }
         },
         getSelected(){
            const typePath = this.modeWork ? "work" : "default";

            console.log("child-selected", this.infosPublish[typePath].depart, this.infosPublish[typePath].destination, this.mode)
            $(".mode-publish").css("display", "none");
            
            if ( this.mode == "depart" ) {
               this.infosPublish[typePath].depart = this.$refs.SearchRef.getSaisi();

               this.nextStepMode();

               //open
               if ( this.$refs.BottomMenuRef ) {
                  if( ! this.overlay ){
                     this.overlay = this.$refs.BottomMenuRef.openMiddle();
                  }
               }
            }
            else if ( this.mode == "time" ) {
               if( this.$refs.BottomMenuRef ){
                  this.infosPublish.default.hourDep = this.$refs.BottomMenuRef.time;
               }
               
               //close
               this.overlay = false;

               this.nextStepMode();
               this.items = this.communesHistory.filter((commune) => commune.toLocaleLowerCase() != this.infosPublish[typePath].depart.toLocaleLowerCase());
               this.saisi = "";
            }
            else if( this.mode == "destination" ) {
               if( this.$refs.SearchRef ){
                  this.infosPublish[typePath].destination = this.$refs.SearchRef.getSaisi();
               }

               this.nextStepMode();
            }
            else if( this.mode == "itineraire" ){
               this.nextStepMode();
            }
            else if( this.mode == "select-car" ){

               if( this.$refs.SelectCarRef ){
                  this.infosPublish.default.car = this.$refs.SelectCarRef.car;
               }

               this.nextStepMode();

               //open
               if ( this.$refs.BottomMenuRef ) {
                  if( ! this.overlay ){
                     this.overlay = this.$refs.BottomMenuRef.openMiddle();
                  }
               }
            }
            else if( this.mode == "nb-passenger" ){
               if( this.$refs.BottomMenuRef ){
                  this.infosPublish.default.nbPassager = this.$refs.BottomMenuRef.numberSelected;
               }
               this.nextStepMode();
            }
            else if( this.mode == "select-day-hour-domicile" ){
               if( this.$refs.BottomMenuRef ){
                  this.infosPublish.default.hourDep = this.$refs.BottomMenuRef.numberSelected;
               }
               this.nextStepMode();
            }
            else if( this.mode == "select-price" ){
               if( this.$refs.BottomMenuRef ){
                  this.infosPublish.default.price = this.$refs.BottomMenuRef.numberSelected;
               }
               console.log("infosPusblish:", this.infosPublish);

               this.nextStepMode();
            }
            //work
            else if( this.mode == "hour-program" ){
               this.infosPublish.work.hour = this.$refs.HourProgramRef.hour;
               console.log("get hour", this.infosPublish.work.hour)
               this.nextStepMode();
            }
            else{
               this.nextStepMode();
            }

            
         },
         nextStepMode(){
            if( ! this.modeWork ){
               this.indexMode = (this.indexMode + 1) % this.modePublish.default.length;
               this.mode = this.modePublish.default[this.indexMode].mode;
            }
            else{
               this.indexMode = (this.indexMode + 1) % this.modePublish.work.length;
               this.mode = this.modePublish.work[this.indexMode].mode;
            }
         },
      },
      watch: {
         modeWork(){
            console.log("modeWork-changed:", this.modeWork)
            this.modeWork ? $(".v-switch .v-input__append, .v-switch .v-input__control").css("color", "var(--blue-color)") : $(".v-switch .v-input__append, .v-switch .v-input__control").css("color", "")
         },
      }
   });
</script>
