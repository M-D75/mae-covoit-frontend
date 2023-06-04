<!-- model -->
<style lang="scss" model>
   .v-card.trajet-search-comp {
      z-index: 20 !important;
      overflow: visible;
      border-radius: 20px !important;
      
      i.v-icon {
         font-size: 1.2em;
         margin: auto 0;
      }

      .v-list {
         overflow: visible;
         border-radius: 20px !important;
         .part-list {
            
            padding: 10px 0 10px 16px !important;
            .v-list-item i.v-icon {
               color: gray !important;
            }
            
            .container-text.trajet-search-comp {
               .v-list-item__content {
                  display: flex;
               }

               .v-autocomplete {
                  // remove default row down
                  .v-field__append-inner {
                     i.v-icon.mdi-menu-down.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
                        display: none;
                     }
                  }
               }
            }

            //calendar
            .container-calendar {
               display: flex;
               //height: 58px;
               .calendar {
                  .v-list-item-title, .v-list-item__content{
                     font-weight: bold;
                     color: var(--font-color-label);
                  }
               }

               .nb-person.v-list-item {
                  .v-list-item__content{
                     color: var(--font-color-label);
                  }
                  i.v-icon {
                     margin-right: 20px;
                     color: gray !important;
                  }
               }
               .mdi-account-plus.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default {
                  margin-right: 15px;
                  font-size: 1.4em;
               }

               //swap
               .cont-btn-switch{
                  position: absolute;
                  width: 100%;
                  top: -78px;
                  left: 9px;
                  // swap
                  .v-btn {
                     position: relative;
                     left: 18px;
                     .v-icon {
                        font-size: 27px;
                        margin: 0 !important;
                     }
                     .mdi-swap-horizontal.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
                        position: absolute;
                        right: 0px;
                        transform: rotate(90deg);
                        font-size: 1.8em;
                        color: gray;
                     }
                  }
               }
            }
         }
      }
   }

   .cont-btn {
      width: 70%;
      cursor: pointer;
      z-index: 1;
   }

   .head-search-selected {
      color: gray;
      font-size: 0.8em;
      position: absolute;
      top: -2px;
      padding: 0 17.5px;
   }
   .v-btn.selected {
      color: var(--font-color-label) !important;
   }
</style>

<!-- scoped -->
<style lang="scss" scoped>
   .v-card.trajet-search-comp {
      margin: 35px;
      margin-top: 10px;
      width: 89.6%;
      background-color: var(--white-bg-color);
      box-shadow: var(--box-shadow-card);
      .v-list-item {
         &.calendar {
            width: 70%;
            .v-list-item-title, .v-list-item__content{
               font-weight: bold;
            }
            i.v-icon {
               margin-right: 10px;
            }
         }
         &.nb-person {
            .v-list-item__prepend {
               .v-list-item i.v-icon {
                  margin-right: 20px;
                  color: gray !important;
               }
            }
         }

         &.container-text {
            .v-btn {
               color: gray;
               font-size: 1rem;
            }
            .v-autocomplete {
               width: 85%;
               height: 50px;
               .v-field__append-inner {
                  i.v-icon.mdi-menu-down.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
                     display: none;
                  }
               }
            }
         }
      }
      .v-btn.search-btn {
         position: relative;
         bottom: -10px;
         color: var(--font-color-label);
      }
   }
   
   
</style>

