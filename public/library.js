const CATEGORIES = [
  { key: "warm", label: "热身活动" },
  { key: "lower", label: "腿与臀" },
  { key: "push", label: "胸与手臂" },
  { key: "pull", label: "背与肩" },
  { key: "core", label: "核心与姿势" },
  { key: "ankle", label: "小腿与脚踝" },
  { key: "balance", label: "髋部与平衡" }
];

// Three overlapping intensity levels. Every level offers at least three moves per category.
const LEVELS = [
  { key: "strong", age: "40–55 岁", name: "进阶", hint: "徒手抗阻为主：深蹲、弓步、扶桌俯卧撑" },
  { key: "standard", age: "55–70 岁", name: "标准", hint: "站姿为主，扶稳练力量和平衡" },
  { key: "gentle", age: "70+", name: "温和", hint: "坐姿和扶椅为主，从小幅度开始" }
];

const LIBRARY = {
  warm: [
    {"id":"march","name":"坐姿踏步","purpose":"温和带动心肺，唤醒髋部和大腿。","steps":["坐在椅子前半部，身体坐直。","左右轮流抬脚，同时自然摆臂。"],"cue":"脚轻轻落地；抬到舒服的高度即可。","alternating":true,"levels":["standard","gentle"]},
    {"id":"seatedJack","name":"坐姿开合","purpose":"活动肩、髋和腿，让全身暖起来。","steps":["坐稳，双脚并拢，双手放在腿旁。","双脚向两旁点开，双臂抬到肩高，再收回。"],"cue":"手臂不必举过头；全程保持顺畅呼吸。","levels":["strong","standard","gentle"]},
    {"id":"reachTap","name":"坐姿前点脚","purpose":"活动髋、膝和肩部，温和提高身体活动量。","steps":["坐在椅子前半部，双脚踩稳。","一只脚向前点，同时双手向前送，再换边。"],"cue":"脚跟轻点地面；身体保持直，不向后倒。","alternating":true,"levels":["standard","gentle"]},
    {"id":"armSwing","name":"坐姿交替摆臂","purpose":"活动肩和手臂，温和进入运动状态。","steps":["坐稳，双脚踩地，双臂自然下垂。","一臂向前、一臂向后小幅摆动，再换边。"],"cue":"不甩手，不转腰；手臂不必抬到肩高。","alternating":true,"levels":["gentle"]},
    {"id":"shoulderLift","name":"坐姿提肩放松","purpose":"活动肩带，练习肩膀提起与放松的控制。","steps":["坐直，手臂放松，目视前方。","双肩轻提一小段，再放松回原位。"],"cue":"头不前伸；不耸到耳边，不憋气。","levels":["gentle"]},
    {"id":"standMarch","name":"原地踏步摆臂","purpose":"提高心率，唤醒髋部和大腿，为力量练习热身。","steps":["站直，双脚与髋同宽，手臂自然下垂。","左右轮流抬膝，对侧手臂向前摆。"],"cue":"落脚要轻；站不稳时改做坐姿踏步。","alternating":true,"levels":["strong","standard"]},
    {"id":"stepJack","name":"开合步","purpose":"不跳跃的开合动作，活动肩、髋和腿。","steps":["站直，双脚并拢，双手放在身体两旁。","一脚向旁迈开，双臂抬到肩高，收回后换边。"],"cue":"不跳，不甩臂；膝盖和脚尖朝同一方向。","alternating":true,"levels":["strong","standard"]}
  ],
  lower: [
    {"id":"stand","name":"坐站起身","purpose":"练大腿和臀部，帮助起床、如厕和上下车。","steps":["椅子靠墙，双脚踩稳，双手扶大腿。","身体稍向前，站起后有控制地坐回。"],"cue":"起身困难时用扶手椅，或改练坐姿伸膝。","levels":["standard","gentle"]},
    {"id":"miniSquat","name":"扶椅小蹲","purpose":"练大腿、臀部和髋部，增强站立力量。","steps":["双手扶稳椅背，双脚与髋同宽。","臀部向后坐一小段，再用腿站直。"],"cue":"背部保持长直；膝盖不向内夹。","levels":["standard","gentle"]},
    {"id":"extend","name":"坐姿伸膝","purpose":"练大腿前侧，帮助膝盖在站立和走路时稳定。","steps":["坐直，双手扶住椅子两侧。","一侧小腿向前伸，再慢慢放回换边。"],"cue":"膝盖不要锁死；不用甩腿或追求很高。","alternating":true,"levels":["gentle"]},
    {"id":"kneeOpen","name":"坐姿开膝","purpose":"活动髋部两侧，练习大腿向外打开的控制。","steps":["坐稳，双脚朝前，双手扶住椅边。","双膝和双脚一起向外打开，再收回。"],"cue":"脚跟轻放；膝盖朝向脚尖，不强行劈开。","levels":["gentle"]},
    {"id":"hamstringCurl","name":"扶稳屈膝","purpose":"练大腿后侧，帮助控制屈膝和迈步。","steps":["双手扶稳固定支撑，身体站直。","一侧膝盖弯曲，脚跟向后抬，再换边。"],"cue":"大腿不向前抬；支撑腿微弯，不塌腰。","alternating":true,"levels":["standard","gentle"]},
    {"id":"squat","name":"徒手深蹲","purpose":"练大腿和臀部，是起身、上楼和搬东西的基础力量。","steps":["椅子放在身后，双脚略宽于髋，脚尖稍朝外。","臀部向后坐到接近椅面，双臂前伸，再站直。"],"cue":"膝盖朝脚尖方向；背部长直，不坐下休息。","levels":["strong","standard"]},
    {"id":"reverseLunge","name":"后撤步蹲","purpose":"单腿练大腿和臀部，同时练平衡。","steps":["站直，双手叉腰，身旁放一把椅子备扶。","一脚向后退一步，两膝弯曲下沉，再收回换边。"],"cue":"前膝在脚踝上方；下沉深度量力，站不稳就扶椅。","alternating":true,"levels":["strong"]},
    {"id":"wallSlide","name":"靠墙滑蹲","purpose":"背靠墙练大腿前侧，膝盖受力更可控。","steps":["背靠墙站，双脚离墙约一脚半。","背贴墙向下滑到舒适深度，再推地站起。"],"cue":"膝盖朝脚尖方向；膝痛时减小深度。","levels":["strong","standard"]}
  ],
  push: [
    {"id":"wallPush","name":"墙面俯卧撑","purpose":"练胸、肩和手臂，让推门和撑起身体更有力。","steps":["面对墙站立，双手与肩同高。","弯手肘靠近墙，再把墙推远。"],"cue":"只弯手肘；头、背、髋始终保持一条直线。","levels":["strong","standard","gentle"]},
    {"id":"palmPress","name":"坐姿合掌推压","purpose":"温和练胸、肩和手臂，不需要器械。","steps":["坐直，双掌在胸前相对。","数到 2 时互相推压，数到 4 时放松。"],"cue":"肩膀放松，不耸肩；不要憋气。","levels":["standard","gentle"]},
    {"id":"forwardPress","name":"坐姿向前推","purpose":"活动胸肩和手臂，练习推送动作的控制。","steps":["坐直，双手握拳放在胸前。","双臂向前推到微弯，再有控制地收回。"],"cue":"手肘不要锁死；腰部不后仰。","levels":["gentle"]},
    {"id":"armRaise","name":"坐姿前抬臂","purpose":"活动肩前侧，练习向前拿取物品的控制。","steps":["坐直，手臂垂于两侧，掌心相对。","双臂向前抬至肩高以下，再放下。"],"cue":"手肘微弯；不耸肩，肩痛时减小幅度。","levels":["gentle"]},
    {"id":"bicepsCurl","name":"坐姿屈肘","purpose":"活动肘关节和手臂，练习拿取时的控制。","steps":["坐直，双臂贴身，先空手练习。","上臂保持不动，弯肘抬手，再放下。"],"cue":"不甩臂；增加负重前先确认适合自己。","levels":["gentle"]},
    {"id":"inclinePush","name":"扶桌俯卧撑","purpose":"比墙面俯卧撑负荷更大，练胸、肩和手臂后侧。","steps":["双手撑在牢固的桌边，双脚后退，身体成一条斜线。","弯手肘让胸口靠近桌边，再推回。"],"cue":"桌子必须不滑不翘；头、背、髋保持一条直线。","levels":["strong","standard"]},
    {"id":"chairDip","name":"椅子臂屈伸","purpose":"练手臂后侧和肩部，帮助撑扶手起身。","steps":["椅子靠墙放稳，坐在前沿，双手撑在臀部两侧椅边。","臀部移出椅面，弯手肘下降一小段，再撑起。"],"cue":"只下降一小段；肩膀前侧疼痛时不做此动作。","levels":["strong"]}
  ],
  pull: [
    {"id":"elbowPull","name":"坐姿拉肘夹背","purpose":"活动上背和肩后侧，练习保持挺拔姿势。","steps":["坐直，双臂向前伸，略低于肩膀。","弯手肘向后拉，轻轻夹背，再伸回。"],"cue":"肘保持在肩膀下方；腰部不要后仰。","levels":["standard","gentle"]},
    {"id":"towelPull","name":"坐姿毛巾拉开","purpose":"温和练肩背的持续用力，不需要大幅移动。","steps":["双手握毛巾两端，放在胸前。","手的位置基本不变，向两侧轻拉后放松。"],"cue":"手肘保持微弯；毛巾不会明显变长。","levels":["strong","standard","gentle"]},
    {"id":"lowRow","name":"坐姿低位划臂","purpose":"活动背部和手臂，练习肩胛骨的控制。","steps":["坐直，双手向前下方伸出。","弯手肘贴近身体向后拉，再慢慢伸回。"],"cue":"先向后拉肩胛骨；不要耸肩或挺肚子。","levels":["gentle"]},
    {"id":"chestOpen","name":"坐姿展胸开臂","purpose":"活动胸肩和上背，缓解含胸的姿势。","steps":["坐直，双臂放在身体两侧。","双臂向侧后方小幅打开，再放松收回。"],"cue":"肩膀向下放松；不挺肚子，不强拉肩。","levels":["gentle"]},
    {"id":"shoulderRotate","name":"坐姿肩部外旋","purpose":"活动肩后侧，练习肩关节向外转动。","steps":["坐直，上臂贴身，手肘弯约九十度。","手肘留在原位，双手向两侧打开再收回。"],"cue":"只在舒适范围活动；不夹痛肩膀。","levels":["standard","gentle"]},
    {"id":"hingeRow","name":"俯身划臂","purpose":"练上背和手臂后拉，帮助保持挺拔姿势。","steps":["双脚与髋同宽，膝微弯，从髋部前倾约四十度。","手臂下垂，屈肘向后拉到身侧，再慢慢放下。"],"cue":"背部长直不弓；可双手各握一瓶水增加阻力。","levels":["strong","standard"]},
    {"id":"towelPulldown","name":"毛巾下拉","purpose":"练背部两侧和肩胛下沉，帮助举手取物。","steps":["坐直，双手宽握毛巾举过头顶，把毛巾拉紧。","保持向两侧拉紧，手肘向下拉到肩高，再举回。"],"cue":"肩膀下沉不耸肩；毛巾在头前方，不压到脖子后面。","levels":["strong","standard"]}
  ],
  core: [
    {"id":"crossMarch","name":"坐姿对侧触膝","purpose":"练腹部、髋部和身体协调。","steps":["坐直，右脚抬起，同时左手靠近右膝。","放回后换边，身体不要后倒。"],"cue":"动作来自抬膝和轻微转身，不要猛拉颈部。","alternating":true,"levels":["standard","gentle"]},
    {"id":"kneePress","name":"坐姿手膝相推","purpose":"温和唤醒腹部深层肌肉，帮助躯干稳定。","steps":["坐直，抬起一侧膝盖，双手扶住膝上方。","手向下、膝向上轻轻相推，再放回换边。"],"cue":"只用三四成力；背部保持直，不憋气。","alternating":true,"levels":["standard","gentle"]},
    {"id":"sideReach","name":"坐姿侧向伸手","purpose":"练躯干两侧和姿势控制，帮助弯身取物。","steps":["坐稳，双脚踩地，一只手扶住椅边。","另一只手向身体侧下方伸，再回正换边。"],"cue":"幅度要小；臀部两侧始终压在椅面。","alternating":true,"levels":["gentle"]},
    {"id":"hipHinge","name":"坐姿小幅前倾","purpose":"练习髋部折叠与躯干控制，为起身做准备。","steps":["坐稳，双脚踩地，双手放在大腿上。","背部保持长直，从髋部稍前倾再坐直。"],"cue":"不是弯腰低头；臀部不离椅，幅度要小。","levels":["gentle"]},
    {"id":"diagonalReach","name":"坐姿对角伸手","purpose":"练坐姿重心控制和手眼协调。","steps":["坐稳，一只手扶住椅边。","另一手向对侧膝前伸少许，收回后换边。"],"cue":"双脚踩稳，臀部不离椅面，不追求伸远。","alternating":true,"levels":["gentle"]},
    {"id":"standCross","name":"站姿对侧提膝","purpose":"站着练腹部和髋部，同时练单脚平衡。","steps":["站直，双脚与髋同宽，身旁放一把椅子备扶。","抬起一侧膝盖，对侧手向膝盖靠近，再放下换边。"],"cue":"躯干稍前倾即可，不弯腰驼背；站不稳就扶椅。","alternating":true,"levels":["strong","standard"]},
    {"id":"tableKneeDrive","name":"扶桌提膝","purpose":"斜撑姿势下练腹部和肩部稳定。","steps":["双手撑在牢固的桌边，双脚后退，身体成一条斜线。","一侧膝盖向胸口提起，放回后换边。"],"cue":"髋部不塌不翘；动作要慢，保持呼吸。","alternating":true,"levels":["strong"]},
    {"id":"goodMorning","name":"站姿髋铰链","purpose":"练臀部、大腿后侧和背部，学会弯腰搬物的正确姿势。","steps":["站直，双脚与髋同宽，双手交叉放在胸前。","膝微弯，臀部向后推，身体前倾，再用臀部发力站直。"],"cue":"背部始终长直；感觉大腿后侧拉紧就停。","levels":["strong","standard"]}
  ],
  ankle: [
    {"id":"heel","name":"扶椅踮脚","purpose":"练小腿和脚踝，帮助迈步和站稳。","steps":["双手扶稳椅背，双脚朝前。","脚跟抬起，再有控制地落地。"],"cue":"脚趾始终着地；膝盖保持柔软，不锁死。","levels":["strong","standard","gentle"]},
    {"id":"toeLift","name":"坐姿抬脚尖","purpose":"练小腿前侧和脚踝，帮助减少走路绊脚。","steps":["坐稳，双脚平放，膝盖约九十度。","脚跟不动，抬起脚尖，再慢慢放下。"],"cue":"只动脚踝；不要抬起整条腿。","levels":["gentle"]},
    {"id":"seatedHeel","name":"坐姿提脚跟","purpose":"练小腿后侧和脚踝，帮助迈步时向前推地。","steps":["坐稳，双脚平放，脚尖朝前。","脚尖不动，抬起脚跟，再慢慢落下。"],"cue":"膝盖保持在脚尖上方；不要让脚踝向外倒。","levels":["standard","gentle"]},
    {"id":"anklePump","name":"坐姿伸腿勾脚","purpose":"活动脚踝和小腿前侧，练习伸腿勾脚。","steps":["坐稳扶住椅边，一侧小腿向前伸。","同时脚尖向上勾，放回后换另一侧。"],"cue":"不用甩腿，膝盖不锁死；只伸到舒服的位置。","alternating":true,"levels":["gentle"]},
    {"id":"heelToe","name":"坐姿脚尖脚跟交替","purpose":"交替活动小腿前后侧，练习脚踝控制。","steps":["坐稳，双脚朝前，放在膝盖下方。","先抬脚尖，再换抬脚跟，交替进行。"],"cue":"脚踝不向两侧倒；身体不前后摇晃。","levels":["standard","gentle"]},
    {"id":"singleCalf","name":"单腿提踵","purpose":"单腿练小腿，负荷约是双脚踮脚的两倍。","steps":["双手扶稳椅背，一脚抬离地面。","支撑脚踮起脚跟，再慢慢落下，换脚继续。"],"cue":"脚踝不向外倒；落下要慢，不要砸地。","alternating":true,"levels":["strong"]},
    {"id":"wallToe","name":"靠墙抬脚尖","purpose":"站着练小腿前侧，帮助走路抬脚、减少绊倒。","steps":["背靠墙站，脚跟离墙约一脚长。","脚跟不动，抬起脚尖，再慢慢放下。"],"cue":"臀部和背部贴墙；只动脚踝。","levels":["strong","standard"]}
  ],
  balance: [
    {"id":"side","name":"扶椅侧抬腿","purpose":"练髋部两侧和单脚稳定，帮助控制步伐。","steps":["双手扶稳椅背，双脚朝前。","一条腿向旁抬一小段，放回后换边。"],"cue":"抬起腿保持直；支撑腿微弯，不锁膝。","alternating":true,"levels":["strong","standard","gentle"]},
    {"id":"weightShift","name":"扶椅左右移重心","purpose":"练脚踝、髋部和平衡反应，帮助转身与迈步。","steps":["双手轻扶椅背，双脚比髋稍宽。","把重心移到一侧，再回中间换边。"],"cue":"两脚不离地；承重侧膝盖保持微弯。","alternating":true,"levels":["gentle"]},
    {"id":"backLeg","name":"扶椅向后抬腿","purpose":"练臀部和髋后侧，帮助站稳和迈步。","steps":["双手扶稳椅背，身体站直。","一条腿保持直，向后抬一小段，再换边。"],"cue":"不要前倾或塌腰；支撑腿微弯。","alternating":true,"levels":["standard","gentle"]},
    {"id":"forwardTap","name":"扶稳向前点步","purpose":"练习抬脚落脚与站立重心的控制。","steps":["双手扶稳固定支撑，双脚与髋同宽。","一脚向前点一小步，收回站稳再换边。"],"cue":"不跨大步，不松手；站立不稳时先不做。","alternating":true,"levels":["standard","gentle"]},
    {"id":"sideTap","name":"扶稳侧向点步","purpose":"练髋部侧向控制和脚步落点的准确性。","steps":["双手扶稳固定支撑，身体保持朝前。","一脚向旁点一小步，收回站稳再换边。"],"cue":"脚尖朝前，不交叉双腿，不把身体甩向旁边。","alternating":true,"levels":["standard","gentle"]},
    {"id":"singleLegStand","name":"单腿站立提膝","purpose":"练单腿站稳，帮助上下台阶和站着穿裤子。","steps":["双手轻扶椅背，双脚与髋同宽。","重心移到一侧，另一侧膝盖抬起停稳，再放下换边。"],"cue":"支撑腿微弯；能站稳时，只用指尖轻触椅背。","alternating":true,"levels":["strong","standard"]},
    {"id":"singleLegHinge","name":"单腿前倾平衡","purpose":"练支撑腿的臀部和平衡控制。","steps":["双手扶稳椅背，身体站直。","身体前倾，同时一条腿伸直向后抬，再收回换边。"],"cue":"身体和后腿成一条线；髋部朝下，不向一侧翻开。","alternating":true,"levels":["strong"]}
  ]
};
