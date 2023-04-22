


<style lang="scss" scoped>
  .v-btn__content {
    i {
      font-size: 2.7em !important;
      margin: 0 !important;
      margin-bottom: 5px !important;
      color: gray;
    }

  }
  .selected {
    color: #2196F3;
    .v-icon {
      color: #2196F3;
    }
  }
</style>

<template>

  <v-bottom-navigation
    v-model="value"
    color="teal"
    grow
    style="height: 75px;"
  >
    <v-btn class="selected">
      <v-icon>mdi-magnify</v-icon>

      Recherche
    </v-btn>

    <v-btn>
      <v-icon>mdi-plus-circle</v-icon>

      Publier
    </v-btn>

    <v-btn>
      <v-icon>mdi-account-circle</v-icon>

      Profil
    </v-btn>
  </v-bottom-navigation>

</template>


