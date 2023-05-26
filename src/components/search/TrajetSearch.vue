<!-- model -->
<style lang="scss" model>
   .v-card.trajet-search-comp {
      z-index: 20 !important;
      overflow: visible;
      border-radius: 20px !important;
      i.v-icon {
         font-size: 1.2em;
         margin-right: 10px !important;
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
               .v-input .v-input__prepend {
                  margin-right: -17px !important;
                  text-align: center;
               }
               // Surcharge TrajetMember navigation incon
               .mdi-navigation.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
                  top: 4px;
               }

               .v-autocomplete {
                  .v-field__append-inner {
                     i.v-icon.mdi-menu-down.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
                        display: none;
                     }
                  }
               }
            }

            .container-calendar {
               display: flex;
               height: 58px;
               .calendar .v-list-item-title{
                  font-weight: bold;
               }

               .nb-person.v-list-item i.v-icon {
                  margin-right: 20px;
                  color: gray !important;
               }
               .mdi-account-plus.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default {
                  margin-right: 15px;
                  font-size: 1.4em;
               }

               .cont-btn-switch{
                  position: absolute;
                  width: 100%;
                  top: -78px;
                  left: 9px;
                  // swap
                  .v-btn {
                     position: relative;
                     left: 22px;
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
</style>

<!-- scoped -->
<style lang="scss" scoped>
   .v-card.trajet-search-comp {
      margin: 35px;
      margin-top: 10px;
      width: 89.6%;
      height: 256px;
      box-shadow: var(--box-shadow-card);
      .v-list-item {
         &.calendar {
            width: 70%;
            .v-list-item-title{
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
         &.container-text .v-autocomplete {
            width: 85%;
            height: 50px;
            .v-field__append-inner {
               i.v-icon.mdi-menu-down.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
                  display: none;
               }
            }
         }
      }
      .v-btn.search-btn {
         position: relative;
         bottom: -10px;
      }
   }
   
   
</style>

<template>
   <v-card
      class="trajet-search-comp card-trajet mx-auto mt-0"
      max-width="500"
      style="border-radius: 20px !important;"
   >
      <v-list>
         <div class="part-list">
            <v-list-item
               class="container-text trajet-search-comp"
            >
               <v-autocomplete
                  v-model="depart"
                  label="Départ"
                  persistent-hint
                  prepend-icon="mdi-navigation"
                  variant="solo"
                  clearable
                  @click="openDepEmit()"
               ></v-autocomplete>
            </v-list-item>
            
            <v-list-item
               class="container-text trajet-search-comp"
            >
               <v-autocomplete
                  v-model="destination"
                  :items="communes.filter(address => address != depart)"
                  label="Destination"
                  :focused="focus"
                  :active="focus"
                  :autofocus="focus"
                  persistent-hint
                  prepend-icon="mdi-navigation"
                  variant="solo"
                  clearable
                  @click="openDestEmit()"
               ></v-autocomplete>
            </v-list-item>

            
            <div class="container-calendar">

               <v-list-item
                  class="calendar"
                  prepend-icon="mdi-calendar-month-outline"
                  :title="dateString"
                  @click="openCalendarEmit()"
               ></v-list-item>

               <v-list-item
                  class="nb-person"
                  prepend-icon="mdi-account-plus"
                  :title="numberTrajet"
               >
                  <div class="cont-btn-switch">
                     <v-btn 
                        icon
                        variant="text"
                     >
                        <v-icon
                           class=""
                           @click="switchCommuneEmit()"
                           variant="text"
                        >mdi-swap-horizontal</v-icon>
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
            focus: false,
         }
      },
      mounted (){
      },
      methods: {
         switchCommuneEmit(){
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
            this.focus = false,
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