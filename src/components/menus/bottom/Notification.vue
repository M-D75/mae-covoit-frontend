
<style type="text/css">
  .circle-back {
      width: 100px;
      height: 100px;
      background-color: #9fcb66;
      opacity: 0.1;
      position: absolute;
      border-radius: 100px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      
  }
  .icon-and-back {
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
         .text-notif {
            margin-top: 90px;
            font-size: 16px;
            padding: 50px;
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
            <div class="icon-and-back">
               <div class="circle-back"></div>
               <v-icon
                  class="mr-0"
                  color="#9fcb66"
                  icon="mdi-check-circle"
                  size="80"
                  style="margin: 0;"
               ></v-icon>
            </div>
            <div class="text-notif font-weight-bold">{{ message }}</div>
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