
<style lang="scss">

  * {
    --blue-color: #2e8dff;
  }

   .v-application.v-theme--light.v-layout.v-layout--full-height.v-locale--is-ltr {
      background-color: #f5f5f5;
   }

   .text-fs26 {
      font-size: 26px !important;
   }

</style>

<template>
  <v-app>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>

export default {
  name: 'App',

  data: () => ({
    //
  }),
}
</script>
