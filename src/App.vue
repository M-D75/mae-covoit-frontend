
<style lang="scss">

  * {
    --white-bg-color: #FBFBFB;
    --blue-color: #2e8dff;
    --font-size-h1: 24px;
    --font-size-h1-toolbar: 16px;
    --font-size-subtitle-toolbar: 8px;
    --box-shadow-card: 0px 2px 24px #eee;
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
