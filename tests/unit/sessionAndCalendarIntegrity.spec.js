import * as publicationRoute from '@/services/publicationRoute.js';
import * as authSessionGuard from '@/services/authSessionGuard.js';
import * as recurringWeeks from '@/services/recurringWeeks.js';
import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {it,expect,vi,afterEach} from 'vitest';
import * as utils from '@/utils/utils.js';
import * as preferences from '@/services/travelPreferences.js';
const root='.';
function module(file,deps={}){
 const client=deps['@/utils/supabaseClient.js'];
 if(file==='src/store/auth.js' && client?.auth){
  client.fixtureSignOut=client.auth.signOut;
  const values=new Map();authSessionGuard.createAuthSessionGuard({storage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},fetch:()=>{throw Error('Unexpected network');}}).attach(client);
 }

 let source=readFileSync(root+'/'+file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;
 const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>id.endsWith('publicationRoute.js')?publicationRoute:deps[id]||(id.endsWith('authSessionGuard.js')?authSessionGuard:id.endsWith('recurringWeeks.js')?recurringWeeks:id.endsWith('travelPreferences.js')?preferences:{Capacitor:{getPlatform:()=> 'web'},mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),mapGetters:()=>({}),defineComponent:x=>x}));return m.exports;
}
const load=(f,d)=>module(f,d).default;
const clone=x=>JSON.parse(JSON.stringify(x));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});

