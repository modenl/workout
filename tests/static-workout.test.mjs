import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const [library, motion, app, wav] = await Promise.all(['public/library.js','public/motion.js','public/app.js','public/audio/count-cycle.wav'].map((p,i)=>readFile(new URL(p,root),i===3?undefined:'utf8')));
function harness({deferred=false,blockedStorage=false}={}) {
  let now=0;const nodes=[],resumers=[],elements=new Map(),timers=new Map();let timerId=0;
  const makeElement=()=>({textContent:'',innerHTML:'',hidden:false,dataset:{},style:{},disabled:false,tagName:'BUTTON',classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false},querySelectorAll(){return Array.from({length:4},makeElement)},getBoundingClientRect(){return {width:0,height:0}}});
  const el=id=>{if(!elements.has(id))elements.set(id,makeElement());return elements.get(id)};
  el('count-audio-source').dataset.src='data:audio/wav;base64,'+wav.toString('base64');
  class AudioContext {
    constructor(){this.state=deferred?'suspended':'running';this.currentTime=0;this.sampleRate=48000;this.destination={};}
    createGain(){return {connect(){},gain:{setValueAtTime(){}}}}
    createBuffer(channels,length,rate){const data=new Float32Array(length);return {duration:length/rate,getChannelData(){return data}}}
    createBufferSource(){const node={connect(){},disconnect(){},start(...args){this.started=args},stop(){this.stopped=true}};nodes.push(node);return node}
    addEventListener(){}
    resume(){if(deferred)return new Promise(resolve=>resumers.push(()=>{this.state='running';resolve()}));this.state='running';return Promise.resolve()}
  }
  const document={hidden:false,getElementById:el,querySelectorAll(){return []},addEventListener(){},activeElement:makeElement(),body:makeElement()};
  const context=vm.createContext({document,window:{AudioContext,crypto:webcrypto,matchMedia:()=>({matches:false}),addEventListener(){}},localStorage:{getItem(){if(blockedStorage)throw Error('blocked');return null},setItem(){if(blockedStorage)throw Error('blocked')}},performance:{now:()=>now*1000},requestAnimationFrame(){},atob:s=>Buffer.from(s,'base64').toString('binary'),setTimeout(fn){const id=++timerId;timers.set(id,fn);return id},clearTimeout:id=>timers.delete(id),console});
  vm.runInContext(library+'\n'+motion+'\n'+app+'\n;globalThis.subject={Motion,ITEMS,state,audio,newPlan,openPractice,closePractice,resumePractice,pausePractice,toggleVoice,navigateExercise,frame,holdRest,restNext,testSound,getPlan:()=>plan};',context);
  return {s:context.subject,el,nodes,resumers,timers,setNow(t){now=t}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('21 poses have connected, fixed-length limbs and finite joints',()=>{
  const {s}=harness();assert.equal(s.ITEMS.length,21);
  const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
  for(const item of s.ITEMS)for(const side of [-1,1])for(const t of [0,.25,.5,.75,1]){
    const p=s.Motion.pose(item.id,t,side);
    for(const a of p.arms){assert.ok(Math.abs(dist(a.sh,a.elbow)-56)<.001,item.id+' upper arm');assert.ok(Math.abs(dist(a.elbow,a.hand)-54)<.001,item.id+' forearm')}
    for(const l of p.legs){assert.ok(Math.abs(dist(l.h,l.k)-76)<.001,item.id+' thigh');assert.ok(Math.abs(dist(l.k,l.f)-76)<.001,item.id+' shin');assert.ok(Math.abs(dist(l.f,l.toe)-23)<.001,item.id+' foot')}
    assert.doesNotMatch(JSON.stringify(p),/null|NaN/);
  }
});
test('wall push keeps palms on wall; calf raises keep toes planted',()=>{
  const {s}=harness();for(const t of [0,.25,.5,.75,1]){
    const wall=s.Motion.pose('wallPush',t);for(const a of wall.arms)assert.ok(Math.abs(a.hand[2]-132)<.001);
    for(const id of ['heel','seatedHeel']){const p=s.Motion.pose(id,t);for(const l of p.legs){assert.equal(l.toe[1],id==='heel'?10:12);assert.equal(l.toe[2],id==='heel'?29:31)}}
  }
});
test('changing plans preserves all 7 categories, with no repeated previous move',()=>{
  const {s}=harness({blockedStorage:true});const variants=new Set();
  for(let n=0;n<100;n++){const previous=s.getPlan().map(x=>x.id);s.newPlan();const next=s.getPlan();assert.equal(new Set(next.map(x=>x.key)).size,7);next.forEach((x,i)=>assert.notEqual(x.id,previous[i]));variants.add(next.map(x=>x.id).join(','))}
  assert.ok(variants.size>30);
});
test('embedded recording has audible samples in each of the four beats',()=>{
  const {s}=harness();s.audio.ensure();assert.equal(s.audio.buffer.duration,4);const data=s.audio.buffer.getChannelData(0);
  for(let beat=0;beat<4;beat++){let sum=0;for(const x of data.slice(beat*16000,(beat+1)*16000))sum+=x*x;assert.ok(Math.sqrt(sum/16000)>.005)}
});
test('closing during a pending audio unlock never starts a count track',async()=>{
  const {s,resumers,nodes}=harness({deferred:true});s.openPractice();s.closePractice();resumers.forEach(r=>r());await settle();assert.equal(s.state.mode,'closed');assert.equal(s.audio.node,null);assert.equal(nodes.filter(n=>n.buffer?.duration===4&&n.started).length,0);
});
test('mute, pause, and resume preserve elapsed time without duplicate audio',async()=>{
  const {s,setNow}=harness();s.openPractice();await settle();s.audio.context.currentTime=s.state.clockStart+5.5;s.toggleVoice();await settle();assert.equal(s.state.mode,'running');assert.equal(s.state.voice,false);assert.equal(s.audio.node,null);assert.ok(Math.abs(s.state.elapsed-5.5)<.001);
  setNow(2);s.pausePractice();assert.ok(Math.abs(s.state.elapsed-7.5)<.001);s.toggleVoice();await s.resumePractice();assert.equal(s.state.mode,'running');assert.equal(s.audio.node.loop,true);assert.ok(Math.abs(s.audio.node.started[1]-3.5)<.001);
});
test('workout automatically rests and advances; final move ends the workout',async()=>{
  const {s,el,setNow}=harness();s.openPractice();await settle();s.audio.context.currentTime=s.state.clockStart+32;s.frame(32000);assert.equal(s.state.mode,'rest');assert.equal(s.audio.node,null);
  setNow(21);s.frame(53000);await settle();assert.equal(s.state.index,1);assert.equal(s.state.mode,'running');assert.equal(s.state.elapsed,0);
  s.navigateExercise(5);await settle();s.audio.context.currentTime=s.state.clockStart+32;s.frame(90000);assert.equal(s.state.mode,'done');assert.equal(s.audio.node,null);assert.equal(el('transition-next').textContent,'完成，回到首页');
});
test('build is a single HTML with no remote runtime dependencies or TTS fallbacks',async()=>{
  const out='/tmp/workout-test-built.html';execFileSync(process.execPath,['build/build-github-page.mjs',out],{cwd:root});const html=await readFile(out,'utf8');
  assert.doesNotMatch(html,/<script\s+src=|<link[^>]+rel="stylesheet"|speechSynthesis|decodeAudioData|new Audio\(/);assert.match(html,/data:audio\/wav;base64,/);assert.ok(Buffer.byteLength(html)<250000);
});
