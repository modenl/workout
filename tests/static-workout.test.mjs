import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const [library, motion, app, wav] = await Promise.all(['public/library.js','public/motion.js','public/app.js','public/audio/count-cycle.wav'].map((p,i)=>readFile(new URL(p,root),i===3?undefined:'utf8')));
function harness({deferred=false,blockedStorage=false,audioSession,outputTimestamp,storage={}}={}) {
  let now=0;const store=new Map(Object.entries(storage));const nodes=[],resumers=[],events=[],elements=new Map(),timers=new Map();let timerId=0;
  const makeElement=()=>({textContent:'',innerHTML:'',hidden:false,dataset:{},style:{},disabled:false,tagName:'BUTTON',classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false},querySelectorAll(){return Array.from({length:4},makeElement)},getBoundingClientRect(){return {width:0,height:0}}});
  const el=id=>{if(!elements.has(id))elements.set(id,makeElement());return elements.get(id)};
  el('count-audio-source').dataset.src='data:audio/wav;base64,'+wav.toString('base64');
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
  vm.runInContext(library+'\n'+motion+'\n'+app+'\n;globalThis.subject={Motion,ITEMS,LEVELS,CATEGORIES,DEFAULT_PLANS,selectLevel,renderLibrary,getLevel:()=>level,state,audio,newPlan,openPractice,closePractice,resumePractice,pausePractice,toggleVoice,navigateExercise,frame,holdRest,restNext,testSound,selectAvatar,getPlan:()=>plan};',context);
  return {s:context.subject,el,nodes,resumers,timers,events,store,setNow(t){now=t}};
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
  assert.match(html,/<p id="sound-help">听不到数拍？请关闭手机静音模式，并调高媒体音量。<\/p>/);
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

test('both avatars render every exercise without changing rig or playback',async()=>{
  const {s,el}=harness();s.openPractice();await settle();const node=s.audio.node,mode=s.state.mode;
  const poses=s.ITEMS.map(item=>JSON.stringify(s.Motion.pose(item.id,.5)));
  const canvas=fakeCanvas();
  for(const avatar of ['male','female']){
    s.selectAvatar(avatar);assert.equal(s.Motion.getAvatar(),avatar);assert.equal(el('trainer-avatar').value,avatar);assert.equal(s.audio.node,node);assert.equal(s.state.mode,mode);
    s.ITEMS.forEach((item,i)=>{assert.equal(JSON.stringify(s.Motion.pose(item.id,.5)),poses[i]);s.Motion.draw(canvas,item.id,.5);s.Motion.draw(canvas,item.id,.5,1,{comparison:true});s.Motion.draw(canvas,item.id,.3,-1,{phase:.2});s.Motion.draw(canvas,item.id,.8,1,{small:true,phase:.7})});
  }
  s.selectAvatar('invalid');assert.equal(s.Motion.getAvatar(),'male');
});

