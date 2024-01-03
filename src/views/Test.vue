
<style lang="scss" model>

    .card-contacts {
        .v-list {
            .v-list-subheader__text {
                color: var(--font-color-label);
            }
        }
    }

</style>

<!-- scss -->
<style lang="scss" scoped>
    .card-contacts {
        .v-toolbar{
            color: var(--font-color-label);
            background-color: var(--bg-app-color);
        }

        .v-list {
            color: var(--font-color-label);
            background-color: var(--bg-app-color);
            .v-list-subheader__text {
                color: var(--font-color-label);
            }
        }
    }
</style>
   
<!--  -->
<template>
    <PaneApear mode="contacts" ref="PaneApearRef"/>

    <!-- <v-btn @click="open()">Open</v-btn> -->
    <Identity />
    <!-- <SelectCreditCard /> -->

    <!-- loading -->
    <v-overlay disabled :model-value="overlayLoad" class="align-center justify-center">
        <v-progress-circular color="blue" indeterminate size="64"></v-progress-circular>
    </v-overlay>

</template>



<!--  -->
<script>
    //import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapActions, mapMutations, mapState } from 'vuex';


    // Components
    // import Contacts from '@/components/profile/Contacts.vue';
    import PaneApear from '@/components/PaneApear.vue';
    // import SelectCreditCard from '@/components/menus/bottom/SelectCreditCard.vue';
    import Identity from '@/components/profile/Identity.vue';

    export default defineComponent({
        name: 'test-view',
        computed: {
            ...mapState("search", ["trajets", "trajetSelected"]),
            ...mapActions("search", ["getTrajets"]),
        },
        components: {
            PaneApear,
            // SelectCreditCard,
            Identity,
        },
        props: {
        },
        data() {
            return {
                items: [
                    { type: 'subheader', title: 'Today' },
                    {
                        prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
                        title: 'Brunch this weekend?',
                        subtitle: `<span class="text-primary">Ali Connors</span> &mdash; I'll be in your neighborhood doing errands this weekend. Do you want to hang out?`,
                    },
                    { type: 'divider', inset: true },
                    {
                        prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/2.jpg',
                        title: 'Summer BBQ',
                        subtitle: `<span class="text-primary">to Alex, Scott, Jennifer</span> &mdash; Wish I could come, but I'm out of town this weekend.`,
                    },
                    { type: 'divider', inset: true },
                    {
                        prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/3.jpg',
                        title: 'Oui oui',
                        subtitle:
                            '<span class="text-primary">Sandra Adams</span> &mdash; Do you have Paris recommendations? Have you ever been?',
                    },
                    { type: 'divider', inset: true },
                    {
                        prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/4.jpg',
                        title: 'Birthday gift',
                        subtitle:
                            '<span class="text-primary">Trevor Hansen</span> &mdash; Have any ideas about what we should get Heidi for her birthday?',
                    },
                    { type: 'divider', inset: true },
                    {
                        prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/5.jpg',
                        title: 'Recipe to try',
                        subtitle:
                            '<span class="text-primary">Britta Holt</span> &mdash; We should eat this: Grate, Squash, Corn, and tomatillo Tacos.',
                    },
                ],
                overlayLoad: false,
            }
        },
        mounted() {
            // this.$refs.PaneApearRef.open()
        },
        methods: {
            ...mapMutations("search", ["SET_DEPART", "SET_DESTINATION", "SET_NB_PASSENGER", "SET_TRAJET_SELECTED"]),
            goToProfil(){
                console.log();
            },
            open(){
                this.$refs.PaneApearRef.open()
            }
        },
        watch: {
            
        },
    });
</script>
