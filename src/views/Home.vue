

<!-- scss -->
<style lang="scss" scoped>
   .v-container {
      margin: auto;
      .bloc-part{
         margin: 50px auto;

      }
   }
   .v-row{
      margin: 30px auto;
   }

</style>
   
<!--  -->
<template>
  
   <v-app >
      <v-container >

         <!-- From Sign/Connexion -->
         <v-row class="bloc-part">
            <v-col>

               <v-row>
                  <v-col>
                     <v-img
                        style="margin: auto;"
                       :width="300"
                       aspect-ratio="16/9"
                       cover
                       src="https://static.vecteezy.com/system/resources/previews/011/539/112/non_2x/car-cartoon-porsche-3d-render-free-png.png"
                     ></v-img>
                  </v-col>
               </v-row>

               <v-row>
                  <v-col>
                     <v-btn
                        class="mr-4"
                        @click="submit"
                        rounded="xl" 
                        size="large"
                        variant="outlined"
                        block
                     >
                        S'inscrire/Se connecter
                     </v-btn>
                  </v-col>
               </v-row>
            </v-col>
         </v-row>

      </v-container>

   </v-app>

</template>


<!--  -->
<script>
  // @ is an alias to /src
  import $ from 'jquery'

  export default {
      name: 'HomeTest',
      data() {
         return {
         }
      },
      methods: {
         submit(){
            this.$router.push({ path: '/login' })
         },
      },
      mounted() {
         $(document).ready(function() {
         });
      },
      watch: {
      },
   }
</script>
