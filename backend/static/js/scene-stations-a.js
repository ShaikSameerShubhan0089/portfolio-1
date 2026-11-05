// Stations: intro systems core, CarbonSphere, RISE, QueryVault.
// Each builder returns { group, bounds: [min, max] | ring, update(dt, ctx) → stillAnimating }.
import { easeOutCubic, easeInOut, easeOutBack, damp, tilt, rand, fillRound, roundRectPath, text } from "./scene-kit.js";

/* ------------------------------------------------------------------------ */
/* Intro — AI systems core: four glassy layers, luminous seams, a chip       */
/* ------------------------------------------------------------------------ */

export function buildIntro(kit) {
  const { THREE, M, rbox } = kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  const LAYERS = 4;
  const layers = [];
  for (let i = 0; i < LAYERS; i += 1) {
    const layer = new THREE.Group();
    const shell = new THREE.Mesh(rbox(4.4, 0.3, 3.0, 0.12), M.glass);
    const core = new THREE.Mesh(rbox(4.0, 0.16, 2.6, 0.06), i === LAYERS - 1 ? M.primary : i === 0 ? M.shell : M.shell2);
    const seam = new THREE.Mesh(rbox(4.46, 0.022, 3.06, 0.011, 2), i === LAYERS - 1 ? M.glow : M.glowPrimary);
    seam.position.y = -0.15;
    // Status LEDs along the front edge of each layer.
    const leds = new THREE.Group();
    for (let k = 0; k < 5; k += 1) {
      const led = new THREE.Mesh(rbox(0.16, 0.05, 0.03, 0.012, 1), k === i ? M.glow : M.steel);
      led.position.set(-1.7 + k * 0.24, 0, 1.51);
      leds.add(led);
    }
    layer.add(core, shell, seam, leds);
    layer.userData.core = core;
    pivot.add(layer);
    layers.push(layer);
  }

  // Processor chip on top.
  const chip = new THREE.Group();
  chip.add(new THREE.Mesh(rbox(1.35, 0.1, 1.35, 0.04), M.trim));
  const die = new THREE.Mesh(rbox(0.82, 0.08, 0.82, 0.03), M.steel);
  die.position.y = 0.08;
  chip.add(die);
  const dieFace = kit.screen(0.72, 0.72, (ctx, W, H, pal) => {
    fillRound(ctx, 0, 0, W, H, 60, pal.deep);
    ctx.strokeStyle = pal.sky;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 10;
    for (let k = 0; k < 6; k += 1) {
      const y = 140 + k * 145;
      ctx.beginPath();
      ctx.moveTo(90, y);
      ctx.lineTo(380 + (k % 3) * 90, y);
      ctx.lineTo(440 + (k % 3) * 90, y + 60);
      ctx.lineTo(910, y + 60);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    fillRound(ctx, 330, 330, 340, 340, 40, pal.accent);
    text(ctx, "AI", 500, 505, { size: 150, weight: 700, color: pal.deep, align: "center" });
  }, { px: 260 });
  dieFace.mesh.rotation.x = -Math.PI / 2;
  dieFace.mesh.position.y = 0.121;
  chip.add(dieFace.mesh);
  const pinGeometry = rbox(0.06, 0.03, 0.14, 0.01, 1);
  const pins = new THREE.InstancedMesh(pinGeometry, M.steel, 32);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  let n = 0;
  for (let side = 0; side < 4; side += 1) {
    for (let k = 0; k < 8; k += 1) {
      const t = -0.52 + k * 0.15;
      const pos = new THREE.Vector3(t, -0.02, 0.73);
      pos.applyAxisAngle(THREE.Object3D.DEFAULT_UP, (side * Math.PI) / 2);
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, (side * Math.PI) / 2);
      m4.compose(pos, q, new THREE.Vector3(1, 1, 1));
      pins.setMatrixAt(n, m4);
      n += 1;
    }
  }
  chip.add(pins);
  pivot.add(chip);

  // Corner rods with data pulses travelling up.
  const corners = [
    [-2.0, -1.3],
    [2.0, -1.3],
    [2.0, 1.3],
    [-2.0, 1.3],
  ];
  const rodGeometry = kit.track(new THREE.CylinderGeometry(0.035, 0.035, 1, 10, 1));
  const rods = corners.map(([x, z]) => {
    const rod = new THREE.Mesh(rodGeometry, M.steel);
    rod.position.set(x, 0, z);
    pivot.add(rod);
    return rod;
  });
  const pulseGeometry = kit.track(new THREE.SphereGeometry(0.075, 14, 10));
  const pulses = corners.map(([x, z]) => {
    const pulse = new THREE.Mesh(pulseGeometry, M.glow);
    pulse.position.set(x, 0, z);
    pivot.add(pulse);
    return pulse;
  });
  const shadow = kit.shadow(6.2, 4.4);
  group.add(shadow);

  let settle = 0;
  let splay = 0;
  let clock = 0;
  return {
    group,
    bounds: [
      [-2.3, -1.0, -1.6],
      [2.3, 1.3, 1.6],
    ],
    update(dt, ctx) {
      settle = Math.min(1, settle + dt / 1.8);
      const s = easeOutCubic(settle);
      splay = damp(splay, ctx.pointerMagnitude, 4, dt);
      const gap = 0.46 + (1 - s) * 0.9 + splay * 0.14;
      layers.forEach((layer, i) => {
        const offset = i - 1.5;
        layer.position.y = offset * gap;
        layer.rotation.y = (1 - s) * offset * 0.28;
      });
      chip.position.y = 1.5 * gap + 0.2;
      rods.forEach((rod) => {
        rod.scale.y = 3 * gap + 0.1;
        rod.position.y = 0;
      });
      shadow.position.y = -1.5 * gap - 0.2;
      const live = ctx.near < 1.2 && ctx.ambient;
      if (live) {
        clock += dt;
      }
      pulses.forEach((pulse, i) => {
        const t = ((clock * 0.45 + i * 0.25) % 1 + 1) % 1;
        pulse.position.y = -1.5 * gap + t * 3 * gap;
        pulse.scale.setScalar(0.6 + Math.sin(t * Math.PI) * 0.6);
      });
      pivot.rotation.y = damp(pivot.rotation.y, ctx.pointer.x * 0.12, 3, dt);
      return settle < 1 || Math.abs(ctx.pointerMagnitude - splay) > 0.002 || live;
    },
  };
}

