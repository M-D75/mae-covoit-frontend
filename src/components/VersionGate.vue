<template>
    <slot />
    <aside v-if="banner && !details && !optionalPrompt" class="release-banner" role="status">
        <strong>{{ state.developmentAllowed ? 'Essai web local · politique indisponible' : required ? 'Mise à jour nécessaire pour de nouvelles opérations' : 'Mise à jour de Covia disponible' }}</strong>
        <p v-if="state.developmentAllowed">Le serveur autorise temporairement les essais locaux dans Covia-Dev. Compatibilité non vérifiée ; les vérifications habituelles restent actives.</p>
        <p v-else-if="state.offline">Vérification indisponible. Le trajet reste accessible.</p>
        <v-btn v-if="state.offline" size="small" variant="text" :loading="state.checking" @click="check(true)">Réessayer</v-btn>
        <p v-if="activeNative">Votre suivi natif continue. Choisissez le bon moment pour installer la mise à jour.</p>
        <v-btn v-if="canUpdate" size="small" @click="requestUpdate">Mettre à jour</v-btn>
        <v-btn v-if="!required" size="small" variant="text" @click="dismissed=notificationKey">Plus tard</v-btn>
        <v-btn size="small" variant="text" @click="details=true">Détails</v-btn>
    </aside>
    <v-dialog :model-value="blocking || details || optionalPrompt" :persistent="blocking" max-width="500" aria-labelledby="release-title" @update:model-value="closeDialog($event)">
        <v-card>
            <v-card-title id="release-title">{{ required ? 'Mettez à jour Covia' : available ? 'Mise à jour disponible' : 'Votre version de Covia' }}</v-card-title>
            <v-card-text>
                <p v-if="state.identity">Version {{ state.identity.version }} · {{ state.identity.platform }} · build {{ state.identity.build }}</p>
                <p v-if="required">Cette version ne permet plus de nouvelles opérations. Retrouvez vos trajets et messages ; certaines actions déjà engagées peuvent encore être prises en charge.</p>
                <p v-else-if="available">La version {{ policy.latestVersion }} est publiée pour votre plateforme.</p>
                <p v-else>Les informations de version disponibles ne signalent pas de mise à jour publiée.</p>
                <p v-if="state.offline">Vérification indisponible. Une panne réseau seule ne bloque pas vos trajets. Réessayez lorsque la connexion revient.</p>
                <p v-if="available && !canUpdate">Le lien de cette plateforme n’est pas disponible ici. Vérifiez votre canal de distribution habituel.</p>
                <p v-if="updateError" role="alert">{{ updateError }}</p>
            </v-card-text>
            <v-card-actions class="release-actions">
                <v-btn v-if="!required && available" variant="text" @click="closeDialog(false)">Plus tard</v-btn>
                <v-btn v-else-if="!blocking" variant="text" @click="closeDialog(false)">{{ required ? 'Revenir au trajet' : 'Fermer' }}</v-btn>
                <v-btn v-if="required" variant="outlined" @click="recover">Mes trajets</v-btn>
                <v-tooltip text="Vérifier les mises à jour"><template #activator="{ props }"><v-btn v-bind="props" icon="mdi-refresh" variant="text" :loading="state.checking" aria-label="Vérifier les mises à jour" @click="refreshResult" /></template></v-tooltip>
                <v-btn v-if="canUpdate && available" color="primary" variant="flat" :loading="updating" @click="requestUpdate">Mettre à jour</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-snackbar v-model="resultOpen" :color="resultColor" role="status">{{ resultMessage }}</v-snackbar>
    <v-dialog v-model="confirmUpdate" max-width="480">
        <v-card title="Mettre à jour maintenant ?">
            <v-card-text>{{ isNative ? 'L’installation depuis la boutique peut fermer Covia et interrompre le suivi. Vous pouvez continuer votre trajet et installer plus tard.' : 'Le rechargement ferme cette page et peut interrompre le suivi web ou effacer un brouillon de message. Vous pouvez continuer votre trajet et mettre à jour plus tard.' }}</v-card-text>
            <v-card-actions><v-btn @click="confirmUpdate=false">Continuer mon trajet</v-btn><v-btn :loading="updating" @click="update">{{ isNative ? 'Ouvrir la boutique' : 'Recharger Covia' }}</v-btn></v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Browser} from '@capacitor/browser';
