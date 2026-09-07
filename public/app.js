"use strict";
const $=id=>document.getElementById(id);
const ITEMS=CATEGORIES.flatMap(category=>LIBRARY[category.key].map(item=>({...item,key:category.key,category:category.label})));
const ITEM_BY_ID=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
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
 side:["侧抬 · 身体不歪","轻放 · 换边"],weightShift:["向一侧移重心","回中间 · 换边"],backLeg:["向后抬 · 不塌腰","轻放 · 换边"]
};
const DEFAULT_IDS=["march","stand","wallPush","elbowPull","kneePress","seatedHeel","weightShift"];
const storage={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
Motion.setAvatar(storage.get("cq-avatar-v1"));
function selectAvatar(value){
  Motion.setAvatar(value);storage.set("cq-avatar-v1",Motion.getAvatar());syncAvatar();observeThumbnails();renderPractice();
  Motion.draw($("hero-canvas"),"stand",.5);
}
function syncAvatar(){
  const value=Motion.getAvatar();document.querySelectorAll("[data-avatar]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.avatar===value)));
  $("trainer-avatar").value=value;
  $("hero-canvas").setAttribute("aria-label",(value==="female"?"女":"男")+"示范人物，坐站起身关节动画");
}
let plan=DEFAULT_IDS.map(id=>ITEM_BY_ID[id]);
try{const saved=JSON.parse(storage.get("cq-plan-v2"));if(Array.isArray(saved)&&saved.length===7&&saved.every((id,i)=>ITEM_BY_ID[id]?.key===CATEGORIES[i].key))plan=saved.map(id=>ITEM_BY_ID[id]);}catch{}
const state={open:false,preview:false,index:0,list:plan,mode:"closed",elapsed:0,clockStart:0,clockBase:0,clockAudio:false,voice:true,operation:0,reference:false,restUntil:0,restRemaining:20,holdRest:false,beat:-1,opener:null};
let visibleCanvases=new Set(),heroVisible=true;
const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches||false;
class CountAudio {
  constructor(){this.context=null;this.buffer=null;this.node=null;this.gain=null;}
  ensure(){
    if(!this.context){
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C)throw new Error("此浏览器未提供音频引擎");
      this.context=new C();this.gain=this.context.createGain();this.gain.connect(this.context.destination);
      this.context.addEventListener("statechange",()=>{if(this.context.state!=="running"&&state.mode==="running"&&state.clockAudio)pausePractice("声音被系统暂停；点「继续」后恢复。");});
    }
    if(!this.buffer){
      const raw=$("count-audio-source").dataset.src;
      if(!raw.startsWith("data:audio/wav;base64,"))throw new Error("录音还未打包，请打开正式首页");
      const binary=atob(raw.split(",")[1]), bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      const view=new DataView(bytes.buffer);let channels=0,rate=0,bits=0,data=0,length=0;
      for(let p=12;p+8<=bytes.length;){const tag=String.fromCharCode(...bytes.subarray(p,p+4)),size=view.getUint32(p+4,true);
        if(p+8+size>bytes.length)throw new Error("录音文件不完整");
        if(tag==="fmt "){if(view.getUint16(p+8,true)!==1)throw new Error("录音格式不正确");channels=view.getUint16(p+10,true);rate=view.getUint32(p+12,true);bits=view.getUint16(p+22,true);}
        if(tag==="data"){data=p+8;length=size;}p+=8+size+(size%2);
      }
      if(channels!==1||bits!==16||rate!==16000||length!==128000)throw new Error("录音采样不正确");
      this.buffer=this.context.createBuffer(1,length/2,rate);
      const samples=this.buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=view.getInt16(data+i*2,true)/32768;
    }
    return this.context;
  }
  async unlock(){
    const c=this.ensure();let timer;const resumed=c.resume();
    const pulse=c.createBufferSource();pulse.buffer=c.createBuffer(1,1,c.sampleRate);pulse.connect(c.destination);pulse.onended=()=>pulse.disconnect();pulse.start();
    try{await Promise.race([resumed,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("音频引擎未启动，请检查浏览器声音权限")),3500);})]);}
    finally{clearTimeout(timer);}
    if(c.state!=="running")throw new Error("音频引擎被系统暂停");
  }
  start(offset=0,loop=true){
    this.stop();const c=this.context;if(!c||c.state!=="running")throw new Error("请点继续，重新启动声音");
    const n=c.createBufferSource();n.buffer=this.buffer;n.loop=loop;n.loopStart=0;n.loopEnd=4;n.connect(this.gain);
    const start=c.currentTime+.025;n.start(start,((offset%4)+4)%4);this.node=n;
    n.onended=()=>{n.disconnect();if(this.node===n)this.node=null;};return start;
  }
  mute(muted){if(this.gain)this.gain.gain.setValueAtTime(muted?0:1,this.context.currentTime);}
  stop(){if(this.node){this.node.onended=null;try{this.node.stop();}catch{}this.node.disconnect();this.node=null;}}
}
const audio=new CountAudio();
function setStatus(text){$("trainer-status").textContent=text;$("trainer-status").hidden=!text;}
function soundStatus(text){$("sound-status").textContent=text;}
let testToken=0,testTimer;
async function testSound(){
  if(state.open)return;const token=++testToken;clearTimeout(testTimer);audio.stop();soundStatus("正在启动计数声音…");
  try{await audio.unlock();if(token!==testToken||state.open)return;audio.mute(false);audio.start(0,false);soundStatus("录音播放中：一、二、三、四。");
    testTimer=setTimeout(()=>{if(token===testToken)soundStatus("录音播放结束。听到数拍后，就可以开始跟练。");},4200);
  }catch(error){if(token===testToken)soundStatus("未能播放："+error.message+"。");}
}
function randomIndex(n){const v=new Uint32Array(1);if(window.crypto?.getRandomValues){window.crypto.getRandomValues(v);return v[0]%n;}return Math.floor(Math.random()*n);}
function newPlan(){
  plan=CATEGORIES.map((c,i)=>{const options=ITEMS.filter(x=>x.key===c.key&&x.id!==plan[i].id);return options[randomIndex(options.length)];});
  storage.set("cq-plan-v2",JSON.stringify(plan.map(i=>i.id)));renderPlan();$("plan-summary").textContent="已换好一组：七个类别均保留，每个动作都与上一组不同。";
}
function thumbnail(item){return '<canvas data-exercise="'+item.id+'" aria-hidden="true"></canvas>';}
const observer=typeof IntersectionObserver==="function"?new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)visibleCanvases.add(e.target);else visibleCanvases.delete(e.target);});},{rootMargin:"50px"}):null;
function observeThumbnails(){visibleCanvases.clear();if(observer)observer.disconnect();document.querySelectorAll("canvas[data-exercise]").forEach(canvas=>{Motion.draw(canvas,canvas.dataset.exercise,.55,1,{small:true});if(observer)observer.observe(canvas);});}
function renderPlan(){
  $("coverage-strip").innerHTML=CATEGORIES.map(c=>"<span>"+c.label+"</span>").join("");
  $("plan-list").innerHTML=plan.map(item=>"<li>"+thumbnail(item)+'<div><h3>'+item.name+'</h3><p>'+item.category+" · "+(item.alternating?"每侧 4 次":"共 8 次")+'</p></div><button data-preview="'+item.id+'" aria-label="预览'+item.name+'">预览 ↗</button></li>').join("");
  $("plan-summary").textContent="7 个动作 · 动作间休息 20 秒 · 可延长休息";observeThumbnails();
}
function renderLibrary(filter="all"){
  $("library-filters").innerHTML=[{key:"all",label:"全部 "+ITEMS.length+" 个"},{key:"new",label:"新增 "+ITEMS.filter(i=>i.isNew).length+" 个"},...CATEGORIES.map(c=>({...c,label:c.label+" · "+LIBRARY[c.key].length}))].map(c=>'<button data-filter="'+c.key+'" aria-pressed="'+(filter===c.key)+'">'+c.label+"</button>").join("");
  $("library-list").innerHTML=ITEMS.filter(i=>filter==="all"||(filter==="new"?i.isNew:i.key===filter)).map(item=>'<article class="library-item">'+thumbnail(item)+'<div><h3>'+item.name+'</h3><p>'+item.purpose+'</p><button data-preview="'+item.id+'">查看动作与要点 ↗</button></div></article>').join("");observeThumbnails();
}
function current(){return state.list[state.index];}
function updateExercise(){
  const item=current();state.beat=-1;state.reference=false;$("trainer").classList.remove("reference-mode");$("reference-toggle").setAttribute("aria-pressed","false");$("reference-toggle").textContent="看起止姿势";
  $("progress-label").textContent=state.preview?"动作预览":"动作 "+(state.index+1)+" / "+state.list.length;
  $("progress-fill").style.width=(state.preview?100:state.index/state.list.length*100)+"%";
  $("exercise-category").textContent=item.category+(item.alternating?" · 左右交替":"");
  $("exercise-name").textContent=item.name;$("exercise-purpose").textContent=item.purpose;
  $("exercise-steps").innerHTML=item.steps.map(s=>"<li>"+s+"</li>").join("");$("exercise-cue").textContent=item.cue;
  $("view-label").textContent=Motion.view(item.id);$("trainer-canvas").setAttribute("aria-label",item.name+"，"+Motion.view(item.id)+"，橙色表示动作部位");
  $("previous-exercise").disabled=state.preview||state.index===0;$("next-exercise").disabled=state.preview;
  $("rep-total").textContent=state.preview?"/ 示范":"/ 8 次";$("transition").hidden=true;setStatus("");renderPractice();
}
function elapsedNow(){if(state.mode!=="running")return state.elapsed;const now=state.clockAudio?audio.context.currentTime:performance.now()/1000;return state.clockBase+Math.max(0,now-state.clockStart);}
async function resumePractice(){
  if(state.reference){state.reference=false;$("trainer").classList.remove("reference-mode");$("reference-toggle").setAttribute("aria-pressed","false");$("reference-toggle").textContent="看起止姿势";}
  const token=++state.operation;state.mode="starting";$("pause-workout").textContent="准备中…";setStatus("");
  try{
    if(state.voice){await audio.unlock();if(token!==state.operation||!state.open)return;audio.mute(false);state.clockStart=audio.start(state.elapsed,true);state.clockAudio=true;}
    else{state.clockStart=performance.now()/1000;state.clockAudio=false;}
    if(token!==state.operation||!state.open)return;state.clockBase=state.elapsed;state.mode="running";$("pause-workout").textContent="暂停";
  }catch(error){if(token!==state.operation)return;state.mode="paused";$("pause-workout").textContent="重试声音";setStatus("未能启动声音："+error.message+"。可重试，或手动关闭声音后继续。");}
}
function pausePractice(message=""){if(!state.open)return;state.elapsed=elapsedNow();state.operation++;audio.stop();state.mode="paused";$("pause-workout").textContent="继续";setStatus(message);renderPractice();}
function openPractice(id){
  testToken++;clearTimeout(testTimer);audio.stop();state.opener=document.activeElement;state.open=true;state.preview=typeof id==="string";state.list=state.preview?[ITEM_BY_ID[id]]:plan.slice();state.index=0;state.elapsed=0;state.mode="paused";
  $("trainer").showModal();document.body.classList.add("training");updateExercise();resumePractice();$("close-trainer").focus();
}
function closePractice(){state.operation++;testToken++;audio.stop();state.open=false;state.mode="closed";$("trainer").close();document.body.classList.remove("training");state.opener?.focus();}
function togglePause(){if(state.mode==="running"||state.mode==="starting"){pausePractice();return;}if(state.mode==="paused")resumePractice();}
function toggleVoice(){const running=state.mode==="running";if(running||state.mode==="starting")pausePractice();state.voice=!state.voice;$("voice-toggle").textContent=state.voice?"声音开":"声音关";$("voice-toggle").setAttribute("aria-pressed",String(state.voice));if(running)resumePractice();}
function navigateExercise(delta){state.operation++;audio.stop();state.mode="paused";state.index=Math.max(0,Math.min(state.list.length-1,state.index+delta));state.elapsed=0;updateExercise();resumePractice();}
function startRest(){
  state.elapsed=32;audio.stop();state.operation++;state.mode="rest";state.holdRest=false;state.restRemaining=20;state.restUntil=performance.now()/1000+20;
  $("transition").hidden=false;$("transition-pause").hidden=false;$("transition-next").hidden=false;$("transition-pause").textContent="多休息一下";$("progress-fill").style.width=((state.index+1)/state.list.length*100)+"%";
  if(state.index===state.list.length-1){state.mode="done";$("transition-kicker").textContent="这一组，完成了";$("transition-title").textContent="今天又多动了一点";$("transition-count").textContent="✓";$("transition-description").textContent="坐稳，放松，按需补水。稍后再分段走动，不必一次练完所有运动量。";$("transition-pause").hidden=true;$("transition-next").textContent="完成，回到首页";return;}
  $("transition-kicker").textContent="先休息，再继续";$("transition-title").textContent="下一个："+state.list[state.index+1].name;$("transition-description").textContent=state.list[state.index+1].steps[0];$("transition-next").textContent="准备好了，继续 →";$("transition-count").textContent="20";
}
function restNext(){if(state.mode==="done"){closePractice();return;}if(state.mode==="rest")navigateExercise(1);}
function holdRest(){state.holdRest=!state.holdRest;if(!state.holdRest)state.restUntil=performance.now()/1000+state.restRemaining;$("transition-pause").textContent=state.holdRest?"恢复倒计时":"多休息一下";}
function renderPractice(){
  if(!state.open)return;const item=current(),time=elapsedNow(),phase=(time%4)/4,rep=Math.min(8,Math.floor(time/4)+1),beat=Math.floor(time%4)+1;
  const move=(1-Math.cos(phase*Math.PI*2))/2,side=Math.floor(time/4)%2?-1:1;Motion.draw($("trainer-canvas"),item.id,move,side,{comparison:state.reference});
  if(state.beat!==beat){state.beat=beat;$("beat-count").textContent=beat;$("rep-count").textContent=state.preview?"—":rep;[...$("rhythm-bar").querySelectorAll("span")].forEach((e,i)=>e.classList.toggle("active",i===beat-1));}
  $("phase-cue").textContent=state.reference?"对照起点与终点":state.mode==="paused"?"已暂停":PHASES[item.id][phase<.5?0:1];
}
let lastDraw=0;
function frame(now){
  requestAnimationFrame(frame);if(document.hidden||now-lastDraw<32)return;lastDraw=now;
  if(state.open){
    if(state.mode==="rest"){if(!state.holdRest)state.restRemaining=Math.max(0,Math.ceil(state.restUntil-now/1000));$("transition-count").textContent=state.holdRest?"休息":state.restRemaining;if(!state.holdRest&&state.restRemaining===0)restNext();return;}
    if(state.mode==="done")return;if(state.mode==="running"&&!state.preview&&elapsedNow()>=32){startRest();return;}renderPractice();
  }else{const t=reducedMotion?.5:(1-Math.cos(now/4000*Math.PI*2))/2;if(heroVisible)Motion.draw($("hero-canvas"),"stand",t);if(!reducedMotion)visibleCanvases.forEach(c=>Motion.draw(c,c.dataset.exercise,t,1,{small:true}));}
}
$("test-sound").addEventListener("click",testSound);$("start-workout").addEventListener("click",()=>openPractice());$("start-workout-2").addEventListener("click",()=>openPractice());$("new-plan").addEventListener("click",newPlan);
document.addEventListener("click",event=>{const preview=event.target.closest("[data-preview]");if(preview)openPractice(preview.dataset.preview);const filter=event.target.closest("[data-filter]");if(filter)renderLibrary(filter.dataset.filter);const avatar=event.target.closest("[data-avatar]");if(avatar)selectAvatar(avatar.dataset.avatar);});
$("trainer-avatar").addEventListener("change",event=>selectAvatar(event.target.value));
$("close-trainer").addEventListener("click",closePractice);$("trainer").addEventListener("cancel",e=>{e.preventDefault();closePractice();});$("pause-workout").addEventListener("click",togglePause);$("voice-toggle").addEventListener("click",toggleVoice);
$("previous-exercise").addEventListener("click",()=>navigateExercise(-1));$("next-exercise").addEventListener("click",()=>state.index===state.list.length-1?startRest():navigateExercise(1));
$("reference-toggle").addEventListener("click",()=>{state.reference=!state.reference;$("trainer").classList.toggle("reference-mode",state.reference);if(state.reference&&(state.mode==="running"||state.mode==="starting"))pausePractice();$("reference-toggle").setAttribute("aria-pressed",String(state.reference));$("reference-toggle").textContent=state.reference?"返回动画":"看起止姿势";renderPractice();});
$("transition-next").addEventListener("click",restNext);$("transition-pause").addEventListener("click",holdRest);
document.addEventListener("visibilitychange",()=>{if(document.hidden){testToken++;clearTimeout(testTimer);if(state.open){if(state.mode==="running"||state.mode==="starting")pausePractice("页面已离开，点继续恢复。");if(state.mode==="rest"&&!state.holdRest)holdRest();}else audio.stop();}});
document.addEventListener("keydown",e=>{if(e.code==="Space"&&state.open&&e.target.tagName!=="BUTTON"){e.preventDefault();togglePause();}});
window.addEventListener("resize",()=>{observeThumbnails();renderPractice();});
if(typeof IntersectionObserver==="function")new IntersectionObserver(e=>{heroVisible=e[0].isIntersecting;}).observe($("hero-canvas"));
syncAvatar();renderPlan();renderLibrary();requestAnimationFrame(frame);
