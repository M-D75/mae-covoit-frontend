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
 const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>id==='__stripeFixture'?sdk:id.endsWith('paymentSession.js')?{paymentSession}:deps[id]||(id.endsWith('travelPreferences.js')?preferences:{Capacitor:{getPlatform:()=> 'web'},mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),defineComponent:x=>x}));return m.exports.default;
}
const clone=x=>JSON.parse(JSON.stringify(x));
function query(result){return {select(){return this},eq(){return this},then(resolve){return Promise.resolve(result).then(resolve)}};}
it('abandons a token response after unmount and account switch',async()=>{
 let finish;const sdk={createToken:vi.fn(()=>new Promise(resolve=>{finish=resolve}))},sent=[];
 const profile={userUid:'A',accountGeneration:1,modeCo:'online'};
 const request=vi.fn(async(method,path,options)=>{sent.push({method,path,options,currentUser:profile.userUid});return {data:{card:{id:'card_fixture'}}};});
 const c=load('src/views/StripeCheckout.vue',{'@/utils/serverApi.js':{serverRequest:request}},sdk);
 const vm={...c.data(),card:{unmount:vi.fn()},$store:{state:{profil:profile}},$emit:vi.fn(),hasStripeFocus:()=>false,unbindStripeFocusEvents:vi.fn()};
 const pending=c.methods.submitCard.call(vm,{preventDefault:vi.fn()});await vi.waitFor(()=>expect(sdk.createToken).toHaveBeenCalledTimes(1));
 c.beforeUnmount.call(vm);profile.userUid='B';profile.accountGeneration=2;finish({token:{id:'tok_fixture_from_A'}});await pending;
 expect(sent).toHaveLength(0);expect(vm.$emit).not.toHaveBeenCalledWith('card-registered');
});
describe('saved-card selection',()=>{
 const c=()=>load('src/components/menus/bottom/SelectCreditCard.vue');
 it('selects distinct saved cards with the same last4 after confirmation',()=>{
  const vm={$store:{state:{profil:{userUid:'A',accountGeneration:1}}},cards:[{id:'card_A',last4:'4242',select:true},{id:'card_B',last4:'4242',select:false}],$emit:vi.fn(),load:false};
  c().methods.select.call(vm,1);expect(vm.cards[0].select).toBe(true);expect(vm.cards[1].select).toBe(false);expect(vm.cardSelected.id).toBe('card_B');expect(vm.$emit).toHaveBeenCalledWith('card-selected');c().methods.confirmSelection.call(vm,'card_B');expect(vm.cards[1].select).toBe(true);expect(vm.cards[0].select).toBe(false);
 });
 it('baseline: distinct last4 select the requested card',()=>{
  const vm={$store:{state:{profil:{userUid:'A',accountGeneration:1}}},cards:[{id:'card_A',last4:'4242',select:true},{id:'card_B',last4:'0003',select:false}],$emit:vi.fn(),load:false};
  c().methods.select.call(vm,1);expect(vm.cards[0].select).toBe(true);expect(vm.cards[1].select).toBe(false);expect(vm.cardSelected.id).toBe('card_B');expect(vm.$emit).toHaveBeenCalledWith('card-selected');
 });
});
function memberHarness(){
 const calls=[];const profile={id:2,user_id:'driver',username:'Driver fixture',firstname:'Driver',lastname:'Fixture',settings:{prefer:[1,2,1,1]}};
 const request=vi.fn(async(method,path)=>{calls.push(path);return path.startsWith('/ratings/')?{data:{status:'ok',data:{averageScore:4.5,satisfaction:90,rating:{good:[],bad:[]}}}}:{data:{status:'ok',data:{payoutsEnabled:false}}};});
 const t=load('src/store/trip.js',{'@/utils/supabaseClient.js':{from:table=>query(table==='public_profile'?{data:[profile]}:{count:7})},'@/utils/serverApi.js':{serverRequest:request}}),state=clone(t.state),rootState={profil:{userUid:'owner',accountGeneration:1,modeCo:'online'},trip:state};
 const r=load('src/store/rating.js',{'@/utils/serverApi.js':{serverRequest:request}}),ratingState=clone(r.state);
 return {calls,state,rootState,getProfilMember:args=>t.actions.getProfilMember({state,rootState,dispatch:(_,a)=>r.actions.getRating({state:ratingState,rootState},a)},args),getRating:args=>r.actions.getRating({state:ratingState,rootState},args)};
}
describe('member rating entry points',()=>{
 it('loads actual driver ratings from results',async()=>{
  const h=memberHarness(),c=load('src/views/Results.vue'),open=vi.fn();const vm={infos:{id:7,driver_id:'driver'},SET_TRIP_SELECTED:vi.fn(),getProfilMember:h.getProfilMember,$refs:{BottomMenuRefResults:{loading:false},PaneApearProfilMemberRef:{open}}};
  await c.methods.openProfilMember.call(vm);expect(open).toHaveBeenCalledTimes(1);expect(h.state.member.notation.avis).toBe(4.5);expect(h.calls.filter(path=>path.startsWith('/ratings/'))).toHaveLength(1);
  const panel=load('src/components/profile/ProfilMemberComp.vue'),labels={ratingStatus:h.state.member.ratingStatus,avis:h.state.member.notation.avis,satisfaction:h.state.member.notation.satisfaction,infos_panneau:[{},{},{}]};panel.methods.updateNotationLabels.call(labels);expect(labels.infos_panneau[1].label).toBe('4,5/5');expect(labels.infos_panneau[2].label).toBe('90%');
 });
 it('loads the driver summary once from home',async()=>{
  const h=memberHarness(),c=load('src/views/HomeSearch.vue'),open=vi.fn();const vm={travel:{id:7,driver_id:'driver'},SET_TRIP_SELECTED:vi.fn(),getProfilMember:h.getProfilMember,getRating:h.getRating,$refs:{BottomMenuRefResults:{loading:false},PaneApearProfilMemberRef:{open}}};Object.defineProperty(vm,'member',{get:()=>h.state.member});
  await c.methods.openProfilMember.call(vm);expect(open).toHaveBeenCalledTimes(1);expect(h.state.member.notation.avis).toBe(4.5);expect(h.calls.filter(path=>path.startsWith('/ratings/'))).toHaveLength(1);
 });
});
it('discards late personal statistics after account switch',async()=>{
 let finish;const c=load('src/store/profil.js',{'@/utils/supabaseClient.js':{from:()=>query({count:7})},'@/utils/serverApi.js':{serverRequest:()=>new Promise(resolve=>{finish=resolve})}}),state=clone(c.state);Object.assign(state,{userUid:'A',userId:1,accountGeneration:1});
 const pending=c.actions.getNotation({state});c.mutations.SET_USER_UID(state,'B');state.userId=2;finish({data:{status:'ok',data:{averageScore:5,satisfaction:100}}});await pending;
 expect(state.userUid).toBe('B');expect(state.profil.nbTrip).toBe(0);expect(state.profil.avis).toBe(0);expect(state.profil.satisfaction).toBe(0);
});

