
<style lang="scss" model>
   // toolbar
   .v-btn i.v-icon.icon-chev-left {
      margin-right: 0;
      // font-size: 2em;
   }

   .v-toolbar {
      .v-toolbar-title__placeholder {
         font-size: 16px !important;
         font-weight: 450;
      }
      i.v-icon.mdi-tune {
         color: v-bind(colorParams) !important;
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
      .v-toolbar-title {
         font-size: var(--font-size-h1-toolbar);
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
      permanent
   >
      <!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->
      <v-btn 
         icon
      >
         <!-- without notif -->
         <v-icon
            class="mr-0"
         >mdi-bell</v-icon>
      </v-btn>
      <v-toolbar-title
         class="ml-5 mr-5 text-center"
      >
         {{title}}
      </v-toolbar-title>

      <v-btn 
         icon
         @click="accessSetting()"
      >
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
      data() {
         return {
            colorParams: "gray",
         }
      },
      methods: {
         accessSetting() {
            this.$router.currentRoute._rawValue.path == "/setting" ? this.$router.back() : this.$router.push("/setting");
         },
      },
      mounted() {
         if (this.$router.currentRoute._rawValue.path == "/setting") {
            this.colorParams = "var(--blue-color)";
         }
      }
   });
</script>
