
<style type="text/css">

   .mdi-navigation.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
      color: gray;
      opacity: inherit !important;
      z-index: 99;
      transform: rotate(180deg);
   }
   .part-list {
      padding: 15px;
   }
   i.v-icon {
      font-size: 1.2em;
      margin-right: 10px !important;
   }
   .calendar .v-list-item-title{
      font-weight: bold;
   }
   .line {
      border-left: solid 1px gray;
      border-right: solid 1px gray;
      height: 50px;
      position: absolute;
      left: 24.5px;
      top: 21px;
      z-index: 0;
      opacity: var(--v-medium-emphasis-opacity);
   }
   .flex {
      display: flex;
   }
   .v-chip.prix {
      position: absolute;
      right: 15px;
      top: 25px;
      font-weight: bold;
      font-size: 1.1em;
   }
   .v-chip.rapport {
      position: absolute;
      right: 15px;
      bottom: 20px;
      font-weight: bold;
      font-size: 1.1em;
   }
</style>

<style lang="scss" scoped>
   .v-card {
      margin: 25px;
      width: 85%;
      border-radius: 20px;
      box-shadow: 2px 2px 10px #eee;
   }
   .v-btn {
      position: relative;
      bottom: -8px;
      margin-top: 16px;
   }
   .v-list-item {
      // font-size: 0.9em;
      // color: gray;
      &.calendar {
         // font-weight: bold;
         width: 70%;
         .v-list-item-title{
            font-weight: bold;
         }
         i.v-icon {
            margin-right: 10px;
         }
      }
      &.day {
         .v-list-item__prepend {
            i.v-icon {
               margin-right: 20px;
            }
         }
      }
   }
   .empty-mask {
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #eee;
      z-index: 999;
      opacity: 0.7;
   }
   .empty {
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      text-align: center;
      .v-icon {
         font-size: 3.3em;
         min-height: 100%;
         align-items: center;
         display: inline-flex;
      }
   }

</style>

<template>
   <v-card
      class="mx-auto"
      max-width="500"
    >
      <div class="empty-mask"></div>
      <div class="empty">
         <v-icon>
            mdi-search-web
         </v-icon>
      </div>
      <v-list>

         <div class="part-list">
            <div>
               <div class="flex">
                  <v-list-item
                    title="5:45"
                  ></v-list-item>
                  <v-list-item
                    prepend-icon="mdi-navigation"
                    title="Mamoudzou"
                  ><div class="line"></div></v-list-item>
                  
               </div>

               <div style="display:flex;">
                  <v-list-item
                    title="6:30"
                  ></v-list-item>
                  <v-list-item
                    prepend-icon="mdi-navigation"
                    title="Tsingoni"
                  ></v-list-item>
               </div>
            </div>

            <div class="flex">
               <v-avatar
                  size="47px"
               >
                  <v-img
                     alt="Avatar"
                     src="https://avatars0.githubusercontent.com/u/9064066?v=4&s=460"
                  ></v-img>
               </v-avatar>
               <v-list-item
                  title="Jonh"
               ></v-list-item>
            </div>

            <v-chip
               class="ma-2 prix"
               color="blue"
               label
            >
              4€
            </v-chip>

            <v-chip
               class="ma-2 rapport"
               color="blue"
               label
            >
              3/4
            </v-chip>
         </div>

      </v-list>
  </v-card>
</template>


<script>

   // Components
   export default {
      name: 'trajet-view',
      data() {
         return {
            number_trajet: 1,
         }
      },
   };
</script>