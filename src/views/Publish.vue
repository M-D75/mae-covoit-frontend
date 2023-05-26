
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
      @selected="getSelected()" 
      @saisi="getSaisi()"
   />
   <Search 
      v-if="mode=='arriver'"
      ref="SearchRef"
      title="Où allez vous ?"
      label="Saisissez une commune"
      :items="items"
      @selected="getSelected()" 
      @saisi="getSaisi()"
   />
   <TimeCard v-if="true"/>
</template>



<!--  -->
<script>
   import { defineComponent } from 'vue';
   import { mapState } from 'vuex';

   // Components
   import BottomNav from '@/components/menus/BottomNav.vue';
   import Search from '@/components/publish/Search.vue';
   import TimeCard from '@/components/menus/bottom/TimeCard.vue';

   export default defineComponent({
      name: 'publish-view',
      components: {
         BottomNav,
         Search,
         TimeCard,
      },
      computed: {
         ...mapState(['communes']),
      },
      data() {
         return {
            startTrajet: "",
            endTrajet: "",
            saisi: "",
            open: true,
            mode: "depart!",
            items: [],
         }
      },
      methods: {
         getSaisi(){
            console.log("getSaisi:", this.$refs.SearchRef.getSaisi())
            this.saisi = this.$refs.SearchRef.getSaisi();
            if( this.saisi == "" ) {
               this.items = this.communes;
               return;
            }

            this.items = this.communes.filter((commune) => this.saisi != commune && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase()));
         },
         getSelected(){
            console.log("child-selected", this.startTrajet, this.endTrajet, this.mode)
            console.log("t:", this.$refs.SearchRef.getSaisi());
            if ( this.mode == "depart" ) {
               this.startTrajet = this.$refs.SearchRef.getSaisi();
               this.mode = "arriver";
               this.items = [];
               this.saisi = "";
            }
            else if(this.mode == "arriver") {
               this.endTrajet = this.$refs.SearchRef.getSaisi();
            }
         },
      },
   });
</script>
