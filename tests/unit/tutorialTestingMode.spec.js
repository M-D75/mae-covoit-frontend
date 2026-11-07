import {readFileSync} from 'node:fs';import {transformSync} from '@babel/core';import {parse} from '@vue/compiler-sfc';import {describe,it,expect,vi} from 'vitest';
function service(mode){const m={exports:{}};new Function('module','exports','require','process',transformSync(readFileSync('src/services/contextualHelp.js','utf8'),{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,()=>({reactive:x=>x}),{env:{NODE_ENV:mode}});return m.exports;}
function component(s){const m={exports:{}};new Function('module','exports','require',transformSync(parse(readFileSync('src/components/ContextualHelp.vue','utf8')).descriptor.script.content,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code)(m,m.exports,id=>id.endsWith('contextualHelp.js')?s:{versionState:{}});return m.exports.default;}
describe('tutorial cache by account and role',()=>{
 it.each(['development','production','test'])('remembers completion and progress after a new runtime in %s',mode=>{
  const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const first=service(mode);expect(first.tutorialTestingMode).toBe(false);
  first.markHelpSeen('one','driver',storage);first.saveHelpStep('one','driver',1,storage);
  const next=service(mode);expect(next.hasSeenHelp('one','driver',storage)).toBe(true);expect(next.loadHelpStep('one','driver',storage)).toBe(1);
  expect(next.hasSeenHelp('two','driver',storage)).toBe(false);expect(next.hasSeenHelp('one','passenger',storage)).toBe(false);expect(next.loadHelpStep('two','driver',storage)).toBe(0);
 });
 it('does not restart completed help automatically, but allows explicit replay',()=>{
  const s=service('development');s.markHelpSeen('one','driver');
  expect(s.requestContextHelp('one','driver')).toBe(false);expect(s.requestContextHelp('one','driver',{replay:true})).toBe(true);expect(s.helpState.request.step).toBe(0);
 });
 it('preserves an active tour when another action requests the same help',()=>{
  const s=service('development');expect(s.requestContextHelp('other','driver')).toBe(true);s.helpState.request.step=1;expect(s.requestContextHelp('other','driver')).toBe(false);expect(s.helpState.request.step).toBe(1);
 });
 it.each(['development','production'])('does not force the tutorial at every profile entry in %s',mode=>{
  const s=service(mode);component(s).methods.startDevelopmentEntry.call({developmentEntryStarted:false,userId:'one',onProfile:true,request:null});expect(s.helpState.request).toBeNull();
 });
 it('retains in-memory progress if browser storage is unavailable',()=>{
  const s=service('development'),storage={getItem(){throw Error('disabled');},setItem(){throw Error('disabled');}};
  expect(()=>s.markHelpSeen('one','passenger',storage)).not.toThrow();s.saveHelpStep('one','passenger',1,storage);expect(s.hasSeenHelp('one','passenger',storage)).toBe(true);expect(s.loadHelpStep('one','passenger',storage)).toBe(1);
 });
});
