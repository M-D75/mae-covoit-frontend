
<style lang="scss" model>
   // toolbar
   .v-btn i.v-icon.icon-chev-left {
      margin-right: 0;
      // font-size: 2em;
   }

   .v-toolbar {
      .v-toolbar-title__placeholder {
         font-size: 16px !important;
      }
   }

</style>
<!-- scss -->
<style lang="scss" scoped>

   // toolbar
   .v-toolbar {
      z-index: 1;
      .v-btn i.v-icon {
         margin-right: 0 !important;
         color: gray;
      }
      .v-toolbar-title .text-subtitle-2 {
         color: gray;
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
      class="mb-5"
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
         >mdi-bell</v-icon>
      </v-btn>
      <v-toolbar-title
         class="ml-5 mr-5 text-center"
      >
         {{title}}
      </v-toolbar-title>

      <v-btn icon>
        <v-icon>mdi-tune</v-icon>
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
         title: {
            type: String,
            default: "Profil",
         },
         date: {
            type: String,
            default: "Aujourd'hui",
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
