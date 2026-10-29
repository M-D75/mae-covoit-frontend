import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {describe,it,expect,vi} from 'vitest';
import {readProfilePhoto,saveProfilePhoto,validateProfilePhotoFile} from '@/services/profilePhoto.js';
import {fetchProfileHistory} from '@/services/profileHistory.js';
import * as ratingPrefs from '@/services/ratingPreferences.js';
import {SLOGANS,chooseSlogan,getLaunchSlogan} from '@/services/launchSlogan.js';
import {helpState,requestContextHelp,markHelpSeen} from '@/services/contextualHelp.js';
const load=(file,resolve)=>{let source=readFileSync(file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,resolve);return m.exports.default;};
describe('profile photo persistence',()=>{
 const image='data:image/jpeg;base64,YWJj';
 function client(result,user='owner'){const q={update:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),select:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue(result)};return {auth:{getUser:async()=>({data:{user:{id:user}}})},from:vi.fn(()=>q),q};}
 it('rejects unsupported and oversized input before reading, and reports reader failure',async()=>{
  expect(()=>validateProfilePhotoFile({type:'image/svg+xml',size:4})).toThrow();expect(()=>validateProfilePhotoFile({type:'image/png',size:3000001})).toThrow();
  class Reader{readAsDataURL(){this.onerror();}}
  await expect(readProfilePhoto({type:'image/png',size:4},{Reader})).rejects.toThrow('ne peut pas être lue');
 });
 it('requires the authenticated owner and a returned persisted avatar',async()=>{
  const c=client({data:{user_id:'owner',avatar:image},error:null});expect(await saveProfilePhoto(c,'owner',image)).toBe(image);expect(c.q.eq).toHaveBeenCalledWith('user_id','owner');
  const wrong=client({},'other');await expect(saveProfilePhoto(wrong,'owner',image)).rejects.toThrow('session');expect(wrong.from).not.toHaveBeenCalled();
  await expect(saveProfilePhoto(client({data:null,error:{code:'42501'}}),'owner',image)).rejects.toThrow('ancienne photo');
  await expect(saveProfilePhoto(client({data:null,error:null}),'owner',image)).rejects.toThrow('ancienne photo');
 });
 it('does not navigate or leave a loading overlay after failed photo save',async()=>{
  const component=load('src/components/profile/CropperAvatar.vue',id=>id==='vue'?{defineComponent:x=>x}:id==='vuex'?{mapState:()=>({}),mapMutations:()=>({}),mapActions:()=>({})}:id.endsWith('profilePhoto.js')?{croppedProfilePhoto:()=>image}:{});
  const vm={...component.data(),userUid:'owner',avatarDraft:{owner:'owner'},$refs:{cropper:{getResult:()=>({canvas:{}})}},updateAvatar:vi.fn().mockRejectedValue(Error('save failed')),$router:{replace:vi.fn()}};
  await component.methods.crop.call(vm);expect(vm.overlayLoad).toBe(false);expect(vm.showSnackbarError).toBe(true);expect(vm.$router.replace).not.toHaveBeenCalled();
 });
});
describe('actual history data',()=>{
 it('loads both owned roles, deduplicates passenger seats and does not invent a price',async()=>{
  const trip={id:1,departure_time:'2026-10-28T10:00:00Z',village_departure_id:70,village_arrival_id:48,price:null};const queries=[];
  const client={from:vi.fn(table=>{const q={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),gte:vi.fn().mockReturnThis(),lt:vi.fn().mockReturnThis(),then(resolve){return Promise.resolve({data:table==='booking'?[{trip,in_car:true,is_accepted:true},{trip,in_car:false}]:[{...trip,id:2,price:4}],error:null}).then(resolve);}};queries.push(q);return q;})};
  const rows=await fetchProfileHistory(client,{userId:'owner',accountId:7,resolveVillage:id=>String(id)});
  expect(rows).toHaveLength(2);expect(rows.find(r=>r.role==='passenger')).toMatchObject({tripId:1,ratingEligible:true,price:null});expect(rows.find(r=>r.role==='driver').ratingEligible).toBe(false);
  expect(queries[0].eq).toHaveBeenCalledWith('passenger_account_id',7);expect(queries[1].eq).toHaveBeenCalledWith('driver_id','owner');
 });
});
describe('voluntary rating',()=>{
 it('keeps deferral preferences isolated per account and tolerates disabled storage',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  ratingPrefs.deferRating('one',7,storage);expect(ratingPrefs.isRatingDeferred('one',7,storage)).toBe(true);expect(ratingPrefs.isRatingDeferred('two',7,storage)).toBe(false);
  expect(()=>ratingPrefs.deferRating('one',7,{getItem(){throw Error('disabled');}})).not.toThrow();
 });
 it('leaves rating without posting an invented review and avoids the old navigation trap',()=>{
  const component=load('src/views/Rating.vue',id=>id==='vue'?{defineComponent:x=>x}:id==='vuex'?{mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({})}:id.endsWith('ratingPreferences.js')?ratingPrefs:{});
  const vm={...component.data(),userUid:'fixture-rating',ratings:{rating:true,data:[{trip_id:7}]},SET_RATINGS_REMOVE:vi.fn(),$router:{replace:vi.fn()}};
  for(const [key,method]of Object.entries(component.methods))vm[key]=method.bind(vm);vm.skip();
  expect(vm.SET_RATINGS_REMOVE).toHaveBeenCalledWith({id:7,markRated:false});expect(vm.$router.replace).toHaveBeenCalledWith('/search');
  const router=readFileSync('src/router/index.js','utf8');expect(router).not.toContain("return next('/rating')");expect(readFileSync('src/store/index.js','utf8')).not.toContain("'trip.ratings.rating'");
 });
});
describe('contextual help and session slogan',()=>{
 it('shows help only on an explicit successful-action hook, remembers the account and allows replay',()=>{
  const user='help-fixture-unique';expect(requestContextHelp(user,'passenger',{accepted:false})).toBe(true);expect(helpState.request.accepted).toBe(false);
  markHelpSeen(user,'passenger');expect(requestContextHelp(user,'passenger')).toBe(false);expect(requestContextHelp('other-help-user','passenger')).toBe(true);expect(requestContextHelp(user,'passenger',{replay:true})).toBe(true);helpState.request=null;
 });
 it('selects exactly one of the eleven approved slogans and keeps it stable in this runtime',()=>{
  expect(SLOGANS).toHaveLength(11);expect(chooseSlogan(()=>0)).toBe('À plusieurs, le quotidien va plus loin.');expect(chooseSlogan(()=>.999)).toBe('Karibu, une place vous attend.');
  const selected=getLaunchSlogan();const spy=vi.spyOn(Math,'random').mockReturnValue(.999);expect(getLaunchSlogan()).toBe(selected);expect(spy).not.toHaveBeenCalled();spy.mockRestore();
 });
});

it('binds Android back to the optional exit and removes only its own listener',async()=>{
 let callback;const remove=vi.fn();
 const component=load('src/views/Rating.vue',id=>id==='vue'?{defineComponent:x=>x}:id==='vuex'?{mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({})}:id==='@capacitor/core'?{Capacitor:{getPlatform:()=> 'android'}}:id==='@capacitor/app'?{App:{addListener:vi.fn((name,fn)=>{expect(name).toBe('backButton');callback=fn;return Promise.resolve({remove});})}}:{});
 const vm={disposed:false,ratingDriver:{},skip:vi.fn()};component.mounted.call(vm);await vi.waitFor(()=>expect(vm.backListener).toBeDefined());callback();expect(vm.skip).toHaveBeenCalledTimes(1);component.beforeUnmount.call(vm);expect(remove).toHaveBeenCalledTimes(1);
});

it('retains history trip identity and rating eligibility when grouping by month',async()=>{
 const {groupByDate,mapToObject}=await import('@/utils/utils.js');const row={tripId:91,role:'passenger',ratingEligible:true,departure_time:'2026-10-28T12:00:00Z'};
 const groups=mapToObject(groupByDate([row]));expect(Object.values(Object.values(groups)[0])[0][0]).toEqual(row);
});
