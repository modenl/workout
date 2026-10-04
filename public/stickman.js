/* 火柴人动作原型 · Stick-figure motion prototype.
   World axes in cm: x = the figure's left, y = up, z = forward.
   A 3D rig with contact constraints is driven by keyframed channels. Each move's
   speed follows a Beta-shaped curve (the peak sits where the body really peaks),
   body parts lead or lag each other, springs add settle and follow-through, and
   free-hanging arms are a pendulum driven by the shoulder's acceleration.
   An exercise is precomputed as one periodic cycle (120 samples/s), so playback,
   slow motion and scrubbing all show the same frames. */
const Stickman=(()=>{
  "use strict";
  const RATE=120;

  // ---------- vectors ----------
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const len=a=>Math.hypot(a[0],a[1],a[2]);
  const unit=a=>{const l=len(a);return l>1e-9?mul(a,1/l):[0,0,0];};
  const perp=(v,d)=>sub(v,mul(d,dot(v,d)));
  const mix=(a,b,t)=>a+(b-a)*t;
  const mix3=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t)];
  const clamp=(v,lo=0,hi=1)=>Math.min(hi,Math.max(lo,v));
  const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
  const mixAngle=(a,b,t)=>a+((((b-a)%360)+540)%360-180)*t;
  // Degrees. Yaw turns +z toward +x, pitch tips +y toward +z, roll tips +y toward +x.
  function orient(v,{yaw=0,pitch=0,roll=0}={}){
    let [x,y,z]=v,c=Math.cos(rad(roll)),s=Math.sin(rad(roll));[x,y]=[x*c+y*s,-x*s+y*c];
    c=Math.cos(rad(pitch));s=Math.sin(rad(pitch));[y,z]=[y*c-z*s,y*s+z*c];
    c=Math.cos(rad(yaw));s=Math.sin(rad(yaw));[x,z]=[x*c+z*s,-x*s+z*c];
    return [x,y,z];
  }

  // ---------- timing ----------
  const seg=(q,a,b)=>clamp((q-a)/(b-a));
  const profiles=new Map();
  // Position along a move whose speed follows u^a(1-u)^b, so the speed peaks at a/(a+b).
  // a=b=2 is minimum jerk; a<b drives hard early and brakes long (a lift), a>b the reverse.
  function profile(a,b){
    const key=a+"/"+b;if(profiles.has(key))return profiles.get(key);
    const n=400,table=new Float64Array(n+1),speed=u=>Math.pow(u,a)*Math.pow(1-u,b);
    for(let i=1;i<=n;i++){const u0=(i-1)/n,u1=i/n;table[i]=table[i-1]+(speed(u0)+4*speed((u0+u1)/2)+speed(u1))/(6*n);}
    for(let i=1;i<=n;i++)table[i]/=table[n];
    const f=u=>{u=clamp(u)*n;const i=Math.min(n-1,Math.floor(u));return table[i]+(table[i+1]-table[i])*(u-i);};
    profiles.set(key,f);return f;
  }
  // Keyframes [[q, value, [a,b]]]: each move reaches its value at q along profile(a,b); a repeated value holds.
  function track(keys){
    return q=>{
      if(q<=keys[0][0])return keys[0][1];
      for(let i=1;i<keys.length;i++){
        const [q1,v1,shape=[2,2]]=keys[i];
        if(q<=q1){const [q0,v0]=keys[i-1];return q1>q0?v0+(v1-v0)*profile(shape[0],shape[1])((q-q0)/(q1-q0)):v1;}
      }
      return keys[keys.length-1][1];
    };
  }
  // A damped follower run over three loops, so the result is periodic.
  function springLoop(xs,dt,freq,zeta){
    const w=2*Math.PI*freq,out=new Float64Array(xs.length);let y=xs[0],v=0;
    for(let loop=0;loop<3;loop++)for(let i=0;i<xs.length;i++){v+=(w*w*(xs[i]-y)-2*zeta*w*v)*dt;y+=v*dt;if(loop===2)out[i]=y;}
    return out;
  }

  // ---------- body (170 cm adult) ----------
  const B={ank:6.5,heel:6,ball:14,toe:6,shank:42,thigh:42,hip:8.5,trunk:54,shoulder:17.5,shoulderDrop:4,neck:6,head:10.5,upper:30,fore:25,hand:8};
  // Standing hip height, knees just soft: straight legs sit on the IK's singular point.
  const STAND=B.ank+B.shank+B.thigh-.8;
  // Segment mass fractions (Winter): they sum to 1.
  const MASS={head:.081,trunk:.497,upper:.028,fore:.016,hand:.006,thigh:.1,shank:.0465,foot:.0145};
  const SIDES=[1,-1];
  // Two builds on the same limb lengths, so every contact still fits: broad shoulders and narrow hips
  // with heavier lines for the man, narrow shoulders and wider hips with lighter lines for the woman.
  const BUILDS={male:{shoulder:20.5,hip:7.8,stroke:1.18,head:11},female:{shoulder:14.5,hip:10.5,stroke:.8,head:9.8}};
  let avatar="male";
  function setAvatar(v){avatar=v==="female"?"female":"male";B.shoulder=BUILDS[avatar].shoulder;B.hip=BUILDS[avatar].hip;B.head=BUILDS[avatar].head;}
  const getAvatar=()=>avatar;
  setAvatar("male");

  function ik(a,t,l1,l2,pole){
    const d=sub(t,a),raw=len(d),D=clamp(raw,Math.abs(l1-l2)+.01,l1+l2-.001),dir=raw>1e-9?mul(d,1/raw):[0,-1,0];
    const x=(l1*l1-l2*l2+D*D)/(2*D),h=Math.sqrt(Math.max(0,l1*l1-x*x));
    let bend=perp(pole,dir);if(len(bend)<1e-6)bend=perp([0,0,1],dir);
    return {mid:add(add(a,mul(dir,x)),mul(unit(bend),h)),end:add(a,mul(dir,D)),reach:raw/(l1+l2)};
  }
  function footAxes(heading,pitch){
    const h=rad(heading),p=rad(pitch),sh=Math.sin(h),ch=Math.cos(h),sp=Math.sin(p),cp=Math.cos(p);
    return {f:[sh*cp,-sp,ch*cp],u:[sh*sp,cp,ch*sp]};
  }
  // Ankle that puts the ball of the foot at `ball` with the heel lifted by `pitch` degrees.
  function ankleAtBall(ball,heading,pitch){const {f,u}=footAxes(heading,pitch);return add(sub(ball,mul(f,B.ball)),mul(u,B.ank));}
  function footPoints(ankle,heading,pitch,toeBend){
    const {f,u}=footAxes(heading,pitch),heel=add(add(ankle,mul(f,-B.heel)),mul(u,-B.ank)),ball=add(add(ankle,mul(f,B.ball)),mul(u,-B.ank));
    const t=rad(pitch-toeBend),h=rad(heading);
    return {heel,ball,toe:add(ball,mul([Math.sin(h)*Math.cos(t),-Math.sin(t),Math.cos(h)*Math.cos(t)],B.toe))};
  }
  const flatFoot=(x,z,heading=0)=>({ankle:[x,B.ank,z],heading,pitch:0});
  // Toes relax in the air but never dip below the floor while the ball is low.
  const ballFoot=(ball,heading,pitch,toeBend=pitch)=>({ankle:ankleAtBall(ball,heading,pitch),heading,pitch,toeBend:Math.max(toeBend,pitch-deg(Math.asin(clamp(ball[1]/B.toe))))});

  // Arms from angles in a frame {down, fwd, out}: swing raises the arm forward, abduct sideways.
  // The elbow flexes toward the way the arm is being raised; twist turns that plane about the upper arm.
  function armBasis(frame,swing,d){
    let m=perp(add(mul(frame.fwd,Math.cos(rad(swing))),mul(frame.down,-Math.sin(rad(swing)))),d);
    if(len(m)<1e-6)m=perp(frame.fwd,d);m=unit(m);return {m,n:cross(d,m)};
  }
  function armPose(S,frame,a){
    const sw=rad(a.swing||0),ab=rad(a.abduct||0);
    const d=unit(add(add(mul(frame.down,Math.cos(ab)*Math.cos(sw)),mul(frame.fwd,Math.cos(ab)*Math.sin(sw))),mul(frame.out,Math.sin(ab))));
    const {m,n}=armBasis(frame,a.swing||0,d),el=rad(a.elbow||0),tw=rad(a.twist||0);
    const f=unit(add(mul(d,Math.cos(el)),mul(add(mul(m,Math.cos(tw)),mul(n,Math.sin(tw))),Math.sin(el))));
    const E=add(S,mul(d,B.upper)),W=add(E,mul(f,B.fore));
    let hd=f;
    if(a.wrist){const flex=unit(perp(m,f));hd=unit(add(mul(f,Math.cos(rad(a.wrist))),mul(flex,Math.sin(rad(a.wrist)))));}
    // `drop`: the hand trails toward (or, when negative, away from) the floor.
    if(a.drop){const dn=perp([0,-1,0],hd);if(len(dn)>1e-6)hd=unit(add(mul(hd,Math.cos(rad(a.drop))),mul(unit(dn),Math.sin(rad(a.drop)))));}
    return {E,W,T:add(W,mul(hd,B.hand))};
  }
  // The inverse of armPose for a solved arm, so a constrained arm can hand over to a free one smoothly.
  function armAngles(S,E,W,T,frame){
    const d=unit(sub(E,S)),swing=deg(Math.atan2(dot(d,frame.fwd),dot(d,frame.down))),abduct=deg(Math.asin(clamp(dot(d,frame.out),-1,1)));
    const {m,n}=armBasis(frame,swing,d),f=unit(sub(W,E)),h=unit(sub(T,W)),flex=unit(perp(m,f));
    return {swing,abduct,elbow:deg(Math.acos(clamp(dot(f,d),-1,1))),twist:deg(Math.atan2(dot(f,n),dot(f,m))),wrist:deg(Math.atan2(dot(h,flex),dot(h,f)))};
  }
  const WORLD=s=>({down:[0,-1,0],fwd:[0,0,1],out:[s,0,0]});

  // desc: {pelvis, pelvisYaw, pelvisRoll, trunk:{pitch,roll,yaw,curve}, head:{pitch,roll}, breath, prot:[l,r],
  //        legs:[{ankle,heading,pitch,toeBend,pole}], arms:[{ik:{wrist,pole,hand}} | {frame:"world"|"trunk",swing,abduct,elbow,twist,wrist,drop}]}
  function assemble(d){
    const P=d.pelvis,tr=d.trunk,breath=d.breath||0;
    const U=orient([0,1,0],tr),F=orient([0,0,1],tr),X=orient([1,0,0],tr),Xp=orient([1,0,0],{yaw:d.pelvisYaw||0,roll:d.pelvisRoll||0});
    const C7=add(P,add(mul(U,B.trunk+.8*breath),mul(F,-1.5+.6*breath)));
    const head={pitch:d.head.pitch,yaw:tr.yaw||0,roll:(tr.roll||0)*.5+(d.head.roll||0)},HU=orient([0,1,0],head),HF=orient([0,0,1],head);
    const NT=add(C7,mul(unit(add(mul(U,.35),mul(HU,.65))),B.neck)),HC=add(NT,mul(HU,B.head));
    const pts={P,SB:add(P,add(mul(U,3),mul(F,-1.5))),SM:add(P,add(mul(U,B.trunk*.5),mul(F,-1.5-(tr.curve||0)))),C7,NT,HC,HF:add(HC,mul(HF,B.head)),HU:add(HC,mul(HU,B.head))};
    const frames={world:WORLD,trunk:s=>({down:mul(U,-1),fwd:F,out:mul(X,s)})};
    let reach=0;
    const sides=SIDES.map((s,i)=>{
      const leg=d.legs[i],arm=d.arms[i],H=add(P,mul(Xp,s*B.hip)),heading=leg.heading||0,pitch=leg.pitch||0;
      const knee=ik(H,leg.ankle,B.thigh,B.shank,leg.pole||[Math.sin(rad(heading)),0,Math.cos(rad(heading))]);
      const foot=footPoints(knee.end,heading,pitch,leg.toeBend??pitch);reach=Math.max(reach,knee.reach);
      const S=add(C7,add(add(mul(X,s*B.shoulder),mul(U,-B.shoulderDrop+.35*breath+(d.elev?d.elev[i]:0))),mul(F,d.prot?d.prot[i]:0)));
      let E,W,T;
      if(arm.ik){const r=ik(S,arm.ik.wrist,B.upper,B.fore,arm.ik.pole);E=r.mid;W=r.end;T=add(W,mul(unit(arm.ik.hand||sub(W,E)),B.hand));}
      else ({E,W,T}=armPose(S,frames[arm.frame||"world"](s),arm));
      return {s,H,K:knee.mid,A:knee.end,HE:foot.heel,BA:foot.ball,TO:foot.toe,S,E,W,T};
    });
    let com=mul(HC,MASS.head);com=add(com,mul(mix3(P,C7,.5),MASS.trunk));
    for(const sd of sides){
      com=add(com,mul(mix3(sd.S,sd.E,.436),MASS.upper));com=add(com,mul(mix3(sd.E,sd.W,.43),MASS.fore));com=add(com,mul(mix3(sd.W,sd.T,.5),MASS.hand));
      com=add(com,mul(mix3(sd.H,sd.K,.433),MASS.thigh));com=add(com,mul(mix3(sd.K,sd.A,.433),MASS.shank));com=add(com,mul(mix3(sd.HE,sd.BA,.5),MASS.foot));
    }
    return {pts,sides,com,reach};
  }
  const BODY_KEYS=["P","SB","SM","C7","NT","HC","HF","HU"],SIDE_KEYS=["H","K","A","HE","BA","TO","S","E","W","T"];
  const POINTS=[...BODY_KEYS,...["L","R"].flatMap(k=>SIDE_KEYS.map(n=>n+k)),"COM"];
  const INDEX=Object.fromEntries(POINTS.map((k,i)=>[k,i]));
  function write(pose,out,o){
    const put=(k,v)=>{const j=o+INDEX[k]*3;out[j]=v[0];out[j+1]=v[1];out[j+2]=v[2];};
    for(const k of BODY_KEYS)put(k,pose.pts[k]);
    pose.sides.forEach((sd,i)=>{for(const k of SIDE_KEYS)put(k+(i?"R":"L"),sd[k]);});
    put("COM",pose.com);
  }
  // ---------- exercises ----------
  // 坐站起身: the four phases of rising (flexion momentum, seat-off, extension, stabilisation),
  // then a controlled sit. The hips take different paths up and down.
  function sitToStand(){
    const chair={type:"chair",seat:47,front:-13,back:-53,half:23,top:95};
    const SEAT=[53.5,-35.5],UP=[STAND,-1.5];
    const lean=track([[0,3],[.03,3],[.21,46],[.46,0,[1.8,2.4]],[.54,0],[.71,40,[2,2.2]],[.84,43],[.98,3,[2,2.6]],[1,3]]);
    const rise=track([[0,0],[.19,0],[.45,1,[1.7,2.4]],[.56,1],[.85,0,[2,2.8]],[1,0]]);
    const slide=track([[0,0],[.03,0],[.19,2.2],[.45,0],[1,0]]);
    const free=track([[0,0],[.2,0],[.27,1],[.66,1],[.76,0],[1,0]]);
    const grip=track([[0,.6],[.04,.6],[.2,.8],[.34,.8],[.66,.72],[.76,.72],[.86,.64],[1,.6]]);
    const breath=track([[0,0],[.05,1],[.19,1],[.45,0],[.52,.7],[.6,.7],[.85,.1],[1,0]]);
    const squash=track([[0,0],[.85,0],[.875,-.9],[.93,0],[1,0]]);
    const effort=track([[0,.12],[.12,.35],[.21,1],[.4,.55],[.5,.12],[.6,.45],[.8,.8],[.86,.2],[1,.12]]);
    const legs=SIDES.map(s=>flatFoot(s*11,-3,s*7));
    const body=ch=>{
      const r=clamp(ch.rise),path=ch.q<.5?1-Math.pow(1-r,2.3):Math.pow(r,2.2);
      return {pelvis:[0,mix(SEAT[0],UP[0],r)+ch.squash*(1-r),mix(SEAT[1]+ch.slide,UP[1],path)],trunk:{pitch:ch.lean,curve:ch.lean*.05},head:{pitch:ch.head},breath:ch.breath,legs};
    };
    return {
      id:"stand",oldId:"stand",name:"坐站起身",level:"70+ · 55–70",reps:1,view:{yaw:64,pitch:10},props:[chair],
      channels:q=>{const l=lean(q);return {q,lean:l,rise:rise(q),slide:slide(q),free:free(q),grip:grip(q),breath:breath(q),squash:squash(q),head:6+.42*l,effort:effort(q)};},
      springs:{lean:[3.2,.6],head:[2.4,.7]},
      seat:ch=>clamp(1-ch.rise*5),
      // Hands on the thighs slide toward the knees while leaning; after seat-off they let go.
      constrained(ch){
        const d={...body(ch),arms:SIDES.map(()=>({frame:"world"}))},p=assemble(d);
        d.arms=p.sides.map(sd=>({ik:{wrist:add(mix3(sd.H,sd.K,ch.grip),[sd.s*2.2,5,0]),pole:[sd.s,.1,-.6],hand:add(unit(sub(sd.K,sd.H)),[0,-.25,0])}}));
        return d;
      },
      pendulum:{hang:{swing:3,abduct:6,elbow:14,twist:0,wrist:8}},
      build:ch=>({...body(ch),arms:ch.armAngles}),
      parts:()=>({thighL:1,thighR:1,shankL:.55,shankR:.55,pelvis:.8,spine:.35}),
      metric:{label:"重心上下速度",point:"COM",mode:"vy"},
      trails:["P","HC"],
      phases:[[0,.19,"前倾蓄势"],[.19,.27,"离椅 · 动量转移"],[.27,.46,"伸髋伸膝 · 站起"],[.46,.55,"站稳"],[.55,.85,"向后坐 · 控制下降"],[.85,1,"坐稳 · 躯干回正"]],
      notes:["速度按起身四个阶段安排：前倾蓄势、离椅、伸髋伸膝、站稳。","起身时臀部先向前再向上，坐下时先向后再下降，两条路径不同。打开「轨迹」能看到这个环。","双手扶大腿借力，松开后手臂是摆锤，跟着肩膀的加速度自然摆动。","坐下前明显减速，臀部轻触椅面，有一点压缩回弹。"]
    };
  }

  // 徒手深蹲: hips lead back, slow descent, brief bottom pause, faster drive up.
  // The pelvis is placed every frame so the whole-body centre of mass stays over mid-foot.
  function squat(){
    const chair={type:"chair",seat:47,front:-30,back:-70,half:23,top:95},OUT=13;
    const depth=track([[0,0],[.04,0],[.47,1,[2,2.6]],[.53,1],[.84,0,[1.6,2.6]],[1,0]]);
    const trunk=track([[0,0],[.025,0],[.45,36,[2,2.6]],[.53,36],[.84,0,[1.6,2.6]],[1,0]]);
    const arms=track([[0,4],[.03,4],[.44,84,[2,2.4]],[.55,84],[.84,4,[1.8,2.4]],[1,4]]);
    const breath=track([[0,0],[.04,1],[.47,.85],[.53,.85],[.84,0],[1,0]]);
    const effort=track([[0,.15],[.04,.3],[.47,.85],[.53,.9],[.6,1],[.84,.3],[1,.15]]);
    const legs=SIDES.map(s=>({...flatFoot(s*15,0,s*OUT),pole:[Math.sin(rad(s*OUT))+s*.12,0,Math.cos(rad(OUT))]}));
    return {
      id:"squat",oldId:"squat",name:"徒手深蹲",level:"55–70 · 40–55",reps:1,view:{yaw:62,pitch:10},props:[chair],
      channels:q=>{const t=trunk(q);return {q,depth:depth(q),trunk:t,arms:arms(q),breath:breath(q),head:6+.3*t,effort:effort(q)};},
      springs:{depth:[4.2,.5,0,1.1],trunk:[3,.7],arms:[2.4,.55],head:[2.4,.7]},
      build(ch){
        const d={pelvis:[0,STAND-1.2-31*ch.depth,-12*ch.depth],trunk:{pitch:ch.trunk,curve:ch.trunk*.04},head:{pitch:ch.head},breath:ch.breath,legs,
          arms:SIDES.map(()=>({frame:"world",swing:ch.arms,abduct:7,elbow:6+8*ch.depth,wrist:4}))};
        for(let k=0;k<5;k++){const p=assemble(d);d.pelvis=[0,d.pelvis[1],d.pelvis[2]+(3.5-p.com[2])];}
        return d;
      },
      parts:()=>({thighL:1,thighR:1,shankL:.6,shankR:.6,pelvis:.9,spine:.45}),
      metric:{label:"髋部上下速度",point:"P",mode:"vy"},
      trails:["P","TL","TR"],
      phases:[[0,.04,"吸气 · 收紧核心"],[.04,.47,"下蹲 · 离心控制"],[.47,.53,"底部停顿"],[.53,.84,"发力站起 · 向心"],[.84,1,"站直 · 呼气"]],
      notes:["髋部先向后，膝盖随后弯曲；下蹲慢、站起快，底部短暂停顿。","每一帧都让全身重心落在脚掌中部上方，所以臀部后移和躯干前倾是算出来的。打开「重心」可以看到。","双臂前伸配重；下蹲的惯性让身体在底部有一点下沉回弹。","膝盖沿脚尖方向（稍向外）移动。"]
    };
  }
  // 后撤步蹲: shift weight to the front foot, peel the back heel, step back onto the ball of the foot,
  // sink (the back heel rises, toes fold), drive up, push off and swing the foot home. Legs alternate.
  function reverseLunge(){
    const BACK=-72;
    const py=track([[0,STAND],[.1,STAND],[.47,60,[1.8,2.2]],[.53,60],[.86,STAND,[1.6,2.6]],[1,STAND]]);
    const pz=track([[0,-1],[.1,-1],[.47,-32,[1.8,2.2]],[.53,-32],[.86,-1,[1.6,2.6]],[1,-1]]);
    const px=track([[0,0],[.08,3.2],[.33,2.2],[.47,.8],[.53,.8],[.66,2.8],[.86,2.4],[1,0]]);
    const trunk=track([[0,1],[.1,1.5],[.47,9,[1.8,2.2]],[.53,9],[.86,1.5,[1.6,2.6]],[1,1]]);
    const TOE=4,HOME=14*Math.cos(rad(TOE));
    const fz=track([[0,HOME],[.1,HOME],[.33,BACK,[1.8,2.2]],[.67,BACK],[.86,HOME,[1.8,2.2]],[1,HOME]]);
    const psi=track([[0,0],[.05,0],[.1,26],[.33,38],[.47,58,[2,2.4]],[.58,58],[.67,66],[.76,32],[.84,6],[.86,0],[1,0]]);
    const breath=track([[0,0],[.1,.3],[.47,1],[.53,1],[.86,0],[1,0]]);
    const effort=track([[0,.1],[.1,.3],[.33,.55],[.47,.9],[.53,.9],[.6,1],[.72,.6],[.88,.2],[1,.1]]);
    const lift=q=>q>.1&&q<.33?9*Math.sin(Math.PI*seg(q,.1,.33)):q>.67&&q<.86?11*Math.pow(Math.sin(Math.PI*seg(q,.67,.86)),.8):0;
    return {
      id:"reverseLunge",oldId:"reverseLunge",name:"后撤步蹲",level:"40–55",reps:2,view:{yaw:66,pitch:10},props:[],
      channels:q=>({q,py:py(q),pz:pz(q),px:px(q),trunk:trunk(q),fz:fz(q),psi:psi(q),lift:lift(q),breath:breath(q),head:4,effort:effort(q)}),
      springs:{py:[4,.55,0,STAND],trunk:[3,.7],px:[2.5,.8]},
      build(ch,rep){
        const m=rep?-1:1,st=-m,mi=rep?1:0,legs=[];
        // The foot that comes home lands exactly where it stands next rep, so nothing slides at the switch.
        legs[1-mi]=flatFoot(st*10,0,st*TOE);
        legs[mi]=ballFoot([m*(10+14*Math.sin(rad(TOE))),ch.lift,ch.fz],m*TOE,ch.psi,mix(ch.psi,ch.psi*.3,clamp(ch.lift/3)));
        const P=[st*ch.px,ch.py,ch.pz];
        return {pelvis:P,trunk:{pitch:ch.trunk},head:{pitch:ch.head},breath:ch.breath,legs,
          arms:SIDES.map(s=>({ik:{wrist:add(P,[s*13,11,3]),pole:[s,-.2,-.8],hand:[-s*.15,-.35,1]}}))};
      },
      parts:rep=>{const f=rep?"L":"R",b=rep?"R":"L";return {["thigh"+f]:1,["shank"+f]:.7,["thigh"+b]:.55,pelvis:.7};},
      metric:{label:"髋部上下速度",point:"P",mode:"vy"},
      trails:["TOL","TOR","P"],
      phases:[[0,.1,"重心移到前脚"],[.1,.33,"向后退步 · 前脚掌着地"],[.33,.47,"下沉 · 离心"],[.47,.53,"底部停顿"],[.53,.67,"前脚发力站起"],[.67,.86,"后脚蹬地收回"],[.86,1,"站稳"]],
      notes:["先把重心移到前脚，后脚跟抬起、离地，再向后迈步，用前脚掌着地。","下沉时后脚跟越抬越高、脚趾弯折；站起时后脚蹬地、离地、摆回。","后脚落地时身体已在下沉，迈步和下蹲连成一个动作，不是先迈后蹲。","左右腿交替，两次为一个循环。"]
    };
  }

  // 扶桌俯卧撑: the body is a rigid plank pivoting on the balls of the feet; the hands stay on the table.
  // The driver is the elbow angle; the body angle is solved each frame so the arms fit exactly.
  function inclinePush(){
    const table={type:"table",top:74,near:40,far:100,half:58},WR=[21,77.5,44],PSI=60;
    const elbow=track([[0,172],[.05,172],[.47,80,[2.2,2.4]],[.53,80],[.86,172,[1.6,2.6]],[1,172]]);
    const prot=track([[0,1],[.05,1],[.47,-2,[2.2,2.4]],[.53,-2],[.86,1,[1.6,2.6]],[.93,2.4],[1,1]]);
    const breath=track([[0,0],[.05,.2],[.47,1],[.53,1],[.86,.1],[1,0]]);
    const effort=track([[0,.2],[.05,.3],[.47,.85],[.53,.9],[.62,1],[.86,.45],[.93,.55],[1,.2]]);
    const wrist=s=>[s*WR[0],WR[1],WR[2]],gap=e=>Math.sqrt(B.upper**2+B.fore**2-2*B.upper*B.fore*Math.cos(rad(e)));
    // Rigid rotation (deg, + raises the body) about the ball of the foot, from a reference plank at angle a0.
    const ankle0=ankleAtBall([0,0,0],0,PSI);
    function plank(ballZ,a0,delta,ch){
      const c=Math.cos(rad(delta)),s=Math.sin(rad(delta)),A=[0,ankle0[2]*s+ankle0[1]*c,ballZ+ankle0[2]*c-ankle0[1]*s],a=a0+delta;
      const u=[0,Math.sin(rad(a)),Math.cos(rad(a))],P=add(A,mul(u,83.9));
      return {pelvis:P,trunk:{pitch:90-a},head:{pitch:90-a+6},breath:ch.breath,prot:[ch.prot,ch.prot],
        legs:SIDES.map(sd=>({ankle:[sd*9,A[1],A[2]],heading:0,pitch:PSI-delta,toeBend:PSI-delta,pole:[0,-.3,1]})),
        arms:SIDES.map(sd=>({ik:{wrist:wrist(sd),pole:[sd*.9,.3,-.7],hand:[0,-.12,1]}}))};
    }
    const shoulderGap=d=>len(sub(assemble(d).sides[0].S,wrist(1)));
    const bisect=(f,lo,hi)=>{let flo=f(lo);for(let k=0;k<24;k++){const mid=(lo+hi)/2,fm=f(mid);if((fm<0)===(flo<0)){lo=mid;flo=fm;}else hi=mid;}return (lo+hi)/2;};
    // Start pose: arms at 172°, square to the body, balls of the feet on the floor.
    const top={breath:0,prot:1};let A0=45,BZ=-90;
    for(let k=0;k<4;k++){
      A0=bisect(a=>{const d=plank(0,a,0,top),S=assemble(d).sides[0].S,dy=S[1]-WR[1],dx=S[0]-WR[0];
        const z=WR[2]-Math.sqrt(Math.max(0,gap(172)**2-dy*dy-dx*dx))-S[2],arm=unit(sub(wrist(1),add(S,[0,0,z]))),U=[0,Math.sin(rad(a)),Math.cos(rad(a))];
        BZ=z;return dot(arm,U);},25,70);
    }
    return {
      id:"inclinePush",oldId:"inclinePush",name:"扶桌俯卧撑",level:"55–70 · 40–55",reps:1,view:{yaw:66,pitch:10},props:[table],handSupport:true,
      channels:q=>({q,elbow:elbow(q),prot:prot(q),breath:breath(q),effort:effort(q)}),
      springs:{elbow:[4,.5],prot:[3,.7]},
      build(ch){const D=gap(ch.elbow),delta=bisect(dl=>shoulderGap(plank(BZ,A0,dl,ch))-D,-35,15);return plank(BZ,A0,delta,ch);},
      rig:{plank:(delta,ch)=>plank(BZ,A0,delta,ch),table},
      parts:()=>({upperL:1,upperR:1,foreL:.8,foreR:.8,clavL:.8,clavR:.8,spine:.5}),
      metric:{label:"胸口上下速度",point:"C7",mode:"vy"},
      trails:["C7","EL","ER"],
      phases:[[0,.05,"撑稳 · 身体成直线"],[.05,.47,"屈肘下降 · 离心"],[.47,.53,"胸口靠近桌边"],[.53,.86,"推回 · 向心"],[.86,1,"肩胛前推 · 回稳"]],
      notes:["身体像一块板，以前脚掌为支点整体转动；双手固定在桌边。","驱动量是肘角：下降慢、推起快，底部有一点缓冲。身体角度每帧解算，手臂长度严格不变。","推到顶再把肩胛向前推一点；脚跟随身体角度自然起落。"]
    };
  }
  // 开合步: shift onto the stance leg (the swing-side hip dips a little), step out, arms rise with
  // an overshoot and the hands trailing half a beat; then the arms fall, braking beside the thighs.
  function stepJack(){
    const OPEN=34,HOME=6;
    const px=track([[0,0],[.08,3],[.28,2.2],[.4,0],[.55,0],[.63,3],[.82,2.2],[.95,0],[1,0]]);
    const py=track([[0,STAND],[.1,STAND-.6],[.3,STAND-4],[.4,STAND-5.2],[.55,STAND-5.2],[.64,STAND-4.4],[.72,STAND-2],[.84,STAND-.8],[.95,STAND],[1,STAND]]);
    const roll=track([[0,0],[.1,2],[.28,1.5],[.36,0],[.6,0],[.66,2],[.8,1.5],[.88,0],[1,0]]);
    const fx=track([[0,HOME],[.1,HOME],[.3,OPEN,[1.8,2.4]],[.64,OPEN],[.82,HOME,[1.8,2.4]],[1,HOME]]);
    const psi=track([[0,0],[.06,0],[.1,16],[.26,10],[.3,5],[.34,0],[.6,0],[.64,16],[.78,10],[.82,5],[.86,0],[1,0]]);
    const heading=track([[0,5],[.1,5],[.3,14],[.64,14],[.82,5],[1,5]]);
    const abd=track([[0,8],[.04,8],[.36,92,[1.8,2.2]],[.56,92],[.86,8,[2.4,1.8]],[1,8]]);
    const breath=track([[0,0],[.36,1],[.56,1],[.86,0],[1,0]]);
    const effort=track([[0,.1],[.1,.35],[.3,.75],[.36,.9],[.55,.7],[.8,.35],[1,.1]]);
    const lift=q=>q>.1&&q<.3?7*Math.sin(Math.PI*seg(q,.1,.3)):q>.64&&q<.82?6*Math.sin(Math.PI*seg(q,.64,.82)):0;
    return {
      id:"stepJack",oldId:"stepJack",name:"开合步",level:"55–70 · 40–55",reps:2,view:{yaw:14,pitch:9},props:[],
      channels:q=>({q,px:px(q),py:py(q),roll:roll(q),fx:fx(q),psi:psi(q),heading:heading(q),lift:lift(q),abd:abd(q),breath:breath(q),head:2,effort:effort(q)}),
      springs:{abd:[2.6,.42],px:[3,.7]},
      // The hand is a light spring chasing the forearm: it trails while the arm rises, then flicks past on the stop.
      post(chs,dt){
        const hand=springLoop(chs.map(c=>c.abd),dt,1.5,.3);
        chs.forEach((c,i)=>{c.drop=clamp(c.abd-hand[i],-25,25);});
      },
      build(ch,rep){
        const m=rep?-1:1,st=-m,mi=rep?1:0,legs=[],h=m*ch.heading;
        legs[1-mi]=flatFoot(st*HOME,0,st*5);
        legs[mi]=ballFoot([m*ch.fx+14*Math.sin(rad(h)),ch.lift,14*Math.cos(rad(h))],h,ch.psi,mix(ch.psi,ch.psi*.3,clamp(ch.lift/3)));
        const raise=clamp((ch.abd-8)/84);
        return {pelvis:[st*ch.px,ch.py,-1],pelvisRoll:m*ch.roll,trunk:{roll:-m*.6*ch.roll},head:{pitch:ch.head},breath:ch.breath,legs,
          arms:SIDES.map(()=>({frame:"trunk",abduct:ch.abd,elbow:8+8*raise,drop:ch.drop}))};
      },
      parts:rep=>{const m=rep?"R":"L",s=rep?"L":"R";return {upperL:1,upperR:1,clavL:.6,clavR:.6,["thigh"+m]:.8,["thigh"+s]:.45};},
      metric:{label:"手的速度",point:"TL",mode:"speed"},
      trails:["TL","TR","TOL","TOR"],
      phases:[[0,.1,"重心移到支撑腿"],[.1,.3,"向旁迈步 · 抬臂"],[.3,.55,"打开 · 站稳"],[.55,.82,"收回 · 放臂"],[.82,1,"并拢站稳"]],
      notes:["迈步前先把重心移到支撑腿，骨盆向迈步一侧轻微下沉。","手臂上抬到肩高时有一点过冲再回稳；手比前臂慢半拍，停下时再轻轻甩过去。","放下时手臂先加速，在大腿旁减速。左右交替，两次为一个循环。"]
    };
  }


  // ---------- shared pieces for the whole library ----------
  const CHAIR={type:"chair",seat:47,front:-13,back:-53,half:23,top:95};
  const RAIL={type:"chair",seat:47,back:22,front:62,half:23,top:95};   // a chair in front, its back toward the person
  const SEAT=[53.5,-35.5];
  const hipAt=(P,s,roll=0)=>add(P,orient([s*B.hip,0,0],{roll}));
  const ankleAtHeel=(heel,heading,pitch)=>{const {f,u}=footAxes(heading,pitch);return add(add(heel,mul(f,B.heel)),mul(u,B.ank));};
  // A planted foot that rocks onto its heel (pitch<0, toes up) or its ball (pitch>0, heel up) from flat at `ankle`.
  function rockFoot(ankle,heading,pitch,lift=0){
    const flat=footPoints(ankle,heading,0,0);
    return pitch<0?{ankle:ankleAtHeel(add(flat.heel,[0,lift,0]),heading,pitch),heading,pitch,toeBend:0}:ballFoot(add(flat.ball,[0,lift,0]),heading,pitch);
  }
  // A free leg from angles at the hip: flex swings the thigh forward, abduct out, knee bends the shin back.
  function freeLeg(H,s,{flex=0,abduct=0,knee=3,pitch=0,heading=0}){
    const t=rad(flex),a=rad(abduct),k=rad(Math.max(knee,3));
    const thigh=[s*Math.sin(a),-Math.cos(t)*Math.cos(a),Math.sin(t)*Math.cos(a)],shin=[s*Math.sin(a),-Math.cos(t-k)*Math.cos(a),Math.sin(t-k)*Math.cos(a)];
    const K=add(H,mul(thigh,B.thigh)),A=add(K,mul(shin,B.shank));
    return {ankle:A,heading,pitch,toeBend:pitch*.3,pole:sub(K,mix3(H,A,.5))};
  }
  const HANG={frame:"world",swing:2,abduct:6,elbow:10,wrist:6};
  // Missing arms rest: "thigh" (hands on the thighs), "seat" (holding the chair sides), "rail" (on the chair back), "hang".
  function restArms(d,rest){
    if(d.arms.every(Boolean))return d;
    if(rest==="hang"){d.arms=d.arms.map(a=>a||HANG);return d;}
    const p=assemble({...d,arms:d.arms.map(a=>a||HANG)});
    d.arms=d.arms.map((a,i)=>{
      if(a)return a;const sd=p.sides[i],s=sd.s;
      if(rest==="thigh")return {ik:{wrist:add(mix3(sd.H,sd.K,.62),[s*2.2,5,0]),pole:[s,.1,-.6],hand:add(unit(sub(sd.K,sd.H)),[0,-.25,0])}};
      if(rest==="seat")return {ik:{wrist:[s*21,CHAIR.seat+2,d.pelvis[2]+12],pole:[s,.2,-.5],hand:[0,-1,.3]}};
      return {ik:{wrist:[s*20,RAIL.top+1.5,RAIL.back+2],pole:[s*.7,-.3,-.6],hand:[0,-.25,1]}};
    });
    return d;
  }
  function seated(o={}){
    return restArms({pelvis:[o.px||0,SEAT[0]+(o.dy||0),SEAT[1]+(o.dz||0)],pelvisRoll:o.pelvisRoll||0,
      trunk:{pitch:3+(o.pitch||0),roll:o.roll||0,yaw:o.yaw||0,curve:(o.pitch||0)*.05},head:{pitch:o.head??(8+(o.pitch||0)*.4)},breath:o.breath||0,elev:o.elev,prot:o.prot,
      legs:SIDES.map((s,i)=>o.legs&&o.legs[i]||flatFoot(s*12,3,s*6)),arms:SIDES.map((s,i)=>o.arms&&o.arms[i]||null)},o.rest||"thigh");
  }
  function standing(o={}){
    return restArms({pelvis:[o.px||0,STAND-(o.drop||0),o.pz??-1],pelvisRoll:o.pelvisRoll||0,trunk:{pitch:o.pitch||0,roll:o.roll||0,curve:(o.pitch||0)*.04},
      head:{pitch:o.head??(4+(o.pitch||0)*.4)},breath:o.breath||0,elev:o.elev,prot:o.prot,
      legs:SIDES.map((s,i)=>o.legs&&o.legs[i]||flatFoot(s*(o.feetX||10),0,s*5)),arms:SIDES.map((s,i)=>o.arms&&o.arms[i]||null)},o.rest||"hang");
  }
  // One rep inside four beats. "lift": effort on the way out, quick out and slower back; "lower": the reverse;
  // "even": symmetric; "press": build, hold and release a push that barely moves.
  const TIMING={
    lift:track([[0,0],[.04,0],[.42,1,[1.6,2.6]],[.54,1],[.94,0,[2.2,2.2]],[1,0]]),
    lower:track([[0,0],[.04,0],[.47,1,[2,2.6]],[.53,1],[.86,0,[1.6,2.6]],[1,0]]),
    even:track([[0,0],[.04,0],[.46,1,[2,2.2]],[.54,1],[.96,0,[2,2.2]],[1,0]]),
    press:track([[0,0],[.08,0],[.3,1,[1.8,2.2]],[.62,1],[.82,0,[2,2]],[1,0]])
  };
  const PHASES={
    lift:[[0,.04,"准备"],[.04,.42,"发力 · 向心"],[.42,.54,"停一下"],[.54,.94,"慢慢回到起点"],[.94,1,"放松"]],
    lower:[[0,.04,"准备"],[.04,.47,"慢慢下去 · 离心"],[.47,.53,"停一下"],[.53,.86,"发力回来 · 向心"],[.86,1,"站稳 · 放松"]],
    even:[[0,.04,"准备"],[.04,.46,"做出动作"],[.46,.54,"停一下"],[.54,.96,"回到起点"],[.96,1,"放松"]],
    press:[[0,.08,"准备"],[.08,.3,"逐渐用力"],[.3,.62,"保持用力 · 不憋气"],[.62,.82,"慢慢放松"],[.82,1,"放松"]]
  };
  // Shift the weight over the standing leg before a one-leg move, and back after it.
  const SHIFT=track([[0,0],[.1,1],[.9,1],[1,0]]);
  const TUCK=track([[0,0],[.08,0],[.26,1],[.84,1],[.97,0]]);   // the free foot of a one-leg calf raise
  const sideKey=m=>m>0?"L":"R";
  function lib(id,name,c){
    const timing=TIMING[c.timing||"even"];
    return {id,oldId:id,name,level:"",reps:c.alt?2:1,view:{yaw:c.front?14:64,pitch:10,...c.view},props:c.props||[],towel:c.towel,handSupport:c.handSupport,
      channels:q=>{const u=timing(q);return {q,u,raw:q,sh:SHIFT(q),breath:u*.8,effort:.15+.85*u};},
      // Alternating moves hand over at the rep boundary, so their progress must land exactly on 0: no overshoot spring.
      springs:c.spring===false||c.alt?{}:{u:c.spring||[3.2,.62,0,1.06]},
      build:(ch,rep)=>c.pose(ch.u,rep?-1:1,ch),
      parts:rep=>typeof c.parts==="function"?c.parts(rep?-1:1):c.parts,
      metric:{label:"动作速度",point:c.trails[0],mode:"speed"},trails:c.trails,
      phases:c.phases||PHASES[c.timing||"even"],notes:c.notes||[]};
  }

  const EXERCISES=[sitToStand(),squat(),reverseLunge(),inclinePush(),stepJack()];
  const both=(f)=>SIDES.map(f);
  const trunkArm=(o)=>({frame:"trunk",...o});
  EXERCISES.push(
    // ----- seated: warm-up -----
    lib("march","坐姿踏步",{alt:true,front:true,props:[CHAIR],trails:["KL","KR"],parts:m=>({["thigh"+sideKey(m)]:1,pelvis:.4}),
      pose:(u,m)=>seated({breath:u*.5,legs:both(s=>s===m?{ankle:[s*12,B.ank+16*u,3+4*u],heading:s*6,pitch:10*u,toeBend:3*u}:null),
        arms:both(s=>trunkArm({swing:(s===m?-12:28)*u,abduct:8,elbow:75}))})}),
    lib("seatedJack","坐姿开合",{front:true,spring:false,props:[CHAIR],trails:["TL","TR","TOL","TOR"],parts:{upperL:1,upperR:1,thighL:.6,thighR:.6},
      pose:u=>seated({breath:u,legs:both(s=>({ankle:[s*(12+18*u),B.ank+5*Math.pow(Math.sin(Math.PI*u),.5),3+5*u],heading:s*(6+14*u),pitch:0,pole:[s*.5*u+Math.sin(rad(s*6)),0,1]})),
        arms:both(()=>trunkArm({abduct:10+75*u,elbow:15}))})}),
    lib("reachTap","坐姿前点脚",{alt:true,spring:false,props:[CHAIR],trails:["TOL","TOR","TL"],parts:m=>({["thigh"+sideKey(m)]:1,upperL:.5,upperR:.5}),
      pose:(u,m)=>seated({legs:both(s=>s===m?{ankle:ankleAtHeel(add(footPoints([s*12,B.ank,3],s*6,0,0).heel,[0,5*Math.pow(Math.sin(Math.PI*u),.5),26*u]),s*6,-20*u),heading:s*6,pitch:-20*u,toeBend:0}:null),
        arms:both(()=>trunkArm({swing:20+50*u,elbow:90-75*u}))})}),
    lib("armSwing","坐姿交替摆臂",{alt:true,props:[CHAIR],trails:["TL","TR"],parts:{upperL:1,upperR:1},
      pose:(u,m)=>seated({arms:both(s=>({frame:"world",swing:(s===m?45:-25)*u,abduct:6,elbow:15,wrist:6}))})}),
    lib("shoulderLift","坐姿提肩放松",{timing:"lift",front:true,props:[CHAIR],trails:["SL","SR"],parts:{clavL:1,clavR:1,upperL:.4,upperR:.4},
      pose:u=>seated({elev:[5*u,5*u],breath:u,arms:both(()=>({frame:"world",swing:3,abduct:10,elbow:8,wrist:4}))})}),
    // ----- seated: push -----
    lib("palmPress","坐姿合掌推压",{timing:"press",front:true,props:[CHAIR],trails:["EL","ER"],parts:{upperL:1,upperR:1,foreL:.8,foreR:.8,clavL:.9,clavR:.9},
      pose:(u,m,ch)=>{const P=[0,SEAT[0],SEAT[1]];return seated({breath:ch.breath,arms:both(s=>({ik:{wrist:add(P,[s*(3.5-.8*u),44,27]),pole:[s,-.5-.2*u,-.2],hand:[-s*.15,1,.25]}}))});}}),
    lib("forwardPress","坐姿向前推",{timing:"lift",props:[CHAIR],trails:["TL","TR"],parts:{upperL:1,upperR:1,foreL:.8,foreR:.8,clavL:.7,clavR:.7},
      pose:u=>seated({breath:1-u,arms:both(()=>trunkArm({swing:25+55*u,abduct:6,elbow:120-108*u}))})}),
    lib("armRaise","坐姿前抬臂",{timing:"lift",props:[CHAIR],trails:["TL","TR"],parts:{upperL:1,upperR:1,clavL:.6,clavR:.6},
      pose:u=>seated({arms:both(()=>trunkArm({swing:5+70*u,abduct:4,elbow:12}))})}),
    lib("bicepsCurl","坐姿屈肘",{timing:"lift",props:[CHAIR],trails:["TL","TR"],parts:{foreL:1,foreR:1,upperL:.7,upperR:.7},
      pose:u=>seated({arms:both(()=>trunkArm({swing:3,abduct:6,elbow:12+120*u}))})}),
    // ----- seated: pull -----
    lib("elbowPull","坐姿拉肘夹背",{timing:"lift",props:[CHAIR],trails:["EL","ER"],parts:{clavL:1,clavR:1,upperL:.8,upperR:.8,spine:.4},
      pose:u=>seated({prot:[-3*u,-3*u],arms:both(()=>trunkArm({swing:70-90*u,abduct:8,elbow:10+95*u}))})}),
    lib("towelPull","坐姿毛巾拉开",{timing:"press",front:true,props:[CHAIR],towel:true,trails:["WL"],parts:{clavL:1,clavR:1,upperL:.8,upperR:.8},
      pose:u=>seated({prot:[-1.5*u,-1.5*u],arms:both(()=>trunkArm({swing:60,abduct:12+5*u,elbow:70}))})}),
    lib("lowRow","坐姿低位划臂",{timing:"lift",props:[CHAIR],trails:["EL","ER"],parts:{clavL:1,clavR:1,upperL:.8,upperR:.8,spine:.4},
      pose:u=>seated({prot:[-3*u,-3*u],arms:both(()=>trunkArm({swing:45-65*u,abduct:8,elbow:10+90*u}))})}),
    lib("chestOpen","坐姿展胸开臂",{timing:"lift",front:true,props:[CHAIR],trails:["TL","TR"],parts:{clavL:1,clavR:1,upperL:.7,upperR:.7},
      pose:u=>seated({prot:[-3*u,-3*u],breath:u,arms:both(()=>trunkArm({abduct:10+40*u,swing:-12*u,elbow:12}))})}),
    lib("shoulderRotate","坐姿肩部外旋",{timing:"lift",front:true,props:[CHAIR],trails:["TL","TR"],parts:{upperL:1,upperR:1,clavL:.6,clavR:.6},
      pose:u=>seated({arms:both(s=>trunkArm({swing:2,abduct:5,elbow:90,twist:-s*60*u}))})}),
    lib("towelPulldown","毛巾下拉",{timing:"lift",front:true,props:[CHAIR],towel:true,trails:["TL","TR"],parts:{upperL:1,upperR:1,clavL:.8,clavR:.8,spine:.4},
      pose:u=>seated({elev:[-1.5*u,-1.5*u],arms:both(s=>trunkArm({abduct:150-58*u,elbow:15+70*u,twist:-s*90}))})})
  );
  // Straighten a seated knee: the thigh stays put and the shin swings forward about the knee.
  function kneeSwing(d,i,angle,pitch=0,lift=0){
    const sd=assemble({...d,arms:d.arms.map(a=>a||HANG)}).sides[i],leg=d.legs[i],shin=unit(sub(sd.A,sd.K));
    const fwd=unit(perp([Math.sin(rad(leg.heading||0)),0,Math.cos(rad(leg.heading||0))],shin)),dir=add(mul(shin,Math.cos(rad(angle))),mul(fwd,Math.sin(rad(angle))));
    d.legs[i]={ankle:add(add(sd.K,mul(dir,B.shank)),[0,lift,0]),heading:leg.heading,pitch,toeBend:pitch*.3,pole:sub(sd.K,mix3(sd.H,sd.A,.5))};
    return d;
  }
  // Two passes: place the legs, then aim hands at a knee.
  function kneeOf(d,i){return assemble({...d,arms:d.arms.map(a=>a||HANG)}).sides[i].K;}
  const liftFoot=(s,up,fwd=0)=>({ankle:[s*12,B.ank+up,3+fwd*clamp(up/6)],heading:s*6,pitch:up*.6,toeBend:up*.2});
  EXERCISES.push(
    // ----- seated: legs, core, ankles -----
    lib("extend","坐姿伸膝",{alt:true,timing:"lift",spring:false,props:[CHAIR],trails:["TOL","TOR"],parts:m=>({["thigh"+sideKey(m)]:1,["shank"+sideKey(m)]:.5}),
      pose:(u,m)=>{const d=seated({rest:"seat"});return restArms(kneeSwing(d,m>0?0:1,78*u,-12*u*u,3*Math.sqrt(clamp(u*30))),"seat");}}),
    lib("kneeOpen","坐姿开膝",{timing:"lift",front:true,props:[CHAIR],trails:["KL","KR"],parts:{thighL:1,thighR:1,pelvis:.6},
      pose:u=>seated({rest:"seat",legs:both(s=>({...flatFoot(s*12,3,s*6),pole:[s*Math.sin(rad(8+34*u)),0,Math.cos(rad(8+34*u))]}))})}),
    lib("crossMarch","坐姿对侧触膝",{alt:true,front:true,props:[CHAIR],trails:["KL","KR","TL","TR"],parts:m=>({["thigh"+sideKey(m)]:1,spine:.8,pelvis:.5}),
      pose:(u,m)=>{const i=m>0?0:1,d=seated({pitch:9*u,roll:m*3*u,legs:both(s=>s===m?liftFoot(s,20*u,4*u):null)}),K=kneeOf(d,i);
        const a=d.arms[1-i].ik;d.arms[1-i]={ik:{wrist:mix3(a.wrist,add(K,[-m*4,9,0]),u),pole:[-m,.2,-.6],hand:mix3(a.hand,[m*.3,-.4,1],u)}};return d;}}),
    lib("kneePress","坐姿手膝相推",{alt:true,timing:"press",front:true,props:[CHAIR],trails:["KL"],parts:m=>({["thigh"+sideKey(m)]:1,spine:1,upperL:.5,upperR:.5}),
      pose:(u,m,ch)=>{const i=m>0?0:1,g=ch.sh,d=seated({pitch:4*g,legs:both(s=>s===m?liftFoot(s,9*g,2*g):null)}),K=kneeOf(d,i);
        d.arms=both((s,j)=>({ik:{wrist:mix3(d.arms[j].ik.wrist,add(K,[s*5,6+.6*u,-2]),g),pole:[s,.1,-.6],hand:[0,-.3,1]}}));return d;}}),
    lib("sideReach","坐姿侧向伸手",{alt:true,front:true,props:[CHAIR],trails:["TL","TR"],parts:{spine:1,pelvis:.4},
      pose:(u,m)=>seated({rest:"seat",roll:m*13*u,head:8,arms:both(s=>s===m?{ik:{wrist:[s*(21+7*u),CHAIR.seat+2-20*u,SEAT[1]+12+2*u],pole:[s,.2,-.5],hand:[s*.1*u,-1,.3-.3*u]}}:null)})}),
    lib("hipHinge","坐姿小幅前倾",{timing:"lower",props:[CHAIR],trails:["HC","C7"],parts:{spine:1,pelvis:.7},
      pose:u=>seated({pitch:22*u})}),
    lib("diagonalReach","坐姿对角伸手",{alt:true,front:true,props:[CHAIR],trails:["TL","TR"],parts:{spine:1,pelvis:.5},
      pose:(u,m)=>{const i=m>0?0:1,d=seated({pitch:13*u,yaw:-m*14*u}),K=kneeOf(d,1-i);
        const a=seated({}).arms[i].ik;d.arms[i]={ik:{wrist:mix3(a.wrist,add(K,[m*3,8,14]),u),pole:[m,-.2,-.5],hand:mix3(a.hand,[-m*.4,-.3,1],u)}};return d;}}),
    lib("toeLift","坐姿抬脚尖",{timing:"lift",props:[CHAIR],trails:["TOL","TOR"],parts:{shankL:1,shankR:1},
      pose:u=>seated({legs:both(s=>rockFoot([s*12,B.ank,3],s*6,-25*u))})}),
    lib("seatedHeel","坐姿提脚跟",{timing:"lift",props:[CHAIR],trails:["HEL","HER"],parts:{shankL:1,shankR:1},
      pose:u=>seated({legs:both(s=>rockFoot([s*12,B.ank,3],s*6,26*u))})}),
    lib("anklePump","坐姿伸腿勾脚",{alt:true,spring:false,props:[CHAIR],trails:["TOL","TOR"],parts:m=>({["shank"+sideKey(m)]:1,["thigh"+sideKey(m)]:.5}),
      pose:(u,m)=>{const d=seated({rest:"seat"});return restArms(kneeSwing(d,m>0?0:1,45*u,-28*u*u,3*Math.sqrt(clamp(u*30))),"seat");}}),
    lib("heelToe","坐姿脚尖脚跟交替",{props:[CHAIR],trails:["TOL","TOR","HEL"],parts:{shankL:1,shankR:1},
      phases:[[0,.04,"准备"],[.04,.46,"抬脚尖"],[.46,.54,"换"],[.54,.96,"提脚跟"],[.96,1,"放松"]],
      pose:(u,m,ch)=>{const q=ch.q,p=q<.5?-24*Math.sin(Math.PI*seg(q,.04,.46))**2:24*Math.sin(Math.PI*seg(q,.54,.96))**2;return seated({legs:both(s=>rockFoot([s*12,B.ank,3],s*6,p))});}}),
    lib("chairDip","椅子臂屈伸",{timing:"lower",props:[CHAIR],trails:["P","EL"],parts:{upperL:1,upperR:1,foreL:.8,foreR:.8,clavL:.6,clavR:.6},
      pose:u=>{const d=seated({dy:-1.5-14*u,dz:27.5,pitch:4,legs:both(s=>flatFoot(s*12,38,s*6))});
        d.arms=both(s=>({ik:{wrist:[s*20,CHAIR.seat+2,CHAIR.front-2],pole:[s*.2,0,-1],hand:[0,-.2,-1]}}));return d;}})
  );
  // Standing one-leg moves: the working foot leaves the floor by blending from its planted pose.
  const flatAt=(s,x=10)=>flatFoot(s*x,0,s*5);
  // Hip and knee angles of a planted leg, in freeLeg's terms.
  function legAngles(H,A,s){
    const K=ik(H,A,B.thigh,B.shank,[Math.sin(rad(s*5)),0,Math.cos(rad(s*5))]).mid,th=sub(K,H),sh=sub(A,K);
    const flex=deg(Math.atan2(th[2],-th[1]));
    return {flex,knee:flex-deg(Math.atan2(sh[2],-sh[1])),abduct:deg(Math.asin(clamp(th[0]*s/B.thigh,-1,1)))};
  }
  // A foot leaving the floor: hip and knee angles move from the planted leg's to the target's, starting
  // slowly while a small lift clears the floor, so the foot neither slides nor drags. The planted
  // position is matched exactly at g=0 by a correction that fades out as the leg moves.
  function lifted(s,P,angles,g){
    const H=hipAt(P,s),flat=flatAt(s),a0=legAngles(H,flat.ankle,s),a=clamp(g)**2;
    const at=k=>({flex:mix(a0.flex,angles.flex||0,k),knee:mix(a0.knee,angles.knee??3,k),abduct:mix(a0.abduct,angles.abduct||0,k)});
    const free=freeLeg(H,s,at(a)),fix=sub(flat.ankle,freeLeg(H,s,at(0)).ankle);
    let ankle=add(free.ankle,mul(fix,1-a));const pitch=(angles.pitch||0)*clamp(g);
    // Keep the whole foot a growing gap above the floor while it travels.
    const fp=footPoints(ankle,s*5,pitch,pitch*.3),gap=3*Math.sqrt(Math.sin(Math.PI*clamp(g)));
    ankle=add(ankle,[0,Math.max(0,gap-Math.min(fp.heel[1],fp.ball[1],fp.toe[1])),0]);
    return {ankle,heading:s*5,pitch,toeBend:pitch*.3,pole:free.pole};
  }
  const onRail=o=>standing({rest:"rail",...o});
  const wallAt=z=>({type:"wall",near:z,far:z,top:185,half:48});
  const bisect=(f,lo,hi)=>{let flo=f(lo);for(let k=0;k<24;k++){const mid=(lo+hi)/2,fm=f(mid);if((fm<0)===(flo<0)){lo=mid;flo=fm;}else hi=mid;}return (lo+hi)/2;};
  const armGap=e=>Math.sqrt(B.upper**2+B.fore**2-2*B.upper*B.fore*Math.cos(rad(e)));
  // Wall push-up: a straight body leaning from the ankles; the lean is solved so the hands stay on the wall.
  const wallPush=(()=>{
    const lean=(b,u)=>{const dir=[0,Math.cos(rad(b)),Math.sin(rad(b))];return standing({legs:both(s=>flatAt(s)),breath:u,arms:both(()=>HANG)}).pelvis&&
      {...standing({breath:u,legs:both(s=>flatAt(s))}),pelvis:add([0,B.ank,0],mul(dir,83.9)),trunk:{pitch:b},head:{pitch:b+4}};};
    const shoulder=(b)=>assemble(lean(b,0)).sides[0].S,B0=14,S0=shoulder(B0),HANDY=128;
    const WZ=S0[2]+Math.sqrt(armGap(172)**2-(S0[1]-HANDY)**2-(S0[0]-20)**2)+2;
    const wrist=s=>[s*20,HANDY,WZ-2];
    return {wall:wallAt(WZ),build:(u)=>{const D=armGap(172-86*u),b=bisect(x=>len(sub(assemble(lean(x,u)).sides[0].S,wrist(1)))-D,B0-2,40),d=lean(b,u);
      d.arms=both(s=>({ik:{wrist:wrist(s),pole:[s*.8,-.4,-.5],hand:[0,1,.2]}}));return d;}};
  })();
  const push=EXERCISES.find(e=>e.id==="inclinePush").rig;
  EXERCISES.push(
    // ----- holding a chair back -----
    lib("miniSquat","扶椅小蹲",{timing:"lower",props:[RAIL],trails:["P"],parts:{thighL:1,thighR:1,pelvis:.8,shankL:.5,shankR:.5},
      pose:u=>onRail({drop:18*u,pz:-1-11*u,pitch:15*u,breath:u})}),
    lib("heel","扶椅踮脚",{timing:"lift",front:true,props:[RAIL],trails:["HC"],parts:{shankL:1,shankR:1},
      pose:u=>{const f=both(s=>rockFoot(flatAt(s).ankle,s*5,24*u)),a=f[0].ankle;return onRail({drop:-(a[1]-B.ank),pz:-1+a[2],legs:f});}}),
    lib("singleCalf","单腿提踵",{alt:true,timing:"lift",props:[RAIL],trails:["HC"],parts:m=>({["shank"+sideKey(m)]:1}),
      pose:(u,m,ch)=>{const up=rockFoot(flatAt(m).ankle,m*5,24*u),a=up.ankle,P=[m*6*ch.sh,STAND+a[1]-B.ank,-1+a[2]];
        return onRail({px:P[0],drop:-(a[1]-B.ank),pz:P[2],legs:both(s=>s===m?up:lifted(s,P,{flex:-6,knee:72,pitch:25},TUCK(ch.q)))});}}),
    lib("side","扶椅侧抬腿",{alt:true,timing:"lift",front:true,props:[RAIL],trails:["TOL","TOR"],parts:m=>({["thigh"+sideKey(m)]:1,pelvis:.7}),
      pose:(u,m,ch)=>{const P=[-m*3*ch.sh,STAND,-1];return onRail({px:P[0],legs:both(s=>s===m?lifted(s,P,{abduct:22,knee:4,flex:2},u):null)});}}),
    lib("weightShift","扶椅左右移重心",{alt:true,front:true,props:[RAIL],trails:["P","HC"],parts:{pelvis:1,thighL:.5,thighR:.5},
      pose:(u,m)=>onRail({feetX:16,px:m*8*u,drop:1+2*u,legs:both(s=>flatFoot(s*16,0,s*7))})}),
    lib("backLeg","扶椅向后抬腿",{alt:true,timing:"lift",props:[RAIL],trails:["TOL","TOR"],parts:m=>({["thigh"+sideKey(m)]:1,pelvis:.8}),
      pose:(u,m,ch)=>{const P=[-m*3*ch.sh,STAND,-1];return onRail({px:P[0],pitch:5*u,legs:both(s=>s===m?lifted(s,P,{flex:-17,knee:4,pitch:12},u):null)});}}),
    lib("hamstringCurl","扶稳屈膝",{alt:true,timing:"lift",props:[RAIL],trails:["HEL","HER"],parts:m=>({["thigh"+sideKey(m)]:.8,["shank"+sideKey(m)]:1}),
      pose:(u,m,ch)=>{const P=[-m*3*ch.sh,STAND,-1];return onRail({px:P[0],legs:both(s=>s===m?lifted(s,P,{flex:3,knee:78,pitch:22},u):null)});}}),
    lib("forwardTap","扶稳向前点步",{alt:true,props:[RAIL],trails:["TOL","TOR"],parts:m=>({["thigh"+sideKey(m)]:.7,pelvis:.5}),
      pose:(u,m,ch)=>{const heel=add(footPoints(flatAt(m).ankle,m*5,0,0).heel,[0,5*Math.pow(Math.sin(Math.PI*u),.5),26*u]);
        return onRail({px:-m*3*ch.sh,drop:3+2*u,legs:both(s=>s===m?{ankle:ankleAtHeel(heel,s*5,-16*u),heading:s*5,pitch:-16*u,toeBend:0}:null)});}}),
    lib("sideTap","扶稳侧向点步",{alt:true,front:true,props:[RAIL],trails:["TOL","TOR"],parts:m=>({["thigh"+sideKey(m)]:.8,pelvis:.6}),
      pose:(u,m,ch)=>{const ball=add(footPoints(flatAt(m).ankle,m*5,0,0).ball,[m*24*u,5*Math.pow(Math.sin(Math.PI*u),.5),0]);
        return onRail({px:-m*3*ch.sh,drop:3+2*u,legs:both(s=>s===m?ballFoot(ball,s*5,8*u):null)});}}),
    lib("singleLegStand","单腿站立提膝",{alt:true,timing:"lift",front:true,props:[RAIL],trails:["KL","KR"],parts:m=>({["thigh"+sideKey(-m)]:1,pelvis:.8}),
      pose:(u,m,ch)=>{const P=[-m*4*ch.sh,STAND,-1];return onRail({px:P[0],legs:both(s=>s===m?lifted(s,P,{flex:62,knee:72,pitch:15},u):null)});}}),
    lib("singleLegHinge","单腿前倾平衡",{alt:true,timing:"lower",props:[RAIL],trails:["TOL","TOR","HC"],parts:m=>({["thigh"+sideKey(-m)]:1,pelvis:1,spine:.6}),
      pose:(u,m,ch)=>{const P=[-m*4*ch.sh,STAND,-1-4*u];return onRail({px:P[0],pz:P[2],pitch:38*u,legs:both(s=>s===m?lifted(s,P,{flex:-38,knee:5,pitch:30},u):null)});}}),
    // ----- standing free -----
    lib("standMarch","原地踏步摆臂",{alt:true,trails:["KL","KR","TL","TR"],parts:m=>({["thigh"+sideKey(m)]:1,pelvis:.4}),
      pose:(u,m,ch)=>{const P=[-m*3*ch.sh,STAND,-1];return standing({px:P[0],legs:both(s=>s===m?lifted(s,P,{flex:68,knee:78,pitch:12},u):null),
        arms:both(s=>({frame:"world",swing:(s===m?-18:32)*u,abduct:6,elbow:25+15*u,wrist:6}))});}}),
    lib("standCross","站姿对侧提膝",{alt:true,front:true,trails:["KL","KR","TL","TR"],parts:m=>({["thigh"+sideKey(m)]:1,spine:.9,pelvis:.5}),
      pose:(u,m,ch)=>{const i=m>0?0:1,P=[-m*3*ch.sh,STAND,-1],d=standing({px:P[0],pitch:14*u,roll:m*4*u,legs:both(s=>s===m?lifted(s,P,{flex:80,knee:85,pitch:12},u):null)}),K=kneeOf(d,i);
        const r=assemble(d).sides[1-i],pole0=unit(sub(r.E,mix3(r.S,r.W,.5)));
        d.arms[1-i]={ik:{wrist:mix3(r.W,add(K,[-m*4,10,0]),u),pole:mix3(pole0,[-m,.2,-.6],u),hand:mix3(unit(sub(r.T,r.W)),[m*.3,-.4,1],u)}};return d;}}),
    lib("hingeRow","俯身划臂",{timing:"lift",trails:["EL","ER"],parts:{clavL:1,clavR:1,upperL:.9,upperR:.9,spine:.5},
      pose:u=>standing({pitch:42,drop:6,pz:-9,prot:[-3*u,-3*u],arms:both(()=>({frame:"world",swing:3-35*u,abduct:8,elbow:10+92*u,wrist:5}))})}),
    lib("goodMorning","站姿髋铰链",{timing:"lower",trails:["HC","P"],parts:{pelvis:1,thighL:.7,thighR:.7,spine:.8},
      pose:u=>{const pitch=45*u,U=orient([0,1,0],{pitch}),F=orient([0,0,1],{pitch}),P=[0,STAND-4*u,-1-12*u],C7=add(P,add(mul(U,B.trunk),mul(F,-1.5)));
        return standing({pitch,drop:4*u,pz:P[2],arms:both(s=>({ik:{wrist:add(C7,add(add([-s*8,0,0],mul(U,-15)),mul(F,11))),pole:[s,-.3,-.3],hand:[-s,0,0]}}))});}}),
    // ----- against a wall -----
    lib("wallSlide","靠墙滑蹲",{timing:"lower",props:[wallAt(-42)],trails:["P"],parts:{thighL:1,thighR:1,pelvis:.7},
      pose:u=>standing({rest:"thigh",drop:STAND-80+22*u,pz:-26-4*u,pitch:-4,legs:both(s=>flatFoot(s*11,8,s*6))})}),
    lib("wallToe","靠墙抬脚尖",{timing:"lift",props:[wallAt(-33)],trails:["TOL","TOR"],parts:{shankL:1,shankR:1},
      pose:u=>standing({drop:STAND-84,pz:-18,pitch:-6,legs:both(s=>rockFoot([s*10,B.ank,10],s*5,-24*u))})}),
    lib("wallPush","墙面俯卧撑",{timing:"lower",props:[wallPush.wall],trails:["HC","EL"],parts:{upperL:1,upperR:1,foreL:.8,foreR:.8,clavL:.8,clavR:.8,spine:.4},
      pose:u=>wallPush.build(u)}),
    // ----- hands on a table -----
    lib("tableKneeDrive","扶桌提膝",{alt:true,timing:"lift",props:[push.table],handSupport:true,trails:["KL","KR"],parts:m=>({["thigh"+sideKey(m)]:1,spine:1,upperL:.4,upperR:.4}),
      pose:(u,m)=>{const d=push.plank(0,{breath:u,prot:1}),i=m>0?0:1,leg=d.legs[i];
        d.legs[i]={...leg,ankle:add(leg.ankle,[0,40*Math.sqrt(u),58*Math.pow(u,1.6)]),pitch:leg.pitch+(20-leg.pitch)*u,toeBend:leg.toeBend*(1-u)};return d;}})
  );
