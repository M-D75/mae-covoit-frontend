
<style lang="scss">

   .v-application.v-theme--light.v-layout.v-layout--full-height.v-locale--is-ltr {
      background-color: #f5f5f5;
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
