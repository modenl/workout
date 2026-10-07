"use strict";
const $=id=>document.getElementById(id);
const storage={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
// Language: a saved choice, else the browser's. Items, categories and levels are relabelled in place,
// so plans and lists keep pointing at the same objects.
let lang=detectLang(storage.get("cq-lang-v1"));
const t=(key,vars={})=>(I18N[lang][key]??I18N.zh[key]).replace(/\{(\w+)\}/g,(_,k)=>vars[k]);
const ITEMS=CATEGORIES.flatMap(category=>LIBRARY[category.key].map(item=>({...item,key:category.key,category:category.label})));
const ITEM_BY_ID=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
const ZH={items:ITEMS.map(({name,purpose,steps,cue})=>({name,purpose,steps,cue})),cats:CATEGORIES.map(c=>c.label),levels:LEVELS.map(({age,name,hint})=>({age,short:age.replace(" 岁",""),name,hint}))};
function localizeData(){
  const en=lang==="en";
  CATEGORIES.forEach((c,i)=>{c.label=en?CATEGORIES_EN[c.key]:ZH.cats[i];});
  ITEMS.forEach((item,i)=>{const x=LIBRARY_EN[item.id];Object.assign(item,en?{name:x[0],purpose:x[1],steps:x[2],cue:x[3]}:ZH.items[i]);item.category=CATEGORIES.find(c=>c.key===item.key).label;});
  LEVELS.forEach((l,i)=>Object.assign(l,en?LEVELS_EN[l.key]:ZH.levels[i]));
}
localizeData();
const phaseCue=(id,i)=>(lang==="en"?PHASES_EN:PHASES)[id][i];
const PHASES={
 armSwing:["小幅摆臂","回正 · 换边"],shoulderLift:["轻轻提肩","放松肩膀"],kneeOpen:["双膝向外打开","有控制地收回"],hamstringCurl:["弯膝 · 脚跟向后","放回 · 换边"],
 armRaise:["向前抬臂","有控制地放下"],bicepsCurl:["弯肘抬手","上臂不动 · 放下"],chestOpen:["轻轻向外打开","放松 · 收回"],shoulderRotate:["手肘不动 · 外转","轻轻收回"],
 hipHinge:["从髋部稍前倾","背部长直 · 坐正"],diagonalReach:["向对侧膝前伸手","收回 · 换边"],anklePump:["脚尖向上勾","放松下压 · 换边"],heelToe:["脚尖落下 · 提脚跟","脚跟落下 · 抬脚尖"],
 forwardTap:["向前点一小步","收回 · 换边"],sideTap:["向旁点一小步","收回 · 换边"],
 march:["抬脚 · 自然呼吸","轻放 · 换边"],seatedJack:["向外打开","收回坐稳"],reachTap:["向前点脚","收回换边"],
 stand:["向前倾 · 站起","弯髋屈膝 · 坐下"],miniSquat:["臀部后移 · 小蹲","用腿站起"],extend:["伸膝 · 不锁死","放下换边"],
 wallPush:["屈肘靠近墙","推墙回到起点"],palmPress:["轻轻推压","放松肩膀"],forwardPress:["向前推 · 呼气","收回 · 吸气"],
 elbowPull:["弯肘 · 向后拉","伸回 · 不耸肩"],towelPull:["向两侧轻拉","放松 · 不松手"],lowRow:["手肘向后拉","有控制地伸回"],
 crossMarch:["对侧手靠近膝","放下 · 换边"],kneePress:["手膝轻轻相推","放松 · 换边"],sideReach:["小幅侧伸","坐直 · 换边"],
 heel:["脚跟抬起","有控制地落下"],toeLift:["脚尖抬起","脚跟始终着地"],seatedHeel:["脚跟抬起","脚尖始终着地"],
 side:["侧抬 · 身体不歪","轻放 · 换边"],weightShift:["向一侧移重心","回中间 · 换边"],backLeg:["向后抬 · 不塌腰","轻放 · 换边"],
 standMarch:["抬膝 · 对侧摆臂","落脚 · 换边"],stepJack:["向旁迈步 · 抬臂","收回 · 换边"],squat:["臀部后坐 · 双臂前伸","推地站直"],
 reverseLunge:["向后退步 · 下沉","推回站直 · 换边"],wallSlide:["背贴墙下滑","推地站起"],inclinePush:["屈肘 · 胸口靠近桌边","推回 · 身体成直线"],
 chairDip:["屈肘 · 下降一小段","撑起 · 不耸肩"],hingeRow:["屈肘向后拉","慢慢放下"],towelPulldown:["拉紧毛巾 · 向下拉","举回头顶"],
 standCross:["提膝 · 对侧手靠近","放下 · 换边"],tableKneeDrive:["膝盖提向胸口","放回 · 换边"],goodMorning:["臀部后推 · 前倾","臀部发力 · 站直"],
 singleCalf:["单脚踮起","慢慢落下 · 换脚"],wallToe:["抬起脚尖","慢慢放下"],singleLegStand:["提膝 · 站稳","放下 · 换边"],singleLegHinge:["前倾 · 后腿抬起","收回站直 · 换边"]
};
// Default plans share no moves, so switching level visibly changes all seven.
const DEFAULT_PLANS={
 strong:["stepJack","reverseLunge","chairDip","hingeRow","goodMorning","singleCalf","singleLegHinge"],
 standard:["standMarch","squat","inclinePush","towelPulldown","standCross","heel","singleLegStand"],
 gentle:["march","stand","wallPush","elbowPull","kneePress","seatedHeel","weightShift"]
};
const LEVEL_BY_KEY=Object.fromEntries(LEVELS.map(l=>[l.key,l]));
const inLevel=(item,key)=>item.levels.includes(key);
Stickman.setAvatar(storage.get("cq-avatar-v1"));
function selectAvatar(value){
  Stickman.setAvatar(value);storage.set("cq-avatar-v1",Stickman.getAvatar());syncAvatar();observeThumbnails();renderPractice();
}
function syncAvatar(){
  const value=Stickman.getAvatar();document.querySelectorAll("[data-avatar]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.avatar===value)));
  $("trainer-avatar").value=value;syncHero();
}
// The home figure demonstrates a signature move of the chosen level.
const HERO_MOVES={strong:"reverseLunge",standard:"squat",gentle:"stand"};
function syncHero(){
  const item=ITEM_BY_ID[HERO_MOVES[level]];$("hero-move").textContent=item.name;
  $("hero-canvas").setAttribute("aria-label",t("heroAria",{who:t(Stickman.getAvatar()==="female"?"whoFemale":"whoMale"),name:item.name}));Stickman.draw($("hero-canvas"),item.id,PEAK,HERO);
}
// Each level keeps its own plan; the gentle level still reads plans saved before levels existed.
function loadPlan(key){
  try{const saved=JSON.parse(storage.get("cq-plan-v3-"+key)||(key==="gentle"?storage.get("cq-plan-v2"):null));
    if(Array.isArray(saved)&&saved.length===7&&saved.every((id,i)=>ITEM_BY_ID[id]?.key===CATEGORIES[i].key&&inLevel(ITEM_BY_ID[id],key)))return saved.map(id=>ITEM_BY_ID[id]);}catch{}
  return DEFAULT_PLANS[key].map(id=>ITEM_BY_ID[id]);
}
let level=LEVEL_BY_KEY[storage.get("cq-level-v1")]?storage.get("cq-level-v1"):"gentle",plan=loadPlan(level);
function levelLabel(key=level){return LEVEL_BY_KEY[key].age+" · "+LEVEL_BY_KEY[key].name;}
// One level for the whole page: the hero picker and the library tabs both set it.
function selectLevel(key){
  if(!LEVEL_BY_KEY[key]||state.open)return;const changed=key!==level;level=key;storage.set("cq-level-v1",key);plan=loadPlan(key);libraryScope="level";
  syncLevel();renderPlan();renderLibrary();
  // The plan list is usually off screen, so name the new plan wherever the switch happened.
  if(changed)toast(t("switched",{level:levelLabel(),plan:plan.map(i=>i.name).join(t("listSep"))}));
}
function syncLevel(){
  document.querySelectorAll(".level-options [data-level]").forEach(button=>{button.setAttribute("aria-pressed",String(button.dataset.level===level));const l=LEVEL_BY_KEY[button.dataset.level];button.innerHTML="<b>"+l.age+"</b><span>"+l.name+"</span>";});
  $("level-hint").textContent=LEVEL_BY_KEY[level].hint;syncHero();
}
let toastTimer;
function toast(text){const box=$("toast");box.textContent=text;box.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{box.hidden=true;},6000);}
// Seconds of rest between moves.
const REST=15;
const state={open:false,preview:false,index:0,list:plan,mode:"closed",elapsed:0,clockStart:0,clockBase:0,clockAudio:false,voice:true,operation:0,reference:false,restUntil:0,restRemaining:REST,holdRest:false,beat:-1,opener:null};
let visibleCanvases=new Set(),heroVisible=true;
state.cam={yaw:0,pitch:0};state.sway=storage.get("cq-sway-v1")!=="0"&&!(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches||false;
class CountAudio {
  constructor(){this.context=null;this.buffer=null;this.node=null;this.gain=null;this.sessionMode="default";}
  configurePlaybackSession(){
    // iOS otherwise treats Web Audio as ambient sound, which follows silent mode.
    // This configures the existing engine; it does not add another audio player.
    this.sessionMode="default";
    try{
      const session=window.navigator?.audioSession;
      if(session){session.type="playback";if(session.type==="playback")this.sessionMode="playback";}
    }catch{this.sessionMode="unavailable";}
  }
  modeLabel(){return t(this.sessionMode==="playback"?"modeMedia":"modeDefault");}
  ensure(){
    this.configurePlaybackSession();
    if(!this.context){
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C)throw new Error(t("errNoEngine"));
      this.context=new C();this.gain=this.context.createGain();this.gain.connect(this.context.destination);
      this.context.addEventListener("statechange",()=>{if(this.context.state!=="running"&&state.mode==="running"&&state.clockAudio)pausePractice(t("sysPaused"));});
    }
    // One recording per language (一二三四 or one-two-three-four, same format and timing). A recording
    // that is not built in is decoded once its download arrives (see unlock).
    this.buffers=this.buffers||{};const raw=this.bytes(lang);
    if(!this.buffers[lang]&&raw instanceof Uint8Array)this.buffers[lang]=this.decode(raw);
    this.buffer=this.buffers[lang]||null;
    return this.context;
  }
  // The Chinese count is built into the page; another language's is downloaded the first time it is needed.
  bytes(code){
    this.raw=this.raw||{};
    if(!this.raw[code]){
      const src=$(code==="en"?"count-audio-en":"count-audio-source").dataset.src;
      if(src.startsWith("data:")){const b=atob(src.split(",")[1]),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);this.raw[code]=u;}
      else this.raw[code]=fetch(src).then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer();}).then(a=>this.raw[code]=new Uint8Array(a))
        .catch(()=>{delete this.raw[code];throw new Error(t("errDownload"));});
    }
    return this.raw[code];
  }
  prefetch(code){const r=this.bytes(code);if(typeof r.then==="function")r.catch(()=>{});}
  decode(bytes){
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let channels=0,rate=0,bits=0,data=0,length=0;
    for(let p=12;p+8<=bytes.length;){const tag=String.fromCharCode(...bytes.subarray(p,p+4)),size=view.getUint32(p+4,true);
      if(p+8+size>bytes.length)throw new Error(t("errIncomplete"));
      if(tag==="fmt "){if(view.getUint16(p+8,true)!==1)throw new Error(t("errFormat"));channels=view.getUint16(p+10,true);rate=view.getUint32(p+12,true);bits=view.getUint16(p+22,true);}
      if(tag==="data"){data=p+8;length=size;}p+=8+size+(size%2);
    }
    if(channels!==1||bits!==16||rate!==16000||length!==128000)throw new Error(t("errSamples"));
    const buffer=this.context.createBuffer(1,length/2,rate);
    const samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=view.getInt16(data+i*2,true)/32768;
    return buffer;
  }
  async unlock(){
    const c=this.ensure();let timer;const resumed=c.resume();
    const pulse=c.createBufferSource();pulse.buffer=c.createBuffer(1,1,c.sampleRate);pulse.connect(c.destination);pulse.onended=()=>pulse.disconnect();pulse.start();
    try{await Promise.race([resumed,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(t("errNotStarted"))),3500);})]);}
    finally{clearTimeout(timer);}
    if(c.state!=="running")throw new Error(t("errSuspended"));
    // resume() above ran inside the tap; a recording still downloading is awaited only now.
    if(!this.buffer){const code=lang,bytes=await this.bytes(code);this.buffers[code]=this.buffers[code]||this.decode(bytes);if(code===lang)this.buffer=this.buffers[code];}
  }
  start(offset=0,loop=true){
    this.stop();const c=this.context;if(!c||c.state!=="running")throw new Error(t("errTapResume"));
    const n=c.createBufferSource();n.buffer=this.buffer;n.loop=loop;n.loopStart=0;n.loopEnd=4;n.connect(this.gain);
    const start=c.currentTime+.025;n.start(start,((offset%4)+4)%4);this.node=n;
    n.onended=()=>{n.disconnect();if(this.node===n)this.node=null;};return start;
  }
  // Audio time at the speaker, smooth between hardware callbacks.
  now(){
    const c=this.context,t=c.currentTime;let heard=t;
    try{const s=c.getOutputTimestamp&&c.getOutputTimestamp();
      if(s&&s.contextTime>0&&s.performanceTime>0)heard=Math.min(t+.05,Math.max(t-.35,s.contextTime+(performance.now()-s.performanceTime)/1000));
    }catch{}
    return this.heard=Math.max(this.heard||0,heard);
  }
  mute(muted){if(this.gain)this.gain.gain.setValueAtTime(muted?0:1,this.context.currentTime);}
  stop(){if(this.node){this.node.onended=null;try{this.node.stop();}catch{}this.node.disconnect();this.node=null;}}
}
const audio=new CountAudio();
function setStatus(text){$("trainer-status").textContent=text||t(state.voice?"hintVoice":"hintMuted");$("trainer-status").hidden=false;}
function soundStatus(text){$("sound-status").textContent=text;}
let testToken=0,testTimer;
async function testSound(){
  if(state.open)return;const token=++testToken;clearTimeout(testTimer);audio.stop();soundStatus(t("soundStarting"));
  try{await audio.unlock();if(token!==testToken||state.open)return;audio.mute(false);audio.start(0,false);soundStatus(t("soundPlaying",{mode:audio.modeLabel()}));
    testTimer=setTimeout(()=>{if(token===testToken)soundStatus(t("soundEnded",{mode:audio.modeLabel()}));},4200);
  }catch(error){if(token===testToken)soundStatus(t("soundFail",{msg:error.message}));}
}
function randomIndex(n){const v=new Uint32Array(1);if(window.crypto?.getRandomValues){window.crypto.getRandomValues(v);return v[0]%n;}return Math.floor(Math.random()*n);}
function newPlan(){
  plan=CATEGORIES.map((c,i)=>{const options=ITEMS.filter(x=>x.key===c.key&&inLevel(x,level)&&x.id!==plan[i].id);return options[randomIndex(options.length)];});
  storage.set("cq-plan-v3-"+level,JSON.stringify(plan.map(i=>i.id)));renderPlan();$("plan-summary").textContent=t("planNew");
}
function thumbnail(item){return '<canvas data-exercise="'+item.id+'" aria-hidden="true"></canvas>';}
const observer=typeof IntersectionObserver==="function"?new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)visibleCanvases.add(e.target);else visibleCanvases.delete(e.target);});},{rootMargin:"50px"}):null;
// Thumbnails show the most-worked pose; moves not yet computed are queued and drawn once ready.
const PEAK=1.9,STAGE={theme:"dark",sync:true,trail:true,ghost:true},HERO={...STAGE,theme:"light"},THUMB={theme:"light",small:true};let pendingThumbs=new Set();
function observeThumbnails(){visibleCanvases.clear();pendingThumbs.clear();if(observer)observer.disconnect();document.querySelectorAll("canvas[data-exercise]").forEach(canvas=>{if(!Stickman.draw(canvas,canvas.dataset.exercise,PEAK,THUMB))pendingThumbs.add(canvas);if(observer)observer.observe(canvas);});}
function renderPlan(){
  $("plan-list").innerHTML=plan.map(item=>"<li>"+thumbnail(item)+'<div><h3>'+item.name+'</h3><p>'+item.category+" · "+t(item.alternating?"perSide":"total8")+'</p></div><button data-preview="'+item.id+'" aria-label="'+t("previewLabel",{name:item.name})+'">'+t("previewBtn")+'</button></li>').join("");
  $("plan-level").textContent=levelLabel();$("plan-summary").textContent=t("planSummary");observeThumbnails();
}
function levelTags(item){return '<span class="level-tags">'+LEVELS.filter(l=>inLevel(item,l.key)).map(l=>"<span"+(l.key===level?' class="current"':"")+">"+l.short+"</span>").join("")+"</span>";}
// The library shows the current level ("level") or all three ("every"), narrowed by category.
let libraryScope="level",libraryCategory="all";
function setLibrary({scope,category}={}){if(scope)libraryScope=scope;if(category)libraryCategory=category;renderLibrary();}
function renderLibrary(){
  const pool=libraryScope==="every"?ITEMS:ITEMS.filter(i=>inLevel(i,level)),levels=$("library-levels"),filters=$("library-filters");
  // Buttons are built once and then updated, so keyboard focus survives a switch.
  if(!levels.childElementCount)levels.innerHTML=LEVELS.map(l=>'<button data-level="'+l.key+'" aria-label="'+l.age+" · "+l.name+'"><b>'+l.short+"</b><span>"+l.name+"</span></button>").join("")+'<button data-scope="every"><b>'+t("all")+"</b><span>"+t("allCount",{n:ITEMS.length})+"</span></button>";
  if(!filters.childElementCount)filters.innerHTML=[{key:"all",label:t("all")},...CATEGORIES].map(c=>'<button data-filter="'+c.key+'">'+c.label+"<small></small></button>").join("");
  levels.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.scope?libraryScope==="every":libraryScope==="level"&&b.dataset.level===level)));
  filters.querySelectorAll("button").forEach(b=>{const key=b.dataset.filter;b.setAttribute("aria-pressed",String(libraryCategory===key));const count=b.querySelector("small");if(count)count.textContent=key==="all"?pool.length:pool.filter(i=>i.key===key).length;});
  $("library-list").innerHTML=pool.filter(i=>libraryCategory==="all"||i.key===libraryCategory).map(item=>'<article class="library-item">'+thumbnail(item)+'<div class="library-body"><h3>'+item.name+"</h3>"+levelTags(item)+"<p>"+item.purpose+'</p><button data-preview="'+item.id+'" aria-label="'+t("howToLabel",{name:item.name})+'">'+t("howTo")+'</button></div></article>').join("");observeThumbnails();
}
function current(){return state.list[state.index];}
// The trainer's camera turns slowly around the move by default, so its shape reads from every side.
function syncView(){const b=$("view-label");b.textContent=t(state.sway?"viewTurning":"viewFixed");b.setAttribute("aria-pressed",String(state.sway));}
function toggleView(){state.sway=!state.sway;state.cam={yaw:0,pitch:0};storage.set("cq-sway-v1",state.sway?"1":"0");syncView();}
// Dragging (mouse or touch) turns the camera. The automatic turn stops at the angle on screen, so the
// view does not jump; a double tap, or the view button, goes back to the default.
const SWAY=36,swayAngle=(amp,clock)=>amp*Math.sin(2*Math.PI*clock/14);
function trainerCamera(){const v=Stickman.find(current().id).view;return {yaw:v.yaw+state.cam.yaw,pitch:Math.max(0,Math.min(40,v.pitch+state.cam.pitch))};}
function beginTurn(){if(state.sway){state.cam.yaw+=swayAngle(SWAY,performance.now()/1000);state.sway=false;syncView();}return {...state.cam};}
function turnView(from,dx,dy){state.cam={yaw:from.yaw+dx*.5,pitch:Math.max(-10,Math.min(30,from.pitch+dy*.25))};}
function draggable(el,begin,turn,reset){
  let from=null;
  el.addEventListener("pointerdown",e=>{from={x:e.clientX,y:e.clientY,moved:false,cam:null};el.setPointerCapture?.(e.pointerId);});
  el.addEventListener("pointermove",e=>{if(!from)return;const dx=e.clientX-from.x,dy=e.clientY-from.y;
    if(!from.moved){if(Math.hypot(dx,dy)<4)return;from.moved=true;from.cam=begin();}turn(from.cam,dx,dy);});
  const end=()=>{from=null;};el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);el.addEventListener("dblclick",reset);
}
function updateExercise(){
  const item=current();state.beat=-1;state.reference=false;$("trainer").classList.remove("reference-mode");$("reference-toggle").setAttribute("aria-pressed","false");$("reference-toggle").textContent=t("startEnd");
  $("progress-label").textContent=state.preview?t("preview"):t("moveOf",{n:state.index+1,total:state.list.length});
  $("progress-fill").style.width=(state.preview?100:state.index/state.list.length*100)+"%";
  $("exercise-category").textContent=item.category+(item.alternating?t("alternating"):"");
  $("exercise-name").textContent=item.name;$("exercise-purpose").textContent=item.purpose;
  $("exercise-steps").innerHTML=item.steps.map(s=>"<li>"+s+"</li>").join("");$("exercise-cue").textContent=item.cue;$("exercise-cue").dataset.label=t("cueLabel");
  syncView();$("trainer-canvas").setAttribute("aria-label",t("trainerAria",{name:item.name,view:t(Stickman.find(item.id).view.yaw>45?"viewSide":"viewFront")}));
  $("previous-exercise").disabled=state.preview||state.index===0;$("next-exercise").disabled=state.preview;
  $("rep-total").textContent=t(state.preview?"repsDemo":"reps");$("transition").hidden=true;setStatus("");renderPractice();
  if(!reducedMotion)$("trainer-canvas").animate?.([{opacity:0},{opacity:1}],{duration:450,easing:"ease-out"});
}
function elapsedNow(){if(state.mode!=="running")return state.elapsed;const now=state.clockAudio?audio.now():performance.now()/1000;return state.clockBase+Math.max(0,now-state.clockStart);}
async function resumePractice(){
  if(state.reference){state.reference=false;$("trainer").classList.remove("reference-mode");$("reference-toggle").setAttribute("aria-pressed","false");$("reference-toggle").textContent=t("startEnd");}
  const token=++state.operation;state.mode="starting";$("pause-workout").textContent=t("starting");setStatus("");
  try{
    if(state.voice){await audio.unlock();if(token!==state.operation||!state.open)return;audio.mute(false);state.clockStart=audio.start(state.elapsed,true);state.clockAudio=true;if(!state.preview)audio.node.stop(state.clockStart+32-state.elapsed);}
    else{state.clockStart=performance.now()/1000;state.clockAudio=false;}
    if(token!==state.operation||!state.open)return;state.clockBase=state.elapsed;state.mode="running";$("pause-workout").textContent=t("pause");
  }catch(error){if(token!==state.operation)return;state.mode="paused";$("pause-workout").textContent=t("retry");setStatus(t("startFail",{msg:error.message}));}
}
function pausePractice(message=""){if(!state.open)return;state.elapsed=elapsedNow();state.operation++;audio.stop();state.mode="paused";$("pause-workout").textContent=t("resume");setStatus(message);renderPractice();}
function openPractice(id){
  testToken++;clearTimeout(testTimer);audio.stop();state.opener=document.activeElement;state.open=true;state.preview=typeof id==="string";state.list=state.preview?[ITEM_BY_ID[id]]:plan.slice();state.index=0;state.elapsed=0;state.mode="paused";
  $("trainer").showModal();document.body.classList.add("training");updateExercise();resumePractice();$("pause-workout").focus();
}
function closePractice(){late=0;slow=false;state.operation++;testToken++;audio.stop();state.open=false;state.mode="closed";$("trainer").close();document.body.classList.remove("training");state.opener?.focus();}
function togglePause(){if(state.mode==="running"||state.mode==="starting"){pausePractice();return;}if(state.mode==="paused")resumePractice();}
function toggleVoice(){const running=state.mode==="running";if(running||state.mode==="starting")pausePractice();state.voice=!state.voice;$("voice-toggle").textContent=t(state.voice?"soundOn":"soundOff");$("voice-toggle").setAttribute("aria-pressed",String(state.voice));setStatus("");if(running)resumePractice();}
function navigateExercise(delta){state.operation++;audio.stop();state.mode="paused";state.index=Math.max(0,Math.min(state.list.length-1,state.index+delta));state.elapsed=0;updateExercise();resumePractice();}
function startRest(){
  state.elapsed=32;audio.stop();state.operation++;state.mode="rest";state.holdRest=false;state.restRemaining=REST;state.restUntil=performance.now()/1000+REST;
  $("transition").hidden=false;$("transition-pause").hidden=false;$("transition-canvas").hidden=state.index===state.list.length-1;$("transition-next").hidden=false;$("transition-pause").textContent=t("restLonger");$("progress-fill").style.width=((state.index+1)/state.list.length*100)+"%";
  if(state.index===state.list.length-1){state.mode="done";$("transition-kicker").textContent=t("doneKicker");$("transition-title").textContent=t("doneTitle");$("transition-count").textContent="✓";$("transition-description").textContent=t("doneText");$("transition-pause").hidden=true;$("transition-next").textContent=t("restDone");return;}
  $("transition-kicker").textContent=t("restKicker");$("transition-title").textContent=t("restNext",{name:state.list[state.index+1].name});$("transition-description").textContent=state.list[state.index+1].steps[0];$("transition-next").textContent=t("restReady");$("transition-count").textContent="20";
}
function restNext(){if(state.mode==="done"){closePractice();return;}if(state.mode==="rest")navigateExercise(1);}
function holdRest(){state.holdRest=!state.holdRest;if(!state.holdRest)state.restUntil=performance.now()/1000+state.restRemaining;$("transition-pause").textContent=t(state.holdRest?"restResume":"restLonger");}
function renderPractice(){
  if(!state.open)return;const item=current(),time=elapsedNow(),phase=(time%4)/4,rep=Math.min(8,Math.floor(time/4)+1),beat=Math.floor(time%4)+1;
  Stickman.draw($("trainer-canvas"),item.id,time,{...STAGE,...trainerCamera(),turnable:!state.sway,sway:state.sway?SWAY:0,clock:performance.now()/1000,pair:state.reference,rep:Math.floor(time/4)%2,labels:[t("startPose"),t("endPose")]});
  if(state.beat!==beat){state.beat=beat;$("beat-count").textContent=beat;$("rep-count").textContent=state.preview?"—":rep;[...$("rhythm-bar").querySelectorAll("span")].forEach((e,i)=>e.classList.toggle("active",i===beat-1));
    if(state.mode==="running"&&!reducedMotion)$("beat-count").animate?.([{transform:"scale(1.25)"},{transform:"scale(1)"}],{duration:280,easing:"ease-out"});}
  const cue=state.reference?t("compare"):state.mode==="paused"?t("paused"):phaseCue(item.id,phase<.5?0:1);if($("phase-cue").textContent!==cue)$("phase-cue").textContent=cue;
}
let lastThumbs=0,lastFrame=0,late=0,slow=false,warm=0;
function frame(now){
  requestAnimationFrame(frame);if(document.hidden)return;
  const gap=now-lastFrame;if(slow&&gap<30)return;lastFrame=now;
  // If the running trainer keeps missing frames, settle at a steady ~30 fps.
  if(state.mode!=="running")warm=0;else if(++warm>30&&!slow&&gap<100){late=late*.99+(gap>25?.01:0);slow=late>.2;}
  animate(now);
}
function animate(now){
  const t=reducedMotion?PEAK:now/1000;
  if(state.open){
    if(state.mode==="rest"){
      if(!state.holdRest)state.restRemaining=Math.max(0,Math.ceil(state.restUntil-now/1000));
      const count=String(state.holdRest?t("restWord"):state.restRemaining);if($("transition-count").textContent!==count)$("transition-count").textContent=count;
      if(!state.holdRest&&state.restRemaining===0){restNext();return;}
      Stickman.draw($("transition-canvas"),state.list[state.index+1].id,t,{theme:"light",sync:true});return;
    }
    if(state.mode==="done")return;if(state.mode==="running"&&!state.preview&&elapsedNow()>=32){startRest();return;}renderPractice();
  }else{
    if(now-lastThumbs<30)return;lastThumbs=now;if(heroVisible)Stickman.draw($("hero-canvas"),HERO_MOVES[level],t,{...HERO,yaw:Stickman.find(HERO_MOVES[level]).view.yaw+heroCam.yaw,turnable:!heroCam.sway,sway:heroCam.sway?30:0,clock:t});
    pendingThumbs.forEach(c=>{if(Stickman.draw(c,c.dataset.exercise,PEAK,THUMB))pendingThumbs.delete(c);});
    if(!reducedMotion)visibleCanvases.forEach(c=>Stickman.draw(c,c.dataset.exercise,t,THUMB));
  }
}
$("test-sound").addEventListener("click",testSound);$("start-workout").addEventListener("click",()=>openPractice());$("start-workout-2").addEventListener("click",()=>openPractice());$("new-plan").addEventListener("click",newPlan);
document.addEventListener("click",event=>{const preview=event.target.closest("[data-preview]");if(preview)openPractice(preview.dataset.preview);const filter=event.target.closest("[data-filter]");if(filter)setLibrary({category:filter.dataset.filter});const scope=event.target.closest("[data-scope]");if(scope)setLibrary({scope:scope.dataset.scope});const avatar=event.target.closest("[data-avatar]");if(avatar)selectAvatar(avatar.dataset.avatar);const lv=event.target.closest("[data-level]");if(lv)selectLevel(lv.dataset.level);});
$("trainer-avatar").addEventListener("change",event=>selectAvatar(event.target.value));$("view-label").addEventListener("click",toggleView);
draggable($("trainer-canvas"),beginTurn,turnView,()=>{if(!state.sway)toggleView();});
// On the home page only sideways drags turn the figure; vertical swipes still scroll the page.
const heroCam={yaw:0,sway:!reducedMotion};
draggable($("hero-canvas"),()=>{if(heroCam.sway){heroCam.yaw+=swayAngle(30,performance.now()/1000);heroCam.sway=false;}return {yaw:heroCam.yaw};},(from,dx)=>{heroCam.yaw=from.yaw+dx*.5;},()=>{heroCam.yaw=0;heroCam.sway=!reducedMotion;});
$("close-trainer").addEventListener("click",closePractice);$("trainer").addEventListener("cancel",e=>{e.preventDefault();closePractice();});$("pause-workout").addEventListener("click",togglePause);$("voice-toggle").addEventListener("click",toggleVoice);
$("previous-exercise").addEventListener("click",()=>navigateExercise(-1));$("next-exercise").addEventListener("click",()=>state.index===state.list.length-1?startRest():navigateExercise(1));
$("reference-toggle").addEventListener("click",()=>{state.reference=!state.reference;$("trainer").classList.toggle("reference-mode",state.reference);if(state.reference&&(state.mode==="running"||state.mode==="starting"))pausePractice();$("reference-toggle").setAttribute("aria-pressed",String(state.reference));$("reference-toggle").textContent=t(state.reference?"backToAnim":"startEnd");renderPractice();});
$("transition-next").addEventListener("click",restNext);$("transition-pause").addEventListener("click",holdRest);
document.addEventListener("visibilitychange",()=>{if(document.hidden){testToken++;clearTimeout(testTimer);if(state.open){if(state.mode==="running"||state.mode==="starting")pausePractice(t("leftPage"));if(state.mode==="rest"&&!state.holdRest)holdRest();}else audio.stop();}});
// Keys in the trainer, whatever has focus: Space or → next move (or end the rest), ← previous, P pause.
function nextMove(){if(state.mode==="rest"||state.mode==="done")restNext();else if(!state.preview)state.index===state.list.length-1?startRest():navigateExercise(1);}
document.addEventListener("keydown",e=>{
  if(!state.open||e.altKey||e.ctrlKey||e.metaKey||e.target.tagName==="SELECT")return;
  const key=e.code==="Space"||e.key==="ArrowRight"?"next":e.key==="ArrowLeft"?"prev":e.key==="p"||e.key==="P"?"pause":null;
  if(!key)return;e.preventDefault();if(e.repeat)return;
  if(key==="next")nextMove();
  else if(key==="prev"){if(state.mode!=="rest"&&state.mode!=="done"&&!state.preview&&state.index>0)navigateExercise(-1);}
  else if(state.mode==="rest")holdRest();else if(state.mode!=="done")togglePause();
},true);
window.addEventListener("resize",()=>{observeThumbnails();renderPractice();});
if(typeof IntersectionObserver==="function")new IntersectionObserver(e=>{heroVisible=e[0].isIntersecting;}).observe($("hero-canvas"));
// Static page text, then a language switch that relabels everything in place (not during a workout).
function applyStatic(){
  if(document.documentElement)document.documentElement.lang=lang==="en"?"en":"zh-CN";
  document.title=t("title");document.querySelector?.('meta[name="description"]')?.setAttribute("content",t("description"));
  document.querySelectorAll("[data-i18n]").forEach(el=>{el.textContent=t(el.dataset.i18n);});
  document.querySelectorAll("[data-i18n-html]").forEach(el=>{el.innerHTML=t(el.dataset.i18nHtml);});
  document.querySelectorAll("[data-i18n-aria]").forEach(el=>{el.setAttribute("aria-label",t(el.dataset.i18nAria));});
  document.querySelectorAll("[data-i18n-title]").forEach(el=>{el.setAttribute("title",t(el.dataset.i18nTitle));});
}
function setLang(next){
  if(next!=="zh"&&next!=="en"||state.open)return;lang=next;storage.set("cq-lang-v1",next);localizeData();applyStatic();
  $("library-levels").innerHTML="";$("library-filters").innerHTML="";soundStatus(t("soundIdle"));audio.stop();audio.buffer=null;audio.prefetch(lang);
  syncAvatar();syncLevel();renderPlan();renderLibrary();
}
$("lang-toggle").addEventListener("click",()=>setLang(lang==="en"?"zh":"en"));
// Privacy and terms open as dialogs from #privacy / #terms, so the links can be shared.
const LEGAL=["privacy","terms"];
function syncLegal(){
  if(typeof location!=="object"||state.open)return;const want=location.hash.slice(1);
  for(const id of LEGAL){const box=$(id);if(id===want&&!box.open)box.showModal();else if(id!==want&&box.open)box.close();}
}
for(const id of LEGAL){
  const box=$(id);
  box.addEventListener("close",()=>{if(typeof location==="object"&&location.hash==="#"+id)history.replaceState(null,"",location.pathname+location.search);});
  box.addEventListener("click",e=>{if(e.target===box||e.target.closest?.("[data-close]"))box.close();});
}
window.addEventListener("hashchange",syncLegal);
applyStatic();syncAvatar();syncLevel();renderPlan();renderLibrary();requestAnimationFrame(frame);syncLegal();
if(lang!=="zh")audio.prefetch(lang);
