import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {describe,it,expect,vi} from 'vitest';
import * as authProfile from '@/services/authProfile.js';
const actualRoot='.';
import * as preferences from '@/services/travelPreferences.js';
import * as seats from '@/services/bookingSeats.js';
function load(file,deps={}){let source=readFileSync(actualRoot+'/'+file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>deps[id]||(id.endsWith('travelPreferences.js')?preferences:id.endsWith('bookingSeats.js')?seats:{mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),defineComponent:x=>x}));return m.exports.default;}
function query(result){return {select(){return this;},eq(){return this;},maybeSingle(){return Promise.resolve(result);},then(resolve){return Promise.resolve(result).then(resolve);}};}
function guardHarness({profileError=null,permissionError=null}={}){
 let guard;const router={beforeEach:fn=>{guard=fn;}};
 const supabase={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from:()=>query({data:profileError?null:{id:1,user_id:'owner'},error:profileError})};
 const store={state:{profil:{userUid:'owner',userId:1},trip:{}},commit:vi.fn(),dispatch:vi.fn()};
 load('src/router/index.js',{
  'vue-router':{createRouter:()=>router,createWebHistory:()=>null},'@capacitor/core':{Capacitor:{getPlatform:()=> 'android'}},
  '@/services/authProfile.js':authProfile,'@/utils/supabaseClient.js':supabase,'../store':store,
  '@/services/authEntry.js':{rememberAuthEntry:()=>{},getDefaultAuthPath:()=>'/login'},
  '@/services/tripNotifications.js':{installTripNotifications:vi.fn().mockResolvedValue()},
  '@capacitor-firebase/messaging':{FirebaseMessaging:{requestPermissions:async()=>{if(permissionError)throw permissionError;return {receive:'denied'};}}},
 });
 return {guard,store};
}
describe('observed routing regressions',()=>{
 it('keeps identity and offers retry after a transient profile read error',async()=>{
  const {guard,store}=guardHarness({profileError:{code:'503',message:'temporary outage'}});const next=vi.fn();
  await guard({path:'/profil',fullPath:'/profil',meta:{requiresAuth:true},query:{}},{},next);
  expect(next).toHaveBeenCalledWith(false);expect(store.state.profil.userId).toBe(1);expect(store.commit).toHaveBeenCalledWith('auth/SET_PROFILE_LOOKUP_ERROR',{path:'/profil'});
 });
 it('opens search when the notification plugin fails',async()=>{
  const {guard}=guardHarness({permissionError:new Error('native notification plugin unavailable')});const next=vi.fn();
  await guard({path:'/search',fullPath:'/search',meta:{requiresAuth:true},query:{}},{},next);expect(next).toHaveBeenCalledWith();
 });
 it('baseline: denying notification permission normally does not block search',async()=>{
  const {guard}=guardHarness();const next=vi.fn();await guard({path:'/search',fullPath:'/search',meta:{requiresAuth:true},query:{}},{},next);expect(next).toHaveBeenCalledWith();
 });
});
function memberHarness(settings){
 const profile={id:10,user_id:'driver',firstname:'Driver',lastname:'Fixture',settings};
 const module=load('src/store/trip.js',{'@/utils/supabaseClient.js':{from:table=>query(table==='public_profile'?{data:[profile]}:{count:1})}});
 const state=JSON.parse(JSON.stringify(module.state));return {module,state,ctx:{state,dispatch:async()=>({status:0}),rootState:{profil:{modeCo:'local'}}}};
}
describe('driver profile compatibility',()=>{
 it('baseline: a legacy array settings relation opens the member profile',async()=>{
  const h=memberHarness([{prefer:[1,2,1,1]}]);expect(await h.module.actions.getProfilMember(h.ctx,{userUid:'driver'})).toBe(true);expect(h.state.member.preferences).toHaveLength(4);
 });
 it('opens a profile with object settings',async()=>{
  const h=memberHarness({prefer:[1,2,1,1]});expect(await h.module.actions.getProfilMember(h.ctx,{userUid:'driver'})).toBe(true);expect(h.state.member.preferences).toHaveLength(4);
 });
 it('uses defaults for null legacy preferences',async()=>{
  const h=memberHarness([{prefer:null}]);expect(await h.module.actions.getProfilMember(h.ctx,{userUid:'driver'})).toBe(true);expect(h.state.member.preferences).toHaveLength(4);
 });
});
it('excludes trips without enough seats',()=>{
 const c=load('src/views/Results.vue');const getDate=()=>new Date('2026-11-05T00:00:00Z');
 const full={id:7,depart:'A',destination:'B',departure_time:'2026-11-05T15:00:00Z',max_seats:1,passenger_number:1};
 const vm={trajets:[full],depart:'A',destination:'B',nbPassenger:2,seatsRequested:2,defaulttrier:0,getDate,isSameDay:()=>true};expect(c.computed.trajetFiltered.call(vm)).toEqual([]);
});
it('wires the trip share button to an action',()=>{
 const {descriptor}=parse(readFileSync(actualRoot+'/src/components/menus/bottom/ReservePlace.vue','utf8'));
 expect(descriptor.template.content).toContain('@click="shareSelectedTrip"');
});
