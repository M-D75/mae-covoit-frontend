import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {describe,it,expect,vi} from 'vitest';
import * as tripHelpers from '@/services/tripPresentation.js';
const actualRoot='.';
import * as seatHelpers from '@/services/bookingSeats.js';
function load(file,deps={}){let source=readFileSync(actualRoot+'/'+file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>deps[id]||(id.endsWith('tripPresentation.js')?tripHelpers:id.endsWith('bookingSeats.js')?seatHelpers:{Capacitor:{getPlatform:()=> 'web'},mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),defineComponent:x=>x}));return m.exports.default;}
const clone=value=>JSON.parse(JSON.stringify(value));
const trip={id:7,price:4,canReserve:true,departure_time:'2099-11-05T15:00:00Z',max_seats:4,passenger_number:0,depart:'A',destination:'B',route:{infosGoogle:{duration:'3600s'},polylineDecoded:[[0,0],[0,1]]}};
const result={data:{status:'ok',data:{tripId:7,credit:99,accepted:true,bookingIds:[10],payment:{mode:'wallet',amount:4}}}};
function bookingHarness(request){
 const store={state:{profil:{userUid:'A',accountGeneration:1,modeCo:'online',soldes:0,pendingDebit:0,history:{datesTripPassenger:[]}},trip:{}},dispatch:vi.fn().mockResolvedValue(true)};
 const module=load('src/store/search.js',{'../store':store,'@/utils/serverApi.js':{serverRequest:request}});const state={...clone(module.state),trajetSelected:trip};store.state.search=state;return {module,state,store};
}
describe('booking display and asynchronous identity',()=>{
 it('a direct URL synchronizes the displayed count, total and booked seats',async()=>{
  const request=vi.fn().mockResolvedValue(result),h=bookingHarness(request),view=load('src/views/Results.vue');
  const vm={...view.data(),nbPassenger:'2',$route:{path:'/results/A/B/05-11-2099/2'},$store:h.store,getDate:()=>new Date('2099-11-05T00:00:00Z'),getTrajetsDate:vi.fn().mockResolvedValue({status:0}),trajetFiltered:[trip],visibleTrips:[trip],SET_TRAJET_SELECTED:()=>{h.state.trajetSelected={}},SET_NB_PASSAGER:n=>h.module.mutations.SET_NB_PASSAGER(h.state,n)};
  await view.methods.reloadResults.call(vm);expect(vm.nbPassenger).toBe('2');expect(h.state.nbPassenger).toBe(2);h.state.trajetSelected=trip;
  const reserve=load('src/components/menus/bottom/ReservePlace.vue');expect(reserve.computed.totalPrice.call({$store:h.store,trajetSelected:trip})).toBe(8);
  await h.module.actions.reserveTrajet({state:h.state},{requestId:'00000000-0000-4000-8000-000000000001'});
  expect(request.mock.calls[0][2].data.seats).toBe(2);
 });
 it('a late booking response cannot change the next account',async()=>{
  let finish;const request=vi.fn(()=>new Promise(resolve=>{finish=resolve})),h=bookingHarness(request);
  const pending=h.module.actions.reserveTrajet({state:h.state},{requestId:'00000000-0000-4000-8000-000000000002'});
  await vi.waitFor(()=>expect(request).toHaveBeenCalledTimes(1));
  Object.assign(h.store.state.profil,{userUid:'B',accountGeneration:2,soldes:17,pendingDebit:0,history:{datesTripPassenger:[]}});h.state.trajetSelected={};
  finish(result);expect((await pending).stale).toBe(true);expect(h.store.state.profil.soldes).toBe(17);expect(h.store.state.profil.history.datesTripPassenger).toEqual([]);
 });
 it('pending requests reserve capacity consistently with the SQL',()=>{
  const row=tripHelpers.normalizeTrip({...trip,max_seats:1,booking:[{is_accepted:false,is_refused:false,passenger_no_show:false,payment_status:'wallet_reserved'}]});
  expect(row.passenger_number).toBe(0);expect(row.reserved_seats).toBe(1);
  const c=load('src/components/menus/bottom/ReservePlace.vue');expect(c.computed.reservationAvailable.call({trajetSelected:row,$store:{state:{search:{nbPassenger:1}}}})).toBe(false);
  const sql=readFileSync(actualRoot+'/supabase/migrations/009_atomic_booking_operations.sql','utf8');const count=sql.slice(sql.indexOf('select count(*)::integer into active_seats'),sql.indexOf('if active_seats + target_seats'));
  expect(count).not.toContain('is_accepted');expect(count).toContain('coalesce(is_refused, false) = false');
 });
});
it('switching from a shared route restores normal route filtering',async()=>{
 const c=load('src/views/Results.vue');const vm={...c.data(),mode:'shared-ids',seatsRequested:1,SET_TRAJET_SELECTED:vi.fn(),SET_NB_PASSAGER:vi.fn(),depart:'A',destination:'B',nbPassenger:'1',trajets:[trip,{...trip,id:8,depart:'X',destination:'Y'}],trajetFiltered:[trip],$route:{path:'/results/A/B/05-11-2099/1'},$store:{state:{search:{nbPassenger:1}}},getDate:()=>new Date('2099-11-05T00:00:00Z'),getTrajetsDate:vi.fn().mockResolvedValue({status:0})};
 Object.defineProperty(vm,'visibleTrips',{get:()=>c.computed.visibleTrips.call(vm)});
 await c.methods.reloadResults.call(vm);expect(vm.mode).toBe('date-dep-dest');expect(c.computed.visibleTrips.call(vm).map(t=>t.id)).toEqual([7]);
});
it('stale rating responses cannot change the current member or account',async()=>{
 let finish;const module=load('src/store/rating.js',{'@/utils/serverApi.js':{serverRequest:()=>new Promise(resolve=>{finish=resolve})}}),state=clone(module.state);
 const rootState={profil:{userUid:'A',accountGeneration:1,modeCo:'online'},trip:{member:{userId:7,notation:{avis:0,satisfaction:0}}}};
 const pending=module.actions.getRating({state,rootState},{userId:7});
 rootState.profil.userUid='B';rootState.profil.accountGeneration=2;rootState.trip.member={userId:8,notation:{avis:5,satisfaction:100}};
 finish({data:{status:'ok',data:{averageScore:1,satisfaction:20,rating:{good:[1],bad:[0]}}}});expect((await pending).stale).toBe(true);expect(rootState.trip.member.userId).toBe(8);expect(rootState.trip.member.notation.avis).toBe(5);
});

