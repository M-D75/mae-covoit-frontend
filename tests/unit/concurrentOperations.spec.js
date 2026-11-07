import * as publicationRoute from '@/services/publicationRoute.js';
import * as recurringWeeks from '@/services/recurringWeeks.js';
import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {describe,it,expect,vi} from 'vitest';
import {paymentSession} from '@/services/paymentSession.js';
import * as preferences from '@/services/travelPreferences.js';
const root='.';
function load(file,deps={},sdk){let source=readFileSync(root+'/'+file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;
 // Supply a fake Stripe SDK to the component's existing module singleton.
 if(sdk)source=source.replace('let stripePromise;','let stripePromise=Promise.resolve(require("__stripeFixture"));');
 const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>id.endsWith('publicationRoute.js')?publicationRoute:id==='__stripeFixture'?sdk:id.endsWith('paymentSession.js')?{paymentSession}:deps[id]||(id.endsWith('recurringWeeks.js')?recurringWeeks:id.endsWith('travelPreferences.js')?preferences:{Capacitor:{getPlatform:()=> 'web'},mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),mapGetters:()=>({}),defineComponent:x=>x}));return m.exports.default;
}
const clone=x=>JSON.parse(JSON.stringify(x));
function query(result){return {select(){return this},eq(){return this},then(resolve){return Promise.resolve(result).then(resolve)}};}

