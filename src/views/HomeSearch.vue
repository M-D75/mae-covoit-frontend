
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
         font-weight: bold;
         width: 100%;
         padding: 0 39px 0px 39px;
         margin: auto;
      }
   }
</style>
   
<!--  -->
<template>

   <v-row 
      class="home-search-view mt-40 mb-0"
      style="margin-top: 40px;"
   >
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

   <TrajetSearch class="trajet-search" ref="TrajetSearchRef" v-on:trajet-selected="getTrajet()" />
   <Pile class="pile-search"/>
   <BottomNav />
</template>



<!--  -->
<script>
   import $ from 'jquery'
   import { defineComponent } from 'vue';

   // Components
   import TrajetSearch from '@/components/search/TrajetSearch.vue';
   import Pile from '@/components/search/Pile.vue'
   import BottomNav from '@/components/menus/BottomNav.vue';

   export default defineComponent({
      name: 'home-search-view',

      components: {
         TrajetSearch,
         Pile,
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
      },
      mounted() {
         // const vue = this;
         $(".pile-search").on("click", function(){
            // vue.$router.push("/results")
         });
      },
   });
</script>
