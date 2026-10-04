import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const [library, i18n, stickman, app, wav, wavEn] = await Promise.all(['public/library.js','public/i18n.js','public/stickman.js','public/app.js','public/audio/count-cycle.wav','public/audio/count-cycle-en.wav'].map(p=>readFile(new URL(p,root),p.endsWith('.wav')?undefined:'utf8')));
function harness({deferred=false,blockedStorage=false,audioSession,outputTimestamp,storage={},languages}={}) {
  let now=0;const store=new Map(Object.entries(storage));const nodes=[],resumers=[],events=[],elements=new Map(),timers=new Map();let timerId=0;
  const makeElement=()=>({textContent:'',innerHTML:'',hidden:false,dataset:{},style:{},disabled:false,tagName:'BUTTON',classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false},querySelectorAll(){return Array.from({length:4},makeElement)},querySelector(){return null},getBoundingClientRect(){return {width:0,height:0}}});
  const el=id=>{if(!elements.has(id))elements.set(id,makeElement());return elements.get(id)};
  el('count-audio-source').dataset.src='data:audio/wav;base64,'+wav.toString('base64');el('count-audio-en').dataset.src='audio/count-cycle-en.wav';const fetches=[];
  class AudioContext {
    constructor(){events.push({event:'create',sessionType:audioSession?.type});this.state=deferred?'suspended':'running';this.currentTime=0;this.sampleRate=48000;this.destination={};if(outputTimestamp)this.getOutputTimestamp=outputTimestamp;}
    createGain(){return {connect(){},gain:{setValueAtTime(){}}}}
    createBuffer(channels,length,rate){const data=new Float32Array(length);return {duration:length/rate,getChannelData(){return data}}}
    createBufferSource(){const node={connect(){},disconnect(){},start(...args){this.started=args},stop(...args){this.stopped=args}};nodes.push(node);return node}
    addEventListener(){}
    resume(){events.push({event:'resume',sessionType:audioSession?.type});if(deferred)return new Promise(resolve=>resumers.push(()=>{this.state='running';resolve()}));this.state='running';return Promise.resolve()}
  }
  const document={hidden:false,getElementById:el,querySelectorAll(){return []},addEventListener(){},activeElement:makeElement(),body:makeElement()};
  const context=vm.createContext({document,window:{AudioContext,navigator:{audioSession},crypto:webcrypto,matchMedia:()=>({matches:false}),addEventListener(){}},localStorage:{getItem(key){if(blockedStorage)throw Error('blocked');return store.get(key)??null},setItem(key,value){if(blockedStorage)throw Error('blocked');store.set(key,String(value))}},performance:{now:()=>now*1000},requestAnimationFrame(){},atob:s=>Buffer.from(s,'base64').toString('binary'),setTimeout(fn){const id=++timerId;timers.set(id,fn);return id},clearTimeout:id=>timers.delete(id),console});
  if(languages)context.navigator={languages};
  context.fetch=async url=>{fetches.push(url);return {ok:true,arrayBuffer:async()=>wavEn.buffer.slice(wavEn.byteOffset,wavEn.byteOffset+wavEn.byteLength)};};
  vm.runInContext(library+'\n'+i18n+'\n'+stickman+'\n'+app+'\n;globalThis.subject={Stickman,setLang,getLang:()=>lang,t,ITEMS,LEVELS,CATEGORIES,DEFAULT_PLANS,selectLevel,setLibrary,beginTurn,turnView,toggleView,trainerCamera,getLevel:()=>level,state,audio,newPlan,openPractice,closePractice,resumePractice,pausePractice,toggleVoice,navigateExercise,frame,holdRest,restNext,testSound,selectAvatar,getPlan:()=>plan};',context);
  return {s:context.subject,el,nodes,resumers,timers,events,store,fetches,setNow(t){now=t}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
// A sized canvas whose 2D context rejects non-finite numbers, in calls and in property writes.
function fakeCanvas(width=360,height=260){
  const gradient={addColorStop(){}},check=(key,values)=>{if(values.some(v=>typeof v==='number'&&!Number.isFinite(v)))throw Error('non-finite '+String(key));};
  const ctx=new Proxy({},{get:(target,key)=>target[key]??((...args)=>{check(key,args);return gradient}),set:(target,key,value)=>{check(key,[value]);target[key]=value;return true}});
  return {width,height,getBoundingClientRect:()=>({width,height}),getContext:()=>ctx};
}

test('sound reminder is conditional advice, respects webpage mute, and yields to errors',async()=>{
  const {s,el}=harness();s.openPractice();await settle();
  assert.equal(el('trainer-status').hidden,false);
  assert.equal(el('trainer-status').textContent,'听不到数拍？请关闭手机静音模式，并调高媒体音量。');
  s.pausePractice('声音被系统暂停');assert.equal(el('trainer-status').textContent,'声音被系统暂停');
  s.toggleVoice();assert.match(el('trainer-status').textContent,/网页数拍声音已关闭/);
  s.toggleVoice();assert.match(el('trainer-status').textContent,/听不到数拍？/);
  s.closePractice();await s.testSound();
  const html=await readFile(new URL('public/legacy.html',root),'utf8');
  assert.match(html,/<p[^>]* id="sound-help"[^>]*>听不到数拍？请关闭手机静音模式，并调高媒体音量。<\/p>/);
  assert.match(html,/id="test-sound" aria-describedby="sound-help"/);
});

test('iOS media session is configured before creating and resuming audio',async()=>{
  const session={type:'ambient'},h=harness({audioSession:session});await h.s.audio.unlock();
  assert.equal(session.type,'playback');assert.equal(h.s.audio.modeLabel(),'媒体播放模式');
  assert.deepEqual(h.events,[{event:'create',sessionType:'playback'},{event:'resume',sessionType:'playback'}]);
  session.type='ambient';await h.s.audio.unlock();assert.equal(h.events.at(-1).sessionType,'playback');
});
test('browsers without AudioSession keep using the same Web Audio engine',async()=>{
  const {s}=harness();await s.audio.unlock();s.audio.start();assert.ok(s.audio.node);assert.equal(s.audio.sessionMode,'default');
});
test('a rejected optional media-session setting does not break audio startup',async()=>{
  const session={get type(){return 'ambient'},set type(_){throw Error('unsupported')}};
  const {s}=harness({audioSession:session});await s.audio.unlock();s.audio.start();assert.ok(s.audio.node);assert.equal(s.audio.sessionMode,'unavailable');
});

test('both avatars render every exercise without changing motion or playback',async()=>{
  const {s,el}=harness();s.openPractice();await settle();const node=s.audio.node,mode=s.state.mode,ctx=fakeCanvas().getContext();
  for(const avatar of ['male','female']){
    s.selectAvatar(avatar);assert.equal(s.Stickman.getAvatar(),avatar);assert.equal(el('trainer-avatar').value,avatar);assert.equal(s.audio.node,node);assert.equal(s.state.mode,mode);
    for(const item of s.ITEMS){const ex=s.Stickman.find(item.id);s.Stickman.render(ctx,360,260,ex,1.3,{theme:'dark',ghost:true,trail:true,com:true});s.Stickman.render(ctx,90,100,ex,2.2,{theme:'light',small:true});s.Stickman.renderPair(ctx,360,260,ex,0,{});}
  }
  s.selectAvatar('invalid');assert.equal(s.Stickman.getAvatar(),'male');
});
test('every library item has a stick-figure move, and every level covers all 7 categories with at least 3 moves',()=>{
  const {s}=harness(),keys=[...s.LEVELS.map(l=>l.key)];assert.deepEqual(keys,['strong','standard','gentle']);assert.equal(s.ITEMS.length,51);
  for(const key of keys)for(const c of s.CATEGORIES)assert.ok(s.ITEMS.filter(i=>i.key===c.key&&i.levels.includes(key)).length>=3,key+' '+c.key);
  assert.ok(s.ITEMS.some(i=>i.levels.length>1),'levels overlap');
  assert.equal(s.Stickman.EXERCISES.length,s.ITEMS.length);
  for(const item of s.ITEMS){
    assert.ok(item.levels.length>=1&&item.levels.every(l=>keys.includes(l)),item.id);
    assert.equal(item.steps.length,2);assert.ok(item.name&&item.purpose&&item.cue);
    const ex=s.Stickman.find(item.id);assert.ok(ex,item.id+' has a stick-figure move');assert.match(s.Stickman.viewLabel(item.id),/侧面|正面/);
  }
});
test('choosing a level filters the plan and library, and is remembered with its own plan',()=>{
  const {s,el,store}=harness();assert.equal(s.getLevel(),'gentle');assert.equal(s.getPlan().map(i=>i.id).join(),s.DEFAULT_PLANS.gentle.join());
  const defaults=Object.values(s.DEFAULT_PLANS).flat();assert.equal(new Set(defaults).size,21,'default plans share no moves');
  s.selectLevel('strong');const plan=s.getPlan().map(i=>i.name);assert.equal(el('toast').hidden,false);assert.ok(plan.every(name=>el('toast').textContent.includes(name)),'switching names the new plan');
  el('toast').textContent='';s.selectLevel('strong');assert.equal(el('toast').textContent,'','re-selecting the same level says nothing');
  for(const key of ['strong','standard','gentle']){
    s.selectLevel(key);assert.equal(s.getLevel(),key);assert.equal(store.get('cq-level-v1'),key);
    assert.ok(s.getPlan().every(i=>i.levels.includes(key)));assert.match(el('level-hint').textContent,/./);
    const shown=[...el('library-list').innerHTML.matchAll(/data-preview="(\w+)"/g)].map(m=>m[1]);
    assert.equal(shown.join(),s.ITEMS.filter(i=>i.levels.includes(key)).map(i=>i.id).join());
  }
  s.setLibrary({scope:'every'});assert.equal([...el('library-list').innerHTML.matchAll(/data-preview=/g)].length,51);
  s.setLibrary({category:'push'});assert.equal([...el('library-list').innerHTML.matchAll(/data-preview=/g)].length,s.ITEMS.filter(i=>i.key==='push').length,'all levels, one category');
  s.selectLevel(s.getLevel());assert.equal([...el('library-list').innerHTML.matchAll(/data-preview=/g)].length,s.ITEMS.filter(i=>i.key==='push'&&i.levels.includes(s.getLevel())).length,'choosing a level returns to that level');
  s.setLibrary({category:'all'});
  s.selectLevel('strong');s.newPlan();const strongPlan=store.get('cq-plan-v3-strong');
  s.selectLevel('gentle');s.selectLevel('strong');assert.equal(JSON.stringify(s.getPlan().map(i=>i.id)),strongPlan,'each level keeps its plan');
  s.selectLevel('nonsense');assert.equal(s.getLevel(),'strong');
  s.openPractice();s.selectLevel('gentle');assert.equal(s.getLevel(),'strong','level is fixed during a workout');
  const again=harness({storage:{'cq-level-v1':'standard','cq-plan-v3-standard':JSON.stringify(s.DEFAULT_PLANS.strong)}});
  assert.equal(again.s.getLevel(),'standard');assert.equal(again.s.getPlan().map(i=>i.id).join(),s.DEFAULT_PLANS.standard.join(),'a plan outside the level is replaced');
  const old=['march','stand','wallPush','elbowPull','kneePress','seatedHeel','side'];
  assert.equal(harness({storage:{'cq-plan-v2':JSON.stringify(old)}}).s.getPlan().map(i=>i.id).join(),old.join(),'plans saved before levels still load');
});
test('sit-to-stand leans forward before the hips leave the seat, then rises upright',()=>{
  const {s}=harness(),d=s.Stickman.prepare(s.Stickman.find('stand')),at=(q,k)=>d.get(Math.round(q*d.N),k);
  const lean=q=>{const p=at(q,'P'),c=at(q,'C7');return Math.atan2(c[2]-p[2],c[1]-p[1])*180/Math.PI;};
  assert.ok(Math.abs(at(.18,'P')[1]-at(0,'P')[1])<.5,'still seated while leaning');assert.ok(lean(.18)>30,'trunk leans before seat-off');
  assert.ok(at(.5,'P')[1]>at(0,'P')[1]+34,'stands up');assert.ok(Math.abs(lean(.5))<3,'upright when standing');
  assert.ok(lean(.2)>lean(.35),'the trunk straightens while rising');
});
test('animation clock follows the audio reaching the speaker',async()=>{
  let stamp={contextTime:0,performanceTime:0};const {s,setNow}=harness({outputTimestamp:()=>stamp});await s.audio.unlock();
  s.audio.context.currentTime=10;setNow(50);stamp={contextTime:9.9,performanceTime:49990};assert.ok(Math.abs(s.audio.now()-9.91)<1e-9,'extrapolated from the output timestamp');
  stamp={contextTime:9.85,performanceTime:49990};assert.ok(Math.abs(s.audio.now()-9.91)<1e-9,'never runs backwards');
  stamp={contextTime:0,performanceTime:0};assert.equal(s.audio.now(),10,'without a timestamp, currentTime');
  stamp={contextTime:9.95,performanceTime:49990};assert.equal(s.audio.now(),10,'nor backwards after using currentTime');
  s.audio.context.currentTime=11;stamp={contextTime:12,performanceTime:49990};assert.ok(Math.abs(s.audio.now()-11.05)<1e-9,'implausible timestamps are clamped, not jumped to');
  stamp={contextTime:9,performanceTime:49990};assert.ok(Math.abs(s.audio.now()-11.05)<1e-9);
  s.openPractice();await settle();const start=s.state.clockStart;s.audio.context.currentTime=start+2.1;stamp={contextTime:start+2,performanceTime:50000};
  s.pausePractice();assert.ok(Math.abs(s.state.elapsed-2)<1e-9,'pausing keeps the position that was heard');
});
test('rest screen previews the next move, and the final screen hides it',async()=>{
  const {s,el,setNow}=harness();Object.assign(el('transition-canvas'),fakeCanvas(312,230));s.openPractice();await settle();const calls=[],draw=s.Stickman.draw;s.Stickman.draw=(canvas,id,...rest)=>{calls.push([canvas,id]);return draw(canvas,id,...rest)};
  setNow(32);s.audio.context.currentTime=s.state.clockStart+32;s.frame(32000);assert.equal(s.state.mode,'rest');assert.equal(el('transition-canvas').hidden,false);
  calls.length=0;s.frame(33000);assert.deepEqual(calls,[[el('transition-canvas'),s.getPlan()[1].id]]);
  s.navigateExercise(6);await settle();s.audio.context.currentTime=s.state.clockStart+32;s.frame(90000);assert.equal(s.state.mode,'done');assert.equal(el('transition-canvas').hidden,true);
});
test('a device that keeps missing frames settles at a steady 30 fps',async()=>{
  const {s}=harness();s.openPractice();await settle();let draws=0;const draw=s.Stickman.draw;s.Stickman.draw=(...a)=>{draws++;return draw(...a)};
  let t=1000;for(let i=0;i<120;i++)s.frame(t+=16.7);assert.equal(draws,120,'smooth devices draw every frame');
  for(let i=0;i<15;i++)s.frame(t+=33.4);draws=0;for(let i=0;i<60;i++)s.frame(t+=16.7);assert.equal(draws,60,'a half-second hiccup changes nothing');
  for(let i=0;i<120;i++)s.frame(t+=33.4);draws=0;for(let i=0;i<60;i++)s.frame(t+=16.7);assert.equal(draws,30);
  s.closePractice();s.openPractice();await settle();draws=0;for(let i=0;i<60;i++)s.frame(t+=16.7);assert.equal(draws,60,'each workout starts at the full rate again');
});
test('the count stops exactly at the end of the eighth repetition',async()=>{
  const {s}=harness();s.openPractice();await settle();assert.ok(Math.abs(s.audio.node.stopped[0]-(s.state.clockStart+32))<1e-9);
  s.audio.context.currentTime=s.state.clockStart+10;s.pausePractice();await s.resumePractice();assert.ok(Math.abs(s.audio.node.stopped[0]-(s.state.clockStart+22))<1e-9,'resuming keeps the same end');
  s.closePractice();s.openPractice('march');await settle();assert.equal(s.audio.node.stopped,undefined,'previews loop without an end');
});
test('changing plans preserves all 7 categories and the level, with no repeated previous move',()=>{
  const {s}=harness({blockedStorage:true});
  for(const key of ['gentle','standard','strong']){s.selectLevel(key);const variants=new Set();
    for(let n=0;n<100;n++){const previous=s.getPlan().map(x=>x.id);s.newPlan();const next=s.getPlan();assert.equal(new Set(next.map(x=>x.key)).size,7);next.forEach((x,i)=>{assert.notEqual(x.id,previous[i]);assert.ok(x.levels.includes(key),key+' '+x.id)});variants.add(next.map(x=>x.id).join(','))}
    assert.ok(variants.size>30,key);}
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
  const out='/tmp/workout-test-built/index.html';execFileSync(process.execPath,['build/build-github-page.mjs',out],{cwd:root});const html=await readFile(out,'utf8');
  assert.doesNotMatch(html,/<script\s+src=|<link[^>]+rel="stylesheet"|speechSynthesis|decodeAudioData|new Audio\(/);
  assert.equal(html.match(/data:audio\/wav;base64,/g).length,1,'only the Chinese count is built in');assert.match(html,/data-src="audio\/count-cycle-en\.wav"/);
  assert.ok((await readFile('/tmp/workout-test-built/audio/count-cycle-en.wav')).equals(wavEn),'the English count ships next to the page');assert.ok(Buffer.byteLength(html)<400000);
});

test('dragging turns the trainer camera, freezing the automatic turn where it was',async()=>{
  const {s}=harness();s.openPractice('squat');await settle();s.state.sway=true;
  const base=s.Stickman.find('squat').view,from=s.beginTurn();assert.equal(s.state.sway,false,'a drag stops the automatic turn');
  s.turnView(from,40,20);const cam=s.trainerCamera();assert.ok(Math.abs(cam.yaw-(base.yaw+from.yaw+20))<1e-9,'40 px turns 20 degrees');assert.equal(cam.pitch,base.pitch+5);
  s.turnView(from,0,999);assert.equal(s.trainerCamera().pitch,Math.min(40,base.pitch+30),'looking down is limited');
  s.toggleView();assert.equal(s.state.sway,true);assert.deepEqual({...s.state.cam},{yaw:0,pitch:0},'turning back on resets the view');
});

test('the language follows a saved choice, else the browser, and every move has English text',()=>{
  assert.equal(harness().s.getLang(),'zh','no browser languages: Chinese');
  assert.equal(harness({languages:['en-GB','zh-CN']}).s.getLang(),'en','first of Chinese or English wins');
  assert.equal(harness({languages:['fr-FR','zh-TW']}).s.getLang(),'zh');
  assert.equal(harness({languages:['de-DE']}).s.getLang(),'en','neither listed: English');
  assert.equal(harness({languages:['en-US'],storage:{'cq-lang-v1':'zh'}}).s.getLang(),'zh','a saved choice wins');
  const {s,el}=harness({languages:['en-US']});
  for(const item of s.ITEMS){assert.doesNotMatch(item.name+item.purpose+item.steps.join('')+item.cue+item.category,/[\u4e00-\u9fff]/,item.id);assert.ok(s.t('title'));}
  assert.match(el('plan-summary').textContent,/7 moves/);assert.doesNotMatch(el('library-list').innerHTML,/[\u4e00-\u9fff]/,'library cards are English');
});
test('switching language relabels the page in place and is remembered, but not during a workout',async()=>{
  const {s,el,store}=harness();const plan=s.getPlan().map(i=>i.id);
  s.setLang('en');assert.equal(s.getLang(),'en');assert.equal(store.get('cq-lang-v1'),'en');assert.deepEqual(s.getPlan().map(i=>i.id),plan,'same plan, new labels');
  assert.match(s.getPlan()[0].name,/^[A-Za-z]/);s.selectLevel('strong');assert.match(el('toast').textContent,/^Switched to Ages 40–55/);
  s.openPractice();await settle();assert.match(el('progress-label').textContent,/^Move 1 of 7/);assert.equal(el('rep-total').textContent,'/ 8 reps');
  s.setLang('zh');assert.equal(s.getLang(),'en','no switching mid-workout');s.closePractice();
  s.setLang('zh');assert.match(s.getPlan()[0].name,/[\u4e00-\u9fff]/);
});
test('each language counts with its own recording; only the built-in Chinese one is in the page',async()=>{
  const zhOnly=harness();await zhOnly.s.audio.unlock();assert.equal(zhOnly.fetches.length,0,'Chinese needs no download');
  const {s,fetches}=harness({languages:['en-US']});assert.deepEqual(fetches,['audio/count-cycle-en.wav'],'English starts downloading at load');
  await s.audio.unlock();const en=s.audio.buffer;assert.equal(fetches.length,1,'and is downloaded once');
  s.setLang('zh');await s.audio.unlock();const zh=s.audio.buffer;assert.notEqual(en,zh);
  for(const b of [en,zh]){assert.equal(b.duration,4);const d=b.getChannelData(0);for(let beat=0;beat<4;beat++){let sum=0;for(const x of d.slice(beat*16000,(beat+1)*16000))sum+=x*x;assert.ok(Math.sqrt(sum/16000)>.005,'beat '+(beat+1));}}
});
