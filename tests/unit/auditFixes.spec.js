import * as publicationRoute from '@/services/publicationRoute.js';
import * as recurringWeeks from '@/services/recurringWeeks.js';
import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse,compileTemplate} from '@vue/compiler-sfc';
import {describe,it,expect,vi} from 'vitest';
import * as preferences from '@/services/travelPreferences.js';
const load=(file,deps={})=>{let s=readFileSync(file,'utf8');if(file.endsWith('.vue'))s=parse(s).descriptor.script.content;const m={exports:{}};new Function('module','exports','require',transformSync(s,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>id.endsWith('publicationRoute.js')?publicationRoute:deps[id]||(id.endsWith('recurringWeeks.js')?recurringWeeks:id.endsWith('travelPreferences.js')?preferences:{}));return m.exports.default;};
describe('audit regression cases',()=>{
 it('handles missing tariffs, invalid prices and network failures',async()=>{
  const result={data:[],error:null};const query={select(){return this},eq(){return this},then(resolve){resolve(result)}};
  const action=load('src/store/publish.js',{'@/utils/supabaseClient.js':{from:()=>query}}).actions.getPriceRecommended;const ctx={state:{}};
  expect((await action(ctx,{})).status).toBe(1);result.data=[{price:-1}];expect((await action(ctx,{})).status).toBe(1);
  result.data=[{price:3}];expect((await action(ctx,{})).status).toBe(0);expect(ctx.state.priceRecommended).toBe(3);
  query.eq=()=>{throw Error('network')};expect((await action(ctx,{})).status).toBe(1);
 });
 it('clears the previous profile on identity change without losing theme preferences',()=>{
  const p=load('src/store/profil.js');const state=JSON.parse(JSON.stringify(p.state));Object.assign(state,{userUid:'A',identity:true,soldes:150,cars:[{id:1}],darkMode:true,credit_card:{available:true,last4:'1234'}});state.profil.infos_perso.nom='Account A';p.mutations.SET_USER_UID(state,'B');
  expect(state.userUid).toBe('B');expect(state.identity).toBe(false);expect(state.soldes).toBe(0);expect(state.cars).toEqual([]);expect(state.credit_card.available).toBe(false);expect(state.profil.infos_perso.nom).toBe('');expect(state.darkMode).toBe(true);
  state.soldes=20;p.mutations.SET_USER_UID(state,'B');expect(state.soldes).toBe(20);p.mutations.SET_USER_UID(state,'');expect(state.soldes).toBe(0);
 });
 it('handles an expired session when adding a vehicle',async()=>{const p=load('src/store/profil.js',{'../store':{dispatch:vi.fn().mockResolvedValue(false)},'@/router':{replace:vi.fn()}});expect((await p.actions.addCar({state:{}},{})).status).toBe(1);});
 it('blocks concurrent vehicle inserts and unlocks after failure',async()=>{
  const c=load('src/components/menus/bottom/SelectModelVehicul.vue',{vue:{defineComponent:x=>x},vuex:{mapActions:()=>({})}});let reject;const vm={...c.data(),matricul:'AA-123-AA',$refs:{SelectNumberRef:{number:3}},addCar:vi.fn(()=>new Promise((_,r)=>{reject=r}))};const first=c.methods.valided.call(vm);await c.methods.valided.call(vm);expect(vm.addCar).toHaveBeenCalledOnce();reject(Error('offline'));await first;expect(vm.saving).toBe(false);expect(vm.showSnackbarError).toBe(true);
 });
 it('offers a retry after publication initialization failures',async()=>{
  const c=load('src/views/Publish.vue',{vue:{defineComponent:x=>x},vuex:{mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),mapGetters:()=>({})}});const vm={getVillages:vi.fn().mockResolvedValue(false),getCars:vi.fn().mockResolvedValue({status:0}),getProvider:vi.fn().mockResolvedValue({status:0}),cars:[{id:1}],connect_activation_required:false,loadSeatPreferences:vi.fn()};await c.methods.initializePublication.call(vm);expect(vm.initializationError).toBeTruthy();expect(vm.overlayLoad).toBe(false);vm.getVillages.mockResolvedValue(true);await c.methods.initializePublication.call(vm);expect(vm.initializationError).toBe('');expect(vm.isDriver).toBe(true);vm.getCars.mockRejectedValue(Error('offline'));await c.methods.initializePublication.call(vm);expect(vm.initializationError).toBeTruthy();expect(vm.isDriver).toBe(false);
 });
 it.each(['src/views/Publish.vue','src/components/menus/bottom/SelectModelVehicul.vue','src/views/profil/InfosPerso.vue'])('compiles %s',file=>{const {descriptor}=parse(readFileSync(file,'utf8'));expect(compileTemplate({source:descriptor.template.content,filename:file,id:'audit'}).errors).toEqual([]);});
});

