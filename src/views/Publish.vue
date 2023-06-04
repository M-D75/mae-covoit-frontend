
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
      v-if="mode=='depart'"
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
      v-if="mode=='arriver'"
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
      <v-switch dark v-model="modeWork" label="Travail" color="blue" inset></v-switch>
   </div>

   <!-- time -->
   <BottomMenu
      v-if="mode=='time' || mode=='depart'"
      ref="BottomMenuRef" 
      :class-name="{time: true}"
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
      :class-name="{number: true}"
      :mode="mode"
      labelSelectorN1="Combien de personnes pouvez-vous prendre à bord ?"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- time hour domicile -->
   <BottomMenu
      v-if="mode=='select-day-hour-domicile'"
      ref="BottomMenuRef" 
      :class-name="{select_day_hour_domicile: true}"
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
      :class-name="{select_price: true}"
      :mode="mode"
      labelSelectorN1="Précisez le prix unitaire des places"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- notification -->
   <BottomMenu
      v-if="mode=='notification'"
      ref="BottomMenuRef"
      :class-name="{notification: true}"
      :mode="mode"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- itineraire -->
   <Itineraire v-if="mode=='itineraire'" />
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
      },
      computed: {
         ...mapState(['communes', 'communesHistory']),
      },
      data() {
         return {
            startTrajet: "",
            endTrajet: "",
            car: 0,
            saisi: "",
            open: true,
            mode: "depart",
            items: [],
            modeWork: false,
            overlay: false,
         }
      },
      mounted() {
         this.items = this.communesHistory;
         $(".mode-publish").css("display", "initial");
      },
      methods: {
         getSaisi(){
            console.log("getSaisi:", this.$refs.SearchRef.getSaisi());
            $(".mode-publish").css("display", "none");
            this.saisi = this.$refs.SearchRef.getSaisi();
            if( this.saisi == "" ) {
               this.items = this.communesHistory;
               if ( this.mode == "arriver" ) {
                  this.items = this.communesHistory.filter((commune) => this.saisi != commune && commune != this.startTrajet && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase()));
               }
               else {
                  this.items = this.communesHistory;
               }
               return;
            }

            if ( this.mode == "arriver" ) {
               this.items = this.communes.filter((commune) => this.saisi != commune && commune != this.startTrajet && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase()));
            }
            else {
               this.items = this.communes.filter((commune) => this.saisi != commune && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase()));
            }
         },
         getSelected(){
            console.log("child-selected", this.startTrajet, this.endTrajet, this.mode)
            $(".mode-publish").css("display", "none");
            if ( this.mode == "depart" ) {
               this.startTrajet = this.$refs.SearchRef.getSaisi();

               this.mode = "time";

               //open
               if ( this.$refs.BottomMenuRef ) {
                  if( ! this.overlay ){
                     this.overlay = this.$refs.BottomMenuRef.openMiddle();
                  }
               }
            }
            else if ( this.mode == "time" ) {
               
               //close
               this.overlay = false;

               this.mode = "arriver";
               this.items = this.communesHistory.filter((commune) => commune.toLocaleLowerCase() != this.startTrajet.toLocaleLowerCase());
               this.saisi = "";
            }
            else if( this.mode == "arriver" ) {
               
               if( this.$refs.SearchRef ){
                  this.endTrajet = this.$refs.SearchRef.getSaisi();
               }

               this.mode = "select-car"
            }
            else if( this.mode == "select-car" ){

               if( this.$refs.SelectCarRef ){
                  this.car = this.$refs.SelectCarRef.car;
               }

               this.mode = "nb-passenger"

               //open
               if ( this.$refs.BottomMenuRef ) {
                  if( ! this.overlay ){
                     this.overlay = this.$refs.BottomMenuRef.openMiddle();
                  }
               }
            }
            else if( this.mode == "nb-passenger" ){
               this.mode = "select-day-hour-domicile"
            }
            else if( this.mode == "select-day-hour-domicile" ){
               this.mode = "select-price"
            }
            else if( this.mode == "select-price" ){
               this.mode = "notification"
            }
         },
      },
   });
</script>
