const INK = "#173a34";
const ORANGE = "#df714d";
const WHITE = "#fffdf8";
const GUIDE = "rgba(23,58,52,.22)";

const state = { speed: 0.72, allPaused: false };
const animations = [];

function lerp(a, b, t) { return a + (b - a) * t; }
function ease(t) { return .5 - Math.cos(Math.PI * t) / 2; }
function point(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }; }

function limb(ctx, a, b, width = 18, color = INK) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}
function joint(ctx, p, r = 8) { ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); }
function head(ctx, p, r = 27) { ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
function chair(ctx, x, y, scale = 1) {
  ctx.strokeStyle = INK; ctx.lineWidth = 11 * scale; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, y - 155*scale); ctx.lineTo(x, y - 20*scale); ctx.moveTo(x, y - 75*scale); ctx.lineTo(x + 105*scale, y - 75*scale); ctx.lineTo(x + 105*scale, y); ctx.moveTo(x + 18*scale, y - 72*scale); ctx.lineTo(x + 18*scale, y); ctx.stroke();
}
function arrow(ctx, x1, y1, x2, y2) {
  const angle = Math.atan2(y2-y1, x2-x1);
  ctx.save(); ctx.strokeStyle = ORANGE; ctx.fillStyle = ORANGE; ctx.lineWidth = 6; ctx.setLineDash([10,10]);
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-18*Math.cos(angle-.55),y2-18*Math.sin(angle-.55)); ctx.lineTo(x2-18*Math.cos(angle+.55),y2-18*Math.sin(angle+.55)); ctx.closePath(); ctx.fill(); ctx.restore();
}
function label(ctx, text, x, y) { ctx.fillStyle = INK; ctx.font = "700 18px PingFang SC, sans-serif"; ctx.textAlign = "center"; ctx.fillText(text, x, y); }

function standing(ctx, c, opt = {}) {
  const hip = {x:c.x, y:c.y-145+(opt.rise||0)}, shoulder={x:c.x+(opt.lean||0), y:c.y-260+(opt.rise||0)}, hd={x:shoulder.x,y:shoulder.y-52};
  const ankleRise=opt.ankleRise||0;
  const footL={x:c.x-34+(opt.sideL||0),y:c.y+ankleRise}, footR={x:c.x+34+(opt.sideR||0),y:c.y+ankleRise};
  const kneeL=point(hip,footL,.52), kneeR=point(hip,footR,.52);
  limb(ctx,hip,shoulder,22); limb(ctx,hip,kneeL); limb(ctx,kneeL,footL); limb(ctx,hip,kneeR); limb(ctx,kneeR,footR);
  if(ankleRise<0){ limb(ctx,footL,{x:footL.x+18,y:c.y},8,INK); limb(ctx,footR,{x:footR.x+18,y:c.y},8,INK); }
  head(ctx,hd); joint(ctx,hip); joint(ctx,kneeL,7); joint(ctx,kneeR,7);
  return {hip,shoulder,head:hd,footL,footR};
}
function seated(ctx, c, legT = 0, march = false) {
  chair(ctx,c.x-74,c.y,1); const hip={x:c.x,y:c.y-82}, shoulder={x:c.x,y:c.y-205}, hd={x:c.x,y:c.y-255};
  limb(ctx,hip,shoulder,22); head(ctx,hd); joint(ctx,hip);
  const knee1={x:c.x+72,y:c.y-74-(march?34*legT:0)};
  const foot1= march ? {x:c.x+75,y:c.y-6-55*legT} : {x:c.x+72+92*legT,y:c.y-3-70*legT};
  const knee2={x:c.x+12,y:c.y-35}, foot2={x:c.x+15,y:c.y};
  limb(ctx,hip,knee2); limb(ctx,knee2,foot2); limb(ctx,hip,knee1,18,ORANGE); limb(ctx,knee1,foot1,18,ORANGE); joint(ctx,knee1); joint(ctx,foot1,6);
  const hand={x:c.x+45,y:c.y-117}; limb(ctx,shoulder,hand,15);
}

