<!-- scss -->
<style lang="scss" scoped>

    .contain-btn-icon{
        padding: 10px;
        .sub-contain-btn {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            margin: 10px auto;
            
            .v-btn {
                height: 48px;
                margin: 7px 15px;
                background-color: var(--white-bg-color);
                color: var(--font-color-label);
                position: relative !important;
                .number {
                    &.good {
                        background-color: rgb(0 116 255 / 74%);
                    }
                    &.bad {
                        background-color: rgba(255, 0, 0, 0.74);
                    }
                    width: -moz-fit-content;
                    width: fit-content;
                    min-width: 20px;
                    min-height: 20px;
                    text-align: center;
                    padding: 3px;
                    font-size: 10px;
                    color: white;
                    border-radius: 10px;
                    position: absolute;
                    top: 0px;
                    right: -20%;
                    z-index: 999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            }
        }
        
    }
</style>
   
<!--  -->
<template>

    <div 
        class="contain-btn-icon" :class="className.join(' ')"
    >
        <div 
            v-if="editable"
            class="sub-contain-btn"
        >
            <v-btn
                v-for="(btn, indexB) in btnIco[type]"
                :key="indexB"
                :icon="btn.icon"
                :color="type=='good' ? (btn.select ? (darkMode ? '#1af2a7' : 'green' ) : '') : (btn.select ? 'red' : '')"
                :disabled="btnIco[type == 'good' ? 'bad' : 'good'][indexB].select ? true : false"
                variant="outlined"
                @mouseenter="actionMouseenter(btn, indexB);"
                @click="actionClick(btn, indexB);"
            >
            </v-btn>
        </div>

        <div 
            v-else
            class="sub-contain-btn"
        >
            <v-btn
                v-for="(btn, indexB) in btnIco[type]"
                :key="indexB"
                icon
                variant="outlined"
            >
                <div class="number" :class="type">{{ btn.numberOfVote }}</div>
                <v-icon :icon="btn.icon"></v-icon>
            </v-btn>
        </div>

    </div>

</template>


<!--  -->
<script>
    // import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState, mapMutations } from 'vuex';

    // Components

    export default defineComponent({
        name: 'icon-rating-comp',
        emits: ['description-changed'],
        computed: {
            ...mapState("profil", ["darkMode"]),
            ...mapState("rating", ["btnIco"]),
        },
        components: {
        },
        props: {
            className: {
                type: Array,
                default: () => ([]),
            },
            editable: {
                type: Boolean,
                default: true,
            },
            type: {
                type: String,
                default: "good",
            },
        },
        data() {
            return {
                description: "description",
                notHappy: false,
                overlay: false,
            }
        },
        mounted() {
            
        },
        methods: {
            ...mapMutations("rating", ["SET_BTN_ICO_SELECT"]),
            actionMouseenter(btn, indexB){
                if(this.editable){
                    this.description=(indexB+1)+'. '+btn.description
                }
            },
            actionClick(btn, indexB){
                if(this.editable){
                    console.log("infos:", {type: this.type, index: indexB, value:!btn.select}, this.btnIco);
                    this.SET_BTN_ICO_SELECT({type: this.type, index: indexB, value:!btn.select});
                    this.description=(indexB+1)+'. '+btn.description;
                }
            },
        },
        watch: {
            description(){
                this.$emit("description-changed")
            },
        }
    });
</script>
