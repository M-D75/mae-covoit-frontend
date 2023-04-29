
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
   }

</style>
   
<!--  -->
<template>

   <!-- toolbar -->
   <Toolbar 
      :trajet="{depart: depart, destination: destination}"
      :nombre_trajet="trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination).length"
      :date="date.replace('-', '/')"
   />

   <!--  -->
   <div class="container-trajet-member">
      <div class="label-filter text-caption text-uppercase mx-auto">{{ date.replace("-", "/") }}</div>
      <TrajetMember 
         v-for="(infos, index) in trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination)" :key="index" 
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
         @click="callCloseBottomChild"
      ></v-overlay>
   </div>
   <BottomMenu ref="BottomMenuRef" v-on:close="overlay = false" :infos="infos"/>
</template>



<!--  -->
<script>
   import $ from 'jquery';
   import { defineComponent } from 'vue';
   import { mapState } from 'vuex';


   // Components
   import Toolbar from '@/components/menus/head/Toolbar.vue'
   import TrajetMember from '@/components/home/TrajetMember.vue';
   import BottomMenu from '@/components/menus/BottomMenu.vue';

   export default defineComponent({
      name: 'results-view',
      computed: {
         ...mapState(["trajets"]),
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
         }
      },
      mounted(){
         const sizeMainNoToolbar = parseInt($(".v-main").css("height").replace("px", "")) - 100;
         console.log("sizeBodu", sizeMainNoToolbar)
         $(".container-trajet-member").css("height", `${sizeMainNoToolbar}px`);
         console.log("params", this.$route.params)
      },
      methods: {
         reserve(event, index){
            const tmp_trajets = this.$store.state.trajets.filter(trajet => trajet.depart == this.depart && trajet.destination == this.destination);
            this.infos = tmp_trajets[index];
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
            }
         },
      },
      watch: {
      },
   });
</script>