/* ------------------------------------------------------------------------ */
/* CarbonSphere — terrain tile, blue-tinted canopy, satellite scan, CO2e    */
/* ------------------------------------------------------------------------ */

export function buildCarbon(kit) {
  const { THREE, M, rbox, coarse } = kit;
  const SIZE = 8;
  const HALF = SIZE / 2;
  const BASE = -1.1;
  const segments = coarse ? 36 : 60;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  const hash = (x, y) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const valueNoise = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const height = (x, z) => {
    let h = 0;
    let amp = 1;
    let freq = 0.3;
    for (let o = 0; o < 4; o += 1) {
      h += valueNoise(x * freq + 11.3, z * freq + 4.7) * amp;
      amp *= 0.5;
      freq *= 2;
    }
    return (h - 0.9) * 1.5;
  };

  // Top surface.
  const plane = new THREE.PlaneGeometry(SIZE, SIZE, segments, segments);
  plane.rotateX(-Math.PI / 2);
  const pos = plane.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    pos.setY(i, height(pos.getX(i), pos.getZ(i)));
  }
  plane.computeVertexNormals();
  const terrainMat = kit.mat({ role: "shell2", rough: 0.9, metal: 0 });
  pivot.add(new THREE.Mesh(kit.track(plane), terrainMat));

  // Skirt walls so it reads as a cut tile of land.
  const skirt = [];
  const skirtIdx = [];
  const edgeStep = SIZE / segments;
  const pushWall = (points) => {
    const start = skirt.length / 3;
    points.forEach(([x, z]) => {
      skirt.push(x, height(x, z), z, x, BASE, z);
    });
    for (let k = 0; k < points.length - 1; k += 1) {
      const a = start + k * 2;
      skirtIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  };
  const edge = (fn) => Array.from({ length: segments + 1 }, (_, k) => fn(-HALF + k * edgeStep));
  pushWall(edge((t) => [t, HALF]));
  pushWall(edge((t) => [HALF, -t]));
  pushWall(edge((t) => [-t, -HALF]));
  pushWall(edge((t) => [-HALF, t]));
  const skirtGeometry = new THREE.BufferGeometry();
  skirtGeometry.setAttribute("position", new THREE.Float32BufferAttribute(skirt, 3));
  skirtGeometry.setIndex(skirtIdx);
  skirtGeometry.computeVertexNormals();
  const skirtMat = kit.mat({ role: "shell", rough: 0.6, metal: 0.02, side: THREE.DoubleSide });
  pivot.add(new THREE.Mesh(kit.track(skirtGeometry), skirtMat));
  const base = new THREE.Mesh(rbox(SIZE + 0.2, 0.16, SIZE + 0.2, 0.06), M.steel);
  base.position.y = BASE - 0.06;
  pivot.add(base);

  // Faint major contour lines as accents.
  {
    const lines = [];
    const step = SIZE / 48;
    const levels = [-0.6, -0.2, 0.2, 0.6];
    levels.forEach((level) => {
      for (let j = 0; j < 48; j += 1) {
        for (let i = 0; i < 48; i += 1) {
          const x0 = -HALF + i * step;
          const z0 = -HALF + j * step;
          const a = height(x0, z0);
          const b = height(x0 + step, z0);
          const c = height(x0 + step, z0 + step);
          const d = height(x0, z0 + step);
          const pts = [];
          const cross = (h0, h1, p0, p1) => {
            const t = (level - h0) / (h1 - h0 || 1e-6);
            pts.push([p0[0] + (p1[0] - p0[0]) * t, level + 0.02, p0[1] + (p1[1] - p0[1]) * t]);
          };
          if (a < level !== b < level) cross(a, b, [x0, z0], [x0 + step, z0]);
          if (b < level !== c < level) cross(b, c, [x0 + step, z0], [x0 + step, z0 + step]);
          if (c < level !== d < level) cross(c, d, [x0 + step, z0 + step], [x0, z0 + step]);
          if (d < level !== a < level) cross(d, a, [x0, z0 + step], [x0, z0]);
          if (pts.length >= 2) lines.push(...pts[0], ...pts[1]);
        }
      }
    });
    pivot.add(new THREE.LineSegments(kit.lineGeometry(lines), M.dimLine));
  }

  // Survey square.
  const SX = 1.3;
  const SZ = 0.6;
  const SH = 1.25;
  const inSurvey = (x, z) => Math.abs(x - SX) < SH && Math.abs(z - SZ) < SH;

  // Instanced canopy: blue–cyan data tints (never green).
  const TREES = coarse ? 120 : 240;
  const canopyGeometry = kit.track(new THREE.ConeGeometry(0.2, 0.55, 7, 1));
  canopyGeometry.translate(0, 0.42, 0);
  const crownGeometry = kit.track(new THREE.ConeGeometry(0.15, 0.4, 7, 1));
  crownGeometry.translate(0, 0.66, 0);
  const trunkGeometry = kit.track(new THREE.CylinderGeometry(0.035, 0.045, 0.2, 6, 1));
  trunkGeometry.translate(0, 0.1, 0);
  const canopyMat = kit.track(new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0, flatShading: true }));
  const trunkMat = M.steel;
  const canopy = new THREE.InstancedMesh(canopyGeometry, canopyMat, TREES);
  const crown = new THREE.InstancedMesh(crownGeometry, canopyMat, TREES);
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMat, TREES);
  const treeInfo = [];
  let placed = 0;
  let attempt = 0;
  const m4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  while (placed < TREES && attempt < TREES * 12) {
    attempt += 1;
    const x = (rand(attempt * 1.37) - 0.5) * (SIZE - 0.5);
    const z = (rand(attempt * 2.71 + 9) - 0.5) * (SIZE - 0.5);
    const density = valueNoise(x * 0.45 + 3.1, z * 0.45 + 8.2);
    if ((density < 0.5 && !inSurvey(x, z)) || (inSurvey(x, z) && rand(attempt * 9.7) < 0.35)) continue;
    const s = 0.42 + rand(attempt * 5.3) * 0.4;
    p3.set(x, height(x, z) - 0.02, z);
    quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rand(attempt) * 6.28);
    scl.set(s, s * (0.9 + rand(attempt * 7.1) * 0.35), s);
    m4.compose(p3, quat, scl);
    canopy.setMatrixAt(placed, m4);
    crown.setMatrixAt(placed, m4);
    trunks.setMatrixAt(placed, m4);
    treeInfo.push({ survey: inSurvey(x, z), tone: Math.floor(rand(attempt * 3.3) * 5) });
    placed += 1;
  }
  canopy.count = crown.count = trunks.count = placed;
  pivot.add(trunks, canopy, crown);
  const tint = new THREE.Color();
  kit.onTheme((pal) => {
    treeInfo.forEach((info, i) => {
      tint.set(info.survey ? (i % 3 === 0 ? pal.accent : pal.sky) : pal.canopy[info.tone]);
      canopy.setColorAt(i, tint);
      crown.setColorAt(i, tint);
    });
    canopy.instanceColor.needsUpdate = true;
    crown.instanceColor.needsUpdate = true;
  });

  // Survey outline draped on the terrain + corner stakes.
  {
    const outline = [];
    const corners = [
      [SX - SH, SZ - SH],
      [SX + SH, SZ - SH],
      [SX + SH, SZ + SH],
      [SX - SH, SZ + SH],
    ];
    for (let e = 0; e < 4; e += 1) {
      const [ax, az] = corners[e];
      const [bx, bz] = corners[(e + 1) % 4];
      for (let k = 0; k < 16; k += 1) {
        const t0 = k / 16;
        const t1 = (k + 1) / 16;
        const x0 = ax + (bx - ax) * t0;
        const z0 = az + (bz - az) * t0;
        const x1 = ax + (bx - ax) * t1;
        const z1 = az + (bz - az) * t1;
        outline.push(x0, height(x0, z0) + 0.05, z0, x1, height(x1, z1) + 0.05, z1);
      }
      const stake = new THREE.Mesh(rbox(0.07, 0.8, 0.07, 0.02, 1), M.primary);
      stake.position.set(ax, height(ax, az) + 0.4, az);
      const tip = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.07, 12, 8)), M.glow);
      tip.position.set(ax, height(ax, az) + 0.84, az);
      pivot.add(stake, tip);
    }
    pivot.add(new THREE.LineSegments(kit.lineGeometry(outline), M.accentLine));
  }
  // Draped translucent scan fill.
  const fillGeometry = new THREE.PlaneGeometry(SH * 2, SH * 2, 16, 16);
  fillGeometry.rotateX(-Math.PI / 2);
  {
    const fp = fillGeometry.attributes.position;
    for (let i = 0; i < fp.count; i += 1) {
      const x = fp.getX(i) + SX;
      const z = fp.getZ(i) + SZ;
      fp.setXYZ(i, x, height(x, z) + 0.06, z);
    }
  }
  const scanFill = new THREE.Mesh(kit.track(fillGeometry), kit.basic("accent", { transparent: true, opacity: 0.16, depthWrite: false }));
  pivot.add(scanFill);

  // Satellite.
  const satellite = new THREE.Group();
  const body = new THREE.Mesh(rbox(0.46, 0.46, 0.7, 0.08), M.gloss);
  satellite.add(body);
  const bandMesh = new THREE.Mesh(rbox(0.5, 0.14, 0.74, 0.04), M.primary);
  satellite.add(bandMesh);
  const panelFace = kit.screen(1.2, 0.46, (ctx, W, H, pal) => {
    fillRound(ctx, 0, 0, W, H, 18, pal.deep);
    ctx.strokeStyle = pal.sky;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 8;
    for (let k = 1; k < 8; k += 1) {
      ctx.beginPath();
      ctx.moveTo((W / 8) * k, 10);
      ctx.lineTo((W / 8) * k, H - 10);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(10, H / 2);
    ctx.lineTo(W - 10, H / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, { px: 200, doubleSide: true });
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(rbox(0.3, 0.05, 0.05, 0.02, 1), M.steel);
    arm.position.x = side * 0.37;
    const frame = new THREE.Mesh(rbox(1.28, 0.03, 0.54, 0.02, 1), M.trim);
    frame.position.x = side * 1.12;
    const face = new THREE.Mesh(panelFace.mesh.geometry, panelFace.mesh.material);
    face.rotation.x = -Math.PI / 2;
    face.position.set(side * 1.12, 0.017, 0);
    satellite.add(arm, frame, face);
  });
  const dishGeometry = kit.track(
    new THREE.LatheGeometry(
      Array.from({ length: 8 }, (_, k) => new THREE.Vector2(0.02 + (k / 7) * 0.26, (k / 7) ** 2 * 0.14)),
      24
    )
  );
  const dish = new THREE.Mesh(dishGeometry, kit.mat({ role: "shell", rough: 0.3, metal: 0.3, side: THREE.DoubleSide }));
  dish.rotation.x = Math.PI;
  dish.position.y = -0.3;
  satellite.add(dish);
  const lens = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.05, 12, 8)), M.glow);
  lens.position.y = -0.36;
  satellite.add(lens);
  pivot.add(satellite);

  // Scan beam (unit cone, apex at origin, pointing -Y).
  const beamGeometry = kit.track(new THREE.ConeGeometry(1, 1, 32, 1, true));
  beamGeometry.translate(0, -0.5, 0);
  const beam = new THREE.Mesh(beamGeometry, M.beam);
  pivot.add(beam);
  const surveyCenter = new THREE.Vector3(SX, height(SX, SZ) + 0.05, SZ);
  const scanRing = new THREE.Mesh(kit.track(new THREE.RingGeometry(0.9, 1, 48)), kit.basic("accent", { transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
  scanRing.rotation.x = -Math.PI / 2;
  scanRing.position.copy(surveyCenter).setY(surveyCenter.y + 0.35);
  pivot.add(scanRing);

  // CO2e readout card.
  const card = new THREE.Group();
  card.add(new THREE.Mesh(rbox(1.9, 1.05, 0.05, 0.08), M.glass));
  const readout = kit.screen(1.78, 0.93, (ctx, W, H, pal) => {
    fillRound(ctx, 0, 0, W, H, 40, pal.screen);
    text(ctx, "CO₂e", 60, 110, { size: 110, weight: 700, color: pal.ink });
    text(ctx, "SURVEY AREA · ESTIMATE", 60, 205, { size: 38, weight: 500, color: pal.muted, mono: true });
    const bars = [0.42, 0.58, 0.51, 0.72, 0.66, 0.84, 0.9];
    bars.forEach((v, k) => {
      const bw = 90;
      const x = 60 + k * 125;
      const bh = v * 220;
      fillRound(ctx, x, 480 - bh, bw, bh, 14, k === bars.length - 1 ? pal.accent : pal.primary);
    });
    ctx.fillStyle = pal.line;
    ctx.fillRect(60, 484, 880, 4);
  }, { px: 240 });
  readout.mesh.position.z = 0.03;
  card.add(readout.mesh);
  card.position.set(-3.4, 3.9, 0.6);
  card.rotation.set(-0.3, -0.45, 0);
  group.add(card);

  const shadow = kit.shadow(SIZE * 1.5, SIZE * 1.5, BASE - 0.15);
  group.add(shadow);

  const satPos = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);
  let clock = 0;
  const place = () => {
    const a = -0.9 + Math.sin(clock * 0.35) * 0.55;
    satPos.set(SX + Math.cos(a) * 2.2, 3.6 + Math.sin(clock * 0.8) * 0.08, SZ + Math.sin(a) * 2.2);
    satellite.position.copy(satPos);
    satellite.lookAt(surveyCenter.x, satPos.y, surveyCenter.z);
    satellite.rotateX(0.35);
    dir.copy(surveyCenter).sub(satPos);
    const length = dir.length();
    beam.position.copy(satPos).setY(satPos.y - 0.36);
    beam.quaternion.setFromUnitVectors(down, dir.normalize());
    beam.scale.set(SH * 0.85, length - 0.36, SH * 0.85);
    const pulse = (clock * 0.6) % 1;
    scanRing.scale.setScalar(0.3 + pulse * 0.95);
    scanRing.material.opacity = 0.55 * (1 - pulse);
    card.position.y = 3.9 + Math.sin(clock * 1.2) * 0.06;
  };
  place();

  return {
    group,
    pivot,
    ring: { radius: SIZE * 0.72, y0: -1.4, y1: 4.6 },
    update(dt, ctx) {
      const live = ctx.near < 1.2 && ctx.ambient;
      if (live) {
        clock += dt;
        pivot.rotation.y += dt * 0.03;
        place();
      }
      return live;
    },
  };
}

/* ------------------------------------------------------------------------ */
/* RISE — clinical monitor with a risk gauge, risk-tier columns, SHAP bars  */
/* ------------------------------------------------------------------------ */

export function buildRise(kit) {
  const { THREE, M, rbox } = kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  // Desk base.
  const desk = new THREE.Mesh(rbox(8.2, 0.2, 3.6, 0.08), M.shell);
  desk.position.y = -0.1;
  const deskBody = new THREE.Mesh(rbox(7.8, 0.5, 3.2, 0.1), M.shell2);
  deskBody.position.y = -0.45;
  pivot.add(desk, deskBody, kit.shadow(11, 5.5, -0.7));

  // Monitor.
  const monitor = new THREE.Group();
  const bezel = new THREE.Mesh(rbox(3.4, 2.2, 0.16, 0.1), M.trim);
  monitor.add(bezel);
  const back = new THREE.Mesh(rbox(2.2, 1.4, 0.2, 0.12), M.steel);
  back.position.z = -0.12;
  monitor.add(back);
  const screen = kit.screen(3.2, 2.0, (ctx, W, H, pal, state) => {
    const needle = state.needle ?? 0;
    ctx.fillStyle = pal.screen;
    ctx.fillRect(0, 0, W, H);
    fillRound(ctx, 0, 0, W, 70, 0, pal.screen2);
    text(ctx, "RISE · Risk assessment", 40, 36, { size: 30, weight: 600, color: pal.ink });
    text(ctx, "SCREENING", W - 40, 36, { size: 24, weight: 500, color: pal.muted, mono: true, align: "right" });
    // Semi-circular gauge with four tiers.
    const cx = 320;
    const cy = 440;
    const r = 220;
    const tiers = [pal.ice, pal.sky, pal.primary, pal.deep];
    tiers.forEach((color, k) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 56;
      ctx.lineCap = "butt";
      const a0 = Math.PI + (k * Math.PI) / 4 + 0.02;
      const a1 = Math.PI + ((k + 1) * Math.PI) / 4 - 0.02;
      ctx.arc(cx, cy, r, a0, a1);
      ctx.stroke();
    });
    const angle = Math.PI + needle * Math.PI * 0.68;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * (r - 20), cy + Math.sin(angle) * (r - 20));
    ctx.stroke();
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, "Risk tier", cx, cy + 60, { size: 30, weight: 500, color: pal.muted, align: "center" });
    // Feature rows.
    const rows = [0.78, 0.55, 0.4, 0.26];
    rows.forEach((v, k) => {
      const y = 170 + k * 88;
      fillRound(ctx, 620, y, 180, 18, 9, pal.line);
      fillRound(ctx, 620, y + 32, 320, 22, 11, pal.screen2);
      fillRound(ctx, 620, y + 32, 320 * v * Math.min(1, needle * 1.4), 22, 11, k === 0 ? pal.accent : pal.primary);
    });
  }, { px: 240 });
  screen.mesh.position.z = 0.085;
  monitor.add(screen.mesh);
  const neck = new THREE.Mesh(rbox(0.26, 1.0, 0.14, 0.05), M.steel);
  neck.position.set(0, -1.35, -0.18);
  neck.rotation.x = 0.12;
  const foot = new THREE.Mesh(rbox(1.3, 0.07, 0.8, 0.03), M.steel);
  foot.position.set(0, -1.83, -0.12);
  monitor.add(neck, foot);
  monitor.position.set(-1.9, 1.88, -0.2);
  monitor.rotation.y = 0.28;
  pivot.add(monitor);

  // Risk-tier columns: glass shells with solid fills; tallest is the accent.
  const heights = [0.9, 1.6, 2.4, 3.3];
  const fills = [M.ice, M.sky, M.primary, M.glowPrimary];
  const columns = heights.map((h, i) => {
    const column = new THREE.Group();
    const shell = new THREE.Mesh(rbox(0.62, h, 0.62, 0.08), M.glass);
    shell.position.y = h / 2;
    const fill = new THREE.Mesh(rbox(0.46, h - 0.08, 0.46, 0.06), fills[i]);
    fill.position.y = (h - 0.08) / 2 + 0.04;
    const cap = new THREE.Mesh(rbox(0.5, 0.05, 0.5, 0.02, 1), i === 3 ? M.glow : M.steel);
    cap.position.y = h - 0.02;
    column.add(fill, shell, cap);
    column.position.set(0.9 + i * 0.95, 0, 0.3 - i * 0.12);
    column.scale.y = 0.02;
    pivot.add(column);
    return column;
  });

  // SHAP-style contribution bars on a floating glass plate.
  const shap = new THREE.Group();
  shap.add(new THREE.Mesh(rbox(2.9, 1.5, 0.05, 0.08), M.glass));
  const axis = new THREE.Mesh(rbox(0.03, 1.25, 0.03, 0.01, 1), M.steel);
  axis.position.z = 0.05;
  shap.add(axis);
  const contributions = [0.95, 0.62, -0.48, 0.34, -0.22];
  const shapBars = contributions.map((v, k) => {
    const bar = new THREE.Mesh(rbox(1, 0.16, 0.07, 0.03, 1), v > 0 ? M.primary : M.sky);
    bar.position.set(0, 0.48 - k * 0.24, 0.07);
    bar.userData.value = v;
    shap.add(bar);
    return bar;
  });
  shap.position.set(2.2, 4.25, -0.4);
  shap.rotation.set(-0.12, -0.18, 0);
  pivot.add(shap);

  const setBars = (t, clock) => {
    shapBars.forEach((bar, k) => {
      const v = bar.userData.value * (1 + Math.sin(clock * 1.6 + k) * 0.05);
      const w = Math.max(0.01, Math.abs(v) * 1.2 * easeOutCubic(t * 1.4 - k * 0.1));
      bar.scale.x = w;
      bar.position.x = (Math.sign(v) * w) / 2;
    });
  };
  setBars(0, 0);

  let grow = 0;
  let clock = 0;
  let lastNeedle = -1;
  return {
    group,
    bounds: [
      [-4.1, -0.7, -1.8],
      [4.1, 5.1, 1.8],
    ],
    update(dt, ctx) {
      let moving = tilt(pivot, dt, ctx, 0.08);
      if (ctx.near < 1.2 && grow < 1) {
        grow = Math.min(1, grow + dt / 1.6);
        moving = true;
      }
      const live = ctx.near < 1.2 && ctx.ambient;
      if (live) {
        clock += dt;
        moving = true;
      }
      columns.forEach((column, i) => {
        column.scale.y = Math.max(0.02, easeOutBack((grow * 1.4 - i * 0.12) / 1));
      });
      setBars(grow, clock);
      const needle = Math.round(easeOutCubic(grow) * 60) / 60;
      if (needle !== lastNeedle) {
        lastNeedle = needle;
        screen.redraw({ needle });
      }
      return moving;
    },
  };
}

