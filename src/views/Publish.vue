
<style lang="scss" model>
   
</style>

<!-- scss -->
<style lang="scss" scoped>

</style>
   
<!--  -->
<template>

   <BottomNav />
   <Search 
      v-if="mode=='depart'"
      ref="SearchRef"
      title="D'ou partez vous ?"
      label="Saisissez une commune"
      :items="items"
      :history="communesHistory"
      @selected="getSelected()" 
      @saisi="getSaisi()"
   />
   <Search 
      v-if="mode=='arriver'"
      ref="SearchRef"
      title="Où allez vous ?"
      label="Saisissez une commune"
      :items="items"
      :history="communesHistory"
      @selected="getSelected()" 
      @saisi="getSaisi()"
   />
   <TimeCard v-if="false"/>
   <SelectNumber v-if="false"/>

   <!-- time -->
   <BottomMenu
      v-if="mode=='time'"
      ref="BottomMenuRef" 
      :mode="mode"
      labelSelectorN1="A quelle heure souhaitez-vous partir ?"

      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- number -->
   <BottomMenu
      v-if="mode=='nb-passenger'"
      ref="BottomMenuRef" 
      :mode="mode"
      labelSelectorN1="Combien de personnes pouvez-vous prendre à bord ?"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- time hour domicile -->
   <BottomMenu
      v-if="mode=='select-day-hour-domicile'"
      ref="BottomMenuRef" 
      :mode="mode"
      labelSelectorN1="Repeter quelle jour ?"
      labelSelectorN2="Heur de depart du domicile"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />

   <!-- number -->
   <BottomMenu
      v-if="mode=='select-price'"
      ref="BottomMenuRef" 
      :mode="mode"
      labelSelectorN1="Précisez le prix unitaire des places"
      v-on:close="overlay = false"
      v-on:time-valided="getSelected()"
   />
</template>



<!--  -->
<script>
   import { defineComponent } from 'vue';
   import { mapState } from 'vuex';

   // Components
   import BottomNav from '@/components/menus/BottomNav.vue';
   import Search from '@/components/publish/Search.vue';
   import TimeCard from '@/components/menus/bottom/TimeCard.vue';
   import BottomMenu from '@/components/menus/BottomMenu.vue';
   import SelectNumber from '@/components/menus/bottom/SelectNumber.vue';

   export default defineComponent({
      name: 'publish-view',
      components: {
         BottomNav,
         Search,
         TimeCard,
         BottomMenu,
         SelectNumber,
      },
      computed: {
         ...mapState(['communes', 'communesHistory']),
      },
      data() {
         return {
            startTrajet: "",
            endTrajet: "",
            saisi: "",
            open: true,
            mode: "time",
            items: this.communesHistory,
            overlay: false,
         }
      },
      mounted() {
         
      },
      methods: {
         getSaisi(){
            console.log("getSaisi:", this.$refs.SearchRef.getSaisi())
            this.saisi = this.$refs.SearchRef.getSaisi();
            if( this.saisi == "" ) {
               this.items = [];
               return;
            }

            this.items = this.communes.filter((commune) => this.saisi != commune && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase()));
         },
         getSelected(){
            console.log("child-selected", this.startTrajet, this.endTrajet, this.mode)
            
            if ( this.mode == "depart" ) {
               console.log("t:", this.$refs.SearchRef.getSaisi());
               this.startTrajet = this.$refs.SearchRef.getSaisi();

               if ( this.$refs.BottomMenuRef ) {
                  if( ! this.overlay ){
                     this.overlay = this.$refs.BottomMenuRef.openMiddle();
                  }
                  else {
                     this.overlay = this.$refs.BottomMenuRef.close();
                  }
               }

               this.mode = "time";
            }
            else if ( this.mode == "time" ) {

               if ( this.$refs.BottomMenuRef ) {
                  if( ! this.overlay ){
                     this.overlay = this.$refs.BottomMenuRef.openMiddle();
                  }
                  else {
                     this.overlay = this.$refs.BottomMenuRef.close();
                  }
               }

               this.mode = "arriver";
               this.items = [];
               this.saisi = "";
            }
            else if( this.mode == "arriver" ) {
               
               if( this.$refs.SearchRef ){
                  console.log("t:", this.$refs.SearchRef.getSaisi());
                  this.endTrajet = this.$refs.SearchRef.getSaisi();
               }
            }
         },
      },
   });
</script>
