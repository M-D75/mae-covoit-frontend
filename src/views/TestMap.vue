<style >
.my-div-icon span {
  position: absolute;
  top: -10px;
  left: -20px;
  z-index: 1;
}

.my-div-icon img {
  position: absolute;
  top: -5px;
  left: -5px;
}

#mapp{
    display: none;
}
</style>

<template>
    <div style="height: 100vh; width: 100%">

    <Map></Map>

    <!-- <BottomMenuTrip
        mode="alert"
        :class-name="['alert']"
        ref="BottomMenuRef"
        v-on:close="open_b = false"
        v-on:opened="open_b = true"
    /> -->
    </div>
</template>

<script>
    import { defineComponent } from 'vue';

    //comp
    // import Map from "@/components/publish/Map.vue"
    import Map from "@/components/trip/MapTrip.vue"
    // import Map from "@/views/MapGoogle.vue"
    // import BottomMenuTrip from '@/components/menus/trip/BottomMenuTrip.vue';

    export default defineComponent({
        name: 'results-view',
        computed: {
            center() {
                const latitudes = this.locations.map(location => location.coordinates[0]);
                const longitudes = this.locations.map(location => location.coordinates[1]);
                const minLat = Math.min(...latitudes);
                const maxLat = Math.max(...latitudes);
                const minLon = Math.min(...longitudes);
                const maxLon = Math.max(...longitudes);
                return [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
            }
        },
        components: {
            Map,
            // BottomMenuTrip,
        },
        props: {
            
        },
        data() {
            return {
                
            }
        },
        mounted(){
            // this.$refs.BottomMenuRef.open();
        },
        methods: {
            handleMapLoad(event) {
                console.log('La carte a été chargée', event);
                // Votre code ici...
            },
        },
        watch: {
        },
    });
</script>
