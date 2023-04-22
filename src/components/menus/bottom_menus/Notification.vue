
<style type="text/css">
  .circle-back {
      width: 129px;
      height: 129px;
      background-color: #9fcb66;
      opacity: 0.1;
      position: absolute;
      border-radius: 100px;
      top: 34%;
      left: 50%;
      transform: translate(-50%, -50%);
      
  }
  .text-center {
      position: relative;
  }
</style>

<style lang="scss" scoped>
   .v-container {
      display: flex;
      align-items: center;
      box-shadow: none;
      width: 100%;
      min-height: 100%;
      .v-card {
         overflow: visible;
         width: 100%;
         box-shadow: none;
         i.v-icon {
            margin: 0 !important;
         }
         .text-h4 {
            margin-top: 10px;
         }
      }
   }
   

   </style>

<template>
   <v-container
      class="position-relative"
   >
      <v-card
         class="mx-auto"
      >
         <div class="text-center">
            <div class="circle-back"></div>
            <v-icon
               class="mr-0"
               color="#9fcb66"
               icon="mdi-check-circle"
               size="110"
               style="margin: 0;"
            ></v-icon>

            <div class="text-h4 font-weight-bold">{{ message }}</div>
         </div>
      </v-card>
   </v-container>
</template>


<script>
   import $ from 'jquery'

   // Components
   export default {
      name: 'notif-bottom-menu',
      data() {
         return {
            number_trajet: 1,
         }
      },
      props: {
         message: {
            type: String,
            // default: () => "notification message",
         },
      },
      mounted (){
         // const vue = this;
         $(document).ready(function() {
            $(".cont-btn-switch").on("click", function(){
               console.log("switch")
            });
         });
      },
   };
</script>