const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
it('abandons recharge before payment creation after an account switch',async()=>{
 const lookup=deferred(),profile={userUid:'A',accountGeneration:1,modeCo:'online'},sent=[];
 const api={serverRequest:vi.fn(async(method,path,options)=>{
  if(path==='/payments/customer')return lookup.promise;
  sent.push({method,path,options,user:profile.userUid});return {data:{id:'pi_fixture_B',status:'requires_action'}};
 })};
 const store={state:{profil:profile},dispatch:async()=>true};
 const p=load('src/store/profil.js',{'@/utils/serverApi.js':api,'../store':store});
 const c=load('src/components/menus/BottomMenu.vue',{'@/utils/serverApi.js':api,'@/utils/requestId.js':{createRequestId:()=> '00000000-0000-4000-8000-000000000001'}});
 const vm={$store:store,$refs:{SelectNumberRef:{number:20}},topupAttemptId:'00000000-0000-4000-8000-000000000001',modeDriver:false,modeCo:'online',moneyEpoch:0,addCredit:vi.fn(args=>p.actions.addCredit({state:profile},args)),$emit:vi.fn()};
 const pending=c.methods.recharger.call(vm);profile.userUid='B';profile.accountGeneration++;
 lookup.resolve({data:{metadata:{source_selected:'card_A'},default_source:'card_A',invoice_settings:{}}});await pending;
 expect(sent).toEqual([]);expect(vm.$emit).not.toHaveBeenCalled();expect(vm.addCredit).not.toHaveBeenCalled();
});
it('ignores a late wallet conversion after an account switch',async()=>{
 const reply=deferred(),api={serverRequest:()=>reply.promise},m=load('src/store/profil.js',{'@/utils/serverApi.js':api}),state=clone(m.state);Object.assign(state,{userUid:'A',accountGeneration:1,soldes:10});state.gain.wallet=50;
 const pending=m.actions.transfertGain({state},{credit:20,requestId:'fixture'});m.mutations.SET_USER_UID(state,'B');state.soldes=4;state.gain.wallet=8;
 reply.resolve({data:{status:'ok',data:{credit:30,gain:30}}});await pending;
 expect(state.userUid).toBe('B');expect(state.soldes).toBe(4);expect(state.gain.wallet).toBe(8);
});
it('baseline: wallet conversion updates the initial account normally',async()=>{
 const m=load('src/store/profil.js',{'@/utils/serverApi.js':{serverRequest:async()=>({data:{status:'ok',data:{credit:30,gain:30}}})}}),state=clone(m.state);state.userUid='A';
 expect((await m.actions.transfertGain({state},{credit:20,requestId:'fixture'})).status).toBe(0);expect(state.soldes).toBe(30);
});
it('ignores trip A bookings after selection of trip B',async()=>{
 const reply=deferred(),q={select(){return this},eq(){return this},single(){return reply.promise}};
 const c=load('src/components/trip/MapTrip.vue',{'@/utils/supabaseClient.js':{from:()=>q}});
 const vm={passengerRequest:0,tripOperationEpoch:0,$store:{state:{profil:{userUid:'A',accountGeneration:1}}},mode_driver:false,tripSelected:{id:1,bookings:[]},SET_TRIP_SELECTED:vi.fn(),handleServerError:vi.fn()};
 const pending=c.methods.ensurePassengerBookings.call(vm);vm.tripSelected={id:2,bookings:[]};
 reply.resolve({data:{id:1,booking:[{id:11,trip_id:1,is_accepted:true}]},error:null});await pending;
 expect(vm.SET_TRIP_SELECTED).not.toHaveBeenCalled();expect(vm.handleServerError).not.toHaveBeenCalled();
});
it('baseline: a passenger lookup stays coherent when the selected trip does not change',async()=>{
 const q={select(){return this},eq(){return this},single:async()=>({data:{id:1,booking:[{id:11,trip_id:1,is_accepted:true}]},error:null})};
 const c=load('src/components/trip/MapTrip.vue',{'@/utils/supabaseClient.js':{from:()=>q}}),vm={passengerRequest:0,tripOperationEpoch:0,$store:{state:{profil:{userUid:'A',accountGeneration:1}}},mode_driver:false,tripSelected:{id:1,bookings:[]},SET_TRIP_SELECTED:vi.fn(),handleServerError:vi.fn()};
 await c.methods.ensurePassengerBookings.call(vm);const saved=vm.SET_TRIP_SELECTED.mock.calls[0][0];expect(saved.id).toBe(saved.bookings[0].trip_id);
});
it('updates only the canceled trip history without closing the new trip',async()=>{
 const reply=deferred(),request=vi.fn(()=>reply.promise),c=load('src/components/trip/MapTrip.vue',{'@/utils/serverApi.js':{serverRequest:request}});
 const vm={tripSelected:{id:1,departure_time:'2027-01-01T10:00:00Z'},modeCo:'online',$store:{state:{profil:{userUid:'A',accountGeneration:1}},dispatch:vi.fn().mockResolvedValue({status:0}),commit:vi.fn()},showSuccess:vi.fn(),handleServerError:vi.fn(),$router:{replace:vi.fn()}};
 const pending=c.methods.annulerTrajet.call(vm);vm.tripSelected={id:2,departure_time:'2027-02-02T10:00:00Z'};
 reply.resolve({data:{status:'ok',data:{trip:{id:1,departure_time:'2027-01-01T10:00:00Z'}}}});await pending;
 expect(request.mock.calls[0][1]).toBe('/bookings/trip/1');expect(vm.$store.commit).toHaveBeenCalledWith('profil/REMOVE_HISTORY_DATE_BY_VALUE',{type:'passenger',departure_time:'2027-01-01T10:00:00Z'});expect(vm.$router.replace).not.toHaveBeenCalled();expect(vm.showSuccess).not.toHaveBeenCalled();
});
it('does not write recurring dates to the next account history',async()=>{
 const reply=deferred(),store={dispatch:async()=>true,state:{profil:{userUid:'A',accountGeneration:1,history:{datesTripDriver:[]}}}};
 const c=load('src/store/publish.js',{'@/store':store,'@/utils/supabaseClient.js':{from:()=>({insert:()=>({select:()=>reply.promise})})},'@/utils/utils.js':{getFirstDayOfWeek:()=>new Date(2027,0,4),getDayOfWeek:()=> 'lundi'}});
 const input={driverId:'A',weeksSelected:[{week:'S1',selected:true}],daysHour:Array.from({length:7},()=>({values:{home:true,work:false},hour:{home:'12:00'}})),route:{infosGoogle:{duration:'900s'},polylineDecoded:[[0,0],[0,1]]},car_id:82};
 const pending=c.actions.newTripMultple({state:{}},input);await vi.waitFor(()=>expect(store.state.profil.userUid).toBe('A'));await Promise.resolve();store.state.profil.userUid='B';store.state.profil.accountGeneration++;
 reply.resolve({data:[{id:1}],error:null});expect(await pending).toMatchObject({status:2,stale:true});expect(store.state.profil.userUid).toBe('B');expect(store.state.profil.history.datesTripDriver).toEqual([]);
});
it('keeps the latest opened trip when an older response arrives',async()=>{
 const replies={1:deferred(),2:deferred()};
 const c=load('src/store/trip.js',{'@/services/tripPresentation.js':{fetchAccessibleTrip:(_,{tripId})=>replies[tripId].promise}});
 const state=clone(c.state),ctx={rootState:{profil:{userUid:'A',accountGeneration:1,userId:1},search:{villages:[]}},commit:vi.fn((type,payload)=>{if(type==='SET_TRIP_SELECTED')state.tripSelected=payload;}),dispatch:async()=>true};
 const first=c.actions.loadSelectedTrip(ctx,1),second=c.actions.loadSelectedTrip(ctx,2);await Promise.resolve();
 replies[2].resolve({id:2,bookings:[]});await second;expect(state.tripSelected.id).toBe(2);
 replies[1].resolve({id:1,bookings:[]});expect(await first).toMatchObject({status:2,stale:true});expect(state.tripSelected.id).toBe(2);
});