it('blocks deletion when the authenticated JWT belongs to a different account',async()=>{
 const lookup=deferred(),axios=vi.fn(async()=>({data:{message:'fixture deleted'}})),profile={userUid:'A',accountGeneration:1,modeCo:'online'};
 const client={auth:{getSession:()=>lookup.promise,signOut:vi.fn().mockResolvedValue({})}};
 const api=module('src/utils/serverApi.js',{'axios':axios,'@/utils/supabaseClient.js':client,'@/utils/clientIdentity.js':{getClientHeaders:async()=>({})}});
 const c=load('src/store/auth.js',{'@/utils/serverApi.js':api,'@/utils/supabaseClient.js':client});
 const pending=c.actions.removeAccount({rootState:{profil:profile},commit:vi.fn()});profile.userUid='B';profile.accountGeneration++;
 lookup.resolve({data:{session:{user:{id:'B'},access_token:'fixture-token-B'}},error:null});await pending;
 expect(axios).not.toHaveBeenCalled();expect(client.fixtureSignOut).not.toHaveBeenCalled();
});
it('ignores a deleted account response after another account signs in',async()=>{
 const reply=deferred(),profile={userUid:'A',accountGeneration:1,modeCo:'online'},signOut=vi.fn(async()=>({})),commit=vi.fn();
 const c=load('src/store/auth.js',{'@/utils/serverApi.js':{serverRequest:()=>reply.promise},'@/utils/supabaseClient.js':{auth:{signOut}}});
 const pending=c.actions.removeAccount({rootState:{profil:profile},commit});profile.userUid='B';profile.accountGeneration++;reply.resolve({data:{message:'fixture A deleted'}});await pending;
 expect(signOut).not.toHaveBeenCalled();expect(commit).not.toHaveBeenCalled();
});
function authHarness(avatar){
 const reply=deferred(),profileModule=load('src/store/profil.js'),profile=clone(profileModule.state);Object.assign(profile,{userUid:'A',userId:1,accountGeneration:1,modeCo:'online'});
 const account={id:1,user_id:'A',firstname:'Fixture A',lastname:'Alpha',email:'a@example.test',credit:90,avatar,settings:{auto_accept_trip:true,prefer:[1,2,1,1]}};
 const update=vi.fn(()=>({eq(){return this},select(){return reply.promise;}}));
 const query={select(){return this},eq(){return this},then(resolve){return Promise.resolve({data:[account],error:null}).then(resolve)},update};
 const client={auth:{getSession:async()=>({data:{session:{access_token:'fixture-A',expires_at:9999999999,user:{id:'A',app_metadata:{provider:'email'},user_metadata:{}}}},error:null})},from:()=>query};
 const store={state:{profil:profile}},c=load('src/store/auth.js',{'../store':store,'@/utils/supabaseClient.js':client,'@/utils/serverApi.js':{serverRequest:async()=>({data:{customer:{id:'cus_A'},provider:{id:'acct_A'}}})},'@/services/authEntry.js':{rememberAuthEntry:()=>{}}}),state=clone(c.state);
 store.state.auth=state;const commit=(type,payload)=>{if(type.startsWith('profil/'))profileModule.mutations[type.slice(7)](profile,payload);else c.mutations[type](state,payload);};
 return {reply,update,c,state,profile,profileModule,ctx:{state,rootState:store.state,commit}};
}
it('does not restore old private data after a late avatar synchronization',async()=>{
 const h=authHarness(null),pending=h.c.actions.checkSession(h.ctx);await vi.waitFor(()=>expect(h.update).toHaveBeenCalledOnce());h.profileModule.mutations.SET_USER_UID(h.profile,'B');h.profile.userId=2;h.profile.profil.infos_perso.email='b@example.test';h.profile.soldes=4;
 h.reply.resolve({data:[{user_id:'A'}],error:null});expect(await pending).toBe(false);expect(h.profile.userUid).toBe('B');expect(h.profile.soldes).toBe(4);expect(h.profile.profil.infos_perso.email).toBe('b@example.test');expect(h.profile.userName).toBe('');
});
it('baseline: normal profile loading keeps the account fields coherent',async()=>{
 const h=authHarness('fixture-avatar');expect(await h.c.actions.checkSession(h.ctx)).toBe(true);expect(h.profile.userUid).toBe('A');expect(h.profile.soldes).toBe(90);expect(h.profile.profil.infos_perso.email).toBe('a@example.test');expect(h.update).not.toHaveBeenCalled();
});
it('preserves ISO week 53 in the December calendar',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date(2026,11,17,12));const c=load('src/components/menus/BottomMenu.vue',{'@/utils/utils.js':utils});const vm={mode:'select-week',weeksSelected:Array.from({length:4},()=>({selected:false}))};c.mounted.call(vm);
 expect(vm.weeksSelected.map(w=>w.week)).toEqual(['S51','S52','S53','S1']);const weeks=Array.from({length:4},(_,i)=>{const d=new Date();d.setDate(d.getDate()+7*i);return 'S'+utils.getISOWeekNumber(d);});expect(weeks).toEqual(['S51','S52','S53','S1']);
});
it('includes January week 1 immediately after ISO week 53',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date(2026,11,30,12));const c=load('src/components/menus/BottomMenu.vue',{'@/utils/utils.js':utils}),vm={mode:'select-week',weeksSelected:Array.from({length:4},()=>({selected:false}))};c.mounted.call(vm);expect(vm.weeksSelected.map(w=>w.week)).toEqual(['S53','S1','S2','S3']);expect(vm.weeksSelected.map(w=>w.isoYear)).toEqual([2026,2027,2027,2027]);
});
function recurringHarness(){
 const insert=vi.fn(()=>({select:async()=>({data:[{id:1}],error:null})})),store={state:{profil:{userUid:'A',accountGeneration:1,history:{datesTripDriver:[]}}},dispatch:async()=>true};
 const c=load('src/store/publish.js',{'@/store':store,'@/utils/supabaseClient.js':{from:()=>({insert})},'@/utils/utils.js':utils,'@/services/contextualHelp.js':{requestContextHelp:()=>{}}});
 const input={driverId:'A',villageDep:1,villageDest:2,maxSeats:2,price:4,car_id:82,route:{infosGoogle:{duration:'900s'},polylineDecoded:[[0,0],[0,1]]},daysHour:Array.from({length:7},(_,i)=>({values:{home:i===0,work:false},hour:{home:'12:00'}}))};return {insert,store,c,input};
}
it('publishes January week 2 even when week 1 is unchecked',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date(2026,11,17,12));const h=recurringHarness();h.input.weeksSelected=[{week:'S51',selected:false},{week:'S52',selected:false},{week:'S1',selected:false},{week:'S2',selected:true}];
 const result=await h.c.actions.newTripMultple({state:{}},h.input);expect(result.status).toBe(0);expect(h.insert).toHaveBeenCalledOnce();const date=h.insert.mock.calls[0][0][0].departure_time;expect([date.getFullYear(),date.getMonth(),date.getDate()]).toEqual([2027,0,11]);
});
it('baseline: a selected week still in December publishes normally',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date(2026,11,17,12));const h=recurringHarness();h.input.weeksSelected=[{week:'S51',selected:false},{week:'S52',selected:true},{week:'S1',selected:false},{week:'S2',selected:false}];
 expect((await h.c.actions.newTripMultple({state:{}},h.input)).status).toBe(0);expect(h.insert).toHaveBeenCalledOnce();const d=h.insert.mock.calls[0][0][0].departure_time;expect(d.getFullYear()).toBe(2026);expect(d.getMonth()).toBe(11);expect(d.getDate()).toBe(21);
});
it('baseline: deleting a stable account sends its own JWT and clears its session',async()=>{
 const axios=vi.fn(async()=>({data:{message:'fixture deleted'}})),client={auth:{getSession:async()=>({data:{session:{user:{id:'A'},access_token:'fixture-token-A'}},error:null}),signOut:vi.fn(async()=>({}))}};
 const api=module('src/utils/serverApi.js',{'axios':axios,'@/utils/supabaseClient.js':client,'@/utils/clientIdentity.js':{getClientHeaders:async()=>({})}}),c=load('src/store/auth.js',{'@/utils/serverApi.js':api,'@/utils/supabaseClient.js':client});
 const result=await c.actions.removeAccount({rootState:{profil:{userUid:'A',accountGeneration:1,modeCo:'online'}},commit:vi.fn()});expect(result.status).toBe(0);expect(axios.mock.calls[0][0].headers.Authorization).toBe('Bearer fixture-token-A');expect(client.fixtureSignOut).toHaveBeenCalledOnce();
});
it('baseline: avatar synchronization keeps the original account when no identity changes',async()=>{
 const h=authHarness(null),pending=h.c.actions.checkSession(h.ctx);await vi.waitFor(()=>expect(h.update).toHaveBeenCalledOnce());h.reply.resolve({data:[{user_id:'A'}],error:null});expect(await pending).toBe(true);expect(h.profile.userUid).toBe('A');expect(h.profile.soldes).toBe(90);expect(h.profile.profil.infos_perso.email).toBe('a@example.test');
});
it('baseline: the profile refresh after vehicle creation prevents an older garage response from hiding the new car',async()=>{
 const old=deferred(),fresh=deferred(),car={id:82,driver_id:'A',license_plate:'AA-123-AA',model:'Berline',seats:3};let reads=0;
 const select=vi.fn(()=>++reads===1?old.promise:fresh.promise),client={from:()=>({select(){return {eq(){return select();}}},insert:()=>({select:async()=>({data:[car],error:null})})})};
 const c=load('src/store/profil.js',{'../store':{dispatch:async()=>true},'@/utils/supabaseClient.js':client}),state=clone(c.state);Object.assign(state,{userUid:'A',accountGeneration:1});
 const first=c.actions.getCars({state});await vi.waitFor(()=>expect(select).toHaveBeenCalledTimes(1));expect((await c.actions.addCar({state},{model:'Berline',licence_plate:'AA-123-AA',seats:3})).status).toBe(0);
 const second=c.actions.getCars({state});await vi.waitFor(()=>expect(select).toHaveBeenCalledTimes(2));fresh.resolve({data:[car],error:null});await second;old.resolve({data:[],error:null});expect(await first).toMatchObject({stale:true});expect(state.cars).toEqual([car]);
});

