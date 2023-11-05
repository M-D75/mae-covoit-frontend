

<style lang="scss" model>
    .v-bottom-navigation {
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
        
        .v-btn {
            color: var(--gray-icon-color);
            font-weight: bold;
            flex-grow: 0;
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
        height="75"
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
            <v-icon>mdi-plus-circle</v-icon>

            Publier
        </v-btn >

        <v-btn 
            :active="false"
            :ripple="false"
            :class="{ selected: value == 2}">
            <v-icon>mdi-account-circle</v-icon>

            Profil
        </v-btn>
    </v-bottom-navigation>

</template>

<script>
    // import $ from 'jquery'

    // Components
    export default {
        name: 'bottom-nav',
        data() {
            return {
                value: 0,
            }
        },
        beforeMount (){
            switch (this.$router.currentRoute._rawValue.path) {
                case '/search':
                    this.value=0;
                    break;
                case '/publish':
                    this.value=1;
                    break;
                case '/publish/select-car':
                    this.value=1;
                    break;       
                default:
                    this.value=2;
            }
        },
        mounted (){
            console.log("Menu BootomNav:", this.value);
        },
        methods: {
            keep_menu_selected(){
                console.log("Nav : ", this.$router.currentRoute._rawValue.path)

                if (this.value == undefined) {
                    switch (this.$router.currentRoute._rawValue.path) {
                        case '/search':
                            this.value=0;
                            break;
                        case '/publish':
                            this.value=1;
                            break;
                        case '/publish/select-car':
                            this.value=1;
                            break;           
                        default:
                            this.value=2;
                    }
                }
            }
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
                        if(this.$router.currentRoute._rawValue.path != "/publish/select-car"){
                            this.$router.push("/publish");
                        }
                        break;
                    default:
                        if ( ! this.$router.currentRoute._rawValue.path.includes("/profil") ) {
                            this.$router.push("/profil");
                        }
                }
            }
        },
    };
</script>


