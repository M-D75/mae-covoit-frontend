
<style lang="scss">

   // 
   .label-filter.text-caption {
      width: 85%;
   }

</style>
<!-- scss -->
<style lang="scss" scoped>
   .v-container {
      margin: auto;
      .bloc-part{
         margin: 50px auto;

      }
   }
   .v-row{
      margin: 30px auto;
   }

   .container-trajet-member {
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
   />

   <!--  -->
   <div class="container-trajet-member">
      <div class="label-filter text-caption text-uppercase mx-auto">Aujourd'hui</div>
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
         style="z-index: 0;"
      ></v-overlay>
   </div>
   <BottomMenu ref="BottomMenuRef" :infos="infos"/>
</template>



<!--  -->
<script>
   import { defineComponent } from 'vue';
   import { mapState } from 'vuex';


   // Components
   import Toolbar from '@/components/menus/head_menus/Toolbar.vue'
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
      methods: {
         reserve(event, index){
            const tmp_trajets = this.$store.state.trajets.filter(trajet => trajet.depart == this.depart && trajet.destination == this.destination);
            this.infos = tmp_trajets[index];
            this.callChildMethod();
            this.overlay = true;
         },
         callChildMethod() {
            if ( this.$refs.BottomMenuRef ) {
               this.$refs.BottomMenuRef.open();
            }
         },
      },
      watch: {
         // overlay (val) {
         //    val && setTimeout(() => {
         //       this.overlay = false
         //    }, 2000)
         // },
      },
   });
</script>
