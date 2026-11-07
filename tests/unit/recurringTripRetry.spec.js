import * as publicationRoute from '@/services/publicationRoute.js';
import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import lodash from 'lodash';
import * as utils from '@/utils/utils.js';
import * as recurring from '@/services/recurringWeeks.js';
function load(file,deps={}){
 let source=readFileSync(file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;
 const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>id.endsWith('publicationRoute.js')?publicationRoute:deps[id]||(id==='lodash'?lodash:id.endsWith('recurringWeeks.js')?recurring:{mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),mapGetters:()=>({}),defineComponent:x=>x}));return m.exports.default;
}
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date(2026,10,6,12));});
afterEach(()=>vi.useRealTimers());
function harness(failure){
 const store={state:{profil:{userUid:'driver',accountGeneration:1,history:{datesTripDriver:[]}}},dispatch:async()=>true};let attempts=0;
 const insert=vi.fn(()=>({select:async()=>{attempts++;if(attempts===1&&failure==='throw')throw Error('fixture network error');if(attempts===1&&failure==='error')return {data:null,error:{message:'fixture rejected insert'}};return {data:[{id:1}],error:null};}}));
 const action=load('src/store/publish.js',{'@/store':store,'@/utils/supabaseClient.js':{from:()=>({insert})},'@/utils/utils.js':utils,'@/services/contextualHelp.js':{requestContextHelp:()=>{}}}).actions.newTripMultple;
 const dispatch=vi.fn((_,input)=>action({state:{}},input)),view=load('src/views/Publish.vue',{'jquery':()=>({css:vi.fn()}),'@/utils/utils.js':utils});
 const vm={mode:'select-week',modeWork:true,publicationEpoch:0,publicationBusy:false,publicationDisposed:false,$store:{state:store.state,dispatch},$refs:{'BottomMenuRefselect-week':{weeksSelected:[{week:'S1',isoYear:2027,startDate:'2027-01-04',selected:true}],close:vi.fn()}},infosPublish:{work:{depart:'Origin',destination:'Destination',sameHour:true,daysSelected:Array.from({length:7},(_,i)=>({dayName:['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][i],selected:i===0})),daysHour:[],hour:{home:'08:00',work:'18:00'},nbPassager:2,price:4,route:{infosGoogle:{duration:'900s'},polylineDecoded:[[0,0],[0,1]]},car:82}},GET_ID_VILLAGE_BY_NAME:name=>name==='Origin'?1:2,nextStepMode:vi.fn(),showError:vi.fn()};
 const input=()=>({driverId:'driver',villageDep:1,villageDest:2,maxSeats:2,price:4,car_id:82,route:{infosGoogle:{duration:'900s'},polylineDecoded:[[0,0],[0,1]]},weeksSelected:vm.$refs['BottomMenuRefselect-week'].weeksSelected,daysHour:Array.from({length:7},(_,i)=>({values:{home:i===0,work:false},hour:{home:'08:00'}}))});
 return {action,view,vm,insert,store,input};
}
for(const failure of ['throw','error'])it(`retries after ${failure} without publishing an unchecked week`,async()=>{
 const h=harness(failure);await h.view.methods.getSelected.call(h.vm);expect(h.vm.infosPublish.work.daysHour).toHaveLength(7);expect(h.store.state.profil.history.datesTripDriver).toEqual([]);
 await h.view.methods.getSelected.call(h.vm);expect(h.vm.infosPublish.work.daysHour).toHaveLength(7);expect(h.insert).toHaveBeenCalledTimes(2);
 const trips=h.insert.mock.calls[1][0];expect(trips).toHaveLength(2);expect(trips.map(t=>[t.departure_time.getFullYear(),t.departure_time.getMonth()+1,t.departure_time.getDate()])).toEqual([[2027,1,4],[2027,1,4]]);expect(h.store.state.profil.history.datesTripDriver).toHaveLength(2);
});
it('uses edited days and hours when the failed program is retried',async()=>{
 const h=harness('throw');await h.view.methods.getSelected.call(h.vm);h.vm.infosPublish.work.daysSelected[0].selected=false;h.vm.infosPublish.work.daysSelected[1].selected=true;h.vm.infosPublish.work.hour={home:'09:00',work:'20:30'};
 await h.view.methods.getSelected.call(h.vm);const rows=h.insert.mock.calls[1][0];expect(h.vm.infosPublish.work.daysHour).toHaveLength(7);expect(rows.map(t=>[t.departure_time.getDate(),t.departure_time.getHours(),t.departure_time.getMinutes()])).toEqual([[5,9,0],[5,20,30]]);
});
it('repairs an already accumulated same-hour draft by rebuilding its seven days',async()=>{
 const h=harness();h.vm.infosPublish.work.daysHour=Array.from({length:14},()=>({values:{home:true,work:true},hour:{home:'06:00',work:'16:00'}}));await h.view.methods.getSelected.call(h.vm);expect(h.vm.infosPublish.work.daysHour).toHaveLength(7);expect(h.insert.mock.calls[0][0].map(t=>t.departure_time.getDate())).toEqual([4,4]);
});
for(const count of [0,1,8,14])it(`rejects a malformed ${count}-day program before insertion`,async()=>{
 const h=harness(),input=h.input();input.daysHour=Array.from({length:count},()=>({values:{home:true,work:false},hour:{home:'08:00'}}));const result=await h.action({state:{}},input);expect(result.status).toBe(2);expect(result.message).toContain('sept jours');expect(h.insert).not.toHaveBeenCalled();expect(h.store.state.profil.history.datesTripDriver).toEqual([]);
});
for(const hour of ['27:00','08:60','invalid',null])it(`rejects an enabled invalid time ${hour}`,async()=>{
 const h=harness(),input=h.input();input.daysHour[0].hour.home=hour;expect((await h.action({state:{}},input)).status).toBe(2);expect(h.insert).not.toHaveBeenCalled();
});
it('rejects malformed day flags without throwing',async()=>{
 const h=harness(),input=h.input();input.daysHour[0]={values:null};expect((await h.action({state:{}},input)).status).toBe(2);expect(h.insert).not.toHaveBeenCalled();
});
it('preserves custom daily hours and a return-only journey',async()=>{
 const h=harness();h.vm.infosPublish.work.sameHour=false;h.vm.infosPublish.work.daysHour=Array.from({length:7},(_,i)=>({values:{home:false,work:i===2},hour:{home:'',work:'17:45'}}));
 await h.view.methods.getSelected.call(h.vm);const rows=h.insert.mock.calls[0][0];expect(rows).toHaveLength(1);expect(rows[0].departure_time.getDate()).toBe(6);expect(rows[0].departure_time.getHours()).toBe(17);expect(rows[0].departure_time.getMinutes()).toBe(45);expect(rows[0].village_departure_id).toBe(2);expect(rows[0].village_arrival_id).toBe(1);expect(h.vm.infosPublish.work.route.polylineDecoded).toEqual([[0,0],[0,1]]);
});
it('keeps a single outward journey within the selected week',async()=>{
 const h=harness(),input=h.input();expect((await h.action({state:{}},input)).status).toBe(0);const trips=h.insert.mock.calls[0][0];expect(trips).toHaveLength(1);expect(trips[0].departure_time.getDate()).toBe(4);expect(trips[0].village_departure_id).toBe(1);
});
it('keeps multiple selected weeks bounded to their own seven days',async()=>{
 const h=harness(),input=h.input();input.weeksSelected.push({week:'S2',isoYear:2027,startDate:'2027-01-11',selected:false},{week:'S3',isoYear:2027,startDate:'2027-01-18',selected:true});expect((await h.action({state:{}},input)).status).toBe(0);expect(h.insert.mock.calls[0][0].map(t=>t.departure_time.getDate())).toEqual([4,18]);
});
