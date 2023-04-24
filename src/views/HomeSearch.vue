

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
   .title {
      font-weight: bold;
      width: 100%;
      padding: 0 50px 0px 50px;
   }

</style>
   
<!--  -->
<template>

   <v-row
      style="margin-bottom: 5px;"
   >
      <!-- src="https://static.vecteezy.com/system/resources/previews/011/539/112/non_2x/car-cartoon-porsche-3d-render-free-png.png" -->
      <div
         class="title text-h4 text-center"
      >Le choix de trajets à petits prix</div>
      <v-col>
         <v-img
            style="margin: auto;"
            :width="200"
            aspect-ratio="16/9"
            cover
            src="../assets/car.png"
         ></v-img>
      </v-col>
   </v-row>

   <Trajet />
   <TrajetMember />
   <BottomNav />
</template>



<!--  -->
<script>
   import { defineComponent } from 'vue';

   // Components
   import Trajet from '@/components/home/Trajet.vue';
   import TrajetMember from '@/components/home/TrajetMember.vue';
   import BottomNav from '@/components/menus/BottomNav.vue';

   export default defineComponent({
      name: 'home-search',

      components: {
         Trajet,
         TrajetMember,
         BottomNav,
      },
   });
</script>
