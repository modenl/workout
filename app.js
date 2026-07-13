const INK = "#173a34";
const ORANGE = "#df714d";
const WHITE = "#fffdf8";
const GUIDE = "rgba(23,58,52,.22)";
const YELLOW = "#efc75e";
const FAR = "#8da19a";

const CATEGORIES = [
  { key: "warm", label: "热身活动" },
  { key: "lower", label: "腿与臀" },
  { key: "push", label: "胸与手臂" },
  { key: "pull", label: "背与肩" },
  { key: "core", label: "核心与姿势" },
  { key: "ankle", label: "小腿与脚踝" },
  { key: "balance", label: "髋部与平衡" }
];

const VIEW_META = {
  march:"正面视角 · 橙色腿交替抬起", seatedJack:"正面视角 · 双侧同时开合", reachTap:"侧面视角 · 前方在右 →",
  stand:"侧面视角 · 向上站起", miniSquat:"斜侧视角 · 臀部向后", extend:"侧面视角 · 脚向前 →",
  wallPush:"侧面视角 · 墙在前方 →", palmPress:"正面视角 · 双掌在胸前", forwardPress:"侧面视角 · 双手向前 →",
  elbowPull:"正面视角 · 手肘向后拉", towelPull:"正面视角 · 双手向左右拉", lowRow:"正面视角 · 手肘贴身后拉",
  crossMarch:"正面视角 · 对侧手膝靠近", kneePress:"正面视角 · 橙色侧发力", sideReach:"正面视角 · 左右交替",
  heel:"正面视角 · 脚跟向上", toeLift:"正面视角 · 脚尖向上", seatedHeel:"正面视角 · 脚跟向上",
  side:"正面视角 · 腿向左或右", weightShift:"正面视角 · 重心左右移动", backLeg:"侧面视角 · 后方在左 ←"
};

