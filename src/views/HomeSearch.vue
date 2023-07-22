
<style lang="scss" model>
   .home-search-view {
      // calendar 
      .trajet-search {
         z-index: 100 !important;
      }
      .pile-search {
         z-index: 0 !important;
      }
   }
</style>

<!-- scss -->
<style lang="scss" scoped>
   .v-row.home-search-view{
      margin: 30px auto;
      .title {
         font-size: var(--font-size-h1);
         color: var(--font-color-label);
         font-weight: bold;
         width: 100%;
         padding: 0 39px 0px 39px;
         margin: auto;
      }
   }
</style>
   
<!--  -->
<template>

   <!-- overlay -->
   <v-overlay 
      v-model="overlay" 
      contained
      persistent
      style="z-index: 30;"
      @click="close()"
   ></v-overlay>

   <v-row 
      class="home-search-view mt-40 mb-0"
      style="margin-top: 40px;"
   >
      <!-- Title -->
      <div
         class="title text-center"
      >Le choix de trajets à petits prix</div>

      <!-- image -->
      <v-col>
         <v-img
            style="margin: auto;"
            :width="200"
            aspect-ratio="16/9"
            cover
            src="@/assets/car-removebg-preview.png"
         ></v-img>
      </v-col>
   </v-row>

   <!-- Find Trajet -->
   <TrajetSearch 
      class="trajet-search" 
      ref="TrajetSearchRef"
      :dateString="dateString"
      :dep="depart"
      :dest="destination"
      :nb-passager="nbPassager"
      v-on:trajet-selected="getTrajet()" 
      v-on:open-calendar="openCalendar()"
      v-on:open-dep="openSearch('dep')"
      v-on:open-dest="openSearch('dest')"
      v-on:open-nb-passenger="openSelectNumber()"
      v-on:switch-commune="switchCommune()"
   />

   <!-- Find Fast Trajet -->
   <Pile 
      class="pile-search"
      :infos="infos"
      v-on:reserve="reserve()"
   />

   <!-- Menu -->
   <BottomNav />

   <!-- Get Value -->
   <PaneGetValue
      ref="PaneGetValueRef"
      :mode="modePanel" 
      :open-p="openP"
      v-on:dep-selected="getDepart()"
      v-on:dest-selected="getDestination()"
      v-on:date-selected="getDate()"
      v-on:close-calendar="close()"
   />

   <!-- number : nb-pessenger -->
   <BottomMenu
      ref="BottomMenuRef"
      :class-name="['number']"
      :params-number="{min: 1, max:8}"
      mode="nb-passenger"
      labelSelectorN1="Réservation pour combien de personnes ?"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- reserve fast -->
   <BottomMenu 
      ref="BottomMenuRefResults"
      :class-name="['results']" 
      mode="reserve"
      v-on:close="overlay = false" 
      :infos="infos"
   />

</template>



<!--  -->
<script>
   // import $ from 'jquery'
   import { defineComponent } from 'vue';

   // Components
   import TrajetSearch from '@/components/search/TrajetSearch.vue';
   import Pile from '@/components/search/Pile.vue'
   import BottomNav from '@/components/menus/BottomNav.vue';
   import PaneGetValue from '@/components/menus/PaneGetValue.vue';
   import BottomMenu from '@/components/menus/BottomMenu.vue';

   export default defineComponent({
      name: 'home-search-view',

      components: {
         TrajetSearch,
         Pile,
         BottomNav,
         PaneGetValue,
         BottomMenu,
      },
      data() {
         return {
            overlay: false,
            openP: false,
            modePanel: "date",
            date: null,
            depart: null,
            destination: null,
            dateString: "Aujourd'hui",
            nbPassager: 1,
            infos: {
               "depart": "Tsingoni",
               "destination": "Mamoudzou",
               "hour_start": "4:50",
               "hour_end": "6:55",
               "price": 4,
               "name": "Ledou",
               "passenger_number": 2
            },
         };
      },
      mounted() {
         if(this.$refs.PaneGetValueRef){
            this.date = this.$refs.PaneGetValueRef.getDate();
         }
      },
      methods: {
         getTrajet() {
            if(this.$refs.PaneGetValueRef){
               const depart = this.$refs.TrajetSearchRef.depart;
               const destination = this.$refs.TrajetSearchRef.destination;
               this.infos = this.$store.state.trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination)[0];
            }
         },
         openCalendar(){
            console.log("open-pan-calendar-search")
            this.modePanel = "date";
            this.openP = true;
         },
         openSearch(mode){
            console.log("select-", mode);
            this.modePanel = mode == 'dep' ? "depart" : "arriver";
            this.openP = true;
         },
         getDate(){
            console.log("get-date-search");
            if(this.$refs.PaneGetValueRef){
               this.date = this.$refs.PaneGetValueRef.date;
               this.openP = !this.openP;
            }
         },
         getDepart(){
            if(this.$refs.PaneGetValueRef){
               this.depart = this.$refs.PaneGetValueRef.getDep();
               this.openP = !this.openP;
            }
         },
         getDestination() {
            if(this.$refs.PaneGetValueRef){
               this.destination = this.$refs.PaneGetValueRef.getDest();
               this.openP = !this.openP;
            }
         },
         switchCommune(){
            var tmp = this.depart;
            this.depart = this.destination;
            this.destination = tmp;
         },
         close(){
            this.openP = false;
            if ( this.$refs.BottomMenuRef && this.overlay ) {
               this.overlay = this.$refs.BottomMenuRef.close();
            }
         },
         openSelectNumber(){
            if (this.$refs.BottomMenuRef) {
               this.overlay = this.$refs.BottomMenuRef.open();
            }
         },
         getSelected(){
            if (this.$refs.BottomMenuRef) {
               this.nbPassager = this.$refs.BottomMenuRef.numberSelected;
               if(this.nbPassager){
                  this.close();
               }
            }
         },
         reserve(){
            this.overlay = this.$refs.BottomMenuRefResults.open();
         },
      },
      watch: {
         depart(){
            console.log("dep-:", this.depart);
         },
         destination(){
            console.log("dest-:", this.destination);
         },
         date(){
            const tmpCurrentDate = new Date();
            var day   = tmpCurrentDate.getDate();
            var month = tmpCurrentDate.getMonth() + 1;
            var year  = tmpCurrentDate.getFullYear();

            const currentDate = new Date(`${month}/${day}/${year}`);
            const tomorrowsDate = new Date(`${month}/${day+1}/${year}`);

            day   = this.date.getDate();
            month = this.date.getMonth() + 1;
            year  = this.date.getFullYear();

            if (currentDate.getTime() == this.date.getTime()) {
               this.dateString = "Aujourd'hui";
            }
            else if (tomorrowsDate.getTime() == this.date.getTime()) {
               this.dateString = "Demain";
            }
            else {
               this.dateString = `${day >= 10 ? day : "0" + day}-${month >= 10 ? month : "0" + month}-${year}`;
            }
         },
      },
   });
</script>
