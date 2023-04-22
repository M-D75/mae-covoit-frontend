
<style lang="scss" scoped>
  .v-container {
    position: absolute;
    bottom: 0;
    border-radius: 50px 50px 0 0;
    background-color: white;
    width: 100%;
    max-width: 100%;
    min-height: 60vh;
    // display: flex;
    // align-items: center;

  }

  .bar-up {
    margin: auto;
    margin-top: 5px;
    width: 15%;
    border: 2px solid gray;
    border-radius: 10px;
  }

</style>

<template>
  <v-container
  >
    <div class="bar-up"></div>
    <TrajetMember v-if="!notif"/>
    <Notification :message="'success'" v-if="notif" />
    <ReservePlace v-if="!notif"/>
  </v-container>

</template>


<!--  -->
<script>
   import { defineComponent } from 'vue';

   // Components
   import TrajetMember from '@/components/home/TrajetMember.vue';
   import Notification from '@/components/menus/bottom_menus/Notification.vue';
   import ReservePlace from '@/components/menus/bottom_menus/ReservePlace.vue';

   export default defineComponent({
      name: 'bottom-menu',
      data() {
         return {
            notif: true,
         }
      },
      components: {
         Notification,
         TrajetMember,
         ReservePlace,
      },
   });
</script>
