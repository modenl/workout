/* Small orthographic skeleton. World axes: x=left/right, y=up, z=forward.
   Fixed limb lengths and a two-bone solver keep elbows and knees connected. */
const Motion = (() => {
  let avatar="male";
  function setAvatar(value){avatar=value==="female"?"female":"male";}
  function getAvatar(){return avatar;}
  const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const mul=(a,s)=>a.map(v=>v*s), dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const norm=a=>Math.hypot(...a), unit=a=>mul(a,1/(norm(a)||1));
  const mix=(a,b,t)=>a+(b-a)*t, rad=d=>d*Math.PI/180;
  function ik(a,target,l1,l2,pole) {
    const delta=sub(target,a), raw=norm(delta), d=Math.min(l1+l2-.1,Math.max(.1,raw)), axis=unit(delta);
    const end=add(a,mul(axis,d)), along=(l1*l1-l2*l2+d*d)/(2*d);
    let bend=sub(pole,mul(axis,dot(pole,axis)));
    if(norm(bend)<.01)bend=sub([1,0,0],mul(axis,axis[0]));
    return [add(add(a,mul(axis,along)),mul(unit(bend),Math.sqrt(Math.max(0,l1*l1-along*along)))),end];
  }
  const sideViews=new Set(["stand","miniSquat","extend","wallPush","forwardPress","reachTap","elbowPull","lowRow","backLeg","toeLift","seatedHeel","armSwing","hamstringCurl","armRaise","bicepsCurl","hipHinge","anklePump","heelToe","forwardTap"]);
  const supported=new Set(["miniSquat","heel","side","weightShift","backLeg","hamstringCurl","forwardTap","sideTap"]);
  const standing=new Set(["stand","wallPush",...supported]);
  function view(id){return sideViews.has(id)?"侧面 · 面向右 →":"正面 · 如照镜子";}
  function pose(id,t,side=1) {
    const seated=!standing.has(id), isSide=sideViews.has(id);
    let hip=[0,seated?88:160,seated?-68:0], torso=[0,100,0];
    if(id==="stand"){hip=[0,mix(88,160,t),mix(-68,0,t)];torso=[0,100-10*Math.sin(Math.PI*t),24*Math.sin(Math.PI*t)];}
    if(id==="miniSquat"){hip=[0,160-30*t,-28*t];torso=[0,98,18*t];}
    if(id==="heel")hip[1]+=15*t;
    if(id==="weightShift"){hip[0]=side*21*t;hip[1]-=6*t;}
    if(id==="sideReach")torso=[side*17*t,100-3*t,0];
    if(id==="hipHinge")torso=[0,100*Math.cos(rad(12*t)),100*Math.sin(rad(12*t))];
    if(id==="diagonalReach")torso=[-side*8*t,100-2*t,8*t];
    if(id==="forwardTap"||id==="sideTap")hip[1]-=9*t;
    if(id==="wallPush"){const a=rad(15+10*t);hip=[0,10+150*Math.cos(a),150*Math.sin(a)];torso=[0,100*Math.cos(a),100*Math.sin(a)];}
    const shoulder=add(hip,torso), head=add(shoulder,mul(unit(torso),34));
    if(id==="shoulderLift")shoulder[1]+=8*t;
    const legs=[],arms=[];
    for(const s of [-1,1]){
      const active=s===side, h=add(hip,[s*19,0,0]);
      let k,f;
      if(id==="wallPush"){f=[s*22,10,0];[k]=ik(h,f,76,76,[0,0,1]);}
      else if(id==="stand"||id==="miniSquat"||id==="weightShift"){
        f=[s*(id==="weightShift"?38:24),10,8];[k]=ik(h,f,76,76,[0,0,1]);
      }else if(seated){
        let thigh=rad(90),shin=0,lateral=0;
        if(["march","crossMarch","kneePress"].includes(id)&&active)thigh+=rad(20*t);
        if(id==="extend"&&active)shin=rad(82*t);
        if(id==="anklePump"&&active)shin=rad(40*t);
        if(id==="reachTap"&&active)shin=rad(38*t);
        if(id==="seatedJack")lateral=s*20*t;
        if(id==="kneeOpen")lateral=s*22*t;
        const thighLength=Math.sqrt(76*76-lateral*lateral),shinLength=Math.sqrt(76*76-lateral*lateral/4);
        k=add(h,[lateral,-Math.cos(thigh)*thighLength,Math.sin(thigh)*thighLength]);
        f=add(k,[lateral/2,-Math.cos(shin)*shinLength,Math.sin(shin)*shinLength]);
        if(id==="reachTap"&&active){f=[h[0],12,8+40*t];[k,f]=ik(h,f,76,76,[0,0,1]);}
        if(id==="seatedHeel"){f=[h[0],12+12*t,31-Math.sqrt(23*23-144*t*t)];[k,f]=ik(h,f,76,76,[0,0,1]);}
        if(id==="heelToe"&&t>.5){const lift=12*(2*t-1);f=[h[0],12+lift,31-Math.sqrt(23*23-lift*lift)];[k,f]=ik(h,f,76,76,[0,0,1]);}
      }else{
        f=[s*24,10,6];if(id==="heel")f=[s*24,10+15*t,29-Math.sqrt(23*23-225*t*t)];
        if(id==="side"&&active){const a=rad(18*t);f=add(h,[s*150*Math.sin(a),-150*Math.cos(a),2]);}
        if(id==="backLeg"&&active){const a=rad(16*t);f=add(h,[0,-150*Math.cos(a),-150*Math.sin(a)]);}
        if(id==="forwardTap"&&active){f[2]+=40*t;f[1]+=8*Math.sin(Math.PI*t);}
        if(id==="sideTap"&&active){f[0]+=s*35*t;f[1]+=8*Math.sin(Math.PI*t);}
        [k,f]=ik(h,f,76,76,[0,0,1]);
        if(id==="hamstringCurl"&&active){const v=sub(f,k),a=rad(60*t);f=add(k,[v[0],v[1]*Math.cos(a)-v[2]*Math.sin(a),v[1]*Math.sin(a)+v[2]*Math.cos(a)]);}
      }
      let toe=add(f,[0,0,23]);
      if(id==="heel")toe=[f[0],10,29];
      if(id==="seatedHeel")toe=[f[0],12,31];
      if(id==="toeLift")toe=add(f,[0,23*Math.sin(rad(40*t)),23*Math.cos(rad(40*t))]);
      if(id==="anklePump"&&active)toe=add(f,[0,23*Math.sin(rad(35*t)),23*Math.cos(rad(35*t))]);
      if(id==="heelToe")toe=t>.5?[f[0],12,31]:add(f,[0,23*Math.sin(rad(35*(1-2*t))),23*Math.cos(rad(35*(1-2*t)))]);
      const legActive=["stand","miniSquat","heel","toeLift","seatedHeel","seatedJack","weightShift","kneeOpen","heelToe"].includes(id)||(["march","extend","reachTap","crossMarch","kneePress","side","backLeg","hamstringCurl","anklePump","forwardTap","sideTap"].includes(id)&&active);
      legs.push({s,h,k,f,toe,active:legActive});
      const sh=add(shoulder,[s*29,-4,0]);
      let hand=add(hip,[s*38,15,27]),pole=[s*.4,-1,0],armActive=false;
      if(id==="stand"){hand=add(hip,[s*32,0,24]);}
      if(supported.has(id)){hand=[s*30,190,80];}
      if(id==="armSwing"){hand=add(hip,[s*37,15+15*t,27+(active?38:-30)*t]);armActive=true;}
      if(id==="shoulderLift"){hand[1]+=8*t;armActive=true;}
      if(id==="armRaise"){hand=add(sh,[0,-107*Math.cos(rad(75*t)),107*Math.sin(rad(75*t))]);armActive=true;}
      if(id==="bicepsCurl"||id==="shoulderRotate")armActive=true;
      if(id==="chestOpen"){hand=add(hip,[s*(38+40*t),15+10*t,27-40*t]);armActive=true;}
      if(id==="hipHinge")hand=add(hip,[s*32,8,50]);
      if(id==="diagonalReach"&&active){const target=add(hip,[-s*19,15,82]);hand=hand.map((v,i)=>mix(v,target[i],t));armActive=true;}
      if(id==="wallPush"){hand=[s*29,240,132];pole=[s*.6,-1,0];armActive=true;}
      if(id==="march"){hand=add(hip,[s*37,30+(active?0:20*t),30+(active?0:20*t)]);}
      if(id==="seatedJack"){hand=add(shoulder,[s*(38+67*t),-80+69*t,9]);armActive=true;}
      if(["forwardPress","reachTap"].includes(id)){hand=add(shoulder,[s*27,-20,40+64*t]);armActive=true;}
      if(id==="palmPress"){hand=add(shoulder,[s*3,-30,55]);pole=[s,-.5,0];armActive=true;}
      if(id==="towelPull"){hand=add(shoulder,[s*70,-22,58]);pole=[s,-.5,-.2];armActive=true;}
      if(id==="elbowPull"){hand=add(shoulder,[s*32,-12,102-69*t]);pole=[s*.25,-.3,-1];armActive=true;}
      if(id==="lowRow"){hand=add(shoulder,[s*29,-48,88-54*t]);pole=[s*.25,-.3,-1];armActive=true;}
      if(id==="sideReach"){hand=add(hip,[s*(38+(active?33*t:0)),18-(active?10*t:0),16]);armActive=active;}
      arms.push({s,sh,hand,pole,active:armActive});
    }
    if(id==="crossMarch"||id==="kneePress"){
      const target=legs.find(l=>l.s===side).k;
      for(const a of arms)if(id==="kneePress"||a.s!==side){a.hand=add(target,[a.s*5,12,0]);a.active=true;}
    }
    for(const a of arms){
      if(id==="bicepsCurl"){const angle=rad(8+130*t);a.elbow=add(a.sh,[0,-56,0]);a.hand=add(a.elbow,[0,-54*Math.cos(angle),54*Math.sin(angle)]);}
      else if(id==="shoulderRotate"){const angle=rad(55*t);a.elbow=add(a.sh,[0,-56,0]);a.hand=add(a.elbow,[a.s*54*Math.sin(angle),0,54*Math.cos(angle)]);}
      else [a.elbow,a.hand]=ik(a.sh,a.hand,56,54,a.pole);
    }
    return {hip,shoulder,head,legs,arms,seated,isSide,id,t,side};
  }
  function draw(canvas,id,t=0,side=1,{comparison=false,small=false}={}) {
    const box=canvas.getBoundingClientRect(), w=box.width,h=box.height;
    if(!w||!h)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    if(comparison){
      const shift=sideViews.has(id)?.05:0,scale=Math.min(w/660,(h-36)/335);
      render(ctx,pose(id,0,side),w*(.25-shift),h*.87,scale,true);
      render(ctx,pose(id,1,side),w*(.75-shift),h*.87,scale,true);
      ctx.fillStyle="#355c4d";ctx.textAlign="center";ctx.font="13px system-ui";ctx.fillText("起始姿势",w*.25,22);ctx.fillText("动作终点",w*.75,22);
    }else render(ctx,pose(id,t,side),w*.48,h*(small?.96:.92),Math.min(w/(small?255:440),(h-(small?5:15))/335),small);
  }
  function render(ctx,p,cx,cy,scale,small){
    const a=rad(p.isSide?73:12);
    const project=v=>[v[0]*Math.cos(a)+v[2]*Math.sin(a),-v[1]+(-v[0]*Math.sin(a)+v[2]*Math.cos(a))*.12];
    const depth=v=>-v[0]*Math.sin(a)+v[2]*Math.cos(a);
    ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);
    const line=(v1,v2,color,width=5)=>{const u=project(v1),v=project(v2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(...u);ctx.lineTo(...v);ctx.stroke();};
    const circle=(v,r,color)=>{const q=project(v);ctx.fillStyle=color;ctx.beginPath();ctx.arc(q[0],q[1],r,0,Math.PI*2);ctx.fill();};
    const poly=(vs,color)=>{ctx.fillStyle=color;ctx.beginPath();vs.forEach((v,i)=>{const q=project(v);if(i)ctx.lineTo(...q);else ctx.moveTo(...q);});ctx.closePath();ctx.fill();};
    ctx.fillStyle="#ccd4c2";ctx.beginPath();ctx.ellipse(15,3,125,13,0,0,Math.PI*2);ctx.fill();
    const chair=(z,seatY,backY)=>{
      const c="#7d9180";
      for(const x of [-42,42]){line([x,0,z-35],[x,backY,z-35],c,6);line([x,0,z+34],[x,seatY,z+34],c,6);}
      poly([[-45,seatY,z-38],[45,seatY,z-38],[45,seatY,z+38],[-45,seatY,z+38]],"#bac7ad");
      line([-44,backY,z-35],[44,backY,z-35],c,12);
      line([-44,seatY,z+36],[44,seatY,z+36],c,7);
    };
    if(p.seated||p.id==="stand")chair(-60,76,163);
    if(supported.has(p.id))chair(115,86,190);
    if(p.id==="wallPush"){poly([[-65,0,132],[65,0,132],[65,325,132],[-65,325,132]],"#d5ddca");line([-65,0,132],[-65,325,132],"#9dad97",4);}
    const segments=[];
    for(const l of p.legs){
      const color=l.active?"#c45532":"#344c5b";
      segments.push({a:l.h,b:l.k,c:color,w:23},{a:l.k,b:l.f,c:color,w:19},{a:l.f,b:l.toe,c:"#213f36",w:13});
    }
    for(const arm of p.arms){const color=arm.active?"#c45532":"#507768";segments.push({a:arm.sh,b:arm.elbow,c:color,w:17},{a:arm.elbow,b:arm.hand,c:"#d9a27f",w:14});}
    // Render far limbs, body, then near limbs for clear front/back occlusion.
    segments.sort((x,y)=>depth(add(x.a,x.b))-depth(add(y.a,y.b)));
    const cut=depth(p.hip)*2;
    const drawSegment=s=>{line(s.a,s.b,"#f1f1e5",s.w+3);line(s.a,s.b,s.c,s.w);};
    segments.filter(s=>depth(add(s.a,s.b))<cut).forEach(drawSegment);
    const hp=project(p.hip),sp=project(p.shoulder),female=avatar==="female",bodyHalf=p.isSide?17:(female?25:29),waist=female?bodyHalf-5:bodyHalf-3;
    ctx.fillStyle="#2c6552";ctx.beginPath();ctx.moveTo(hp[0]-bodyHalf,hp[1]);ctx.lineTo(hp[0]+bodyHalf,hp[1]);ctx.quadraticCurveTo(hp[0]+waist,hp[1]-42,sp[0]+bodyHalf+3,sp[1]);ctx.quadraticCurveTo(sp[0],sp[1]-7,sp[0]-bodyHalf-3,sp[1]);ctx.quadraticCurveTo(hp[0]-waist,hp[1]-42,hp[0]-bodyHalf,hp[1]);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#63917a";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sp[0]-bodyHalf+6,sp[1]+9);ctx.lineTo(hp[0]-waist+5,hp[1]-9);ctx.stroke();
    line(add(p.hip,[-23,0,0]),add(p.hip,[23,0,0]),"#214d3f",12);
    line(p.shoulder,add(p.head,[0,-14,0]),"#d9a27f",14);
    segments.filter(s=>depth(add(s.a,s.b))>=cut).forEach(drawSegment);
    for(const l of p.legs){circle(l.k,5,"#f5eedc");circle(l.k,2.5,l.active?"#a7482c":"#456252");}
    for(const arm of p.arms){circle(arm.elbow,4.5,"#f5eedc");circle(arm.hand,7,"#d9a27f");}
    // The two mature, athletic appearances share the exact same motion rig.
    const head=project(p.head);ctx.save();ctx.translate(...head);
    const path=(color,draw)=>{ctx.fillStyle=color;ctx.beginPath();draw();ctx.closePath();ctx.fill();};
    const stroke=(color,width,draw)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.beginPath();draw();ctx.stroke();};
    const hair="#26312e",skin="#dba47f",lightSkin="#e9b992";
    if(female)path(hair,()=>{ctx.moveTo(-15,-18);ctx.bezierCurveTo(-39,-26,-40,-4,-31,10);ctx.quadraticCurveTo(-26,21,-33,31);ctx.bezierCurveTo(-11,22,-21,3,-15,-18);});
    if(p.isSide){
      path(skin,()=>{ctx.moveTo(-17,-16);ctx.quadraticCurveTo(1,-30,15,-17);ctx.lineTo(18,-2);ctx.lineTo(24,5);ctx.quadraticCurveTo(26,8,18,10);ctx.lineTo(16,19);ctx.quadraticCurveTo(7,28,-4,21);ctx.lineTo(-16,10);});
      path(lightSkin,()=>{ctx.moveTo(-7,-15);ctx.quadraticCurveTo(10,-25,15,-14);ctx.lineTo(16,-1);ctx.lineTo(22,5);ctx.lineTo(15,8);ctx.lineTo(13,17);ctx.quadraticCurveTo(5,21,-4,15);});
      path(hair,()=>{ctx.moveTo(-19,9);ctx.bezierCurveTo(-28,-8,-20,-29,0,-28);ctx.quadraticCurveTo(15,-29,19,-18);ctx.quadraticCurveTo(7,-9,-6,-12);ctx.lineTo(-10,5);ctx.lineTo(-15,8);});
      stroke("#1e302d",2,()=>{ctx.moveTo(6,-3);ctx.lineTo(13,-2);});
      stroke("#2a3932",1.7,()=>{ctx.moveTo(8,2);ctx.lineTo(12,3);});
      stroke("#9f604a",1.3,()=>{ctx.moveTo(11,14);ctx.quadraticCurveTo(15,15,17,13);});
      ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(-10,6,4,6,-.1,0,Math.PI*2);ctx.fill();
      stroke("#b57c5e",1,()=>{ctx.moveTo(-11,4);ctx.quadraticCurveTo(-6,2,-9,9);});
      if(!female)stroke("#536254",1.3,()=>{ctx.moveTo(-17,-9);ctx.lineTo(-17,-2);});
    }else{
      path(skin,()=>{ctx.moveTo(-19,-13);ctx.quadraticCurveTo(0,-28,19,-13);ctx.lineTo(18,10);ctx.quadraticCurveTo(female?14:17,21,0,25);ctx.quadraticCurveTo(female?-14:-17,21,-18,10);});
      path(lightSkin,()=>{ctx.moveTo(-13,-12);ctx.quadraticCurveTo(2,-23,16,-12);ctx.lineTo(15,10);ctx.quadraticCurveTo(9,20,1,21);ctx.quadraticCurveTo(-11,16,-13,-12);});
      path(hair,()=>{ctx.moveTo(-20,5);ctx.bezierCurveTo(-28,-21,-11,-31,7,-27);ctx.quadraticCurveTo(24,-27,21,-9);ctx.lineTo(18,3);ctx.lineTo(14,-12);ctx.quadraticCurveTo(5,-13,0,-18);ctx.quadraticCurveTo(-7,-9,-15,-9);ctx.lineTo(-17,5);});
      stroke("#26382f",1.8,()=>{ctx.moveTo(-12,-2);ctx.quadraticCurveTo(-8,-4,-4,-2);ctx.moveTo(5,-2);ctx.quadraticCurveTo(9,-4,13,-1);});
      stroke("#25372f",1.6,()=>{ctx.moveTo(-11,3);ctx.quadraticCurveTo(-8,1,-5,3);ctx.moveTo(6,3);ctx.quadraticCurveTo(9,1,12,3);});
      stroke("#b67c5d",1.2,()=>{ctx.moveTo(1,3);ctx.lineTo(-1,10);ctx.lineTo(3,11);});
      stroke("#9f604a",1.5,()=>{ctx.moveTo(-5,16);ctx.quadraticCurveTo(1,20,7,15);});
    }
    stroke("#4c5b4e",1.3,()=>{ctx.moveTo(-13,-19);ctx.quadraticCurveTo(-3,-25,8,-22);});
    ctx.restore();
    if(p.id==="towelPull"){line(p.arms[0].hand,p.arms[1].hand,p.t>.3?"#c45532":"#bd9857",5);}
    if(p.id==="palmPress"&&p.t>.3){const q=project(p.arms[0].hand);ctx.strokeStyle="#c45532";ctx.lineWidth=2;ctx.beginPath();ctx.arc(q[0],q[1],14+p.t*5,0,Math.PI*2);ctx.stroke();}
    if(!small&&p.isSide){ctx.fillStyle="#4d6a59";ctx.font="13px system-ui";ctx.textAlign="center";ctx.fillText("后", -106,21);ctx.fillText("前 →",113,21);}
    ctx.restore();
  }
  return {draw,pose,view,ik,setAvatar,getAvatar};
})();
