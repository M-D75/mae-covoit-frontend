
<style lang="scss">

    .ligth-mode * {
        --bg-app-color: #f5f5f5;
        --white-bg-color: #FBFBFB;
        --gray-bg-icon-color: #b1b1b1;
        --blue-color: #2e8dff;
        
        // font
        --font-color-label: #1E1F26;
        --font-size-h1: 24px;
        --font-size-h1-toolbar: 16px;
        --font-size-subtitle-toolbar: 8px;
        --box-shadow-card: 0px 2px 24px #eee;
    }

    .dark-mode * {
        --bg-app-color: #1a1a1a;
        --white-bg-color: #333333;
        --gray-bg-icon-color: red;
        --blue-color: gold;

        // font
        --font-color-label: #FBFBFB;
        --font-size-h1: 24px;
        --font-size-h1-toolbar: 16px;
        --font-size-subtitle-toolbar: 8px;
        --box-shadow-card: 0px 2px 24px #111;
    }

    * {
        font-family: 'Rubik';
        letter-spacing: 0;
    }

    .v-application.v-theme--light.v-layout.v-layout--full-height.v-locale--is-ltr {
        background-color: var(--bg-app-color);
        .v-application__wrap {
            background-color: var(--bg-app-color);
        }
    }
    .v-application.v-theme--dark.v-layout.v-layout--full-height.v-locale--is-ltr {
        background-color: #1a1a1a;
    }

    .text-fs26 {
        font-size: 26px !important;
    }

</style>

<template>
    <v-app class="ligth-mode">
        <v-main>
            <router-view/>
        </v-main>
    </v-app>
</template>

<script>

    import $ from 'jquery';

    export default {
        name: 'App',

        data: () => ({
            //
        }),
        mounted(){
            if( this.$store.state.darkMode ){
                $("#app .v-application").removeClass("ligth-mode");
                $("#app .v-application").addClass("dark-mode");
            }
        },
    }
</script>