test('51 poses have connected, fixed-length limbs, finite joints, and feet on or above the floor',()=>{
  const {s}=harness();assert.equal(s.ITEMS.length,51);
  const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
  for(const item of s.ITEMS)for(const side of [-1,1])for(const t of [0,.25,.5,.75,1]){
    const p=s.Motion.pose(item.id,t,side);
    for(const a of p.arms){assert.ok(Math.abs(dist(a.sh,a.elbow)-56)<.001,item.id+' upper arm');assert.ok(Math.abs(dist(a.elbow,a.hand)-54)<.001,item.id+' forearm')}
    for(const l of p.legs){assert.ok(Math.abs(dist(l.h,l.k)-76)<.001,item.id+' thigh');assert.ok(Math.abs(dist(l.k,l.f)-76)<.001,item.id+' shin');assert.ok(Math.abs(dist(l.f,l.toe)-23)<.001,item.id+' foot');assert.ok(Math.min(l.f[1],l.toe[1])>9.99,item.id+' foot above the floor')}
    assert.doesNotMatch(JSON.stringify(p),/null|NaN/);
  }
});
test('wall push keeps palms on wall; calf raises keep toes planted',()=>{
  const {s}=harness();for(const t of [0,.25,.5,.75,1]){
    const wall=s.Motion.pose('wallPush',t);for(const a of wall.arms)assert.ok(Math.abs(a.hand[2]-132)<.001);
    for(const id of ['heel','seatedHeel']){const p=s.Motion.pose(id,t);for(const l of p.legs){assert.equal(l.toe[1],id==='heel'?10:12);assert.equal(l.toe[2],id==='heel'?29:31)}}
    for(const side of [-1,1]){const l=s.Motion.pose('singleCalf',t,side).legs.find(x=>x.s===side);assert.equal(l.toe[1],10);assert.equal(l.toe[2],29);}
  }
});
test('every level covers all 7 categories with at least 3 moves; moves are complete and keep supports still',()=>{
  const {s}=harness(),keys=[...s.LEVELS.map(l=>l.key)];assert.deepEqual(keys,['strong','standard','gentle']);
  for(const key of keys)for(const c of s.CATEGORIES)assert.ok(s.ITEMS.filter(i=>i.key===c.key&&i.levels.includes(key)).length>=3,key+' '+c.key);
  assert.ok(s.ITEMS.some(i=>i.levels.length>1),'levels overlap');
  const joints=p=>JSON.stringify([p.hip,p.shoulder,p.head,p.legs,p.arms]);
  for(const item of s.ITEMS){
    assert.ok(item.levels.length>=1&&item.levels.every(l=>keys.includes(l)),item.id);
    assert.equal(item.steps.length,2);assert.ok(item.name&&item.purpose&&item.cue);
    if(!['palmPress','towelPull'].includes(item.id))assert.notEqual(joints(s.Motion.pose(item.id,0)),joints(s.Motion.pose(item.id,1)),item.id+' moves (isometric presses excepted)');
  }
  // Hands that rest on a chair back, a table edge or a seat stay exactly there.
  const still={hamstringCurl:[30,190,80],forwardTap:[30,190,80],sideTap:[30,190,80],singleCalf:[30,190,80],singleLegStand:[30,190,80],singleLegHinge:[30,190,80],chairDip:[32,82,-27]};
  for(const side of [-1,1])for(const t of [0,.25,.5,.75,1]){
    for(const [id,[x,y,z]] of Object.entries(still))for(const a of s.Motion.pose(id,t,side).arms)assert.ok(Math.hypot(a.hand[0]-a.s*x,a.hand[1]-y,a.hand[2]-z)<.001,id);
    const table=JSON.stringify(s.Motion.pose('inclinePush',0).arms.map(a=>a.hand));for(const id of ['inclinePush','tableKneeDrive'])assert.equal(JSON.stringify(s.Motion.pose(id,t,side).arms.map(a=>a.hand)),table,id);
  }
  for(const id of ['bicepsCurl','shoulderRotate']){const a=s.Motion.pose(id,0),b=s.Motion.pose(id,1);assert.deepEqual(a.arms.map(x=>x.elbow),b.arms.map(x=>x.elbow));}
});
test('choosing a level filters the plan and library, and is remembered with its own plan',()=>{
  const {s,el,store}=harness();assert.equal(s.getLevel(),'gentle');assert.equal(s.getPlan().map(i=>i.id).join(),s.DEFAULT_PLANS.gentle.join());
  const defaults=Object.values(s.DEFAULT_PLANS).flat();assert.equal(new Set(defaults).size,21,'default plans share no moves');
  s.selectLevel('strong');const plan=s.getPlan().map(i=>i.name);assert.ok(plan.every(name=>el('level-hint').textContent.includes(name)),'switching names the new plan');
  s.selectLevel('strong');assert.doesNotMatch(el('level-hint').textContent,/已换成/,'re-selecting the same level changes nothing');
  for(const key of ['strong','standard','gentle']){
    s.selectLevel(key);assert.equal(s.getLevel(),key);assert.equal(store.get('cq-level-v1'),key);
    assert.ok(s.getPlan().every(i=>i.levels.includes(key)));assert.match(el('level-hint').textContent,/./);
    const shown=[...el('library-list').innerHTML.matchAll(/data-preview="(\w+)"/g)].map(m=>m[1]);
    assert.equal(shown.join(),s.ITEMS.filter(i=>i.levels.includes(key)).map(i=>i.id).join());
  }
  s.renderLibrary('every');assert.equal([...el('library-list').innerHTML.matchAll(/data-preview=/g)].length,51);
  s.selectLevel('strong');s.newPlan();const strongPlan=store.get('cq-plan-v3-strong');
  s.selectLevel('gentle');s.selectLevel('strong');assert.equal(JSON.stringify(s.getPlan().map(i=>i.id)),strongPlan,'each level keeps its plan');
  s.selectLevel('nonsense');assert.equal(s.getLevel(),'strong');
  s.openPractice();s.selectLevel('gentle');assert.equal(s.getLevel(),'strong','level is fixed during a workout');
  const again=harness({storage:{'cq-level-v1':'standard','cq-plan-v3-standard':strongPlan}});
  assert.equal(again.s.getLevel(),'standard');assert.equal(again.s.getPlan().map(i=>i.id).join(),s.DEFAULT_PLANS.standard.join(),'a plan outside the level is replaced');
  const old=['march','stand','wallPush','elbowPull','kneePress','seatedHeel','side'];
  assert.equal(harness({storage:{'cq-plan-v2':JSON.stringify(old)}}).s.getPlan().map(i=>i.id).join(),old.join(),'plans saved before levels still load');
});
test('movement timing eases into both end poses, reaching the end pose on beat 3',()=>{
  const {s}=harness(),ease=s.Motion.ease;
  assert.equal(ease(0),0);assert.equal(ease(.5),1);assert.ok(Math.abs(ease(1))<1e-12);
  for(let p=0;p<.5;p+=.01){assert.ok(ease(p+.01)>=ease(p)-1e-12);assert.ok(Math.abs(ease(p)-ease(1-p))<1e-9);}
  assert.ok(ease(.05)<.03&&ease(.45)>.97,'settles near both end poses');
});
test('sit-to-stand leans forward before the hips leave the seat, then rises upright',()=>{
  const {s}=harness(),at=t=>s.Motion.pose('stand',t),lean=p=>Math.atan2(p.shoulder[2]-p.hip[2],p.shoulder[1]-p.hip[1])*180/Math.PI;
  assert.equal(at(.2).hip[1],88,'still seated while leaning');assert.ok(lean(at(.2))>15);
  assert.ok(lean(at(.3))>28&&lean(at(.3))<36,'lean peaks at lift-off');assert.ok(at(.3).head[2]>=8,'head over the toes');
  assert.equal(lean(at(1)),0);assert.equal(at(1).hip[1],160);
  let front=-1e9;for(let t=0;t<=1;t+=.02){const z=at(t).head[2];front=Math.max(front,z);assert.ok(front-z<12,'head rises without swinging back');}
  for(const t of [0,.2])for(const a of at(t).arms)assert.ok(a.hand[1]>95&&a.hand[1]<110,'hands rest on the thighs');
});
test('motion arrows trace each working joint and stay readable',()=>{
  const {s}=harness();
  for(const item of s.ITEMS)for(const side of [-1,1]){
    const paths=s.Motion.guides(item.id,side);
    if(item.id==='palmPress'||item.id==='towelPull'){assert.equal(paths.length,0,'isometric moves use press/pull arrows');continue;}
    assert.ok(paths.length>=1&&paths.length<=4,item.id);
    for(const g of paths){let len=0;for(let i=1;i<g.length;i++)len+=Math.hypot(g[i][0]-g[i-1][0],g[i][1]-g[i-1][1]);assert.ok(len>=30,item.id+' arrow is long enough to read');assert.doesNotMatch(JSON.stringify(g),/null|NaN/);}
    assert.equal(s.Motion.guides(item.id,side),paths,'paths are computed once');
  }
  const knee=side=>s.Motion.guides('march',side)[0][0][0];assert.ok(knee(1)>0&&knee(-1)<0,'alternating moves show the working side');
  for(const id of ['forwardTap','sideTap'])for(const [,y] of s.Motion.guides(id,1)[0])assert.ok(y>0,id+' step arrow lies on the floor, not on the shin');
});
test('motion arrows fit inside the frame drawn for them',()=>{
  // Frames with arrows keep 345 units above the floor, 27 below and 148 to the left; leave room for arrowheads.
  const {s}=harness();
  for(const item of s.ITEMS)for(const side of [-1,1])for(const g of s.Motion.guides(item.id,side))for(const [x,y] of g)
    assert.ok(y>-332&&y<22&&x>-135&&x<148,item.id+' arrow at '+x.toFixed(0)+','+y.toFixed(0));
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
  const {s,el,setNow}=harness();Object.assign(el('transition-canvas'),fakeCanvas(312,230));s.openPractice();await settle();const calls=[],draw=s.Motion.draw;s.Motion.draw=(canvas,id,...rest)=>{calls.push([canvas,id]);return draw(canvas,id,...rest)};
  setNow(32);s.audio.context.currentTime=s.state.clockStart+32;s.frame(32000);assert.equal(s.state.mode,'rest');assert.equal(el('transition-canvas').hidden,false);
  calls.length=0;s.frame(33000);assert.deepEqual(calls,[[el('transition-canvas'),s.getPlan()[1].id]]);
  s.navigateExercise(6);await settle();s.audio.context.currentTime=s.state.clockStart+32;s.frame(90000);assert.equal(s.state.mode,'done');assert.equal(el('transition-canvas').hidden,true);
});
test('a device that keeps missing frames settles at a steady 30 fps',async()=>{
  const {s}=harness();s.openPractice();await settle();let draws=0;const draw=s.Motion.draw;s.Motion.draw=(...a)=>{draws++;return draw(...a)};
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
  const out='/tmp/workout-test-built.html';execFileSync(process.execPath,['build/build-github-page.mjs',out],{cwd:root});const html=await readFile(out,'utf8');
  assert.doesNotMatch(html,/<script\s+src=|<link[^>]+rel="stylesheet"|speechSynthesis|decodeAudioData|new Audio\(/);assert.match(html,/data:audio\/wav;base64,/);assert.ok(Buffer.byteLength(html)<300000);
});
