
<style lang="scss" model>
    @import url(//fonts.googleapis.com/css?family=Lato:300:400);

    .contents-mobile-only .header-mobile {
        margin:0;
    }

    .contents-mobile-only .header-mobile h1 {
        font-family: 'Lato', sans-serif;
        font-weight:300;
        letter-spacing: 2px;
        font-size:48px;
        color: white !important;
        position: absolute !important;
    }

    .contents-mobile-only p {
        font-family: 'Lato', sans-serif;
        letter-spacing: 1px;
        font-size:20px;
        font-weight: bold;
        color: #333333;
    }

    .contents-mobile-only .header-mobile {
        position:relative;
        text-align:center;
        background: linear-gradient(60deg, rgba(84,58,183,1) 0%, rgba(0,172,193,1) 100%);
        color:white;
    }

    .contents-mobile-only .header-mobile .logo {
        position: absolute;
        top:20%;
        width:70px;
        fill:white;
        padding-right:15px;
        display:inline-block;
        vertical-align: middle;
    }

    .contents-mobile-only .header-mobile .inner-header {
        height:65vh;
        width:100%;
        margin: 0;
        padding: 0;
    }

    .contents-mobile-only  .flex { /*Flexbox for containers*/
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
    }

    .contents-mobile-only .header-mobile .waves {
        position:relative;
        width: 100%;
        height:15vh;
        margin-bottom:-7px; /*Fix for safari gap*/
        min-height:100px;
        max-height:150px;
    }

    .contents-mobile-only .header-mobile .content {
        position:relative;
        height:20vh;
        text-align:center;
        background-color: white;
    }

    /* Animation */

    .contents-mobile-only .parallax > use {
        animation: move-forever 25s cubic-bezier(.55,.5,.45,.5)     infinite;
    }
    .contents-mobile-only .parallax > use:nth-child(1) {
        animation-delay: -2s;
        animation-duration: 7s;
    }
    .contents-mobile-only .parallax > use:nth-child(2) {
        animation-delay: -3s;
        animation-duration: 10s;
    }
    .contents-mobile-only .parallax > use:nth-child(3) {
        animation-delay: -4s;
        animation-duration: 13s;
    }
    .contents-mobile-only .parallax > use:nth-child(4) {
        animation-delay: -5s;
        animation-duration: 20s;
    }
    @keyframes move-forever {
        0% {
        transform: translate3d(-90px,0,0);
        }
        100% { 
            transform: translate3d(85px,0,0);
        }
    }
    /*Shrinking for mobile*/
    @media (max-width: 768px) {
        .contents-mobile-only .waves {
            height:40px;
            min-height:40px;
        }
        .contents-mobile-only .content {
            height:30vh;
        }
        .contents-mobile-only h1 {
            font-size:24px;
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    
</style>
   
<!--  -->
<template>

    <!--Hey! This is the original version
    of Simple CSS Waves-->
    <div class="contents-mobile-only">
        <div class="header-mobile">

            <!--Content before waves-->
            <div class="inner-header flex">
            <!--Just the logo.. Don't mind this-->
                <svg version="1.1" class="logo" baseProfile="tiny" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 500 500" xml:space="preserve">
                    <path fill="#FFFFFF" stroke="#000000" stroke-width="10" stroke-miterlimit="10" d="M57,283" />
                    <g>
                        <path fill="#fff"
                    d="M250.4,0.8C112.7,0.8,1,112.4,1,250.2c0,137.7,111.7,249.4,249.4,249.4c137.7,0,249.4-111.7,249.4-249.4
                    C499.8,112.4,388.1,0.8,250.4,0.8z M383.8,326.3c-62,0-101.4-14.1-117.6-46.3c-17.1-34.1-2.3-75.4,13.2-104.1
                    c-22.4,3-38.4,9.2-47.8,18.3c-11.2,10.9-13.6,26.7-16.3,45c-3.1,20.8-6.6,44.4-25.3,62.4c-19.8,19.1-51.6,26.9-100.2,24.6l1.8-39.7		c35.9,1.6,59.7-2.9,70.8-13.6c8.9-8.6,11.1-22.9,13.5-39.6c6.3-42,14.8-99.4,141.4-99.4h41L333,166c-12.6,16-45.4,68.2-31.2,96.2	c9.2,18.3,41.5,25.6,91.2,24.2l1.1,39.8C390.5,326.2,387.1,326.3,383.8,326.3z" />
                    </g>
                </svg>
                <h1>appuyez sur : Ctrl + Maj + M</h1>
            </div>

            <!--Waves Container-->
            <div>
                <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
                <defs>
                <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                </defs>
                <g class="parallax">
                <use xlink:href="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.7" />
                <use xlink:href="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" />
                <use xlink:href="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.3)" />
                <use xlink:href="#gentle-wave" x="48" y="7" fill="#fff" />
                </g>
                </svg>
            </div>
            <!--Waves end-->

        </div>
        <!--Header ends-->

        <!--Content starts-->
        <div class="content flex">
            <p>By @Hibaze</p>
        </div>
    </div>
    <!--Content ends-->
    <Toolbar v-if="false"/>
</template>



<!--  -->
<script>

    import { defineComponent } from 'vue';
    // import { mapActions, mapMutations, mapState } from 'vuex';

    import Toolbar from '@/components/menus/head/Toolbar.vue'
   
    export default defineComponent({
        name: 'only-mobile-view',
        computed: {
        },
        components: {
            Toolbar,
        },
        data() {
            return {
                
            };
        },
        mounted() {
            
        },
        methods: {
            
        },
        watch: {
            
        },
    });
</script>
