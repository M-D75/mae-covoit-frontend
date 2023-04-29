
<style lang="scss" model>
   .blc-text.publish .v-input .v-input__prepend {
      margin-right: -5px !important;
      text-align: center;
   }
   .blc-text.publish .v-input .v-input__prepend i.v-icon.mdi-navigation.mdi.notranslate.v-theme--light.v-icon--size-default {
      transform: inherit;
   }
</style>

<!-- scss -->
<style lang="scss" scoped>
   .v-row{
      margin: 30px auto;
   }
   .title {
      font-size: var(--font-size-h1);
      font-weight: bold;
      width: 100%;
      padding: 0 50px 0px 50px;
      margin: 25px;
   }
   .v-card {
      width: 90%;
      border-radius: 40px;
      box-shadow: 2px 2px 10px #eee;
      .v-list{
         max-height: 100px;
      }
      .v-btn {
         position: relative;
         bottom: 20px;
         background-color: white;
      }
      .v-input__prepend {
         margin-right: 0;
         text-align: center;
      }
   }
   .blc-text {
      width: 85%;
   }

</style>
   
<!--  -->
<template>

   <v-row
      style="margin-bottom: 5px;"
   >
      <div
         class="title text-center"
      >D'où partez-vous ?</div>
      <v-col>
         <v-card
            style="overflow: visible;"
            class="mx-auto rounded-xl w-85 overflow-visible"
            max-width="500"
         >
            <v-list class="overflow-visible rounded-xl">

               <div class="publish blc-text mx-auto">
                  <v-autocomplete
                     v-model="address"
                     :items="communes"
                     label="Saisissez votre address"
                     persistent-hint
                     prepend-icon="mdi-navigation"
                     variant="solo"
                  ></v-autocomplete>
               </div>

               <v-btn
                  class="text-none "
                  rounded="xl" 
                  size="x-large"
                  variant="outlined"
                  block
                  clearable
               >
                  Rechercher
               </v-btn>
            </v-list>
         </v-card>

      </v-col>
   </v-row>

   <BottomNav />
</template>



<!--  -->
<script>
   import { defineComponent } from 'vue';
   import { mapState } from 'vuex';

   // Components
   import BottomNav from '@/components/menus/BottomNav.vue';

   export default defineComponent({
      name: 'publish-view',
      computed: {
         ...mapState(['communes']),
      },
      data() {
         return {
            address: null,
         }
      },
      components: {
         BottomNav,
      },
   });
</script>