const LIBRARY = {
  warm: [
    { id:"march", name:"坐姿踏步", purpose:"温和带动心肺，唤醒髋部和大腿。", steps:["坐在椅子前半部，身体坐直。","左右轮流抬脚，同时自然摆臂。"], cue:"脚轻轻落地；抬到舒服的高度即可。", alternating:true },
    { id:"seatedJack", name:"坐姿开合", purpose:"活动肩、髋和腿，让全身暖起来。", steps:["坐稳，双脚并拢，双手放在腿旁。","双脚向两旁点开，双臂抬到肩高，再收回。"], cue:"手臂不必举过头；全程保持顺畅呼吸。" },
    { id:"reachTap", name:"坐姿前点脚", purpose:"活动髋、膝和肩部，温和提高身体活动量。", steps:["坐在椅子前半部，双脚踩稳。","一只脚向前点，同时双手向前送，再换边。"], cue:"脚跟轻点地面；身体保持直，不向后倒。", alternating:true }
  ],
  lower: [
    { id:"stand", name:"扶椅起身", purpose:"练大腿和臀部，帮助起床、如厕和上下车。", steps:["椅子靠墙，双脚放在膝盖下方。","身体稍向前，站直后有控制地坐回。"], cue:"弯髋、弯膝；膝盖始终朝向脚尖。" },
    { id:"miniSquat", name:"扶椅小蹲", purpose:"练大腿、臀部和髋部，增强站立力量。", steps:["双手扶稳椅背，双脚与髋同宽。","臀部向后坐一小段，再用腿站直。"], cue:"背部保持长直；膝盖不向内夹。" },
    { id:"extend", name:"坐姿伸膝", purpose:"练大腿前侧，帮助膝盖在站立和走路时稳定。", steps:["坐直，双手扶住椅子两侧。","一侧小腿向前伸，再慢慢放回换边。"], cue:"膝盖不要锁死；不用甩腿或追求很高。", alternating:true }
  ],
  push: [
    { id:"wallPush", name:"墙面俯卧撑", purpose:"练胸、肩和手臂，让推门和撑起身体更有力。", steps:["面对墙站立，双手与肩同高。","弯手肘靠近墙，再把墙推远。"], cue:"只弯手肘；头、背、髋始终保持一条直线。" },
    { id:"palmPress", name:"坐姿合掌推压", purpose:"温和练胸、肩和手臂，不需要器械。", steps:["坐直，双掌在胸前相对。","数到 2 时互相推压，数到 4 时放松。"], cue:"肩膀放松，不耸肩；不要憋气。" },
    { id:"forwardPress", name:"坐姿向前推", purpose:"练胸、肩和手臂，帮助完成日常推送动作。", steps:["坐直，双手握拳放在胸前。","双臂向前推到微弯，再有控制地收回。"], cue:"手肘不要锁死；腰部不后仰。" }
  ],
  pull: [
    { id:"elbowPull", name:"坐姿拉肘夹背", purpose:"练上背和肩后侧，帮助维持挺拔姿势。", steps:["坐直，双臂向前伸到肩高。","弯手肘向后拉，轻轻夹背，再伸回。"], cue:"肘保持在肩膀下方；腰部不要后仰。" },
    { id:"towelPull", name:"坐姿毛巾拉开", purpose:"练上背、肩和手臂，帮助拿物更稳。", steps:["双手握毛巾两端，在胸前伸直。","向两边拉紧毛巾，再缓缓放松。"], cue:"手肘保持微弯，不锁死；毛巾不用拉得很紧。" },
    { id:"lowRow", name:"坐姿低位划臂", purpose:"练背部和手臂，帮助保持肩膀打开。", steps:["坐直，双手向前下方伸出。","弯手肘贴近身体向后拉，再慢慢伸回。"], cue:"先向后拉肩胛骨；不要耸肩或挺肚子。" }
  ],
  core: [
    { id:"crossMarch", name:"坐姿对侧触膝", purpose:"练腹部、髋部和身体协调。", steps:["坐直，右脚抬起，同时左手靠近右膝。","放回后换边，身体不要后倒。"], cue:"动作来自抬膝和轻微转身，不要猛拉颈部。", alternating:true },
    { id:"kneePress", name:"坐姿手膝相推", purpose:"温和唤醒腹部深层肌肉，帮助躯干稳定。", steps:["坐直，抬起一侧膝盖，双手扶住膝上方。","手向下、膝向上轻轻相推，再放回换边。"], cue:"只用三四成力；背部保持直，不憋气。", alternating:true },
    { id:"sideReach", name:"坐姿侧向伸手", purpose:"练躯干两侧和姿势控制，帮助弯身取物。", steps:["坐稳，双脚踩地，一只手扶住椅边。","另一只手向身体侧下方伸，再回正换边。"], cue:"幅度要小；臀部两侧始终压在椅面。", alternating:true }
  ],
  ankle: [
    { id:"heel", name:"扶椅踮脚", purpose:"练小腿和脚踝，帮助迈步和站稳。", steps:["双手扶稳椅背，双脚朝前。","脚跟抬起，再有控制地落地。"], cue:"脚趾始终着地；膝盖保持柔软，不锁死。" },
    { id:"toeLift", name:"坐姿抬脚尖", purpose:"练小腿前侧和脚踝，帮助减少走路绊脚。", steps:["坐稳，双脚平放，膝盖约九十度。","脚跟不动，抬起脚尖，再慢慢放下。"], cue:"只动脚踝；不要抬起整条腿。" },
    { id:"seatedHeel", name:"坐姿提脚跟", purpose:"练小腿后侧和脚踝，帮助迈步时向前推地。", steps:["坐稳，双脚平放，脚尖朝前。","脚尖不动，抬起脚跟，再慢慢落下。"], cue:"膝盖保持在脚尖上方；不要让脚踝向外倒。" }
  ],
  balance: [
    { id:"side", name:"扶椅侧抬腿", purpose:"练髋部两侧和单脚稳定，帮助走路少摇晃。", steps:["一手扶稳椅背，双脚朝前。","外侧腿向旁抬一小段，再慢慢收回。"], cue:"抬起腿保持直；支撑腿微弯，不锁膝。", alternating:true },
    { id:"weightShift", name:"扶椅左右移重心", purpose:"练脚踝、髋部和平衡反应，帮助转身与迈步。", steps:["双手轻扶椅背，双脚比髋稍宽。","把重心移到一侧，再回中间换边。"], cue:"两脚不离地；承重侧膝盖保持微弯。", alternating:true },
    { id:"backLeg", name:"扶椅向后抬腿", purpose:"练臀部和髋后侧，帮助站稳和迈步。", steps:["双手扶稳椅背，身体站直。","一条腿保持直，向后抬一小段，再换边。"], cue:"不要前倾或塌腰；支撑腿微弯。", alternating:true }
  ]
};

function lerp(a, b, t) { return a + (b - a) * t; }
function ease(t) { return .5 - Math.cos(Math.PI * t) / 2; }
function point(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }; }
function limb(ctx, a, b, width = 18, color = INK) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}
function ghostLimb(ctx,a,b,width=14){ctx.save();ctx.globalAlpha=.32;ctx.strokeStyle=FAR;ctx.lineWidth=width;ctx.lineCap="round";ctx.setLineDash([7,8]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();}
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
  ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-17*Math.cos(angle-.55),y2-17*Math.sin(angle-.55)); ctx.lineTo(x2-17*Math.cos(angle+.55),y2-17*Math.sin(angle+.55)); ctx.closePath(); ctx.fill(); ctx.restore();
}
function drawGround(ctx) { ctx.strokeStyle=GUIDE; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-240,430);ctx.lineTo(240,430);ctx.stroke(); }
function drawTorso(ctx, hip, shoulder) { limb(ctx, hip, shoulder, 23); joint(ctx, hip); head(ctx, {x:shoulder.x,y:shoulder.y-52}); }

