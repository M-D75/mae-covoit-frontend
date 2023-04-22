

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

</style>
   
<!--  -->
<template>
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
