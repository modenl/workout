(function () {
  if (!window.PIXI || !window.WorkoutSkeleton) {
    window.WorkoutPixi = {
      render() {},
      play() {},
      stop() {},
    };
    return;
  }

  const COLORS = {
    bgTop: 0xfffcf8,
    bgBottom: 0xf1e4d8,
    ink: 0x1f232a,
    accent: 0xd86d42,
    soft: 0x5c8f84,
    paper: 0xfff9f3,
    shoe: 0xded7cf,
    shadow: 0x000000,
    line: 0xb8a99b,
  };

  const Skeleton = window.WorkoutSkeleton;
  const stages = {};

  function clonePose(pose) {
    return { ...pose };
  }

  function drawCapsule(graphics, a, b, width, color, alpha = 1) {
    graphics.lineStyle(width, color, alpha, 0.5, true);
    graphics.moveTo(a.x, a.y);
    graphics.lineTo(b.x, b.y);
  }

  function drawJoint(graphics, point, radius, fill, stroke, alpha = 1) {
    graphics.lineStyle(Math.max(2, radius * 0.33), stroke, alpha);
    graphics.beginFill(fill, alpha);
    graphics.drawCircle(point.x, point.y, radius);
    graphics.endFill();
  }

  function drawShadow(graphics, cx, cy, rx, ry) {
    graphics.beginFill(COLORS.shadow, 0.08);
    graphics.drawEllipse(cx, cy, rx, ry);
    graphics.endFill();
  }

  function drawGround(graphics, width, height) {
    graphics.lineStyle(2, COLORS.line, 0.65);
    graphics.moveTo(width * 0.18, height * 0.88);
    graphics.lineTo(width * 0.82, height * 0.88);
  }

  function drawBackdrop(graphics, width, height, scale, split = 0.46) {
    graphics.clear();
    graphics.beginFill(COLORS.bgTop, 1);
    graphics.drawRoundedRect(0, 0, width, height, 28 * scale);
    graphics.endFill();
    graphics.beginFill(COLORS.bgBottom, 0.92);
    graphics.drawRoundedRect(0, height * split, width, height * (1 - split), 28 * scale);
    graphics.endFill();
  }

  function drawShoe(graphics, ankle, angle, scale, side = 1) {
    const toe = Skeleton.pointFrom(ankle, angle, 30 * scale);
    const heel = Skeleton.pointFrom(ankle, angle + Math.PI, 10 * scale);
    const sideOffset = {
      x: Math.cos(angle - Math.PI / 2) * 7 * scale * side,
      y: Math.sin(angle - Math.PI / 2) * 7 * scale * side,
    };

    graphics.lineStyle(2.5 * scale, COLORS.ink, 1);
    graphics.beginFill(COLORS.shoe, 1);
    graphics.moveTo(heel.x - sideOffset.x, heel.y - sideOffset.y);
    graphics.lineTo(toe.x - sideOffset.x * 0.2, toe.y - sideOffset.y * 0.2);
    graphics.lineTo(toe.x + sideOffset.x, toe.y + sideOffset.y);
    graphics.lineTo(heel.x + sideOffset.x, heel.y + sideOffset.y);
    graphics.closePath();
    graphics.endFill();
  }

  function drawStandingFront(graphics, solved, width, height) {
    const { scale, points, angles } = solved;
    const {
      pelvis,
      shoulderCenter,
      head,
      shoulderL,
      shoulderR,
      elbowL,
      handL,
      elbowR,
      handR,
      hipL,
      hipR,
      kneeL,
      ankleL,
      kneeR,
      ankleR,
    } = points;

    drawBackdrop(graphics, width, height, scale, 0.45);
    drawShadow(graphics, width * 0.5, height * 0.87, 72 * scale, 12 * scale);
    drawGround(graphics, width, height);

    drawCapsule(graphics, pelvis, shoulderCenter, 18 * scale, COLORS.ink);
    drawCapsule(graphics, shoulderL, elbowL, 12 * scale, COLORS.accent);
    drawCapsule(graphics, elbowL, handL, 10 * scale, COLORS.accent);
    drawCapsule(graphics, shoulderR, elbowR, 12 * scale, COLORS.accent);
    drawCapsule(graphics, elbowR, handR, 10 * scale, COLORS.accent);
    drawCapsule(graphics, hipL, kneeL, 14 * scale, COLORS.soft);
    drawCapsule(graphics, kneeL, ankleL, 12 * scale, COLORS.soft);
    drawCapsule(graphics, hipR, kneeR, 14 * scale, COLORS.soft);
    drawCapsule(graphics, kneeR, ankleR, 12 * scale, COLORS.soft);

    graphics.lineStyle(6 * scale, COLORS.ink, 1);
    graphics.moveTo(shoulderL.x, shoulderL.y);
    graphics.lineTo(shoulderR.x, shoulderR.y);

    drawShoe(graphics, ankleL, angles.footL, scale, -1);
    drawShoe(graphics, ankleR, angles.footR, scale, 1);

    drawJoint(graphics, pelvis, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, shoulderCenter, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, shoulderL, 6 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, shoulderR, 6 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, elbowL, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, elbowR, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, hipL, 6 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, hipR, 6 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, kneeL, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, kneeR, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, ankleL, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, ankleR, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, head, 22 * scale, COLORS.paper, COLORS.ink);
  }

  function drawStandingSide(graphics, solved, width, height) {
    const { scale, points, angles } = solved;
    const {
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
    } = points;

    drawBackdrop(graphics, width, height, scale, 0.46);
    drawShadow(graphics, width * 0.56, height * 0.87, 82 * scale, 12 * scale);
    drawGround(graphics, width, height);

    drawCapsule(graphics, backHip, shoulder, 12 * scale, COLORS.ink, 0.32);
    drawCapsule(graphics, backShoulder, elbowBack, 10 * scale, COLORS.accent, 0.28);
    drawCapsule(graphics, elbowBack, handBack, 8 * scale, COLORS.accent, 0.28);
    drawCapsule(graphics, backHip, kneeBack, 12 * scale, COLORS.soft, 0.28);
    drawCapsule(graphics, kneeBack, ankleBack, 10 * scale, COLORS.soft, 0.28);

    drawCapsule(graphics, hip, shoulder, 18 * scale, COLORS.ink);
    drawCapsule(graphics, frontShoulder, elbowFront, 12 * scale, COLORS.accent);
    drawCapsule(graphics, elbowFront, handFront, 10 * scale, COLORS.accent);
    drawCapsule(graphics, frontHip, kneeFront, 15 * scale, COLORS.soft);
    drawCapsule(graphics, kneeFront, ankleFront, 12 * scale, COLORS.soft);

    drawShoe(graphics, ankleBack, angles.footBack, scale, -1);
    drawShoe(graphics, ankleFront, angles.footFront, scale, 1);

    drawJoint(graphics, hip, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, shoulder, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, elbowFront, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, kneeFront, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, ankleFront, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, head, 22 * scale, COLORS.paper, COLORS.ink);
  }

  function drawBurpee(graphics, solved, width, height) {
    const { scale, points, angles } = solved;
    const {
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
    } = points;

    drawBackdrop(graphics, width, height, scale, 0.46);
    drawShadow(graphics, width * 0.56, height * 0.86, 92 * scale, 12 * scale);
    drawGround(graphics, width, height);

    drawCapsule(graphics, hip, shoulder, 18 * scale, COLORS.ink);
    drawCapsule(graphics, backShoulder, elbowBack, 10 * scale, COLORS.accent, 0.52);
    drawCapsule(graphics, elbowBack, handBack, 8 * scale, COLORS.accent, 0.52);
    drawCapsule(graphics, frontShoulder, elbowFront, 12 * scale, COLORS.accent);
    drawCapsule(graphics, elbowFront, handFront, 10 * scale, COLORS.accent);

    drawCapsule(graphics, backHip, kneeBack, 13 * scale, COLORS.soft, 0.62);
    drawCapsule(graphics, kneeBack, ankleBack, 11 * scale, COLORS.soft, 0.62);
    drawCapsule(graphics, frontHip, kneeFront, 15 * scale, COLORS.soft);
    drawCapsule(graphics, kneeFront, ankleFront, 12 * scale, COLORS.soft);

    drawShoe(graphics, ankleBack, angles.footBack, scale, -1);
    drawShoe(graphics, ankleFront, angles.footFront, scale, 1);

    drawJoint(graphics, hip, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, shoulder, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, elbowFront, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, handFront, 4 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, elbowBack, 4.5 * scale, COLORS.paper, COLORS.accent, 0.6);
    drawJoint(graphics, handBack, 4 * scale, COLORS.paper, COLORS.accent, 0.6);
    drawJoint(graphics, kneeFront, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, ankleFront, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, kneeBack, 4.5 * scale, 0xf0faf6, COLORS.soft, 0.7);
    drawJoint(graphics, ankleBack, 4.5 * scale, 0xf0faf6, COLORS.soft, 0.7);
    drawJoint(graphics, head, 21 * scale, COLORS.paper, COLORS.ink);
  }

  function drawHang(graphics, solved, width, height) {
    const { scale, points, angles } = solved;
    const {
      shoulderCenter,
      pelvis,
      head,
      shoulderL,
      shoulderR,
      elbowL,
      handL,
      elbowR,
      handR,
      hipL,
      hipR,
      kneeL,
      ankleL,
      kneeR,
      ankleR,
    } = points;

    drawBackdrop(graphics, width, height, scale, 0.38);
    drawShadow(graphics, width * 0.5, height * 0.9, 68 * scale, 10 * scale);
    drawGround(graphics, width, height);

    graphics.lineStyle(6 * scale, COLORS.line, 0.85);
    graphics.moveTo(width * 0.28, height * 0.12);
    graphics.lineTo(width * 0.72, height * 0.12);

    drawCapsule(graphics, pelvis, shoulderCenter, 18 * scale, COLORS.ink);
    drawCapsule(graphics, shoulderL, elbowL, 12 * scale, COLORS.accent);
    drawCapsule(graphics, elbowL, handL, 10 * scale, COLORS.accent);
    drawCapsule(graphics, shoulderR, elbowR, 12 * scale, COLORS.accent);
    drawCapsule(graphics, elbowR, handR, 10 * scale, COLORS.accent);
    drawCapsule(graphics, hipL, kneeL, 14 * scale, COLORS.soft);
    drawCapsule(graphics, kneeL, ankleL, 12 * scale, COLORS.soft);
    drawCapsule(graphics, hipR, kneeR, 14 * scale, COLORS.soft);
    drawCapsule(graphics, kneeR, ankleR, 12 * scale, COLORS.soft);

    drawShoe(graphics, ankleL, angles.footL, scale, -1);
    drawShoe(graphics, ankleR, angles.footR, scale, 1);

    drawJoint(graphics, pelvis, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, shoulderCenter, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, elbowL, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, elbowR, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, handL, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, handR, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, kneeL, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, kneeR, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, ankleL, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, ankleR, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, head, 20 * scale, COLORS.paper, COLORS.ink);
  }

  function drawSupport(graphics, solved, width, height) {
    const { scale, points, angles } = solved;
    const {
      shoulderCenter,
      pelvis,
      head,
      shoulderL,
      shoulderR,
      elbowL,
      handL,
      elbowR,
      handR,
      hipL,
      hipR,
      kneeL,
      ankleL,
      kneeR,
      ankleR,
    } = points;

    drawBackdrop(graphics, width, height, scale, 0.44);
    drawShadow(graphics, width * 0.5, height * 0.88, 78 * scale, 10 * scale);
    drawGround(graphics, width, height);

    graphics.lineStyle(7 * scale, COLORS.line, 0.7);
    graphics.moveTo(width * 0.38, height * 0.28);
    graphics.lineTo(width * 0.38, height * 0.78);
    graphics.moveTo(width * 0.62, height * 0.28);
    graphics.lineTo(width * 0.62, height * 0.78);

    drawCapsule(graphics, pelvis, shoulderCenter, 18 * scale, COLORS.ink);
    drawCapsule(graphics, shoulderL, elbowL, 12 * scale, COLORS.accent);
    drawCapsule(graphics, elbowL, handL, 10 * scale, COLORS.accent);
    drawCapsule(graphics, shoulderR, elbowR, 12 * scale, COLORS.accent);
    drawCapsule(graphics, elbowR, handR, 10 * scale, COLORS.accent);
    drawCapsule(graphics, hipL, kneeL, 14 * scale, COLORS.soft);
    drawCapsule(graphics, kneeL, ankleL, 12 * scale, COLORS.soft);
    drawCapsule(graphics, hipR, kneeR, 14 * scale, COLORS.soft);
    drawCapsule(graphics, kneeR, ankleR, 12 * scale, COLORS.soft);

    drawShoe(graphics, ankleL, angles.footL, scale, -1);
    drawShoe(graphics, ankleR, angles.footR, scale, 1);

    drawJoint(graphics, pelvis, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, shoulderCenter, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, handL, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, handR, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, elbowL, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, elbowR, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, kneeL, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, kneeR, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, ankleL, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, ankleR, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, head, 20 * scale, COLORS.paper, COLORS.ink);
  }

  function drawSeated(graphics, solved, width, height) {
    const { scale, points, angles } = solved;
    const {
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
    } = points;

    drawBackdrop(graphics, width, height, scale, 0.5);
    drawShadow(graphics, width * 0.5, height * 0.88, 86 * scale, 10 * scale);
    drawGround(graphics, width, height);

    graphics.lineStyle(4 * scale, COLORS.line, 0.55);
    graphics.moveTo(width * 0.24, height * 0.8);
    graphics.lineTo(width * 0.76, height * 0.8);

    drawCapsule(graphics, pelvis, shoulderCenter, 18 * scale, COLORS.ink);
    drawCapsule(graphics, shoulderL, elbowL, 11 * scale, COLORS.accent);
    drawCapsule(graphics, elbowL, handL, 9 * scale, COLORS.accent);
    drawCapsule(graphics, shoulderR, elbowR, 11 * scale, COLORS.accent);
    drawCapsule(graphics, elbowR, handR, 9 * scale, COLORS.accent);
    drawCapsule(graphics, pelvis, kneeL, 14 * scale, COLORS.soft);
    drawCapsule(graphics, kneeL, ankleL, 12 * scale, COLORS.soft);
    drawCapsule(graphics, pelvis, kneeR, 14 * scale, COLORS.soft, 0.7);
    drawCapsule(graphics, kneeR, ankleR, 12 * scale, COLORS.soft, 0.7);

    drawShoe(graphics, ankleL, angles.footL, scale, -1);
    drawShoe(graphics, ankleR, angles.footR, scale, 1);

    drawJoint(graphics, pelvis, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, shoulderCenter, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, elbowL, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, elbowR, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, kneeL, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, kneeR, 5 * scale, 0xf0faf6, COLORS.soft, 0.75);
    drawJoint(graphics, ankleL, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, ankleR, 5 * scale, 0xf0faf6, COLORS.soft, 0.75);
    drawJoint(graphics, head, 20 * scale, COLORS.paper, COLORS.ink);
  }

  function resolveModelColor(token) {
    if (token === "ink") return COLORS.ink;
    if (token === "accent") return COLORS.accent;
    if (token === "soft") return COLORS.soft;
    if (token === "line") return COLORS.line;
    if (token === "shoe") return COLORS.shoe;
    if (token === "softFill") return 0xf0faf6;
    return COLORS.paper;
  }

  function projectModelPoint(point, solved, width, height) {
    const camera = solved.camera || { centerX: 0.5, groundY: 0.86, depth: 0.38, lift: 0.12 };
    const unit = solved.unit || 110 * solved.scale;
    let projected = { ...point };
    if (camera.yaw) {
      const cos = Math.cos(camera.yaw);
      const sin = Math.sin(camera.yaw);
      projected = {
        x: projected.x * cos + projected.z * sin,
        y: projected.y,
        z: -projected.x * sin + projected.z * cos,
      };
    }
    if (camera.pitch) {
      const cos = Math.cos(camera.pitch);
      const sin = Math.sin(camera.pitch);
      projected = {
        x: projected.x,
        y: projected.y * cos - projected.z * sin,
        z: projected.y * sin + projected.z * cos,
      };
    }
    return {
      x: width * camera.centerX + projected.x * unit + projected.z * unit * camera.depth,
      y: height * camera.groundY - projected.y * unit + projected.z * unit * camera.lift,
      z: projected.z,
    };
  }

  function drawModelLine(graphics, a, b, width, color, alpha = 1) {
    graphics.lineStyle(width, color, alpha, 0.5, true);
    graphics.moveTo(a.x, a.y);
    graphics.lineTo(b.x, b.y);
  }

  function drawModel3d(graphics, solved, width, height) {
    const scale = solved.scale;
    drawBackdrop(graphics, width, height, scale, 0.44);
    drawGround(graphics, width, height);

    const unit = solved.unit || 110 * scale;
    const shadow = solved.shadow || { center: { x: 0, y: 0, z: 0 }, rx: 0.3, rz: 0.12 };
    const shadowCenter = projectModelPoint(shadow.center, solved, width, height);
    drawShadow(graphics, shadowCenter.x, height * 0.88, shadow.rx * unit, shadow.rz * unit);

    const projected = {};
    Object.entries(solved.points || {}).forEach(([key, point]) => {
      projected[key] = projectModelPoint(point, solved, width, height);
    });

    (solved.props || [])
      .filter((prop) => prop.layer === "back")
      .forEach((prop) => {
        if (prop.type === "line") {
          drawModelLine(
            graphics,
            projectModelPoint(prop.a, solved, width, height),
            projectModelPoint(prop.b, solved, width, height),
            Math.max(3, prop.width * unit),
            resolveModelColor(prop.color || "line"),
            0.8
          );
        }
        if (prop.type === "barbell") {
          const a = projectModelPoint(prop.a, solved, width, height);
          const b = projectModelPoint(prop.b, solved, width, height);
          drawModelLine(graphics, a, b, Math.max(4, 0.045 * unit), COLORS.ink, 0.55);
          drawJoint(graphics, a, 0.08 * unit, COLORS.shoe, COLORS.ink, 0.55);
          drawJoint(graphics, b, 0.08 * unit, COLORS.shoe, COLORS.ink, 0.55);
        }
      });

    solved.segments
      .slice()
      .sort((left, right) => {
        const depthLeft = (solved.points[left.a].z + solved.points[left.b].z) * 0.5;
        const depthRight = (solved.points[right.a].z + solved.points[right.b].z) * 0.5;
        return depthLeft - depthRight;
      })
      .forEach((segment) => {
        drawModelLine(
          graphics,
          projected[segment.a],
          projected[segment.b],
          Math.max(3, segment.width * unit),
          resolveModelColor(segment.color),
          segment.alpha == null ? 1 : segment.alpha
        );
      });

    solved.joints
      .slice()
      .sort((left, right) => solved.points[left.key].z - solved.points[right.key].z)
      .forEach((joint) => {
        drawJoint(
          graphics,
          projected[joint.key],
          Math.max(4, joint.radius * unit),
          resolveModelColor(joint.fill),
          resolveModelColor(joint.stroke),
          joint.alpha == null ? 1 : joint.alpha
        );
      });

    (solved.props || [])
      .filter((prop) => prop.layer !== "back")
      .forEach((prop) => {
        if (prop.type === "line") {
          drawModelLine(
            graphics,
            projectModelPoint(prop.a, solved, width, height),
            projectModelPoint(prop.b, solved, width, height),
            Math.max(3, prop.width * unit),
            resolveModelColor(prop.color || "line"),
            0.92
          );
        }
        if (prop.type === "barbell") {
          const a = projectModelPoint(prop.a, solved, width, height);
          const b = projectModelPoint(prop.b, solved, width, height);
          drawModelLine(graphics, a, b, Math.max(4, 0.045 * unit), COLORS.ink, 0.96);
          drawJoint(graphics, a, 0.08 * unit, COLORS.shoe, COLORS.ink);
          drawJoint(graphics, b, 0.08 * unit, COLORS.shoe, COLORS.ink);
        }
        if (prop.type === "dumbbell") {
          const center = projectModelPoint(prop.center, solved, width, height);
          graphics.lineStyle(Math.max(3, 0.03 * unit), COLORS.ink, 1);
          graphics.moveTo(center.x - 0.09 * unit, center.y);
          graphics.lineTo(center.x + 0.09 * unit, center.y);
          drawJoint(graphics, { x: center.x - 0.09 * unit, y: center.y }, 0.05 * unit, COLORS.shoe, COLORS.ink);
          drawJoint(graphics, { x: center.x + 0.09 * unit, y: center.y }, 0.05 * unit, COLORS.shoe, COLORS.ink);
        }
        if (prop.type === "plate") {
          const center = projectModelPoint(prop.center, solved, width, height);
          drawJoint(graphics, center, 0.09 * unit, COLORS.paper, COLORS.ink);
          drawJoint(graphics, center, 0.034 * unit, COLORS.bgBottom, COLORS.line);
        }
      });
  }

  function drawQuadruped(graphics, solved, width, height, sceneId) {
    const { scale, points } = solved;
    const {
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
    } = points;
    const stretchMode = sceneId === "bird-dog";

    drawBackdrop(graphics, width, height, scale, 0.46);
    drawShadow(graphics, width * 0.54, height * 0.87, 92 * scale, 10 * scale);
    drawGround(graphics, width, height);

    drawCapsule(graphics, shoulder, spineMid, 16 * scale, COLORS.ink);
    drawCapsule(graphics, spineMid, hip, 16 * scale, COLORS.ink);
    drawCapsule(graphics, headBase, nose, 10 * scale, COLORS.ink);
    drawCapsule(graphics, shoulder, frontElbow, 12 * scale, COLORS.accent);
    drawCapsule(graphics, frontElbow, frontPaw, 10 * scale, COLORS.accent);
    drawCapsule(graphics, hip, rearKnee, 12 * scale, COLORS.soft);
    drawCapsule(graphics, rearKnee, rearPaw, 10 * scale, COLORS.soft);

    if (stretchMode) {
      drawCapsule(graphics, reachShoulder, reachElbow, 12 * scale, COLORS.accent, 0.88);
      drawCapsule(graphics, reachElbow, reachHand, 10 * scale, COLORS.accent, 0.88);
      drawCapsule(graphics, reachHip, reachKnee, 12 * scale, COLORS.soft, 0.88);
      drawCapsule(graphics, reachKnee, reachFoot, 10 * scale, COLORS.soft, 0.88);
    }

    drawJoint(graphics, shoulder, 6 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, spineMid, 6 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, hip, 6 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, frontElbow, 5 * scale, COLORS.paper, COLORS.accent);
    drawJoint(graphics, rearKnee, 5 * scale, 0xf0faf6, COLORS.soft);

    if (stretchMode) {
      drawJoint(graphics, reachElbow, 5 * scale, COLORS.paper, COLORS.accent);
      drawJoint(graphics, reachKnee, 5 * scale, 0xf0faf6, COLORS.soft);
    }

    drawJoint(graphics, nose, 18 * scale, COLORS.paper, COLORS.ink);
  }

  function drawSupine(graphics, solved, width, height, sceneId) {
    const { scale, points, angles } = solved;
    const {
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
    } = points;
    const extendMode = sceneId === "dead-bug";

    drawBackdrop(graphics, width, height, scale, 0.46);
    drawShadow(graphics, width * 0.5, height * 0.86, 100 * scale, 10 * scale);
    drawGround(graphics, width, height);

    drawCapsule(graphics, shoulder, hip, 18 * scale, COLORS.ink);
    drawCapsule(graphics, shoulder, elbow, 10 * scale, COLORS.accent, 0.38);
    drawCapsule(graphics, elbow, hand, 8 * scale, COLORS.accent, 0.38);
    drawCapsule(graphics, hip, knee, 14 * scale, COLORS.soft);
    drawCapsule(graphics, knee, ankle, 12 * scale, COLORS.soft);

    if (extendMode) {
      drawCapsule(graphics, reachShoulder, reachElbow, 10 * scale, COLORS.accent, 0.92);
      drawCapsule(graphics, reachElbow, reachHand, 8 * scale, COLORS.accent, 0.92);
      drawCapsule(graphics, reachHip, reachKnee, 14 * scale, COLORS.soft, 0.92);
      drawCapsule(graphics, reachKnee, reachFoot, 12 * scale, COLORS.soft, 0.92);
    }

    drawShoe(graphics, ankle, angles.foot, scale, 1);
    if (extendMode) {
      drawShoe(graphics, reachFoot, angles.reachFoot, scale, 1);
    }

    drawJoint(graphics, shoulder, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, hip, 7 * scale, COLORS.paper, COLORS.ink);
    drawJoint(graphics, knee, 5 * scale, 0xf0faf6, COLORS.soft);
    drawJoint(graphics, ankle, 5 * scale, 0xf0faf6, COLORS.soft);
    if (extendMode) {
      drawJoint(graphics, reachKnee, 5 * scale, 0xf0faf6, COLORS.soft);
    }
    drawJoint(graphics, head, 20 * scale, COLORS.paper, COLORS.ink);
  }

  const VIEW_RENDERERS = {
    front: drawStandingFront,
    side: drawStandingSide,
    burpee: drawBurpee,
    hang: drawHang,
    support: drawSupport,
    seated: drawSeated,
    quadruped: drawQuadruped,
    supine: drawSupine,
    model3d: drawModel3d,
  };

  function destroyStage(slot) {
    const stage = stages[slot];
    if (!stage) return;

    if (stage.tween) {
      stage.app.ticker.remove(stage.tween);
      stage.tween = null;
    }

    if (stage.app && stage.app.view && stage.app.view.parentNode) {
      stage.app.view.parentNode.removeChild(stage.app.view);
    }

    stage.app.destroy(true, { children: true });
    delete stages[slot];
  }

  function ensureStage(slot, host) {
    const existing = stages[slot];
    if (existing && existing.host !== host) {
      destroyStage(slot);
    }

    if (stages[slot]) {
      return stages[slot];
    }

    const app = new PIXI.Application({
      resizeTo: host,
      autoDensity: true,
      antialias: true,
      backgroundAlpha: 0,
    });
    host.appendChild(app.view);

    const root = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    root.addChild(graphics);
    app.stage.addChild(root);

    stages[slot] = {
      app,
      host,
      root,
      graphics,
      sceneId: null,
      currentPose: null,
      cycleToken: 0,
      tween: null,
    };

    return stages[slot];
  }

  function renderPose(stage, exercise, rawPose) {
    const scene = Skeleton.getScene(exercise.scene);
    if (!scene) return;

    const pose = Skeleton.clampPose(scene.view, rawPose);
    const width = stage.host.clientWidth || 420;
    const height = stage.host.clientHeight || 320;
    stage.app.renderer.resize(width, height);
    const solved = Skeleton.solve(scene.view, pose, { width, height, sceneId: exercise.scene });
    const renderer = VIEW_RENDERERS[scene.view];
    if (!renderer) return;

    stage.sceneId = exercise.scene;
    stage.currentPose = clonePose(pose);
    renderer(stage.graphics, solved, width, height, exercise.scene);
  }

  function render(slot, host, exercise) {
    const stage = ensureStage(slot, host);
    const scene = Skeleton.getScene(exercise.scene);
    if (!scene) return;
    renderPose(stage, exercise, scene.poses[0]);
  }

  function stop(slot) {
    const stage = stages[slot];
    if (!stage) return;

    stage.cycleToken += 1;
    if (stage.tween) {
      stage.app.ticker.remove(stage.tween);
      stage.tween = null;
    }
  }

  function tweenPose(slot, exercise, targetPose, duration, onComplete) {
    const stage = stages[slot];
    const scene = Skeleton.getScene(exercise.scene);
    if (!stage || !scene) return;

    const fromPose = clonePose(stage.currentPose || targetPose);
    const startedAt = performance.now();
    const total = Math.max(160, duration);

    if (stage.tween) {
      stage.app.ticker.remove(stage.tween);
      stage.tween = null;
    }

    stage.tween = () => {
      const elapsed = performance.now() - startedAt;
      const t = Math.min(1, elapsed / total);
      const blended = Skeleton.mixPose(scene.view, fromPose, targetPose, Skeleton.easeInOut(t));
      renderPose(stage, exercise, blended);

      if (t >= 1) {
        stage.app.ticker.remove(stage.tween);
        stage.tween = null;
        renderPose(stage, exercise, targetPose);
        if (typeof onComplete === "function") onComplete();
      }
    };

    stage.app.ticker.add(stage.tween);
  }

  function play(slot, host, exercise, cycle, { loop = false, onCycleEnd, onSound } = {}) {
    const stage = ensureStage(slot, host);
    const scene = Skeleton.getScene(exercise.scene);
    if (!scene) return;

    stop(slot);
    renderPose(stage, exercise, scene.poses[0]);

    const token = ++stage.cycleToken;
    let index = 0;

    const runPhase = () => {
      if (!stages[slot] || stages[slot].cycleToken !== token) return;

      const phase = cycle[index] || { step: 0, ratio: 1 };
      const targetPose = scene.poses[Math.min(phase.step, scene.poses.length - 1)];

      if (phase.sound && typeof onSound === "function") {
        onSound(phase.sound);
      }

      tweenPose(slot, exercise, targetPose, exercise.tempoMs * phase.ratio, () => {
        if (!stages[slot] || stages[slot].cycleToken !== token) return;

        index += 1;
        if (index >= cycle.length) {
          if (typeof onCycleEnd === "function") onCycleEnd();
          if (!loop) return;
          index = 0;
        }
        runPhase();
      });
    };

    runPhase();
  }

  window.WorkoutPixi = {
    render,
    play,
    stop,
  };
})();
