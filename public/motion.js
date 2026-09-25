/* Small orthographic skeleton. World axes: x=left/right, y=up, z=forward.
   Fixed limb lengths and a two-bone solver keep elbows and knees connected. */
const Motion = (() => {
  let avatar="male";
  function setAvatar(value){avatar=value==="female"?"female":"male";}
  function getAvatar(){return avatar;}
  const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const mul=(a,s)=>a.map(v=>v*s), dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const norm=a=>Math.hypot(...a), unit=a=>mul(a,1/(norm(a)||1));
  const mix=(a,b,t)=>a+(b-a)*t, rad=d=>d*Math.PI/180, lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
  const clamp=(v,lo=0,hi=1)=>Math.min(hi,Math.max(lo,v)), smooth=u=>(u=clamp(u))*u*(3-2*u);
  // Minimum-jerk timing (natural reaching): out on beats 1–2, back on 3–4, settling at each end.
  const minJerk=u=>u*u*u*(10+u*(6*u-15));
  function ease(phase){const p=((phase%1)+1)%1;return minJerk(p<.5?2*p:2-2*p);}
  function ik(a,target,l1,l2,pole) {
    const delta=sub(target,a), raw=norm(delta), d=Math.min(l1+l2-.1,Math.max(.1,raw)), axis=unit(delta);
    const end=add(a,mul(axis,d)), along=(l1*l1-l2*l2+d*d)/(2*d);
    let bend=sub(pole,mul(axis,dot(pole,axis)));
    if(norm(bend)<.01)bend=sub([1,0,0],mul(axis,axis[0]));
    return [add(add(a,mul(axis,along)),mul(unit(bend),Math.sqrt(Math.max(0,l1*l1-along*along)))),end];
  }
  const sideViews=new Set(["stand","miniSquat","extend","wallPush","forwardPress","reachTap","elbowPull","lowRow","backLeg","toeLift","seatedHeel","armSwing","hamstringCurl","armRaise","bicepsCurl","hipHinge","anklePump","heelToe","forwardTap",
    "standMarch","squat","reverseLunge","wallSlide","inclinePush","chairDip","hingeRow","tableKneeDrive","goodMorning","singleCalf","wallToe","singleLegHinge"]);
  const supported=new Set(["miniSquat","heel","side","weightShift","backLeg","hamstringCurl","forwardTap","sideTap","singleCalf","singleLegStand","singleLegHinge"]);
  const standing=new Set(["stand","wallPush",...supported,"standMarch","stepJack","squat","reverseLunge","wallSlide","inclinePush","hingeRow","tableKneeDrive","standCross","goodMorning","wallToe"]);
  const lean=d=>[0,100*Math.cos(rad(d)),100*Math.sin(rad(d))];
  // Incline moves: a straight body pivoting on the toes, hands fixed on a table edge (arms straight at INCLINE).
  const FOOT_Z=-115,INCLINE=37,plankAt=d=>({hip:[0,10+150*Math.cos(rad(d)),FOOT_Z+150*Math.sin(rad(d))],torso:lean(d)});
  const TABLE_HAND=[29,10+250*Math.cos(rad(INCLINE))-4-105*Math.sin(rad(INCLINE)),FOOT_Z+250*Math.sin(rad(INCLINE))+105*Math.cos(rad(INCLINE))],TABLE_Y=TABLE_HAND[1]-7;
  function view(id){return sideViews.has(id)?"侧面 · 面向右 →":"正面 · 如照镜子";}
  function pose(id,t,side=1) {
    const seated=!standing.has(id), isSide=sideViews.has(id);
    let hip=[0,seated?88:160,seated?-68:0], torso=[0,100,0], rise=0;
    if(id==="stand"){
      // Lean until the head is over the toes, lift off, then rise as the trunk straightens.
      rise=smooth((t-.22)/.78);hip=[0,mix(88,160,rise),mix(-68,0,Math.pow(rise,.7))];
      const headZ=-68+78*smooth(t/.32)-10*smooth((t-.3)/.7),lean=Math.asin(clamp((headZ-hip[2])/134,0,.6));
      torso=[0,100*Math.cos(lean),100*Math.sin(lean)];
    }
    if(id==="miniSquat"){hip=[0,160-30*t,-28*t];torso=[0,98,18*t];}
    if(id==="heel")hip[1]+=15*t;
    if(id==="weightShift"){hip[0]=side*21*t;hip[1]-=6*t;}
    if(id==="sideReach")torso=[side*17*t,100-3*t,0];
    if(id==="hipHinge")torso=[0,100*Math.cos(rad(12*t)),100*Math.sin(rad(12*t))];
    if(id==="diagonalReach")torso=[-side*8*t,100-2*t,8*t];
    if(id==="forwardTap"||id==="sideTap")hip[1]-=9*t;
    if(id==="wallPush"){const a=rad(15+10*t);hip=[0,10+150*Math.cos(a),150*Math.sin(a)];torso=[0,100*Math.cos(a),100*Math.sin(a)];}
    if(id==="squat"){hip=[0,160-65*t,-45*t];torso=lean(35*t);}
    if(id==="reverseLunge"){hip=[0,158-40*t,-12*t];torso=lean(6*t);}
    if(id==="wallSlide")hip=[0,150-50*t,-32];
    if(id==="wallToe"){hip=[0,155,-26];torso=lean(-6);}
    if(id==="inclinePush"||id==="tableKneeDrive")({hip,torso}=plankAt(id==="inclinePush"?INCLINE+9*t:INCLINE));
    if(id==="chairDip")hip=[0,86-26*t,-6];
    if(id==="hingeRow"){hip=[0,150,-22];torso=lean(42);}
    if(id==="goodMorning"){hip=[0,156,-22*t];torso=lean(45*t);}
    if(id==="singleCalf")hip=[side*8,160+15*t,10];
    if(id==="singleLegStand")hip[0]=-side*10*t;
    if(id==="singleLegHinge"){hip=[0,160,-6*t];torso=lean(38*t);}
    if(id==="standCross")torso=add(lean(16*t),[-side*8*t,0,0]);
    if(id==="stepJack")hip[1]-=4*t;
    const shoulder=add(hip,torso), head=add(shoulder,mul(unit(torso),34));
    if(id==="shoulderLift")shoulder[1]+=8*t;
    const legs=[],arms=[];
    for(const s of [-1,1]){
      const active=s===side, h=add(hip,[s*19,0,0]);
      let k,f;
      if(id==="wallPush"){f=[s*22,10,0];[k]=ik(h,f,76,76,[0,0,1]);}
      else if(id==="stand"||id==="miniSquat"||id==="weightShift"){
        f=[s*(id==="weightShift"?38:24),10,8];[k]=ik(h,f,76,76,[0,0,1]);
      }else if(id==="chairDip"){f=[s*22,10,50];[k]=ik(h,f,76,76,[0,0,1]);
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
        if(id==="wallSlide")f=[s*22,10,20];
        if(id==="wallToe")f=[s*22,10,12];
        if(id==="inclinePush"||id==="tableKneeDrive")f=[s*22,10,FOOT_Z];
        if(id==="tableKneeDrive"&&active)f=lerp(f,[s*22,48,-35],t);
        if(id==="reverseLunge"&&active)f=[s*24,10+12*t+10*Math.sin(Math.PI*t),6-93*t];
        if(id==="stepJack"&&active){f[0]+=s*30*t;f[1]+=8*Math.sin(Math.PI*t);}
        if(id==="singleCalf")f=active?[s*24,10+15*t,29-Math.sqrt(23*23-225*t*t)]:[s*22,55+15*t,-24];
        if(id==="singleLegHinge"&&active){const b=rad(38*t);f=add(h,[0,-150*Math.cos(b),-150*Math.sin(b)]);}
        // Knee lifts: the thigh swings forward from 10°, the shin stays 10° behind vertical.
        if(["standMarch","singleLegStand","standCross"].includes(id)&&active){const a=rad(10+({standMarch:70,singleLegStand:60,standCross:80}[id]-10)*t);k=add(h,[0,-76*Math.cos(a),76*Math.sin(a)]);f=add(k,[0,-76*Math.cos(rad(10)),-76*Math.sin(rad(10))]);}
        else [k,f]=ik(h,f,76,76,[0,0,1]);
        if(id==="hamstringCurl"&&active){const v=sub(f,k),a=rad(60*t);f=add(k,[v[0],v[1]*Math.cos(a)-v[2]*Math.sin(a),v[1]*Math.sin(a)+v[2]*Math.cos(a)]);}
      }
      let toe=add(f,[0,0,23]);
      if(id==="heel")toe=[f[0],10,29];
      if(id==="seatedHeel")toe=[f[0],12,31];
      if(id==="toeLift")toe=add(f,[0,23*Math.sin(rad(40*t)),23*Math.cos(rad(40*t))]);
      if(id==="anklePump"&&active)toe=add(f,[0,23*Math.sin(rad(35*t)),23*Math.cos(rad(35*t))]);
      if(id==="heelToe")toe=t>.5?[f[0],12,31]:add(f,[0,23*Math.sin(rad(35*(1-2*t))),23*Math.cos(rad(35*(1-2*t)))]);
      // The back foot ends on the ball of the foot: heel 12 up, toes on the floor.
      if(id==="reverseLunge"&&active){const c=Math.asin(12/23)*t;toe=add(f,[0,-23*Math.sin(c),23*Math.cos(c)]);}
      if(id==="singleCalf")toe=active?[f[0],10,29]:add(f,[0,-8,Math.sqrt(23*23-64)]);
      if(id==="wallToe")toe=add(f,[0,23*Math.sin(rad(40*t)),23*Math.cos(rad(40*t))]);
      // The lifted foot stays square to the leg, without dipping into the floor.
      if(id==="singleLegHinge"&&active){const c=Math.min(rad(38*t),Math.asin(clamp((f[1]-10)/23)));toe=add(f,[0,-23*Math.sin(c),23*Math.cos(c)]);}
      const legActive=["stand","miniSquat","heel","toeLift","seatedHeel","seatedJack","weightShift","kneeOpen","heelToe","squat","reverseLunge","wallSlide","wallToe","goodMorning"].includes(id)||(["march","extend","reachTap","crossMarch","kneePress","side","backLeg","hamstringCurl","anklePump","forwardTap","sideTap","standMarch","stepJack","standCross","tableKneeDrive","singleCalf","singleLegStand","singleLegHinge"].includes(id)&&active);
      legs.push({s,h,k,f,toe,active:legActive});
      const sh=add(shoulder,[s*29,-4,0]);
      let hand=add(hip,[s*38,15,27]),pole=[s*.4,-1,0],armActive=false;
      if(id==="stand"){hand=lerp(add(lerp(h,k,.55),[s*3,13,0]),add(hip,[s*30,2,22]),rise*rise);pole=[s*.3,-.4,-1];}
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
      if(id==="standMarch"){const a=rad(active?-20*t:35*t);hand=add(sh,[0,-107*Math.cos(a),107*Math.sin(a)]);pole=[s*.2,-.3,-1];}
      if(id==="stepJack"){hand=add(shoulder,[s*(38+60*t),-80+69*t,9]);armActive=true;}
      if(id==="squat"){const b=rad(15+70*t);hand=add(sh,[0,-107*Math.cos(b),107*Math.sin(b)]);}
      if(id==="reverseLunge"){hand=add(hip,[s*33,12,6]);pole=[s,-.2,-.6];}
      if(id==="wallSlide"){hand=add(lerp(h,k,.55),[s*3,13,0]);pole=[s*.3,-.4,-1];}
      if(id==="wallToe")hand=add(hip,[s*36,5,4]);
      if(id==="inclinePush"||id==="tableKneeDrive"){hand=[s*TABLE_HAND[0],TABLE_HAND[1],TABLE_HAND[2]];pole=[s*.5,-.6,-.6];armActive=id==="inclinePush";}
      if(id==="chairDip"){hand=[s*32,82,-27];pole=[s*.15,0,-1];armActive=true;}
      if(id==="hingeRow"){hand=add(sh,lerp([0,-100,8],[0,-36,-36],t));pole=[s*.2,.3,-1];armActive=true;}
      if(id==="towelPulldown"){hand=add(sh,lerp([s*46,92,8],[s*46,4,18],t));pole=[s,-.6,0];armActive=true;}
      // Arms folded on the chest, carried with the trunk.
      if(id==="goodMorning"){const u=unit(torso);hand=add(add(shoulder,[-s*12,0,0]),add(mul(u,-24),mul([0,-u[2],u[1]],18)));pole=[s,-.5,0];}
      arms.push({s,sh,hand,pole,active:armActive});
    }
    if(id==="crossMarch"||id==="kneePress"||id==="standCross"){
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
  // Joints with a motion arrow: H hands, E elbows, S shoulders, F toes, A heels, K knees, T head, P pelvis;
  // lower case: working side only (o: the other hand).
  const TRACE={standMarch:"k",stepJack:"Hf",squat:"P",reverseLunge:"fP",wallSlide:"P",inclinePush:"T",chairDip:"P",hingeRow:"E",towelPulldown:"H",standCross:"ko",tableKneeDrive:"k",goodMorning:"T",singleCalf:"a",wallToe:"F",singleLegStand:"k",singleLegHinge:"f",march:"k",seatedJack:"HF",reachTap:"Hf",armSwing:"H",shoulderLift:"S",stand:"T",miniSquat:"P",extend:"f",kneeOpen:"K",hamstringCurl:"a",wallPush:"T",forwardPress:"H",armRaise:"H",bicepsCurl:"H",elbowPull:"E",lowRow:"E",chestOpen:"H",shoulderRotate:"H",crossMarch:"ko",kneePress:"k",sideReach:"h",hipHinge:"T",diagonalReach:"h",heel:"A",toeLift:"F",seatedHeel:"A",anklePump:"f",heelToe:"FA",side:"f",weightShift:"T",backLeg:"f",forwardTap:"f",sideTap:"f"};
  function viewOf(p){const a=rad(p.isSide?73:12),c=Math.cos(a),s=Math.sin(a);return {project:v=>[v[0]*c+v[2]*s,-v[1]+(-v[0]*s+v[2]*c)*.12],depth:v=>-v[0]*s+v[2]*c};}
  const len2=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]),dir2=(a,b)=>{const l=len2(a,b)||1;return [(b[0]-a[0])/l,(b[1]-a[1])/l];};
  const guideCache=new Map();
  function guides(id,side=1){
    const key=id+side;if(guideCache.has(key))return guideCache.get(key);
    const n=16,poses=[];for(let i=0;i<=n;i++)poses.push(pose(id,i/n,side));
    const {project,depth}=viewOf(poses[0]);let paths=[];
    // [joint, pivot it turns around, clearance]
    const pick=(p,c)=>{const r=[],u=c==="o"?"H":c.toUpperCase();
      for(const s of [-1,1]){const arm=p.arms.find(x=>x.s===s),leg=p.legs.find(x=>x.s===s);if(c!==u&&(c==="o")===(s===p.side))continue;
        const j={H:[arm.hand,arm.sh,14],E:[arm.elbow,arm.sh,13],S:[arm.sh,p.hip,14],F:[leg.toe,leg.h,13],A:[leg.f,p.id==="hamstringCurl"?leg.k:leg.toe,13],K:[leg.k,leg.h,16]}[u];if(j)r.push(j);}
      if(c==="T")r.push([p.head,p.hip,24]);if(c==="P")r.push([p.hip,[0,0,0],30]);return r;};
    for(const c of TRACE[id]||""){const lists=poses.map(p=>pick(p,c));
      // flat: the pivot is on the line of sight, so "away from it" means nothing on screen.
      lists[0].forEach((_,j)=>{const [q,pv]=lists[n/2][j];paths.push({pts:lists.map(l=>project(l[j][0])),pivot:project(pv),flat:len2(project(q),project(pv))<.5*norm(sub(q,pv)),r:lists[0][j][2],d:depth(q)});});}
    // Seen from the side, paired limbs trace nearly one line: keep the nearer.
    const gap=(P,Q)=>P.pts.reduce((s,v,i)=>s+len2(v,Q.pts[i]),0)/n,chord=P=>dir2(P.pts[0],P.pts[n]);
    paths=paths.filter(P=>!paths.some(Q=>Q.d>P.d+1&&dot(chord(P),chord(Q))>.7&&gap(P,Q)<40));
    const out=paths.map(P=>offsetPath(P,project(poses[n/2].hip)[0])).filter(Boolean);
    guideCache.set(key,out);return out;
  }
  // Puts a path beside the limb: outside a clear curve, else away from its pivot, else outward.
  function offsetPath({pts,pivot,flat,r},bodyX){
    const path=[pts[0]];for(const q of pts)if(len2(q,path[path.length-1])>.8)path.push(q);
    let len=0;for(let i=1;i<path.length;i++)len+=len2(path[i-1],path[i]);
    if(len<3)return null;
    const a=path[0],b=path[path.length-1],m=path[path.length>>1],c=lerp(a,b,.5),u=dir2(a,b),nrm=[-u[1],u[0]],bulge=dot(sub(m,c),nrm),pd=dot(dir2(pivot,m),nrm);
    const sign=Math.abs(bulge)>.3*len2(a,b)?Math.sign(bulge):!flat&&Math.abs(pd)>.7?Math.sign(pd):Math.abs(nrm[0])>.5?Math.sign((m[0]-bodyX)*nrm[0])||1:Math.sign(nrm[1]);
    // Short moves, or paths offset into their own curve, get a straight arrow.
    let line=[];
    if(len<34||sign*bulge<-2){const k=Math.max(18,len2(a,b)/2);line=[-k,k].map(k=>add(c,mul(u,k)));}
    else{let need=0;for(let i=1;i<path.length;i++){const p=path[i-1],q=path[i],d=len2(p,q);for(;need<=d;need+=6)line.push(lerp(p,q,need/d));need-=d;}
      if(len2(b,line[line.length-1])>2)line.push(b);
      for(let k=0;k<3;k++)for(let i=1;i<line.length-1;i++)line[i]=mul(add(add(line[i-1],line[i+1]),mul(line[i],2)),.25);}
    const tan=i=>dir2(line[Math.max(0,i-1)],line[Math.min(line.length-1,i+1)]),t=tan(line.length>>1),off=(t[0]*nrm[1]-t[1]*nrm[0])*sign>=0?r+12:-r-12;
    return line.map((q,i)=>{const t=tan(i);return [q[0]-t[1]*off,q[1]+t[0]*off];});
  }
  const SKIN="#d9a27f",ACTIVE="#c45532",RIM="#f3f1e6",tints=new Map();
  // Lighten (k>0) or darken (k<0) a #rrggbb colour.
  function shade(hex,k){
    if(!tints.has(hex+k)){const n=parseInt(hex.slice(1),16);tints.set(hex+k,"#"+[16,8,0].map(b=>Math.round(mix(n>>b&255,k>0?255:18,Math.abs(k))).toString(16).padStart(2,"0")).join(""));}
    return tints.get(hex+k);
  }
  function capsule(ctx,a,b,r1,r2){
    const g=Math.atan2(b[1]-a[1],b[0]-a[0]),d=Math.asin(clamp((r1-r2)/(len2(a,b)||1e-6),-1,1)),q=Math.PI/2;
    ctx.moveTo(a[0]+r1*Math.cos(g+q-d),a[1]+r1*Math.sin(g+q-d));ctx.arc(a[0],a[1],r1,g+q-d,g+3*q+d);ctx.arc(b[0],b[1],r2,g-q+d,g+q-d);ctx.closePath();
  }
  function draw(canvas,id,t=0,side=1,{comparison=false,small=false,phase=null}={}) {
    const box=canvas.getBoundingClientRect(), w=box.width,h=box.height;
    if(!w||!h)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    if(comparison){
      const shift=sideViews.has(id)?.05:0,scale=Math.min(w/660,(h-36)/355);
      render(ctx,pose(id,0,side),w*(.25-shift),h*.87,scale,{small:true});
      render(ctx,pose(id,1,side),w*(.75-shift),h*.87,scale,{small:true,guide:{dir:1,alpha:1}});
      ctx.fillStyle="#355c4d";ctx.textAlign="center";ctx.font="13px system-ui";ctx.fillText("起始姿势",w*.25,22);ctx.fillText("动作终点",w*.75,22);
    }else{
      const p=phase==null?-1:((phase%1)+1)%1,e=p%.5,guide=p<0?null:{dir:p<.5?1:-1,alpha:.35+.65*clamp(Math.min(e,.5-e)/.05)};
      // Leave room for arrows above the head and on the floor.
      const s=guide?Math.min(w/(small?310:440),(h-10)/372):Math.min(w/(small?255:440),(h-(small?5:15))/335),y=h*(small?.96:.92);
      render(ctx,pose(id,t,side),w*.48,guide?Math.min(y,h-27*s):y,s,{small,guide});
    }
  }
  function render(ctx,p,cx,cy,scale,{small=false,guide=null}={}){
    const {project,depth}=viewOf(p);
    ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);
    const stroke2=(u,v,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(...u);ctx.lineTo(...v);ctx.stroke();};
    const line=(v1,v2,color,width=5)=>stroke2(project(v1),project(v2),color,width);
    const circle=(v,r,color)=>{const q=project(v);ctx.fillStyle=color;ctx.beginPath();ctx.arc(q[0],q[1],r,0,Math.PI*2);ctx.fill();};
    const poly=(vs,color)=>{ctx.fillStyle=color;ctx.beginPath();vs.forEach((v,i)=>{const q=project(v);if(i)ctx.lineTo(...q);else ctx.moveTo(...q);});ctx.closePath();ctx.fill();};
    // Tapered limb with a light rim, shaded as if lit from the upper left.
    const solid=(A,B,r1,r2,color,rim=true)=>{
      if(rim){ctx.fillStyle=RIM;ctx.beginPath();capsule(ctx,A,B,r1+1.7,r2+1.7);ctx.fill();}
      const [ux,uy]=dir2(A,B),k=.8*ux-.6*uy<0?1:-1,n=len2(A,B)>.5?[-uy*k,ux*k]:[-.6,-.8],r=Math.max(r1,r2),m=lerp(A,B,.5);
      const g=ctx.createLinearGradient(m[0]+n[0]*r,m[1]+n[1]*r,m[0]-n[0]*r,m[1]-n[1]*r);g.addColorStop(0,shade(color,.22));g.addColorStop(.45,color);g.addColorStop(1,shade(color,-.22));
      ctx.fillStyle=g;ctx.beginPath();capsule(ctx,A,B,r1,r2);ctx.fill();
    };
    const arrowHead=(tip,from,size)=>{
      const [ux,uy]=dir2(from,tip),bx=tip[0]-ux*size,by=tip[1]-uy*size,w=size*.38;
      ctx.beginPath();ctx.moveTo(...tip);ctx.lineTo(bx-uy*w,by+ux*w);ctx.lineTo(bx+uy*w,by-ux*w);ctx.closePath();
      ctx.lineJoin="round";ctx.lineWidth=3;ctx.strokeStyle=RIM;ctx.stroke();ctx.fillStyle=ACTIVE;ctx.fill();
    };
    // Floor shadow, plus foot shadows that fade as a foot lifts.
    const blob=(q,rx,ry,alpha)=>{if(alpha<.01)return;ctx.save();ctx.translate(...q);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,"#344e3e");g.addColorStop(1,"rgba(52,78,62,0)");ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();};
    blob([15,3],140,16,.22);
    for(const l of p.legs)blob(project([(l.f[0]+l.toe[0])/2,0,(l.f[2]+l.toe[2])/2]),24,5.5,.34*clamp(1-(Math.min(l.f[1],l.toe[1])-10)/40));
    const chair=(z,seatY,backY)=>{
      const c="#7d9180";
      for(const x of [-42,42]){line([x,0,z-35],[x,backY,z-35],c,6);line([x,0,z+34],[x,seatY,z+34],c,6);}
      poly([[-45,seatY,z-38],[45,seatY,z-38],[45,seatY,z+38],[-45,seatY,z+38]],"#bac7ad");
      line([-44,backY,z-35],[44,backY,z-35],c,12);
      line([-44,seatY,z+36],[44,seatY,z+36],c,7);
    };
    if(p.seated||p.id==="stand"||p.id==="squat")chair(-60,76,163);
    if(supported.has(p.id))chair(115,86,190);
    const wall=z=>{poly([[-65,0,z],[65,0,z],[65,325,z],[-65,325,z]],"#d5ddca");line([-65,0,z],[-65,325,z],"#9dad97",4);};
    if(p.id==="wallPush")wall(132);
    if(p.id==="wallSlide"||p.id==="wallToe")wall(-50);
    if(p.id==="inclinePush"||p.id==="tableKneeDrive"){
      const c="#7d9180",T=TABLE_Y,z0=TABLE_HAND[2]-16,z1=z0+60;
      for(const x of [-52,52]){line([x,0,z0+4],[x,T,z0+4],c,6);line([x,0,z1-4],[x,T,z1-4],c,6);}
      poly([[-58,T,z0],[58,T,z0],[58,T,z1],[-58,T,z1]],"#bac7ad");line([-58,T,z0],[58,T,z0],c,7);
    }
    // Motion paths sit behind the figure; their arrowheads are drawn last, on top.
    const paths=guide?guides(p.id,p.side):[];
    ctx.setLineDash([.1,8.5]);ctx.lineCap="round";ctx.lineWidth=3.6;ctx.strokeStyle="rgba(196,85,50,.55)";
    for(const g of paths){ctx.beginPath();g.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();}
    ctx.setLineDash([]);
    // Far-side limbs in side view are darker, so overlapping legs stay readable.
    const dim=(c,s)=>p.isSide&&s>0?shade(c,-.14):c,items=[];
    for(const l of p.legs){
      const c=dim(l.active?ACTIVE:"#344c5b",l.s),knee={v:l.k,n:2,r:4.6,active:l.active};
      items.push({a:l.h,b:l.k,r1:12.5,r2:9.8,c,glow:l.active,joint:knee},{a:l.k,b:l.f,r1:9.6,r2:6.4,c,glow:l.active,joint:knee},{a:add(l.f,mul(sub(l.toe,l.f),-.22)),b:l.toe,r1:7,r2:6.2,c:dim("#213f36",l.s),shoe:true});
    }
    for(const arm of p.arms){
      const elbow={v:arm.elbow,n:2,r:3.9,active:arm.active};
      items.push({a:arm.sh,b:arm.elbow,r1:9,r2:7.4,c:dim(arm.active?ACTIVE:"#507768",arm.s),glow:arm.active,joint:elbow},{a:arm.elbow,b:arm.hand,r1:7.2,r2:5.4,c:dim(SKIN,arm.s),glow:arm.active,joint:elbow,hand:true});
    }
    // Render far limbs, body, then near limbs for clear front/back occlusion.
    const mid=it=>depth(add(it.a,it.b)),cut=depth(p.hip)*2;
    items.sort((x,y)=>mid(x)-mid(y));
    if(!small){ctx.fillStyle="rgba(196,85,50,"+(.1+.16*p.t).toFixed(3)+")";ctx.beginPath();for(const it of items)if(it.glow)capsule(ctx,project(it.a),project(it.b),it.r1+6,it.r2+6);ctx.fill();}
    // Joint markers go with the later of their two segments, so far knees stay hidden.
    const drawItem=it=>{
      const A=project(it.a),B=project(it.b),[ux,uy]=dir2(A,B);solid(A,B,it.r1,it.r2,it.c);
      if(it.shoe&&len2(A,B)>4){const o=ux<0?-4.3:4.3;stroke2([A[0]-uy*o,A[1]+ux*o],[B[0]-uy*o,B[1]+ux*o],"#e9e5d6",2.2);}
      if(it.hand)solid([B[0]-ux,B[1]-uy],[B[0]+ux*6.5,B[1]+uy*6.5],6.4,5.6,it.c);
      const j=it.joint;if(j&&!--j.n){circle(j.v,j.r,RIM);circle(j.v,j.r/2,j.active?"#a7482c":"#456252");}
    };
    items.filter(it=>mid(it)<cut).forEach(drawItem);
    const hp=project(p.hip),sp=project(p.shoulder),female=avatar==="female",bodyHalf=p.isSide?17:(female?25:29),waist=female?bodyHalf-5:bodyHalf-3;
    const al=len2(hp,sp),[ux,uy]=dir2(hp,sp),at=(o,along,across)=>[o[0]+ux*along-uy*across,o[1]+uy*along+ux*across];
    const tg=ctx.createLinearGradient(sp[0],sp[1],hp[0],hp[1]);tg.addColorStop(0,"#367762");tg.addColorStop(1,"#245645");
    ctx.fillStyle=tg;ctx.beginPath();ctx.moveTo(...at(hp,0,-bodyHalf));ctx.lineTo(...at(hp,0,bodyHalf));ctx.quadraticCurveTo(...at(hp,.42*al,waist),...at(sp,0,bodyHalf+3));ctx.quadraticCurveTo(...at(sp,7,0),...at(sp,0,-bodyHalf-3));ctx.quadraticCurveTo(...at(hp,.42*al,-waist),...at(hp,0,-bodyHalf));ctx.closePath();ctx.fill();
    ctx.strokeStyle="#63917a";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...at(sp,-9,-bodyHalf+6));ctx.lineTo(...at(hp,9,-waist+5));ctx.stroke();
    line(add(p.hip,[-23,0,0]),add(p.hip,[23,0,0]),"#214d3f",12);
    solid(sp,project(add(p.head,[0,-14,0])),7.2,6.6,SKIN,false);
    items.filter(it=>mid(it)>=cut).forEach(drawItem);
    // The two mature, athletic appearances share the exact same motion rig.
    // The head follows the trunk, so hinged and inclined moves keep a neutral neck.
    const head=project(p.head);ctx.save();ctx.translate(...head);ctx.rotate(Math.atan2(sp[0]-hp[0],hp[1]-sp[1]));
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
    if(p.id==="towelPull"||p.id==="towelPulldown")line(p.arms[0].hand,p.arms[1].hand,p.t>.3?ACTIVE:"#bd9857",5);
    // Isometric moves: arrows show the press or the pull.
    if(p.id==="palmPress"||p.id==="towelPull"){
      const e=clamp((p.t-.2)/.5),press=p.id==="palmPress";
      if(e>0)for(const arm of p.arms){const q=project(arm.hand),s=arm.s,from=[q[0]+s*(press?92:13),q[1]],tip=[q[0]+s*(press?64:40),q[1]];
        ctx.globalAlpha=e;stroke2(from,[mix(from[0],tip[0],.6),q[1]],ACTIVE,4);arrowHead(tip,from,12);ctx.globalAlpha=1;}
    }
    for(const g of paths){const k=g.length-1,back=Math.min(2,k);ctx.globalAlpha=guide.alpha;if(guide.dir>0)arrowHead(g[k],g[k-back],13);else arrowHead(g[0],g[back],13);ctx.globalAlpha=1;}
    if(!small&&p.isSide){ctx.fillStyle="#4d6a59";ctx.font="13px system-ui";ctx.textAlign="center";ctx.fillText("后", -106,21);ctx.fillText("前 →",113,21);}
    ctx.restore();
  }
  return {draw,pose,view,ik,ease,guides,setAvatar,getAvatar};
})();
