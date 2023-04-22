

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
   <TrajetMember />
   <BottomMenu />
</template>



<!--  -->
<script>
   import { defineComponent } from 'vue';

   // Components
   import TrajetMember from '@/components/home/TrajetMember.vue';
   import BottomMenu from '@/components/menus/BottomMenu.vue';

   export default defineComponent({
      name: 'reservation-view',

      components: {
         TrajetMember,
         BottomMenu,
      },
   });
</script>
