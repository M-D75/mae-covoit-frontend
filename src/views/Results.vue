
<style lang="scss" model>

   .v-main, .v-application__wrap {
      overflow: hidden;
   }

   .label-filter.text-caption {
      width: 85%;
      max-width: 500px;
   }

</style>
<!-- scss -->
<style lang="scss" scoped>
   .container-trajet-member {
      margin-top: 100px;
      height: 90vh;
      overflow: scroll;
      .label-filter {
         color: var(--font-color-label);
      }
   }

</style>
   
<!--  -->
<template>

   <!-- toolbar -->
   <Toolbar 
      :trajet="{depart: depart, destination: destination}"
      :nombre_trajet="trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination).length"
      :nbPassager="nbPassager"
      :date="date.replaceAll('-', '/')"
   />

   <!--  -->
   <div class="container-trajet-member">
      <div class="label-filter text-caption text-uppercase mx-auto">{{ date.replaceAll("-", "/") }}</div>
      <TrajetMember 
         v-for="(infos, index) in trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination)" 
         :key="index" 
         :infos="infos"
         :data-index="index"
         @click="reserve($event, index)"
      />
      <!-- <TrajetMember v-for="(infos, index) in trajets" :key="index" :infos="infos"/> -->
      <v-overlay 
         v-model="overlay" 
         contained
         persistent
         style="z-index: 0;"
         @click="callCloseBottomChild()"
      ></v-overlay>
   </div>

   <!-- reserve -->
   <BottomMenu 
      :class-name="['results']" 
      ref="BottomMenuRef" 
      mode="reserve" 
      v-on:close="overlay = false;" 
      :infos="infos"
   />

   <!-- loading -->
   <v-overlay
      :model-value="overlayLoad"
      class="align-center justify-center"
    >
      <v-progress-circular
        color="black"
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>
</template>



<!--  -->
<script>
   //import $ from 'jquery';
   import { defineComponent } from 'vue';
   import { mapActions, mapMutations, mapState } from 'vuex';


   // Components
   import Toolbar from '@/components/menus/head/Toolbar.vue'
   import TrajetMember from '@/components/search/TrajetMember.vue';
   import BottomMenu from '@/components/menus/BottomMenu.vue';

   export default defineComponent({
      name: 'results-view',
      computed: {
         ...mapState("search", ["trajets"]),
         ...mapActions("search", ["getTrajets"]),
      },
      components: {
         Toolbar,
         TrajetMember,
         BottomMenu,
      },
      props: {
         depart: {
            type: String,
            default: "Tsingoni",
         },
         destination: {
            type: String,
            default: "Mamoudzou",
         },
         date: {
            type: String,
            default: "Aujourd'hui",
         },
         nbPassager: {
            type: String,
            default: "0",
         }
      },
      data() {
         return {
            infos: {
                   "depart": "Tsingoni",
                   "destination": "Mamoudzou",
                   "hour_start": "4:50",
                   "hour_end": "6:55",
                   "price": 4,
                   "name": "Ledou",
                   "passenger_number": 2
                 },
            overlay: false,
            overlayLoad: true,
         }
      },
      mounted(){
         this.waitInit();
         console.log("params", this.$route.params);
      },
      methods: {
         ...mapMutations("search", ["SET_DEPART", "SET_DESTINATION", "SET_NB_PASSENGER"]),
         reserve(event, index){
            const tmp_trajets = this.$store.state.search.trajets.filter(trajet => trajet.depart == this.depart && trajet.destination == this.destination);
            this.infos = tmp_trajets[index];
            this.$store.commit("search/SET_DEPART", "");
            this.$store.commit("search/SET_DESTINATION", "");
            this.$store.commit("search/SET_NB_PASSAGER", 1);
            this.callChildMethod();
         },
         callChildMethod() {
            if ( this.$refs.BottomMenuRef ) {
               this.overlay = this.$refs.BottomMenuRef.open();
            }
         },
         callCloseBottomChild() {
            if ( this.$refs.BottomMenuRef ) {
               this.$refs.BottomMenuRef.close();
               setTimeout(function(){
                  this.overlay = false;
               }.bind(this), 1000)
            }
         },
         async waitInit(){
            this.overlayLoad = true;
            await this.getTrajets;
            // setTimeout(function(){
            //    this.overlayLoad = false;
            // }.bind(this), 2000)
            
         },
      },
      watch: {
         overlay(){
            if(!this.overlay){
               if(this.$refs.BottomMenuRef && this.$refs.BottomMenuRef.notif){
                  this.$router.push("/search")
               }
            }
         },
         trajets(){
            this.overlayLoad = this.trajets.length == 0 ? true : false;
         },
      },
   });
</script>
