
<style lang="scss" model>

    // .v-main.ligth-mode * {
    //     --bg-app-color: #f5f5f5;
    //     --white-bg-color: #FBFBFB;
    //     --gray-bg-icon-color: #b1b1b1;
    //     --blue-color: #2E8DFF;
    //     --gray-icon-color: #B1B1B1;
        
    //     // font
    //     --font-color-label: #1E1F26;
    //     --font-size-h1: 24px;
    //     --font-size-h1-toolbar: 16px;
    //     --font-size-subtitle-toolbar: 8px;
    //     --box-shadow-card: 0px 2px 24px rgba(17,17,17,0.04);
    //     --box-shadow-card-v2: 0px 0px 16px rgba(17,17,17,0.16);
    // }

    
    // mask
    $color1: var(--bg-app-color);
    //$color1: red;
    $color2: hotpink;
    $duration: 1.4s;
    

    @import url('https://fonts.googleapis.com/css?family=Work+Sans:400,700,900');

    h1{
        display: block;
        position: relative;
        font-size: 3em;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: -0.01em;
        top: 50%;
        transform: translateY(-50%);
        text-align: center;
        color: var(--font-color-label);
    }

    .mask{
        position: absolute;
        top:25%; left: 0;
        width: 100%; height: 50%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        background-color: $color1;

        cursor: pointer;
        mask: url(https://i.imgur.com/9mVumLa.png);
        mask: url(https://i.imgur.com/9mVumLa.png);
    
        mask-size: 3000% 100%;
    
        animation: mask-play $duration steps(29) forwards;
        .img {
            width: 100%;
            margin: auto;
            position: relative;
            top: 50%;
            transform: translateY(-50%);
            .v-img {
                margin: auto;
            }
        }
    }

    .mask.display {
        animation: mask-play-reverse $duration steps(29) forwards
    }

    @keyframes mask-play-reverse {
        from { mask-position: 0% 0 }
        to { mask-position: 100% 0 }
    }

    @keyframes mask-play {
        from { mask-position: 100% 0 }
        to { mask-position: 0% 0 }
    }

</style>

<!-- scss -->
<style lang="scss" scoped>
    .home{
        background-color: #eee;
        .v-container {
            margin: auto;
            height: 100vh;
            display: grid;
        }
    }
   
</style>
   
<!--  -->
<template>
  
    <v-main class="ligth-mode home">

        <v-container>
            <v-img
                class="zoom-bounce"
                style="margin: auto;"
                :width="173"
                aspect-ratio="16/9"
                cover
                src="../assets/logo.png"
            ></v-img>
        </v-container>

    </v-main>

    <!-- Load -->
    <v-overlay
        :model-value="overlayLoad"
        class="align-center justify-center"
    >
        <v-progress-circular
            color="black"
            indeterminate
            size="64"
        ></v-progress-circular>
    </v-overlay>

</template>


<!--  -->
<script>
    import { mapActions, mapState } from 'vuex'

    export default {
        name: 'home-view',
        computed: {
            ...mapState("auth", ["logged_in"]),
            ...mapActions("auth", ["checkSession"]),
        },
        data() {
            return {
                overlayLoad: true,
            }
        },
        methods: {
            goToLoginSign(){
                this.$router.push({ path: '/login' });
            },
            async checkSessionIn(){
                await this.checkSession;
                this.overlayLoad = false;
                if(this.logged_in)
                    this.$router.replace("/search");
                else{
                    setTimeout(function(){
                        this.$router.push("/login");
                    }.bind(this), 2000);
                }
            },
        },
        created() {
            this.checkSessionIn();
        },
        mounted() {
        },
        watch: {
        },
    }
</script>