const drawers = {
  march(ctx,c,t){ seated(ctx,c,t,true); arrow(ctx,c.x+118,c.y-8,c.x+118,c.y-78); },
  extend(ctx,c,t){ seated(ctx,c,t,false); arrow(ctx,c.x+90,c.y-45,c.x+182,c.y-78); },
  stand(ctx,c,t){
    chair(ctx,c.x-125,c.y,1); const hip={x:c.x-42+42*t,y:c.y-82-65*t}, shoulder={x:c.x-40+40*t,y:c.y-205-55*t}, hd={x:shoulder.x,y:shoulder.y-52};
    const foot1={x:c.x-15,y:c.y},foot2={x:c.x+48,y:c.y},k1={x:c.x+22,y:c.y-46-34*t},k2={x:c.x+60,y:c.y-48-32*t};
    limb(ctx,hip,shoulder,22); head(ctx,hd); limb(ctx,hip,k1,18,ORANGE);limb(ctx,k1,foot1,18,ORANGE);limb(ctx,hip,k2);limb(ctx,k2,foot2);joint(ctx,hip);joint(ctx,k1);
    const hand={x:c.x-100+34*t,y:c.y-112-65*t};limb(ctx,shoulder,hand,15); arrow(ctx,c.x+132,c.y-100,c.x+132,c.y-215);
  },
  push(ctx,c,t){
    const wallX=c.x+145; ctx.strokeStyle=INK;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(wallX,c.y-340);ctx.lineTo(wallX,c.y+5);ctx.stroke();
    const shift=48*t, hip={x:c.x-77+25*t,y:c.y-135},shoulder={x:c.x-75+shift,y:c.y-255},hd={x:shoulder.x-10,y:shoulder.y-49};
    const foot={x:c.x-80,y:c.y},knee=point(hip,foot,.52);limb(ctx,foot,knee);limb(ctx,knee,hip);limb(ctx,hip,shoulder,22);head(ctx,hd);
    const hand={x:wallX,y:c.y-245},elbow={x:lerp(shoulder.x,wallX,.55),y:c.y-220+28*t};limb(ctx,shoulder,elbow,18,ORANGE);limb(ctx,elbow,hand,18,ORANGE);joint(ctx,elbow);joint(ctx,hand,7);arrow(ctx,c.x+15,c.y-310,c.x+83,c.y-310);
  },
  heel(ctx,c,t){
    chair(ctx,c.x+85,c.y,1); const rise=-22*t; const fig=standing(ctx,{x:c.x,y:c.y},{rise,ankleRise:-24*t});
    const hand={x:c.x+92,y:c.y-175};limb(ctx,fig.shoulder,hand,15); joint(ctx,hand,6); arrow(ctx,c.x-95,c.y-5,c.x-95,c.y-70);
  },
  side(ctx,c,t){
    chair(ctx,c.x+105,c.y,1); const fig=standing(ctx,{x:c.x,y:c.y},{sideL:-82*t}); const hand={x:c.x+110,y:c.y-180};limb(ctx,fig.shoulder,hand,15);joint(ctx,hand,6);arrow(ctx,c.x-55,c.y-45,c.x-145,c.y-45);
  }
};

const phases = {
  march:["准备：坐稳","抬：脚离地","回：轻轻放下"], stand:["准备：脚踩稳","起：身体向上","回：慢慢坐下"], push:["准备：手扶墙","动：身体靠近墙","推：回到站直"], extend:["准备：坐稳","伸：小腿向前","回：慢慢放下"], heel:["准备：扶稳椅背","踮：脚跟向上","回：慢慢落地"], side:["准备：扶稳椅背","侧：腿向旁抬","回：脚慢慢收回"]
};

function setupCanvas(card) {
  const canvas=card.querySelector("canvas"), ctx=canvas.getContext("2d"), type=card.dataset.exercise, phaseEl=card.querySelector(".phase"), button=card.querySelector(".play-toggle");
  const item={canvas,ctx,type,phaseEl,button,paused:false,start:performance.now()}; animations.push(item);
  button.addEventListener("click",()=>{ item.paused=!item.paused; button.textContent=item.paused?"播放":"暂停"; button.setAttribute("aria-label",`${item.paused?"播放":"暂停"}${card.querySelector("h3").textContent}动画`); });
}

function frame(now) {
  for(const a of animations){
    const rect=a.canvas.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,2), w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
    if(a.canvas.width!==w||a.canvas.height!==h){a.canvas.width=w;a.canvas.height=h;}
    const ctx=a.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
    ctx.strokeStyle=GUIDE;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rect.width*.12,rect.height*.83);ctx.lineTo(rect.width*.88,rect.height*.83);ctx.stroke();
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cycle=(reduced||a.paused||state.allPaused)?.08:((now-a.start)*state.speed/4000)%1;
    const wave=cycle<.5?ease(cycle*2):ease((1-cycle)*2);
    const phaseIndex=cycle<.18?0:cycle<.56?1:2; a.phaseEl.textContent=phases[a.type][phaseIndex];
    ctx.save(); const scale=Math.min(rect.width/620,rect.height/520); ctx.translate(rect.width/2,rect.height*.83);ctx.scale(scale,scale);ctx.translate(0,-430);
    drawers[a.type](ctx,{x:0,y:430},wave); label(ctx,phaseIndex===1?"慢慢用力":"稳稳控制",0,35); ctx.restore();
  }
  requestAnimationFrame(frame);
}

document.querySelectorAll(".exercise").forEach(setupCanvas);
document.querySelectorAll("[data-speed]").forEach(btn=>btn.addEventListener("click",()=>{
  state.speed=btn.dataset.speed==="slow"?.72:1.15;
  document.querySelectorAll("[data-speed]").forEach(b=>b.classList.toggle("is-active",b===btn));
}));
document.querySelector("#pause-all").addEventListener("click",e=>{
  state.allPaused=!state.allPaused;e.currentTarget.textContent=state.allPaused?"全部播放":"全部暂停";e.currentTarget.classList.toggle("is-active",state.allPaused);
});
document.querySelector("#read-guide").addEventListener("click",()=>{
  if(!("speechSynthesis" in window)) return;
  speechSynthesis.cancel(); const text="今天做六个动作：抬、起、推、伸、踮、侧。每个动作五到八次，动作之间休息二十到三十秒。使用牢固椅子，慢慢做，不要憋气。";
  const u=new SpeechSynthesisUtterance(text);u.lang="zh-CN";u.rate=.78;speechSynthesis.speak(u);
});
requestAnimationFrame(frame);