//@@LIB@@

  // ---------- precompute ----------
  // Free arms: a driven pendulum (swing and abduction) with muscle tone. While `free` is 0 a stiff
  // spring holds it to the constrained arm, so letting go continues from the real arm state.
  const ARM_K=3/(2*(B.upper+B.fore+B.hand)),G=981,TRACK=2*Math.PI*9,TONE=2*Math.PI*1.1,TONE_Z=.22;
  function swingArms(ex,raw,dt){
    const N=raw.length,first=raw.map(r=>assemble(ex.constrained(r.ch))),hang=ex.pendulum.hang;
    raw.forEach(r=>{r.ch.armAngles=[];});
    SIDES.forEach((s,i)=>{
      const frame=WORLD(s),Sx=first.map(p=>p.sides[i].S),cons=first.map(p=>{const sd=p.sides[i];return armAngles(sd.S,sd.E,sd.W,sd.T,frame);});
      const acc=Sx.map((b,k)=>mul(add(sub(Sx[(k+N-1)%N],b),sub(Sx[(k+1)%N],b)),1/(dt*dt)));
      let sw=rad(cons[0].swing),vs=0,ab=rad(cons[0].abduct),va=0;const outS=new Float64Array(N),outA=new Float64Array(N);
      for(let loop=0;loop<3;loop++)for(let k=0;k<N;k++){
        const w=clamp(raw[k].ch.free),a=acc[k],c=cons[k],kw=mix(TRACK,TONE,w),z=mix(1,TONE_Z,w),g=(G+a[1])*w;
        vs+=(-kw*kw*(sw-rad(mix(c.swing,hang.swing,w)))-2*z*kw*vs-ARM_K*(g*Math.sin(sw)+w*a[2]*Math.cos(sw)))*dt;sw+=vs*dt;
        va+=(-kw*kw*(ab-rad(mix(c.abduct,hang.abduct,w)))-2*z*kw*va-ARM_K*(g*Math.sin(ab)+w*a[0]*s*Math.cos(ab)))*dt;ab+=va*dt;
        if(loop===2){outS[k]=deg(sw);outA[k]=deg(ab);}
      }
      raw.forEach((r,k)=>{const w=clamp(r.ch.free),c=cons[k];
        r.ch.armAngles[i]={frame:"world",swing:mix(c.swing,outS[k],w),abduct:mix(c.abduct,outA[k],w),elbow:mix(c.elbow,hang.elbow,w),twist:mixAngle(c.twist,hang.twist,w),wrist:mixAngle(c.wrist,hang.wrist,w)};});
    });
  }
  const STRIDE=POINTS.length*3;
  function prepare(ex){
    ex.cache=ex.cache||{};if(ex.cache[avatar])return ex.cache[avatar];
    const duration=ex.reps*4,N=Math.round(duration*RATE),dt=duration/N,raw=[];
    for(let i=0;i<N;i++){const p=i/N*ex.reps,rep=Math.floor(p);raw.push({q:p-rep,rep,ch:ex.channels(p-rep,rep)});}
    for(const [key,[freq,zeta,lo=-Infinity,hi=Infinity]] of Object.entries(ex.springs||{})){
      const out=springLoop(raw.map(r=>r.ch[key]),dt,freq,zeta);raw.forEach((r,i)=>{r.ch[key]=clamp(out[i],lo,hi);});
    }
    if(ex.post)ex.post(raw.map(r=>r.ch),dt);
    if(ex.pendulum)swingArms(ex,raw,dt);
    const pts=new Float32Array(N*STRIDE),effort=new Float32Array(N),seat=new Float32Array(N),reps=new Uint8Array(N);let reach=0;
    raw.forEach((r,i)=>{const pose=assemble(ex.build(r.ch,r.rep));write(pose,pts,i*STRIDE);effort[i]=r.ch.effort||0;seat[i]=ex.seat?ex.seat(r.ch):0;reps[i]=r.rep;reach=Math.max(reach,pose.reach);});
    const get=(i,k)=>{const o=((i%N+N)%N)*STRIDE+INDEX[k]*3;return [pts[o],pts[o+1],pts[o+2]];};
    // Foot loads: feet touching the floor share what the seat does not carry, nearer the COM takes more.
    const loads=new Float32Array(N*2),metric=new Float32Array(N);
    for(let i=0;i<N;i++){
      const com=get(i,"COM"),w=["L","R"].map(k=>{const low=Math.min(get(i,"HE"+k)[1],get(i,"BA"+k)[1],get(i,"TO"+k)[1]);if(low>1.2)return 0;const c=mix3(get(i,"HE"+k),get(i,"TO"+k),.5);return 1/(Math.hypot(c[0]-com[0],c[2]-com[2])+4);});
      const tot=w[0]+w[1]||1;loads[i*2]=w[0]/tot*(1-seat[i]);loads[i*2+1]=w[1]/tot*(1-seat[i]);
      const a=get(i-1,ex.metric.point),b=get(i+1,ex.metric.point),v=mul(sub(b,a),1/(2*dt));metric[i]=ex.metric.mode==="vy"?v[1]:len(v);
    }
    const lo=[1e9,0,1e9],hi=[-1e9,-1e9,-1e9];let bx=0,bz=0;
    for(let i=0;i<N;i++){for(let k=0;k<POINTS.length;k++){const o=i*STRIDE+k*3;for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],pts[o+a]);hi[a]=Math.max(hi[a],pts[o+a]);}}
      const f=mix3(get(i,"HEL"),get(i,"TOR"),.5);bx+=f[0];bz+=f[2];}
    lo[1]=0;hi[1]+=B.head;
    for(const pr of ex.props){const b=pr.type==="chair"?[[-pr.half,0,pr.back],[pr.half,pr.top,pr.front]]:[[-pr.half,0,pr.near],[pr.half,pr.top,pr.far]];for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],b[0][a]);hi[a]=Math.max(hi[a],b[1][a]);}}
    const base=[bx/N,bz/N];let floorR=0;
    for(let i=0;i<N;i+=4)for(const k of ["HEL","TOL","HER","TOR"]){const p=get(i,k);floorR=Math.max(floorR,Math.hypot(p[0]-base[0],p[2]-base[1]));}
    return ex.cache[avatar]={N,dt,duration,pts,effort,seat,reps,loads,metric,bounds:[lo,hi],base,floorR:floorR+30,reach,get,fits:new Map()};
  }
  // ---------- rendering ----------
  const THEMES={
    dark:{hair:"#a8734f",bg0:"#1f3d35",bg1:"#0a1411",floor:"255,255,255",ring:"rgba(255,255,255,.09)",near:"#f5f2e8",far:"#86a194",outline:"#0e1b17",accent:"#ff7a45",
      glow:"255,122,69",trail:"111,227,193",ghost:"245,242,232",prop:"rgba(205,225,214,.38)",propFill:"rgba(205,225,214,.07)",shadow:"0,0,0",com:"#ffd166",support:"111,227,193",lighter:true},
    light:{hair:"#8a5a3b",bg0:"#f3f5ee",bg1:"#dce4d3",floor:"26,60,52",ring:"rgba(26,60,52,.12)",near:"#17332c",far:"#8da396",outline:"#eef1e8",accent:"#c45532",
      glow:"196,85,50",trail:"38,150,136",ghost:"23,51,44",prop:"rgba(26,60,52,.4)",propFill:"rgba(26,60,52,.06)",shadow:"20,45,38",com:"#d48806",support:"38,150,136",lighter:false}
  };
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),hex=c=>"rgb("+c.map(Math.round).join(",")+")";
  const mixRGB=(a,b,t)=>a.map((v,i)=>mix(v,b[i],clamp(t)));
  // Orthographic camera: yaw 0 looks at the figure's front, 90 at its right side; pitch looks down.
  function camera(yaw,pitch){
    const cy=Math.cos(rad(yaw)),sy=Math.sin(rad(yaw)),cp=Math.cos(rad(pitch)),sp=Math.sin(rad(pitch));
    return v=>{const X=v[0]*cy+v[2]*sy,Z=-v[0]*sy+v[2]*cy;return [X,v[1]*cp-Z*sp,Z*cp+v[1]*sp];};
  }
  // The frame fits the whole cycle's bounding box, so the view never zooms while playing.
  // Fit uses the projected points of the whole cycle (plus props), so rotating never crops or zooms mid-move.
  function extent(ex,data,cam){
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;const see=v=>{const p=cam(v);x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);};
    for(let i=0;i<data.N;i+=6)for(let k=0;k<POINTS.length;k++){const o=i*STRIDE+k*3;see([data.pts[o],data.pts[o+1],data.pts[o+2]]);}
    for(const pr of ex.props){const z=pr.type==="chair"?[pr.back,pr.front]:pr.type==="wall"?[pr.near,pr.near]:[pr.near,pr.near+25];for(const x of [-pr.half,pr.half])for(const y of [0,pr.top])for(const zz of z)see([x,y,zz]);}
    see([data.base[0],0,data.base[1]]);y1+=B.head*1.2;return [x0,x1,y0,y1];
  }
  // The scale fits every yaw of the camera's sway, so the figure never zooms while the view turns.
  function fitView(ex,data,cam,w,h,range){
    const key=w+"|"+h+"|"+(range?range.join():"");let s=data.fits.get(key);const [x0,x1,y0,y1]=extent(ex,data,cam),pad=Math.min(w,h)*.08;
    if(s===undefined){
      s=1e9;for(let k=0;k<=(range?8:0);k++){const [a0,a1,b0,b1]=range?extent(ex,data,camera(range[0]-range[1]+2*range[1]*k/8,range[2])):[x0,x1,y0,y1];s=Math.min(s,(w-2*pad)/(a1-a0),(h-2*pad)/(b1-b0));}
      data.fits.set(key,s);
    }
    return {s,cx:w/2-(x0+x1)/2*s,cy:h/2+(y0+y1)/2*s};
  }
  // Points at a fractional frame, interpolated so slow motion stays smooth.
  function sampler(data,f){
    const N=data.N;f=((f%N)+N)%N;const i=Math.floor(f),j=(i+1)%N,a=f-i,P=data.pts;
    return k=>{const o=INDEX[k]*3,p=i*STRIDE+o,q=j*STRIDE+o;return [P[p]+(P[q]-P[p])*a,P[p+1]+(P[q+1]-P[p+1])*a,P[p+2]+(P[q+2]-P[p+2])*a];};
  }
  function polyline(ctx,pts,close){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));if(close)ctx.closePath();}
  function drawFloor(ctx,proj,data,pal,pitch){
    const [bx,bz]=data.base,R=data.floorR,c=proj([bx,0,bz]),r=R*proj.s;
    ctx.save();ctx.translate(c[0],c[1]);ctx.scale(1,Math.max(.05,Math.sin(rad(pitch))));
    const g=ctx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,"rgba("+pal.floor+",.10)");g.addColorStop(.7,"rgba("+pal.floor+",.05)");g.addColorStop(1,"rgba("+pal.floor+",0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,2*Math.PI);ctx.fill();ctx.restore();
    ctx.strokeStyle=pal.ring;ctx.lineWidth=1;
    for(const f of [.45,.8]){const pts=[];for(let i=0;i<=72;i++){const a=i/72*2*Math.PI;pts.push(proj([bx+Math.cos(a)*R*f,0,bz+Math.sin(a)*R*f]));}polyline(ctx,pts);ctx.stroke();}
  }
  function drawProp(ctx,proj,pr,pal){
    const line=(a,b,w)=>{const p=proj(a),q=proj(b);ctx.lineWidth=w*proj.s;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();};
    const quad=(pts)=>{polyline(ctx,pts.map(proj),true);ctx.fill();ctx.lineWidth=1.6*proj.s;ctx.stroke();};
    ctx.strokeStyle=pal.prop;ctx.fillStyle=pal.propFill;ctx.lineCap="round";
    if(pr.type==="chair"){
      const {seat:y,front:f,back:b,half:h,top:t}=pr;
      for(const x of [-h+2,h-2]){line([x,0,f-2],[x,y,f-2],2.2);line([x,0,b+2],[x,t,b+2],2.2);}
      quad([[-h,y,f],[h,y,f],[h,y,b],[-h,y,b]]);line([-h+2,t,b+2],[h-2,t,b+2],2.6);line([-h+2,y+26,b+2],[h-2,y+26,b+2],1.6);
    }else if(pr.type==="wall"){
      const {top:y,near:z,half:h}=pr;quad([[-h,0,z],[h,0,z],[h,y,z],[-h,y,z]]);
    }else{
      const {top:y,near:n,far:f,half:h}=pr;
      for(const x of [-h+3,h-3])for(const z of [n+3,f-3])line([x,0,z],[x,y,z],2.4);
      quad([[-h,y,n],[h,y,n],[h,y,f],[-h,y,f]]);
    }
  }
  function hull(ps){
    ps=ps.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(ps.length<3)return ps;
    const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
    for(const p of ps){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
    for(const p of ps.reverse()){while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}
    return lo.slice(0,-1).concat(up.slice(0,-1));
  }
  const inside=(poly,p)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
  // Foot shadows darken with the load a foot carries; with `com` on, the support area and the
  // centre of mass are drawn, the marker turning orange when the COM leaves the support.
  function drawGround(ctx,proj,ex,data,at,fi,pal,showCom){
    const i=Math.floor(fi)%data.N;
    ["L","R"].forEach((k,n)=>{const he=at("HE"+k),to=at("TO"+k);if(Math.min(he[1],to[1],at("BA"+k)[1])>6)return;
      const a=proj([he[0],0,he[2]]),b=proj([to[0],0,to[2]]),load=data.loads[i*2+n];
      ctx.strokeStyle="rgba("+pal.shadow+","+(.14+.34*load).toFixed(3)+")";ctx.lineWidth=(6+4*load)*proj.s;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();});
    if(!showCom)return;
    const contact=[];
    for(const k of ["L","R"])for(const f of ["HE","BA","TO"]){const p=at(f+k);if(p[1]<1.2)contact.push([p[0],p[2]]);}
    if(data.seat[i]>.05){const pr=ex.props[0];for(const x of [-15,15])contact.push([x,pr.front],[x,pr.back+8]);}
    if(ex.handSupport)for(const k of ["L","R"]){const w=at("W"+k);contact.push([w[0],w[2]]);}
    const poly=hull(contact),com=at("COM"),inPoly=poly.length>2&&inside(poly,[com[0],com[2]]);
    if(poly.length>2){polyline(ctx,poly.map(p=>proj([p[0],0,p[1]])),true);ctx.fillStyle="rgba("+pal.support+",.12)";ctx.fill();ctx.setLineDash([4,5]);ctx.strokeStyle="rgba("+pal.support+",.6)";ctx.lineWidth=1.4;ctx.stroke();ctx.setLineDash([]);}
    const c=proj(com),g=proj([com[0],0,com[2]]),col=inPoly?pal.com:pal.accent;
    ctx.setLineDash([3,4]);ctx.strokeStyle=col;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(g[0],g[1]);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(g[0],g[1],3.2,0,2*Math.PI);ctx.fill();
    ctx.save();ctx.shadowColor=col;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(c[0],c[1],5,0,2*Math.PI);ctx.fill();ctx.restore();
  }
  // Limbs in cm of stroke width. Far limbs fade toward the background; every stroke gets a thin
  // outline in the stage colour so crossing limbs stay readable.
  const SEGMENTS=[
    ...["L","R"].flatMap(k=>[
      {id:"thigh"+k,a:"H"+k,b:"K"+k,w:3.8},{id:"shank"+k,a:"K"+k,b:"A"+k,w:3.4},
      {id:"heel"+k,part:"shank"+k,a:"A"+k,b:"HE"+k,w:2.8},{id:"foot"+k,part:"shank"+k,a:"A"+k,b:"BA"+k,w:2.8},{id:"toe"+k,part:"shank"+k,a:"BA"+k,b:"TO"+k,w:2.5},
      {id:"upper"+k,a:"S"+k,b:"E"+k,w:3.2},{id:"fore"+k,a:"E"+k,b:"W"+k,w:2.9},{id:"hand"+k,part:"fore"+k,a:"W"+k,b:"T"+k,w:2.5},
      {id:"clav"+k,a:"C7",b:"S"+k,w:3.2}]),
    {id:"pelvis",a:"HL",b:"HR",w:3.8},{id:"sacrum",part:"pelvis",a:"P",b:"SB",w:3.8},{id:"spine",curve:["SB","SM","C7"],w:4.4},{id:"neck",part:"spine",a:"C7",b:"NT",w:3.2}
  ];
  function strokeSeg(ctx,pts){
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    if(pts.length===3){const c=[2*pts[1][0]-(pts[0][0]+pts[2][0])/2,2*pts[1][1]-(pts[0][1]+pts[2][1])/2];ctx.quadraticCurveTo(c[0],c[1],pts[2][0],pts[2][1]);}
    else ctx.lineTo(pts[1][0],pts[1][1]);
    ctx.stroke();
  }
  function drawFigure(ctx,proj,at,pal,parts,effort,{glow=true,ghost=0,hair=null}={}){
    const P={};for(const k of POINTS)P[k]=proj(at(k));
    const center=(P.P[2]+P.C7[2])/2,s=proj.s;
    const items=SEGMENTS.map(sg=>{const pts=(sg.curve||[sg.a,sg.b]).map(k=>P[k]);return {sg,pts,depth:pts.reduce((a,p)=>a+p[2],0)/pts.length};});
    items.push({head:true,depth:P.HC[2]+1});items.sort((a,b)=>a.depth-b.depth);
    ctx.lineCap="round";ctx.lineJoin="round";
    for(const it of items){
      const t=clamp((it.depth-center)/20+.5),baseRGB=mixRGB(rgb(pal.far),rgb(pal.near),t),base=hex(baseRGB);
      if(it.head){
        const c=P.HC,r=B.head*s;
        if(ghost){ctx.strokeStyle="rgba("+pal.ghost+","+ghost+")";ctx.lineWidth=2.2*s;ctx.beginPath();ctx.arc(c[0],c[1],r,0,2*Math.PI);ctx.stroke();continue;}
        const hc0=at("HC"),fw0=unit(sub(at("HF"),hc0)),up0=unit(sub(at("HU"),hc0));
        // Hair: a short crop for him; a ponytail for her that trails the head's motion.
        if(avatar==="female"&&hair){
          const root=add(hc0,add(mul(fw0,-B.head*.9),mul(up0,B.head*.35))),v=sub(hc0,hair.prev),tip=add(root,add(add(mul(fw0,-6),mul([0,-1,0],21)),mul(v,-2.6)));
          const a=proj(root),m=proj(add(mix3(root,tip,.5),mul(fw0,-3))),b=proj(tip);
          ctx.lineCap="round";ctx.strokeStyle=pal.outline;ctx.lineWidth=7*s+3;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo(m[0],m[1],b[0],b[1]);ctx.stroke();
          ctx.strokeStyle=pal.hair;ctx.lineWidth=7*s;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo(m[0],m[1],b[0],b[1]);ctx.stroke();
        }
        ctx.fillStyle=pal.outline;ctx.beginPath();ctx.arc(c[0],c[1],r+1.8,0,2*Math.PI);ctx.fill();
        ctx.fillStyle=base;ctx.beginPath();ctx.arc(c[0],c[1],r,0,2*Math.PI);ctx.fill();
        // A visor band on the face side shows where the head points, from any angle.
        const hc=at("HC"),fw=unit(sub(at("HF"),hc)),up=unit(sub(at("HU"),hc)),side=cross(up,fw),vis=[];
        for(let a=-70;a<=70;a+=7){const v=proj(add(hc,add(mul(up,1.4),mul(add(mul(fw,Math.cos(rad(a))),mul(side,Math.sin(rad(a)))),B.head*.93))));if(v[2]>=c[2]-B.head*.1)vis.push(v);}
        if(vis.length>1){ctx.strokeStyle=pal.accent;ctx.lineWidth=2.4*s;polyline(ctx,vis);ctx.stroke();}
        // A hair cap over the crown and the back of the head: short and flat for him, fuller for her.
        const cap=[],deep=avatar==="female"?1.02:.86,back=avatar==="female"?175:140;
        for(let a=-60;a<=back;a+=10){const d=add(mul(up0,Math.cos(rad(a))),mul(fw0,-Math.sin(rad(a))));cap.push(proj(add(hc0,mul(d,B.head*1.02))));}
        for(let a=back;a>=-60;a-=10){const d=add(mul(up0,Math.cos(rad(a))),mul(fw0,-Math.sin(rad(a))));cap.push(proj(add(hc0,mul(d,B.head*(avatar==="female"?.62:.72)*deep))));}
        ctx.fillStyle=pal.hair;polyline(ctx,cap,true);ctx.fill();
        continue;
      }
      const w=it.sg.w*s*BUILDS[avatar].stroke;
      if(ghost){ctx.strokeStyle="rgba("+pal.ghost+","+ghost+")";ctx.lineWidth=w*.8;strokeSeg(ctx,it.pts);continue;}
      const e=clamp((parts[it.sg.part||it.sg.id]||0)*effort);
      if(glow&&e>.04){
        ctx.save();if(pal.lighter){ctx.globalCompositeOperation="lighter";ctx.shadowColor="rgba("+pal.glow+",.9)";ctx.shadowBlur=14*e;}
        ctx.strokeStyle="rgba("+pal.glow+","+(.16+.4*e).toFixed(3)+")";ctx.lineWidth=w+(5+9*e);strokeSeg(ctx,it.pts);ctx.restore();
      }
      ctx.strokeStyle=pal.outline;ctx.lineWidth=w+3;strokeSeg(ctx,it.pts);
      ctx.strokeStyle=glow&&e>.04?hex(mixRGB(baseRGB,rgb(pal.accent),e*.55)):base;ctx.lineWidth=w;strokeSeg(ctx,it.pts);
    }
  }
  // Fading light-trails of chosen points over the last ~0.5 s of the cycle.
  function drawTrails(ctx,proj,data,f,keys,pal){
    ctx.save();if(pal.lighter)ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
    for(const k of keys){
      const pts=[];for(let j=0;j<=30;j++)pts.push(proj(sampler(data,f-j*2)(k)));
      let travel=0;for(let j=1;j<pts.length;j++)travel+=Math.hypot(pts[j][0]-pts[j-1][0],pts[j][1]-pts[j-1][1]);
      if(travel<3*proj.s)continue;
      for(let j=1;j<pts.length;j++){const a=1-j/pts.length;ctx.strokeStyle="rgba("+pal.trail+","+(a*a*.9).toFixed(3)+")";ctx.lineWidth=Math.max(1,(2.4*a+.4)*proj.s);ctx.beginPath();ctx.moveTo(pts[j-1][0],pts[j-1][1]);ctx.lineTo(pts[j][0],pts[j][1]);ctx.stroke();}
    }
    ctx.restore();
  }
  function background(ctx,w,h,pal){
    const g=ctx.createRadialGradient(w/2,h*.42,0,w/2,h*.42,Math.hypot(w,h)*.62);g.addColorStop(0,pal.bg0);g.addColorStop(1,pal.bg1);
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  }
  // One view of the figure at fractional frame f, inside the box (x0, y0, w, h).
  function scene(ctx,x0,y0,w,h,ex,data,f,o,pal){
    // `sway` turns the camera slowly back and forth around the move's home view (o.clock in seconds).
    const base=o.yaw??ex.view.yaw,sway=o.sway||0,yaw=base+sway*Math.sin(2*Math.PI*(o.clock||0)/14),pitch=o.pitch??ex.view.pitch;
    // A camera the viewer can turn (`turnable`) is fitted for a full circle, so no angle crops the figure.
    const cam=camera(yaw,pitch),F=fitView(ex,data,cam,w,h,o.turnable?[ex.view.yaw,180,Math.round(pitch)]:sway?[base,sway,pitch]:null);
    const proj=v=>{const c=cam(v);return [x0+F.cx+c[0]*F.s,y0+F.cy-c[1]*F.s,c[2]];};proj.s=F.s;
    const i=Math.floor(f)%data.N,at=sampler(data,f),rep=data.reps[i];
    drawFloor(ctx,proj,data,pal,pitch);
    for(const pr of ex.props)drawProp(ctx,proj,pr,pal);
    drawGround(ctx,proj,ex,data,at,f,pal,o.com);
    if(o.trail&&!o.small)drawTrails(ctx,proj,data,f,ex.trails,pal);
    const parts=ex.parts(rep),effort=data.effort[i];
    if(o.ghost&&!o.small)for(const [lag,a] of [[30,.07],[20,.11],[10,.17]])drawFigure(ctx,proj,sampler(data,f-lag),pal,parts,0,{ghost:a});
    drawFigure(ctx,proj,at,pal,parts,effort,{glow:o.glow!==false,hair:{prev:sampler(data,f-6)("HC")}});
    if(ex.towel){const a=proj(at("WL")),b=proj(at("WR"));ctx.strokeStyle="#c9a36a";ctx.lineCap="round";ctx.lineWidth=2.6*F.s;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}
    return {q:(f/data.N*ex.reps)%1,rep,effort};
  }
  const frameAt=(data,t)=>((t/data.duration)%1+1)%1*data.N;
  // t is seconds into the cycle. o: {yaw, pitch, theme, ghost, trail, com, glow, small}.
  function render(ctx,w,h,ex,t,o={}){
    const data=prepare(ex),pal=THEMES[o.theme||"dark"];background(ctx,w,h,pal);
    return scene(ctx,0,0,w,h,ex,data,frameAt(data,t),o,pal);
  }
  // Start pose beside the end pose (the most-worked frame) of the given rep.
  function renderPair(ctx,w,h,ex,rep,o={}){
    const data=prepare(ex),pal=THEMES[o.theme||"dark"],per=data.N/ex.reps,a=Math.round((rep%ex.reps)*per);let b=a;
    for(let i=a;i<a+per;i++)if(data.effort[i]>data.effort[b])b=i;
    background(ctx,w,h,pal);const top=24;
    scene(ctx,0,top,w/2,h-top,ex,data,a,{...o,ghost:false,trail:false},pal);scene(ctx,w/2,top,w/2,h-top,ex,data,b,{...o,ghost:false,trail:false},pal);
    ctx.fillStyle=pal.near;ctx.globalAlpha=.8;ctx.font="600 13px system-ui";ctx.textAlign="center";const [l0,l1]=o.labels||["起始姿势","动作终点"];ctx.fillText(l0,w*.25,20);ctx.fillText(l1,w*.75,20);ctx.globalAlpha=1;
  }
  const BY_ID=Object.fromEntries(EXERCISES.map(e=>[e.id,e]));
  const find=id=>BY_ID[id];
  const viewLabel=id=>BY_ID[id].view.yaw>45?"侧面 · 面向右 →":"正面 · 如照镜子";
  // Draw into a canvas at the device pixel ratio. Unprepared moves are computed on a queue, one per tick,
  // unless `sync` asks for them now; until then nothing is drawn and false is returned.
  const queue=[];let pumping=false;
  function pump(){const ex=queue.shift();if(!ex){pumping=false;return;}prepare(ex);setTimeout(pump,0);}
  function draw(canvas,id,t,o={}){
    const ex=BY_ID[id];if(!ex)return false;
    if(!(ex.cache&&ex.cache[avatar])&&!o.sync){if(!queue.includes(ex))queue.push(ex);if(!pumping){pumping=true;setTimeout(pump,0);}return false;}
    const box=canvas.getBoundingClientRect(),w=box.width,h=box.height;if(!w||!h)return false;
    const dpr=Math.min((typeof window!=="undefined"&&window.devicePixelRatio)||1,2);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
    if(o.pair)renderPair(ctx,w,h,ex,o.rep||0,o);else render(ctx,w,h,ex,t,o);
    return true;
  }
  return {EXERCISES,prepare,POINTS,INDEX,B,RATE,STAND,render,renderPair,draw,find,viewLabel,setAvatar,getAvatar,THEMES};
})();
