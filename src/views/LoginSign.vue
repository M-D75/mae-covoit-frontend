
<style type="text/css">
   /*.v-input .v-input__control .v-text-field .v-field--prepended.v-field--variant-solo.v-theme--light {
      box-shadow: none !important;
      background-color: white !important;
   }*/

   .v-field--variant-solo {
      box-shadow: none !important;
      background-color: white !important;
      border-radius: 50px;
   }
</style>


<!-- scss -->
<style lang="scss" scoped>

   .v-application.v-theme--light.v-layout.v-layout--full-height.v-locale--is-ltr {
      background-color: #eee;
   }
   .v-container {
      margin: auto;
      .bloc-part{
         margin: 50px auto;
      }
      
   }

   .v-field--variant-solo {
      box-shadow: none !important;
      background-color: white !important;
   }


   a {
      text-decoration: none;
      color: gray;
      text-align:center; 
      display: block; 
      width:100%;
   }

   .foot-part {
      height: 100px;
      position: absolute;
      bottom: 0px;
      width: 100%;
   }

   .line-p {
      width: 100%;
      height: 0px;
      margin: auto;
   }

   .bloc-btn-social-media {
      margin-top: 20px;
      margin-bottom: 20px;
      width: 100%;
   }
</style>

   
<!--  -->
<template>
  
   <v-app >
      <v-container >

         <!-- From Sign/Connexion -->
         <v-row class="bloc-part">
            <v-col>
               <v-form>
                  <!-- prepend-inner-icon="mdi-mail" -->
                  <v-text-field
                     v-model="email"
                     :error-messages="emailErrors"
                     label="E-mail"
                     type="email"
                     required
                     variant="solo"
                  ></v-text-field>

                  <!-- prepend-inner-icon="mdi-lock" -->
                  <v-text-field
                     variant="solo"
                     v-model="password"
                     type="password"
                     :error-messages="passwordErrors"
                     :rules="[rules.required, rules.min]"
                     label="Mot de passe"
                     required
                  ></v-text-field>

                  <v-row>
                     <v-col>
                        <v-btn
                           class="mr-4 text-none"
                           @click="authService( mode_login ? 'emailSignIn' : 'emailSignUp')"
                           rounded="xl" 
                           size="x-large"
                           variant="outlined"
                           block
                        >
                           {{ mode_login ? "Connexion" : "S'inscrire" }}
                        </v-btn>
                     </v-col>
                  </v-row>

                  <v-row v-if="mode_login">
                     <v-col>
                        <a href="#" >Mot de passe oublié ?</a>
                     </v-col>
                  </v-row>
               </v-form>
            </v-col>
         </v-row>


         <!-- Connectez vous avec -->
         <v-row class="bloc-part">
            <v-col>
                  
               <v-row>
                  <v-col style="display: flex;">
                     <div class="line-p" style="border: solid 1px #bbb;"></div>
                     <p class="con-with" style="color: gray; width:700px; text-align:center;">Connectez vous avec</p>
                     <div class="line-p" style="border: solid 1px #bbb"></div>
                  </v-col>
               </v-row>

               <!-- btn-co-via-service -->
               <div class="bloc-btn-social-media text-center">

                  <v-btn
                     v-for="(icon, index) in icons" v-bind:key="index"
                     class="mx-2"
                     fab
                     :color='icon.color'
                     rounded="xl"
                     size="large"
                     @click="authService(icon.fn)"
                  >
                     <v-icon dark>
                       {{ icon.icn }}
                     </v-icon>
                  </v-btn>

               </div>

            </v-col>
        </v-row>

      </v-container>

      <div class="foot-part">
         <v-col>
            <a href="#" >{{ text_link }}</a>
            <!-- <a href="#" link="/sign" >Pas encore de compte ?</a> -->
            <!-- <a href="#" link="/login" v-else>Vous avez déjà un compte ?</a> -->
         </v-col>
      </div>

   </v-app>

</template>




<!--  -->
<script>
   import $ from 'jquery'
   import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

   export default {
      data() {
         return {
            mode_login: this.$route.path == '/login' ? true : false,
            text_link: "Pas encore de compte ?",
            email: "",
            emailErrors: "",
            password: "",
            passwordErrors: "",
            rules: {
               required: value => !!value || 'Required.',
               min: v => v.length >= 8 || 'Min 8 characters',
               emailMatch: () => (`The email and password you entered don't match`),
            },
            icons: [
                  {icn: 'mdi-apple', color:"black", fn:""},
                  {icn: 'mdi-google', color:"red", fn:"google"},
                  {icn: 'mdi-facebook', color:"indigo", fn:""},
               ],
            provider: null,
         }
      },
      methods: {
         authService(service){
            switch (service) {
               case "google":
                  this.authGoogle();
                  break;
            
               case "emailSignUp":
                  this.signUp();
                  break;
               case "emailSignIn":
                  this.signIn();
                  break;
               default:
                  console.log("other")
                  break;
            }
         },
         authGoogle(){

            const provider = new GoogleAuthProvider();
            const auth = getAuth();

            signInWithPopup(auth, provider)
            .then((result) => {
               // This gives you a Google Access Token. You can use it to access the Google API.
               const credential = GoogleAuthProvider.credentialFromResult(result);
               const token = credential.accessToken;
               // The signed-in user info.
               const user = result.user;
               console.log("token", token)
               console.log("user", user, user.email, user.accessToken)
               console.log("credential", credential)
               // IdP data available using getAdditionalUserInfo(result)
               // ...
               this.$router.push("/search")
            }).catch((error) => {
               // Handle Errors here.
               const errorCode = error.code;
               const errorMessage = error.message;
               // The email of the user's account used.
               const email = error.customData.email;
               // The AuthCredential type that was used.
               const credential = GoogleAuthProvider.credentialFromError(error);
               console.log(errorCode, errorMessage, email, credential)
               // ...
            });
         },
         signUp(){
            const auth = getAuth();
            createUserWithEmailAndPassword(auth, this.email, this.password)
            .then((userCredential) => {
               // Signed in 
               const user = userCredential.user;
               console.log("user: ", user)
               // ...
            })
            .catch((error) => {
               const errorCode = error.code;
               const errorMessage = error.message;
               this.emailErrors = errorMessage;
               console.log(errorCode, errorMessage)
               // ..
            });
         },
         signIn(){
            const auth = getAuth();
            signInWithEmailAndPassword(auth, this.email, this.password)
            .then((userCredential) => {
               // Signed in 
               const user = userCredential.user;
               console.log("userC:", user)
               this.$router.push("/search")
               // ...
            })
            .catch((error) => {
               const errorCode = error.code;
               const errorMessage = error.message;
               console.log(errorCode, errorMessage);
            });
         },
      },
      mounted() {
         //this.provider = new GoogleAuthProvider();
         const vue = this;
         $(document).ready(function() {
            $("a").on("click", function(){
               const link = vue.$route.path == '/login' ? "/sign" : "/login";
               vue.text_link = link == '/login' ? "Pas encore de compte ?" : "Vous avez déjà un compte ?";
               vue.$router.push({ path: link });
               vue.mode_login = link == '/login' ? true : false;
            })
         });
      },
      watch: {
      },
   }
</script>