function moneyMenu(request){
 const profile={userUid:'A',accountGeneration:1,modeCo:'online'};
 const c=load('src/components/menus/BottomMenu.vue',{'@/utils/serverApi.js':{serverRequest:request},'@/utils/requestId.js':{createRequestId:()=> '00000000-0000-4000-8000-000000000001'}});
 const vm={$store:{state:{profil:profile}},$refs:{SelectNumberRef:{number:20}},moneyEpoch:0,loadingBtn:false,modeCo:'online',modeDriver:false,open_b:true,addCredit:vi.fn().mockResolvedValue({status:0,message:'ok'}),transfertGain:vi.fn().mockResolvedValue({status:0,message:'ok'}),close:vi.fn(),$emit:vi.fn()};
 return {c,vm,profile};
}
it('uses the initial account and amount for a normal saved-card recharge',async()=>{
 const request=vi.fn(async()=>({data:{metadata:{source_selected:'pm_A'},invoice_settings:{default_payment_method:'pm_A'}}}));const {c,vm}=moneyMenu(request);
 await c.methods.recharger.call(vm);expect(request.mock.calls[0][2].expectedUserId).toBe('A');expect(vm.addCredit).toHaveBeenCalledWith(expect.objectContaining({credit:20,expectedUserId:'A',accountGeneration:1}));expect(vm.close).toHaveBeenCalledOnce();expect(vm.loadingBtn).toBe(false);
});
it('prepares a new-card recharge with the captured amount and owner',async()=>{
 const lookup=deferred(),request=vi.fn(async(_,path)=>path==='/payments/customer'?lookup.promise:{data:{id:'pi_A'}}),{c,vm}=moneyMenu(request);
 const pending=c.methods.recharger.call(vm);vm.$refs.SelectNumberRef.number=80;lookup.resolve({data:{metadata:{}}});await pending;
 expect(request.mock.calls[1][2]).toMatchObject({expectedUserId:'A',data:{amount:2000,confirmWithSavedMethod:false}});expect(vm.paymentIntentId).toBe('pi_A');expect(vm.$emit).toHaveBeenCalledWith('payment-intent-recharge');
});
for(const change of ['closed','unmounted','generation','reset'])it(`does not continue recharge after ${change}`,async()=>{
 const lookup=deferred(),request=vi.fn(()=>lookup.promise),{c,vm,profile}=moneyMenu(request);const pending=c.methods.recharger.call(vm);
 if(change==='closed')vm.open_b=false;
 if(change==='unmounted')c.beforeUnmount.call(vm);
 if(change==='generation')profile.accountGeneration++;
 if(change==='reset')c.methods.resetMoneyAttempt.call(vm);
 lookup.resolve({data:{metadata:{}}});await pending;expect(request).toHaveBeenCalledTimes(1);expect(vm.addCredit).not.toHaveBeenCalled();expect(vm.$emit).not.toHaveBeenCalled();
});
it('ignores a repeated recharge click while the customer lookup is pending',async()=>{
 const lookup=deferred(),request=vi.fn(()=>lookup.promise),{c,vm}=moneyMenu(request);const pending=c.methods.recharger.call(vm);await c.methods.recharger.call(vm);expect(request).toHaveBeenCalledTimes(1);lookup.resolve({data:{metadata:{source_selected:'card_A'},default_source:'card_A'}});await pending;expect(vm.addCredit).toHaveBeenCalledTimes(1);
});
it('keeps the same recharge attempt identifier for a retriable failure',async()=>{
 const request=vi.fn(async()=>({data:{metadata:{source_selected:'card_A'},default_source:'card_A'}})),{c,vm}=moneyMenu(request);vm.addCredit.mockResolvedValue({status:2,retriable:true,message:'retry'});
 await c.methods.recharger.call(vm);const id=vm.topupAttemptId;await c.methods.recharger.call(vm);expect(vm.addCredit.mock.calls[1][0].attemptId).toBe(id);expect(vm.loadingBtn).toBe(false);
});
it('does not charge after the session check switches account',async()=>{
 const check=deferred(),request=vi.fn(),store={dispatch:()=>check.promise};
 const c=load('src/store/profil.js',{'../store':store,'@/utils/serverApi.js':{serverRequest:request}}),state=clone(c.state);Object.assign(state,{userUid:'A',accountGeneration:1});
 const pending=c.actions.addCredit({state},{credit:20,attemptId:'fixture'});state.userUid='B';state.accountGeneration++;check.resolve(true);expect(await pending).toMatchObject({stale:true});expect(request).not.toHaveBeenCalled();
});
it('rejects a money action bound to a former account before sending',async()=>{
 const request=vi.fn(),c=load('src/store/profil.js',{'@/utils/serverApi.js':{serverRequest:request}}),state=clone(c.state);Object.assign(state,{userUid:'B',accountGeneration:2});
 expect(await c.actions.addCredit({state},{credit:20,attemptId:'fixture',expectedUserId:'A',accountGeneration:1})).toMatchObject({stale:true});
 expect(await c.actions.transfertGain({state},{credit:20,expectedUserId:'A',accountGeneration:1})).toMatchObject({stale:true});expect(request).not.toHaveBeenCalled();
});
for(const status of ['succeeded','requires_action','processing'])it(`keeps normal ${status} top-up behavior bound to the original account`,async()=>{
 const request=vi.fn(async()=>({data:{id:'pi_A',status}})),query={select(){return this},eq:vi.fn().mockReturnThis(),single:async()=>({data:{credit:40},error:null})};
 const c=load('src/store/profil.js',{'../store':{dispatch:async()=>true},'@/utils/serverApi.js':{serverRequest:request},'@/utils/supabaseClient.js':{from:()=>query}}),state=clone(c.state);Object.assign(state,{userUid:'A',accountGeneration:1});
 const result=await c.actions.addCredit({state},{credit:20,attemptId:'fixture'});expect(request.mock.calls[0][2]).toMatchObject({expectedUserId:'A',data:{amount:2000,confirmWithSavedMethod:true}});
 expect(result.status).toBe({succeeded:0,requires_action:3,processing:1}[status]);if(status==='succeeded'){expect(state.soldes).toBe(40);expect(query.eq).toHaveBeenCalledWith('user_id','A');}
});
it('does not update the new account after a successful top-up response from A',async()=>{
 const reply=deferred(),from=vi.fn(),request=()=>reply.promise,c=load('src/store/profil.js',{'../store':{dispatch:async()=>true},'@/utils/serverApi.js':{serverRequest:request},'@/utils/supabaseClient.js':{from}}),state=clone(c.state);Object.assign(state,{userUid:'A',accountGeneration:1,soldes:3});
 const pending=c.actions.addCredit({state},{credit:20,attemptId:'fixture'});await Promise.resolve();state.userUid='B';state.accountGeneration++;reply.resolve({data:{id:'pi_A',status:'succeeded'}});expect(await pending).toMatchObject({stale:true});expect(state.soldes).toBe(3);expect(from).not.toHaveBeenCalled();
});
function mapHarness(api={}){
 const c=load('src/components/trip/MapTrip.vue',{'@/utils/serverApi.js':api}),profile={userUid:'A',accountGeneration:1};
 const vm={tripOperationEpoch:0,passengerRequest:0,tripSelected:{id:1,departure_time:'2027-01-01T10:00:00Z',bookings:[]},modeCo:'online',$store:{state:{profil:profile},dispatch:vi.fn().mockResolvedValue({status:0}),commit:vi.fn()},showSuccess:vi.fn(),handleServerError:vi.fn(),$router:{replace:vi.fn()},SET_TRIP_SELECTED:vi.fn()};return {c,vm,profile};
}
for(const alreadyCanceled of [false,true])it(`handles confirmed cancellation including replay=${alreadyCanceled}`,async()=>{
 const request=vi.fn(async()=>({data:{status:'ok',data:{tripId:1,alreadyCanceled,...(!alreadyCanceled?{trip:{id:1,departure_time:'2027-01-01T10:00:00Z'}}:{})}}})),{c,vm}=mapHarness({serverRequest:request});
 await c.methods.annulerTrajet.call(vm);expect(request.mock.calls[0][2].expectedUserId).toBe('A');expect(vm.$store.commit).toHaveBeenCalledWith('profil/REMOVE_HISTORY_DATE_BY_VALUE',{type:'passenger',departure_time:'2027-01-01T10:00:00Z'});expect(vm.$router.replace).toHaveBeenCalledWith('/profil');expect(vm.cancelBookingBusy).toBe(false);
});
it('discards cancellation feedback after unmount and blocks duplicate requests',async()=>{
 const reply=deferred(),request=vi.fn(()=>reply.promise),{c,vm}=mapHarness({serverRequest:request});const pending=c.methods.annulerTrajet.call(vm);await c.methods.annulerTrajet.call(vm);vm.tripOperationsDisposed=true;reply.resolve({data:{status:'ok',data:{tripId:1}}});await pending;expect(request).toHaveBeenCalledOnce();expect(vm.$store.commit).toHaveBeenCalledWith('profil/REMOVE_HISTORY_DATE_BY_VALUE',{type:'passenger',departure_time:'2027-01-01T10:00:00Z'});expect(vm.$router.replace).not.toHaveBeenCalled();
});
it('ignores a previous live state after account generation changes',async()=>{
 const reply=deferred(),{c,vm,profile}=mapHarness({serverRequest:()=>reply.promise});const pending=c.methods.refreshLiveTripState.call(vm);profile.accountGeneration++;reply.resolve({data:{data:{tripId:1,bookings:[]}}});await pending;expect(vm.liveTripState).toBeUndefined();
});
it('ignores no-show confirmation after switching trips',async()=>{
 const reply=deferred(),{c,vm}=mapHarness({serverRequest:()=>reply.promise});vm.mode_driver=true;vi.spyOn(window,'confirm').mockReturnValueOnce(true);
 const pending=c.methods.markPassengerNoShow.call(vm,{id:11,in_car:false,passenger_no_show:false});vm.tripSelected={id:2,bookings:[{id:22}]};reply.resolve({data:{data:{bookingIds:[11]}}});await pending;expect(vm.SET_TRIP_SELECTED).not.toHaveBeenCalled();expect(vm.showSuccess).not.toHaveBeenCalled();vi.restoreAllMocks();
});
it('does not clear the latest selected trip after an older opening fails',async()=>{
 let reject;const old=new Promise((_,r)=>reject=r);const c=load('src/store/trip.js',{'@/services/tripPresentation.js':{fetchAccessibleTrip:(_,{tripId})=>tripId===1?old:Promise.resolve({id:2})}}),state=clone(c.state),ctx={rootState:{profil:{userUid:'A',accountGeneration:1,userId:1},search:{villages:[]}},dispatch:async()=>true,commit:vi.fn((t,p)=>c.mutations[t](state,p))};
 const first=c.actions.loadSelectedTrip(ctx,1);await Promise.resolve();await c.actions.loadSelectedTrip(ctx,2);reject(new Error('old failed'));expect(await first).toMatchObject({stale:true});expect(state.tripSelected.id).toBe(2);
});
it('does not replace a manual trip selection with a pending opening',async()=>{
 const reply=deferred(),c=load('src/store/trip.js',{'@/services/tripPresentation.js':{fetchAccessibleTrip:()=>reply.promise}}),state=clone(c.state),ctx={rootState:{profil:{userUid:'A',accountGeneration:1,userId:1},search:{villages:[]}},dispatch:async()=>true,commit:vi.fn((t,p)=>c.mutations[t](state,p))};
 const pending=c.actions.loadSelectedTrip(ctx,1);await Promise.resolve();c.mutations.SET_TRIP_SELECTED(state,{id:2});reply.resolve({id:1});expect(await pending).toMatchObject({stale:true});expect(state.tripSelected.id).toBe(2);
});