function seatedPose(ctx, c, options = {}) {
  chair(ctx,c.x-92,c.y,1); const hip={x:c.x,y:c.y-82}, shoulder={x:c.x,y:c.y-205}; drawTorso(ctx,hip,shoulder);
  const leftKnee=options.leftKnee || {x:c.x-42,y:c.y-34};
  const rightKnee=options.rightKnee || {x:c.x+55,y:c.y-34};
  const leftFoot=options.leftFoot || {x:c.x-45,y:c.y};
  const rightFoot=options.rightFoot || {x:c.x+58,y:c.y};
  const leftColor=options.activeSide==="left"?ORANGE:FAR,rightColor=options.activeSide==="left"?FAR:ORANGE;
  limb(ctx,hip,leftKnee,16,leftColor);limb(ctx,leftKnee,leftFoot,16,leftColor);limb(ctx,hip,rightKnee,18,rightColor);limb(ctx,rightKnee,rightFoot,18,rightColor);
  joint(ctx,leftKnee,7);joint(ctx,rightKnee,7);
  return {hip,shoulder,leftKnee,rightKnee,leftFoot,rightFoot};
}
function standingPose(ctx,c,options={}) {
  const hip={x:c.x+(options.shift||0),y:c.y-145+(options.drop||0)}, shoulder={x:c.x+(options.shift||0)+(options.lean||0),y:c.y-260+(options.drop||0)};
  const footL={x:c.x-38+(options.sideL||0),y:c.y+(options.ankleRise||0)}, footR={x:c.x+38+(options.sideR||0),y:c.y+(options.ankleRise||0)};
  const kneeL=options.kneeL||point(hip,footL,.53), kneeR=options.kneeR||point(hip,footR,.53);
  const leftColor=options.activeSide==="left"?ORANGE:FAR,rightColor=options.activeSide==="left"?FAR:ORANGE;
  drawTorso(ctx,hip,shoulder); limb(ctx,hip,kneeL,16,leftColor);limb(ctx,kneeL,footL,16,leftColor);limb(ctx,hip,kneeR,18,rightColor);limb(ctx,kneeR,footR,18,rightColor);joint(ctx,kneeL,7);joint(ctx,kneeR,7);
  return {hip,shoulder,footL,footR,kneeL,kneeR};
}

