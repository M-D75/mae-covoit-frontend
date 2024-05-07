<!-- scss -->
<style lang="scss" model>
    

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
    @import "@/styles/mixins.scss";
    
    .scrollable-container {
        cursor: pointer;
        overflow-y: hidden !important;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
    }

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
                @include respond-to('small') {
                    padding-left: 15px;
                }
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
                <CardTrajetHistory 
                    v-for="(info, key) in infos"
                    :key="key"
                    :infos="info"
                    :mode="mode"
                    v-on:card-touched="$emit('card-touched')"
                    v-on:open-contacts="$emit('open-contacts')"
                    v-on:open-member="$emit('open-member')"
                    v-on:booking-removed="$emit('booking-removed')"
                />
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
        emits: ["card-touched", "open-contacts", "open-member", "booking-removed"],
        components: {
            CardTrajetHistory,
        },
        props: {
            mode: {
                type: String,
                default: "",
            },
            infos: {
                type: Array,
                default() {
                    return [
                        {
                            depart: "Tsingoni",
                            destination: "Mamoudzou",
                            hour_start: "4:50",
                            hour_end: "6:55",
                            price: 4,
                            name: "Ledou",
                            passenger_number: 2
                        },
                        {
                            depart: "Tsingoni",
                            destination: "Mamoudzou",
                            hour_start: "5:50",
                            hour_end: "6:55",
                            price: 2,
                            name: "Mamadou",
                            passenger_number: 2
                        },
                    ];
                },
            },
        },
    });
</script>