it('does not send a reservation if identity changes during session validation',async()=>{
 let finish;const request=vi.fn(),h=bookingHarness(request);h.store.dispatch=()=>new Promise(r=>{finish=r});
 const pending=h.module.actions.reserveTrajet({state:h.state},{requestId:'fixture'});h.store.state.profil.userUid='B';h.store.state.profil.accountGeneration++;finish(true);
 expect((await pending).stale).toBe(true);expect(request).not.toHaveBeenCalled();
});
it('does not send an old component operation as the next account',async()=>{
 const request=vi.fn(),h=bookingHarness(request);expect((await h.module.actions.reserveTrajet({state:h.state},{requestId:'fixture',expectedOwner:'other'})).stale).toBe(true);expect(request).not.toHaveBeenCalled();
});
it.each(['0','9','bad','1.5'])('rejects invalid route seat counts %s before searching',async seats=>{
 const c=load('src/views/Results.vue'),search=vi.fn();const vm={...c.data(),nbPassenger:seats,$route:{path:'/results/A/B/date/'+seats},SET_TRAJET_SELECTED:vi.fn(),SET_NB_PASSAGER:vi.fn(),getTrajetsDate:search};
 await c.methods.reloadResults.call(vm);expect(vm.routeError).toBeTruthy();expect(vm.SET_NB_PASSAGER).toHaveBeenCalledWith(0);expect(search).not.toHaveBeenCalled();
});
it('looks up shared accounts only in the public profile projection',()=>{
 const source=readFileSync('src/store/search.js','utf8');expect(source).toContain("from('public_profile')");expect(source).toContain('account:public_profile');
 for(const file of ['src/services/travels.js','src/services/profileHistory.js','src/services/ratingPreferences.js','src/services/tripPresentation.js'])expect(readFileSync(file,'utf8')).toContain('account:public_profile');
});
it('binds the results count to an existing Vuex mutation',()=>{
 const view=readFileSync('src/views/Results.vue','utf8'),h=bookingHarness(vi.fn());expect(view).toContain('this.SET_NB_PASSAGER(seats??0)');expect(h.module.mutations.SET_NB_PASSAGER).toBeTypeOf('function');h.module.mutations.SET_NB_PASSAGER(h.state,2);expect(h.state.nbPassenger).toBe(2);
});
it('stops an old reservation form before dispatch after a session switch',async()=>{
 const view=load('src/components/menus/bottom/ReservePlace.vue');let finish;const dispatch=vi.fn();
 const vm={...view.data(),reservationAvailable:true,userUid:'A',trajetSelected:trip,$store:{state:{profil:{accountGeneration:1},search:{nbPassenger:2}},dispatch},getSoldes:()=>new Promise(r=>{finish=r})};
 const pending=view.methods.tryReserve.call(vm);vm.userUid='B';vm.$store.state.profil.accountGeneration=2;finish({status:0});await pending;expect(dispatch).not.toHaveBeenCalled();expect(vm.overlayLoad).toBe(false);
});
it('does not start bank authentication from a stale form',async()=>{
 const view=load('src/components/menus/bottom/ReservePlace.vue');expect(await view.methods.completePaymentAuthentication.call({}, {clientSecret:'fixture',paymentIntentId:'fixture'},{current:()=>false})).toEqual({valided:false,stale:true});
});
it('keeps contact booking metadata available through the public profile projection',async()=>{
 const module=load('src/store/trip.js',{'@/utils/supabaseClient.js':{from:table=>{expect(table).toBe('public_profile');return {select(){return this},in:async()=>({data:[{id:2,user_id:'passenger',username:'Public member'}]})}}}});
 const state=clone(module.state);state.tripSelected={...trip,bookings:[{id:1,trip_id:7,passenger_account_id:2,is_accepted:true,is_refused:false}]};const rootState={profil:{userUid:'driver',accountGeneration:1}};
 const commit=(name,payload)=>module.mutations[name](state,payload);await module.actions.getContacts({state,rootState,commit});
 expect(state.chat.contacts[0].booking[0].trip.max_seats).toBe(4);expect(state.chat.contacts[0].username).toBe('Public member');
 const c=load('src/components/profile/Contacts.vue');expect(()=>c.computed.itemsContacts.call({chat:state.chat,tripSelected:state.tripSelected})).not.toThrow();
});
it('uses a fresh reservation operation when the passenger count changes',async()=>{
 const view=load('src/components/menus/bottom/ReservePlace.vue');const vm={...view.data(),reservationAvailable:true,userUid:'A',trajetSelected:trip,$store:{state:{profil:{accountGeneration:1},search:{nbPassenger:1}}},getSoldes:vi.fn().mockResolvedValue({status:1,message:'offline'})};
 await view.methods.tryReserve.call(vm);const first=vm.reservationRequestId;expect(first).toBeTruthy();vm.$store.state.search.nbPassenger=2;await view.methods.tryReserve.call(vm);expect(vm.reservationRequestId).not.toBe(first);expect(vm.reservationSeats).toBe(2);
});
