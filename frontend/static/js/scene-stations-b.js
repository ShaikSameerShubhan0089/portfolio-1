// Stations: Portfolio Generator, Personal Portfolio, Disease Prediction, Movie Recommender.
import { easeOutCubic, easeInOut, approach, tilt, fillRound, roundRectPath, text, sculptHead } from "./scene-kit.js";

/* ------------------------------------------------------------------------ */
/* Portfolio Generator — laptop with a live page; template cards fan out     */
/* ------------------------------------------------------------------------ */

const TEMPLATE_NAMES = ["Minimal", "Projects", "Creative", "Business", "Developer"];

function drawTemplate(ctx, W, H, pal, kind) {
  const dark = kind === 4;
  fillRound(ctx, 0, 0, W, H, 40, dark ? "#0B1628" : pal.screen);
  const ink = dark ? "#E2E8F0" : pal.ink;
  const soft = dark ? "#1E3A5F" : pal.line;
  switch (kind) {
    case 0:
      fillRound(ctx, 200, 260, 600, 60, 30, ink);
      fillRound(ctx, 300, 360, 400, 30, 15, soft);
      fillRound(ctx, 380, 460, 240, 56, 28, pal.primary);
      for (let k = 0; k < 4; k += 1) fillRound(ctx, 160, 640 + k * 70, 680 - k * 90, 24, 12, soft);
      break;
    case 1:
      fillRound(ctx, 70, 80, 400, 36, 18, ink);
      [0, 1, 2, 3].forEach((k) => {
        const x = 70 + (k % 2) * 440;
        const y = 180 + Math.floor(k / 2) * 420;
        fillRound(ctx, x, y, 420, 300, 24, k === 0 ? pal.primary : k === 3 ? pal.sky : pal.screen2);
        fillRound(ctx, x, y + 320, 260, 26, 13, soft);
      });
      break;
    case 2:
      ctx.fillStyle = pal.sky;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, 380);
      ctx.lineTo(0, 620);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = pal.screen;
      ctx.beginPath();
      ctx.arc(500, 470, 150, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.arc(500, 470, 120, 0, Math.PI * 2);
      ctx.fill();
      fillRound(ctx, 250, 700, 500, 50, 25, ink);
      fillRound(ctx, 330, 790, 340, 26, 13, soft);
      break;
    case 3:
      fillRound(ctx, 0, 0, W, 250, 0, pal.deep);
      fillRound(ctx, 70, 90, 460, 50, 25, "#FFFFFF");
      for (let k = 0; k < 5; k += 1) {
        fillRound(ctx, 70, 330 + k * 150, 860, 110, 18, pal.screen2);
        fillRound(ctx, 110, 370 + k * 150, 300 - k * 30, 30, 15, k === 0 ? pal.primary : soft);
      }
      break;
    default:
      for (let k = 0; k < 7; k += 1) {
        fillRound(ctx, 70 + (k % 3) * 60, 110 + k * 70, 380 + ((k * 131) % 300), 28, 14, k % 3 === 0 ? "#60A5FA" : "#334155");
      }
      [0.9, 0.75, 0.6].forEach((v, k) => {
        fillRound(ctx, 70, 700 + k * 90, 860, 34, 17, "#1E3A5F");
        fillRound(ctx, 70, 700 + k * 90, 860 * v, 34, 17, k === 0 ? "#22D3EE" : "#3B82F6");
      });
  }
  text(ctx, TEMPLATE_NAMES[kind].toUpperCase(), 500, H - 70, { size: 54, weight: 600, color: dark ? "#94A3B8" : pal.muted, mono: true, align: "center" });
}

