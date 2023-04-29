<!-- scss -->
<style lang="scss" scoped>
   .v-container {
      margin: auto;
      .bloc-part{
         margin: 50px auto;

      }
      .v-row {
         margin-top: 40px;
         margin-bottom: 5px;
      }
   }
   .v-row{
      margin: 30px auto;
   }
   .title {
      font-size: var(--font-size-h1);
      font-weight: bold;
      width: 100%;
      padding: 0 39px 0px 39px;
      margin: auto;
   }

</style>
   
<!--  -->
<template>

   <v-row 
      class="mt-40 mb-0"
      style="margin-top: 40px;"
   >
      <!-- src="https://static.vecteezy.com/system/resources/previews/011/539/112/non_2x/car-cartoon-porsche-3d-render-free-png.png" -->
      <div
         class="title text-center"
      >Le choix de trajets à petits prix</div>
      <v-col>
         <v-img
            style="margin: auto;"
            :width="200"
            aspect-ratio="16/9"
            cover
            src="@/assets/car.png"
         ></v-img>
      </v-col>
   </v-row>

   <TrajetSearch ref="TrajetSearchRef" v-on:trajet-selected="getTrajet()" />
   <TrajetMember v-if="infos" :infos="infos"/>
   <BottomNav />
</template>



<!--  -->
<script>
   import { defineComponent } from 'vue';

   // Components
   import TrajetSearch from '@/components/home/TrajetSearch.vue';
   import TrajetMember from '@/components/home/TrajetMember.vue';
   import BottomNav from '@/components/menus/BottomNav.vue';

   export default defineComponent({
      name: 'home-search-view',

      components: {
         TrajetSearch,
         TrajetMember,
         BottomNav,
      },
      data() {
         return {
            infos: null,
         };
      },
      methods: {
         getTrajet() {
            const depart = this.$refs.TrajetSearchRef.depart;
            const destination = this.$refs.TrajetSearchRef.destination;
            this.infos = this.$store.state.trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination)[0]
         },
      }

   });
</script>