/* ------------------------------------------------------------------------ */
/* QueryVault — glossy database stack, four agent robots plugged in, SQL card */
/* ------------------------------------------------------------------------ */

const SQL_BEFORE = ["SELECT customer, total", "FROM orders", "WHERE year = 2024", "ORDER BY total;"];
const SQL_AFTER = ["SELECT c.name, SUM(o.total) AS revenue", "FROM orders o", "JOIN customers c ON c.id = o.customer_id", "GROUP BY c.name ORDER BY revenue DESC;"];

export function buildQueryVault(kit) {
  const { THREE, M, rbox, coarse } = kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  // Rack plinth.
  const plinth = new THREE.Mesh(rbox(3.4, 0.24, 3.4, 0.1), M.steel);
  plinth.position.y = -0.42;
  pivot.add(plinth, kit.shadow(6, 6, -0.55));

  // Rounded database pucks.
  const R = 1.28;
  const H = 0.6;
  const B = 0.1;
  const profile = [new THREE.Vector2(0, -H / 2)];
  for (let k = 0; k <= 6; k += 1) {
    const a = -Math.PI / 2 + (k / 6) * (Math.PI / 2);
    profile.push(new THREE.Vector2(R - B + Math.cos(a) * B, -H / 2 + B + Math.sin(a) * B));
  }
  for (let k = 0; k <= 6; k += 1) {
    const a = (k / 6) * (Math.PI / 2);
    profile.push(new THREE.Vector2(R - B + Math.cos(a) * B, H / 2 - B + Math.sin(a) * B));
  }
  profile.push(new THREE.Vector2(0, H / 2));
  const puckGeometry = kit.track(new THREE.LatheGeometry(profile, coarse ? 36 : 56));
  const ringGeometry = kit.track(new THREE.CylinderGeometry(R - 0.06, R - 0.06, 0.1, coarse ? 36 : 56, 1));
  const LEDS = 12;
  const ledGeometry = rbox(0.12, 0.07, 0.04, 0.015, 1);
  const ledMat = kit.track(new THREE.MeshBasicMaterial({ toneMapped: false }));
  const leds = new THREE.InstancedMesh(ledGeometry, ledMat, LEDS * 3);
  const m4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const p3 = new THREE.Vector3();
  [0, 0.7, 1.4].forEach((y, level) => {
    const puck = new THREE.Mesh(puckGeometry, M.gloss);
    puck.position.y = y;
    pivot.add(puck);
    if (level < 2) {
      const ring = new THREE.Mesh(ringGeometry, M.trim);
      ring.position.y = y + 0.35;
      pivot.add(ring);
    }
    for (let k = 0; k < LEDS; k += 1) {
      const a = -0.75 + (k / (LEDS - 1)) * 1.5 + Math.PI / 2;
      p3.set(Math.cos(a) * (R + 0.005), y - 0.05, Math.sin(a) * (R + 0.005));
      quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, -a + Math.PI / 2);
      m4.compose(p3, quat, one);
      leds.setMatrixAt(level * LEDS + k, m4);
    }
  });
  pivot.add(leds);
  const ledOn = new THREE.Color();
  const ledOff = new THREE.Color();
  const tmpColor = new THREE.Color();
  const setLeds = (seed) => {
    for (let i = 0; i < LEDS * 3; i += 1) {
      const on = rand(i * 3.1 + seed * 1.7) > 0.45;
      leds.setColorAt(i, tmpColor.copy(on ? ledOn : ledOff));
    }
    leds.instanceColor.needsUpdate = true;
  };
  kit.onTheme((pal) => {
    ledOn.set(pal.accent);
    ledOff.set(pal.dim);
    setLeds(ledSeed);
  });
  let ledSeed = 0;

  // Agents: small robots orbiting (their ring turns), plugged in by cables.
  const orbit = new THREE.Group();
  pivot.add(orbit);
  const visor = kit.screen(0.5, 0.26, (ctx, W, H, pal) => {
    fillRound(ctx, 0, 0, W, H, 120, "#0B1628");
    ctx.fillStyle = pal.accent;
    [330, 670].forEach((x) => {
      roundRectPath(ctx, x - 70, H / 2 - 60, 140, 120, 50);
      ctx.fill();
    });
  }, { px: 240 });
  const antennaGeometry = kit.track(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 6, 1));
  const tipGeometry = kit.track(new THREE.SphereGeometry(0.055, 12, 8));
  const pulseGeometry = kit.track(new THREE.SphereGeometry(0.07, 12, 8));
  const agents = [0, 1, 2, 3].map((i) => {
    const angle = Math.PI / 4 + (i * Math.PI) / 2;
    const y = i % 2 === 0 ? 1.95 : 0.35;
    const position = new THREE.Vector3(Math.cos(angle) * 3.1, y, Math.sin(angle) * 3.1);
    const agent = new THREE.Group();
    agent.position.copy(position);
    const head = new THREE.Mesh(rbox(0.62, 0.48, 0.52, 0.14), M.gloss);
    const face = new THREE.Mesh(visor.mesh.geometry, visor.mesh.material);
    face.position.z = 0.265;
    const ear = new THREE.Mesh(rbox(0.72, 0.14, 0.14, 0.05, 1), M.primary);
    const antenna = new THREE.Mesh(antennaGeometry, M.steel);
    antenna.position.y = 0.38;
    const tip = new THREE.Mesh(tipGeometry, M.glow);
    tip.position.y = 0.56;
    const bodyMesh = new THREE.Mesh(rbox(0.36, 0.26, 0.3, 0.08), M.steel);
    bodyMesh.position.y = -0.38;
    agent.add(head, face, ear, antenna, tip, bodyMesh);
    agent.lookAt(0, y, 0);
    agent.rotateY(Math.PI); // visor faces outward, toward the viewer
    orbit.add(agent);

    const anchorY = Math.min(Math.max(y, 0), 1.4);
    const anchor = new THREE.Vector3(Math.cos(angle) * (R + 0.02), anchorY, Math.sin(angle) * (R + 0.02));
    const start = position.clone().add(new THREE.Vector3(0, -0.5, 0));
    const mid = start.clone().lerp(anchor, 0.5);
    mid.y = Math.min(start.y, anchor.y) - 0.45;
    const curve = new THREE.CatmullRomCurve3([start, mid, anchor]);
    const cable = new THREE.Mesh(kit.track(new THREE.TubeGeometry(curve, 28, 0.028, 6, false)), M.trim);
    orbit.add(cable);
    const pulse = new THREE.Mesh(pulseGeometry, M.glow);
    pulse.visible = false;
    orbit.add(pulse);
    return { agent, head, curve, pulse, baseRotation: agent.rotation.clone() };
  });

  // SQL card being rewritten.
  const card = new THREE.Group();
  card.add(new THREE.Mesh(rbox(2.9, 1.34, 0.05, 0.08), M.glass));
  const sql = kit.screen(2.78, 1.22, (ctx, W, H, pal, state) => {
    const t = state.t ?? 0; // 0 = original query, 1 = rewritten
    fillRound(ctx, 0, 0, W, H, 34, "#0B1628");
    text(ctx, t > 0.5 ? "AGENT · REWRITTEN" : "USER QUERY", 44, 52, { size: 26, weight: 500, color: t > 0.5 ? "#22D3EE" : "#94A3B8", mono: true });
    fillRound(ctx, W - 150, 34, 106, 36, 18, t > 0.5 ? "#06B6D4" : "#1E3A5F");
    const lines = t > 0.5 ? SQL_AFTER : SQL_BEFORE;
    const shown = t > 0.5 ? Math.round(lines.length * Math.min(1, (t - 0.5) * 2.4)) : lines.length;
    lines.forEach((line, k) => {
      const y = 132 + k * 62;
      if (k >= shown) {
        fillRound(ctx, 44, y - 14, 300 + ((k * 97) % 300), 26, 13, "#1E3A5F");
        return;
      }
      if (t > 0.5) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
        ctx.fillRect(30, y - 28, W - 60, 56);
      }
      const [kw, ...rest] = line.split(" ");
      text(ctx, kw, 44, y, { size: 32, weight: 500, color: "#60A5FA", mono: true });
      ctx.font = `500 32px "Geist Mono", ui-monospace, monospace`;
      const offset = ctx.measureText(`${kw} `).width;
      text(ctx, rest.join(" "), 44 + offset, y, { size: 32, weight: 500, color: "#E2E8F0", mono: true });
    });
  }, { px: 260 });
  sql.mesh.position.z = 0.03;
  card.add(sql.mesh);
  card.position.set(0, 3.25, 0.9);
  card.rotation.x = -0.18;
  pivot.add(card);

  let clock = 0;
  let lastT = -1;
  return {
    group,
    ring: { radius: 3.7, y0: -0.6, y1: 4.0 },
    update(dt, ctx) {
      const live = ctx.near < 0.9 && ctx.ambient;
      let moving = tilt(pivot, dt, ctx, 0.08);
      agents.forEach(({ pulse }) => {
        pulse.visible = live;
      });
      if (!live) {
        return moving;
      }
      clock += dt;
      orbit.rotation.y += dt * 0.12;
      const cycle = 1.1;
      const index = Math.floor(clock / cycle) % 4;
      const t = easeInOut((clock % cycle) / (cycle * 0.85));
      agents.forEach(({ pulse, curve, head }, i) => {
        pulse.visible = i === index;
        if (i === index) {
          curve.getPoint(t, pulse.position);
        }
        head.rotation.x = Math.sin(clock * 2 + i) * 0.08;
      });
      const seed = Math.floor(clock * 4);
      if (seed !== ledSeed) {
        ledSeed = seed;
        setLeds(seed);
      }
      // Rewrite loop: 2.6s original → 2.6s rewritten (lines type in).
      const phase = (clock % 5.2) / 5.2;
      const sqlT = phase < 0.5 ? 0 : 0.5 + (phase - 0.5);
      const quantised = Math.round(sqlT * 12) / 12;
      if (quantised !== lastT) {
        lastT = quantised;
        sql.redraw({ t: quantised });
      }
      return true;
    },
  };
}