export function buildPortfolioGen(kit) {
  const { THREE, M, rbox } = kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);
  pivot.add(kit.shadow(5.2, 3.4, 0.0));

  // Laptop base + keyboard deck.
  const laptop = new THREE.Group();
  const base = new THREE.Mesh(rbox(3.2, 0.14, 2.1, 0.07), M.steel);
  base.position.y = 0.07;
  laptop.add(base);
  const deck = kit.screen(2.9, 1.1, (ctx, W, H, pal) => {
    ctx.clearRect(0, 0, W, H);
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 14; c += 1) {
        fillRound(ctx, 12 + c * 70.5, 14 + r * 72, 62, 62, 10, pal.trim);
      }
    }
  }, { px: 200, transparent: true });
  deck.mesh.rotation.x = -Math.PI / 2;
  deck.mesh.position.set(0, 0.142, -0.28);
  laptop.add(deck.mesh);
  const pad = new THREE.Mesh(rbox(1.0, 0.01, 0.55, 0.04, 1), M.shell2);
  pad.position.set(0, 0.142, 0.62);
  laptop.add(pad);

  const hinge = new THREE.Group();
  hinge.position.set(0, 0.14, -1.02);
  hinge.rotation.x = -0.22; // opened a little past vertical
  laptop.add(hinge);
  const lid = new THREE.Mesh(rbox(3.2, 2.08, 0.08, 0.07), M.steel);
  lid.position.set(0, 1.04, 0);
  hinge.add(lid);
  const bezel = new THREE.Mesh(rbox(3.08, 1.96, 0.02, 0.05, 1), M.trim);
  bezel.position.set(0, 1.04, 0.045);
  hinge.add(bezel);
  const display = kit.screen(2.9, 1.78, (ctx, W, H, pal) => {
    ctx.fillStyle = pal.screen;
    ctx.fillRect(0, 0, W, H);
    fillRound(ctx, 0, 0, W, 64, 0, pal.screen2);
    fillRound(ctx, 34, 20, 26, 26, 13, pal.primary);
    [0, 1, 2].forEach((k) => fillRound(ctx, 640 + k * 100, 26, 70, 14, 7, pal.line));
    fillRound(ctx, 60, 120, 520, 48, 24, pal.ink);
    fillRound(ctx, 60, 190, 380, 48, 24, pal.ink);
    fillRound(ctx, 60, 270, 440, 18, 9, pal.muted);
    fillRound(ctx, 60, 320, 190, 54, 27, pal.primary);
    fillRound(ctx, 640, 110, 300, 270, 30, pal.sky);
    ctx.fillStyle = pal.screen;
    ctx.beginPath();
    ctx.arc(790, 245, 70, 0, Math.PI * 2);
    ctx.fill();
    [0, 1, 2].forEach((k) => {
      fillRound(ctx, 60 + k * 300, 420, 270, 150, 20, pal.screen2);
      fillRound(ctx, 80 + k * 300, 520, 150, 16, 8, pal.line);
    });
  }, { px: 260 });
  display.mesh.position.set(0, 1.04, 0.057);
  hinge.add(display.mesh);
  pivot.add(laptop);

  // Template cards fanned in an arc above the screen.
  const cards = TEMPLATE_NAMES.map((name, i) => {
    const holder = new THREE.Group();
    const cardBody = new THREE.Mesh(rbox(1.0, 1.32, 0.04, 0.05, 1), M.shell);
    const face = kit.screen(0.94, 1.26, (ctx, W, H, pal) => drawTemplate(ctx, W, H, pal, i), { px: 200 });
    face.mesh.position.z = 0.022;
    holder.add(cardBody, face.mesh);
    const angle = (i - 2) * 0.42;
    const slot = {
      position: new THREE.Vector3(Math.sin(angle) * 2.3, 1.55 + Math.cos(angle) * 1.55, -1.45 - Math.abs(i - 2) * 0.12),
      rotation: new THREE.Euler(0, -angle * 0.35, -angle * 0.55),
    };
    holder.position.copy(slot.position);
    holder.rotation.copy(slot.rotation);
    pivot.add(holder);
    return { holder, slot, i };
  });
  const front = {
    position: new THREE.Vector3(1.55, 1.35, 0.95),
    rotation: new THREE.Euler(-0.12, -0.35, 0.04),
  };

  // A cursor "dragging" the card.
  const arrow = new THREE.Shape();
  [
    [0, 0],
    [0, -0.36],
    [0.09, -0.27],
    [0.16, -0.42],
    [0.22, -0.39],
    [0.15, -0.24],
    [0.27, -0.24],
  ].forEach(([x, y], k) => (k ? arrow.lineTo(x, y) : arrow.moveTo(x, y)));
  arrow.closePath();
  const cursor = new THREE.Mesh(
    kit.track(new THREE.ExtrudeGeometry(arrow, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 1 })),
    M.trim
  );
  pivot.add(cursor);

  const pos = new THREE.Vector3();
  const qa = new THREE.Quaternion();
  const qb = new THREE.Quaternion();
  let reveal = 0;
  let clock = 0;
  const pose = () => {
    const cycle = 3.2;
    const active = Math.floor(clock / cycle) % cards.length;
    const phase = (clock % cycle) / cycle;
    const out = phase < 0.4 ? easeInOut(phase / 0.4) : phase < 0.75 ? 1 : 1 - easeInOut((phase - 0.75) / 0.25);
    const fan = easeOutCubic(reveal);
    cards.forEach(({ holder, slot, i }) => {
      const k = i === active ? out * fan : 0;
      pos.copy(slot.position).lerp(new THREE.Vector3(0, 1.1, -1.1), 1 - fan);
      pos.lerp(front.position, k);
      holder.position.copy(pos);
      qa.setFromEuler(slot.rotation);
      qb.setFromEuler(front.rotation);
      holder.quaternion.copy(qa).slerp(qb, k);
      holder.scale.setScalar((0.55 + 0.45 * fan) * (1 + k * 0.25));
      if (i === active) {
        cursor.position.set(pos.x + 0.35, pos.y - 0.45, pos.z + 0.12);
        cursor.visible = fan > 0.5 && out > 0.02;
      }
    });
  };
  pose();

  return {
    group,
    bounds: [
      [-2.7, 0, -1.8],
      [2.7, 3.7, 1.7],
    ],
    update(dt, ctx) {
      let moving = tilt(pivot, dt, ctx, 0.08);
      let fanning;
      [reveal, fanning] = approach(reveal, ctx.near < 0.9 ? 1 : 0, dt / 1.1);
      const live = ctx.near < 0.9 && ctx.ambient;
      if (live) {
        clock += dt;
      }
      if (fanning || live) {
        pose();
        moving = true;
      }
      return moving;
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Personal Portfolio — résumé envelope through a security gate to an inbox  */
/* ------------------------------------------------------------------------ */

export function buildPortfolio(kit) {
  const { THREE, M, rbox } = kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  // Conveyor.
  const belt = new THREE.Mesh(rbox(9.2, 0.16, 1.4, 0.07), M.shell2);
  belt.position.y = 0.08;
  pivot.add(belt, kit.shadow(11, 3.2, 0));
  [-0.72, 0.72].forEach((z) => {
    const rail = new THREE.Mesh(rbox(9.2, 0.08, 0.08, 0.03, 1), M.steel);
    rail.position.set(0, 0.2, z);
    pivot.add(rail);
  });
  const rollerGeometry = kit.track(new THREE.CylinderGeometry(0.07, 0.07, 1.3, 14, 1));
  rollerGeometry.rotateX(Math.PI / 2);
  const rollers = new THREE.InstancedMesh(rollerGeometry, M.steel, 17);
  const m4 = new THREE.Matrix4();
  for (let k = 0; k < 17; k += 1) {
    m4.makeTranslation(-4.2 + k * 0.525, 0.19, 0);
    rollers.setMatrixAt(k, m4);
  }
  pivot.add(rollers);

  // Dispatch pad and inbox tray.
  const pad = new THREE.Mesh(rbox(1.6, 0.06, 1.2, 0.04), M.primary);
  pad.position.set(-3.7, 0.25, 0);
  pivot.add(pad);
  const tray = new THREE.Group();
  tray.add(new THREE.Mesh(rbox(1.9, 0.1, 1.5, 0.05), M.shell));
  const back = new THREE.Mesh(rbox(0.1, 0.5, 1.5, 0.04), M.shell);
  back.position.set(0.9, 0.25, 0);
  const sideA = new THREE.Mesh(rbox(1.9, 0.38, 0.08, 0.03), M.shell);
  sideA.position.set(0, 0.19, -0.71);
  const sideB = sideA.clone();
  sideB.position.z = 0.71;
  const lip = new THREE.Mesh(rbox(1.9, 0.05, 0.1, 0.02, 1), M.primary);
  lip.position.set(0, 0.4, 0.71);
  tray.add(back, sideA, sideB, lip);
  const stackSheet = rbox(1.3, 0.025, 0.95, 0.01, 1);
  [0, 1].forEach((k) => {
    const sheet = new THREE.Mesh(stackSheet, M.gloss);
    sheet.position.set(0.05, 0.07 + k * 0.03, 0);
    sheet.rotation.y = k * 0.08;
    tray.add(sheet);
  });
  tray.position.set(3.75, 0.26, 0);
  pivot.add(tray);

  // Gate with shield emblem and a key-lock.
  const gate = new THREE.Group();
  [-1.0, 1.0].forEach((z) => {
    const pillar = new THREE.Mesh(rbox(0.36, 2.7, 0.36, 0.08), M.shell);
    pillar.position.set(0, 1.35 + 0.16, z);
    gate.add(pillar);
    const strip = new THREE.Mesh(rbox(0.38, 2.2, 0.05, 0.02, 1), M.glowPrimary);
    strip.position.set(0, 1.4, z - Math.sign(z) * 0.19);
    gate.add(strip);
  });
  const beam = new THREE.Mesh(rbox(0.46, 0.42, 2.5, 0.1), M.shell);
  beam.position.set(0, 2.95, 0);
  gate.add(beam);
  const pane = new THREE.Mesh(rbox(0.04, 2.3, 1.62, 0.02, 1), M.glass);
  pane.position.set(0, 1.45, 0);
  gate.add(pane);
  const scanMat = kit.basic("accent", { transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const scan = new THREE.Mesh(kit.track(new THREE.PlaneGeometry(1.6, 2.3)), scanMat);
  scan.rotation.y = Math.PI / 2;
  scan.position.set(0.03, 1.45, 0);
  gate.add(scan);

  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, 0.5);
  shieldShape.quadraticCurveTo(0.24, 0.42, 0.42, 0.44);
  shieldShape.quadraticCurveTo(0.44, -0.1, 0, -0.52);
  shieldShape.quadraticCurveTo(-0.44, -0.1, -0.42, 0.44);
  shieldShape.quadraticCurveTo(-0.24, 0.42, 0, 0.5);
  const shieldGeometry = kit.track(
    new THREE.ExtrudeGeometry(shieldShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3, curveSegments: 16 })
  );
  shieldGeometry.center();
  const shield = new THREE.Mesh(shieldGeometry, M.primary);
  shield.position.set(0, 3.72, 0);
  shield.scale.setScalar(0.95);
  gate.add(shield);
  const check = new THREE.Group();
  const checkA = new THREE.Mesh(rbox(0.1, 0.26, 0.05, 0.02, 1), M.shell);
  checkA.position.set(-0.08, -0.03, 0);
  checkA.rotation.z = 0.8;
  const checkB = new THREE.Mesh(rbox(0.1, 0.46, 0.05, 0.02, 1), M.shell);
  checkB.position.set(0.1, 0.04, 0);
  checkB.rotation.z = -0.62;
  check.add(checkA, checkB);
  check.position.set(0, 3.74, 0.1);
  gate.add(check);

  // Lock on the near pillar, with a key that turns on approval.
  const lock = new THREE.Group();
  const lockBody = new THREE.Mesh(rbox(0.5, 0.62, 0.16, 0.08), M.steel);
  lock.add(lockBody);
  const shackle = new THREE.Mesh(kit.track(new THREE.TorusGeometry(0.16, 0.045, 10, 24, Math.PI)), M.steel);
  shackle.position.y = 0.3;
  lock.add(shackle);
  const keyhole = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16, 1)).rotateX(Math.PI / 2), M.trim);
  keyhole.position.set(0, 0.02, 0.09);
  lock.add(keyhole);
  const key = new THREE.Group();
  const bow = new THREE.Mesh(kit.track(new THREE.TorusGeometry(0.1, 0.035, 10, 24)), M.glow);
  bow.position.z = 0.34;
  bow.rotation.y = Math.PI / 2;
  const shaft = new THREE.Mesh(rbox(0.05, 0.05, 0.26, 0.02, 1), M.glow);
  shaft.position.z = 0.2;
  const bit = new THREE.Mesh(rbox(0.05, 0.1, 0.05, 0.015, 1), M.glow);
  bit.position.set(0, -0.06, 0.12);
  key.add(bow, shaft, bit);
  key.position.set(0, 0.02, 0.02);
  lock.add(key);
  lock.position.set(0, 1.55, 1.2);
  gate.add(lock);
  const led = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.07, 12, 8)), M.steel);
  led.position.set(0.24, 2.95, 0.9);
  gate.add(led);
  pivot.add(gate);

  // Envelope + résumé.
  const envelope = new THREE.Group();
  const paper = kit.screen(0.8, 1.0, (ctx, W, H, pal) => {
    fillRound(ctx, 0, 0, W, H, 24, "#FFFFFF");
    ctx.fillStyle = "#2563EB";
    ctx.beginPath();
    ctx.arc(150, 150, 80, 0, Math.PI * 2);
    ctx.fill();
    fillRound(ctx, 270, 100, 520, 44, 22, "#0F172A");
    fillRound(ctx, 270, 170, 360, 26, 13, "#94A3B8");
    for (let k = 0; k < 7; k += 1) {
      fillRound(ctx, 80, 330 + k * 120, k % 3 === 0 ? 420 : 840 - ((k * 97) % 260), 28, 14, k % 3 === 0 ? "#1D4ED8" : "#CBD5E1");
    }
    void pal;
  }, { px: 260, doubleSide: true });
  paper.mesh.rotation.set(-Math.PI / 2 + 0.5, 0, 0);
  paper.mesh.position.set(0, 0.28, -0.2);
  envelope.add(paper.mesh);
  const body = new THREE.Mesh(rbox(1.15, 0.07, 0.8, 0.03, 2), M.gloss);
  envelope.add(body);
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-0.56, 0);
  flapShape.lineTo(0.56, 0);
  flapShape.lineTo(0, -0.46);
  flapShape.closePath();
  const flap = new THREE.Mesh(kit.track(new THREE.ExtrudeGeometry(flapShape, { depth: 0.012, bevelEnabled: false })), M.shell2);
  flap.rotation.x = -Math.PI / 2;
  flap.position.set(0, 0.04, -0.39);
  envelope.add(flap);
  const seal = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 20, 1)), M.primary);
  seal.position.set(0, 0.058, 0.06);
  envelope.add(seal);
  envelope.position.set(-3.7, 0.33, 0);
  pivot.add(envelope);

  let clock = 0;
  const pose = () => {
    const phase = (clock % 6.5) / 6.5;
    let x;
    let approve = 0;
    if (phase < 0.32) {
      x = -3.7 + 3.1 * easeInOut(phase / 0.32);
    } else if (phase < 0.56) {
      x = -0.6 + 0.6 * easeInOut((phase - 0.32) / 0.06);
      approve = easeInOut((phase - 0.36) / 0.16);
    } else if (phase < 0.86) {
      x = 3.75 * easeInOut((phase - 0.56) / 0.3);
      approve = 1;
    } else {
      x = 3.75;
      approve = 1 - easeInOut((phase - 0.86) / 0.14);
    }
    const appear = Math.min(1, phase / 0.05, (1 - phase) / 0.05);
    envelope.position.x = x;
    envelope.position.y = 0.33 + (x > 3 ? Math.min(0.08, (x - 3) * 0.1) : 0);
    envelope.scale.setScalar(Math.max(0.001, easeInOut(appear)));
    key.rotation.z = -approve * Math.PI / 2;
    scanMat.opacity = phase > 0.3 && phase < 0.56 ? 0.28 * Math.sin(((phase - 0.3) / 0.26) * Math.PI) : 0;
    led.material = approve > 0.5 ? M.glow : M.steel;
    check.scale.setScalar(0.4 + approve * 0.6);
  };
  pose();

  return {
    group,
    bounds: [
      [-4.7, 0, -1.4],
      [4.7, 4.3, 1.5],
    ],
    update(dt, ctx) {
      let moving = tilt(pivot, dt, ctx, 0.07);
      if (ctx.near < 0.9 && ctx.ambient) {
        clock += dt;
        pose();
        moving = true;
      }
      return moving;
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Disease Prediction — holographic torso, five organ zones, ECG, panels     */
/* ------------------------------------------------------------------------ */

const CONDITIONS = ["Diabetes", "Heart disease", "Parkinson's", "Lung cancer", "Hypothyroidism"];

export function buildDisease(kit) {
  const { THREE, M, rbox, coarse } = kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  // Projector base.
  const baseProfile = [
    [0, 0],
    [1.15, 0],
    [1.2, 0.05],
    [1.12, 0.16],
    [0.95, 0.2],
    [0, 0.2],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const base = new THREE.Mesh(kit.track(new THREE.LatheGeometry(baseProfile, 48)), M.steel);
  pivot.add(base, kit.shadow(3.6, 3.6, 0));
  const baseRing = new THREE.Mesh(kit.track(new THREE.TorusGeometry(0.98, 0.025, 8, 64)), M.glow);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.21;
  pivot.add(baseRing);
  const lightCone = new THREE.Mesh(
    kit.track(new THREE.CylinderGeometry(0.75, 0.95, 3.0, 40, 1, true)),
    kit.basic("sky", { transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide })
  );
  lightCone.position.y = 1.7;
  pivot.add(lightCone);

  // Torso silhouette: a lathe profile reshaped into a human bust.
  const body = new THREE.Group();
  body.position.y = 0.3;
  pivot.add(body);
  const profile = [
    [0.0, 0.0],
    [0.5, 0.0],
    [0.56, 0.25],
    [0.5, 0.6],
    [0.47, 0.8],
    [0.54, 1.1],
    [0.6, 1.35],
    [0.62, 1.55],
    [0.52, 1.72],
    [0.3, 1.8],
    [0.17, 1.86],
    [0.16, 2.02],
    [0.15, 2.12],
    [0.0, 2.14],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const torsoGeometry = new THREE.LatheGeometry(profile, coarse ? 40 : 64);
  {
    const p = torsoGeometry.attributes.position;
    for (let i = 0; i < p.count; i += 1) {
      let x = p.getX(i);
      const y = p.getY(i);
      let z = p.getZ(i);
      if (y < 1.95) {
        // Shoulders broaden sideways; the chest stays shallow front-to-back.
        const shoulder = Math.exp(-((y - 1.58) ** 2) / 0.03);
        x *= 1 + 0.55 * shoulder + 0.08 * Math.exp(-((y - 1.2) ** 2) / 0.1);
        z *= 0.62 - 0.12 * shoulder;
        if (z > 0) z *= 1.08; // a little chest volume at the front
      }
      p.setXYZ(i, x, y, z);
    }
    torsoGeometry.computeVertexNormals();
  }
  const holoOuter = kit.holo({ fill: 0.05, rim: 0.9, scan: 0.07 });
  const holoInner = kit.holo({ fill: 0.02, rim: 0.25, scan: 0, side: THREE.BackSide });
  const torso = new THREE.Mesh(kit.track(torsoGeometry), holoOuter);
  const torsoBack = new THREE.Mesh(torsoGeometry, holoInner);
  torsoBack.renderOrder = 1;
  torso.renderOrder = 3;
  body.add(torsoBack, torso);
  // Sculpted head.
  const headGeometry = new THREE.SphereGeometry(1, coarse ? 40 : 56, coarse ? 30 : 42);
  sculptHead(headGeometry);
  kit.track(headGeometry);
  const head = new THREE.Mesh(headGeometry, holoOuter);
  head.scale.setScalar(0.33);
  head.position.set(0, 2.4, 0.02);
  head.renderOrder = 3;
  const headBack = new THREE.Mesh(headGeometry, holoInner);
  headBack.scale.copy(head.scale);
  headBack.position.copy(head.position);
  body.add(headBack, head);

  // Organs (solid, softly emissive).
  const organMat = () =>
    kit.mat({ role: "primary", rough: 0.3, metal: 0.05, emissive: "accent", emissiveIntensity: 0.15, physical: true, clearcoat: 0.7, transparent: true, opacity: 0.88 });
  const organs = [];
  const addOrgan = (mesh, index, halo = 0.3) => {
    mesh.renderOrder = 2;
    body.add(mesh);
    organs[index] = organs[index] || { meshes: [], halo };
    organs[index].meshes.push(mesh);
    return mesh;
  };
  // 0 pancreas (diabetes)
  const pancreasMat = organMat();
  const pancreas = new THREE.Mesh(kit.track(new THREE.CapsuleGeometry(0.06, 0.32, 6, 12)), pancreasMat);
  pancreas.position.set(0.04, 0.86, 0.04);
  pancreas.rotation.z = 1.35;
  addOrgan(pancreas, 0);
  // 1 heart
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -0.16);
  heartShape.bezierCurveTo(-0.2, -0.02, -0.2, 0.14, -0.1, 0.16);
  heartShape.bezierCurveTo(-0.04, 0.17, 0, 0.12, 0, 0.09);
  heartShape.bezierCurveTo(0, 0.12, 0.04, 0.17, 0.1, 0.16);
  heartShape.bezierCurveTo(0.2, 0.14, 0.2, -0.02, 0, -0.16);
  const heartGeometry = kit.track(
    new THREE.ExtrudeGeometry(heartShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.05, bevelSegments: 4, curveSegments: 18 })
  );
  heartGeometry.center();
  const heartMat = organMat();
  const heart = new THREE.Mesh(heartGeometry, heartMat);
  heart.position.set(-0.08, 1.24, 0.14);
  heart.rotation.z = 0.35;
  addOrgan(heart, 1);
  // 2 brain
  const brainGeometry = new THREE.SphereGeometry(0.22, 32, 24);
  {
    const p = brainGeometry.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 1) {
      v.fromBufferAttribute(p, i);
      const folds = 1 + 0.05 * Math.sin(v.x * 48) * Math.sin(v.y * 42 + v.z * 30);
      const split = 1 - 0.1 * Math.exp(-(v.x * v.x) / 0.001) * (v.y > 0 ? 1 : 0);
      v.multiplyScalar(folds * split);
      p.setXYZ(i, v.x * 0.95, v.y * 0.78, v.z * 1.12);
    }
    brainGeometry.computeVertexNormals();
  }
  const brainMat = organMat();
  const brain = new THREE.Mesh(kit.track(brainGeometry), brainMat);
  brain.scale.setScalar(0.85);
  brain.position.set(0, 2.52, -0.03);
  addOrgan(brain, 2);
  // 3 lungs
  const lungGeometry = kit.track(new THREE.SphereGeometry(1, 24, 18));
  const lungMat = kit.mat({ role: "sky", rough: 0.3, metal: 0.05, emissive: "accent", emissiveIntensity: 0.12, physical: true, clearcoat: 0.7, transparent: true, opacity: 0.55, depthWrite: false });
  [-1, 1].forEach((side) => {
    const lung = new THREE.Mesh(lungGeometry, lungMat);
    lung.scale.set(0.17, 0.31, 0.13);
    lung.position.set(side * 0.25, 1.32, -0.04);
    lung.rotation.z = side * -0.12;
    addOrgan(lung, 3);
  });
  // 4 thyroid (butterfly at the neck)
  const thyroidMat = organMat();
  const lobeGeometry = kit.track(new THREE.SphereGeometry(1, 16, 12));
  [-1, 1].forEach((side) => {
    const lobe = new THREE.Mesh(lobeGeometry, thyroidMat);
    lobe.scale.set(0.055, 0.075, 0.04);
    lobe.position.set(side * 0.06, 1.92, 0.11);
    lobe.rotation.z = side * 0.4;
    addOrgan(lobe, 4);
  });
  const organMats = [pancreasMat, heartMat, brainMat, lungMat, thyroidMat];
  const halo = new THREE.Mesh(kit.track(new THREE.TorusGeometry(1, 0.012, 8, 64)), M.accentFill);
  body.add(halo);

  // ECG trace across the front of the base.
  const beat = [
    [0, 0], [0.18, 0], [0.24, 0.08], [0.3, 0], [0.38, 0], [0.42, -0.12], [0.47, 0.72],
    [0.52, -0.22], [0.58, 0], [0.72, 0], [0.8, 0.16], [0.9, 0], [1, 0],
  ];
  const ecgPath = new THREE.CurvePath();
  const pts = [];
  const BEATS = 4;
  const SPAN = 4.2;
  for (let b = 0; b < BEATS; b += 1) {
    beat.forEach(([x, y], k) => {
      if (b > 0 && k === 0) return;
      pts.push(new THREE.Vector3(-SPAN / 2 + ((b + x) / BEATS) * SPAN, 0.45 + y * 0.5, 1.35));
    });
  }
  for (let k = 0; k < pts.length - 1; k += 1) {
    ecgPath.add(new THREE.LineCurve3(pts[k], pts[k + 1]));
  }
  const ECG_SEGMENTS = pts.length * 6;
  const ecgGeometry = kit.track(new THREE.TubeGeometry(ecgPath, ECG_SEGMENTS, 0.022, 6, false));
  const ecg = new THREE.Mesh(ecgGeometry, M.accentFill);
  ecgGeometry.setDrawRange(0, 0);
  pivot.add(ecg);
  const ecgHead = kit.glow("accent", 0.9);
  ecgHead.scale.setScalar(0.35);
  pivot.add(ecgHead);

  // Five risk panels in an arc behind the figure.
  const panelScreens = CONDITIONS.map((name, i) => {
    const holder = new THREE.Group();
    holder.add(new THREE.Mesh(rbox(1.2, 0.78, 0.04, 0.06), M.glass));
    const risk = [0.34, 0.58, 0.72, 0.46, 0.28][i];
    const face = kit.screen(1.12, 0.7, (ctx, W, H, pal, state) => {
      const on = state.active === i;
      fillRound(ctx, 0, 0, W, H, 40, pal.screen);
      ctx.lineWidth = on ? 14 : 6;
      ctx.strokeStyle = on ? pal.accent : pal.line;
      roundRectPath(ctx, 7, 7, W - 14, H - 14, 36);
      ctx.stroke();
      text(ctx, `0${i + 1}`, 60, 110, { size: 44, weight: 500, color: pal.muted, mono: true });
      text(ctx, name, 60, 220, { size: 76, weight: 700, color: pal.ink });
      fillRound(ctx, 60, 380, 880, 44, 22, pal.screen2);
      fillRound(ctx, 60, 380, 880 * risk * (state.fill ?? 0), 44, 22, on ? pal.accent : pal.primary);
      text(ctx, "RISK", 60, 510, { size: 40, weight: 500, color: pal.muted, mono: true });
    }, { px: 240 });
    face.mesh.position.z = 0.025;
    holder.add(face.mesh);
    const angle = (i - 2) * 0.5;
    holder.position.set(Math.sin(angle) * 1.95, 1.95 + (i === 2 ? 0.95 : Math.abs(i - 2) === 1 ? 0.35 : -0.3), -0.55 - Math.cos(angle) * 0.35 + (i === 2 ? -0.25 : 0));
    holder.rotation.y = -angle * 0.8;
    holder.scale.setScalar(0.9);
    pivot.add(holder);
    return face;
  });

  let scan = 0;
  let clock = 0;
  let activeOrgan = -1;
  const setProgress = (t) => {
    const count = Math.round(ecgGeometry.index.count * easeInOut(t * 1.1));
    ecgGeometry.setDrawRange(0, count - (count % 6));
    const tip = ecgPath.getPointAt(Math.min(1, easeInOut(t * 1.1)));
    ecgHead.position.copy(tip);
    ecgHead.visible = t > 0.02 && t < 0.9;
  };
  const setActive = (index, fill) => {
    activeOrgan = index;
    panelScreens.forEach((face) => face.redraw({ active: index, fill }));
  };
  setProgress(0);
  setActive(-1, 0);

  return {
    group,
    bounds: [
      [-2.5, 0, -1.2],
      [2.5, 3.5, 1.4],
    ],
    update(dt, ctx) {
      let moving = tilt(pivot, dt, ctx, 0.1);
      kit.holoMats.forEach((material) => {
        material.uniforms.uTime.value += dt;
      });
      if (ctx.near > 2 && scan > 0) {
        scan = 0;
        setProgress(0);
        setActive(-1, 0);
        return moving;
      }
      if (ctx.near < 0.9 && scan < 1) {
        scan = Math.min(1, scan + dt / 1.8);
        setProgress(scan);
        panelScreens.forEach((face) => face.redraw({ fill: easeOutCubic(scan * 1.4) }));
        moving = true;
      }
      const live = ctx.near < 0.9 && ctx.ambient;
      if (live) {
        clock += dt;
        const index = Math.floor(clock / 1.3) % 5;
        if (index !== activeOrgan) {
          setActive(index, 1);
        }
        const beatPulse = Math.pow(Math.max(0, Math.sin(clock * Math.PI * 1.6)), 6);
        organMats.forEach((material, i) => {
          material.emissiveIntensity = i === index ? 0.35 + beatPulse * 0.9 : 0.12;
        });
        const target = organs[index].meshes[0];
        halo.position.copy(target.position);
        const phase = (clock % 1.3) / 1.3;
        halo.scale.setScalar(0.18 + phase * 0.35);
        halo.visible = phase < 0.8;
        heart.scale.setScalar(1 + (index === 1 ? beatPulse * 0.12 : 0));
        moving = true;
      }
      return moving;
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Movie Recommender — film reel + clapperboard, a film strip of five        */
/* frames linked to the selected title by similarity arcs                    */
/* ------------------------------------------------------------------------ */

function drawPoster(ctx, x, y, w, h, pal, seed, big = false) {
  const tones = [pal.deep, pal.primary, pal.sky, "#0F172A", "#1E40AF"];
  fillRound(ctx, x, y, w, h, big ? 40 : 14, tones[seed % tones.length]);
  ctx.save();
  roundRectPath(ctx, x, y, w, h, big ? 40 : 14);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(x + w * (0.3 + (seed % 3) * 0.2), y + h * 0.38, w * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.72);
  ctx.lineTo(x + w, y + h * (0.5 + (seed % 2) * 0.1));
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.fill();
  ctx.restore();
  fillRound(ctx, x + w * 0.12, y + h * 0.78, w * 0.6, h * 0.05, h * 0.025, "rgba(255,255,255,0.9)");
  fillRound(ctx, x + w * 0.12, y + h * 0.87, w * 0.38, h * 0.035, h * 0.018, "rgba(255,255,255,0.55)");
}

export function buildMovie(kit) {
  const { THREE, M, rbox, coarse } = kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);
  const stage = new THREE.Mesh(rbox(7.4, 0.14, 3.2, 0.07), M.shell2);
  stage.position.y = -0.07;
  pivot.add(stage, kit.shadow(9, 4.4, -0.15));

  // Film reel standing on edge.
  const reelShape = new THREE.Shape();
  reelShape.absarc(0, 0, 0.95, 0, Math.PI * 2, false);
  for (let k = 0; k < 6; k += 1) {
    const a = (k / 6) * Math.PI * 2;
    const hole = new THREE.Path();
    hole.absarc(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.22, 0, Math.PI * 2, true);
    reelShape.holes.push(hole);
  }
  const hub = new THREE.Path();
  hub.absarc(0, 0, 0.09, 0, Math.PI * 2, true);
  reelShape.holes.push(hub);
  const reelGeometry = kit.track(
    new THREE.ExtrudeGeometry(reelShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2, curveSegments: coarse ? 24 : 40 })
  );
  reelGeometry.center();
  const reel = new THREE.Group();
  const plateA = new THREE.Mesh(reelGeometry, M.steel);
  plateA.position.z = 0.2;
  const plateB = new THREE.Mesh(reelGeometry, M.steel);
  plateB.position.z = -0.2;
  const spool = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.42, 0.42, 0.36, 40, 1)).rotateX(Math.PI / 2), M.trim);
  const axle = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 16, 1)).rotateX(Math.PI / 2), M.primary);
  reel.add(plateA, plateB, spool, axle);
  reel.position.set(-2.6, 1.15, -0.2);
  pivot.add(reel);
  const reelStand = new THREE.Mesh(rbox(0.3, 1.15, 0.5, 0.06), M.shell);
  reelStand.position.set(-2.6, 0.55, -0.2);
  pivot.add(reelStand);

  // Clapperboard.
  const clapper = new THREE.Group();
  const slate = new THREE.Mesh(rbox(1.3, 0.95, 0.07, 0.04), M.trim);
  clapper.add(slate);
  const slateFace = kit.screen(1.2, 0.85, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(226,232,240,0.55)";
    ctx.lineWidth = 6;
    [260, 440].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(W - 20, y);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(W / 2, 260);
    ctx.lineTo(W / 2, 440);
    ctx.stroke();
    text(ctx, "SCENE", 40, 200, { size: 56, weight: 600, color: "#E2E8F0", mono: true });
    text(ctx, "TOP 5", 560, 200, { size: 56, weight: 600, color: "#38BDF8", mono: true });
    text(ctx, "SIMILAR", 40, 350, { size: 48, weight: 500, color: "#94A3B8", mono: true });
    text(ctx, "TAKE 1", 540, 350, { size: 48, weight: 500, color: "#94A3B8", mono: true });
    text(ctx, "RECOMMENDER", 40, 560, { size: 58, weight: 700, color: "#E2E8F0", mono: true });
  }, { px: 240, transparent: true });
  slateFace.mesh.position.z = 0.04;
  clapper.add(slateFace.mesh);
  const stripes = kit.screen(1.3, 0.2, (ctx, W, H, pal) => {
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = pal.deep;
    for (let k = -1; k < 8; k += 1) {
      ctx.beginPath();
      ctx.moveTo(k * 140, H);
      ctx.lineTo(k * 140 + 70, H);
      ctx.lineTo(k * 140 + 140, 0);
      ctx.lineTo(k * 140 + 70, 0);
      ctx.closePath();
      ctx.fill();
    }
  }, { px: 200, doubleSide: true });
  const stick = new THREE.Mesh(rbox(1.3, 0.2, 0.06, 0.02, 1), M.trim);
  stick.position.y = 0.58;
  const stickFace = new THREE.Mesh(stripes.mesh.geometry, stripes.mesh.material);
  stickFace.position.set(0, 0.58, 0.035);
  clapper.add(stick, stickFace);
  const armPivot = new THREE.Group();
  armPivot.position.set(-0.65, 0.7, 0);
  const arm = new THREE.Mesh(rbox(1.3, 0.2, 0.06, 0.02, 1), M.trim);
  arm.position.set(0.65, 0.1, 0);
  const armFace = new THREE.Mesh(stripes.mesh.geometry, stripes.mesh.material);
  armFace.position.set(0.65, 0.1, 0.035);
  armPivot.add(arm, armFace);
  clapper.add(armPivot);
  clapper.position.set(-1.25, 0.55, 1.05);
  clapper.rotation.set(-0.1, 0.35, 0);
  pivot.add(clapper);

  // Curved film strip with five frames.
  const STRIP_W = 5.6;
  const STRIP_H = 0.9;
  const curvePoint = (u, out) =>
    out.set(-2.2 + u * 5.0, 1.55 + Math.sin(u * Math.PI * 0.85) * 1.1, -0.1 + Math.sin(u * Math.PI) * 0.9);
  const stripGeometry = new THREE.PlaneGeometry(STRIP_W, STRIP_H, 64, 1);
  {
    const p = stripGeometry.attributes.position;
    const c = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 1) {
      const u = (p.getX(i) + STRIP_W / 2) / STRIP_W;
      const v = p.getY(i);
      curvePoint(u, c);
      const lean = 0.25;
      p.setXYZ(i, c.x, c.y + v * Math.cos(lean), c.z - v * Math.sin(lean));
    }
    stripGeometry.computeVertexNormals();
  }
  const FRAMES = [0.16, 0.34, 0.52, 0.7, 0.88];
  const film = kit.screen(STRIP_W, STRIP_H, (ctx, W, H, pal) => {
    ctx.fillStyle = "#0B1628";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(226,232,240,0.85)";
    for (let k = 0; k < 44; k += 1) {
      const x = 8 + k * 22.6;
      ctx.fillRect(x, 8, 11, 12);
      ctx.fillRect(x, H - 20, 11, 12);
    }
    FRAMES.forEach((u, k) => {
      const fw = 118;
      drawPoster(ctx, u * W - fw / 2, 30, fw, H - 60, pal, k + 1);
    });
  }, { px: 190, doubleSide: true });
  const strip = new THREE.Mesh(kit.track(stripGeometry), film.mesh.material);
  pivot.add(strip);

  // Selected title.
  const selected = new THREE.Group();
  const posterBody = new THREE.Mesh(rbox(1.5, 2.0, 0.06, 0.06), M.shell);
  const posterFace = kit.screen(1.38, 1.88, (ctx, W, H, pal) => {
    drawPoster(ctx, 0, 0, W, H, pal, 0, true);
    text(ctx, "SELECTED", 70, 90, { size: 52, weight: 600, color: "#E0F2FE", mono: true });
  }, { px: 200 });
  posterFace.mesh.position.z = 0.035;
  const frameGlow = new THREE.Mesh(rbox(1.62, 2.12, 0.03, 0.08), M.glow);
  frameGlow.position.z = -0.03;
  selected.add(frameGlow, posterBody, posterFace.mesh);
  selected.position.set(2.2, 1.85, -1.35);
  selected.rotation.y = -0.3;
  pivot.add(selected);

  // Similarity arcs from each frame to the selected poster.
  const target = new THREE.Vector3(2.0, 1.85, -1.2);
  const c = new THREE.Vector3();
  const arcs = FRAMES.map((u, k) => {
    curvePoint(u, c);
    const start = c.clone();
    const mid = start.clone().lerp(target, 0.5);
    mid.y += 1.0 + k * 0.08;
    mid.z -= 0.4;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, target);
    const geometry = kit.track(new THREE.TubeGeometry(curve, 40, 0.018, 6, false));
    geometry.setDrawRange(0, 0);
    const mesh = new THREE.Mesh(geometry, k === 0 ? M.accentFill : M.hiFill);
    pivot.add(mesh);
    const dot = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.06, 12, 8)), M.glow);
    dot.visible = false;
    pivot.add(dot);
    return { geometry, curve, dot };
  });
  const setLinks = (t) => {
    arcs.forEach(({ geometry }, k) => {
      const e = easeOutCubic(t * 1.6 - k * 0.14);
      const count = Math.round(geometry.index.count * e);
      geometry.setDrawRange(0, count - (count % 6));
    });
  };

  let draw = 0;
  let clock = 0;
  return {
    group,
    bounds: [
      [-3.6, -0.2, -1.8],
      [3.6, 4.0, 1.7],
    ],
    update(dt, ctx) {
      let moving = tilt(pivot, dt, ctx, 0.08);
      if (ctx.near > 2 && draw > 0) {
        draw = 0;
        setLinks(0);
        return moving;
      }
      if (ctx.near < 0.9 && draw < 1) {
        draw = Math.min(1, draw + dt / 1.4);
        setLinks(draw);
        moving = true;
      }
      if (ctx.near < 0.9 && ctx.ambient) {
        clock += dt;
        reel.rotation.z -= dt * 0.8;
        const snap = (clock % 3) / 3;
        armPivot.rotation.z = snap < 0.7 ? 0.45 * easeOutCubic(snap / 0.7) : 0.45 * (1 - easeInOut((snap - 0.7) / 0.08));
        arcs.forEach(({ dot, curve }, k) => {
          dot.visible = draw >= 1;
          curve.getPoint(((clock * 0.5 + k * 0.2) % 1 + 1) % 1, dot.position);
        });
        frameGlow.scale.setScalar(1 + Math.sin(clock * 2.4) * 0.01);
        moving = true;
      }
      return moving;
    },
  };
}

