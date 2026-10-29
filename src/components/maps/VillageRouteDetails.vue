<template>
    <section ref="root" class="village-route-details" @keydown.esc.stop="close">
        <button ref="toggle" type="button" class="details-toggle" :aria-expanded="expanded" :aria-controls="panelId" :disabled="blocked" @click="expanded=!expanded">{{ expanded?'Masquer les détails':'Voir les détails' }} <span aria-hidden="true">{{ expanded?'▴':'▾' }}</span></button>
        <div v-if="expanded && !blocked" :id="panelId" ref="panel" class="village-timeline-panel" role="region" aria-label="Villages traversés" tabindex="0" :style="{maxHeight:panelHeight+'px'}">
            <header><strong>Villages traversés</strong><button type="button" @click="close">Fermer</button></header>
            <p v-if="!details?.tracking" class="timeline-note">Itinéraire prévisionnel · aucun arrêt garanti.</p>
            <p v-else class="timeline-note">Passages sur l’itinéraire · aucun arrêt garanti.</p>
            <p v-if="details?.tracking && !details.reliable" role="status" class="timeline-note">Progression suspendue : position véhicule indisponible ou imprécise.</p>
            <ol class="village-timeline">
                <li v-for="zone in zones" :key="zone.key" :class="{visited:details?.tracking && zone.phase==='visited'}" :style="{'--zone-color':zone.color}" :aria-current="details?.tracking && details.reliable && zone.phase==='active'?'step':undefined">
                    <span class="timeline-dot" aria-hidden="true" />
                    <div><small>{{ zone.roles?.length>1?'Départ et arrivée':zone.role==='origin'?'Départ':zone.role==='destination'?'Arrivée':'Village traversé' }}</small><strong>{{ zone.label }}</strong><span class="timeline-phase">{{ phase(zone) }}</span></div>
                </li>
            </ol>
            <p v-if="details?.catalogStatus==='error'" class="timeline-note" role="status">Villages intermédiaires indisponibles.</p>
            <p v-if="details?.boundaryStatus==='loading'" class="timeline-note" role="status">Chargement des zones…</p>
            <p v-if="details?.missingBoundary || details?.boundaryStatus==='error'" class="timeline-note">Zone indisponible : repère affiché sur la carte.</p>
            <button v-if="details?.missingBoundary || details?.boundaryStatus==='error' || details?.catalogStatus==='error'" type="button" @click="$emit('retry')">Réessayer les zones</button>
        </div>
    </section>
</template>
<script>
import {VILLAGE_ZONE_STYLES} from './villageZoneUtils.js';
let nextId=0;
export default {
 name:'VillageRouteDetails',emits:['height','retry'],props:{details:{type:Object,default:null},mapInfos:{type:Object,default:()=>({})},blocked:Boolean},
 data:()=>({expanded:false,panelId:`village-route-details-${++nextId}`,viewport:typeof window==='undefined'?700:window.innerHeight,observer:null}),
 computed:{panelHeight(){return Math.max(80,Math.min(340,this.viewport*.42));},zones(){return this.details?.zones?.length?this.details.zones:[{key:'origin',role:'origin',label:this.mapInfos.depart||'Départ',color:VILLAGE_ZONE_STYLES.origin.color},{key:'destination',role:'destination',label:this.mapInfos.destination||'Arrivée',color:VILLAGE_ZONE_STYLES.destination.color}];}},
 watch:{'details.key'(){this.expanded=false;},blocked(value){if(value)this.expanded=false;},expanded(){this.$nextTick(this.measure);}},
 mounted(){if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(this.measure);this.observer.observe(this.$refs.root);}window.addEventListener('resize',this.resize);window.visualViewport?.addEventListener('resize',this.resize);this.resize();},
 beforeUnmount(){this.observer?.disconnect();window.removeEventListener('resize',this.resize);window.visualViewport?.removeEventListener('resize',this.resize);this.$emit('height',0);},
 methods:{resize(){this.viewport=window.visualViewport?.height||window.innerHeight;this.$nextTick(this.measure);},measure(){this.$emit('height',this.expanded?Math.max(0,(this.$refs.root?.getBoundingClientRect().height||0)-44):0);},close(){if(!this.expanded)return;this.expanded=false;this.$nextTick(()=>this.$refs.toggle?.focus({preventScroll:true}));},phase(zone){if(!this.details?.tracking)return 'Prévision';if(!this.details.reliable)return zone.phase==='visited'?'Traversé · progression suspendue':'Progression suspendue';return {visited:'Traversé',active:'Zone actuelle',upcoming:'À venir',uncertain:'Dernière zone observée'}[zone.phase]||'À venir';}},
};
</script>
<style scoped>
.village-route-details{font-size:14px;color:rgb(var(--v-theme-on-surface));text-align:left}.details-toggle{min-height:44px;padding:8px 4px;text-decoration:underline;font-weight:600}.details-toggle:focus-visible,.village-timeline-panel:focus-visible,.village-timeline-panel button:focus-visible{outline:2px solid rgb(var(--v-theme-primary));outline-offset:2px;border-radius:6px}.village-timeline-panel{overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;border-top:1px solid rgba(var(--v-theme-on-surface),.15);padding:0 10px 12px;max-width:100%;}.village-timeline-panel header{display:flex;align-items:center;justify-content:space-between;gap:8px;position:sticky;top:0;z-index:1;background:rgb(var(--v-theme-surface));min-height:44px}.village-timeline-panel header button{min-height:44px;padding:8px;text-decoration:underline}.timeline-note{font-size:12px;line-height:1.45;margin:4px 0 14px;opacity:.85}.village-timeline{list-style:none;padding:0 0 0 12px;margin:12px 0}.village-timeline li{position:relative;border-left:3px solid var(--zone-color);padding:0 0 22px 24px;min-height:75px}.village-timeline li:last-child{border-left-color:transparent;padding-bottom:4px}.timeline-dot{position:absolute;left:-8px;top:4px;width:13px;height:13px;border-radius:50%;background:var(--zone-color)}.visited .timeline-dot{opacity:.3}.visited{border-left-color:transparent!important}.visited::before{content:'';position:absolute;left:-3px;top:0;bottom:0;width:3px;background:var(--zone-color);opacity:.3}.visited:last-child::before{display:none}.village-timeline small,.village-timeline strong,.timeline-phase{display:block;overflow-wrap:anywhere}.village-timeline small,.timeline-phase{font-size:12px}.village-timeline strong{font-size:15px;line-height:1.4}.timeline-phase{margin-top:3px}.village-timeline li[aria-current=step] strong{text-decoration:underline;text-underline-offset:3px}
</style>
