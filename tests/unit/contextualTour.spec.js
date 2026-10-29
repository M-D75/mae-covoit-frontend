import {describe,it,expect} from 'vitest';
import {helpSteps,placeHelp,saveHelpStep,loadHelpStep,requestContextHelp,helpState} from '@/services/contextualHelp.js';
describe('two actual trip targets',()=>{
 it('uses the real header and trip frame in a strict sequence',()=>{expect(helpSteps('driver').map(v=>v.target)).toEqual(['driver-passengers','driver-chat']);expect(helpSteps('passenger').map(v=>v.target)).toEqual(['passenger-driver','passenger-chat']);});
 it('keeps the frame and controls within a narrow screen, including scroll clipping',()=>{for(const rect of [{left:10,top:500,right:360,bottom:650},{left:-5,top:-20,right:400,bottom:150}]){const layout=placeHelp(rect,390,700);expect(layout.frame.left).toBeGreaterThanOrEqual(4);expect(layout.frame.top).toBeGreaterThanOrEqual(4);expect(layout.tip.left+layout.tip.width).toBeLessThanOrEqual(378);expect(layout.tip.top+160).toBeLessThanOrEqual(688);}});
 it('resumes the proper account and restarts only an explicit replay',()=>{const storage={getItem(){return null;},setItem(){}};saveHelpStep('tour-one','driver',1,storage);expect(loadHelpStep('tour-one','driver',storage)).toBe(1);expect(loadHelpStep('tour-two','driver',storage)).toBe(0);requestContextHelp('tour-one','driver');expect(helpState.request.step).toBe(1);requestContextHelp('tour-one','driver',{replay:true});expect(helpState.request.step).toBe(0);helpState.request=null;});
});

it('selects only the requested real trip and uses immediate scrolling for reduced motion without clicking it',async()=>{
 const {readFileSync}=await import('node:fs');const {parse}=await import('@vue/compiler-sfc');const {transformSync}=await import('@babel/core');const {vi}=await import('vitest');const service=await import('@/services/contextualHelp.js');
 const script=parse(readFileSync('src/components/ContextualHelp.vue','utf8')).descriptor.script.content,m={exports:{}};
 new Function('module','exports','require',transformSync(script,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>id.endsWith('contextualHelp.js')?service:{versionState:{dialogOpen:false}});
 const card=document.createElement('div');card.dataset.helpTripId='901';const target=document.createElement('div');target.dataset.contextHelp='driver-passengers';card.append(target);document.body.append(card);
 target.getClientRects=()=>[{}];target.getBoundingClientRect=()=>({left:20,top:100,right:340,bottom:160});target.scrollIntoView=vi.fn();target.click=vi.fn();const media=vi.spyOn(window,'matchMedia').mockReturnValue({matches:true});
 const vm={visible:true,request:{kind:'driver',tripId:901},step:0,steps:helpSteps('driver'),layout:null,scrolled:null,resizeObserver:{disconnect:vi.fn(),observe:vi.fn()},$refs:{}};
 try{m.exports.default.methods.locate.call(vm);expect(target.scrollIntoView).toHaveBeenCalledWith({block:'center',inline:'nearest',behavior:'auto'});expect(target.click).not.toHaveBeenCalled();expect(vm.layout.frame.width).toBeGreaterThan(0);vm.request.tripId=902;m.exports.default.methods.locate.call(vm);expect(vm.layout).toBeNull();}finally{media.mockRestore();card.remove();}
});
