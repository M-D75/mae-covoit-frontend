<style lang="scss" model>
    
</style>

<!-- scss -->
<style lang="scss" scoped>
    .blc-pile{
        position: relative;
        width: 100%;
        height: 200px;
        z-index: 0;
        .tj{
            margin: auto;
            left: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 1px 1px 3px #bbb;
        }
    }
</style>
   
<!--  -->
<template>
    <div class="blc-pile">
        <TrajetMemberBtn v-if="fastSearch == false" @click="fastSearch = true" class="tj main" style="z-index: 88; position: absolute; top:50%"/>
        <TrajetMember v-if="fastSearch == true" class="tj main" style="z-index: 88; position: absolute; top:50%"/>
        <TrajetMember class="tj sub" style="z-index: 87; position: absolute; top:55%; width: 83%;"/>
        <TrajetMember class="tj sub" style="z-index: 86; position: absolute; top:60%; width: 77%;"/>
    </div>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    import TrajetMemberBtn from './TrajetMemberBtn.vue';
    import TrajetMember from '@/components/search/TrajetMember.vue';

    export default defineComponent({
        name: 'pile-search-comp',

        components: {
            TrajetMemberBtn,
            TrajetMember,
        },
        data() {
            return {
                fastSearch: false,
            }
        },
        methods: {
        },
        mounted() {
        }
    });
</script>
