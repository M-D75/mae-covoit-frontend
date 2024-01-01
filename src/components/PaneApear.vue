

<style lang="scss" model>
    .v-container.pan-apear-value {
        .sub-cont {
            .vc-calendar-pi {
                box-shadow: none;
                border: none;
                display: grid;
                margin: 25% auto;
            }
        }
    }
</style>


<style lang="scss" scoped>
    .closed {
        visibility: collapse;
        z-index: 0;
        pointer-events: none;
    }

    .v-container.pan-apear-value {
        position: fixed;
        padding: 0;
        padding-top: var(--safe-top);
        background-color: var(--bg-app-color);
        width: 100%;
        max-width: 100%;
        height: 100vh;
        z-index: 99991;
        .sub-cont {
            height: 100vh;
            &.scrolling {
                overflow: scroll;
            }
            &.not-scroll{
                overflow: hidden;
            }
            .title {
                font-size: var(--font-size-h1);
                font-weight: bold;
                width: 100%;
                margin: 25px auto;
                color: var(--font-color-label);
            }
        }
    }

</style>

<template>
    <v-container
        class="pan-apear-value" 
        :class="className.join(' ')"
    >
        <div class="sub-cont" 
            :class="mode=='date' ? 'scrolling' : 'not-scroll'"
        >
            <Contacts 
                v-if="mode=='contacts'"
                :nothing="contacts.nothing"
                v-on:go-back="close()" 
            />

            <ProfilMemberComp 
                v-if="mode=='profil-member'"
                :toolbar-double="toolbarDouble"
                v-on:go-back="close()"
            />
        </div>

    </v-container>

    <!-- loading -->
    <v-overlay style="z-index: 9999;" disabled :model-value="overlayLoad" class="align-center justify-center">
        <v-progress-circular color="blue" indeterminate size="64"></v-progress-circular>
    </v-overlay>
</template>


<!-- vuejs -->
<script>
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';
    import $ from 'jquery';

    //import { useScreens } from 'vue-screen-utils';

    //Component
    import Contacts from '@/components/profile/Contacts.vue';
    // import ProfilMember from '@/views/profil/ProfilMember.vue';
    import ProfilMemberComp from './profile/ProfilMemberComp.vue';
    
    export default defineComponent({
        name: 'pan-apear-comp',
        emits: ["close", "date-selected"],
        computed: {
            ...mapState("trip", ['chat']),
        },
        components: {
            Contacts,
            // ProfilMember,
            ProfilMemberComp,
        },
        props: {
            toolbarDouble: {
                type: Boolean,
                default: false,
            },
            openP: {
                type: Boolean,
                default: () => false,
            },
            mode: {
                type: String,
                default: "contacts",
            },
            className: {
                type: Array,
                default: () => ([]),
            },
        },
        data() {
            return {
                sizeScreen: 0,
                saisi: "",
                opened: false,
                overlayLoad: false,
                contacts: {
                    nothing: false,
                }
            }
        },
        mounted() {
            this.sizeScreen = $(window).innerWidth();            
            $(".pan-apear-value").css("left", `${this.sizeScreen}px`);
            $(".pan-apear-value").addClass("closed");

            //Init calendar
            
        },
        methods: {
            async open(){
                const classPaneApearNameJquery = this.className != "" && this.className != null ? `.pan-apear-value.${this.className.join(".")}` : ".pan-apear-value";
                $(classPaneApearNameJquery).removeClass("closed");

                const vue = this;                

                $(classPaneApearNameJquery).animate({left: `0px`}, 'fast', 
                                function(){
                                    $(this).css("top", `0px`);
                                    vue.opened = true;
                                }
                            );
                
                switch (this.mode) {
                    case "contacts":
                        this.overlayLoad = true;
                        this.contacts.nothing = false;
                        await this.$store.dispatch("trip/getContacts");
                        if( this.chat.contacts.length == 0 )
                            this.contacts.nothing = true;

                        this.overlayLoad = false;
                        break;
                    default:
                        break;
                }
            },
            close(){
                const classPaneApearNameJquery = this.className != "" && this.className != null ? `.pan-apear-value.${this.className.join(".")}` : ".pan-apear-value";
                const vue = this;
                $(classPaneApearNameJquery).animate({left: `${this.sizeScreen}px`}, "fast", function(){
                    $(this).addClass("closed");
                    $(this).css("left", `${this.sizeScreen}px`);
                    vue.opened = false;
                });
            },
        },
        watch: {
            openP(){
                console.log("openP:", this.openP)
                if(this.openP){
                    this.open();
                }
                else{
                    this.close();
                }
            },
        }
   });
</script>