const DRAWERS = {
  march(ctx,c,t,side){
    const lift = 48*t; const right = side > 0;
    const pose=seatedPose(ctx,c,{activeSide:right?"right":"left",rightKnee:right?{x:c.x+62,y:c.y-34-lift*.5}:undefined,rightFoot:right?{x:c.x+62,y:c.y-lift}:undefined,leftKnee:!right?{x:c.x-48,y:c.y-34-lift*.5}:undefined,leftFoot:!right?{x:c.x-48,y:c.y-lift}:undefined});
    const movingShoulder=pose.shoulder; const handA={x:c.x+(right?-42:42),y:c.y-130-25*t},handB={x:c.x+(right?42:-42),y:c.y-130};limb(ctx,movingShoulder,handA,15,ORANGE);limb(ctx,movingShoulder,handB,15);arrow(ctx,c.x+(right?105:-105),c.y-4,c.x+(right?105:-105),c.y-68);
  },
  seatedJack(ctx,c,t){
    const pose=seatedPose(ctx,c,{leftFoot:{x:c.x-45-52*t,y:c.y},rightFoot:{x:c.x+58+52*t,y:c.y}});
    const leftElbow={x:c.x-48-34*t,y:c.y-160-35*t},rightElbow={x:c.x+48+34*t,y:c.y-160-35*t};
    const leftHand={x:c.x-48-70*t,y:c.y-105-92*t},rightHand={x:c.x+48+70*t,y:c.y-105-92*t};
    limb(ctx,pose.shoulder,leftElbow,16);limb(ctx,leftElbow,leftHand,16,ORANGE);limb(ctx,pose.shoulder,rightElbow,16);limb(ctx,rightElbow,rightHand,16,ORANGE);joint(ctx,leftElbow);joint(ctx,rightElbow);
  },
  reachTap(ctx,c,t,side){
    chair(ctx,c.x-105,c.y,1);const hip={x:c.x-8,y:c.y-82},shoulder={x:c.x-8,y:c.y-205};drawTorso(ctx,hip,shoulder);const farKnee={x:c.x+35,y:c.y-38},farFoot={x:c.x+48,y:c.y},knee={x:c.x+48,y:c.y-42},foot={x:c.x+65+92*t,y:c.y};ghostLimb(ctx,knee,{x:c.x+65,y:c.y});limb(ctx,hip,farKnee,15,FAR);limb(ctx,farKnee,farFoot,15,FAR);limb(ctx,hip,knee,18,ORANGE);limb(ctx,knee,foot,18,ORANGE);joint(ctx,knee,7);const elbow={x:c.x+38,y:c.y-170},hand={x:c.x+65+62*t,y:c.y-150};limb(ctx,shoulder,elbow,15,FAR);limb(ctx,elbow,hand,17,ORANGE);joint(ctx,elbow);arrow(ctx,c.x+78,c.y-16,c.x+170,c.y-16);
  },
  stand(ctx,c,t){
    chair(ctx,c.x-135,c.y,1); const hip={x:c.x-45+45*t,y:c.y-82-63*t}, shoulder={x:c.x-42+42*t,y:c.y-205-55*t};
    const footL={x:c.x-18,y:c.y},footR={x:c.x+48,y:c.y}; const kneeL={x:c.x+16,y:c.y-44-35*t},kneeR={x:c.x+58,y:c.y-46-33*t};
    drawTorso(ctx,hip,shoulder);limb(ctx,hip,kneeL,18,ORANGE);limb(ctx,kneeL,footL,18,ORANGE);limb(ctx,hip,kneeR);limb(ctx,kneeR,footR);joint(ctx,kneeL);joint(ctx,kneeR);
    const hand={x:c.x-104+34*t,y:c.y-112-63*t};limb(ctx,shoulder,hand,15);arrow(ctx,c.x+135,c.y-90,c.x+135,c.y-215);
  },
  miniSquat(ctx,c,t){
    chair(ctx,c.x+98,c.y,1); const hip={x:c.x+12*t,y:c.y-145+48*t},shoulder={x:c.x+28*t,y:c.y-260+48*t};
    const footL={x:c.x-42,y:c.y},footR={x:c.x+42,y:c.y}; const kneeL={x:c.x-50+18*t,y:c.y-72+27*t},kneeR={x:c.x+50+18*t,y:c.y-72+27*t};
    drawTorso(ctx,hip,shoulder);limb(ctx,hip,kneeL);limb(ctx,kneeL,footL);limb(ctx,hip,kneeR,18,ORANGE);limb(ctx,kneeR,footR,18,ORANGE);joint(ctx,kneeL);joint(ctx,kneeR);
    const hand={x:c.x+105,y:c.y-190};limb(ctx,shoulder,hand,15);joint(ctx,hand,6);arrow(ctx,c.x-110,c.y-165,c.x-110,c.y-95);
  },
  extend(ctx,c,t,side){
    chair(ctx,c.x-105,c.y,1);const hip={x:c.x-8,y:c.y-82},shoulder={x:c.x-8,y:c.y-205};drawTorso(ctx,hip,shoulder);const farKnee={x:c.x+34,y:c.y-38},farFoot={x:c.x+45,y:c.y},knee={x:c.x+52,y:c.y-45},foot={x:c.x+62+105*t,y:c.y-4-72*t};ghostLimb(ctx,knee,{x:c.x+62,y:c.y});limb(ctx,hip,farKnee,15,FAR);limb(ctx,farKnee,farFoot,15,FAR);limb(ctx,hip,knee,18,ORANGE);limb(ctx,knee,foot,18,ORANGE);joint(ctx,knee,7);const hand={x:c.x+24,y:c.y-112};limb(ctx,shoulder,hand,15);arrow(ctx,c.x+80,c.y-58,c.x+174,c.y-100);
  },
  wallPush(ctx,c,t){
    const wallX=c.x+150; ctx.strokeStyle=INK;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(wallX,c.y-340);ctx.lineTo(wallX,c.y+5);ctx.stroke();
    const foot={x:c.x-86,y:c.y}, shoulder={x:c.x-78+48*t,y:c.y-255}, hip={x:c.x-82+26*t,y:c.y-138}; const knee=point(hip,foot,.52);
    drawTorso(ctx,hip,shoulder);limb(ctx,foot,knee);limb(ctx,knee,hip);joint(ctx,knee,7);
    const hand={x:wallX,y:c.y-245},elbow={x:lerp(shoulder.x,wallX,.55),y:c.y-218+28*t};limb(ctx,shoulder,elbow,18,ORANGE);limb(ctx,elbow,hand,18,ORANGE);joint(ctx,elbow);joint(ctx,hand,7);arrow(ctx,c.x+10,c.y-310,c.x+88,c.y-310);
  },
  palmPress(ctx,c,t){
    const pose=seatedPose(ctx,c); const hand={x:c.x,y:c.y-178},leftElbow={x:c.x-82+24*t,y:c.y-170},rightElbow={x:c.x+82-24*t,y:c.y-170};
    limb(ctx,pose.shoulder,leftElbow,16);limb(ctx,leftElbow,hand,17,ORANGE);limb(ctx,pose.shoulder,rightElbow,16);limb(ctx,rightElbow,hand,17,ORANGE);joint(ctx,leftElbow);joint(ctx,rightElbow);joint(ctx,hand,8);ctx.strokeStyle=YELLOW;ctx.lineWidth=5;ctx.beginPath();ctx.arc(hand.x,hand.y,22+8*t,0,Math.PI*2);ctx.stroke();
  },
  forwardPress(ctx,c,t){
    chair(ctx,c.x-105,c.y,1);const hip={x:c.x-8,y:c.y-82},shoulder={x:c.x-8,y:c.y-205};drawTorso(ctx,hip,shoulder);const knee={x:c.x+40,y:c.y-38},foot={x:c.x+48,y:c.y};limb(ctx,hip,knee,16,FAR);limb(ctx,knee,foot,16,FAR);const elbow={x:c.x+42+28*t,y:c.y-180},hand={x:c.x+58+105*t,y:c.y-180};ghostLimb(ctx,elbow,{x:c.x+58,y:c.y-180});limb(ctx,shoulder,elbow,17,FAR);limb(ctx,elbow,hand,19,ORANGE);joint(ctx,elbow);joint(ctx,hand,7);arrow(ctx,c.x+74,c.y-238,c.x+176,c.y-238);
  },
  elbowPull(ctx,c,t){
    const pose=seatedPose(ctx,c); const leftElbow={x:c.x-58-42*t,y:c.y-178},rightElbow={x:c.x+58+42*t,y:c.y-178}; const leftHand={x:c.x-82+70*(1-t),y:c.y-177},rightHand={x:c.x+82-70*(1-t),y:c.y-177};
    limb(ctx,pose.shoulder,leftElbow,17);limb(ctx,leftElbow,leftHand,17,ORANGE);limb(ctx,pose.shoulder,rightElbow,17);limb(ctx,rightElbow,rightHand,17,ORANGE);joint(ctx,leftElbow);joint(ctx,rightElbow);arrow(ctx,c.x-18,c.y-242,c.x-102,c.y-242);arrow(ctx,c.x+18,c.y-242,c.x+102,c.y-242);
  },
  towelPull(ctx,c,t){
    const pose=seatedPose(ctx,c); const leftHand={x:c.x-52-45*t,y:c.y-178},rightHand={x:c.x+52+45*t,y:c.y-178};
    limb(ctx,pose.shoulder,leftHand,17,ORANGE);limb(ctx,pose.shoulder,rightHand,17,ORANGE);ctx.strokeStyle=YELLOW;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(leftHand.x,leftHand.y);ctx.lineTo(rightHand.x,rightHand.y);ctx.stroke();joint(ctx,leftHand,7);joint(ctx,rightHand,7);
  },
  lowRow(ctx,c,t){
    const pose=seatedPose(ctx,c);const leftElbow={x:c.x-52-55*t,y:c.y-148+12*t},rightElbow={x:c.x+52+55*t,y:c.y-148+12*t};const leftHand={x:c.x-78+55*(1-t),y:c.y-116},rightHand={x:c.x+78-55*(1-t),y:c.y-116};
    limb(ctx,pose.shoulder,leftElbow,16);limb(ctx,leftElbow,leftHand,17,ORANGE);limb(ctx,pose.shoulder,rightElbow,16);limb(ctx,rightElbow,rightHand,17,ORANGE);joint(ctx,leftElbow);joint(ctx,rightElbow);arrow(ctx,c.x-25,c.y-102,c.x-112,c.y-102);arrow(ctx,c.x+25,c.y-102,c.x+112,c.y-102);
  },
  crossMarch(ctx,c,t,side){
    const right=side>0, lift=50*t; const pose=seatedPose(ctx,c,{activeSide:right?"right":"left",rightKnee:right?{x:c.x+58,y:c.y-34-lift*.45}:undefined,rightFoot:right?{x:c.x+58,y:c.y-lift}:undefined,leftKnee:!right?{x:c.x-45,y:c.y-34-lift*.45}:undefined,leftFoot:!right?{x:c.x-45,y:c.y-lift}:undefined});
    const hand={x:c.x+(right?35:-30),y:c.y-110-18*t};limb(ctx,pose.shoulder,hand,17,ORANGE);joint(ctx,hand,7);
  },
  kneePress(ctx,c,t,side){
    const right=side>0, lift=45*t; const pose=seatedPose(ctx,c,{activeSide:right?"right":"left",rightKnee:right?{x:c.x+55,y:c.y-34-lift*.5}:undefined,rightFoot:right?{x:c.x+55,y:c.y-lift}:undefined,leftKnee:!right?{x:c.x-45,y:c.y-34-lift*.5}:undefined,leftFoot:!right?{x:c.x-45,y:c.y-lift}:undefined});
    const target=right?pose.rightKnee:pose.leftKnee; const hand={x:target.x,y:target.y-18};limb(ctx,pose.shoulder,hand,17,ORANGE);joint(ctx,hand,7);ctx.strokeStyle=YELLOW;ctx.lineWidth=5;ctx.beginPath();ctx.arc(target.x,target.y,16+7*t,0,Math.PI*2);ctx.stroke();
  },
  sideReach(ctx,c,t,side){
    chair(ctx,c.x-92,c.y,1);const hip={x:c.x,y:c.y-82},shoulder={x:c.x+side*24*t,y:c.y-205+8*t};drawTorso(ctx,hip,shoulder);const kneeL={x:c.x-42,y:c.y-34},kneeR={x:c.x+55,y:c.y-34},footL={x:c.x-45,y:c.y},footR={x:c.x+58,y:c.y};limb(ctx,hip,kneeL);limb(ctx,kneeL,footL);limb(ctx,hip,kneeR,18,ORANGE);limb(ctx,kneeR,footR,18,ORANGE);joint(ctx,kneeL,7);joint(ctx,kneeR,7);
    const reachingHand={x:c.x+side*(78+58*t),y:c.y-122+42*t},supportHand={x:c.x-side*42,y:c.y-112};limb(ctx,shoulder,reachingHand,17,ORANGE);limb(ctx,shoulder,supportHand,15);joint(ctx,reachingHand,7);arrow(ctx,c.x+side*70,c.y-125,c.x+side*145,c.y-75);
  },
  heel(ctx,c,t){
    chair(ctx,c.x+100,c.y,1); const pose=standingPose(ctx,c,{drop:-20*t,ankleRise:-22*t}); const toeL={x:pose.footL.x+20,y:c.y},toeR={x:pose.footR.x+20,y:c.y};limb(ctx,pose.footL,toeL,8);limb(ctx,pose.footR,toeR,8);const hand={x:c.x+106,y:c.y-186};limb(ctx,pose.shoulder,hand,15);joint(ctx,hand,6);arrow(ctx,c.x-115,c.y-8,c.x-115,c.y-70);
  },
  toeLift(ctx,c,t){
    const pose=seatedPose(ctx,c); const heelL={x:pose.leftFoot.x,y:c.y},heelR={x:pose.rightFoot.x,y:c.y};const toeL={x:heelL.x+34,y:c.y-25*t},toeR={x:heelR.x+34,y:c.y-25*t};limb(ctx,heelL,toeL,10,ORANGE);limb(ctx,heelR,toeR,10,ORANGE);arrow(ctx,c.x+120,c.y-4,c.x+120,c.y-45);
  },
  seatedHeel(ctx,c,t){
    const pose=seatedPose(ctx,c);const toeL={x:pose.leftFoot.x+30,y:c.y},toeR={x:pose.rightFoot.x+30,y:c.y},heelL={x:pose.leftFoot.x,y:c.y-25*t},heelR={x:pose.rightFoot.x,y:c.y-25*t};limb(ctx,heelL,toeL,10,ORANGE);limb(ctx,heelR,toeR,10,ORANGE);arrow(ctx,c.x-120,c.y-3,c.x-120,c.y-46);
  },
  side(ctx,c,t,side){
    chair(ctx,c.x+108,c.y,1); const move=side>0?"sideR":"sideL"; const opts={activeSide:side>0?"right":"left"};opts[move]=(side>0?82:-82)*t;const pose=standingPose(ctx,c,opts);const hand={x:c.x+114,y:c.y-185};limb(ctx,pose.shoulder,hand,15);joint(ctx,hand,6);arrow(ctx,c.x+(side>0?55:-55),c.y-46,c.x+(side>0?145:-145),c.y-46);
  },
  weightShift(ctx,c,t,side){
    chair(ctx,c.x+102,c.y,1); const shift=side*38*t;const pose=standingPose(ctx,c,{activeSide:side>0?"right":"left",shift,kneeL:{x:c.x-48+shift*.6,y:c.y-72+5*t},kneeR:{x:c.x+48+shift*.6,y:c.y-72+5*t}});const hand={x:c.x+108,y:c.y-185};limb(ctx,pose.shoulder,hand,15);joint(ctx,hand,6);arrow(ctx,c.x-80,c.y-310,c.x+80,c.y-310);
  },
  backLeg(ctx,c,t,side){
    chair(ctx,c.x+112,c.y,1);const hip={x:c.x,y:c.y-145},shoulder={x:c.x,y:c.y-260};drawTorso(ctx,hip,shoulder);const supportKnee={x:c.x+18,y:c.y-74},supportFoot={x:c.x+20,y:c.y},movingKnee={x:c.x-18-26*t,y:c.y-76-12*t},movingFoot={x:c.x-24-88*t,y:c.y-3-20*t};ghostLimb(ctx,hip,{x:c.x-18,y:c.y-76});ghostLimb(ctx,{x:c.x-18,y:c.y-76},{x:c.x-24,y:c.y-3});limb(ctx,hip,supportKnee,16,FAR);limb(ctx,supportKnee,supportFoot,16,FAR);limb(ctx,hip,movingKnee,19,ORANGE);limb(ctx,movingKnee,movingFoot,19,ORANGE);joint(ctx,supportKnee,7);joint(ctx,movingKnee,7);const hand={x:c.x+118,y:c.y-185};limb(ctx,shoulder,hand,16,ORANGE);joint(ctx,hand,6);arrow(ctx,c.x-60,c.y-45,c.x-158,c.y-66);
  }
};

