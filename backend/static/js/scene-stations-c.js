// Stations: Car Pulse (AutoFeel), Facial Recognition, IoT Gas Leak, Experience timeline.
import { easeOutCubic, easeInOut, approach, damp, tilt, fillRound, roundRectPath, text, sculptHead } from "./scene-kit.js";

/* ------------------------------------------------------------------------ */
/* Car Pulse — a smooth car on a turntable, sentiment gauge, review bubbles  */
/* ------------------------------------------------------------------------ */

export function buildAutoFeel(kit) {
  const { THREE, M, rbox, coarse } = kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  // Turntable.
  const tableProfile = [
    [0, 0],
    [2.7, 0],
    [2.78, 0.06],
    [2.72, 0.18],
    [0, 0.18],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const turntable = new THREE.Group();
  turntable.add(new THREE.Mesh(kit.track(new THREE.LatheGeometry(tableProfile, 64)), M.shell2));
  const tableRing = new THREE.Mesh(kit.track(new THREE.TorusGeometry(2.55, 0.022, 8, 96)), M.glowPrimary);
  tableRing.rotation.x = Math.PI / 2;
  tableRing.position.y = 0.185;
  turntable.add(tableRing);
  turntable.position.set(-1.5, 0, 0);
  pivot.add(turntable, kit.shadow(7, 7, 0));
  turntable.children[0].position.y = 0;

  // Car body: a side profile with wheel arches, bevelled and tapered toward the roof.
  const profile = new THREE.Shape();
  profile.moveTo(-2.25, 0.34);
  profile.lineTo(-1.88, 0.34);
  profile.absarc(-1.36, 0.34, 0.5, Math.PI, 0, true);
  profile.lineTo(0.86, 0.34);
  profile.absarc(1.38, 0.34, 0.5, Math.PI, 0, true);
  profile.lineTo(2.18, 0.34);
  profile.quadraticCurveTo(2.36, 0.36, 2.36, 0.58);
  profile.lineTo(2.3, 0.82);
  profile.quadraticCurveTo(2.22, 0.98, 1.9, 1.02);
  profile.lineTo(0.92, 1.12);
  profile.quadraticCurveTo(0.48, 1.62, -0.12, 1.66);
  profile.lineTo(-0.92, 1.64);
  profile.quadraticCurveTo(-1.55, 1.56, -1.98, 1.12);
  profile.lineTo(-2.24, 1.04);
  profile.quadraticCurveTo(-2.38, 0.96, -2.36, 0.7);
  profile.lineTo(-2.25, 0.34);
  const DEPTH = 1.72;
  const bodyGeometry = new THREE.ExtrudeGeometry(profile, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.1,
    bevelSegments: coarse ? 3 : 5,
    curveSegments: coarse ? 14 : 24,
  });
  bodyGeometry.translate(0, 0, -DEPTH / 2);
  const taper = (geometry, extra = 1) => {
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i += 1) {
      const x = p.getX(i);
      const y = p.getY(i);
      let z = p.getZ(i);
      const roof = Math.min(1, Math.max(0, (y - 0.95) / 0.75));
      z *= 1 - 0.24 * roof * roof;
      z *= 1 - 0.1 * Math.pow(Math.min(1, Math.abs(x) / 2.4), 6);
      z *= 1 - 0.05 * Math.max(0, (0.55 - y) / 0.25); // tuck in the sills
      p.setZ(i, z * extra);
    }
    geometry.computeVertexNormals();
  };
  taper(bodyGeometry);
  const car = new THREE.Group();
  const carMat = kit.mat({ role: "primary", rough: 0.24, metal: 0.25, physical: true, clearcoat: 1 });
  car.add(new THREE.Mesh(kit.track(bodyGeometry), carMat));

  // Glasshouse: an inset window band that sits just proud of the tapered body.
  const glassShape = new THREE.Shape();
  glassShape.moveTo(0.86, 1.16);
  glassShape.quadraticCurveTo(0.46, 1.58, -0.12, 1.6);
  glassShape.lineTo(-0.9, 1.58);
  glassShape.quadraticCurveTo(-1.48, 1.52, -1.86, 1.16);
  glassShape.lineTo(0.86, 1.16);
  const glassGeometry = new THREE.ExtrudeGeometry(glassShape, { depth: DEPTH + 0.2, bevelEnabled: false, curveSegments: 16 });
  glassGeometry.translate(0, 0, -(DEPTH + 0.2) / 2);
  taper(glassGeometry, 1.0);
  car.add(new THREE.Mesh(kit.track(glassGeometry), M.screenOff));
  const pillar = new THREE.Mesh(rbox(0.1, 0.5, DEPTH * 0.8, 0.03, 1), carMat);
  pillar.position.set(-0.42, 1.38, 0);
  car.add(pillar);

  // Lights, grille, mirrors.
  [-0.56, 0.56].forEach((z) => {
    const head = new THREE.Mesh(rbox(0.1, 0.13, 0.42, 0.04, 1), M.glow);
    head.position.set(2.4, 0.78, z);
    head.rotation.y = z > 0 ? -0.2 : 0.2;
    const tail = new THREE.Mesh(rbox(0.08, 0.12, 0.4, 0.04, 1), M.glowPrimary);
    tail.position.set(-2.42, 0.86, z);
    const mirror = new THREE.Mesh(rbox(0.16, 0.1, 0.16, 0.04, 1), carMat);
    mirror.position.set(0.78, 1.18, z * 1.72);
    car.add(head, tail, mirror);
  });
  const grille = new THREE.Mesh(rbox(0.08, 0.16, 0.9, 0.04, 1), M.trim);
  grille.position.set(2.43, 0.52, 0);
  const sill = new THREE.Mesh(rbox(2.2, 0.08, DEPTH + 0.16, 0.04, 1), M.trim);
  sill.position.set(-0.03, 0.36, 0);
  car.add(grille, sill);

  // Wheels.
  const tire = kit.track(new THREE.TorusGeometry(0.34, 0.13, coarse ? 10 : 14, coarse ? 22 : 32));
  const rim = kit.track(new THREE.CylinderGeometry(0.28, 0.28, 0.14, coarse ? 18 : 28, 1).rotateX(Math.PI / 2));
  const spoke = rbox(0.5, 0.06, 0.05, 0.02, 1);
  const wheels = [];
  [
    [-1.36, 0.86],
    [1.38, 0.86],
    [-1.36, -0.86],
    [1.38, -0.86],
  ].forEach(([x, z]) => {
    const wheel = new THREE.Group();
    wheel.add(new THREE.Mesh(tire, M.trim));
    wheel.add(new THREE.Mesh(rim, M.steel));
    for (let k = 0; k < 5; k += 1) {
      const s = new THREE.Mesh(spoke, M.shell);
      s.rotation.z = (k / 5) * Math.PI;
      s.position.z = Math.sign(z) * 0.075;
      wheel.add(s);
    }
    const cap = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16, 1).rotateX(Math.PI / 2)), M.glow);
    cap.position.z = Math.sign(z) * 0.09;
    wheel.add(cap);
    wheel.position.set(x, 0.46, z);
    car.add(wheel);
    wheels.push(wheel);
  });
  car.position.y = 0.18;
  car.scale.setScalar(0.82);
  turntable.add(car);

  // Sentiment gauge (blue intensity: light = negative, sky = neutral, deep = positive).
  const gauge = new THREE.Group();
  const segmentShape = (a0, a1) => {
    const s = new THREE.Shape();
    s.absarc(0, 0, 1.25, a0, a1, false);
    s.absarc(0, 0, 0.92, a1, a0, true);
    s.closePath();
    return s;
  };
  const segmentMats = [M.ice, M.sky, M.primary];
  [0, 1, 2].forEach((k) => {
    const a0 = Math.PI - (k + 1) * (Math.PI / 3) + 0.03;
    const a1 = Math.PI - k * (Math.PI / 3) - 0.03;
    const geometry = kit.track(
      new THREE.ExtrudeGeometry(segmentShape(a0, a1), { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 20 })
    );
    gauge.add(new THREE.Mesh(geometry, segmentMats[k]));
  });
  const gaugeBack = new THREE.Mesh(rbox(3.0, 1.75, 0.06, 0.12), M.glass);
  gaugeBack.position.set(0, 0.45, -0.06);
  gauge.add(gaugeBack);
  const needlePivot = new THREE.Group();
  needlePivot.position.z = 0.2;
  const needle = new THREE.Mesh(rbox(0.07, 1.1, 0.05, 0.025, 1), M.trim);
  needle.position.y = 0.52;
  const needleTip = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.06, 12, 8)), M.glow);
  needleTip.position.y = 1.06;
  needlePivot.add(needle, needleTip);
  gauge.add(needlePivot);
  const hubMesh = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 24, 1).rotateX(Math.PI / 2)), M.steel);
  hubMesh.position.z = 0.2;
  gauge.add(hubMesh);
  const labels = kit.screen(2.8, 0.34, (ctx, W, H, pal) => {
    text(ctx, "NEGATIVE", 110, H / 2, { size: 50, weight: 500, color: pal.muted, mono: true, align: "center" });
    text(ctx, "NEUTRAL", 500, H / 2, { size: 50, weight: 500, color: pal.muted, mono: true, align: "center" });
    text(ctx, "POSITIVE", 890, H / 2, { size: 50, weight: 600, color: pal.primary, mono: true, align: "center" });
  }, { px: 200, transparent: true });
  labels.mesh.position.set(0, -0.22, 0.05);
  gauge.add(labels.mesh);
  gauge.position.set(2.75, 1.55, 0.3);
  gauge.rotation.y = -0.3;
  gauge.scale.setScalar(0.82);
  pivot.add(gauge);

  // Review bubbles.
  const REVIEWS = [
    { label: "POSITIVE", line: "Smooth ride, great mileage", tone: 2 },
    { label: "NEUTRAL", line: "Average cabin space", tone: 1 },
    { label: "NEGATIVE", line: "Infotainment feels slow", tone: 0 },
  ];
  const bubbles = REVIEWS.map((review, i) => {
    const bubble = new THREE.Group();
    const face = kit.screen(1.9, 0.62, (ctx, W, H, pal) => {
      const fills = [pal.screen, pal.screen2, pal.primary];
      const inks = [pal.ink, pal.ink, "#FFFFFF"];
      fillRound(ctx, 0, 0, W, H - 50, 70, fills[review.tone]);
      ctx.fillStyle = fills[review.tone];
      ctx.beginPath();
      ctx.moveTo(140, H - 52);
      ctx.lineTo(120, H);
      ctx.lineTo(230, H - 52);
      ctx.fill();
      if (review.tone === 0) {
        ctx.lineWidth = 8;
        ctx.strokeStyle = pal.line;
        roundRectPath(ctx, 4, 4, W - 8, H - 58, 66);
        ctx.stroke();
      }
      text(ctx, review.label, 70, 80, { size: 44, weight: 600, color: review.tone === 2 ? "#DBEAFE" : pal.muted, mono: true });
      text(ctx, review.line, 70, 180, { size: 64, weight: 600, color: inks[review.tone] });
    }, { px: 220, transparent: true, doubleSide: false });
    bubble.add(face.mesh);
    const positions = [
      [-2.7, 2.75, 0.5],
      [-0.6, 3.25, -0.5],
      [0.9, 2.55, 1.2],
    ];
    bubble.position.set(...positions[i]);
    bubble.scale.setScalar(1.3);
    bubble.rotation.y = 0.12 - i * 0.12;
    bubble.userData.baseY = positions[i][1];
    pivot.add(bubble);
    return bubble;
  });

  const REST = Math.PI / 2 - 0.12;
  const VALUE = -0.62;
  needlePivot.rotation.z = REST;
  let swing = 0;
  let clock = 0;
  return {
    group,
    bounds: [
      [-4.4, 0, -2.2],
      [4.2, 4.0, 2.2],
    ],
    update(dt, ctx) {
      let moving = tilt(pivot, dt, ctx, 0.08);
      let swinging;
      [swing, swinging] = approach(swing, ctx.near < 0.9 ? 1 : 0, dt / (ctx.near < 0.9 ? 1.4 : 0.4));
      const x = swing;
      const back = 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
      needlePivot.rotation.z = REST + (VALUE - REST) * back;
      if (ctx.near < 0.9 && ctx.ambient) {
        clock += dt;
        turntable.rotation.y += dt * 0.25;
        bubbles.forEach((bubble, i) => {
          bubble.position.y = bubble.userData.baseY + Math.sin(clock * 1.3 + i * 1.7) * 0.07;
        });
        moving = true;
      }
      return moving || swinging;
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Facial Recognition — sculpted bust, scan plane, landmarks, lock-on frame */
/* ------------------------------------------------------------------------ */

export function buildFace(kit) {
  const { THREE, M, rbox, coarse } = kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  const plinth = new THREE.Mesh(rbox(2.2, 0.3, 1.6, 0.1), M.shell2);
  plinth.position.y = 0.15;
  pivot.add(plinth, kit.shadow(3.4, 2.6, 0));

  // Bust: shoulders (lathe), neck, sculpted head.
  const bustProfile = [
    [0, 0],
    [1.25, 0],
    [1.3, 0.08],
    [1.2, 0.36],
    [0.92, 0.62],
    [0.52, 0.82],
    [0.36, 0.96],
    [0, 0.98],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bustGeometry = new THREE.LatheGeometry(bustProfile, coarse ? 32 : 48);
  bustGeometry.scale(1, 1, 0.58);
  bustGeometry.computeVertexNormals();
  const skin = kit.mat({ role: "shell", rough: 0.36, metal: 0.05, physical: true, clearcoat: 0.35 });
  const bust = new THREE.Mesh(kit.track(bustGeometry), skin);
  bust.position.y = 0.3;
  pivot.add(bust);
  const neck = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.3, 0.36, 0.75, 32, 1)), skin);
  neck.position.set(0, 1.5, -0.04);
  pivot.add(neck);

  const headGeometry = new THREE.SphereGeometry(1, coarse ? 56 : 80, coarse ? 42 : 64);
  const surface = sculptHead(headGeometry);
  kit.track(headGeometry);
  const head = new THREE.Group();
  const headMesh = new THREE.Mesh(headGeometry, skin);
  head.add(headMesh);
  const HEAD_SCALE = 0.78;
  head.scale.setScalar(HEAD_SCALE);
  head.position.set(0, 2.42, 0.02);
  pivot.add(head);

  // Landmarks on the face (unit-sphere directions → sculpted surface).
  const marks = [
    [-0.42, 0.09], [-0.18, 0.09], [0.18, 0.09], [0.42, 0.09], // eye corners
    [-0.3, 0.25], [0.3, 0.25], [0, 0.22], // brows
    [0, 0.05], [0, -0.14], [0, -0.28], [-0.1, -0.31], [0.1, -0.31], // nose
    [-0.2, -0.54], [0.2, -0.54], [0, -0.49], [0, -0.6], // mouth
    [0, -0.82], [-0.34, -0.66], [0.34, -0.66], [-0.55, -0.35], [0.55, -0.35], // jaw
    [-0.5, 0.08], [0.5, 0.08], [-0.45, -0.1], [0.45, -0.1], // cheeks
  ];
  const markPoints = marks.map(([u, v]) => {
    const z = Math.sqrt(Math.max(0.02, 1 - u * u - v * v));
    return surface(u, v, z).multiplyScalar(1.015);
  });
  const dotGeometry = kit.track(new THREE.SphereGeometry(0.028, 10, 8));
  const dots = new THREE.InstancedMesh(dotGeometry, M.accentFill, markPoints.length);
  head.add(dots);
  const links = [
    [0, 1], [2, 3], [4, 6], [6, 5], [1, 7], [2, 7], [7, 8], [8, 9], [9, 10], [9, 11],
    [12, 14], [14, 13], [13, 15], [15, 12], [15, 16], [16, 17], [16, 18], [17, 19], [18, 20],
    [19, 23], [20, 24], [23, 21], [24, 22], [21, 0], [22, 3], [10, 12], [11, 13],
  ];
  const linkValues = [];
  links.forEach(([a, b]) => {
    linkValues.push(...markPoints[a].toArray(), ...markPoints[b].toArray());
  });
  const meshLines = new THREE.LineSegments(kit.lineGeometry(linkValues), kit.line("accent", { transparent: true, opacity: 0 }));
  head.add(meshLines);
  const m4 = new THREE.Matrix4();
  const setMarks = (reveal) => {
    markPoints.forEach((point, i) => {
      const worldY = point.y; // head space: +1 top, -1 chin
      const shown = reveal >= 1 ? 1 : Math.min(1, Math.max(0, ((1 - worldY) / 2 - (1 - reveal) * 1.2 + 0.2) * 5));
      m4.makeScale(shown, shown, shown).setPosition(point);
      dots.setMatrixAt(i, m4);
    });
    dots.instanceMatrix.needsUpdate = true;
    meshLines.material.opacity = Math.max(0, (reveal - 0.5) * 2) * 0.7;
  };
  setMarks(0);

  // Scan plane.
  const scan = new THREE.Group();
  const scanPlane = new THREE.Mesh(kit.track(new THREE.PlaneGeometry(2.3, 1.9).rotateX(-Math.PI / 2)), kit.basic("accent", { transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  const scanEdge = new THREE.Mesh(rbox(2.3, 0.02, 0.03, 0.01, 1), M.accentFill);
  scanEdge.position.z = 0.95;
  scan.add(scanPlane, scanEdge);
  scan.position.set(0, 2.4, 0.1);
  pivot.add(scan);

  // Detection frame with corner brackets.
  const frame = new THREE.Group();
  const HW = 0.95;
  const HH = 1.12;
  const ARM = 0.34;
  const barH = rbox(ARM, 0.05, 0.04, 0.02, 1);
  const barV = rbox(0.05, ARM, 0.04, 0.02, 1);
  [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ].forEach(([sx, sy]) => {
    const h = new THREE.Mesh(barH, M.glowPrimary);
    h.position.set(sx * (HW - ARM / 2), sy * HH, 0);
    const v = new THREE.Mesh(barV, M.glowPrimary);
    v.position.set(sx * HW, sy * (HH - ARM / 2), 0);
    frame.add(h, v);
  });
  const tag = kit.screen(1.2, 0.3, (ctx, W, H, pal) => {
    fillRound(ctx, 0, 0, W, H, H / 2, pal.primary);
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(H / 2, H / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, "MATCH · LBPH", H + 20, H / 2 + 4, { size: 92, weight: 600, color: "#FFFFFF", mono: true });
  }, { px: 240, transparent: true });
  tag.mesh.position.set(-HW + 0.6, HH + 0.28, 0);
  frame.add(tag.mesh);
  frame.position.set(0, 2.36, 1.05);
  pivot.add(frame);

  let lock = 0;
  let clock = 0;
  return {
    group,
    bounds: [
      [-1.6, 0, -1.1],
      [1.6, 3.9, 1.3],
    ],
    update(dt, ctx) {
      let moving = tilt(pivot, dt, ctx, 0.12);
      let locking;
      [lock, locking] = approach(lock, ctx.near < 0.9 ? 1 : 0, dt / (ctx.near < 0.9 ? 2.0 : 0.4));
      const t = lock;
      const scanT = Math.min(1, t / 0.7);
      scan.position.y = 3.35 - 1.95 * easeInOut(scanT);
      scan.visible = t > 0 && t < 0.75;
      setMarks(scanT);
      const frameT = easeOutCubic((t - 0.55) / 0.45);
      frame.scale.setScalar(1.35 - 0.35 * frameT);
      frame.visible = t > 0.4;
      tag.mesh.visible = t > 0.95;
      head.rotation.y = -0.55 + 0.55 * easeInOut(t);
      if (ctx.near < 0.9 && ctx.ambient && t >= 1) {
        clock += dt;
        head.rotation.y = Math.sin(clock * 0.6) * 0.08;
        frame.scale.setScalar(1 + Math.sin(clock * 2.2) * 0.01);
        moving = true;
      }
      return moving || locking;
    },
  };
}

/* ------------------------------------------------------------------------ */
/* IoT Gas Leak — gas cylinder with valve, sensor PCB, alert beacon + rings  */
/* ------------------------------------------------------------------------ */

export function buildIot(kit) {
  const { THREE, M, rbox, coarse } = kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);
  const pad = new THREE.Mesh(rbox(6.4, 0.14, 3.4, 0.07), M.shell2);
  pad.position.y = -0.07;
  pivot.add(pad, kit.shadow(8, 5, -0.14));

  // Gas cylinder.
  const cylProfile = [
    [0, 0],
    [0.6, 0],
    [0.66, 0.04],
    [0.64, 0.18],
    [0.72, 0.26],
    [0.74, 0.36],
    [0.74, 2.3],
    [0.7, 2.55],
    [0.56, 2.75],
    [0.34, 2.88],
    [0.2, 2.93],
    [0, 2.94],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const cylinder = new THREE.Group();
  cylinder.add(new THREE.Mesh(kit.track(new THREE.LatheGeometry(cylProfile, coarse ? 36 : 56)), kit.mat({ role: "primary", rough: 0.28, metal: 0.2, physical: true, clearcoat: 0.9 })));
  const label = kit.screen(2.4, 0.6, (ctx, W, H, pal) => {
    ctx.fillStyle = pal.screen;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = pal.deep;
    ctx.fillRect(0, 0, W, 26);
    ctx.fillRect(0, H - 26, W, 26);
    text(ctx, "GAS", 250, H / 2 + 6, { size: 150, weight: 700, color: pal.ink, align: "center" });
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.moveTo(560, 70);
    ctx.lineTo(640, 200);
    ctx.lineTo(480, 200);
    ctx.closePath();
    ctx.fill();
    text(ctx, "!", 560, 160, { size: 90, weight: 700, color: pal.screen, align: "center" });
  }, { px: 220 });
  const band = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.752, 0.752, 0.6, 48, 1, true)), label.mesh.material);
  band.position.y = 1.45;
  band.rotation.y = -Math.PI / 2 - 0.3;
  cylinder.add(band);
  // Valve.
  const neck = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.15, 0.17, 0.28, 24, 1)), M.steel);
  neck.position.y = 3.05;
  const valveBody = new THREE.Mesh(rbox(0.34, 0.3, 0.34, 0.06), M.steel);
  valveBody.position.y = 3.3;
  const outlet = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 16, 1).rotateZ(Math.PI / 2)), M.steel);
  outlet.position.set(0.3, 3.28, 0);
  const nut = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 6, 1).rotateZ(Math.PI / 2)), M.trim);
  nut.position.set(0.52, 3.28, 0);
  const wheelGroup = new THREE.Group();
  const handwheel = new THREE.Mesh(kit.track(new THREE.TorusGeometry(0.24, 0.045, 10, 32)), M.trim);
  handwheel.rotation.x = Math.PI / 2;
  wheelGroup.add(handwheel);
  [0, 1, 2].forEach((k) => {
    const spoke = new THREE.Mesh(rbox(0.46, 0.04, 0.04, 0.015, 1), M.trim);
    spoke.rotation.y = (k / 3) * Math.PI;
    wheelGroup.add(spoke);
  });
  wheelGroup.position.y = 3.56;
  const stem = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 10, 1)), M.steel);
  stem.position.y = 3.48;
  cylinder.add(neck, valveBody, outlet, nut, stem, wheelGroup);
  cylinder.position.set(-0.3, 0, -0.2);
  pivot.add(cylinder);

  // Gas wisps drifting from the outlet while active.
  const wisps = Array.from({ length: 6 }, (_, k) => {
    const sprite = kit.glow("sky", 0.4);
    sprite.userData.offset = k / 6;
    sprite.visible = false;
    pivot.add(sprite);
    return sprite;
  });

  // Sensor board on a stand.
  const sensor = new THREE.Group();
  const post = new THREE.Mesh(rbox(0.1, 1.4, 0.1, 0.03, 1), M.steel);
  post.position.y = 0.7;
  sensor.add(post);
  const foot = new THREE.Mesh(rbox(0.7, 0.06, 0.5, 0.03, 1), M.steel);
  foot.position.y = 0.03;
  sensor.add(foot);
  const board = new THREE.Group();
  board.add(new THREE.Mesh(rbox(1.5, 1.05, 0.06, 0.05), M.deep));
  const traces = kit.screen(1.42, 0.98, (ctx, W, H, pal) => {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(186, 230, 253, 0.55)";
    ctx.lineWidth = 7;
    for (let k = 0; k < 9; k += 1) {
      const y = 70 + k * 72;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(260 + (k % 4) * 60, y);
      ctx.lineTo(320 + (k % 4) * 60, y + 36);
      ctx.lineTo(W - 40, y + 36);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(224, 242, 254, 0.8)";
    for (let k = 0; k < 12; k += 1) {
      ctx.beginPath();
      ctx.arc(60 + k * 78, H - 40, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, "GAS SENSOR NODE", W - 50, 40, { size: 34, weight: 600, color: "rgba(224,242,254,0.85)", mono: true, align: "right" });
    void pal;
  }, { px: 240, transparent: true });
  traces.mesh.position.z = 0.032;
  board.add(traces.mesh);
  const mcu = new THREE.Mesh(rbox(0.36, 0.36, 0.08, 0.02, 1), M.trim);
  mcu.position.set(-0.3, 0.1, 0.07);
  const chip2 = new THREE.Mesh(rbox(0.22, 0.14, 0.06, 0.02, 1), M.trim);
  chip2.position.set(0.15, -0.22, 0.06);
  const sensorCan = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.19, 0.19, 0.18, 28, 1).rotateX(Math.PI / 2)), M.steel);
  sensorCan.position.set(0.38, 0.14, 0.12);
  const sensorMesh = new THREE.Mesh(kit.track(new THREE.CircleGeometry(0.15, 28)), M.trim);
  sensorMesh.position.set(0.38, 0.14, 0.215);
  const ledMat = kit.mat({ role: "accent", rough: 0.3, metal: 0, emissive: "accent", emissiveIntensity: 0.4 });
  const led = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.05, 12, 8)), ledMat);
  led.position.set(-0.58, -0.36, 0.07);
  const pins = new THREE.InstancedMesh(rbox(0.04, 0.12, 0.04, 0.01, 1), M.steel, 10);
  const m4 = new THREE.Matrix4();
  for (let k = 0; k < 10; k += 1) {
    m4.makeTranslation(-0.6 + k * 0.1, -0.44, 0.08);
    pins.setMatrixAt(k, m4);
  }
  const antenna = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 8, 1)), M.trim);
  antenna.position.set(0.62, 0.9, 0.04);
  const antennaTip = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.045, 12, 8)), M.glow);
  antennaTip.position.set(0.62, 1.36, 0.04);
  board.add(mcu, chip2, sensorCan, sensorMesh, led, pins, antenna, antennaTip);
  board.position.y = 1.75;
  board.rotation.x = -0.3;
  sensor.add(board);
  sensor.position.set(1.85, 0, 0.2);
  sensor.rotation.y = -0.35;
  pivot.add(sensor);

  // Alert beacon.
  const beacon = new THREE.Group();
  const beaconBase = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.34, 0.4, 0.26, 32, 1)), M.trim);
  beaconBase.position.y = 0.13;
  const domeMat = kit.mat({ role: "sky", rough: 0.15, metal: 0, emissive: "accent", emissiveIntensity: 0.25, physical: true, clearcoat: 1, transparent: true, opacity: 0.85 });
  const dome = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)), domeMat);
  dome.position.y = 0.26;
  const beaconGlow = kit.glow("accent", 0);
  beaconGlow.position.y = 0.42;
  beaconGlow.scale.setScalar(1.4);
  beacon.add(beaconBase, dome, beaconGlow);
  beacon.position.set(-2.35, 0, 0.9);
  pivot.add(beacon);
  const ringMats = [0, 1, 2].map(() => kit.basic("accent", { transparent: true, opacity: 0, depthWrite: false }));
  const ringGeometry = kit.track(new THREE.TorusGeometry(1, 0.012, 6, 96));
  const rings = ringMats.map((material) => {
    const ring = new THREE.Mesh(ringGeometry, material);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(-2.35, 0.05, 0.9);
    pivot.add(ring);
    return ring;
  });

  const setPulse = (t) => {
    rings.forEach((ring, i) => {
      const k = easeOutCubic((t - i * 0.16) / 0.6);
      ring.scale.setScalar(0.45 + (0.9 + i * 0.55) * k);
      ring.material.opacity = k > 0 && k < 1 ? 0.85 * (1 - k) : 0;
    });
    const flash = Math.sin(Math.PI * Math.min(1, t / 0.5));
    domeMat.emissiveIntensity = (0.25 + flash * 1.4) * kit.palette().glow;
    beaconGlow.material.opacity = flash * 0.8;
  };
  setPulse(0);

  let pulse = 0;
  let clock = 0;
  return {
    group,
    bounds: [
      [-3.2, -0.1, -1.7],
      [3.2, 3.8, 1.8],
    ],
    update(dt, ctx) {
      let moving = tilt(pivot, dt, ctx, 0.08);
      if (ctx.near > 2 && pulse > 0) {
        pulse = 0;
        setPulse(0);
      }
      if (ctx.near < 0.9 && pulse < 1) {
        pulse = Math.min(1, pulse + dt / 2.2);
        setPulse(pulse);
        moving = true;
      }
      const live = ctx.near < 0.9 && ctx.ambient;
      wisps.forEach((sprite) => {
        sprite.visible = live;
      });
      if (live) {
        clock += dt;
        ledMat.emissiveIntensity = (Math.sin(clock * 6) > 0 ? 1.6 : 0.2) * kit.palette().glow;
        wisps.forEach((sprite) => {
          const k = (clock * 0.35 + sprite.userData.offset) % 1;
          sprite.position.set(0.3 + k * 0.9, 3.3 + k * 0.9 + Math.sin(k * 6) * 0.05, -0.2 + Math.sin(k * 4) * 0.1);
          sprite.scale.setScalar(0.2 + k * 0.6);
          sprite.material.opacity = 0.45 * Math.sin(Math.PI * k);
        });
        moving = true;
      }
      return moving;
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Experience — a rail into depth with milestone pillars and emblem plates  */
/* ------------------------------------------------------------------------ */

export const MARKERS_Z = [-3, -9, -15, -21];
const EMBLEMS = ["job", "job", "badge", "cap"];

export function buildExperience(kit) {
  const { THREE, M, rbox } = kit;
  const group = new THREE.Group();

  const rail = new THREE.Mesh(rbox(0.34, 0.12, 27, 0.05), M.steel);
  rail.position.set(0, 0.06, -12);
  const groove = new THREE.Mesh(rbox(0.08, 0.02, 27, 0.01, 1), M.glowPrimary);
  groove.position.set(0, 0.125, -12);
  group.add(rail, groove);
  const tieGeometry = rbox(0.9, 0.05, 0.12, 0.02, 1);
  const ties = new THREE.InstancedMesh(tieGeometry, M.shell2, 27);
  const m4 = new THREE.Matrix4();
  for (let k = 0; k < 27; k += 1) {
    m4.makeTranslation(0, 0.025, 1 - k);
    ties.setMatrixAt(k, m4);
  }
  group.add(ties);

  const emblem = (kind, material) => {
    const e = new THREE.Group();
    if (kind === "job") {
      const body = new THREE.Mesh(rbox(0.56, 0.38, 0.14, 0.06), material);
      const handle = new THREE.Mesh(kit.track(new THREE.TorusGeometry(0.1, 0.03, 8, 20, Math.PI)), material);
      handle.position.y = 0.19;
      const clasp = new THREE.Mesh(rbox(0.1, 0.07, 0.04, 0.015, 1), M.steel);
      clasp.position.set(0, 0.06, 0.08);
      const strap = new THREE.Mesh(rbox(0.56, 0.03, 0.02, 0.01, 1), M.steel);
      strap.position.set(0, 0.06, 0.075);
      e.add(body, handle, strap, clasp);
    } else if (kind === "badge") {
      const disc = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 6, 1).rotateX(Math.PI / 2)), material);
      disc.rotation.z = Math.PI / 6;
      disc.position.y = 0.06;
      const starShape = new THREE.Shape();
      for (let k = 0; k < 10; k += 1) {
        const r = k % 2 === 0 ? 0.13 : 0.055;
        const a = (k / 10) * Math.PI * 2 + Math.PI / 2;
        if (k === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      starShape.closePath();
      const star = new THREE.Mesh(kit.track(new THREE.ExtrudeGeometry(starShape, { depth: 0.03, bevelEnabled: false })), M.shell);
      star.position.set(0, 0.06, 0.04);
      [-1, 1].forEach((side) => {
        const tail = new THREE.Mesh(rbox(0.09, 0.26, 0.03, 0.01, 1), material);
        tail.position.set(side * 0.1, -0.22, -0.01);
        tail.rotation.z = side * 0.3;
        e.add(tail);
      });
      e.add(disc, star);
    } else {
      const board = new THREE.Mesh(rbox(0.56, 0.05, 0.56, 0.02, 1), material);
      board.rotation.set(0.5, Math.PI / 4, 0);
      board.position.y = 0.12;
      const cap = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.2, 0.22, 0.18, 24, 1)), material);
      cap.position.y = -0.02;
      const tassel = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6, 1)), M.glow);
      tassel.position.set(0.22, -0.02, 0.1);
      const knot = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.035, 10, 8)), M.glow);
      knot.position.set(0.22, -0.18, 0.1);
      e.add(cap, board, tassel, knot);
    }
    return e;
  };

  const markers = MARKERS_Z.map((z, index) => {
    const marker = new THREE.Group();
    const lift = new THREE.Group();
    const base = new THREE.Mesh(rbox(1.0, 0.14, 1.0, 0.05), M.shell2);
    base.position.y = 0.07;
    marker.add(base, lift);
    const pillar = new THREE.Mesh(rbox(0.46, 1.25, 0.46, 0.08), M.shell);
    pillar.position.y = 0.76;
    const collar = new THREE.Mesh(rbox(0.52, 0.06, 0.52, 0.02, 1), M.steel);
    collar.position.y = 1.4;
    const plate = new THREE.Mesh(rbox(1.0, 0.95, 0.1, 0.1), M.gloss);
    plate.position.set(0, 1.95, 0.05);
    plate.rotation.x = -0.12;
    const plateRim = new THREE.Mesh(rbox(1.06, 1.01, 0.06, 0.12), M.steel);
    plateRim.position.set(0, 1.95, -0.01);
    plateRim.rotation.x = -0.12;
    const idleMat = M.trim;
    const icon = emblem(EMBLEMS[index], idleMat);
    icon.position.set(0, 1.96, 0.14);
    icon.rotation.x = -0.12;
    const iconHot = emblem(EMBLEMS[index], M.glowPrimary);
    iconHot.position.copy(icon.position);
    iconHot.rotation.copy(icon.rotation);
    iconHot.visible = false;
    const lamp = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.06, 12, 8)), M.steel);
    lamp.position.set(0, 1.5, 0.26);
    lift.add(pillar, collar, plateRim, plate, icon, iconHot, lamp);
    marker.position.z = z;
    marker.add(kit.shadow(1.6, 1.6, 0.005));
    group.add(marker);
    return { lift, icon, iconHot, lamp };
  });

  let active = -1;
  const lifts = MARKERS_Z.map(() => 0);
  return {
    group,
    get active() {
      return active;
    },
    setActive(index) {
      active = index;
      markers.forEach(({ icon, iconHot, lamp }, i) => {
        const on = i === index;
        icon.visible = !on;
        iconHot.visible = on;
        lamp.material = on ? M.glow : M.steel;
      });
    },
    update(dt) {
      let moving = false;
      markers.forEach(({ lift }, i) => {
        const target = i === active ? 0.3 : 0;
        lifts[i] = damp(lifts[i], target, 6, dt);
        if (Math.abs(lifts[i] - target) > 0.002) {
          moving = true;
        } else {
          lifts[i] = target;
        }
        lift.position.y = lifts[i];
      });
      return moving;
    },
  };
}