import {versionState,checkCompatibility} from '@/services/versionCompatibility.js';
import {nativeTripTracking} from '@/services/nativeTripTracking.js';
import {updateWebApp} from '@/services/webUpdate.js';
export default {
 name:'VersionGate',
 data:()=>({state:versionState,now:Date.now(),dismissed:'',details:false,confirmUpdate:false,updating:false,updateError:'',activeNative:false,optionalPrompt:false,unsubscribe:null,listener:null,timer:null,disposed:false,recovery:false,resultOpen:false,resultMessage:'',resultColor:'info'}),
 computed:{
  policy(){return this.state.validUntil>this.now?this.state.compatibility:null;},
  required(){return this.policy?.status==='update_required';},available(){return ['update_required','update_available'].includes(this.policy?.status);},
  isNative(){return Capacitor.isNativePlatform();},canUpdate(){return Boolean(this.policy?.updateUrl);},
  dialogVisible(){return this.blocking||this.details||this.optionalPrompt||this.confirmUpdate;},
  recoveryRoute(){return /^\/(trip|message|rating|profil|login|sign|auth\/callback|itineraire)(\/|$)/.test(this.$route.path);},
  blocking(){return this.required&&!this.state.offline&&!this.recoveryRoute&&!this.activeNative;},
  notificationKey(){return `${this.policy?.status}:${this.policy?.latestBuild}:${this.policy?.latestBundle}`;},
  banner(){return !this.blocking&&(this.state.developmentAllowed&&this.dismissed!==this.notificationKey||this.required||this.available&&this.dismissed!==this.notificationKey);},
 },
 watch:{dialogVisible:{immediate:true,handler(open){this.state.dialogOpen=open;}},'$store.state.profil.modeCo'(){this.check(true);},notificationKey:{immediate:true,handler(){this.optionalPrompt=this.available&&!this.required&&this.dismissed!==this.notificationKey;}}},
 mounted(){this.check();this.unsubscribe=nativeTripTracking.observe(value=>{this.activeNative=Boolean(value.active);});
  window.addEventListener('online',this.online);window.addEventListener('covia-update-required',this.rejected);window.addEventListener('covia-web-update-ready',this.workerReady);window.addEventListener('covia-show-version',this.showDetails);
  document.addEventListener('visibilitychange',this.visible);
  this.timer=setInterval(()=>{this.now=Date.now();if(!document.hidden&&this.state.validUntil<=this.now+15000)checkCompatibility(false,this.$store.state.profil.modeCo);},1000);
  if(this.isNative)App.addListener('appStateChange',({isActive})=>{if(isActive)this.check();}).then(listener=>{if(this.disposed)listener.remove();else this.listener=listener;});
 },
 beforeUnmount(){this.state.dialogOpen=false;this.disposed=true;clearInterval(this.timer);this.unsubscribe?.();this.listener?.remove();document.removeEventListener('visibilitychange',this.visible);
  window.removeEventListener('online',this.online);window.removeEventListener('covia-update-required',this.rejected);window.removeEventListener('covia-web-update-ready',this.workerReady);window.removeEventListener('covia-show-version',this.showDetails);},
 methods:{
  async refreshResult(){await this.check(true);this.resultColor=(this.state.offline||!this.policy)?'warning':'info';this.resultMessage=this.state.developmentAllowed?'Politique indisponible. Essais web locaux autorisés par le serveur Covia-Dev ; compatibilité non vérifiée.':(this.state.offline||!this.policy)?'Vérification impossible. Réessayez lorsque le service ou la connexion revient.':this.required?'Une mise à jour est obligatoire pour de nouvelles opérations.':this.available?'Une nouvelle version de Covia est disponible.':'Votre version de Covia est à jour. Aucune mise à jour disponible.';this.resultOpen=true;},
  closeDialog(open){this.details=open;this.optionalPrompt=open;if(!open&&!this.required)this.dismissed=this.notificationKey;},
  async check(force=false){await checkCompatibility(force===true,this.$store.state.profil.modeCo);this.now=Date.now();},
  online(){this.check(true);},visible(){if(!document.hidden)this.check();},showDetails(){this.details=true;this.check(true);},
  rejected(){this.check(true);},
  workerReady(){this.check(true);},
  recover(){this.details=false;this.optionalPrompt=false;this.$router.push('/profil');},
  requestUpdate(){this.updateError='';if(this.activeNative||this.$store.state.trip.tripSelected?.id){this.confirmUpdate=true;return;}this.update();},
  async update(){this.updating=true;this.updateError='';try{
   if(this.isNative){if(!this.policy?.updateUrl)throw new Error('Aucun lien de boutique vérifié.');await Browser.open({url:this.policy.updateUrl});this.confirmUpdate=false;}
   else await updateWebApp({attemptKey:`covia-update:${this.notificationKey}`,currentBuild:this.state.identity?.build,expectedBuild:this.policy?.latestBuild});
  }catch(error){this.updateError=error.message;this.confirmUpdate=false;this.details=true;}finally{this.updating=false;}},
 },
};
</script>
<style scoped>
.release-banner{position:fixed;z-index:2400;top:calc(var(--safe-area-inset-top,0px) + 8px);left:8px;right:8px;margin:auto;max-width:680px;padding:12px 16px;border-radius:12px;border:1px solid rgba(var(--v-theme-primary),.5);background:rgb(var(--v-theme-surface));color:rgb(var(--v-theme-on-surface));box-shadow:0 3px 14px #0004;font-size:14px;max-height:36vh;overflow:auto;}.release-banner p{margin:6px 0;}.release-banner .v-btn{min-height:44px;margin:3px;}.release-actions{flex-wrap:wrap;justify-content:flex-end;}.release-actions .v-btn{min-height:44px;}
</style>
