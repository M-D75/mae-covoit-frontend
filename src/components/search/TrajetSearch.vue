
<!-- model -->
<style lang="scss" model>
   .blc-text.trajet-search-comp {
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

   .blc-calendar {
      display: flex;
      height: 58px;
   }

   .mdi-account-plus.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default {
      margin-right: 15px;
      font-size: 1.4em;
   }
   .part-list {
      padding: 10px;
   }
   .card-trajet i.v-icon {
      font-size: 1.2em;
      margin-right: 10px !important;
   }
   .calendar .v-list-item-title{
      font-weight: bold;
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

   .nb-person.v-list-item i.v-icon {
      margin-right: 20px;
      color: gray !important;
   }
   .v-list-item i.v-icon {
      color: gray !important;
   }

   .blc.extension-calendar {
      display: none;
      position: absolute;
      right: 0;
      left: 0;
      margin: auto;
      top: 52%;
      .vc-container {
         margin: auto !important;
         left: 0 !important;
         right: 0 !important;
         display: block !important;
      }
   }
</style>

<!-- scoped -->
<style lang="scss" scoped>
   .v-card {
      margin: 35px;
      margin-top: 10px;
      width: 89.6%;
      height: 256px;
      border-radius: 20px;
      box-shadow: 2px 2px 10px #eee;
      .v-btn.search-btn {
         position: relative;
         bottom: 5px;
         margin-top: 16px;
      }
   }
   
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
      &.blc-text .v-autocomplete {
         width: 85%;
         height: 50px;
         .v-field__append-inner {
            i.v-icon.mdi-menu-down.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
               display: none;
            }
         }
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
            <v-list-item
               class="blc-text trajet-search-comp"
            >
               <v-autocomplete
                  v-model="depart"
                  :items="communes.filter(address => address != destination)"
                  label="Départ"
                  persistent-hint
                  prepend-icon="mdi-navigation"
                  variant="solo"
                  clearable
               ></v-autocomplete>
            </v-list-item>
            
            <v-list-item
               class="blc-text trajet-search-comp"
            >
               <v-autocomplete
                  v-model="destination"
                  :items="communes.filter(address => address != depart)"
                  label="Destination"
                  persistent-hint
                  prepend-icon="mdi-navigation"
                  variant="solo"
                  clearable
               ></v-autocomplete>
            </v-list-item>

            <div class="blc-calendar">
               <v-list-item
                  class="calendar"
                  prepend-icon="mdi-calendar-month-outline"
                  :title="dateString"
                  @click="accessCalendar()"
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
                           @click="switch_commune()"
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
            @click="testGoResult()"
         >
            Rechercher
         </v-btn>
      </v-list>
   </v-card>

   <div class="blc extension-calendar">
      <VCalendar/>
      <VDatePicker v-model="date" :min-date="calendar.minDate" />
   </div>
</template>


<script>
   import $ from 'jquery'
   import { mapState } from 'vuex';


   // Components
   import VCalendar from 'v-calendar';

   export default {
      name: 'trajet-search-comp',
      computed: {
         ...mapState(['communes']),
      },
      components: {
         VCalendar,
      },
      data() {
         return {
            depart: null,
            destination: null,
            numberTrajet: 0,
            date: null,
            dateString: "Aujourd'hui",
            calendar: {
               minDate: new Date(),
            }
         }
      },
      mounted (){
         const date = new Date();

         let day = date.getDate();
         let month = date.getMonth() + 1;
         let year = date.getFullYear();

         this.date = new Date(`${month}/${day}/${year}`);
      },
      methods: {
         switch_commune (){
            var tmp = this.depart;
            this.depart = this.destination;
            this.destination = tmp;
         },
         testGoResult(){
            
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
         accessCalendar() {
            if ( $(".blc.extension-calendar").css("display") == "none" ) {
               $(".blc.extension-calendar").css("display", "inherit");
            }
            else {
               $(".blc.extension-calendar").css("display", "none");
            }
         },
      },
      watch: {
         depart(){
            this.checkTrajet();
         },
         destination(){
            this.checkTrajet();
         },
         date(){
            const tmpCurrentDate = new Date();
            var day   = tmpCurrentDate.getDate();
            var month = tmpCurrentDate.getMonth() + 1;
            var year  = tmpCurrentDate.getFullYear();

            const currentDate = new Date(`${month}/${day}/${year}`);
            const tomorrowsDate = new Date(`${month}/${day+1}/${year}`);

            day   = this.date.getDate();
            month = this.date.getMonth() + 1;
            year  = this.date.getFullYear();

            if (currentDate.getTime() == this.date.getTime()) {
               this.dateString = "Aujourd'hui";
            }
            else if (tomorrowsDate.getTime() == this.date.getTime()) {
               this.dateString = "Demain";
            }
            else {
               this.dateString = `${day >= 10 ? day : "0" + day}-${month >= 10 ? month : "0" + month}-${year}`;
            }
            console.log("d", this.date, currentDate)
            this.accessCalendar();
         },
      },
   };
</script>