describe('recurring publication history',()=>{
 it('keeps failed insertions out of history and records confirmed dates',async()=>{
  const {getFirstDayOfWeek,getDayOfWeek}=await import('@/utils/utils.js');
  const store={dispatch:vi.fn().mockResolvedValue(true),state:{profil:{userUid:'A',history:{datesTripDriver:[]}}}};
  const response={data:[],error:{message:'rejected'}};
  const action=load('src/store/publish.js',{'@/store':store,'@/utils/supabaseClient.js':{from:()=>({insert:()=>({select:async()=>response})})},'@/utils/utils.js':{getFirstDayOfWeek,getDayOfWeek}}).actions.newTripMultple;
  const args={driverId:'A',weeksSelected:[{week:'S52',selected:false},{week:'S1',selected:true}],daysHour:Array.from({length:7},()=>({values:{home:true,work:false},hour:{home:'12:00'}})),route:{infosGoogle:{duration:'900s'},polylineDecoded:[[0,0],[0,1]]},car_id:82};
  expect((await action({state:{}},args)).status).toBe(3);expect(store.state.profil.history.datesTripDriver).toEqual([]);
  response.error=null;expect((await action({state:{}},args)).status).toBe(0);expect(store.state.profil.history.datesTripDriver.length).toBeGreaterThan(0);
 });
});

describe('vehicle creation',()=>{
 it.each([['Berline',4,3],['Moto',1,1]])('submits %s with the correct number of passenger seats',async(model,max,seats)=>{
  vi.useFakeTimers();
  try {
   const c=load('src/components/menus/bottom/SelectModelVehicul.vue',{vue:{defineComponent:x=>x},vuex:{mapActions:()=>({})}});
   const vm={...c.data(),modelV:model,max,matricul:'aa-123-aa',$refs:max===1?{}:{SelectNumberRef:{number:seats}},addCar:vi.fn().mockResolvedValue({status:0,message:'Ajouté'}),$emit:vi.fn()};
   await c.methods.valided.call(vm);
   expect(vm.addCar).toHaveBeenCalledWith(expect.objectContaining({model,licence_plate:'AA-123-AA',seats}));
   expect(vm.$emit).toHaveBeenCalledWith('car-valided');expect(vm.saving).toBe(false);
  }finally{vi.clearAllTimers();vi.useRealTimers();}
 });
 it('inserts under the authenticated profile and immediately updates the garage',async()=>{
  const car={id:82,driver_id:'owner',license_plate:'AA-123-AA',model:'Berline',seats:3};
  const insert=vi.fn(()=>({select:async()=>({data:[car],error:null})}));
  const p=load('src/store/profil.js',{'../store':{dispatch:vi.fn().mockResolvedValue(true)},'@/utils/supabaseClient.js':{from:vi.fn(()=>({insert}))}});
  const ctx={state:{userUid:'owner',cars:[]}};
  expect((await p.actions.addCar(ctx,{model:car.model,licence_plate:car.license_plate,seats:3})).status).toBe(0);
  expect(insert).toHaveBeenCalledWith([expect.objectContaining({driver_id:'owner',license_plate:'AA-123-AA',seats:3})]);expect(ctx.state.cars).toEqual([car]);
 });
 it('does not announce success or alter the garage when the database refuses or returns no inserted row',async()=>{
  for(const result of [{data:null,error:{code:'42501'}},{data:[],error:null}]){
   const p=load('src/store/profil.js',{'../store':{dispatch:vi.fn().mockResolvedValue(true)},'@/utils/supabaseClient.js':{from:()=>({insert:()=>({select:async()=>result})})}});
   const ctx={state:{userUid:'owner',cars:[]}};expect((await p.actions.addCar(ctx,{})).status).toBe(1);expect(ctx.state.cars).toEqual([]);
  }
 });
});