it('refuses a confirmation opened for a previous account',async()=>{
 const {c,vm,profile}=deletionView();c.methods.callDeleteAccount.call(vm);profile.userUid='B';profile.accountGeneration++;
 await c.methods.deleteAccount.call(vm);expect(vm.removeAccount).not.toHaveBeenCalled();expect(vm.$refs.BottomMenuRefConfirmChoice.close).toHaveBeenCalled();
});
function deletionView(removeAccount=vi.fn().mockResolvedValue({status:0})){
 const c=load('src/components/menus/setting/InfosGeneral.vue'),profile={userUid:'A',accountGeneration:1},sheet={open:vi.fn(),close:vi.fn(),loadingBtn:false};
 const vm={...c.data(),$store:{state:{profil:profile}},$refs:{BottomMenuRefConfirmChoice:sheet},$router:{replace:vi.fn()},removeAccount};
 vm.resetDeletion=c.methods.resetDeletion.bind(vm);return {c,vm,profile,sheet};
}
it('binds deletion confirmation to its account and prevents duplicate clicks',async()=>{
 const reply=deferred(),remove=vi.fn(()=>reply.promise),{c,vm,sheet}=deletionView(remove);c.methods.callDeleteAccount.call(vm);const pending=c.methods.deleteAccount.call(vm);await c.methods.deleteAccount.call(vm);
 expect(remove).toHaveBeenCalledOnce();expect(remove).toHaveBeenCalledWith({expectedUserId:'A',accountGeneration:1});reply.resolve({status:0});await pending;expect(vm.$router.replace).toHaveBeenCalledWith('/login');expect(sheet.loadingBtn).toBe(false);expect(vm.deleteBusy).toBe(false);
});
for(const change of ['owner','unmount'])it(`discards deletion feedback after ${change}`,async()=>{
 const reply=deferred(),{c,vm,profile,sheet}=deletionView(vi.fn(()=>reply.promise));c.methods.callDeleteAccount.call(vm);const pending=c.methods.deleteAccount.call(vm);
 if(change==='owner'){profile.userUid='B';profile.accountGeneration++;}else c.beforeUnmount.call(vm);
 reply.resolve({status:0,warnings:['fixture']});await pending;expect(vm.$router.replace).not.toHaveBeenCalled();expect(vm.showDeleteWarning).toBe(false);expect(sheet.close).not.toHaveBeenCalled();
});
it('cancels delayed deletion navigation after a new session begins',async()=>{
 vi.useFakeTimers();const {c,vm,profile}=deletionView(vi.fn().mockResolvedValue({status:0,warnings:['fixture']}));c.methods.callDeleteAccount.call(vm);await c.methods.deleteAccount.call(vm);expect(vm.showDeleteWarning).toBe(true);profile.userUid='B';profile.accountGeneration++;vi.advanceTimersByTime(5000);expect(vm.$router.replace).not.toHaveBeenCalled();
});
it('keeps a failed deletion retryable on the same account',async()=>{
 const {c,vm,sheet}=deletionView(vi.fn().mockResolvedValue({status:409,message:'pending settlement'}));c.methods.callDeleteAccount.call(vm);await c.methods.deleteAccount.call(vm);expect(vm.showDeleteError).toBe(true);expect(vm.deleteError).toBe('pending settlement');expect(sheet.loadingBtn).toBe(false);expect(vm.deleteBusy).toBe(false);expect(vm.$router.replace).not.toHaveBeenCalled();
});
it('checks the SDK account again before local deletion cleanup',async()=>{
 const signOut=vi.fn(),commit=vi.fn(),profile={userUid:'A',accountGeneration:1,modeCo:'online'},c=load('src/store/auth.js',{'@/utils/serverApi.js':{serverRequest:async()=>({data:{}})},'@/utils/supabaseClient.js':{auth:{getSession:async()=>({data:{session:{user:{id:'B'}}}}),signOut}}});
 expect(await c.actions.removeAccount({rootState:{profil:profile},commit})).toMatchObject({stale:true});expect(signOut).not.toHaveBeenCalled();expect(commit).not.toHaveBeenCalled();
});
it('does not clear the next profile after a delayed local sign-out completion',async()=>{
 const signedOut=deferred(),signOut=vi.fn(()=>signedOut.promise),commit=vi.fn(),profile={userUid:'A',accountGeneration:1,modeCo:'online'},c=load('src/store/auth.js',{'@/utils/serverApi.js':{serverRequest:async()=>({data:{}})},'@/utils/supabaseClient.js':{auth:{getSession:async()=>({data:{session:{user:{id:'A'}}}}),signOut}}});
 const pending=c.actions.removeAccount({rootState:{profil:profile},commit});await vi.waitFor(()=>expect(signOut).toHaveBeenCalledOnce());profile.userUid='B';profile.accountGeneration++;signedOut.resolve({error:null});expect(await pending).toMatchObject({stale:true});expect(commit).not.toHaveBeenCalled();
});
it('accepts the expected SIGNED_OUT profile reset after deleting the original account',async()=>{
 const commit=vi.fn(),profile={userUid:'A',accountGeneration:1,modeCo:'online'},c=load('src/store/auth.js',{'@/utils/serverApi.js':{serverRequest:async()=>({data:{}})},'@/utils/supabaseClient.js':{auth:{getSession:async()=>({data:{session:{user:{id:'A'}}}}),signOut:async()=>{profile.userUid='';profile.accountGeneration++;return {error:null};}}}});
 expect(await c.actions.removeAccount({rootState:{profil:profile},commit})).toMatchObject({status:0,deletedUserId:'A',sessionGeneration:2});expect(commit).toHaveBeenCalledWith('CLEAR_TOKEN');
});
it('rejects a stale deletion intent before sending a request',async()=>{
 const request=vi.fn(),c=load('src/store/auth.js',{'@/utils/serverApi.js':{serverRequest:request}}),profile={userUid:'B',accountGeneration:2};
 expect(await c.actions.removeAccount({rootState:{profil:profile},commit:vi.fn()},{expectedUserId:'A',accountGeneration:1})).toMatchObject({stale:true});expect(request).not.toHaveBeenCalled();
});
it('rejects a late avatar completion after returning to the same uid in a new generation',async()=>{
 const h=authHarness(null),pending=h.c.actions.checkSession(h.ctx);await vi.waitFor(()=>expect(h.update).toHaveBeenCalledOnce());h.profile.accountGeneration+=2;h.profile.soldes=4;h.reply.resolve({data:[],error:null});expect(await pending).toBe(false);expect(h.profile.soldes).toBe(4);
});
for(const [date,labels,years] of [
 [new Date(2020,11,28,12),['S53','S1','S2','S3'],[2020,2021,2021,2021]],
 [new Date(2021,11,27,12),['S52','S1','S2','S3'],[2021,2022,2022,2022]],
 [new Date(2024,11,30,12),['S1','S2','S3','S4'],[2025,2025,2025,2025]],
 [new Date(2026,11,28,12),['S53','S1','S2','S3'],[2026,2027,2027,2027]],
])it(`preserves ISO years for the four weeks starting ${date.toDateString()}`,()=>{
 const weeks=recurringWeeks.upcomingRecurringWeeks(date);expect(weeks.map(w=>w.week)).toEqual(labels);expect(weeks.map(w=>w.isoYear)).toEqual(years);
 for(const week of weeks){const start=recurringWeeks.recurringWeekStart(week,date);expect(start.getDay()).toBe(1);expect(start.getHours()).toBe(0);}
});
for(const date of [new Date(2026,2,23,12),new Date(2026,9,19,12)])it(`keeps local Mondays across a daylight-saving transition from ${date.toDateString()}`,()=>{
 const weeks=recurringWeeks.upcomingRecurringWeeks(date),starts=weeks.map(w=>recurringWeeks.recurringWeekStart(w,date));
 starts.forEach((start,i)=>{expect(start.getDay()).toBe(1);expect(start.getHours()).toBe(0);const expected=new Date(starts[0]);expected.setDate(expected.getDate()+7*i);expect(start.getTime()).toBe(expected.getTime());});
});
for(const week of [
 {week:'S0'}, {week:'S54'}, {week:'S53',isoYear:2025}, {week:'S1',isoYear:2026,startDate:'2026-01-06'},
 {week:'S53',isoYear:2027,startDate:'2026-12-28'}, {week:'S1',startDate:'2026-13-01'},
])it(`rejects inconsistent week data ${JSON.stringify(week)}`,()=>{
 expect(()=>recurringWeeks.recurringWeekStart(week,new Date(2026,11,17))).toThrow();
});
it('publishes a generated January selection without checking December or week 1',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date(2026,11,30,12));const h=recurringHarness();h.input.weeksSelected=recurringWeeks.upcomingRecurringWeeks().map(w=>({...w,selected:w.week==='S2'}));
 expect((await h.c.actions.newTripMultple({state:{}},h.input)).status).toBe(0);const date=h.insert.mock.calls[0][0][0].departure_time;expect([date.getFullYear(),date.getMonth(),date.getDate(),date.getHours()]).toEqual([2027,0,11,12]);
});
it('does not insert a recurring schedule with inconsistent stored dates',async()=>{
 const h=recurringHarness();h.input.weeksSelected=[{week:'S53',isoYear:2026,startDate:'2026-12-29',selected:true}];expect((await h.c.actions.newTripMultple({state:{}},h.input)).status).toBe(2);expect(h.insert).not.toHaveBeenCalled();
});
