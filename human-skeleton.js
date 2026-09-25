(function (global) {
  const DEG = Math.PI / 180;

  function deg(value) {
    return value * DEG;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function pointFrom(origin, angle, length) {
    return {
      x: origin.x + Math.cos(angle) * length,
      y: origin.y + Math.sin(angle) * length,
    };
  }

  function clonePose(pose) {
    return { ...pose };
  }

  const NEUTRAL_POSES = {
    front: {
      rootX: 0,
      rootY: 0,
      torso: deg(-90),
      upperArmL: deg(118),
      lowerArmL: deg(6),
      upperArmR: deg(62),
      lowerArmR: deg(-6),
      upperLegL: deg(92),
      lowerLegL: deg(-6),
      footL: deg(6),
      upperLegR: deg(88),
      lowerLegR: deg(6),
      footR: deg(2),
    },
    side: {
      hipX: 0,
      hipY: 0,
      torso: deg(-92),
      upperArmFront: deg(78),
      lowerArmFront: deg(10),
      upperArmBack: deg(110),
      lowerArmBack: deg(-6),
      upperLegFront: deg(92),
      lowerLegFront: deg(-4),
      footFront: deg(2),
      upperLegBack: deg(86),
      lowerLegBack: deg(6),
      footBack: deg(-2),
    },
    burpee: {
      rootX: 0,
      rootY: 0,
      torso: deg(-92),
      upperArmFront: deg(76),
      lowerArmFront: deg(8),
      upperArmBack: deg(104),
      lowerArmBack: deg(-2),
      upperLegFront: deg(92),
      lowerLegFront: deg(-4),
      footFront: deg(0),
      upperLegBack: deg(88),
      lowerLegBack: deg(2),
      footBack: deg(-2),
    },
    hang: {
      rootX: 0,
      rootY: 0,
      torso: deg(90),
      upperArmL: deg(-92),
      lowerArmL: deg(0),
      upperArmR: deg(-88),
      lowerArmR: deg(0),
      upperLegL: deg(96),
      lowerLegL: deg(8),
      footL: deg(2),
      upperLegR: deg(96),
      lowerLegR: deg(8),
      footR: deg(-2),
    },
    support: {
      rootX: 0,
      rootY: 0,
      torso: deg(-92),
      upperArmL: deg(92),
      lowerArmL: deg(0),
      upperArmR: deg(88),
      lowerArmR: deg(0),
      upperLegL: deg(98),
      lowerLegL: deg(-6),
      footL: deg(2),
      upperLegR: deg(94),
      lowerLegR: deg(-2),
      footR: deg(-2),
    },
    seated: {
      rootX: 0,
      rootY: 0,
      torso: deg(-118),
      shoulderTilt: deg(0),
      upperArmL: deg(176),
      lowerArmL: deg(6),
      upperArmR: deg(4),
      lowerArmR: deg(-6),
      thighL: deg(18),
      shinL: deg(72),
      footL: deg(2),
      thighR: deg(6),
      shinR: deg(78),
      footR: deg(-2),
    },
    quadruped: {
      rootX: 0,
      rootY: 0,
      neck: deg(-12),
      spineFront: deg(6),
      spineBack: deg(2),
      frontLeg: deg(102),
      frontShin: deg(-24),
      rearLeg: deg(82),
      rearShin: deg(18),
      reachArm: deg(94),
      reachForearm: deg(-20),
      reachLeg: deg(94),
      reachShin: deg(4),
    },
    supine: {
      rootX: 0,
      rootY: 0,
      torso: deg(0),
      pelvisLift: 0,
      arm: deg(-130),
      forearm: deg(6),
      thigh: deg(44),
      shin: deg(52),
      foot: deg(4),
      reachArm: deg(-130),
      reachForearm: deg(0),
      reachLeg: deg(44),
      reachShin: deg(52),
      reachFoot: deg(4),
    },
    model3d: {
      rootX: 0,
      pelvisY: 1.02,
      rootZ: 0,
      pelvisYaw: 0,
      torsoPitch: deg(2),
      torsoYaw: 0,
      torsoRoll: 0,
      headPitch: 0,
      headYaw: 0,
      shoulderPitchL: deg(10),
      shoulderYawL: deg(10),
      elbowFlexL: deg(8),
      shoulderPitchR: deg(10),
      shoulderYawR: deg(10),
      elbowFlexR: deg(8),
      hipPitchL: deg(6),
      hipYawL: deg(0),
      kneeFlexL: deg(8),
      ankleFlexL: 0,
      hipPitchR: deg(6),
      hipYawR: deg(0),
      kneeFlexR: deg(8),
      ankleFlexR: 0,
      footLX: -0.19,
      footLY: 0,
      footLZ: 0.05,
      footRX: 0.19,
      footRY: 0,
      footRZ: -0.05,
      handContactL: 0,
      handLX: -0.28,
      handLY: 0.88,
      handLZ: 0.18,
      handContactR: 0,
      handRX: 0.28,
      handRY: 0.88,
      handRZ: 0.18,
    },
  };

  // These ranges intentionally stay inside common fitness-demo ROM, not
  // clinical max ROM. They keep knees, spine and hip abduction in plausible
  // directions instead of allowing visually impossible inversion.
  const JOINT_LIMITS = {
    front: {
      rootX: [-18, 18],
      rootY: [-16, 12],
      torso: [deg(-108), deg(-72)],
      upperArmL: [deg(148), deg(300)],
      lowerArmL: [deg(-28), deg(150)],
      upperArmR: [deg(-120), deg(152)],
      lowerArmR: [deg(-150), deg(28)],
      upperLegL: [deg(45), deg(135)],
      lowerLegL: [deg(-8), deg(145)],
      footL: [deg(-18), deg(18)],
      upperLegR: [deg(45), deg(135)],
      lowerLegR: [deg(-8), deg(145)],
      footR: [deg(-18), deg(18)],
    },
    side: {
      hipX: [-12, 12],
      hipY: [-16, 18],
      torso: [deg(-138), deg(-6)],
      upperArmFront: [deg(-32), deg(300)],
      lowerArmFront: [deg(-28), deg(150)],
      upperArmBack: [deg(-12), deg(300)],
      lowerArmBack: [deg(-28), deg(150)],
      upperLegFront: [deg(18), deg(125)],
      lowerLegFront: [deg(-8), deg(145)],
      footFront: [deg(-18), deg(18)],
      upperLegBack: [deg(18), deg(125)],
      lowerLegBack: [deg(-8), deg(145)],
      footBack: [deg(-18), deg(18)],
    },
    burpee: {
      rootX: [-26, 26],
      rootY: [-18, 18],
      torso: [deg(-112), deg(-4)],
      upperArmFront: [deg(40), deg(280)],
      lowerArmFront: [deg(-20), deg(40)],
      upperArmBack: [deg(40), deg(280)],
      lowerArmBack: [deg(-20), deg(40)],
      upperLegFront: [deg(24), deg(170)],
      lowerLegFront: [deg(-10), deg(138)],
      footFront: [deg(-18), deg(18)],
      upperLegBack: [deg(24), deg(170)],
      lowerLegBack: [deg(-10), deg(138)],
      footBack: [deg(-18), deg(18)],
    },
    hang: {
      rootX: [-18, 18],
      rootY: [-18, 18],
      torso: [deg(64), deg(114)],
      upperArmL: [deg(-148), deg(-54)],
      lowerArmL: [deg(-148), deg(18)],
      upperArmR: [deg(-126), deg(-34)],
      lowerArmR: [deg(-18), deg(148)],
      upperLegL: [deg(58), deg(132)],
      lowerLegL: [deg(-8), deg(96)],
      footL: [deg(-18), deg(18)],
      upperLegR: [deg(58), deg(132)],
      lowerLegR: [deg(-8), deg(96)],
      footR: [deg(-18), deg(18)],
    },
    support: {
      rootX: [-18, 18],
      rootY: [-18, 18],
      torso: [deg(-112), deg(-72)],
      upperArmL: [deg(70), deg(118)],
      lowerArmL: [deg(-110), deg(12)],
      upperArmR: [deg(62), deg(110)],
      lowerArmR: [deg(-12), deg(110)],
      upperLegL: [deg(42), deg(118)],
      lowerLegL: [deg(-8), deg(112)],
      footL: [deg(-18), deg(18)],
      upperLegR: [deg(42), deg(118)],
      lowerLegR: [deg(-8), deg(112)],
      footR: [deg(-18), deg(18)],
    },
    seated: {
      rootX: [-20, 20],
      rootY: [-12, 16],
      torso: [deg(-148), deg(-92)],
      shoulderTilt: [deg(-24), deg(24)],
      upperArmL: [deg(124), deg(236)],
      lowerArmL: [deg(-24), deg(132)],
      upperArmR: [deg(-56), deg(56)],
      lowerArmR: [deg(-132), deg(24)],
      thighL: [deg(-8), deg(42)],
      shinL: [deg(42), deg(108)],
      footL: [deg(-18), deg(18)],
      thighR: [deg(-8), deg(42)],
      shinR: [deg(42), deg(108)],
      footR: [deg(-18), deg(18)],
    },
    quadruped: {
      rootX: [-12, 12],
      rootY: [-10, 12],
      neck: [deg(-40), deg(30)],
      spineFront: [deg(-24), deg(24)],
      spineBack: [deg(-24), deg(24)],
      frontLeg: [deg(74), deg(126)],
      frontShin: [deg(-35), deg(35)],
      rearLeg: [deg(58), deg(118)],
      rearShin: [deg(-8), deg(35)],
      reachArm: [deg(-18), deg(140)],
      reachForearm: [deg(-25), deg(35)],
      reachLeg: [deg(-24), deg(118)],
      reachShin: [deg(-12), deg(24)],
    },
    supine: {
      rootX: [-18, 18],
      rootY: [-16, 18],
      torso: [deg(-24), deg(12)],
      pelvisLift: [-28, 8],
      arm: [deg(-166), deg(-24)],
      forearm: [deg(-22), deg(44)],
      thigh: [deg(4), deg(82)],
      shin: [deg(-12), deg(84)],
      foot: [deg(-18), deg(18)],
      reachArm: [deg(-166), deg(-20)],
      reachForearm: [deg(-18), deg(44)],
      reachLeg: [deg(-4), deg(82)],
      reachShin: [deg(-16), deg(84)],
      reachFoot: [deg(-18), deg(18)],
    },
    model3d: {
      rootX: [-0.7, 0.7],
      pelvisY: [0.28, 1.42],
      rootZ: [-0.8, 1.4],
      pelvisYaw: [deg(-70), deg(70)],
      torsoPitch: [deg(-85), deg(85)],
      torsoYaw: [deg(-70), deg(70)],
      torsoRoll: [deg(-40), deg(40)],
      headPitch: [deg(-40), deg(40)],
      headYaw: [deg(-55), deg(55)],
      shoulderPitchL: [deg(-170), deg(170)],
      shoulderYawL: [deg(-120), deg(140)],
      elbowFlexL: [deg(0), deg(156)],
      shoulderPitchR: [deg(-170), deg(170)],
      shoulderYawR: [deg(-120), deg(140)],
      elbowFlexR: [deg(0), deg(156)],
      hipPitchL: [deg(-42), deg(145)],
      hipYawL: [deg(-62), deg(62)],
      kneeFlexL: [deg(0), deg(148)],
      ankleFlexL: [deg(-30), deg(36)],
      hipPitchR: [deg(-42), deg(145)],
      hipYawR: [deg(-62), deg(62)],
      kneeFlexR: [deg(0), deg(148)],
      ankleFlexR: [deg(-30), deg(36)],
      footLX: [-0.9, 0.9],
      footLY: [-0.02, 0.28],
      footLZ: [-0.4, 1.6],
      footRX: [-0.9, 0.9],
      footRY: [-0.02, 0.28],
      footRZ: [-0.4, 1.6],
      handContactL: [0, 1],
      handLX: [-1.1, 1.1],
      handLY: [0.02, 2.1],
      handLZ: [-0.8, 1.7],
      handContactR: [0, 1],
      handRX: [-1.1, 1.1],
      handRY: [0.02, 2.1],
      handRZ: [-0.8, 1.7],
    },
  };

  function sanitizePose(view, rawPose = {}) {
    const neutral = NEUTRAL_POSES[view];
    const limits = JOINT_LIMITS[view];
    if (!neutral || !limits) {
      throw new Error("Unknown view: " + view);
    }

    const pose = { ...neutral, ...rawPose };
    Object.keys(limits).forEach((key) => {
      const [min, max] = limits[key];
      pose[key] = clamp(pose[key], min, max);
    });

    if (view === "front") {
      pose.lowerLegL = Math.max(pose.lowerLegL, deg(-8));
      pose.lowerLegR = Math.max(pose.lowerLegR, deg(-8));
      pose.upperLegL = clamp(pose.upperLegL, deg(45), deg(135));
      pose.upperLegR = clamp(pose.upperLegR, deg(45), deg(135));
    }

    if (view === "side") {
      pose.lowerLegFront = Math.max(pose.lowerLegFront, deg(-8));
      pose.lowerLegBack = Math.max(pose.lowerLegBack, deg(-8));
      pose.torso = clamp(pose.torso, deg(-138), deg(-6));
    }

    if (view === "burpee") {
      pose.lowerLegFront = Math.max(pose.lowerLegFront, deg(-10));
      pose.lowerLegBack = Math.max(pose.lowerLegBack, deg(-10));
      pose.torso = clamp(pose.torso, deg(-112), deg(-4));
      pose.upperLegFront = clamp(pose.upperLegFront, deg(24), deg(170));
      pose.upperLegBack = clamp(pose.upperLegBack, deg(24), deg(170));
    }

    if (view === "hang") {
      pose.lowerLegL = Math.max(pose.lowerLegL, deg(-8));
      pose.lowerLegR = Math.max(pose.lowerLegR, deg(-8));
      pose.torso = clamp(pose.torso, deg(64), deg(114));
    }

    if (view === "support") {
      pose.lowerLegL = Math.max(pose.lowerLegL, deg(-8));
      pose.lowerLegR = Math.max(pose.lowerLegR, deg(-8));
      pose.torso = clamp(pose.torso, deg(-112), deg(-72));
    }

    if (view === "seated") {
      pose.torso = clamp(pose.torso, deg(-148), deg(-92));
      pose.shinL = clamp(pose.shinL, deg(42), deg(108));
      pose.shinR = clamp(pose.shinR, deg(42), deg(108));
    }

    if (view === "quadruped") {
      const spineArc = pose.spineFront + pose.spineBack;
      if (spineArc > deg(28)) {
        const trim = (spineArc - deg(28)) * 0.5;
        pose.spineFront -= trim;
        pose.spineBack -= trim;
      }
      if (spineArc < deg(-28)) {
        const trim = (deg(-28) - spineArc) * 0.5;
        pose.spineFront += trim;
        pose.spineBack += trim;
      }
    }

    if (view === "supine") {
      pose.pelvisLift = Math.min(pose.pelvisLift, deg(0));
    }

    if (view === "model3d") {
      pose.kneeFlexL = Math.max(pose.kneeFlexL, 0);
      pose.kneeFlexR = Math.max(pose.kneeFlexR, 0);
      pose.elbowFlexL = Math.max(pose.elbowFlexL, 0);
      pose.elbowFlexR = Math.max(pose.elbowFlexR, 0);
      pose.pelvisY = Math.max(pose.pelvisY, 0.28);
      pose.handContactL = pose.handContactL >= 0.5 ? 1 : 0;
      pose.handContactR = pose.handContactR >= 0.5 ? 1 : 0;
    }

    return pose;
  }

  function mixPose(view, from, to, t) {
    const mixed = {};
    const keys = new Set([...Object.keys(from || {}), ...Object.keys(to || {})]);
    keys.forEach((key) => {
      mixed[key] = lerp(from[key] || 0, to[key] || 0, t);
    });
    return sanitizePose(view, mixed);
  }

  function createScene(definition) {
    if (!definition || !definition.view || !Array.isArray(definition.poses) || !definition.poses.length) {
      throw new Error("Invalid scene definition");
    }

    return {
      ...definition,
      id: definition.id || null,
      view: definition.view,
      poses: definition.poses.map((pose) => sanitizePose(definition.view, pose)),
    };
  }

  const SCENE_REGISTRY = new Map();

  function registerScene(id, definition) {
    const scene = createScene({ ...definition, id });
    SCENE_REGISTRY.set(id, scene);
    return scene;
  }

  function getScene(id) {
    return SCENE_REGISTRY.get(id) || null;
  }

  function listScenes() {
    return Array.from(SCENE_REGISTRY.keys());
  }

  function getNeutralPose(view) {
    return clonePose(NEUTRAL_POSES[view] || {});
  }

  function getJointLimits(view) {
    const limits = JOINT_LIMITS[view] || {};
    return Object.fromEntries(
      Object.entries(limits).map(([key, value]) => [key, [...value]])
    );
  }

  function sampleScene(id, progress) {
    const scene = getScene(id);
    if (!scene) return null;
    if (scene.poses.length === 1) return clonePose(scene.poses[0]);

    const steps = scene.poses.length - 1;
    const scaled = clamp(progress, 0, 1) * steps;
    const index = Math.min(steps - 1, Math.floor(scaled));
    const localT = easeInOut(scaled - index);
    return mixPose(scene.view, scene.poses[index], scene.poses[index + 1], localT);
  }

  function solveFront(pose, width, height, scale) {
    const pelvis = {
      x: width * 0.5 + pose.rootX * scale,
      y: height * 0.7 + pose.rootY * scale,
    };
    const shoulderCenter = pointFrom(pelvis, pose.torso, 78 * scale);
    const head = pointFrom(shoulderCenter, pose.torso, 26 * scale);
    const shoulderSpread = 24 * scale;
    const hipSpread = 18 * scale;
    const shoulderL = { x: shoulderCenter.x - shoulderSpread, y: shoulderCenter.y + 4 * scale };
    const shoulderR = { x: shoulderCenter.x + shoulderSpread, y: shoulderCenter.y + 4 * scale };
    const hipL = { x: pelvis.x - hipSpread, y: pelvis.y };
    const hipR = { x: pelvis.x + hipSpread, y: pelvis.y };
    const elbowL = pointFrom(shoulderL, pose.upperArmL, 38 * scale);
    const handL = pointFrom(elbowL, pose.upperArmL + pose.lowerArmL, 34 * scale);
    const elbowR = pointFrom(shoulderR, pose.upperArmR, 38 * scale);
    const handR = pointFrom(elbowR, pose.upperArmR + pose.lowerArmR, 34 * scale);
    const kneeL = pointFrom(hipL, pose.upperLegL, 48 * scale);
    const ankleL = pointFrom(kneeL, pose.upperLegL + pose.lowerLegL, 46 * scale);
    const kneeR = pointFrom(hipR, pose.upperLegR, 48 * scale);
    const ankleR = pointFrom(kneeR, pose.upperLegR + pose.lowerLegR, 46 * scale);

    return {
      view: "front",
      scale,
      pose,
      points: {
        pelvis,
        shoulderCenter,
        head,
        shoulderL,
        shoulderR,
        hipL,
        hipR,
        elbowL,
        handL,
        elbowR,
        handR,
        kneeL,
        ankleL,
        kneeR,
        ankleR,
      },
      angles: {
        footL: pose.footL,
        footR: pose.footR,
      },
    };
  }

  function solveSide(pose, width, height, scale) {
    const hip = {
      x: width * 0.5 + pose.hipX * scale,
      y: height * 0.7 + pose.hipY * scale,
    };
    const shoulder = pointFrom(hip, pose.torso, 84 * scale);
    const head = pointFrom(shoulder, pose.torso, 24 * scale);
    const frontShoulder = { x: shoulder.x + 4 * scale, y: shoulder.y + 4 * scale };
    const backShoulder = { x: shoulder.x - 10 * scale, y: shoulder.y + 2 * scale };
    const frontHip = { x: hip.x + 6 * scale, y: hip.y };
    const backHip = { x: hip.x - 12 * scale, y: hip.y - 2 * scale };
    const elbowFront = pointFrom(frontShoulder, pose.upperArmFront, 36 * scale);
    const handFront = pointFrom(elbowFront, pose.upperArmFront + pose.lowerArmFront, 30 * scale);
    const elbowBack = pointFrom(backShoulder, pose.upperArmBack, 34 * scale);
    const handBack = pointFrom(elbowBack, pose.upperArmBack + pose.lowerArmBack, 28 * scale);
    const kneeFront = pointFrom(frontHip, pose.upperLegFront, 54 * scale);
    const ankleFront = pointFrom(kneeFront, pose.upperLegFront + pose.lowerLegFront, 48 * scale);
    const kneeBack = pointFrom(backHip, pose.upperLegBack, 50 * scale);
    const ankleBack = pointFrom(kneeBack, pose.upperLegBack + pose.lowerLegBack, 44 * scale);

    return {
      view: "side",
      scale,
      pose,
      points: {
        hip,
        shoulder,
        head,
        frontShoulder,
        backShoulder,
        frontHip,
        backHip,
        elbowFront,
        handFront,
        elbowBack,
        handBack,
        kneeFront,
        ankleFront,
        kneeBack,
        ankleBack,
      },
      angles: {
        footFront: pose.footFront,
        footBack: pose.footBack,
      },
    };
  }

  function solveQuadruped(pose, width, height, scale) {
    const shoulder = {
      x: width * 0.36 + pose.rootX * scale,
      y: height * 0.54 + pose.rootY * scale,
    };
    const spineMid = pointFrom(shoulder, pose.spineFront, 68 * scale);
    const hip = pointFrom(spineMid, pose.spineBack, 52 * scale);
    const headBase = pointFrom(shoulder, pose.neck, 34 * scale);
    const nose = pointFrom(headBase, pose.neck, 22 * scale);
    const frontElbow = pointFrom(shoulder, pose.frontLeg, 34 * scale);
    const frontPaw = pointFrom(frontElbow, pose.frontLeg + pose.frontShin, 34 * scale);
    const rearKnee = pointFrom(hip, pose.rearLeg, 36 * scale);
    const rearPaw = pointFrom(rearKnee, pose.rearLeg + pose.rearShin, 34 * scale);
    const reachShoulder = { x: shoulder.x + 2 * scale, y: shoulder.y + 4 * scale };
    const reachHip = { x: hip.x - 2 * scale, y: hip.y + 2 * scale };
    const reachElbow = pointFrom(reachShoulder, pose.reachArm, 42 * scale);
    const reachHand = pointFrom(reachElbow, pose.reachArm + pose.reachForearm, 36 * scale);
    const reachKnee = pointFrom(reachHip, pose.reachLeg, 42 * scale);
    const reachFoot = pointFrom(reachKnee, pose.reachLeg + pose.reachShin, 38 * scale);

    return {
      view: "quadruped",
      scale,
      pose,
      points: {
        shoulder,
        spineMid,
        hip,
        headBase,
        nose,
        frontElbow,
        frontPaw,
        rearKnee,
        rearPaw,
        reachShoulder,
        reachHip,
        reachElbow,
        reachHand,
        reachKnee,
        reachFoot,
      },
    };
  }

  function solveSupine(pose, width, height, scale) {
    const shoulder = {
      x: width * 0.32 + pose.rootX * scale,
      y: height * 0.62 + pose.rootY * scale,
    };
    const hip = pointFrom(shoulder, pose.torso, 88 * scale);
    const head = pointFrom(shoulder, deg(180), 26 * scale);
    const elbow = pointFrom(shoulder, pose.arm, 34 * scale);
    const hand = pointFrom(elbow, pose.arm + pose.forearm, 28 * scale);
    const knee = pointFrom(hip, pose.thigh, 46 * scale);
    const ankle = pointFrom(knee, pose.thigh + pose.shin, 42 * scale);
    const reachShoulder = { x: shoulder.x + 4 * scale, y: shoulder.y - 6 * scale };
    const reachHip = { x: hip.x + 2 * scale, y: hip.y - pose.pelvisLift * 0.18 };
    const reachElbow = pointFrom(reachShoulder, pose.reachArm, 40 * scale);
    const reachHand = pointFrom(reachElbow, pose.reachArm + pose.reachForearm, 34 * scale);
    const reachKnee = pointFrom(reachHip, pose.reachLeg, 48 * scale);
    const reachFoot = pointFrom(reachKnee, pose.reachLeg + pose.reachShin, 42 * scale);

    return {
      view: "supine",
      scale,
      pose,
      points: {
        shoulder,
        hip,
        head,
        elbow,
        hand,
        knee,
        ankle,
        reachShoulder,
        reachHip,
        reachElbow,
        reachHand,
        reachKnee,
        reachFoot,
      },
      angles: {
        foot: pose.foot,
        reachFoot: pose.reachFoot,
      },
    };
  }

  function solveBurpee(pose, width, height, scale) {
    const hip = {
      x: width * 0.46 + pose.rootX * scale,
      y: height * 0.69 + pose.rootY * scale,
    };
    const shoulder = pointFrom(hip, pose.torso, 82 * scale);
    const head = pointFrom(shoulder, pose.torso, 24 * scale);

    const frontShoulder = { x: shoulder.x + 5 * scale, y: shoulder.y + 4 * scale };
    const backShoulder = { x: shoulder.x - 8 * scale, y: shoulder.y + 2 * scale };
    const frontHip = { x: hip.x + 5 * scale, y: hip.y };
    const backHip = { x: hip.x - 7 * scale, y: hip.y - 2 * scale };

    const elbowFront = pointFrom(frontShoulder, pose.upperArmFront, 38 * scale);
    const handFront = pointFrom(elbowFront, pose.upperArmFront + pose.lowerArmFront, 34 * scale);
    const elbowBack = pointFrom(backShoulder, pose.upperArmBack, 36 * scale);
    const handBack = pointFrom(elbowBack, pose.upperArmBack + pose.lowerArmBack, 32 * scale);

    const kneeFront = pointFrom(frontHip, pose.upperLegFront, 52 * scale);
    const ankleFront = pointFrom(kneeFront, pose.upperLegFront + pose.lowerLegFront, 48 * scale);
    const kneeBack = pointFrom(backHip, pose.upperLegBack, 50 * scale);
    const ankleBack = pointFrom(kneeBack, pose.upperLegBack + pose.lowerLegBack, 46 * scale);

    return {
      view: "burpee",
      scale,
      pose,
      points: {
        hip,
        shoulder,
        head,
        frontShoulder,
        backShoulder,
        frontHip,
        backHip,
        elbowFront,
        handFront,
        elbowBack,
        handBack,
        kneeFront,
        ankleFront,
        kneeBack,
        ankleBack,
      },
      angles: {
        footFront: pose.footFront,
        footBack: pose.footBack,
      },
    };
  }

  function solveHang(pose, width, height, scale) {
    const shoulderCenter = {
      x: width * 0.5 + pose.rootX * scale,
      y: height * 0.22 + pose.rootY * scale,
    };
    const pelvis = pointFrom(shoulderCenter, pose.torso, 86 * scale);
    const head = pointFrom(shoulderCenter, pose.torso + Math.PI, 24 * scale);
    const shoulderSpread = 22 * scale;
    const hipSpread = 16 * scale;
    const shoulderL = { x: shoulderCenter.x - shoulderSpread, y: shoulderCenter.y + 3 * scale };
    const shoulderR = { x: shoulderCenter.x + shoulderSpread, y: shoulderCenter.y + 3 * scale };
    const hipL = { x: pelvis.x - hipSpread, y: pelvis.y };
    const hipR = { x: pelvis.x + hipSpread, y: pelvis.y };
    const elbowL = pointFrom(shoulderL, pose.upperArmL, 42 * scale);
    const handL = pointFrom(elbowL, pose.upperArmL + pose.lowerArmL, 40 * scale);
    const elbowR = pointFrom(shoulderR, pose.upperArmR, 42 * scale);
    const handR = pointFrom(elbowR, pose.upperArmR + pose.lowerArmR, 40 * scale);
    const kneeL = pointFrom(hipL, pose.upperLegL, 50 * scale);
    const ankleL = pointFrom(kneeL, pose.upperLegL + pose.lowerLegL, 46 * scale);
    const kneeR = pointFrom(hipR, pose.upperLegR, 50 * scale);
    const ankleR = pointFrom(kneeR, pose.upperLegR + pose.lowerLegR, 46 * scale);

    return {
      view: "hang",
      scale,
      pose,
      points: {
        shoulderCenter,
        pelvis,
        head,
        shoulderL,
        shoulderR,
        hipL,
        hipR,
        elbowL,
        handL,
        elbowR,
        handR,
        kneeL,
        ankleL,
        kneeR,
        ankleR,
      },
      angles: {
        footL: pose.footL,
        footR: pose.footR,
      },
    };
  }

  function solveSupport(pose, width, height, scale) {
    const shoulderCenter = {
      x: width * 0.5 + pose.rootX * scale,
      y: height * 0.34 + pose.rootY * scale,
    };
    const pelvis = pointFrom(shoulderCenter, pose.torso + Math.PI, 80 * scale);
    const head = pointFrom(shoulderCenter, pose.torso, 26 * scale);
    const shoulderSpread = 20 * scale;
    const hipSpread = 16 * scale;
    const shoulderL = { x: shoulderCenter.x - shoulderSpread, y: shoulderCenter.y + 4 * scale };
    const shoulderR = { x: shoulderCenter.x + shoulderSpread, y: shoulderCenter.y + 4 * scale };
    const hipL = { x: pelvis.x - hipSpread, y: pelvis.y };
    const hipR = { x: pelvis.x + hipSpread, y: pelvis.y };
    const elbowL = pointFrom(shoulderL, pose.upperArmL, 34 * scale);
    const handL = pointFrom(elbowL, pose.upperArmL + pose.lowerArmL, 36 * scale);
    const elbowR = pointFrom(shoulderR, pose.upperArmR, 34 * scale);
    const handR = pointFrom(elbowR, pose.upperArmR + pose.lowerArmR, 36 * scale);
    const kneeL = pointFrom(hipL, pose.upperLegL, 46 * scale);
    const ankleL = pointFrom(kneeL, pose.upperLegL + pose.lowerLegL, 44 * scale);
    const kneeR = pointFrom(hipR, pose.upperLegR, 46 * scale);
    const ankleR = pointFrom(kneeR, pose.upperLegR + pose.lowerLegR, 44 * scale);

    return {
      view: "support",
      scale,
      pose,
      points: {
        shoulderCenter,
        pelvis,
        head,
        shoulderL,
        shoulderR,
        hipL,
        hipR,
        elbowL,
        handL,
        elbowR,
        handR,
        kneeL,
        ankleL,
        kneeR,
        ankleR,
      },
      angles: {
        footL: pose.footL,
        footR: pose.footR,
      },
    };
  }

  function solveSeated(pose, width, height, scale) {
    const pelvis = {
      x: width * 0.5 + pose.rootX * scale,
      y: height * 0.66 + pose.rootY * scale,
    };
    const shoulderCenter = pointFrom(pelvis, pose.torso, 74 * scale);
    const head = pointFrom(shoulderCenter, pose.torso, 24 * scale);
    const shoulderL = pointFrom(shoulderCenter, pose.shoulderTilt + Math.PI, 20 * scale);
    const shoulderR = pointFrom(shoulderCenter, pose.shoulderTilt, 20 * scale);
    const elbowL = pointFrom(shoulderL, pose.upperArmL, 34 * scale);
    const handL = pointFrom(elbowL, pose.upperArmL + pose.lowerArmL, 30 * scale);
    const elbowR = pointFrom(shoulderR, pose.upperArmR, 34 * scale);
    const handR = pointFrom(elbowR, pose.upperArmR + pose.lowerArmR, 30 * scale);
    const kneeL = pointFrom(pelvis, pose.thighL, 42 * scale);
    const ankleL = pointFrom(kneeL, pose.thighL + pose.shinL, 42 * scale);
    const kneeR = pointFrom(pelvis, pose.thighR, 42 * scale);
    const ankleR = pointFrom(kneeR, pose.thighR + pose.shinR, 42 * scale);

    return {
      view: "seated",
      scale,
      pose,
      points: {
        pelvis,
        shoulderCenter,
        head,
        shoulderL,
        shoulderR,
        elbowL,
        handL,
        elbowR,
        handR,
        kneeL,
        ankleL,
        kneeR,
        ankleR,
      },
      angles: {
        footL: pose.footL,
        footR: pose.footR,
      },
    };
  }

  const MODEL3D_BODY = {
    pelvisWidth: 0.28,
    shoulderWidth: 0.4,
    spineLower: 0.24,
    spineUpper: 0.28,
    neck: 0.08,
    headRadius: 0.11,
    upperArm: 0.28,
    forearm: 0.26,
    thigh: 0.43,
    shin: 0.41,
    foot: 0.16,
  };

  const MODEL3D_CAMERAS = {
    coach: { centerX: 0.5, groundY: 0.87, depth: 0.22, lift: 0.06, yaw: deg(-34) },
    hero: { centerX: 0.5, groundY: 0.87, depth: 0.24, lift: 0.06, yaw: deg(-36) },
    seated: { centerX: 0.5, groundY: 0.87, depth: 0.18, lift: 0.05, yaw: deg(-44) },
    support: { centerX: 0.5, groundY: 0.87, depth: 0.2, lift: 0.05, yaw: deg(-22) },
    supine: { centerX: 0.48, groundY: 0.87, depth: 0.15, lift: 0.03, yaw: deg(-72) },
    side: { centerX: 0.52, groundY: 0.88, depth: 0.12, lift: 0.02, yaw: deg(-82) },
    front: { centerX: 0.5, groundY: 0.87, depth: 0.12, lift: 0.03, yaw: deg(-4) },
    floorSide: { centerX: 0.54, groundY: 0.88, depth: 0.1, lift: 0.02, yaw: deg(-86) },
    frontTall: { centerX: 0.5, groundY: 0.92, depth: 0.1, lift: 0.02, yaw: deg(-4) },
    pullupTeach: { centerX: 0.54, groundY: 0.98, depth: 0.1, lift: 0.02, yaw: deg(-64) },
  };

  function vec3(x = 0, y = 0, z = 0) {
    return { x, y, z };
  }

  function add3(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  function sub3(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  function scale3(v, factor) {
    return { x: v.x * factor, y: v.y * factor, z: v.z * factor };
  }

  function length3(v) {
    return Math.hypot(v.x, v.y, v.z);
  }

  function normalize3(v) {
    const len = length3(v) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  function dot3(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function cross3(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  function midpoint3(a, b) {
    return scale3(add3(a, b), 0.5);
  }

  function rotateX3(v, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x,
      y: v.y * cos - v.z * sin,
      z: v.y * sin + v.z * cos,
    };
  }

  function rotateY3(v, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos + v.z * sin,
      y: v.y,
      z: -v.x * sin + v.z * cos,
    };
  }

  function rotateZ3(v, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos,
      z: v.z,
    };
  }

  function rotateAroundAxis3(v, axis, angle) {
    const unit = normalize3(axis);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const parallel = scale3(unit, dot3(unit, v));
    const perpendicular = sub3(v, parallel);
    const rotated = add3(
      scale3(perpendicular, cos),
      scale3(cross3(unit, perpendicular), sin)
    );
    return add3(rotated, parallel);
  }

  function applyEuler3(v, rotation) {
    return rotateZ3(
      rotateY3(
        rotateX3(v, rotation.x || 0),
        rotation.y || 0
      ),
      rotation.z || 0
    );
  }

  function solveTwoBone3(start, target, lengthA, lengthB, bendHint) {
    const offset = sub3(target, start);
    const distance = clamp(length3(offset), Math.abs(lengthA - lengthB) + 1e-4, lengthA + lengthB - 1e-4);
    const direction = normalize3(offset);
    const hint = normalize3(bendHint || vec3(0, 0, 1));
    let side = cross3(direction, hint);
    if (length3(side) < 1e-4) {
      side = cross3(direction, vec3(0, 1, 0));
    }
    let up = normalize3(cross3(side, direction));
    if (length3(up) < 1e-4) {
      up = vec3(0, 0, 1);
    }

    const along = (lengthA * lengthA - lengthB * lengthB + distance * distance) / (2 * distance);
    const height = Math.sqrt(Math.max(0, lengthA * lengthA - along * along));
    return add3(start, add3(scale3(direction, along), scale3(up, height)));
  }

  function createLimbDirection(pitch, yaw, side) {
    let direction = vec3(0, -1, 0);
    direction = rotateX3(direction, pitch);
    direction = rotateZ3(direction, -side * yaw);
    return normalize3(direction);
  }

  function solveFreeArm(shoulder, rotation, pose, sideKey, sideSign) {
    const upper = createLimbDirection(pose[`shoulderPitch${sideKey}`], pose[`shoulderYaw${sideKey}`], sideSign);
    const upperWorld = applyEuler3(upper, rotation);
    const elbow = add3(shoulder, scale3(upperWorld, MODEL3D_BODY.upperArm));
    const bendGuide = applyEuler3(vec3(0.15 * sideSign, 0.16, 1), rotation);
    const axis = cross3(upperWorld, bendGuide);
    const forearmDirection =
      length3(axis) > 1e-4
        ? normalize3(rotateAroundAxis3(upperWorld, axis, pose[`elbowFlex${sideKey}`]))
        : upperWorld;
    const hand = add3(elbow, scale3(forearmDirection, MODEL3D_BODY.forearm));
    return { elbow, hand };
  }

  function solveAnchoredArm(shoulder, hand, rotation, sideSign) {
    const elbow = solveTwoBone3(
      shoulder,
      hand,
      MODEL3D_BODY.upperArm,
      MODEL3D_BODY.forearm,
      applyEuler3(vec3(0.25 * sideSign, 0.15, 1), rotation)
    );
    return { elbow, hand };
  }

  function solveLeg(hip, ankle, rotation, sideSign) {
    const knee = solveTwoBone3(
      hip,
      ankle,
      MODEL3D_BODY.thigh,
      MODEL3D_BODY.shin,
      applyEuler3(vec3(0.08 * sideSign, 0.04, 1), rotation)
    );
    return { knee, ankle };
  }

  function footDirection(pose, sideKey, sideSign) {
    const direction = normalize3(vec3(0.96 * sideSign, -0.12, 0.18));
    return rotateAroundAxis3(direction, vec3(0, 0, 1), -pose[`ankleFlex${sideKey}`] * 0.65);
  }

  function createModelCore(pose, mode) {
    if (mode === "supine") {
      const pelvis = vec3(pose.rootX, pose.pelvisY, pose.rootZ);
      const torsoRotation = {
        x: 0,
        y: pose.pelvisYaw + pose.torsoYaw,
        z: pose.torsoRoll,
      };
      const bodyAxis = applyEuler3(vec3(-1, 0.03, 0.04), torsoRotation);
      const lateral = applyEuler3(vec3(0, 0.01, 1), torsoRotation);
      const hipL = add3(pelvis, scale3(lateral, -MODEL3D_BODY.pelvisWidth * 0.46));
      const hipR = add3(pelvis, scale3(lateral, MODEL3D_BODY.pelvisWidth * 0.46));
      const lowerChest = add3(pelvis, scale3(bodyAxis, MODEL3D_BODY.spineLower));
      const shoulderCenter = add3(lowerChest, scale3(bodyAxis, MODEL3D_BODY.spineUpper));
      const shoulderL = add3(shoulderCenter, scale3(lateral, -MODEL3D_BODY.shoulderWidth * 0.48));
      const shoulderR = add3(shoulderCenter, scale3(lateral, MODEL3D_BODY.shoulderWidth * 0.48));
      const neck = add3(shoulderCenter, scale3(bodyAxis, MODEL3D_BODY.neck));
      const head = add3(neck, scale3(bodyAxis, MODEL3D_BODY.headRadius * 1.2));

      return {
        pelvis,
        hipL,
        hipR,
        lowerChest,
        shoulderCenter,
        shoulderL,
        shoulderR,
        neck,
        head,
        torsoRotation,
        pelvicRotation: torsoRotation,
      };
    }

    const pelvis = vec3(pose.rootX, pose.pelvisY, pose.rootZ);
    const torsoRotation = {
      x: pose.torsoPitch,
      y: pose.pelvisYaw + pose.torsoYaw,
      z: pose.torsoRoll,
    };
    const pelvicRotation = {
      x: pose.torsoPitch * 0.18,
      y: pose.pelvisYaw,
      z: pose.torsoRoll * 0.12,
    };

    const hipL = add3(pelvis, applyEuler3(vec3(-MODEL3D_BODY.pelvisWidth * 0.5, 0, 0), pelvicRotation));
    const hipR = add3(pelvis, applyEuler3(vec3(MODEL3D_BODY.pelvisWidth * 0.5, 0, 0), pelvicRotation));

    const lowerChest =
      mode === "seated"
        ? add3(pelvis, applyEuler3(vec3(0, MODEL3D_BODY.spineLower * 0.9, 0), torsoRotation))
        : add3(pelvis, applyEuler3(vec3(0, MODEL3D_BODY.spineLower, 0), torsoRotation));
    const shoulderCenter = add3(lowerChest, applyEuler3(vec3(0, MODEL3D_BODY.spineUpper, 0), torsoRotation));
    const shoulderL = add3(
      shoulderCenter,
      applyEuler3(vec3(-MODEL3D_BODY.shoulderWidth * 0.5, 0.02, 0), torsoRotation)
    );
    const shoulderR = add3(
      shoulderCenter,
      applyEuler3(vec3(MODEL3D_BODY.shoulderWidth * 0.5, 0.02, 0), torsoRotation)
    );
    const neck = add3(shoulderCenter, applyEuler3(vec3(0, MODEL3D_BODY.neck, 0), torsoRotation));
    const head = add3(
      neck,
      applyEuler3(
        vec3(0, MODEL3D_BODY.headRadius * 1.25, 0),
        {
          x: torsoRotation.x + pose.headPitch,
          y: torsoRotation.y + pose.headYaw,
          z: torsoRotation.z,
        }
      )
    );

    return {
      pelvis,
      hipL,
      hipR,
      lowerChest,
      shoulderCenter,
      shoulderL,
      shoulderR,
      neck,
      head,
      torsoRotation,
      pelvicRotation,
    };
  }

  function buildModelSegments(points) {
    return [
      { a: "pelvis", b: "lowerChest", width: 0.15, color: "ink", alpha: 1 },
      { a: "lowerChest", b: "shoulderCenter", width: 0.15, color: "ink", alpha: 1 },
      { a: "shoulderL", b: "elbowL", width: 0.1, color: "accent", alpha: 1 },
      { a: "elbowL", b: "handL", width: 0.085, color: "accent", alpha: 1 },
      { a: "shoulderR", b: "elbowR", width: 0.1, color: "accent", alpha: 1 },
      { a: "elbowR", b: "handR", width: 0.085, color: "accent", alpha: 1 },
      { a: "hipL", b: "kneeL", width: 0.12, color: "soft", alpha: 1 },
      { a: "kneeL", b: "ankleL", width: 0.105, color: "soft", alpha: 1 },
      { a: "hipR", b: "kneeR", width: 0.12, color: "soft", alpha: 1 },
      { a: "kneeR", b: "ankleR", width: 0.105, color: "soft", alpha: 1 },
      { a: "toeL", b: "ankleL", width: 0.07, color: "shoe", alpha: 1 },
      { a: "toeR", b: "ankleR", width: 0.07, color: "shoe", alpha: 1 },
      { a: "shoulderL", b: "shoulderR", width: 0.08, color: "ink", alpha: 0.95 },
    ].filter((segment) => points[segment.a] && points[segment.b]);
  }

  function buildModelJoints(points) {
    return [
      { key: "pelvis", radius: 0.05, fill: "paper", stroke: "ink" },
      { key: "shoulderCenter", radius: 0.05, fill: "paper", stroke: "ink" },
      { key: "shoulderL", radius: 0.042, fill: "paper", stroke: "accent" },
      { key: "shoulderR", radius: 0.042, fill: "paper", stroke: "accent" },
      { key: "elbowL", radius: 0.036, fill: "paper", stroke: "accent" },
      { key: "elbowR", radius: 0.036, fill: "paper", stroke: "accent" },
      { key: "hipL", radius: 0.04, fill: "softFill", stroke: "soft" },
      { key: "hipR", radius: 0.04, fill: "softFill", stroke: "soft" },
      { key: "kneeL", radius: 0.036, fill: "softFill", stroke: "soft" },
      { key: "kneeR", radius: 0.036, fill: "softFill", stroke: "soft" },
      { key: "ankleL", radius: 0.034, fill: "softFill", stroke: "soft" },
      { key: "ankleR", radius: 0.034, fill: "softFill", stroke: "soft" },
      { key: "head", radius: MODEL3D_BODY.headRadius, fill: "paper", stroke: "ink" },
    ].filter((joint) => points[joint.key]);
  }

  function equipmentProps(scene, points, pose) {
    const equipment = scene.equipment || {};
    const props = [];

    if (equipment.type === "pullup_bar") {
      const left = vec3(pose.handLX - 0.22, pose.handLY + 0.02, pose.handLZ);
      const right = vec3(pose.handRX + 0.22, pose.handRY + 0.02, pose.handRZ);
      props.push({ type: "line", a: left, b: right, width: 0.05, color: "line", layer: "back" });
    }

    if (equipment.type === "dip_bars") {
      props.push(
        { type: "line", a: vec3(pose.handLX, 0.12, pose.handLZ), b: vec3(pose.handLX, pose.handLY + 0.02, pose.handLZ), width: 0.045, color: "line", layer: "back" },
        { type: "line", a: vec3(pose.handRX, 0.12, pose.handRZ), b: vec3(pose.handRX, pose.handRY + 0.02, pose.handRZ), width: 0.045, color: "line", layer: "back" }
      );
    }

    if (equipment.type === "barbell") {
      if (equipment.mount === "back") {
        const center = add3(midpoint3(points.shoulderL, points.shoulderR), vec3(0, 0.04, 0.08));
        props.push({
          type: "barbell",
          a: add3(center, vec3(-0.5, 0, 0)),
          b: add3(center, vec3(0.5, 0, 0)),
          layer: "back",
        });
      }

      if (equipment.mount === "hands") {
        const gripLeft = points.handL;
        const gripRight = points.handR;
        const direction = normalize3(sub3(gripRight, gripLeft));
        props.push({
          type: "barbell",
          a: add3(gripLeft, scale3(direction, -0.24)),
          b: add3(gripRight, scale3(direction, 0.24)),
          layer: "front",
        });
      }
    }

    if (equipment.type === "dumbbell_pair") {
      props.push(
        { type: "dumbbell", center: points.handL, layer: "front" },
        { type: "dumbbell", center: points.handR, layer: "front" }
      );
    }

    if (equipment.type === "dumbbell_single") {
      props.push({
        type: "dumbbell",
        center:
          equipment.grip === "left"
            ? points.handL
            : equipment.grip === "right"
              ? points.handR
              : midpoint3(points.handL, points.handR),
        layer: "front",
      });
    }

    if (equipment.type === "plate") {
      props.push({ type: "plate", center: midpoint3(points.handL, points.handR), layer: "front" });
    }

    if (equipment.support === "bench") {
      const start = add3(points.head, vec3(-0.08, -0.07, 0));
      const end = add3(points.pelvis, vec3(0.22, -0.07, 0));
      props.push({
        type: "bench",
        a: start,
        b: end,
        layer: "back",
      });
    }

    return props;
  }

  function solveModel3D(pose, width, height, scale, scene) {
    const mode = scene.mode || "standing";
    const base = createModelCore(pose, mode);
    const points = {
      pelvis: base.pelvis,
      lowerChest: base.lowerChest,
      shoulderCenter: base.shoulderCenter,
      shoulderL: base.shoulderL,
      shoulderR: base.shoulderR,
      hipL: base.hipL,
      hipR: base.hipR,
      head: base.head,
      neck: base.neck,
    };

    const ankleL = vec3(pose.footLX, pose.footLY, pose.footLZ);
    const ankleR = vec3(pose.footRX, pose.footRY, pose.footRZ);
    const legL = solveLeg(base.hipL, ankleL, base.pelvicRotation, -1);
    const legR = solveLeg(base.hipR, ankleR, base.pelvicRotation, 1);
    points.kneeL = legL.knee;
    points.ankleL = legL.ankle;
    points.kneeR = legR.knee;
    points.ankleR = legR.ankle;
    points.toeL = add3(points.ankleL, scale3(footDirection(pose, "L", -1), MODEL3D_BODY.foot));
    points.toeR = add3(points.ankleR, scale3(footDirection(pose, "R", 1), MODEL3D_BODY.foot));

    const handLTarget = vec3(pose.handLX, pose.handLY, pose.handLZ);
    const handRTarget = vec3(pose.handRX, pose.handRY, pose.handRZ);
    const armL =
      pose.handContactL > 0.5
        ? solveAnchoredArm(base.shoulderL, handLTarget, base.torsoRotation, -1)
        : solveFreeArm(base.shoulderL, base.torsoRotation, pose, "L", -1);
    const armR =
      pose.handContactR > 0.5
        ? solveAnchoredArm(base.shoulderR, handRTarget, base.torsoRotation, 1)
        : solveFreeArm(base.shoulderR, base.torsoRotation, pose, "R", 1);

    points.elbowL = armL.elbow;
    points.handL = armL.hand;
    points.elbowR = armR.elbow;
    points.handR = armR.hand;

    const shadowCenter = midpoint3(points.ankleL, points.ankleR);
    const camera =
      MODEL3D_CAMERAS[scene.camera] ||
      (
        mode === "seated"
          ? MODEL3D_CAMERAS.seated
          : mode === "support"
            ? MODEL3D_CAMERAS.support
            : mode === "supine"
              ? MODEL3D_CAMERAS.supine
              : MODEL3D_CAMERAS.hero
      );

    return {
      view: "model3d",
      scale,
      unit: 132 * scale * (scene.zoom || 1),
      camera,
      points,
      segments: buildModelSegments(points),
      joints: buildModelJoints(points),
      props: equipmentProps(scene, points, pose),
      shadow: {
        center: mode === "supine" ? midpoint3(points.shoulderCenter, points.pelvis) : shadowCenter,
        rx: mode === "floor" ? 0.44 : mode === "supine" ? 0.52 : 0.3,
        rz: mode === "floor" ? 0.18 : mode === "supine" ? 0.1 : 0.12,
      },
    };
  }

  function solve(view, rawPose, { width = 420, height = 340, sceneId = null } = {}) {
    const pose = sanitizePose(view, rawPose);
    const scale = Math.min(width / 420, height / 340);
    const scene = sceneId ? getScene(sceneId) : null;

    if (view === "front") return solveFront(pose, width, height, scale);
    if (view === "side") return solveSide(pose, width, height, scale);
    if (view === "burpee") return solveBurpee(pose, width, height, scale);
    if (view === "hang") return solveHang(pose, width, height, scale);
    if (view === "support") return solveSupport(pose, width, height, scale);
    if (view === "seated") return solveSeated(pose, width, height, scale);
    if (view === "quadruped") return solveQuadruped(pose, width, height, scale);
    if (view === "supine") return solveSupine(pose, width, height, scale);
    if (view === "model3d") return solveModel3D(pose, width, height, scale, scene || {});

    throw new Error("Unknown view: " + view);
  }

  registerScene("breathing-reach", {
    view: "front",
    poses: [
      NEUTRAL_POSES.front,
      {
        rootX: 0,
        rootY: -4,
        torso: deg(-92),
        upperArmL: deg(246),
        lowerArmL: deg(-12),
        upperArmR: deg(-66),
        lowerArmR: deg(12),
        upperLegL: deg(92),
        lowerLegL: deg(-6),
        footL: deg(6),
        upperLegR: deg(88),
        lowerLegR: deg(6),
        footR: deg(2),
      },
      NEUTRAL_POSES.front,
    ],
  });

  registerScene("march-place", {
    view: "front",
    poses: [
      {
        rootX: 0,
        rootY: 0,
        torso: deg(-90),
        upperArmL: deg(132),
        lowerArmL: deg(10),
        upperArmR: deg(40),
        lowerArmR: deg(-6),
        upperLegL: deg(58),
        lowerLegL: deg(58),
        footL: deg(4),
        upperLegR: deg(98),
        lowerLegR: deg(2),
        footR: deg(0),
      },
      {
        rootX: 0,
        rootY: 0,
        torso: deg(-90),
        upperArmL: deg(140),
        lowerArmL: deg(8),
        upperArmR: deg(48),
        lowerArmR: deg(-6),
        upperLegL: deg(100),
        lowerLegL: deg(-2),
        footL: deg(4),
        upperLegR: deg(70),
        lowerLegR: deg(46),
        footR: deg(0),
      },
    ],
  });

  registerScene("side-step", {
    view: "front",
    poses: [
      NEUTRAL_POSES.front,
      {
        rootX: 10,
        rootY: 0,
        torso: deg(-90),
        upperArmL: deg(128),
        lowerArmL: deg(6),
        upperArmR: deg(48),
        lowerArmR: deg(-6),
        upperLegL: deg(100),
        lowerLegL: deg(-4),
        footL: deg(2),
        upperLegR: deg(82),
        lowerLegR: deg(10),
        footR: deg(0),
      },
    ],
  });

  registerScene("squat", {
    view: "side",
    poses: [
      NEUTRAL_POSES.side,
      {
        hipX: 12,
        hipY: 12,
        torso: deg(-54),
        upperArmFront: deg(46),
        lowerArmFront: deg(-4),
        upperArmBack: deg(70),
        lowerArmBack: deg(-4),
        upperLegFront: deg(42),
        lowerLegFront: deg(56),
        footFront: deg(2),
        upperLegBack: deg(64),
        lowerLegBack: deg(36),
        footBack: deg(0),
      },
      NEUTRAL_POSES.side,
    ],
  });

  registerScene("bodyweight-squat", {
    view: "side",
    poses: [
      NEUTRAL_POSES.side,
      {
        hipX: 12,
        hipY: 12,
        torso: deg(-54),
        upperArmFront: deg(46),
        lowerArmFront: deg(-4),
        upperArmBack: deg(70),
        lowerArmBack: deg(-4),
        upperLegFront: deg(42),
        lowerLegFront: deg(56),
        footFront: deg(2),
        upperLegBack: deg(64),
        lowerLegBack: deg(36),
        footBack: deg(0),
      },
      NEUTRAL_POSES.side,
    ],
  });

  registerScene("heel-raise", {
    view: "front",
    poses: [
      NEUTRAL_POSES.front,
      {
        rootX: 0,
        rootY: -8,
        torso: deg(-90),
        upperArmL: deg(120),
        lowerArmL: deg(6),
        upperArmR: deg(60),
        lowerArmR: deg(-6),
        upperLegL: deg(90),
        lowerLegL: deg(0),
        footL: deg(-12),
        upperLegR: deg(90),
        lowerLegR: deg(0),
        footR: deg(-12),
      },
      NEUTRAL_POSES.front,
    ],
  });

  registerScene("hip-hinge", {
    view: "side",
    poses: [
      NEUTRAL_POSES.side,
      {
        hipX: 10,
        hipY: 6,
        torso: deg(-36),
        upperArmFront: deg(26),
        lowerArmFront: deg(10),
        upperArmBack: deg(44),
        lowerArmBack: deg(8),
        upperLegFront: deg(96),
        lowerLegFront: deg(-6),
        footFront: deg(2),
        upperLegBack: deg(88),
        lowerLegBack: deg(4),
        footBack: deg(-2),
      },
      NEUTRAL_POSES.side,
    ],
  });

  registerScene("cat-cow", {
    view: "quadruped",
    poses: [
      NEUTRAL_POSES.quadruped,
      {
        rootX: 0,
        rootY: -6,
        neck: deg(18),
        spineFront: deg(-16),
        spineBack: deg(-12),
        frontLeg: deg(110),
        frontShin: deg(-22),
        rearLeg: deg(78),
        rearShin: deg(22),
        reachArm: deg(94),
        reachForearm: deg(-20),
        reachLeg: deg(94),
        reachShin: deg(4),
      },
      {
        rootX: 0,
        rootY: 4,
        neck: deg(-24),
        spineFront: deg(18),
        spineBack: deg(16),
        frontLeg: deg(98),
        frontShin: deg(-18),
        rearLeg: deg(84),
        rearShin: deg(16),
        reachArm: deg(14),
        reachForearm: deg(0),
        reachLeg: deg(-14),
        reachShin: deg(8),
      },
      NEUTRAL_POSES.quadruped,
    ],
  });

  registerScene("bird-dog", {
    view: "quadruped",
    poses: [
      NEUTRAL_POSES.quadruped,
      {
        rootX: 0,
        rootY: 0,
        neck: deg(-8),
        spineFront: deg(4),
        spineBack: deg(2),
        frontLeg: deg(102),
        frontShin: deg(-24),
        rearLeg: deg(82),
        rearShin: deg(18),
        reachArm: deg(6),
        reachForearm: deg(4),
        reachLeg: deg(-12),
        reachShin: deg(8),
      },
      NEUTRAL_POSES.quadruped,
    ],
  });

  registerScene("glute-bridge", {
    view: "supine",
    poses: [
      NEUTRAL_POSES.supine,
      {
        rootX: 0,
        rootY: -24,
        torso: deg(-18),
        pelvisLift: deg(-24),
        arm: deg(-126),
        forearm: deg(6),
        thigh: deg(50),
        shin: deg(46),
        foot: deg(4),
        reachArm: deg(-130),
        reachForearm: deg(0),
        reachLeg: deg(44),
        reachShin: deg(52),
        reachFoot: deg(4),
      },
      NEUTRAL_POSES.supine,
    ],
  });

  registerScene("dead-bug", {
    view: "supine",
    poses: [
      NEUTRAL_POSES.supine,
      {
        rootX: 0,
        rootY: 0,
        torso: deg(0),
        pelvisLift: 0,
        arm: deg(-146),
        forearm: deg(0),
        thigh: deg(18),
        shin: deg(8),
        foot: deg(0),
        reachArm: deg(-52),
        reachForearm: deg(8),
        reachLeg: deg(10),
        reachShin: deg(-6),
        reachFoot: deg(0),
      },
      NEUTRAL_POSES.supine,
    ],
  });

  registerScene("hamstring-reach", {
    view: "side",
    poses: [
      NEUTRAL_POSES.side,
      {
        hipX: 10,
        hipY: 4,
        torso: deg(-26),
        upperArmFront: deg(16),
        lowerArmFront: deg(18),
        upperArmBack: deg(24),
        lowerArmBack: deg(16),
        upperLegFront: deg(98),
        lowerLegFront: deg(-8),
        footFront: deg(2),
        upperLegBack: deg(90),
        lowerLegBack: deg(2),
        footBack: deg(-2),
      },
      NEUTRAL_POSES.side,
    ],
  });

  registerScene("chest-opener", {
    view: "front",
    poses: [
      NEUTRAL_POSES.front,
      {
        rootX: 0,
        rootY: 0,
        torso: deg(-90),
        upperArmL: deg(184),
        lowerArmL: deg(-8),
        upperArmR: deg(-4),
        lowerArmR: deg(8),
        upperLegL: deg(92),
        lowerLegL: deg(-6),
        footL: deg(6),
        upperLegR: deg(88),
        lowerLegR: deg(6),
        footR: deg(2),
      },
      NEUTRAL_POSES.front,
    ],
  });

  registerScene("burpee", {
    view: "burpee",
    poses: [
      NEUTRAL_POSES.burpee,
      {
        rootX: 8,
        rootY: 12,
        torso: deg(-46),
        upperArmFront: deg(108),
        lowerArmFront: deg(14),
        upperArmBack: deg(118),
        lowerArmBack: deg(10),
        upperLegFront: deg(48),
        lowerLegFront: deg(74),
        footFront: deg(4),
        upperLegBack: deg(72),
        lowerLegBack: deg(52),
        footBack: deg(2),
      },
      {
        rootX: -8,
        rootY: 4,
        torso: deg(-10),
        upperArmFront: deg(96),
        lowerArmFront: deg(2),
        upperArmBack: deg(98),
        lowerArmBack: deg(4),
        upperLegFront: deg(154),
        lowerLegFront: deg(-8),
        footFront: deg(0),
        upperLegBack: deg(146),
        lowerLegBack: deg(-6),
        footBack: deg(0),
      },
      {
        rootX: 8,
        rootY: 10,
        torso: deg(-52),
        upperArmFront: deg(100),
        lowerArmFront: deg(12),
        upperArmBack: deg(108),
        lowerArmBack: deg(8),
        upperLegFront: deg(56),
        lowerLegFront: deg(72),
        footFront: deg(2),
        upperLegBack: deg(76),
        lowerLegBack: deg(44),
        footBack: deg(0),
      },
      {
        rootX: 0,
        rootY: -10,
        torso: deg(-94),
        upperArmFront: deg(246),
        lowerArmFront: deg(-8),
        upperArmBack: deg(226),
        lowerArmBack: deg(-2),
        upperLegFront: deg(88),
        lowerLegFront: deg(0),
        footFront: deg(-6),
        upperLegBack: deg(84),
        lowerLegBack: deg(4),
        footBack: deg(-4),
      },
      NEUTRAL_POSES.burpee,
    ],
  });

  registerScene("jumping-jack", {
    view: "front",
    poses: [
      NEUTRAL_POSES.front,
      {
        rootX: 0,
        rootY: -8,
        torso: deg(-90),
        upperArmL: deg(236),
        lowerArmL: deg(-8),
        upperArmR: deg(-56),
        lowerArmR: deg(8),
        upperLegL: deg(112),
        lowerLegL: deg(-4),
        footL: deg(8),
        upperLegR: deg(68),
        lowerLegR: deg(4),
        footR: deg(-8),
      },
      NEUTRAL_POSES.front,
    ],
  });

  registerScene("pull-up", {
    view: "hang",
    poses: [
      NEUTRAL_POSES.hang,
      {
        rootX: 0,
        rootY: -14,
        torso: deg(82),
        upperArmL: deg(-116),
        lowerArmL: deg(116),
        upperArmR: deg(-64),
        lowerArmR: deg(-116),
        upperLegL: deg(104),
        lowerLegL: deg(14),
        footL: deg(6),
        upperLegR: deg(100),
        lowerLegR: deg(18),
        footR: deg(-4),
      },
      NEUTRAL_POSES.hang,
    ],
  });

  registerScene("chin-dip", {
    view: "support",
    poses: [
      NEUTRAL_POSES.support,
      {
        rootX: 0,
        rootY: 12,
        torso: deg(-98),
        upperArmL: deg(96),
        lowerArmL: deg(-86),
        upperArmR: deg(84),
        lowerArmR: deg(86),
        upperLegL: deg(106),
        lowerLegL: deg(6),
        footL: deg(4),
        upperLegR: deg(100),
        lowerLegR: deg(10),
        footR: deg(-4),
      },
      NEUTRAL_POSES.support,
    ],
  });

  registerScene("dip", {
    view: "support",
    poses: [
      NEUTRAL_POSES.support,
      {
        rootX: 0,
        rootY: 12,
        torso: deg(-98),
        upperArmL: deg(96),
        lowerArmL: deg(-86),
        upperArmR: deg(84),
        lowerArmR: deg(86),
        upperLegL: deg(106),
        lowerLegL: deg(6),
        footL: deg(4),
        upperLegR: deg(100),
        lowerLegR: deg(10),
        footR: deg(-4),
      },
      NEUTRAL_POSES.support,
    ],
  });

  registerScene("russian-twist", {
    view: "seated",
    poses: [
      NEUTRAL_POSES.seated,
      {
        rootX: -6,
        rootY: 0,
        torso: deg(-126),
        shoulderTilt: deg(-18),
        upperArmL: deg(206),
        lowerArmL: deg(10),
        upperArmR: deg(26),
        lowerArmR: deg(-10),
        thighL: deg(14),
        shinL: deg(78),
        footL: deg(4),
        thighR: deg(8),
        shinR: deg(82),
        footR: deg(-4),
      },
      {
        rootX: 6,
        rootY: 0,
        torso: deg(-126),
        shoulderTilt: deg(18),
        upperArmL: deg(154),
        lowerArmL: deg(8),
        upperArmR: deg(-26),
        lowerArmR: deg(-8),
        thighL: deg(8),
        shinL: deg(82),
        footL: deg(4),
        thighR: deg(14),
        shinR: deg(78),
        footR: deg(-4),
      },
      NEUTRAL_POSES.seated,
    ],
  });

  registerScene("burpee", {
    view: "model3d",
    mode: "floor",
    camera: "floorSide",
    zoom: 1.28,
    poses: [
      {
        ...NEUTRAL_POSES.model3d,
        torsoPitch: deg(-4),
        shoulderPitchL: deg(6),
        shoulderPitchR: deg(6),
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.74,
        rootZ: 0.18,
        torsoPitch: deg(74),
        shoulderPitchL: deg(42),
        shoulderPitchR: deg(42),
        elbowFlexL: deg(14),
        elbowFlexR: deg(14),
        hipPitchL: deg(108),
        hipPitchR: deg(108),
        kneeFlexL: deg(122),
        kneeFlexR: deg(122),
        footLZ: 0.34,
        footRZ: 0.22,
        handContactL: 1,
        handLX: -0.18,
        handLY: 0.02,
        handLZ: 0.54,
        handContactR: 1,
        handRX: 0.18,
        handRY: 0.02,
        handRZ: 0.44,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.68,
        rootZ: 0.58,
        torsoPitch: deg(84),
        shoulderPitchL: deg(54),
        shoulderPitchR: deg(54),
        hipPitchL: deg(12),
        hipPitchR: deg(12),
        kneeFlexL: deg(10),
        kneeFlexR: deg(10),
        footLX: -0.18,
        footRX: 0.18,
        footLZ: 1.34,
        footRZ: 1.18,
        handContactL: 1,
        handLX: -0.18,
        handLY: 0.02,
        handLZ: 0.54,
        handContactR: 1,
        handRX: 0.18,
        handRY: 0.02,
        handRZ: 0.44,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.74,
        rootZ: 0.24,
        torsoPitch: deg(70),
        shoulderPitchL: deg(48),
        shoulderPitchR: deg(48),
        hipPitchL: deg(126),
        hipPitchR: deg(126),
        kneeFlexL: deg(126),
        kneeFlexR: deg(126),
        footLZ: 0.52,
        footRZ: 0.42,
        handContactL: 1,
        handLX: -0.18,
        handLY: 0.02,
        handLZ: 0.54,
        handContactR: 1,
        handRX: 0.18,
        handRY: 0.02,
        handRZ: 0.44,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 1.08,
        torsoPitch: deg(-6),
        shoulderPitchL: deg(132),
        shoulderYawL: deg(20),
        shoulderPitchR: deg(132),
        shoulderYawR: deg(20),
        elbowFlexL: deg(12),
        elbowFlexR: deg(12),
        footLY: 0.08,
        footRY: 0.08,
      },
      {
        ...NEUTRAL_POSES.model3d,
      },
    ],
  });

  registerScene("jumping-jack", {
    view: "model3d",
    mode: "standing",
    camera: "front",
    zoom: 1.18,
    poses: [
      {
        ...NEUTRAL_POSES.model3d,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 1.06,
        shoulderPitchL: deg(158),
        shoulderYawL: deg(34),
        shoulderPitchR: deg(158),
        shoulderYawR: deg(34),
        elbowFlexL: deg(10),
        elbowFlexR: deg(10),
        footLX: -0.4,
        footRX: 0.4,
        footLZ: 0.08,
        footRZ: -0.08,
      },
      {
        ...NEUTRAL_POSES.model3d,
      },
    ],
  });

  registerScene("pull-up", {
    view: "model3d",
    mode: "hang",
    camera: "pullupTeach",
    zoom: 0.9,
    equipment: { type: "pullup_bar" },
    poses: [
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.88,
        torsoPitch: deg(4),
        shoulderPitchL: deg(8),
        shoulderYawL: deg(8),
        elbowFlexL: deg(4),
        shoulderPitchR: deg(8),
        shoulderYawR: deg(8),
        elbowFlexR: deg(4),
        hipPitchL: deg(6),
        hipPitchR: deg(6),
        kneeFlexL: deg(10),
        kneeFlexR: deg(10),
        footLZ: 0.14,
        footRZ: -0.02,
        handContactL: 1,
        handLX: -0.28,
        handLY: 1.62,
        handLZ: 0.18,
        handContactR: 1,
        handRX: 0.18,
        handRY: 1.62,
        handRZ: -0.12,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 1.16,
        torsoPitch: deg(-10),
        shoulderPitchL: deg(-4),
        shoulderYawL: deg(10),
        elbowFlexL: deg(104),
        shoulderPitchR: deg(-4),
        shoulderYawR: deg(10),
        elbowFlexR: deg(104),
        hipPitchL: deg(18),
        hipPitchR: deg(18),
        kneeFlexL: deg(20),
        kneeFlexR: deg(20),
        footLZ: 0.18,
        footRZ: 0.02,
        handContactL: 1,
        handLX: -0.28,
        handLY: 1.62,
        handLZ: 0.18,
        handContactR: 1,
        handRX: 0.18,
        handRY: 1.62,
        handRZ: -0.12,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.88,
        torsoPitch: deg(4),
        shoulderPitchL: deg(8),
        shoulderYawL: deg(8),
        elbowFlexL: deg(4),
        shoulderPitchR: deg(8),
        shoulderYawR: deg(8),
        elbowFlexR: deg(4),
        hipPitchL: deg(6),
        hipPitchR: deg(6),
        kneeFlexL: deg(10),
        kneeFlexR: deg(10),
        footLZ: 0.14,
        footRZ: -0.02,
        handContactL: 1,
        handLX: -0.28,
        handLY: 1.62,
        handLZ: 0.18,
        handContactR: 1,
        handRX: 0.18,
        handRY: 1.62,
        handRZ: -0.12,
      },
    ],
  });

  registerScene("chin-dip", {
    view: "model3d",
    mode: "support",
    camera: "support",
    zoom: 1.06,
    equipment: { type: "dip_bars" },
    poses: [
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 1.02,
        torsoPitch: deg(8),
        shoulderPitchL: deg(18),
        shoulderPitchR: deg(18),
        elbowFlexL: deg(8),
        elbowFlexR: deg(8),
        hipPitchL: deg(34),
        hipPitchR: deg(34),
        kneeFlexL: deg(34),
        kneeFlexR: deg(34),
        footLZ: 0.52,
        footRZ: 0.4,
        handContactL: 1,
        handLX: -0.22,
        handLY: 1.12,
        handLZ: 0.02,
        handContactR: 1,
        handRX: 0.22,
        handRY: 1.12,
        handRZ: -0.02,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.82,
        torsoPitch: deg(20),
        shoulderPitchL: deg(14),
        shoulderPitchR: deg(14),
        elbowFlexL: deg(94),
        elbowFlexR: deg(94),
        hipPitchL: deg(48),
        hipPitchR: deg(48),
        kneeFlexL: deg(44),
        kneeFlexR: deg(44),
        footLZ: 0.62,
        footRZ: 0.5,
        handContactL: 1,
        handLX: -0.22,
        handLY: 1.12,
        handLZ: 0.02,
        handContactR: 1,
        handRX: 0.22,
        handRY: 1.12,
        handRZ: -0.02,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 1.02,
        torsoPitch: deg(8),
        shoulderPitchL: deg(18),
        shoulderPitchR: deg(18),
        elbowFlexL: deg(8),
        elbowFlexR: deg(8),
        hipPitchL: deg(34),
        hipPitchR: deg(34),
        kneeFlexL: deg(34),
        kneeFlexR: deg(34),
        footLZ: 0.52,
        footRZ: 0.4,
        handContactL: 1,
        handLX: -0.22,
        handLY: 1.12,
        handLZ: 0.02,
        handContactR: 1,
        handRX: 0.22,
        handRY: 1.12,
        handRZ: -0.02,
      },
    ],
  });

  registerScene("dip", getScene("chin-dip"));

  registerScene("russian-twist", {
    view: "model3d",
    mode: "seated",
    camera: "seated",
    zoom: 1.22,
    equipment: { type: "plate" },
    poses: [
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.42,
        torsoPitch: deg(-28),
        shoulderPitchL: deg(38),
        shoulderYawL: deg(10),
        elbowFlexL: deg(82),
        shoulderPitchR: deg(38),
        shoulderYawR: deg(10),
        elbowFlexR: deg(82),
        hipPitchL: deg(78),
        hipPitchR: deg(78),
        kneeFlexL: deg(106),
        kneeFlexR: deg(106),
        footLX: -0.34,
        footRX: 0.34,
        footLZ: 0.6,
        footRZ: 0.54,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.42,
        torsoPitch: deg(-28),
        torsoYaw: deg(-40),
        headYaw: deg(-18),
        shoulderPitchL: deg(34),
        shoulderYawL: deg(14),
        elbowFlexL: deg(76),
        shoulderPitchR: deg(28),
        shoulderYawR: deg(12),
        elbowFlexR: deg(92),
        hipPitchL: deg(78),
        hipPitchR: deg(78),
        kneeFlexL: deg(106),
        kneeFlexR: deg(106),
        footLX: -0.34,
        footRX: 0.34,
        footLZ: 0.6,
        footRZ: 0.54,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.42,
        torsoPitch: deg(-28),
        torsoYaw: deg(40),
        headYaw: deg(18),
        shoulderPitchL: deg(28),
        shoulderYawL: deg(12),
        elbowFlexL: deg(92),
        shoulderPitchR: deg(34),
        shoulderYawR: deg(14),
        elbowFlexR: deg(76),
        hipPitchL: deg(78),
        hipPitchR: deg(78),
        kneeFlexL: deg(106),
        kneeFlexR: deg(106),
        footLX: -0.34,
        footRX: 0.34,
        footLZ: 0.6,
        footRZ: 0.54,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.42,
        torsoPitch: deg(-28),
        shoulderPitchL: deg(38),
        shoulderYawL: deg(10),
        elbowFlexL: deg(82),
        shoulderPitchR: deg(38),
        shoulderYawR: deg(10),
        elbowFlexR: deg(82),
        hipPitchL: deg(78),
        hipPitchR: deg(78),
        kneeFlexL: deg(106),
        kneeFlexR: deg(106),
        footLX: -0.34,
        footRX: 0.34,
        footLZ: 0.6,
        footRZ: 0.54,
      },
    ],
  });

  registerScene("goblet-squat", {
    view: "model3d",
    mode: "standing",
    camera: "side",
    zoom: 1.22,
    equipment: { type: "dumbbell_single" },
    poses: [
      {
        ...NEUTRAL_POSES.model3d,
        shoulderPitchL: deg(88),
        shoulderPitchR: deg(88),
        elbowFlexL: deg(82),
        elbowFlexR: deg(82),
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.76,
        torsoPitch: deg(34),
        shoulderPitchL: deg(86),
        shoulderPitchR: deg(86),
        elbowFlexL: deg(74),
        elbowFlexR: deg(74),
        hipPitchL: deg(104),
        hipPitchR: deg(104),
        kneeFlexL: deg(116),
        kneeFlexR: deg(116),
        footLX: -0.24,
        footRX: 0.24,
        footLZ: 0.08,
        footRZ: -0.08,
      },
      {
        ...NEUTRAL_POSES.model3d,
        shoulderPitchL: deg(88),
        shoulderPitchR: deg(88),
        elbowFlexL: deg(82),
        elbowFlexR: deg(82),
      },
    ],
  });

  registerScene("barbell-squat", {
    view: "model3d",
    mode: "standing",
    camera: "side",
    zoom: 1.22,
    equipment: { type: "barbell", mount: "back" },
    poses: [
      {
        ...NEUTRAL_POSES.model3d,
        torsoPitch: deg(8),
        footLX: -0.28,
        footRX: 0.28,
        shoulderPitchL: deg(24),
        shoulderPitchR: deg(24),
        shoulderYawL: deg(78),
        shoulderYawR: deg(78),
        elbowFlexL: deg(88),
        elbowFlexR: deg(88),
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.72,
        torsoPitch: deg(46),
        shoulderPitchL: deg(18),
        shoulderPitchR: deg(18),
        shoulderYawL: deg(78),
        shoulderYawR: deg(78),
        elbowFlexL: deg(84),
        elbowFlexR: deg(84),
        hipPitchL: deg(116),
        hipPitchR: deg(116),
        kneeFlexL: deg(126),
        kneeFlexR: deg(126),
        footLX: -0.3,
        footRX: 0.3,
        footLZ: 0.06,
        footRZ: -0.06,
      },
      {
        ...NEUTRAL_POSES.model3d,
        torsoPitch: deg(8),
        footLX: -0.28,
        footRX: 0.28,
        shoulderPitchL: deg(24),
        shoulderPitchR: deg(24),
        shoulderYawL: deg(78),
        shoulderYawR: deg(78),
        elbowFlexL: deg(88),
        elbowFlexR: deg(88),
      },
    ],
  });

  registerScene("dumbbell-overhead-press", {
    view: "model3d",
    mode: "standing",
    camera: "frontTall",
    zoom: 1.02,
    equipment: { type: "dumbbell_pair" },
    poses: [
      {
        ...NEUTRAL_POSES.model3d,
        torsoPitch: deg(2),
        shoulderPitchL: deg(76),
        shoulderYawL: deg(18),
        elbowFlexL: deg(96),
        shoulderPitchR: deg(76),
        shoulderYawR: deg(18),
        elbowFlexR: deg(96),
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 1.04,
        torsoPitch: deg(-2),
        shoulderPitchL: deg(164),
        shoulderYawL: deg(8),
        elbowFlexL: deg(10),
        shoulderPitchR: deg(164),
        shoulderYawR: deg(8),
        elbowFlexR: deg(10),
      },
      {
        ...NEUTRAL_POSES.model3d,
        torsoPitch: deg(2),
        shoulderPitchL: deg(76),
        shoulderYawL: deg(18),
        elbowFlexL: deg(96),
        shoulderPitchR: deg(76),
        shoulderYawR: deg(18),
        elbowFlexR: deg(96),
      },
    ],
  });

  registerScene("dumbbell-row", {
    view: "model3d",
    mode: "standing",
    camera: "side",
    zoom: 1.22,
    equipment: { type: "dumbbell_pair" },
    poses: [
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.92,
        rootZ: 0.06,
        torsoPitch: deg(62),
        shoulderPitchL: deg(58),
        shoulderYawL: deg(12),
        elbowFlexL: deg(18),
        shoulderPitchR: deg(58),
        shoulderYawR: deg(12),
        elbowFlexR: deg(18),
        hipPitchL: deg(54),
        hipPitchR: deg(54),
        kneeFlexL: deg(32),
        kneeFlexR: deg(32),
        footLX: -0.22,
        footRX: 0.22,
        footLZ: 0.08,
        footRZ: -0.08,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.92,
        rootZ: 0.06,
        torsoPitch: deg(62),
        shoulderPitchL: deg(12),
        shoulderYawL: deg(26),
        elbowFlexL: deg(104),
        shoulderPitchR: deg(12),
        shoulderYawR: deg(26),
        elbowFlexR: deg(104),
        hipPitchL: deg(54),
        hipPitchR: deg(54),
        kneeFlexL: deg(32),
        kneeFlexR: deg(32),
        footLX: -0.22,
        footRX: 0.22,
        footLZ: 0.08,
        footRZ: -0.08,
      },
      {
        ...NEUTRAL_POSES.model3d,
        pelvisY: 0.92,
        rootZ: 0.06,
        torsoPitch: deg(62),
        shoulderPitchL: deg(58),
        shoulderYawL: deg(12),
        elbowFlexL: deg(18),
        shoulderPitchR: deg(58),
        shoulderYawR: deg(12),
        elbowFlexR: deg(18),
        hipPitchL: deg(54),
        hipPitchR: deg(54),
        kneeFlexL: deg(32),
        kneeFlexR: deg(32),
        footLX: -0.22,
        footRX: 0.22,
        footLZ: 0.08,
        footRZ: -0.08,
      },
    ],
  });

  const api = {
    deg,
    lerp,
    pointFrom,
    easeInOut,
    mixPose,
    clampPose: sanitizePose,
    solve,
    sampleScene,
    createScene,
    registerScene,
    getScene,
    listScenes,
    getNeutralPose,
    getJointLimits,
  };

  global.HumanSkeletonJS = api;
  global.WorkoutSkeleton = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
