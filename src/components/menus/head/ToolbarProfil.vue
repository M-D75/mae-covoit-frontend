
<style lang="scss" model>
   // toolbar
   .v-btn i.v-icon.icon-chev-left {
      margin-right: 0;
      // font-size: 2em;
   }

    .v-app-bar {
        box-shadow: var(--box-shadow-card) !important;
        .v-toolbar {
            .v-toolbar-title__placeholder {
                font-size: 16px !important;
                font-weight: 450;
            }
            i.v-icon.mdi-tune {
                color: v-bind(colorParams) !important;
            }
        }
    }

</style>

<!-- scss -->
<style lang="scss" scoped>

    // toolbar
    .v-app-bar {
        box-shadow: var(--box-shadow-card);
        .v-toolbar {
            z-index: 1;
            background-color: var(--bg-app-color);
            box-shadow: var(--box-shadow-card);
            // natif
            padding-top: var(--safe-area-inset-top);
            margin-top: var(--safe-area-inset-top);
            .v-btn i.v-icon {
                margin-right: 0 !important;
                color: var(--gray-icon-color);
            }
            .v-toolbar-title {
                font-size: var(--font-size-h1-toolbar);
                color: var(--font-color-label);
            }
            
            .label-filter.text-caption {
                width: 85%;
            }
        }
    }

</style>

<!--  -->
<template>

    <!-- toolbar -->
    <v-app-bar
        extended
        :extension-height="barHeight"
    >
        <v-toolbar
            class=""
            dark
            permanent
        >
            <!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->
            <v-btn 
                icon
                v-if="!needToComeBack"
                :disabled="!isNative"
            >
                <!-- without notif -->
                <v-icon
                    v-if="notification && isNative"
                    class="mr-0"
                    @click="SET_NOTIFICATION(false)"
                >mdi-bell</v-icon>

                <v-icon
                    v-else
                    class="mr-0"
                    @click="SET_NOTIFICATION(true)"
                    
                >mdi-bell-off</v-icon>
            </v-btn>

            <v-btn
                icon
                v-else
                @click="back()"
            >
                <v-icon
                    class="mr-0"
                >mdi-chevron-left</v-icon>
            </v-btn>


            <v-toolbar-title
                class="ml-5 mr-5 text-center"
            >
                {{title}}
            </v-toolbar-title>

            <v-btn 
                icon
                @click="accessSetting()"
            >
                <v-icon>mdi-tune</v-icon>
            </v-btn>
            
        </v-toolbar>
   </v-app-bar>

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { SafeAreaController, SafeArea } from '@aashu-dubey/capacitor-statusbar-safe-area';

    import { mapState, mapMutations } from 'vuex';


    export default defineComponent({
        name: 'toolbar-comp',
        computed: {
            ...mapState("profil", [ "notification"]),
            ...mapState("general", [ "isNative"]),
        },
        components: {
        },
        props: {
            title: {
                type: String,
                default: "Profil",
            },
            date: {
                type: String,
                default: "Aujourd'hui",
            },
        },
        data() {
            return {
                needToComeBack: false,
                colorParams: "var(--gray-icon-color)",
                barHeight: 0,
            }
        },
        methods: {
            ...mapMutations("profil", ["SET_NOTIFICATION"]),
            accessSetting() {
                this.$router.currentRoute._rawValue.path == "/setting" ? this.$router.back() : this.$router.push("/setting");
            },
            back(){
                //this.$router.back();
                this.$emit("back");
                this.needToComeBack = false;
            },
            async initStatusBarHeight(){
                const insets = await this.getSafeAreaInsets();
                this.barHeight = insets["top"];
            },
            async getSafeAreaInsets () {
                const insets = await SafeArea.getSafeAreaInsets();
                return insets; // Ex. { "bottom":34, "top":47, "right":0, "left":0 }
            },
        },
        mounted() {
            if (this.$router.currentRoute._rawValue.path == "/setting") {
                this.colorParams = "var(--blue-color)";
            }
            else if (this.$router.currentRoute._rawValue.path == "/profil/perso") {
                this.needToComeBack = true;
            }

            SafeAreaController.injectCSSVariables();

            this.initStatusBarHeight();
        }
    });
</script>
