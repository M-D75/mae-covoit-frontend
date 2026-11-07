import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse,compileTemplate} from '@vue/compiler-sfc';
import {describe,it,expect,vi,afterEach} from 'vitest';
import lodash from 'lodash';
import * as utils from '@/utils/utils.js';
import * as tripHelpers from '@/services/tripPresentation.js';
import * as preferences from '@/services/travelPreferences.js';
const vx={mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({})};
function load(file,deps={}){let s=readFileSync(file,'utf8');if(file.endsWith('.vue'))s=parse(s).descriptor.script.content;const m={exports:{}};new Function('module','exports','require',transformSync(s,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>deps[id]||(id.endsWith('tripPresentation.js')?tripHelpers:id.endsWith('travelPreferences.js')?preferences:{}));return m.exports.default;}
const base={id:1,driver_id:'driver',departure_time:'2026-11-05T12:00:00Z',price:4,route:{infosGoogle:{duration:'3600s'},polylineDecoded:[[0,0],[0,1]]},booking:[],account:{}};
const clone=x=>JSON.parse(JSON.stringify(x));
const profile=()=>load('src/store/profil.js');
afterEach(()=>vi.restoreAllMocks());
function query(result){return {select(){return this},neq(){return this},gte(){return this},gt(){return this},lt(){return this},eq(){return this},is(){return this},then(resolve){resolve(result)}};}
function searchHarness(from){
 const store={dispatch:vi.fn().mockResolvedValue(true),state:{profil:{userUid:'owner',accountGeneration:0}}};
 const s=load('src/store/search.js',{'../store':store,'@/utils/supabaseClient.js':{from},'@/utils/utils.js':utils});
 const state=clone(s.state);const commit=vi.fn((name,payload)=>s.mutations[name](state,payload));
 return {s,store,state,ctx:{state,commit,getters:{GET_VILLAGE_BY_ID:id=>String(id)},dispatch:vi.fn().mockResolvedValue(true)}};
}
describe('trip data and recovery',()=>{
 it.each([null,undefined,0,-1,NaN,'',false])('never invents a price for %s',price=>{
  const random=vi.spyOn(Math,'random');const trip=tripHelpers.normalizeTrip({...base,price});expect(trip.price).toBeNull();expect(trip.canReserve).toBe(false);expect(random).not.toHaveBeenCalled();
 });
 it.each([base.route,[null,base.route]])('normalizes object and array routes without losing duration',route=>{
  const row=tripHelpers.normalizeTrip({...base,route});expect(row.canReserve).toBe(true);expect(tripHelpers.routeDurationSeconds(route)).toBe(3600);expect(row.route.polylineDecoded).toHaveLength(2);
 });
 it('formats absolute departure and arrival once, including midnight rollover',()=>{
  for(const departure_time of ['2026-11-05T12:00:00Z','2026-11-05T23:30:00Z']){
   const row=tripHelpers.normalizeTrip({...base,departure_time});const end=new Date(Date.parse(departure_time)+3600000);expect(row.hour_end).toBe(`${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`);
  }
 });
 it('retains a mixed list and marks missing route details as unavailable',async()=>{
  const h=searchHarness(()=>query({data:[base,{...base,id:2,route:{}},{...base,id:3,departure_time:'invalid'}],error:null}));
  expect((await h.s.actions.getTrajetsDate(h.ctx,{date:new Date(base.departure_time)})).status).toBe(0);expect(h.state.trajets).toHaveLength(2);expect(h.state.trajets[1]).toMatchObject({hour_end:'—',canReserve:false});expect(h.state.warning).toBeTruthy();
 });
 it('keeps the entire tracking window and removes trips only after its actual end',()=>{
  const start=Date.parse(base.departure_time);expect(tripHelpers.isUpcomingOrActive(base,start+90*60000)).toBe(true);expect(tripHelpers.isUpcomingOrActive(base,start+120*60000+1)).toBe(false);
  expect(tripHelpers.isUpcomingOrActive({...base,route:null},start+4*3600000)).toBe(true);
 });
 it('loads a selected trip directly for its driver or accepted passenger, not an unrelated account',async()=>{
  const trip={...base,booking:[{id:8,passenger_account_id:2,is_accepted:true,is_refused:false}]};const client={from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:trip})})};
  for(const [userUid,accountId] of [['driver',1],['passenger',2]])expect((await tripHelpers.fetchAccessibleTrip(client,{tripId:1,userUid,accountId})).id).toBe(1);
  await expect(tripHelpers.fetchAccessibleTrip(client,{tripId:1,userUid:'stranger',accountId:3})).rejects.toThrow('accessible');
 });
 it('clears stale results on failure and makes a successful retry possible',async()=>{
  let result={data:null,error:{code:'offline'}};const h=searchHarness(()=>query(result));h.state.trajets=[base];
  expect((await h.s.actions.getTrajetsDate(h.ctx,{date:new Date()})).status).toBe(1);expect(h.state.trajets).toEqual([]);expect(h.state.error).toBeTruthy();expect(h.state.loading).toBe(false);
  result={data:[base],error:null};await h.s.actions.getTrajetsDate(h.ctx,{date:new Date()});expect(h.state.error).toBe('');expect(h.state.trajets).toHaveLength(1);
 });
 it('rejects an older search response after a newer search or an account change',async()=>{
  const replies=[];const h=searchHarness(()=>({ ...query(null),then(resolve){replies.push(resolve)}}));
  const first=h.s.actions.getTrajetsDate(h.ctx,{date:new Date()});await vi.waitFor(()=>expect(replies).toHaveLength(1));const second=h.s.actions.getTrajetsDate(h.ctx,{date:new Date()});await vi.waitFor(()=>expect(replies).toHaveLength(2));
  replies[1]({data:[{...base,id:2}],error:null});await second;replies[0]({data:[base],error:null});expect((await first).stale).toBe(true);expect(h.state.trajets[0].id).toBe(2);
  const third=h.s.actions.getTrajetsDate(h.ctx,{date:new Date()});await vi.waitFor(()=>expect(replies).toHaveLength(3));h.store.state.profil.userUid='B';replies[2]({data:[base],error:null});expect((await third).stale).toBe(true);
 });
 it('refuses booking a missing-price trip without calling the server',async()=>{
  const request=vi.fn();const h=searchHarness(()=>query({data:[]}));const s=load('src/store/search.js',{'../store':h.store,'@/utils/serverApi.js':{serverRequest:request}});
  const result=await s.actions.reserveTrajet({state:{trajetSelected:{...base,price:null},nbPassenger:1}},{requestId:'fixture'});expect(result.valided).toBe(false);expect(request).not.toHaveBeenCalled();
 });
});
describe('account-owned saves',()=>{
 it('ignores a garage response from an older account generation, including switching back to the same UID',async()=>{
  let deliver;const p=profile(),state=clone(p.state);p.mutations.SET_USER_UID(state,'A');
  const module=load('src/store/profil.js',{'../store':{dispatch:async()=>true},'@/utils/supabaseClient.js':{from:()=>({select(){return this},eq(){return this},then(resolve){deliver=resolve}})}});
  const pending=module.actions.getCars({state});await vi.waitFor(()=>expect(deliver).toBeTypeOf('function'));p.mutations.SET_USER_UID(state,'B');p.mutations.SET_USER_UID(state,'A');deliver({data:[{id:1,driver_id:'A'}]});expect((await pending).stale).toBe(true);expect(state.cars).toEqual([]);
 });
 it.each([false,true])('restores saved preferences/contact fields with array or object settings (%s)',async objectSettings=>{
  const p=profile(),state=clone(p.state),root={profil:state},store={state:root};const account={id:8,lastname:'Fixture',firstname:'User',email:'fixture@example.invalid',avatar:'fixture',identity:false,phone_number:'0692000000',village:'Village',salutation:'Mme',settings:[{auto_accept_trip:false,prefer:[2,1,0,2]}]};
  if(objectSettings) account.settings=account.settings[0];
  const a=load('src/store/auth.js',{'../store':store,'@/utils/supabaseClient.js':{auth:{getSession:async()=>({data:{session:{access_token:'fixture',expires_at:9999999999,user:{id:'owner',app_metadata:{provider:'email'},user_metadata:{}}}}})},from:()=>({select(){return this},eq:async()=>({data:[account]})})},'@/utils/serverApi.js':{serverRequest:async()=>({data:{customer:{},provider:{}}})},'@/services/authEntry.js':{rememberAuthEntry:()=>{}}});
  const authState=clone(a.state);const commit=(name,value)=>name.startsWith('profil/')?p.mutations[name.split('/')[1]](state,value):a.mutations[name](authState,value);
  expect(await a.actions.checkSession({state:authState,commit,rootState:root})).toBe(true);expect(preferences.preferenceIndices(state.profil.infos_perso.preferences)).toEqual([2,1,0,2]);expect(state.profil.infos_perso).toMatchObject({tel:'0692000000',civilite:'Mme',adress:{commune:'Village'}});
 });
 it('saves one preference while preserving the other three and only commits after confirmation',async()=>{
  const state=clone(profile().state);state.userUid='owner';state.userId=8;let sent,resolve;const p=load('src/store/profil.js',{'@/utils/supabaseClient.js':{from:()=>({update(value){sent=value;return this},eq(){return this},select:()=>new Promise(r=>{resolve=r})})}});const commit=vi.fn();const pending=p.actions.updatePreference({state,commit},{about:'smoke',index:1});
  expect(sent.prefer).toEqual([1,1,1,1]);expect(commit).not.toHaveBeenCalled();resolve({data:[{prefer:sent.prefer}]});expect((await pending).status).toBe(0);expect(commit).toHaveBeenCalledWith('SET_PREFERENCES',sent.prefer);
 });
 it('does not close preferences or change the selected value on a rejected save',async()=>{
  const c=load('src/components/menus/bottom/bottom_menu/PreferenceChoice.vue',{vue:{defineComponent:x=>x},vuex:vx,lodash});const vm={saving:false,groupeParameters:[{parameters:[{about:'music',index:2}]}],updatePreference:vi.fn().mockResolvedValue({status:1,message:'Échec'}),$emit:vi.fn()};await c.methods.updatePref.call(vm,1);expect(vm.$emit).not.toHaveBeenCalled();expect(vm.saveError).toBe('Échec');expect(vm.saving).toBe(false);
 });
 it.each([{data:[],error:null},{data:null,error:{code:'42501'}}])('handles missing/refused settings without a crash or an optimistic toggle',async response=>{
  const p=load('src/store/profil.js',{'@/utils/supabaseClient.js':{from:()=>({update(){return this},eq(){return this},select:async()=>response})}});const state={userUid:'owner',accountGeneration:1,userId:8,auto_accept_trip:false};expect((await p.actions.updateAutoValidation({state},true)).status).toBe(1);expect(state.auto_accept_trip).toBe(false);
 });
 it('saves only editable personal fields and ignores a stale response',async()=>{
  let finish;const request=vi.fn(()=>new Promise(r=>{finish=r}));const p=load('src/store/profil.js',{'@/utils/serverApi.js':{serverRequest:request}});const state={userUid:'owner',accountGeneration:1,modeCo:'local'},commit=vi.fn();
  const pending=p.actions.savePersonalDetails({state,commit},{civilite:'Mme',tel:'0692000000',commune:'Village',credit:999,nom:'Unchanged'});expect(request.mock.calls[0][2].data).toEqual({civilite:'Mme',tel:'0692000000',commune:'Village'});expect(commit).not.toHaveBeenCalled();state.userUid='other';finish({data:{status:'ok',account:{user_id:'owner'}}});expect((await pending).stale).toBe(true);expect(commit).not.toHaveBeenCalled();
 });
 it('personal information reports failure rather than claiming success and unlocks retry',async()=>{
  const c=load('src/components/menus/setting/GroupInput.vue',{vuex:vx});const vm={saving:false,groupInputWritable:[{id:'tel',value:'0692000000'}],savePersonalDetails:vi.fn().mockResolvedValue({status:1,message:'Échec de sauvegarde'})};await c.methods.valid.call(vm);expect(vm.messageSnackbar).toBe('Échec de sauvegarde');expect(vm.saving).toBe(false);
 });
});
describe('edited view templates',()=>{
 it.each(['src/views/Results.vue','src/views/profil/Setting.vue','src/components/search/Pile.vue','src/components/menus/setting/GroupInput.vue','src/components/menus/bottom/bottom_menu/PreferenceChoice.vue','src/components/menus/bottom/ReservePlace.vue'])('compiles %s',file=>{const {descriptor}=parse(readFileSync(file,'utf8'));expect(compileTemplate({source:descriptor.template.content,filename:file,id:'fixes'}).errors).toEqual([]);});
});