for(const changed of ['account','generation','unmount','intent','mode']) it(`invalidates payment context after ${changed}`,async()=>{
 const vm={$store:{state:{profil:{userUid:'A',accountGeneration:1,modeCo:'online'}}},activePaymentIntentId:'pi_A',mode:'payment-card'};
 const session=paymentSession(vm);expect(session.current()).toBe(true);
 if(changed==='account')vm.$store.state.profil.userUid='B';
 if(changed==='generation')vm.$store.state.profil.accountGeneration++;
 if(changed==='unmount')vm.paymentDisposed=true;
 if(changed==='intent')vm.activePaymentIntentId='pi_B';
 if(changed==='mode')vm.mode='register-card';
 expect(session.current()).toBe(false);expect(paymentSession(vm).current()).toBe(false);
 await expect(session.wait(Promise.resolve(1))).rejects.toMatchObject({code:'SESSION_CHANGED'});
});
it('binds a normal card registration to its initial owner',async()=>{
 const request=vi.fn(async()=>({data:{card:{id:'card_A'}}}));
 const c=load('src/views/StripeCheckout.vue',{'@/utils/serverApi.js':{serverRequest:request}},{createToken:async()=>({token:{id:'tok_fixture'}})});
 const vm={...c.data(),card:{},$store:{state:{profil:{userUid:'A',accountGeneration:1,modeCo:'online'}}},$emit:vi.fn()};
 await c.methods.submitCard.call(vm,{preventDefault:vi.fn()});
 expect(request).toHaveBeenCalledWith('post','/payments/card-source',expect.objectContaining({expectedUserId:'A',data:{token:'tok_fixture'}}));
 expect(vm.$emit).toHaveBeenCalledWith('card-registered');expect(vm.loading).toBe(false);
});
it('ignores payment confirmation after account switch',async()=>{
 let finish;const request=vi.fn(),sdk={confirmPayment:vi.fn(()=>new Promise(r=>finish=r))};
 const c=load('src/views/StripeCheckout.vue',{'@/utils/serverApi.js':{serverRequest:request}},sdk);
 const profile={userUid:'A',accountGeneration:1},vm={...c.data(),activePaymentIntentId:'pi_A',elements:{},$store:{state:{profil:profile},dispatch:vi.fn()},$emit:vi.fn()};
 const pending=c.methods.submitPayment.call(vm,{preventDefault:vi.fn()});await vi.waitFor(()=>expect(sdk.confirmPayment).toHaveBeenCalledTimes(1));profile.userUid='B';finish({paymentIntent:{id:'pi_A',status:'succeeded'}});await pending;
 expect(request).not.toHaveBeenCalled();expect(vm.$store.dispatch).not.toHaveBeenCalled();expect(vm.$emit).not.toHaveBeenCalled();
});
it('shows unavailable ratings without inventing a zero score',()=>{
 const c=load('src/components/profile/ProfilMemberComp.vue');
 const vm={ratingStatus:'error',avis:0,satisfaction:0,infos_panneau:[{},{},{}]};c.methods.updateNotationLabels.call(vm);expect(vm.infos_panneau[1].label).toBe('—');expect(vm.infos_panneau[2].label).toBe('—');
});