const els = {
  planList:document.querySelector("#plan-list"), trainer:document.querySelector("#trainer"), canvas:document.querySelector("#trainer-canvas"),
  progressLabel:document.querySelector("#progress-label"), progressFill:document.querySelector("#progress-fill"), beat:document.querySelector("#beat-count"), rep:document.querySelector("#rep-count"),
  category:document.querySelector("#exercise-category"), name:document.querySelector("#exercise-name"), purpose:document.querySelector("#exercise-purpose"), steps:document.querySelector("#exercise-steps"), cue:document.querySelector("#exercise-cue"),
  view:document.querySelector("#view-label"), pause:document.querySelector("#pause-workout"), voice:document.querySelector("#voice-toggle"), countCycle:document.querySelector("#count-cycle"), soundTest:document.querySelector("#test-sound"), soundStatus:document.querySelector("#sound-status"), transition:document.querySelector("#transition"), transitionKicker:document.querySelector("#transition-kicker"), transitionTitle:document.querySelector("#transition-title"), transitionCount:document.querySelector("#transition-count")
};
const ctx = els.canvas.getContext("2d");
const todayKey = new Date().toISOString().slice(0,10);
const daySeed = [...todayKey].reduce((sum,ch)=>sum+ch.charCodeAt(0),0);
let planOffset = Number(localStorage.getItem("planOffset") || 0);
let plan = [];
const state = { open:false, index:0, paused:false, voice:true, elapsed:0, lastNow:0, lastBeat:-1, transitioning:false, transitionTimers:[] };
let preferredVoice = null;
let countCyclePlayable = false;
let soundTestTimer = null;