describe('late profile replies and recovery',()=>{
 it('does not continue balance reconciliation after changing account',async()=>{
  let finish;const request=vi.fn(()=>new Promise(resolve=>{finish=resolve}));const p=load('src/store/profil.js',{'../store':{dispatch:async()=>true},'@/utils/serverApi.js':{serverRequest:request}});const state={userUid:'A',accountGeneration:1,soldes:0};const pending=p.actions.getSoldes({state});await vi.waitFor(()=>expect(finish).toBeTypeOf('function'));state.userUid='B';state.accountGeneration++;finish({data:{status:'ok',data:{}}});expect((await pending).stale).toBe(true);expect(request).toHaveBeenCalledOnce();expect(state.soldes).toBe(0);
 });
 it('does not reset the new account payout state after an old Connect request fails',async()=>{
  let reject;const p=load('src/store/profil.js',{'@/utils/serverApi.js':{serverRequest:()=>new Promise((_,r)=>{reject=r})}});const state={userUid:'A',accountGeneration:1,connect_account_available:true};const pending=p.actions.getProvider({state});state.userUid='B';state.accountGeneration++;reject(Error('offline'));expect((await pending).stale).toBe(true);expect(state.connect_account_available).toBe(true);
 });
 it('direct trip recovery commits only for the account that requested it',async()=>{
  let done;const module=load('src/store/trip.js',{'@/services/tripPresentation.js':{fetchAccessibleTrip:()=>new Promise(r=>{done=r})}});const rootState={profil:{userUid:'A',userId:1,accountGeneration:1},search:{villages:[]}},commit=vi.fn();const pending=module.actions.loadSelectedTrip({rootState,commit,dispatch:async()=>true},1);await vi.waitFor(()=>expect(done).toBeTypeOf('function'));rootState.profil.userUid='B';done(base);expect((await pending).stale).toBe(true);expect(commit).not.toHaveBeenCalled();
 });
 it('automatic validation unlocks after a failed save and restores its previous display',async()=>{
  const c=load('src/components/menus/setting/CardButton.vue',{vuex:vx});const vm={saving:false,validation:true,auto_accept_trip:false,updateAutoValidation:vi.fn().mockResolvedValue({status:1,message:'Échec'})};await c.methods.updateValidation.call(vm);expect(vm.validation).toBe(false);expect(vm.saving).toBe(false);expect(vm.showSnackbarError).toBe(true);
 });
});


it('refund menu has an actual destination without initiating a financial operation',()=>{
 const source=readFileSync('src/views/profil/Setting.vue','utf8');
 expect(source).toContain("fun: () => this.goToInfo('refunds')");
 expect(source).toContain("$router.push('/profil/open-trip-passenger')");
});


it('reservation details tolerate an unknown legacy vehicle model',()=>{
 const c=load('src/components/menus/bottom/ReservePlace.vue',{vuex:vx,'@capacitor/core':{Capacitor:{getPlatform:()=> 'web'}}});
 const vm={car:{},trajetSelected:{car:{brand:'UNKNOWN',model:'legacy-model',license_plate:'AA-123-AA'}},infosModelVehicul:[{model:'Moto',icon:'mdi-motorbike'}]};
 expect(()=>c.methods.updateCar.call(vm)).not.toThrow();expect(vm.car.icon).toBe('mdi-car');
});
