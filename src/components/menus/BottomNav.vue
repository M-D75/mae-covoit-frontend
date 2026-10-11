

<style lang="scss" model>
    .v-bottom-navigation {
        //position: absolute !important;
        .v-bottom-navigation__content{
            justify-content: space-evenly !important;
        }
        .v-btn {
            color: var(--gray-icon-color);
            .v-btn__content {
                color: var(--gray-icon-color);
            }
        }

        .v-btn.selected {
            color: var(--blue-color);
            .v-btn__content {
                color: var(--blue-color) !important;
                i {
                    color: var(--blue-color) !important;
                }
            }
        }

        .v-btn--variant-text .v-btn__overlay {
            background-color: white !important;
        }
    }
</style>

<style lang="scss" scoped>
    .v-bottom-navigation {
        background-color: var(--bg-app-color);
        padding-bottom: 5px;
        transition: transform 0.2s ease-out;

        &.keyboard-open {
            transform: translateY(100%) !important;
            pointer-events: none;
        }

        .v-btn {
            color: var(--gray-icon-color);
            font-weight: bold;
            flex-grow: 0;
            width: 25%;
        }

        .v-btn__content {
            color: var(--gray-icon-color);
            i {
                font-size: 2.7em !important;
                color: var(--gray-icon-color);
            }
        }
    }
</style>

<template>

    <v-bottom-navigation
        v-model="value"
        grow
        :class="{ 'keyboard-open': keyboardOpen }"
        :height="82 + barBottom"
        :style="{ paddingBottom: `${5 + barBottom}px` }"
    >
        <v-btn
            :active="false" 
            :ripple="false"
            :class="{ selected: value == 0}">
            <v-icon>mdi-magnify</v-icon>

            Recherche
        </v-btn>

        <v-btn
            :active="false"
            :ripple="false"
            :class="{ selected: value == 1}">
            <v-icon>mdi-map-marker-alert</v-icon>

            Carte
        </v-btn>

        <v-btn
            :active="false"
            :ripple="false"
            :class="{ selected: value == 2}">
            <v-icon>mdi-plus-circle</v-icon>

            Publier
        </v-btn >

        <v-btn 
            :active="false"
            :ripple="false"
            :class="{ selected: value == 3}">
            <v-icon>mdi-account-circle</v-icon>

            Profil
        </v-btn>
    </v-bottom-navigation>

</template>

<script>
    // import $ from 'jquery'
    import { SafeArea } from '@aashu-dubey/capacitor-statusbar-safe-area';
    import { Capacitor } from '@capacitor/core';
    import { Keyboard } from '@capacitor/keyboard';


    // Components
    export default {
        name: 'bottom-nav',
        data() {
            return {
                value: 0,
                barBottom: 0,
                keyboardOpen: false,
                keyboardListenerHandles: [],
                viewportHeight: 0,
                disposed: false,
            }
        },
        beforeMount (){
            this.value = this.routeIndex(this.$route.path);

        },
        mounted (){
            console.log("Menu BootomNav:", this.value);
            this.refreshSafeArea();
            document.addEventListener('visibilitychange', this.handleVisibilityChange);
            window.addEventListener('resize', this.refreshSafeArea);
            this.viewportHeight = window.visualViewport?.height || window.innerHeight || 0;
            window.visualViewport?.addEventListener('resize', this.handleViewportResize);

            if(Capacitor.isNativePlatform()){
                Promise.all([
                    Keyboard.addListener('keyboardWillShow', () => {
                        this.keyboardOpen = true;
                    }),
                    Keyboard.addListener('keyboardDidHide', () => {
                        this.keyboardOpen = false;
                        this.refreshSafeArea();
                    }),
                ]).then((handles) => {
                    if(this.disposed){
                        handles.forEach((handle) => handle?.remove?.());
                    }
                    else{
                        this.keyboardListenerHandles = handles;
                    }
                }).catch((error) => {
                    console.error('Unable to observe keyboard visibility:', error);
                });
            }

        },
        beforeUnmount(){
            this.disposed = true;
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            window.removeEventListener('resize', this.refreshSafeArea);
            window.visualViewport?.removeEventListener('resize', this.handleViewportResize);
            this.keyboardListenerHandles.forEach((handle) => handle?.remove?.());
        },
        methods: {
            handleViewportResize(){
                if(Capacitor.isNativePlatform()) return;

                const currentHeight = window.visualViewport?.height || window.innerHeight || 0;
                this.keyboardOpen = currentHeight < this.viewportHeight - 100;
                if(!this.keyboardOpen){
                    this.viewportHeight = currentHeight;
                }
            },
            routeIndex(path){
                if(path === '/search') return 0;
                if(path === '/road-alerts') return 1;
                if(path === '/publish' || path === '/publish/select-car') return 2;
                return 3;
            },
            keep_menu_selected(){
                console.log("Nav : ", this.$router.currentRoute._rawValue.path)
                if(this.value == undefined){
                    this.value = this.routeIndex(this.$route.path);
                }
            },
            handleVisibilityChange(){
                if(!document.hidden) this.refreshSafeArea();
            },
            async refreshSafeArea(){
                if(!Capacitor.isNativePlatform()) return;
                try{
                    const insets = await SafeArea.getSafeAreaInsets();
                    if(this.disposed) return;
                    const bottom = Number(insets.bottom);
                    this.barBottom = Number.isFinite(bottom) ? Math.max(0, bottom) : 0;
                }
                catch(error){
                    console.warn('Unable to read navigation bar insets:', error);
                }
            },
        },
        watch:{
            value(){
                this.keep_menu_selected();

                // Go to ->
                switch (this.value) {
                    case 0:
                        this.$router.push("/search");
                        break;
                    case 1:
                        this.$router.push("/road-alerts");
                        break;
                    case 2:
                        if(this.$router.currentRoute._rawValue.path != "/publish/select-car"){
                            this.$router.push("/publish");
                        }
                        break;
                    default:
                        if ( ! this.$router.currentRoute._rawValue.path.includes("/profil") ) {
                            this.$router.push("/profil");
                        }
                }
            },
            $route(to, from) {
                console.log("route-from", from.path, "to", to.path);
                this.value = this.routeIndex(to.path);
                // switch (to) {
                //     case '':
                //         this.$router.push("/search");
                //         break;
                //     case 1:
                //         if(this.$router.currentRoute._rawValue.path != "/publish/select-car"){
                //             this.$router.push("/publish");
                //         }
                //         break;
                //     default:
                //         if ( ! this.$router.currentRoute._rawValue.path.includes("/profil") ) {
                //             this.$router.push("/profil");
                //         }
                // }
            },
        },
    };
</script>
