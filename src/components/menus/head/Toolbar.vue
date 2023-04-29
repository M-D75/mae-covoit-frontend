
<style lang="scss" model>
   // toolbar
   .v-toolbar {
      position: fixed;
   }
   .v-btn i.v-icon.icon-chev-left {
      margin-right: 0;
      // font-size: 2em;
   }

</style>
<!-- scss -->
<style lang="scss" scoped>

   // toolbar
   .v-toolbar {
      position: fixed;
      z-index: 1;
      .v-btn i.v-icon {
         margin-right: 0 !important;
         &.mdi-chevron-left {
            font-size: 2em;
         }
      }
      .v-toolbar-title {
         font-size: var(--font-size-h1-toolbar);
         color: gray;
         .text-subtitle-2 {
            font-size: var(--font-size-subtitle-toolbar);
         }
      }
      .label-filter.text-caption {
         width: 85%;
      }
   }

</style>
   
<!--  -->
<template>

   <!-- toolbar -->
   <v-toolbar
      class=""
      color=""
      dark
   >
      <!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->
      <v-btn 
         icon
         @click="previous()"
      >
         <v-icon
            class="icon-chev-left mr-0"
         >mdi-chevron-left</v-icon>
      </v-btn>
      <v-toolbar-title
         class="ml-5 mr-5"
      >
         {{trajet.depart}} vers {{trajet.destination}} 
         <div class="text-subtitle-2 font-weight-medium">{{date}}, {{nombre_trajet}} passager</div>
      </v-toolbar-title>

      <v-btn icon>
        <v-icon>mdi-filter</v-icon>
      </v-btn>
   </v-toolbar>

</template>



<!--  -->
<script>
   import { defineComponent } from 'vue';

   export default defineComponent({
      name: 'toolbar-comp',
      components: {
      },
      props: {
         trajet: {
            type: Object,
            default (){
               return {depart: "Tsingoni", destination: "Mamoudzou"};
            },
         },
         date: {
            type: String,
            default: "Aujourd'hui",
         },
         nombre_trajet: {
            type: Number,
            default: 0,
         },
      },
      methods: {
         previous(){
            this.$router.push("/search");
            // this.$router.back();
         },
      }
   });
</script>
