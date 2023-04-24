
<style lang="scss" model>
   body {
      overflow: hidden;
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

</style>
   
<!--  -->
<template>
   <Toolbar />
   <div class="label-filter text-caption text-uppercase mx-auto">Aujourd'hui</div>
   <TrajetMember />
   <BottomMenu />
</template>



<!--  -->
<script>
   import { defineComponent } from 'vue';

   // Components
   import Toolbar from '@/components/menus/head_menus/Toolbar.vue';
   import TrajetMember from '@/components/home/TrajetMember.vue';
   import BottomMenu from '@/components/menus/BottomMenu.vue';

   export default defineComponent({
      name: 'reservation-view',

      components: {
         Toolbar,
         TrajetMember,
         BottomMenu,
      },
   });
</script>