function publicationView(dispatch,recurring=false){
 const profile={userUid:'A',accountGeneration:1},c=load('src/views/Publish.vue',{jquery:()=>({css:vi.fn()}),'@/utils/utils.js':{findKeyOfNullOrUndefined:obj=>Object.values(obj).some(x=>x==null)?'missing':null}});
 const inputs={depart:'Origin',destination:'Destination',hourDep:'12:00',nbPassager:2,price:4,route:{infosGoogle:{duration:'900s'},polylineDecoded:[[0,0],[0,1]]},car:82,sameHour:false,daysHour:[],weeksSelected:[{week:'S1',selected:true}]};
 const mode=recurring?'select-week':'select-price',vm={mode,modeWork:recurring,publicationEpoch:0,publicationBusy:false,publicationDisposed:false,$store:{state:{profil:profile},dispatch},infosPublish:{default:{...inputs},work:{...inputs}},$refs:{['BottomMenuRef'+mode]:{numberSelected:4,weeksSelected:inputs.weeksSelected,close:vi.fn()}},GET_ID_VILLAGE_BY_NAME:n=>n==='Origin'?1:2,convertTimeString:()=>new Date(2027,0,4,12),showError:vi.fn(),nextStepMode:vi.fn()};
 return {c,vm,profile};
}
for(const recurring of [false,true])for(const change of ['owner','unmount'])it(`discards ${recurring?'recurring':'single'} publication confirmation after ${change}`,async()=>{
 const reply=deferred(),dispatch=vi.fn(()=>reply.promise),{c,vm,profile}=publicationView(dispatch,recurring);const pending=c.methods.getSelected.call(vm);
 if(change==='owner'){profile.userUid='B';profile.accountGeneration++;}else c.beforeUnmount.call(vm);
 reply.resolve({status:0});await pending;expect(dispatch).toHaveBeenCalledTimes(1);expect(vm.notification).toBeUndefined();expect(vm.nextStepMode).not.toHaveBeenCalled();
});
for(const recurring of [false,true])it(`preserves normal ${recurring?'recurring':'single'} publication success and prevents duplicate clicks`,async()=>{
 const reply=deferred(),dispatch=vi.fn(()=>reply.promise),{c,vm}=publicationView(dispatch,recurring);const pending=c.methods.getSelected.call(vm);await c.methods.getSelected.call(vm);expect(dispatch).toHaveBeenCalledTimes(1);reply.resolve({status:0});await pending;expect(vm.notification.color).toBe('#9fcb66');expect(vm.publicationBusy).toBe(false);expect(vm.overlayLoad).toBe(false);expect(vm.nextStepMode).toHaveBeenCalledOnce();
});
it('unlocks the publication form and offers an error if sending fails',async()=>{
 const {c,vm}=publicationView(async()=>{throw new Error('network unavailable');});await c.methods.getSelected.call(vm);expect(vm.showError).toHaveBeenCalledWith('network unavailable');expect(vm.publicationBusy).toBe(false);expect(vm.overlayLoad).toBe(false);expect(vm.nextStepMode).not.toHaveBeenCalled();
});
it('does not insert trips after account changes during the session check',async()=>{
 const check=deferred(),insert=vi.fn(),store={state:{profil:{userUid:'A',accountGeneration:1}},dispatch:()=>check.promise};
 const c=load('src/store/publish.js',{'@/store':store,'@/utils/supabaseClient.js':{from:()=>({insert})}});
 const pending=c.actions.newTripMultple({state:{}},{driverId:'A'});store.state.profil.userUid='B';store.state.profil.accountGeneration++;check.resolve(true);expect(await pending).toMatchObject({stale:true});expect(insert).not.toHaveBeenCalled();
});
it('does not write old recurring dates after returning to the same uid in a new session',async()=>{
 const reply=deferred(),store={dispatch:async()=>true,state:{profil:{userUid:'A',accountGeneration:1,history:{datesTripDriver:[]}}}},insert=vi.fn(()=>({select:()=>reply.promise}));
 const c=load('src/store/publish.js',{'@/store':store,'@/utils/supabaseClient.js':{from:()=>({insert})},'@/utils/utils.js':{getFirstDayOfWeek:()=>new Date(2027,0,4),getDayOfWeek:()=> 'lundi'}}),input={driverId:'A',weeksSelected:[{week:'S1',selected:true}],daysHour:Array.from({length:7},(_,i)=>({values:{home:i===0,work:false},hour:{home:'12:00'}})),route:{infosGoogle:{duration:'900s'},polylineDecoded:[[0,0],[0,1]]},car_id:82};
 const pending=c.actions.newTripMultple({state:{}},input);await vi.waitFor(()=>expect(insert).toHaveBeenCalledOnce());store.state.profil.accountGeneration=3;reply.resolve({data:[{id:1}],error:null});expect(await pending).toMatchObject({stale:true});expect(store.state.profil.history.datesTripDriver).toEqual([]);
});
it('does not overwrite B balance when A credit lookup finishes late',async()=>{
 const reply=deferred(),single=vi.fn(()=>reply.promise),query={select(){return this},eq(){return this},single};
 const c=load('src/store/profil.js',{'../store':{dispatch:async()=>true},'@/utils/serverApi.js':{serverRequest:async()=>({data:{status:'succeeded'}})},'@/utils/supabaseClient.js':{from:()=>query}}),state=clone(c.state);Object.assign(state,{userUid:'A',accountGeneration:1,soldes:10});
 const pending=c.actions.addCredit({state},{credit:20,attemptId:'fixture'});await vi.waitFor(()=>expect(single).toHaveBeenCalledOnce());state.userUid='B';state.accountGeneration++;state.soldes=4;reply.resolve({data:{credit:30},error:null});expect(await pending).toMatchObject({stale:true});expect(state.soldes).toBe(4);
});
it('stops map initialization when the view closes during village lookup',async()=>{
 const villages=deferred(),c=load('src/components/trip/MapTrip.vue',{'@capacitor/core':{Capacitor:{isNativePlatform:()=>false}},'@aashu-dubey/capacitor-statusbar-safe-area':{SafeAreaController:{injectCSSVariables:vi.fn()}}}),{vm}=mapHarness();
 vm.getVillages=()=>villages.promise;vm.getVillagesByName=vi.fn();vm.handleLocationVisibility=()=>{};
 const pending=c.mounted.call(vm);vm.tripOperationsDisposed=true;villages.resolve(true);await pending;expect(vm.getVillagesByName).not.toHaveBeenCalled();expect(vm.$router.replace).not.toHaveBeenCalled();document.removeEventListener('visibilitychange',vm.handleLocationVisibility);
});
it('stops map initialization when another trip is selected during village lookup',async()=>{
 const villages=deferred(),c=load('src/components/trip/MapTrip.vue',{'@capacitor/core':{Capacitor:{isNativePlatform:()=>false}},'@aashu-dubey/capacitor-statusbar-safe-area':{SafeAreaController:{injectCSSVariables:vi.fn()}}}),{vm}=mapHarness();
 vm.getVillages=()=>villages.promise;vm.getVillagesByName=vi.fn();vm.handleLocationVisibility=()=>{};
 const pending=c.mounted.call(vm);vm.tripSelected={id:2};villages.resolve(true);await pending;expect(vm.getVillagesByName).not.toHaveBeenCalled();expect(vm.$router.replace).not.toHaveBeenCalled();document.removeEventListener('visibilitychange',vm.handleLocationVisibility);
});
it('does not apply cancellation history or feedback to the next account',async()=>{
 const reply=deferred(),{c,vm,profile}=mapHarness({serverRequest:()=>reply.promise});const pending=c.methods.annulerTrajet.call(vm);profile.userUid='B';profile.accountGeneration++;reply.resolve({data:{status:'ok',data:{tripId:1}}});await pending;expect(vm.$store.commit).not.toHaveBeenCalled();expect(vm.$store.dispatch).not.toHaveBeenCalled();expect(vm.showSuccess).not.toHaveBeenCalled();expect(vm.$router.replace).not.toHaveBeenCalled();
});