it('discards saved cards loaded after an account switch',async()=>{
 let finish;const c=load('src/components/menus/bottom/SelectCreditCard.vue',{'@/utils/serverApi.js':{serverRequest:()=>new Promise(r=>finish=r)}});
 const profile={userUid:'A',accountGeneration:1},vm={...c.data(),$store:{state:{profil:profile}},$emit:vi.fn(),SET_CREDIT_CARD:vi.fn()};
 const pending=c.mounted.call(vm);profile.userUid='B';finish({data:{customer:{default_source:'card_A'},data:[{id:'card_A',card:{last4:'4242'}}]}});await pending;
 expect(vm.cards).toEqual([]);expect(vm.SET_CREDIT_CARD).not.toHaveBeenCalled();
});
it('retains the previous card when the server rejects a new selection',async()=>{
 const c=load('src/components/menus/BottomMenu.vue',{'@/utils/serverApi.js':{serverRequest:async()=>{throw new Error('rejected');}}});
 const child={$store:{state:{profil:{userUid:'A',accountGeneration:1}}},cardSelected:{id:'card_B'},defaultSource:'card_A',load:true,confirmSelection:vi.fn()};
 const vm={$refs:{SelectCreditCardRef:child},SET_CREDIT_CARD:vi.fn()};
 await c.methods.updateDefaultSourcePayment.call(vm);
 expect(child.defaultSource).toBe('card_A');expect(child.confirmSelection).not.toHaveBeenCalled();expect(vm.SET_CREDIT_CARD).not.toHaveBeenCalled();expect(child.load).toBe(false);expect(vm.showSnackbarError).toBe(true);
});
it('confirms the selected card only after server acceptance',async()=>{
 const request=vi.fn(async()=>({data:{metadata:{source_selected:'card_B'}}}));
 const c=load('src/components/menus/BottomMenu.vue',{'@/utils/serverApi.js':{serverRequest:request}});
 const child={$store:{state:{profil:{userUid:'A',accountGeneration:1}}},cardSelected:{id:'card_B'},load:true,confirmSelection:vi.fn()};
 const vm={$refs:{SelectCreditCardRef:child},SET_CREDIT_CARD:vi.fn()};await c.methods.updateDefaultSourcePayment.call(vm);
 expect(child.confirmSelection).toHaveBeenCalledWith('card_B');expect(vm.SET_CREDIT_CARD).toHaveBeenCalledWith(child.cardSelected);expect(request.mock.calls[0][2].expectedUserId).toBe('A');
});
it('discards default card confirmation when the account changes',async()=>{
 let finish;const c=load('src/components/menus/BottomMenu.vue',{'@/utils/serverApi.js':{serverRequest:()=>new Promise(r=>finish=r)}});
 const profile={userUid:'A',accountGeneration:1},child={$store:{state:{profil:profile}},cardSelected:{id:'card_B'},load:true,confirmSelection:vi.fn()},vm={$refs:{SelectCreditCardRef:child},SET_CREDIT_CARD:vi.fn()};
 const pending=c.methods.updateDefaultSourcePayment.call(vm);profile.userUid='B';finish({data:{metadata:{source_selected:'card_B'}}});await pending;expect(child.confirmSelection).not.toHaveBeenCalled();expect(vm.SET_CREDIT_CARD).not.toHaveBeenCalled();
});
it('does not finalize a previous payment when the intent response arrives after unmount',async()=>{
 let finish;const request=vi.fn(()=>new Promise(r=>finish=r));const c=load('src/views/StripeCheckout.vue',{'@/utils/serverApi.js':{serverRequest:request}},{});
 const vm={...c.data(),activePaymentIntentId:'pi_A',$store:{state:{profil:{userUid:'A',accountGeneration:1}},dispatch:vi.fn()},$emit:vi.fn()};
 const pending=c.methods.mountPay.call(vm);vm.paymentDisposed=true;finish({data:{id:'pi_A',status:'succeeded'}});await pending;expect(request).toHaveBeenCalledTimes(1);expect(vm.$store.dispatch).not.toHaveBeenCalled();expect(vm.$emit).not.toHaveBeenCalled();
});
it('prevents duplicate registration submits',async()=>{
 let finish;const sdk={createToken:vi.fn(()=>new Promise(r=>finish=r))};const request=vi.fn(async()=>({data:{card:{id:'card_A'}}}));const c=load('src/views/StripeCheckout.vue',{'@/utils/serverApi.js':{serverRequest:request}},sdk);
 const vm={...c.data(),card:{},$store:{state:{profil:{userUid:'A',accountGeneration:1}}},$emit:vi.fn()};const event={preventDefault:vi.fn()};
 const first=c.methods.submitCard.call(vm,event);await vi.waitFor(()=>expect(sdk.createToken).toHaveBeenCalledTimes(1));await c.methods.submitCard.call(vm,event);finish({token:{id:'tok_fixture'}});await first;expect(sdk.createToken).toHaveBeenCalledTimes(1);expect(request).toHaveBeenCalledTimes(1);
});
it('keeps personal statistics for the most recent request',async()=>{
 const pending=[];const c=load('src/store/profil.js',{'@/utils/supabaseClient.js':{from:()=>query({count:7})},'@/utils/serverApi.js':{serverRequest:()=>new Promise(r=>pending.push(r))}}),state=clone(c.state);Object.assign(state,{userUid:'A',userId:1,accountGeneration:1});
 const first=c.actions.getNotation({state}),second=c.actions.getNotation({state});
 pending[1]({data:{status:'ok',data:{averageScore:4,satisfaction:80}}});expect((await second).status).toBe(0);
 pending[0]({data:{status:'ok',data:{averageScore:1,satisfaction:20}}});expect(await first).toMatchObject({stale:true});expect(state.profil.avis).toBe(4);expect(state.profil.satisfaction).toBe(80);
});
it('shows real statistics on the complete member page',()=>{
 const c=load('src/views/profil/ProfilMember.vue',{'@/utils/utils.js':{formatNumber:String}});
 const panels=c.computed.infos_panneau.call({nbTrip:7,avis:4.5,satisfaction:90,ratingStatus:'ready'});
 expect(panels.map(p=>p.label)).toEqual(['7','4,5/5','90%']);
});
it('does not present fixed scores when the complete member page has no summary',()=>{
 const c=load('src/views/profil/ProfilMember.vue',{'@/utils/utils.js':{formatNumber:String}});
 expect(c.computed.infos_panneau.call({nbTrip:7,avis:0,satisfaction:0,ratingStatus:'error'}).map(p=>p.label)).toEqual(['7','—','—']);
});
