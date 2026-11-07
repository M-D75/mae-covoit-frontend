import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {compile} from '@vue/compiler-dom';
import * as Vue from 'vue';
import {it,expect,vi,afterEach} from 'vitest';
import * as utils from '@/utils/utils.js';
import * as preferences from '@/services/travelPreferences.js';
function load(file,deps={},sdk){
 let source=readFileSync(file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;
 if(sdk)source=source.replace('let stripePromise;','let stripePromise=Promise.resolve(require("__stripeFixture"));');
 const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>id==='__stripeFixture'?sdk:deps[id]||(id.endsWith('travelPreferences.js')?preferences:{mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),mapGetters:()=>({}),defineComponent:x=>x,Capacitor:{getPlatform:()=> 'web',isNativePlatform:()=>false}}));return m.exports.default;
}
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const bindings=(c,vm)=>{for(const [k,fn]of Object.entries(c.methods))vm[k]=fn.bind(vm);return vm;};
const apps=[];afterEach(()=>{apps.splice(0).forEach(app=>app.unmount());document.body.innerHTML='';vi.restoreAllMocks();});
function hours(){
 const c=load('src/components/publish/HourDepOther.vue'),bottom=load('src/components/menus/BottomMenu.vue');
 const menu={daysSelected:bottom.data.call({}).daysSelected,time:'09:30',open:vi.fn(()=>true),close:vi.fn()};
 const vm=bindings(c,{...c.data(),$refs:{BottomMenuRefHourDepOther:menu}});vm.updateHourShow();return {vm,menu,c};
}
it.each(['home','work'])('edits weekend %s without altering weekdays',side=>{
 const {vm,menu}=hours();vm.editHour(side,1);
 expect(menu.daysSelected.map(d=>d.selected)).toEqual([false,false,false,false,false,true,true]);vm.getSelected();
 expect(vm.daysHour.slice(0,5).every(d=>d.hour[side]===(side==='home'?'08:00':'17:00'))).toBe(true);
 expect(vm.daysHour.slice(5).every(d=>d.hour[side]==='09:30'&&d.values[side])).toBe(true);
});
it('selects only an individual clicked day after grouping has changed',()=>{
 const {vm,menu}=hours();vm.daysHour[2].hour.home='06:00';vm.updateHourShow();vm.editHour('home',1);vm.getSelected();
 expect(menu.daysSelected.map(d=>d.selected)).toEqual([false,false,true,false,false,false,false]);
 expect(vm.daysHour.map(d=>d.hour.home)).toEqual(['08:00','08:00','09:30','08:00','08:00','08:00','08:00']);
});
it('resets the repeated-day selection on each opening and keeps home/work selections independent',()=>{
 const {vm,menu}=hours();vm.editHour('home',1);vm.getSelected();const home=vm.daysSelected.home;
 vm.editHour('work',0);expect(menu.daysSelected.map(d=>d.selected)).toEqual([true,true,true,true,true,false,false]);vm.getSelected();
 menu.daysSelected[0].selected=false;expect(vm.daysSelected.work[0].selected).toBe(true);expect(home[5].selected).toBe(true);expect(home[0].selected).toBe(false);
});
it('still supports explicitly repeating the edited time on other days',()=>{
 const {vm,menu}=hours();vm.editHour('home',1);menu.daysSelected.forEach((d,i)=>d.selected=i===0||i===5);vm.getSelected();
 expect(vm.daysHour.map(d=>d.hour.home)).toEqual(['09:30','08:00','08:00','08:00','08:00','09:30','08:00']);
});
const passenger=[{date:'passenger',infos:[{id:1}]}],driver=[{date:'driver',infos:[{id:2}]}];
function profile(){
 const c=load('src/components/profile/CompProfil.vue'),store={state:{profil:{darkMode:false}}};
 const vm={...c.data.call({$store:store}),onglet:'trajets',profil:{myTravels:passenger,myPublish:driver},SET_LOAD_GET_TRIP_PUBLISH:vi.fn(),getTravels:vi.fn(async()=>({status:0,data:passenger})),getPublish:vi.fn(async()=>({status:0,data:driver})),askNewMessage:vi.fn(async()=>{})};
 return {c,vm};
}
it.each(['trajets','planning'])('preserves cached %s with an error, then clears the error after retry succeeds',async tab=>{
 const {c,vm}=profile();vm.onglet=tab;const action=tab==='trajets'?'getTravels':'getPublish',rows=tab==='trajets'?passenger:driver;
 vm[action].mockResolvedValueOnce({status:1,message:'Connexion indisponible'});await c.methods.updateTripInfos.call(vm);
 expect(vm.infosTravels).toBe(rows);expect(vm.tripLoadError).toBe('Connexion indisponible');expect(vm.tripsLoading).toBe(false);
 await c.methods.updateTripInfos.call(vm);expect(vm.tripLoadError).toBe('');expect(vm.infosTravels).toBe(rows);expect(vm.askNewMessage).toHaveBeenCalledOnce();
});
it('handles an unexpected rejected load and always stops the current spinner',async()=>{
 const {c,vm}=profile();vm.getTravels.mockRejectedValue(Error('offline'));await c.methods.updateTripInfos.call(vm);
 expect(vm.tripLoadError).toContain('réservations');expect(vm.tripsLoading).toBe(false);expect(vm.SET_LOAD_GET_TRIP_PUBLISH).toHaveBeenLastCalledWith(false);
});
it('does not replace the driver planning with a late reservation response',async()=>{
 const {c,vm}=profile(),slow=deferred();vm.getTravels.mockReturnValue(slow.promise);const first=c.methods.updateTripInfos.call(vm);
 vm.onglet='planning';await c.methods.updateTripInfos.call(vm);slow.resolve({status:0,data:passenger});await first;
 expect(vm.infosTravels).toBe(driver);expect(vm.tripLoadError).toBe('');expect(vm.askNewMessage).toHaveBeenCalledOnce();
});
it('a stale failure does not set an error or stop the current tab spinner',async()=>{
 const {c,vm}=profile(),first=deferred(),second=deferred();vm.getTravels.mockReturnValue(first.promise);vm.getPublish.mockReturnValue(second.promise);
 const a=c.methods.updateTripInfos.call(vm);vm.onglet='planning';const b=c.methods.updateTripInfos.call(vm);first.reject(Error('offline'));await a;
 expect(vm.tripsLoading).toBe(true);expect(vm.tripLoadError).toBe('');second.resolve({status:0,data:driver});await b;expect(vm.tripsLoading).toBe(false);
});
it('accepts only the latest refresh of the same tab',async()=>{
 const {c,vm}=profile(),old=deferred();vm.getTravels.mockReturnValueOnce(old.promise);const a=c.methods.updateTripInfos.call(vm);await c.methods.updateTripInfos.call(vm);
 old.resolve({status:0,data:[{date:'old'}]});await a;expect(vm.infosTravels).toBe(passenger);
});
it('invalidates pending loads when leaving for the dashboard or unmounting',async()=>{
 for(const unmount of [false,true]){
  const {c,vm}=profile(),old=deferred();vm.getTravels.mockReturnValue(old.promise);const a=c.methods.updateTripInfos.call(vm);
  if(unmount)c.beforeUnmount.call(vm);else{vm.onglet='table-bord';await c.methods.updateTripInfos.call(vm);}
  old.resolve({status:0,data:[{date:'old'}]});await a;expect(vm.infosTravels).toBe(passenger);expect(vm.SET_LOAD_GET_TRIP_PUBLISH).toHaveBeenLastCalledWith(false);
 }
});
it('empty success replaces the cache, while unread-count failure does not hide loaded journeys',async()=>{
 const {c,vm}=profile();vm.getTravels.mockResolvedValueOnce({status:0,data:[]});vm.askNewMessage.mockRejectedValue(Error('unread offline'));await c.methods.updateTripInfos.call(vm);
 expect(vm.infosTravels).toEqual([]);expect(vm.tripLoadError).toBe('');await c.methods.updateTripInfos.call(vm);expect(vm.infosTravels).toBe(passenger);expect(vm.tripLoadError).toBe('');
});
function renderedHistory(props){
 const file='src/components/profile/HistoryTrajets.vue',c=load(file),retry=vi.fn();
 const render=new Function('Vue',compile(parse(readFileSync(file,'utf8')).descriptor.template.content,{mode:'function',prefixIdentifiers:true}).code)(Vue);
 const GroupCardsHistory={props:['infos'],render(){return Vue.h('div',{'data-cards':true},this.infos.map(i=>i.id).join(','));}};
 const app=Vue.createApp({...c,components:{GroupCardsHistory},render},{...props,onRetry:retry});
 for(const tag of ['v-alert','v-btn','v-icon','v-progress-linear','v-progress-circular'])app.component(tag,{render(){return Vue.h(tag==='v-btn'?'button':'div',this.$attrs,this.$slots.default?.());}});
 const el=document.createElement('div');document.body.append(el);const vm=app.mount(el);apps.push(app);return {el,retry,vm};
}
it('renders error and retry without falsely claiming there are no journeys',async()=>{
 const {el,retry}=renderedHistory({infos:[],error:'Connexion indisponible',loading:false});expect(el.textContent).toContain('Connexion indisponible');expect(el.textContent).not.toMatch(/Aucune réservation|Aucune publication/);
 el.querySelector('button').click();await Vue.nextTick();expect(retry).toHaveBeenCalledOnce();
});
it('displays previously loaded cards with a clear warning after a refresh failure',()=>{
 const {el}=renderedHistory({infos:passenger,error:'Connexion indisponible',loading:false});expect(el.textContent).toContain('derniers trajets chargés');expect(el.querySelector('[data-cards]').textContent).toBe('1');
});
it.each(['trajets','planning'])('shows the actual empty state for a successful empty %s result',mode=>{
 const {el}=renderedHistory({mode,infos:[],error:'',loading:false});expect(el.textContent).toContain(mode==='planning'?'Aucune publication récente':'Aucune réservation récente');
});
it('shows a loader rather than the empty message during the initial request',()=>{
 const {el}=renderedHistory({infos:[],error:'',loading:true});expect(el.textContent).not.toMatch(/Aucune réservation|Aucune publication/);
});
function storeHarness(fetch=async()=>[],dispatch=async()=>({status:0,data:[]})){
 const state={userUid:'owner',accountGeneration:1,userId:7,profil:{myTravels:passenger,myPublish:driver},history:{datesTripPassenger:['old-passenger'],datesTripDriver:['old-driver']}},commit=vi.fn();
 const store={state:{trip:{notMessageVue:[]}},getters:{'search/GET_VILLAGE_BY_ID':id=>id},dispatch:vi.fn(name=>name==='search/getVillages'?Promise.resolve(true):dispatch())};
 const c=load('src/store/profil.js',{'../store':store,'@/utils/utils.js':utils,'@/services/travels.js':{fetchPassengerTrips:fetch,normalizePassengerTrips:rows=>rows}});
 return {state,c,commit,store,run:name=>c.actions[name]({state,commit})};
}
it('passenger failure preserves the previous journeys, date markers and rating state',async()=>{
 const h=storeHarness(async()=>{throw Error('offline');});const r=await h.run('getTravels');expect(r.status).toBe(1);expect(r.message).toContain('réservations');expect(h.state.profil.myTravels).toBe(passenger);expect(h.state.history.datesTripPassenger).toEqual(['old-passenger']);expect(h.commit).not.toHaveBeenCalled();
});
it.each(['reject','status','malformed'])('driver failure %s preserves the previous journeys and dates',async kind=>{
 const h=storeHarness(undefined,async()=>{if(kind==='reject')throw Error('offline');return kind==='status'?{status:1,message:'offline'}:{status:0};});
 expect((await h.run('getPublish')).status).toBe(1);expect(h.state.profil.myPublish).toBe(driver);expect(h.state.history.datesTripDriver).toEqual(['old-driver']);
});
it.each(['getTravels','getPublish'])('%s empty success clears old journeys and dates',async action=>{
 const h=storeHarness();expect(await h.run(action)).toMatchObject({status:0,data:[]});const passenger=action==='getTravels';expect(h.state.profil[passenger?'myTravels':'myPublish']).toEqual([]);expect(h.state.history[passenger?'datesTripPassenger':'datesTripDriver']).toEqual([]);
});
it.each(['getTravels','getPublish'])('%s never overwrites a newer successful request with an older response',async action=>{
 const old=deferred(),row={id:9,departure_time:'2027-01-04T08:00:00Z'},fresh={id:10,departure_time:'2027-01-05T08:00:00Z'};let attempt=0;
 const h=storeHarness(()=>++attempt===1?old.promise:Promise.resolve([fresh]),()=>++attempt===1?old.promise:Promise.resolve({status:0,data:[fresh]}));
 const a=h.run(action);await vi.waitFor(()=>expect(attempt).toBe(1));const b=await h.run(action);expect(b.data[0].infos[0].id).toBe(10);
 old.resolve(action==='getTravels'?[row]:{status:0,data:[row]});expect(await a).toMatchObject({status:2,stale:true});expect(h.state.profil[action==='getTravels'?'myTravels':'myPublish'][0].infos[0].id).toBe(10);
});
function identity(request,sdk={verifyIdentity:vi.fn(async()=>({}))}){
 const c=load('src/components/profile/Identity.vue',{'@/utils/serverApi.js':{serverRequest:request}},sdk);
 const vm=bindings(c,{...c.data(),identity:false,stripe_provider:null,$store:{state:{profil:{modeCo:'online'}}},identityChecked:vi.fn(async()=>({status:0}))});vm.showSnackbarMessage=vi.fn();return {vm,c,sdk};
}
const session={id:'vs_fixture',client_secret:'fixture_secret',status:'requires_input'};
it('identity startup reports a network failure and allows retry',async()=>{
 const request=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce({data:session}).mockResolvedValueOnce({data:{status:'processing'}}),{vm}=identity(request);
 await expect(vm.checkIdentity()).resolves.toBeUndefined();expect(vm.showSnackbarMessage).toHaveBeenCalledWith(2,expect.stringContaining('connexion'));expect(vm.identityBusy).toBe(false);
 await vm.checkIdentity();expect(vm.showSnackbarMessage).toHaveBeenLastCalledWith(3,'Vérification en cours...');expect(vm.identityBusy).toBe(false);
});
it('identity retrieval failure is handled through the same user action',async()=>{
 const request=vi.fn(async()=>{throw Error('offline');}),{vm}=identity(request);vm.stripe_provider={metadata:{vs_id:'vs_existing'}};await vm.checkIdentity();expect(request).toHaveBeenCalledWith('get','/connect/identity-session/vs_existing',expect.any(Object));expect(vm.showSnackbarMessage).toHaveBeenCalledWith(2,expect.any(String));expect(vm.identityBusy).toBe(false);
});
it.each(['sdk-reject','sdk-error','recheck'])('identity %s failure displays feedback and restores the button',async failure=>{
 const request=vi.fn(async method=>{if(method==='get'&&failure==='recheck')throw Error('offline');return {data:session};});
 const sdk={verifyIdentity:vi.fn(async()=>{if(failure==='sdk-reject')throw Error('sdk failed');return failure==='sdk-error'?{error:{message:'Document refusé'}}:{};})},{vm}=identity(request,sdk);
 await vm.checkIdentity();expect(vm.showSnackbarMessage).toHaveBeenCalledWith(2,expect.any(String));expect(vm.identityBusy).toBe(false);expect(vm.identityChecked).not.toHaveBeenCalled();
});
it('ignores repeated identity clicks while the request is pending',async()=>{
 const pending=deferred(),request=vi.fn(()=>pending.promise),{vm,sdk}=identity(request);const first=vm.checkIdentity();await vm.checkIdentity();expect(request).toHaveBeenCalledOnce();pending.reject(Error('offline'));await first;expect(sdk.verifyIdentity).not.toHaveBeenCalled();expect(vm.identityBusy).toBe(false);
});
it('awaits server confirmation and only then reports identity verified',async()=>{
 const pending=deferred(),request=vi.fn(async method=>({data:method==='post'?session:{status:'verified'}})),{vm,sdk}=identity(request);vm.identityChecked.mockReturnValue(pending.promise);
 const p=vm.checkIdentity();await vi.waitFor(()=>expect(vm.identityChecked).toHaveBeenCalledOnce());expect(vm.identityBusy).toBe(true);expect(vm.showSnackbarMessage).not.toHaveBeenCalled();pending.resolve({status:0});await p;
 expect(sdk.verifyIdentity).toHaveBeenCalledWith(session.client_secret);expect(vm.showSnackbarMessage).toHaveBeenCalledWith(1,expect.any(String));expect(vm.identityBusy).toBe(false);
});
it.each(['processing','verified'])('retrieves an existing %s session without reopening the document form',async status=>{
 const request=vi.fn(async()=>({data:{status}})),{vm,sdk}=identity(request);vm.stripe_provider={metadata:{vs_id:'vs_existing'}};await vm.checkIdentity();expect(sdk.verifyIdentity).not.toHaveBeenCalled();expect(vm.showSnackbarMessage).toHaveBeenCalledWith(status==='verified'?1:3,expect.any(String));
});
it('does not call verification again for an already verified user',async()=>{
 const request=vi.fn(),{vm,sdk}=identity(request);vm.identity=true;await vm.checkIdentity();expect(request).not.toHaveBeenCalled();expect(sdk.verifyIdentity).not.toHaveBeenCalled();expect(vm.showSnackbarMessage).toHaveBeenCalledWith(3,'Identité déjà validée !');
});
