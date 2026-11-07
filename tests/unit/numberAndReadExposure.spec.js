import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import {parse} from '@vue/compiler-sfc';
import {compile} from '@vue/compiler-dom';
import * as Vue from 'vue';
import {it,expect,vi,afterEach} from 'vitest';
import * as utils from '@/utils/utils.js';
import {recordMessageExposure} from '@/services/messageReadExposure.js';
function load(file,deps={}){
 let source=readFileSync(file,'utf8');if(file.endsWith('.vue'))source=parse(source).descriptor.script.content;
 const m={exports:{}};new Function('module','exports','require',transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>deps[id]||(id.endsWith('utils.js')?utils:id.endsWith('messageReadExposure.js')?{recordMessageExposure}:{mapState:()=>({}),mapActions:()=>({}),mapMutations:()=>({}),defineComponent:x=>x,Capacitor:{getPlatform:()=> 'web',isNativePlatform:()=>false}}));return m.exports.default;
}
let app;afterEach(()=>{app?.unmount();app=null;document.body.innerHTML='';vi.restoreAllMocks();});
function pickers(){
 const path='src/components/menus/bottom/SelectNumber.vue',c=load(path),render=new Function('Vue',compile(parse(readFileSync(path,'utf8')).descriptor.template.content,{mode:'function',prefixIdentifiers:true}).code)(Vue);
 app=Vue.createApp({components:{Picker:{...c,render}},data:()=>({low:1,high:8}),template:'<div><section id="a"><Picker ref="a" :min="low" :max="high" /></section><section id="b" style="visibility:hidden"><Picker ref="b" :min="1" :max="8" /></section></div>'});
 for(const name of ['v-card','v-btn','v-icon'])app.component(name,{render(){return Vue.h(name==='v-btn'?'button':'div',this.$attrs,this.$slots.default?.());}});
 const el=document.createElement('div');document.body.append(el);return app.mount(el);
}
const value=id=>document.querySelector('#'+id+' .number-value').textContent;
it('keeps hidden amounts unchanged and submits the same value as displayed',async()=>{
 const vm=pickers();await Vue.nextTick();document.querySelector('#a [aria-label="Augmenter la valeur"]').click();await Vue.nextTick();expect(value('a')).toBe('2');expect(value('b')).toBe('1');expect(vm.$refs.b.number).toBe(1);
 const menu=load('src/components/menus/BottomMenu.vue',{'@/utils/requestId.js':{createRequestId:()=> 'fixture-attempt'}}),transfertGain=vi.fn(async()=>({status:0,message:'fixture success'}));
 await menu.methods.recharger.call({moneyEpoch:0,open_b:true,modeDriver:true,modeCo:'online',$store:{state:{profil:{userUid:'same-user',accountGeneration:1}}},$refs:{SelectNumberRef:vm.$refs.b},transfertGain,$emit:vi.fn()});expect(transfertGain).toHaveBeenCalledWith(expect.objectContaining({credit:1}));
});
it('resetting a second picker cannot change the first displayed amount',async()=>{const vm=pickers();await Vue.nextTick();vm.$refs.a.setNumber(4);vm.$refs.b.setNumber(1);await Vue.nextTick();expect(value('a')).toBe('4');expect(vm.$refs.a.number).toBe(4);});
it('rapid changes and boundaries remain local to the component',async()=>{const vm=pickers();await Vue.nextTick();for(let i=0;i<20;i++)vm.$refs.a.plus();for(let i=0;i<3;i++)vm.$refs.a.moin();await Vue.nextTick();expect(value('a')).toBe('5');vm.$refs.a.setNumber(8);await Vue.nextTick();expect(document.querySelector('#a [aria-label="Augmenter la valeur"]').disabled).toBe(true);expect(document.querySelector('#b [aria-label="Augmenter la valeur"]').disabled).toBe(false);});
it('reacts to changed bounds including a non-one minimum',async()=>{const vm=pickers();await Vue.nextTick();vm.$refs.a.setNumber(5);vm.low=2;vm.high=3;await Vue.nextTick();await Vue.nextTick();expect(value('a')).toBe('3');vm.$refs.a.setNumber(1);await Vue.nextTick();expect(value('a')).toBe('2');expect(vm.$refs.a.number).toBe(2);});
it.each([NaN,Infinity,-Infinity])('replaces invalid selected number %s',async n=>{const vm=pickers();await Vue.nextTick();vm.$refs.a.setNumber(n);await Vue.nextTick();expect(value('a')).toBe('1');});
function readHarness(rect){
 const request=vi.fn(async()=>({})),c=load('src/views/trip/Chat.vue',{'@/services/tripMessaging.js':{chatRequest:request,conversationPath:(trip,peer)=>`/trips/${trip}/conversations/${peer}`}});
 const el=document.createElement('article');el.dataset.messageId='42';el.getBoundingClientRect=()=>rect.current;const box=document.createElement('div');box.append(el);box.getBoundingClientRect=()=>({top:100,bottom:600});document.body.append(box);
 const vm={...c.data(),activeView:()=>true,peerId:'peer',tripId:8,socket:{connected:true,emit:vi.fn()},$refs:{history:box},serverMessages:[{id:'42',to:'user',readAt:null}],userUid:'user',presence:vi.fn(),epoch:1,$store:{dispatch:vi.fn(),commit:vi.fn()},modeCo:'online'};
 return {vm,request,c,run:()=>c.methods.markVisibleRead.call(vm)};
}
it('marks a long message read only after the whole text was exposed',async()=>{const rect={current:{top:100,bottom:900}},h=readHarness(rect);await h.run();expect(h.request).not.toHaveBeenCalled();rect.current={top:-100,bottom:700};await h.run();expect(h.request).not.toHaveBeenCalled();rect.current={top:-200,bottom:600};await h.run();expect(h.request).toHaveBeenCalledWith('post',expect.stringContaining('/read'),'online',{messageIds:['42']});});
it('supports bottom-first exposure caused by automatic scrolling',async()=>{const rect={current:{top:-200,bottom:600}},h=readHarness(rect);await h.run();expect(h.request).not.toHaveBeenCalled();rect.current={top:100,bottom:900};await h.run();expect(h.request).toHaveBeenCalledOnce();});
it('does not infer reading skipped content between the ends',()=>{let s=recordMessageExposure(undefined,{top:100,bottom:2100},{top:100,bottom:600});s=recordMessageExposure(s,{top:-1400,bottom:600},{top:100,bottom:600});expect(s.complete).toBe(false);expect(s.segments).toEqual([[0,500],[1500,2000]]);});
it('counts overlapping parts once and resets geometry on layout changes',()=>{let s=recordMessageExposure(undefined,{top:100,bottom:900},{top:100,bottom:600});s=recordMessageExposure(s,{top:100,bottom:900},{top:100,bottom:600});expect(s.complete).toBe(false);s=recordMessageExposure(s,{top:-300,bottom:600},{top:100,bottom:600});expect(s.complete).toBe(false);expect(s.height).toBe(900);});
it.each(['inactive','disconnected','no-peer','off-screen'])('does not record exposure when %s',async mode=>{const h=readHarness({current:mode==='off-screen'?{top:610,bottom:690}:{top:110,bottom:170}});if(mode==='inactive')h.vm.activeView=()=>false;if(mode==='disconnected')h.vm.socket.connected=false;if(mode==='no-peer')h.vm.peerId='';await h.run();expect(h.request).not.toHaveBeenCalled();expect(h.vm.readExposure).toEqual({});});
it('marks a short visible message and prunes acknowledged exposure',async()=>{const h=readHarness({current:{top:110,bottom:170}});await h.run();expect(h.request).toHaveBeenCalledOnce();h.vm.serverMessages[0].readAt='ack';await h.run();expect(h.vm.readExposure).toEqual({});expect(h.request).toHaveBeenCalledOnce();});
it('retries a failed receipt with previously observed content',async()=>{const h=readHarness({current:{top:110,bottom:170}});h.request.mockRejectedValueOnce(Error('offline'));await h.run();expect(h.vm.reading).toBe(false);await h.run();expect(h.request).toHaveBeenCalledTimes(2);});
it('collects visible parts during another pending receipt without concurrent requests',async()=>{const h=readHarness({current:{top:110,bottom:170}});h.vm.reading=true;await h.run();expect(h.request).not.toHaveBeenCalled();expect(h.vm.readExposure['42'].complete).toBe(true);h.vm.reading=false;await h.run();expect(h.request).toHaveBeenCalledOnce();});
it('resets observed content on conversation or trip navigation',()=>{const h=readHarness({current:{top:110,bottom:170}});h.vm.readExposure={'42':{complete:true}};h.vm.refreshHistory=vi.fn();h.c.watch.peerId.call(h.vm);expect(h.vm.readExposure).toEqual({});h.vm.readExposure={'42':{complete:true}};h.c.methods.reset.call(h.vm);expect(h.vm.readExposure).toEqual({});});
