import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse,compileTemplate} from '@vue/compiler-sfc';
import {describe,it,expect,vi} from 'vitest';
import * as presentation from '@/services/tripPresentation.js';
import {loadRatingContext} from '@/services/ratingPreferences.js';
import {fetchProfileHistory} from '@/services/profileHistory.js';
const vx={mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),mapGetters:()=>({})};
function load(file,deps={}){let source=readFileSync(file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;
 const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>deps[id]||{...vx,defineComponent:x=>x,icon:()=>({})});return m.exports.default;
}
const departure='2026-11-05T12:00:00Z';const trip={id:7,departure_time:departure,route:{infosGoogle:{duration:'3600s'}}};
function query(result){return {select(){return this;},eq(){return this;},gte(){return this;},lt(){return this;},limit(){return this;},then(fn){return Promise.resolve(result).then(fn);}};}
describe('review eligibility and isolation',()=>{
 it.each([trip.route,[null,trip.route,{infosGoogle:{duration:'600s'}}]])('unlocks at estimated arrival',route=>{
  const row={...trip,route},start=Date.parse(departure);expect(presentation.canRateCompletedTrip(row,start+3599999)).toBe(false);expect(presentation.canRateCompletedTrip(row,start+3600000)).toBe(true);
 });
 it('uses a fallback for unknown durations and rejects cancelled or invalid trips',()=>{
  const start=Date.parse(departure);expect(presentation.canRateCompletedTrip({...trip,route:{}},start+3600000)).toBe(false);expect(presentation.canRateCompletedTrip({...trip,route:null},start+4*3600000)).toBe(true);
  expect(presentation.canRateCompletedTrip({...trip,cancellation_pending_at:departure},start+5*3600000)).toBe(false);expect(presentation.canRateCompletedTrip({departure_time:'bad'})).toBe(false);
 });
 it('refuses direct review access before arrival',async()=>{
  const spy=vi.spyOn(Date,'now').mockReturnValue(Date.parse(departure)+300000);
  try{const client={from:()=>query({data:[{trip_id:7,trip}]})};await expect(loadRatingContext(client,{tripId:7,accountId:2})).rejects.toThrow('arrivée');spy.mockReturnValue(Date.parse(departure)+3600000);await expect(loadRatingContext(client,{tripId:7,accountId:2})).resolves.toHaveLength(1);}finally{spy.mockRestore();}
 });
 it('keeps ongoing trips in history without offering a review',async()=>{
  const client={from:table=>query({data:table==='booking'?[{trip,is_accepted:true,in_car:true}]:[]})};
  const rows=await fetchProfileHistory(client,{accountId:2,userId:'user',resolveVillage:()=>'',now:Date.parse(departure)+300000});expect(rows[0].ratingEligible).toBe(false);
 });
 it('clears selected criteria for each review and preserves counters',()=>{
  const store=load('src/store/rating.js');const state=JSON.parse(JSON.stringify(store.state));for(const category of ['good','bad'])for(const item of state.btnIco[category]){item.select=true;item.numberOfVote=12;}
  store.mutations.RESET_RATING_SELECTION(state);for(const category of ['good','bad'])expect(state.btnIco[category].every(item=>!item.select&&item.numberOfVote===12)).toBe(true);
  const c=load('src/views/Rating.vue',{'@capacitor/core':{Capacitor:{getPlatform:()=> 'web'}}});const commit=vi.fn();c.mounted.call({$store:{commit},ratingDriver:{}});expect(commit).toHaveBeenCalledWith('rating/RESET_RATING_SELECTION');
 });
 it.each([{data:{}},{data:{status:'ok',data:{tripId:8,score:4}}}])('does not mark an unconfirmed review as rated',async response=>{
  const c=load('src/views/Rating.vue',{'@/utils/serverApi.js':{serverRequest:async()=>response}});
  const vm={...c.data(),ratings:{rating:true,data:[{trip_id:7}]},userUid:'owner',currentTripId:()=>7,btnIco:{good:[],bad:[]},avis:4,$store:{state:{profil:{accountGeneration:1}}},SET_RATINGS_REMOVE:vi.fn(),$router:{push:vi.fn()}};
  await c.methods.rated.call(vm);expect(vm.SET_RATINGS_REMOVE).not.toHaveBeenCalled();expect(vm.ratingError).toBeTruthy();expect(vm.isSubmitting).toBe(false);
 });
});
function reportVm(request){const c=load('src/components/trip/TripReportDialog.vue',{'@/utils/serverApi.js':{serverRequest:request}});const vm={...c.data(),...c.methods,userUid:'owner',accountGeneration:1,modeCo:'local',tripId:7,reason:'other',details:'Un problème observé',canSubmit:true,$emit:vi.fn()};return {c,vm};}
describe('private trip report form',()=>{
 it('confirms only a matching saved report and keeps errors retryable',async()=>{
  for(const response of [{data:{}},{data:{status:'ok',data:{reportId:'id',tripId:8}}}]){const {vm}=reportVm(async()=>response);await vm.submit();expect(vm.success).toBe('');expect(vm.error).toBeTruthy();expect(vm.submitting).toBe(false);}
  const {vm}=reportVm(async()=>({data:{status:'ok',data:{reportId:'id',tripId:7}}}));await vm.submit();expect(vm.success).toContain('enregistré');expect(vm.error).toBe('');
 });
 it('blocks duplicate taps and ignores an old account reply',async()=>{
  let finish;const request=vi.fn(()=>new Promise(resolve=>{finish=resolve;}));const {vm}=reportVm(request);
  const pending=vm.submit();await vm.submit();expect(request).toHaveBeenCalledTimes(1);vm.userUid='other';vm.accountGeneration++;vm.resetForm();finish({data:{status:'ok',data:{reportId:'id',tripId:7}}});await pending;expect(vm.success).toBe('');expect(vm.error).toBe('');
 });
 it('ignores replies after unmount',async()=>{
  let finish;const {c,vm}=reportVm(()=>new Promise(resolve=>{finish=resolve;}));const pending=vm.submit();c.beforeUnmount.call(vm);finish({data:{status:'ok',data:{reportId:'id',tripId:7}}});await pending;expect(vm.success).toBe('');
 });
 it('validates form bounds',()=>{
  const {c,vm}=reportVm(vi.fn());for(const fields of [{details:'short'},{details:'x'.repeat(2001)},{reason:'invented'},{tripId:0}])expect(c.computed.canSubmit.call({...vm,...fields})).toBe(false);expect(c.computed.canSubmit.call(vm)).toBe(true);
 });
});
describe('road alert acknowledgements',()=>{
 function harness(request){const c=load('src/components/trip/MapTrip.vue',{'@/utils/serverApi.js':{serverRequest:request}});const vm={...c.methods,userUid:'owner',$store:{state:{profil:{accountGeneration:1}}},alertsDisposed:false,alertCreateLoading:false,alertVoteLoading:false,modeCo:'local',canCreateAlert:true,currentLocation:{current:[-12.8,45.1]},alertTypes:[{value:'danger',label:'Danger'}],selectedAlertType:'danger',isPublicMap:true,selectedAlert:{id:'alert'},isAlertOwner:()=>false,getAlertVoteState:()=>'',getAlertActorKey:()=>'',findNearbyAlert:()=>null,addOrReplaceAlert:vi.fn(),openAlertDetails:vi.fn(),showSuccess:vi.fn(),handleServerError:vi.fn()};return {c,vm};}
 it('does not announce an unconfirmed vote or report',async()=>{
  const {vm}=harness(async()=>({data:{status:'ok',data:{}}}));await vm.voteSelectedAlert('confirm');await vm.createLocalAlert();expect(vm.showSuccess).not.toHaveBeenCalled();expect(vm.addOrReplaceAlert).not.toHaveBeenCalled();expect(vm.handleServerError).toHaveBeenCalledTimes(2);
 });
 it('blocks concurrent creates and votes',async()=>{
  let finish;const request=vi.fn(()=>new Promise(resolve=>{finish=resolve;}));const {vm}=harness(request);
  const pending=vm.createLocalAlert();await vm.createLocalAlert();expect(request).toHaveBeenCalledTimes(1);finish({data:{}});await pending;
  const vote=vm.voteSelectedAlert('confirm');await vm.voteSelectedAlert('confirm');expect(request).toHaveBeenCalledTimes(2);finish({data:{}});await vote;
 });
 it('rejects invalid coordinates and dates',()=>{
  const {vm}=harness(vi.fn());expect(vm.mapAlertRow({id:'id',type:'danger',coordinates:[null,0]})).toBeNull();expect(vm.mapAlertRow({id:'id',type:'danger',coordinates:[0,0],createdAt:'bad',expiresAt:'bad'})).toBeNull();
 });
});
it.each(['src/components/trip/TripReportDialog.vue','src/views/Rating.vue','src/components/trip/MapTrip.vue','src/components/menus/bottom/ReservePlace.vue'])('compiles %s',file=>{const {descriptor}=parse(readFileSync(file,'utf8'));expect(compileTemplate({source:descriptor.template.content,filename:file,id:'report'}).errors).toEqual([]);});