function setSoundStatus(message,stateName="") {
  els.soundStatus.textContent=message;els.soundStatus.dataset.state=stateName;
}
function stopCountCycle(reset=false) {
  clearTimeout(soundTestTimer);soundTestTimer=null;els.countCycle.pause();if(reset){try{els.countCycle.currentTime=0;}catch{}}
}
function startCountCycle({fromStart=false,testing=false}={}) {
  if(!testing&&!state.voice)return Promise.resolve(false);
  clearTimeout(soundTestTimer);els.countCycle.loop=!testing;els.countCycle.muted=false;els.countCycle.volume=1;
  try{els.countCycle.currentTime=fromStart?0:Math.min(3.95,(state.elapsed%4000)/1000);}catch{}
  const playResult=els.countCycle.play();
  if(!playResult){countCyclePlayable=true;return Promise.resolve(true);}
  return playResult.then(()=>{
    countCyclePlayable=true;
    if(testing){setSoundStatus("正在播放：一、二、三、四","playing");soundTestTimer=setTimeout(()=>{stopCountCycle(true);setSoundStatus("声音正常，可以开始锻炼","ready");},4100);}
    return true;
  }).catch(()=>{
    countCyclePlayable=false;stopCountCycle(true);setSoundStatus("声音被手机拦截，请调高媒体音量并再点一次","blocked");
    if(!testing&&state.open){state.voice=false;els.voice.textContent="点此开声音";els.voice.setAttribute("aria-pressed","false");}
    return false;
  });
}
function testSound() { stopCountCycle(true);startCountCycle({fromStart:true,testing:true}); }

