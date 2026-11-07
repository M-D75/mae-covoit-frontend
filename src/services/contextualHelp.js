import {reactive} from 'vue';
export const helpState=reactive({request:null});
// Tutorial completion and progress are remembered per account in every environment.
export const tutorialTestingMode=false;
const seen=new Set();
function key(userId,kind){return `covia-help-v1:${userId}:${kind}`;}
export function hasSeenHelp(userId,kind,storage){if(seen.has(key(userId,kind)))return true;try{return (storage||window.localStorage).getItem(key(userId,kind))==='seen';}catch{return false;}}
export function markHelpSeen(userId,kind,storage){seen.add(key(userId,kind));try{(storage||window.localStorage).setItem(key(userId,kind),'seen');}catch{/* Optional local preference only. */}}
export function requestContextHelp(userId,kind,{replay=false,accepted,tripId}={}){
 if(!replay&&helpState.request?.userId===userId&&helpState.request?.kind===kind)return false;
 if(!userId||!['passenger','driver','choose'].includes(kind)||(!replay&&hasSeenHelp(userId,kind)))return false;
 helpState.request={userId,kind,accepted,replay,tripId,step:replay?0:loadHelpStep(userId,kind)};return true;
}

const progress=new Map();
const progressKey=(userId,kind)=>`covia-help-progress-v2:${userId}:${kind}`;
export function loadHelpStep(userId,kind,storage){try{const value=progress.get(progressKey(userId,kind))??Number((storage||window.localStorage).getItem(progressKey(userId,kind)));return value===1?1:0;}catch{return progress.get(progressKey(userId,kind))||0;}}
export function saveHelpStep(userId,kind,step,storage){const value=step===1?1:0;progress.set(progressKey(userId,kind),value);try{(storage||window.localStorage).setItem(progressKey(userId,kind),String(value));}catch{/* The tour remains usable without storage. */}}
export function helpSteps(kind){return kind==='driver'?[{target:'driver-passengers',label:'Retrouvez ici les passagers et les demandes à accepter ou refuser.'},{target:'driver-chat',label:'Ouvrez ce cadre pour afficher la carte du trajet. La messagerie reste accessible depuis le suivi.'}]:[{target:'passenger-driver',label:'Retrouvez ici le profil du conducteur.'},{target:'passenger-chat',label:'Après acceptation, ce cadre ouvre le trajet, sa carte et ses messages.'}];}
export function placeHelp(rect,width,height,measuredHeight=160){const padding=8,tipWidth=Math.min(320,width-24),tipHeight=Math.min(height-24,measuredHeight);return {frame:{left:Math.max(4,rect.left-padding),top:Math.max(4,rect.top-padding),width:Math.max(0,Math.min(width-4,rect.right+padding)-Math.max(4,rect.left-padding)),height:Math.max(0,Math.min(height-4,rect.bottom+padding)-Math.max(4,rect.top-padding))},tip:{left:Math.max(12,Math.min(width-tipWidth-12,rect.left)),top:Math.max(12,Math.min(height-tipHeight-12,rect.bottom+padding+12<=height-tipHeight?rect.bottom+padding+12:rect.top-tipHeight-padding-12)),width:tipWidth}};}
