<template>
    <template v-if="visible">
        <div v-if="layout" class="help-frame" :style="frameStyle" aria-hidden="true" />
        <aside ref="controls" class="help-controls" :class="{ 'help-waiting':!layout }" :style="tipStyle" aria-label="Repères du trajet">
            <template v-if="request.kind==='choose'">
                <p>Quels repères souhaitez-vous revoir ?</p>
                <button type="button" @click="replay('passenger')">Passager</button><button type="button" @click="replay('driver')">Conducteur</button>
            </template>
            <template v-else-if="layout">
                <p aria-live="polite">{{ step+1 }}/2 · {{ steps[step].label }}</p>
                <button type="button" @click="advance">{{ step===1?'Terminer':'Suivant' }}</button>
            </template>
            <template v-else>
                <p>{{ targetMissing ? 'Aucun cadre de trajet à présenter ici pour le moment.' : 'Retrouvez ces deux repères dans Mes trajets.' }}</p>
                <button v-if="!onProfile" type="button" @click="openTrips">Voir dans Mes trajets</button>
            </template>
            <button type="button" @click="skip">{{ request.kind==='choose'?'Fermer':'Passer' }}</button>
        </aside>
    </template>
</template>
<script>
import {helpState,markHelpSeen,requestContextHelp,saveHelpStep,helpSteps,placeHelp,tutorialTestingMode} from '@/services/contextualHelp.js';
import {versionState} from '@/services/versionCompatibility.js';
export default {
 name:'ContextualHelp',data:()=>({help:helpState,version:versionState,layout:null,observer:null,resizeObserver:null,frame:null,scrolled:null,targetMissing:false,developmentEntryStarted:false}),
 computed:{
  userId(){return this.$store.state.profil.userUid;},request(){return this.help.request;},step(){return this.request?.step||0;},steps(){return helpSteps(this.request?.kind);},onProfile(){return /^\/profil(?:\/|$)/.test(this.$route.path);},
  visible(){return Boolean(this.request&&this.request.userId===this.userId&&!this.version.dialogOpen&&!['/rating','/cropper'].includes(this.$route.path));},
  frameStyle(){return this.layout?this.boxStyle(this.layout.frame):{};},tipStyle(){return this.layout?this.boxStyle(this.layout.tip):{};},
 },
 watch:{request:{deep:true,handler(){this.scrolled=null;this.schedule();}},visible(){this.schedule();},'$route.path'(to,from){this.developmentEntryStarted=false;if(from?.startsWith('/profil')&&!to.startsWith('/profil')&&this.layout&&this.request){saveHelpStep(this.userId,this.request.kind,this.step);this.help.request=null;}this.layout=null;this.scrolled=null;this.schedule();},userId(){this.help.request=null;this.developmentEntryStarted=false;this.schedule();}},
 mounted(){this.observer=new MutationObserver(()=>this.schedule());this.observer.observe(document.querySelector('.v-application')||document.body,{childList:true,subtree:true});this.resizeObserver=new ResizeObserver(()=>this.schedule());window.addEventListener('resize',this.schedule);window.addEventListener('scroll',this.schedule,true);this.schedule();},
 beforeUnmount(){this.observer?.disconnect();this.resizeObserver?.disconnect();cancelAnimationFrame(this.frame);window.removeEventListener('resize',this.schedule);window.removeEventListener('scroll',this.schedule,true);},
 methods:{
  boxStyle(box){return Object.fromEntries(Object.entries(box).map(([key,value])=>[key,`${value}px`]));},
  schedule(){if(this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=null;this.startDevelopmentEntry();this.locate();});},
  startDevelopmentEntry(){
   if(!tutorialTestingMode||this.developmentEntryStarted||!this.userId||!this.onProfile)return;
   if(this.request){if(this.request.userId===this.userId)this.developmentEntryStarted=true;return;}
   const target=[...document.querySelectorAll('[data-context-help]')].find(el=>el.getClientRects().length&&['driver-passengers','passenger-driver'].includes(el.dataset.contextHelp));
   if(!target)return;
   this.developmentEntryStarted=true;
   requestContextHelp(this.userId,target.dataset.contextHelp==='driver-passengers'?'driver':'passenger',{tripId:target.closest('[data-help-trip-id]')?.dataset.helpTripId});
  },
  locate(){
   if(!this.visible||this.request.kind==='choose'){if(this.layout)this.layout=null;return;}
   const candidates=[...document.querySelectorAll(`[data-context-help="${this.steps[this.step].target}"]`)];
   const target=candidates.find(el=>(!this.request.tripId||String(el.closest('[data-help-trip-id]')?.dataset.helpTripId)===String(this.request.tripId))&&el.getClientRects().length);
   this.targetMissing=this.onProfile&&!target;
   if(!target){if(this.layout)this.layout=null;return;}
   if(this.scrolled!==target){this.scrolled=target;this.resizeObserver.disconnect();this.resizeObserver.observe(target);target.scrollIntoView({block:'center',inline:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
   const rect=target.getBoundingClientRect(),width=window.innerWidth,height=window.innerHeight;
   if(rect.bottom<=0||rect.top>=height){if(this.layout)this.layout=null;return;}
   const controls=this.$refs.controls;if(controls)this.resizeObserver.observe(controls);
   const next=placeHelp(rect,width,height,controls?.getBoundingClientRect().height||160);if(JSON.stringify(next)!==JSON.stringify(this.layout))this.layout=next;
  },
  advance(){if(this.step===1){this.finish();return;}this.request.step=1;saveHelpStep(this.userId,this.request.kind,1);this.scrolled=null;this.schedule();this.$nextTick(()=>this.$refs.controls?.querySelector('button')?.focus({preventScroll:true}));},
  finish(){markHelpSeen(this.userId,this.request.kind);saveHelpStep(this.userId,this.request.kind,0);this.help.request=null;this.layout=null;},
  skip(){if(this.request.kind!=='choose'){saveHelpStep(this.userId,this.request.kind,this.step);markHelpSeen(this.userId,this.request.kind);}this.help.request=null;this.layout=null;},
  replay(kind){requestContextHelp(this.userId,kind,{replay:true});this.openTrips();},
  openTrips(){this.$router.push(this.request.kind==='driver'?'/profil/open-trip-driver':'/profil/open-trip-passenger');},
 },
};
</script>
<style scoped>
.help-frame{position:fixed;z-index:2450;pointer-events:none;border:3px solid rgb(var(--v-theme-primary));border-radius:16px;box-shadow:0 0 0 5px rgba(var(--v-theme-primary),.12);animation:help-pulse 3.6s ease-in-out .45s infinite;}
.help-controls{position:fixed;z-index:2451;padding:12px 14px;border:1px solid rgba(var(--v-theme-on-surface),.25);border-radius:14px;background:rgb(var(--v-theme-surface));color:rgb(var(--v-theme-on-surface));box-shadow:0 4px 18px #0003;font-size:14px;max-height:calc(100dvh - 24px);overflow:auto;}
.help-controls p{margin:0 0 8px;line-height:1.4}.help-controls button{min-height:44px;padding:8px 12px;border-radius:10px;text-decoration:underline;font-weight:600}.help-controls button:focus-visible{outline:2px solid rgb(var(--v-theme-primary));outline-offset:1px}.help-waiting{bottom:calc(16px + var(--safe-bottom,0px));left:12px;right:12px;max-width:360px;margin:auto}
@keyframes help-pulse{0%,100%{opacity:.55}50%{opacity:1}}@media(prefers-reduced-motion:reduce){.help-frame{animation:none;opacity:1}}
</style>