function refreshVoices() {
  if(!("speechSynthesis" in window))return;
  const voices=window.speechSynthesis.getVoices();
  preferredVoice=voices.find(voice=>/^zh[-_]CN$/i.test(voice.lang))||voices.find(voice=>/^zh/i.test(voice.lang))||null;
}
function makeUtterance(text) {
  const utterance=new SpeechSynthesisUtterance(text);
  if(preferredVoice)utterance.voice=preferredVoice;
  utterance.lang=preferredVoice?.lang||"zh-CN";utterance.rate=.92;utterance.pitch=1;utterance.volume=1;
  return utterance;
}
function speak(text,{interrupt=false}={}) {
  if(!state.voice||!("speechSynthesis" in window))return;
  const synth=window.speechSynthesis;if(interrupt)synth.cancel();synth.resume();synth.speak(makeUtterance(text));
  window.setTimeout(()=>{if(synth.paused)synth.resume();},80);
}
function startVoiceFromTap() {
  if(!state.voice)return;
  state.lastBeat=0;startCountCycle({fromStart:true});
}

function makePlan() {
  plan = CATEGORIES.map((category,index) => {
    const choices=LIBRARY[category.key]; const exercise=choices[(daySeed+planOffset+index)%choices.length];
    return {...exercise,category:category.label};
  });
}
function renderPlan() {
  els.planList.innerHTML=plan.map(item=>`<li><strong>${item.name}</strong><span>${item.category} · ${item.purpose}</span></li>`).join("");
}
function generateNewPlan() {
  planOffset += 1; localStorage.setItem("planOffset",String(planOffset)); makePlan(); renderPlan();
  const first=els.planList.querySelector("li"); if(first){first.animate([{background:"rgba(239,199,94,.55)"},{background:"transparent"}],{duration:800});}
}

function currentExercise(){ return plan[state.index]; }
function setExercise(index) {
  clearTransitions(); state.index=Math.max(0,Math.min(plan.length-1,index));state.elapsed=0;state.lastBeat=-1;state.lastNow=performance.now();state.paused=false;state.transitioning=false;
  const item=currentExercise();els.progressLabel.textContent=`动作 ${state.index+1} / ${plan.length}`;els.progressFill.style.width=`${((state.index+1)/plan.length)*100}%`;els.category.textContent=item.category;els.name.textContent=item.name;els.purpose.textContent=item.purpose;els.steps.innerHTML=item.steps.map(step=>`<li>${step}</li>`).join("");els.cue.textContent=item.cue;els.view.textContent=VIEW_META[item.id]||"橙色表示动作侧";els.canvas.setAttribute("aria-label",`${item.name}标准速度动画演示，${VIEW_META[item.id]||"橙色表示动作侧"}`);els.rep.textContent="1";els.beat.textContent="1";els.pause.textContent="暂停";els.transition.classList.remove("is-open");els.transition.setAttribute("aria-hidden","true");
}
function openTrainer() {
  state.open=true;document.body.classList.add("is-training");els.trainer.classList.add("is-open");els.trainer.setAttribute("aria-hidden","false");setExercise(0);startVoiceFromTap();els.pause.focus();
}
function closeTrainer() {
  clearTransitions();stopCountCycle(true);state.open=false;state.paused=false;state.transitioning=false;document.body.classList.remove("is-training");els.trainer.classList.remove("is-open");els.trainer.setAttribute("aria-hidden","true");if("speechSynthesis" in window)speechSynthesis.cancel();document.querySelector("#start-workout").focus();
}
function togglePause(forcePause=false) {
  if(!state.open||state.transitioning)return;state.paused=forcePause||!state.paused;state.lastNow=performance.now();els.pause.textContent=state.paused?"继续":"暂停";if(state.paused){stopCountCycle();if("speechSynthesis" in window)speechSynthesis.cancel();}else{startCountCycle();speak("继续",{interrupt:true});}
}
function speakBeat(number) { speak(["一","二","三","四"][number-1]); }
function clearTransitions(){state.transitionTimers.forEach(id=>{clearTimeout(id);clearInterval(id);});state.transitionTimers=[];}
function completeExercise() {
  if(state.transitioning)return;state.transitioning=true;stopCountCycle(true);if("speechSynthesis" in window)speechSynthesis.cancel();els.transition.classList.add("is-open");els.transition.setAttribute("aria-hidden","false");
  if(state.index===plan.length-1){els.transitionKicker.textContent="七个动作全部完成";els.transitionTitle.textContent="今天练完了";els.transitionCount.textContent="✓";speak("今天的七个动作完成了，做得很好",{interrupt:true});state.transitionTimers.push(setTimeout(closeTrainer,4200));return;}
  const next=plan[state.index+1];els.transitionKicker.textContent="这个动作完成";els.transitionTitle.textContent=`下一个：${next.name}`;let remaining=3;els.transitionCount.textContent=String(remaining);speak(`完成。下一个，${next.name}`,{interrupt:true});
  const timer=setInterval(()=>{remaining-=1;els.transitionCount.textContent=String(Math.max(remaining,1));if(remaining<=0){clearInterval(timer);setExercise(state.index+1);startCountCycle({fromStart:true});}},1000);state.transitionTimers.push(timer);
}

