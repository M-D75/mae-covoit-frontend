
<style lang="scss" scoped>
  .v-container {
    position: absolute;
    bottom: 0;
    border-radius: 30px 30px 0 0;
    background-color: white;
    width: 100%;
    max-width: 100%;
  }

  .bar-up {
    cursor: pointer;
    margin: auto;
    margin-top: 5px;
    width: 15%;
    border: 2px solid gray;
    border-radius: 10px;
    z-index: 999;
  }
  .bar-up-t {
    cursor: pointer;
    margin: auto;
    margin-top: 5px;
    width: 15%;
    height: 50px;
    border: 2px solid transparent;
    border-radius: 10px;
    z-index: 999;
  }
  .draggable{
    position: absolute;
    top: 600px;
    // bottom: 0px;
    z-index: 999;
    width: 100%;
    &.dragging, &.active {
      border: none;
    }
  }

</style>

<template>

    <vue3-draggable-resizable
        class-name="draggable"
        v-model:x="x"
        v-model:y="y"
        :axis="'y'"
        v-model:active="active"
        :draggable="true"
        :resizable="false"
        :disabledX="true"
        :disabledY="disabledY"
        :disabledW="true"
        :disabledH="true"
        @dragging="onDrag"
        @drag-end="onDragStop"
      >
        <div class="bar-up-t"></div>
      </vue3-draggable-resizable>
    <v-container
      class="bottom-menu"
    >
      <div class="sub-cont">
        <div class="bar-up"></div>
        <TrajetMember v-if="!notif" :infos="infos"/>
        <ReservePlace v-if="!notif" v-on:test-notif-success="notif = !notif"/>
      </div>

      <Notification :message="'Votre trajet a été comfirmer par le chauffeur'" v-if="notif" />
    </v-container>
</template>


<!--  -->
<script>
  import { defineComponent } from 'vue';
  import $ from 'jquery';

  // Components
  import TrajetMember from '@/components/home/TrajetMember.vue';
  import Notification from '@/components/menus/bottom_menus/Notification.vue';
  import ReservePlace from '@/components/menus/bottom_menus/ReservePlace.vue';
  import Vue3DraggableResizable from 'vue3-draggable-resizable';

   export default defineComponent({
      name: 'bottom-menu',
      components: {
         Notification,
         TrajetMember,
         ReservePlace,
         Vue3DraggableResizable,
      },
      props: {
         infos: {
            type: Object,
            default() {
              return {
                   "depart": "Tsingoni",
                   "destination": "Mamoudzou",
                   "hour_start": "4:50",
                   "hour_end": "6:55",
                   "price": 4,
                   "name": "Ledou",
                   "passenger_number": 2
                 };
            },
         },
      },
      data() {
         return {
            x: 0,
            y: 0,
            notif: false,
            active: false,
            disabledY: false,
            sizeScreen: 0,
            move: false,
            marge_bar: 30,
            subContHeigth: 0,
            open_b: false,
         }
      },
      mounted() {
        this.sizeScreen = parseInt($("body").css("height").replace("px", ""));
        this.y = this.sizeScreen-this.marge_bar;
        $(".bottom-menu").css("top", `${this.y-5}px`);
        this.subContHeigth = parseInt($(".sub-cont").css("height").replace("px", ""));
      },
      methods: {
        onDrag(pos) {
          this.move = true;
          this.active = false;
          $(".bottom-menu").css("top", `${pos.y-5}px`);
          if (pos.y >= this.sizeScreen - this.marge_bar) {
            // close
            this.disabledY = true;
            this.y = this.sizeScreen-this.marge_bar;
            this.open_b = false;
          }
        },
        onDragStop(pos) {
          if (! this.move) {
            if ( pos.y >= this.sizeScreen-this.marge_bar ) {
              // open
              this.open();
            }
            else{
              // close
              this.y = this.sizeScreen-this.marge_bar;
              this.open_b = false;
              
              // test
              if (this.notif) {
                this.notif = !this.notif;
              }
            }
            $(".bottom-menu").animate({"top": `${this.y-5}px`}, "fast");
          }
          else if(this.move) {
            if ( pos.y >= this.sizeScreen-this.marge_bar ) {
              this.disabledY = false;
              this.y = this.sizeScreen-this.marge_bar;
            }
          }

          this.move = false;
        },
        open(){
          if (!this.open_b) {
            if ( this.y >= this.sizeScreen-this.marge_bar ) {
              // open
              this.disabledY = false;
              this.y = this.subContHeigth;
              $(".bottom-menu").animate({"top": `${this.y-5}px`}, "fast");
              this.open_b = true;
            }
          }
        },
      },
      watch:{
        y(){
          $(".bottom-menu").css("top", `${this.y-5}px`)
        },
      }
   });
</script>
