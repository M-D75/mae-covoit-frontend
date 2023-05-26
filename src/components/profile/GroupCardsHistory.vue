<!-- scss -->
<style lang="scss" model>
    .scrollable-container {
        cursor: pointer;
        overflow-y: scroll;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
    }

    /* Pour Chrome, Edge et Safari */
    .scrollable-container::-webkit-scrollbar {
        width: 6px;
    }

    .scrollable-container::-webkit-scrollbar-track {
        background: transparent;
    }

    .scrollable-container::-webkit-scrollbar-thumb {
        background-color: transparent;
    }
</style>

<style lang="scss" scoped>
    .bloc-history {
        overflow: visible;
        width: 100%;
        margin: auto;
        
        .sub-bloc-history {
            overflow: visible;
            width: 100%;
            
            .sub-sub-bloc-history {
                width: 100%;
                overflow-x: scroll;
                display: flex;
                padding-right: 50px;
                padding-bottom: 5px;
                padding-top: 5px;
                padding-left: 35px;
                div {
                    margin-right: 20px;
                }
            }
        }
    }
</style>
   
<!--  -->
<template>
    <div class="bloc-history">
        <div class="sub-bloc-history">
            <div class="sub-sub-bloc-history scrollable-container">
                <CardTrajetHistory />
                <CardTrajetHistory />
            </div>
        </div>
    </div>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    import CardTrajetHistory from '@/components/profile/CardTrajetHistory.vue'
    

    export default defineComponent({
        name: 'group-cards-history-comp',

        components: {
            CardTrajetHistory,
        },
        data() {
            return {
            }
        },
        methods: {
        }
    });
</script>