function drawCurrent(motion, repNumber) {
  const rect=els.canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2);const width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));if(els.canvas.width!==width||els.canvas.height!==height){els.canvas.width=width;els.canvas.height=height;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);ctx.save();const scale=Math.min(rect.width/620,rect.height/520);ctx.translate(rect.width/2,rect.height*.91);ctx.scale(scale,scale);ctx.translate(0,-430);drawGround(ctx);const item=currentExercise();const side=repNumber%2===0?-1:1;DRAWERS[item.id](ctx,{x:0,y:430},motion,side);ctx.restore();
}
function frame(now) {
  if(state.open&&!state.transitioning){
    if(!state.paused){const delta=Math.min(100,Math.max(0,now-state.lastNow));state.elapsed+=delta;}state.lastNow=now;
    const beatIndex=Math.floor(state.elapsed/1000);const repNumber=Math.min(8,Math.floor(beatIndex/4)+1);const beatNumber=(beatIndex%4)+1;
    if(beatIndex!==state.lastBeat&&beatIndex<32&&!state.paused){state.lastBeat=beatIndex;els.beat.textContent=String(beatNumber);els.rep.textContent=String(repNumber);const orb=els.beat.parentElement;orb.classList.remove("is-beat");void orb.offsetWidth;orb.classList.add("is-beat");if(!countCyclePlayable)speakBeat(beatNumber);}
    const phase=(state.elapsed%4000)/4000;const motion=phase<.5?ease(phase*2):ease((1-phase)*2);drawCurrent(motion,repNumber);
    if(state.elapsed>=32000)completeExercise();
  }
  requestAnimationFrame(frame);
}

document.querySelectorAll("#start-workout, #start-workout-2").forEach(button=>button.addEventListener("click",openTrainer));
document.querySelectorAll("#new-plan, #new-plan-2").forEach(button=>button.addEventListener("click",generateNewPlan));
document.querySelector("#close-trainer").addEventListener("click",closeTrainer);
document.querySelector("#pause-workout").addEventListener("click",()=>togglePause());
document.querySelector("#previous-exercise").addEventListener("click",()=>{setExercise(state.index-1);startCountCycle({fromStart:true});});
document.querySelector("#next-exercise").addEventListener("click",()=>{if(state.index===plan.length-1)completeExercise();else{setExercise(state.index+1);startCountCycle({fromStart:true});}});
els.voice.addEventListener("click",()=>{state.voice=!state.voice;els.voice.textContent=state.voice?"语音开":"语音关";els.voice.setAttribute("aria-pressed",String(state.voice));if(!state.voice){stopCountCycle();if("speechSynthesis" in window)speechSynthesis.cancel();}else{startCountCycle();speak("语音已开启",{interrupt:true});}});
els.soundTest.addEventListener("click",testSound);
els.countCycle.addEventListener("playing",()=>{countCyclePlayable=true;if(!state.open)setSoundStatus("声音正常，可以开始锻炼","ready");});
els.countCycle.addEventListener("error",()=>setSoundStatus("音频没有加载成功，请刷新页面后重试","blocked"));
document.addEventListener("visibilitychange",()=>{if(document.hidden&&state.open&&!state.paused)togglePause(true);});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&state.open)closeTrainer();if(event.code==="Space"&&state.open){event.preventDefault();togglePause();}});
if("speechSynthesis" in window){refreshVoices();window.speechSynthesis.addEventListener?.("voiceschanged",refreshVoices);}
if(!("speechSynthesis" in window)&&!els.countCycle.canPlayType("audio/mpeg")&&!els.countCycle.canPlayType("audio/wav")){state.voice=false;els.voice.textContent="无语音";els.voice.disabled=true;els.voice.setAttribute("aria-pressed","false");}

makePlan();renderPlan();requestAnimationFrame(frame);