<template>
   <v-card
      class="trajet-search-comp card-trajet mx-auto mt-0"
      max-width="500"
   >
      <v-list>
         <div class="part-list">

            <!-- Depart -->
            <v-list-item
               class="container-text trajet-search-comp"
            >
               <v-icon>mdi-navigation</v-icon>
               <div 
                  v-if="(depart == null || depart == '')"
                  class="cont-btn" @click="openDepEmit()"
               >
                  <v-btn
                     variant="solo"
                     class="text-none"
                     @click="openDepEmit()"                  
                  >Départ</v-btn>
               </div>

               <div 
                  v-if="!(depart == null || depart == '')"
                  class="cont-btn" 
                  @click="openDepEmit()"
                  >
                  <div 
                     class="head-search-selected"
                  >Depart</div>
                  <v-btn
                     variant="solo"
                     class="text-none selected"
                     @click="openDepEmit()"
                  >{{ depart }}</v-btn>
               </div>
            </v-list-item>
            
            <!-- Destination -->
            <v-list-item
               class="container-text trajet-search-comp"
            >
               <v-icon>mdi-navigation</v-icon>
               <div 
                  v-if="(destination == null || destination == '')"
                  class="cont-btn" 
                  @click="openDestEmit()"
                  >
                  <v-btn
                     class="text-none"
                     variant="solo"
                     @click="openDestEmit()"
                  >Destination</v-btn>
               </div>

               <div 
                  v-if="!(destination == null || destination == '')"
                  class="cont-btn" 
                  @click="openDestEmit()"
               >
                  <div 
                     class="head-search-selected"
                  >Destination</div>
                  <v-btn
                     variant="solo"
                     class="text-none selected"
                     @click="openDestEmit()"
                  >{{ destination }}</v-btn>
               </div>
            </v-list-item>

            
            <div class="container-calendar">

               <v-list-item
                  class="calendar"
                  @click="openCalendarEmit()"
               ><v-icon style="margin-right: 18px;">mdi-calendar-month-outline</v-icon>{{ dateString }}</v-list-item>

               <v-list-item
                  class="nb-person"
                  prepend-icon="mdi-account-plus"
                  :title="numberTrajet"
               >
                  <div class="cont-btn-switch">
                     <v-btn 
                        icon
                        variant="text"
                        @click="switchCommuneEmit()"
                     >
                        <v-icon
                           class=""
                           variant="text"
                        >mdi-repeat-variant</v-icon>
                     </v-btn>
                  </div>
               </v-list-item>
            </div>
         </div>

         <v-btn
            class="search-btn mr-4 text-none"
            rounded="xl" 
            size="x-large"
            variant="outlined"
            block
            @click="goResult()"
         >
            Rechercher
         </v-btn>
      </v-list>
   </v-card>   
</template>


<script>
   import $ from 'jquery'
   import { mapState } from 'vuex';

   export default {
      name: 'trajet-search-comp',
      computed: {
         ...mapState(['communes']),
      },
      components: {
      },
      props: {
         dateString: {
            type: String,
            default: "Aujourd'hui",
         },
         dep: {
            type: String,
            default: "",
         },
         dest: {
            type: String,
            default: "",
         },
      },
      data() {
         return {
            depart: null,
            destination: null,
            numberTrajet: 0,
            switch: false,
         }
      },
      mounted (){
      },
      methods: {
         switchCommuneEmit(){
            //Animation
            if( ! this.switch ){
               $('.cont-btn-switch .v-btn .v-icon').animate(
                  { deg: 180 },
                  {
                     duration: 400,
                     step: function(now) {
                        $(this).css({ transform: 'rotate(' + now + 'deg)' });
                     }
                  }
               );
               this.switch = true;
            }
            else {
               $('.cont-btn-switch .v-btn .v-icon').animate(
                  { deg: 0 },
                  {
                     duration: 400,
                     step: function(now) {
                        $(this).css({ transform: 'rotate(' + now + 'deg)' });
                     }
                  }
               );
               this.switch = false;
            }

            //action
            this.$emit("switch-commune");
         },
         goResult(){
            if ( this.numberTrajet > 0 ) {
               this.$router.push(`/results/${this.depart}/${this.destination}/${this.dateString}`);
            }
         },
         checkTrajet(){
            this.numberTrajet = this.$store.state.trajets.filter(trajet => trajet.depart == this.depart && trajet.destination == this.destination).length;
            if (this.depart && this.destination) {
               this.$emit("trajet-selected");
            }
         },
         openCalendarEmit(){
            this.$emit("open-calendar");
         },
         openDepEmit(){
            this.$emit("open-dep");
         },
         openDestEmit(){
            this.$emit("open-dest");
         },
      },
      watch: {
         depart(){
            this.checkTrajet();
         },
         destination(){
            this.checkTrajet();
         },
         dep(){
            this.depart = this.dep;
         },
         dest(){
            this.destination = this.dest;
         },
      },
   };
</script>