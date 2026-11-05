// Lab station: eight glass cubes, one per mini game, each holding a tiny 3D model
// of its game. Hover/focus lifts a cube; "Play" raises it, bursts it open and lets
// the game emerge (scene.js projects the cube so the HTML modal can grow out of it).
import { clamp01, easeOutCubic, easeInCubic, easeOutBack, easeInOut, damp } from "./scene-kit.js";

export const GAME_ORDER = ["snake", "tic", "memory", "pong", "flappy", "racer", "shooter", "platformer"];

const SIZE = 0.92;
const HALF = SIZE / 2;
const LIFT_HOVER = 0.45;
const LIFT_RISE = 1.15;

// Launch timeline (ms)
const T_RISE = 250;
const T_BURST_START = 230;
const T_BURST = 320;
const T_EMERGE_START = 470;
const T_EMERGE = 430;
const T_CLOSE = 420;

const MINI_COLORS = {
  light: { floor: "#DCE7F7", ink: "#1E293B", main: "#2563EB", soft: "#93C5FD", glow: "#06B6D4", white: "#FFFFFF" },
  dark: { floor: "#1E3A5F", ink: "#E2E8F0", main: "#3B82F6", soft: "#60A5FA", glow: "#22D3EE", white: "#CBD5E1" },
};

export function buildLab(kit) {
  const { THREE, M, rbox } = kit;
  const group = new THREE.Group();
  const bgColor = new THREE.Color();

  // Plinth the grid of cubes floats above.
  const plinth = new THREE.Mesh(rbox(6.3, 0.22, 3.6, 0.1), M.shell2);
  plinth.position.y = -0.95;
  group.add(plinth);
  const plinthTop = new THREE.Mesh(rbox(6.0, 0.04, 3.3, 0.02), M.shell);
  plinthTop.position.y = -0.83;
  group.add(plinthTop);

  const faceGeometry = rbox(SIZE, SIZE, 0.035, 0.03, 2);
  const faceEdges = kit.track(new THREE.EdgesGeometry(new THREE.BoxGeometry(SIZE - 0.02, SIZE - 0.02, 0.036)));
  const NORMALS = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];
  const Z = new THREE.Vector3(0, 0, 1);
  const baseLift = [0, 0.22, 0.08, 0.3, 0.16, 0, 0.26, 0.12];

  // Per-cube materials so one cube can burst/fade while the others dim.
  const miniMaterial = (role, extra = {}) => {
    const material = kit.track(new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.08, ...extra }));
    material.userData.role = role;
    return material;
  };

  const cubes = GAME_ORDER.map((id, index) => {
    const slot = new THREE.Group();
    slot.position.set(((index % 4) - 1.5) * 1.42, baseLift[index], (Math.floor(index / 4) - 0.5) * 1.5);
    group.add(slot);

    const lift = new THREE.Group();
    slot.add(lift);

    const shadow = kit.shadow(1.35, 1.35);
    shadow.position.set(slot.position.x, -0.805, slot.position.z);
    group.add(shadow);

    const glass = kit.track(
      new THREE.MeshPhysicalMaterial({
        roughness: 0.14,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    const rim = kit.track(new THREE.LineBasicMaterial({ transparent: true }));

    const faces = NORMALS.map((normal, k) => {
      const pivot = new THREE.Group();
      pivot.quaternion.setFromUnitVectors(Z, normal);
      const slab = new THREE.Group();
      slab.position.z = HALF - 0.018;
      slab.add(new THREE.Mesh(faceGeometry, glass));
      slab.add(new THREE.LineSegments(faceEdges, rim));
      pivot.add(slab);
      lift.add(pivot);
      // Deterministic "random" spin per face.
      const r = Math.sin((index + 1) * 12.9898 + (k + 1) * 78.233) * 43758.5453;
      const f = r - Math.floor(r);
      return { pivot, slab, spinX: (f - 0.5) * 2.4, spinY: (0.5 - ((f * 7) % 1)) * 2.0, reach: 0.95 + f * 0.5 };
    });

    const mats = {
      floor: miniMaterial("floor", { roughness: 0.6 }),
      ink: miniMaterial("ink"),
      main: miniMaterial("main", { roughness: 0.3 }),
      soft: miniMaterial("soft"),
      glow: miniMaterial("glow", { roughness: 0.3 }),
      white: miniMaterial("white"),
    };
    const mini = new THREE.Group();
    const anim = buildMini(kit, id, mini, mats);
    lift.add(mini);

    return {
      id,
      index,
      slot,
      lift,
      glass,
      rim,
      faces,
      mats,
      mini,
      anim,
      shadow,
      hover: 0,
      yaw: (index % 3) * 0.14 - 0.14,
      pitch: 0,
      dim: 0,
      dip: 0,
    };
  });

  // Burst effects shared by whichever cube launches.
  const flash = kit.glow("accent", 0.9);
  flash.visible = false;
  group.add(flash);
  const light = new THREE.PointLight(0xffffff, 0, 5, 2);
  group.add(light);
  const shardGeometry = kit.track(new THREE.TetrahedronGeometry(0.06, 0));
  const shardMat = kit.track(new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.1, transparent: true }));
  const shards = Array.from({ length: 12 }, (_, k) => {
    const shard = new THREE.Mesh(shardGeometry, shardMat);
    const a = (k / 12) * Math.PI * 2;
    const up = ((k * 37) % 11) / 11;
    shard.userData.dir = new THREE.Vector3(Math.cos(a), up * 1.2 - 0.2, Math.sin(a)).normalize();
    shard.userData.speed = 1.1 + ((k * 53) % 7) / 10;
    shard.visible = false;
    group.add(shard);
    return shard;
  });

  let palette = kit.palette();
  let theme = kit.themeName();
  const colorCache = {};
  const applyColors = (cube) => {
    const colors = MINI_COLORS[theme];
    const mix = cube.dim * 0.55;
    Object.values(cube.mats).forEach((material) => {
      const key = material.userData.role;
      colorCache[key] = colorCache[key] || new THREE.Color();
      material.color.set(colors[key]).lerp(bgColor, mix);
      if (key === "glow") {
        material.emissive.set(colors.glow);
        material.emissiveIntensity = (0.55 + (cube.flash || 0) * 1.6) * (1 - mix);
      }
    });
    const burstFade = 1 - (cube.fade || 0);
    cube.glass.color.set(palette.glass);
    cube.glass.opacity = (theme === "dark" ? 0.16 : 0.2) * (1 - cube.dim * 0.5) * burstFade;
    cube.rim.color.set(cube.hover > 0.5 || cube.selected ? palette.primary : palette.edge);
    cube.rim.opacity = (theme === "dark" ? 0.75 : 0.55) * (1 - cube.dim * 0.55) * burstFade;
    const hidden = burstFade <= 0.01;
    cube.faces.forEach(({ slab }) => {
      slab.visible = !hidden;
    });
  };
  const applyTheme = (nextPalette, name) => {
    palette = nextPalette;
    theme = name;
    bgColor.set(palette.bg);
    shardMat.color.set(palette.sky);
    light.color.set(palette.accent);
    cubes.forEach(applyColors);
  };
  kit.onTheme(applyTheme);
  applyTheme(kit.palette(), kit.themeName());

  /* Launch state ------------------------------------------------------------ */

  const launch = { index: -1, start: 0, closing: false, closeStart: 0, from: null };
  const tmp = new THREE.Vector3();
  const local = new THREE.Vector3();

  const phases = (now) => {
    if (launch.index < 0) {
      return { rise: 0, burst: 0, emerge: 0 };
    }
    const e = now - launch.start;
    let rise = easeOutCubic(e / T_RISE);
    let burst = clamp01((e - T_BURST_START) / T_BURST);
    let emerge = clamp01((e - T_EMERGE_START) / T_EMERGE);
    if (launch.closing) {
      const c = now - launch.closeStart;
      const from = launch.from;
      emerge = from.emerge * (1 - easeInOut(c / 230));
      burst = from.burst * (1 - easeInOut((c - 60) / 280));
      rise = from.rise * (1 - easeInOut((c - 170) / 250));
    }
    return { rise, burst, emerge };
  };

  const station = {
    group,
    hovered: -1,
    phase: { rise: 0, burst: 0, emerge: 0 },
    launch(index, now) {
      if (launch.index >= 0 && launch.index !== index) {
        launch.index = -1; // switching games: snap the previous cube back
      }
      launch.index = index;
      launch.start = now;
      launch.closing = false;
    },
    close(index, now) {
      if (launch.index !== index || launch.closing) {
        return false;
      }
      launch.from = phases(now);
      launch.closing = true;
      launch.closeStart = now;
      return true;
    },
    reset() {
      launch.index = -1;
      launch.closing = false;
    },
    busy(now) {
      if (launch.index < 0) {
        return false;
      }
      if (launch.closing) {
        return now - launch.closeStart < T_CLOSE + 80;
      }
      return now - launch.start < T_EMERGE_START + T_EMERGE + 60;
    },
    active: () => launch.index,
    // World-space centre and half-size of a cube as currently displayed.
    cubeBox(index, center) {
      const cube = cubes[index];
      if (!cube) {
        return 0;
      }
      cube.lift.getWorldPosition(center);
      return HALF * cube.lift.scale.x * 1.15;
    },
    // Camera dolly toward the rising cube (0..1).
    focus(target) {
      if (launch.index < 0) {
        return 0;
      }
      cubes[launch.index].lift.getWorldPosition(target);
      return station.phase.rise;
    },
    update(dt, ctx) {
      const now = ctx.now;
      const p = phases(now);
      station.phase = p;
      if (launch.closing && now - launch.closeStart > T_CLOSE) {
        launch.index = -1;
        launch.closing = false;
      }
      const selected = launch.index;
      const active = ctx.near < 1.2;
      let moving = selected >= 0;

      // Camera position in the lab's local space (for "turn to face the camera").
      group.updateMatrixWorld();
      local.copy(ctx.cameraPos);
      group.worldToLocal(local);

      cubes.forEach((cube) => {
        const isSelected = cube.index === selected;
        cube.selected = isSelected;
        const hoverTarget = cube.index === station.hovered && !isSelected ? 1 : 0;
        const nextHover = damp(cube.hover, hoverTarget, 10, dt);
        if (Math.abs(nextHover - hoverTarget) > 0.002) {
          moving = true;
        }
        cube.hover = Math.abs(nextHover - hoverTarget) < 0.002 ? hoverTarget : nextHover;

        const rise = isSelected ? p.rise : 0;
        const others = selected >= 0 && !isSelected ? p.rise : 0;
        cube.dim = others;
        cube.fade = isSelected ? easeInCubic(p.burst * 1.05) : 0;
        cube.flash = isSelected ? Math.sin(Math.PI * clamp01(p.burst * 1.4)) : 0;

        // Lift, dip, face the camera.
        cube.lift.position.y = cube.hover * LIFT_HOVER + rise * LIFT_RISE - others * 0.16;
        const facing = Math.max(cube.hover, rise);
        tmp.copy(local).sub(cube.slot.position);
        const targetYaw = Math.atan2(tmp.x, tmp.z);
        const targetPitch = -Math.atan2(tmp.y - cube.lift.position.y, Math.hypot(tmp.x, tmp.z)) * 0.35;
        const idleYaw = cube.yaw + (active && ctx.ambient ? Math.sin(now / 1400 + cube.index) * 0.05 : 0);
        cube.lift.rotation.y = idleYaw + (shortAngle(idleYaw, targetYaw) - idleYaw) * facing;
        cube.lift.rotation.x = targetPitch * facing;
        cube.lift.scale.setScalar(1 + rise * 0.14 - others * 0.06);
        const lifted = cube.lift.position.y + cube.slot.position.y;
        cube.shadow.scale.setScalar(1.35 * (1 + lifted * 0.18));

        // Hover previews and selected launches share the same cube opening.
        // Because hover is damped per cube, leaving one cube closes it in reverse
        // while the next cube opens without snapping either state.
        const open = isSelected ? easeOutCubic(p.burst) : cube.hover;
        const b = open;
        cube.faces.forEach((face) => {
          face.slab.position.z = HALF - 0.018 + b * face.reach;
          face.slab.rotation.x = b * face.spinX;
          face.slab.rotation.y = b * face.spinY;
        });

        // The game model emerges from the opened cube.
        const m = isSelected ? p.emerge : cube.hover;
        const grow = m > 0 ? easeOutBack(m) : 0;
        cube.mini.scale.setScalar(1 + grow * 0.85);
        cube.mini.position.y = grow * 0.28;

        if (active && ctx.ambient) {
          cube.anim?.(now / 1000, dt);
        }
        applyColors(cube);
      });
      if (active && ctx.ambient) {
        moving = true;
      }

      // Bloom + shards from the opening.
      if (selected >= 0 && p.burst > 0 && p.burst < 1) {
        const cube = cubes[selected];
        cube.lift.getWorldPosition(tmp);
        group.worldToLocal(tmp);
        const k = p.burst;
        flash.visible = true;
        flash.position.copy(tmp);
        flash.scale.setScalar(0.6 + easeOutCubic(k) * 2.6);
        flash.material.opacity = Math.sin(Math.PI * k) * 0.85;
        light.position.copy(tmp);
        light.intensity = Math.sin(Math.PI * k) * 6;
        shardMat.opacity = 1 - easeInCubic(k);
        shards.forEach((shard) => {
          shard.visible = true;
          shard.position.copy(tmp).addScaledVector(shard.userData.dir, easeOutCubic(k) * shard.userData.speed);
          shard.rotation.set(k * 6 * shard.userData.speed, k * 4, 0);
        });
      } else {
        flash.visible = false;
        light.intensity = 0;
        shards.forEach((shard) => {
          shard.visible = false;
        });
      }
      return moving;
    },
  };
  return station;
}

function shortAngle(from, to) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta;
}

/* Miniatures (inside a 0.92 cube; floor at y = -0.36) ------------------------ */

function buildMini(kit, id, mini, mats) {
  const { THREE, rbox } = kit;
  const add = (geometry, material, x, y, z, parent = mini) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const FLOOR = -0.36;
  add(rbox(0.72, 0.035, 0.72, 0.015, 2), mats.floor, 0, FLOOR, 0);

  switch (id) {
    case "snake": {
      const cell = 0.12;
      const body = [
        [-2, 1],
        [-1, 1],
        [0, 1],
        [0, 0],
        [0, -1],
        [1, -1],
      ];
      const segment = rbox(0.105, 0.09, 0.105, 0.03, 2);
      const parts = body.map(([x, z], i) => add(segment, i === body.length - 1 ? mats.main : mats.soft, x * cell, FLOOR + 0.065, z * cell));
      const eye = kit.track(new THREE.SphereGeometry(0.014, 8, 6));
      add(eye, mats.ink, 1 * cell + 0.03, FLOOR + 0.115, -cell + 0.03);
      add(eye, mats.ink, 1 * cell + 0.03, FLOOR + 0.115, -cell - 0.03);
      const food = add(kit.track(new THREE.SphereGeometry(0.045, 14, 10)), mats.glow, 2.4 * cell, FLOOR + 0.08, 1.6 * cell);
      return (t) => {
        food.position.y = FLOOR + 0.08 + Math.sin(t * 3) * 0.02;
        parts.forEach((part, i) => {
          part.position.y = FLOOR + 0.065 + Math.max(0, Math.sin(t * 5 - i * 0.9)) * 0.015;
        });
      };
    }
    case "tic": {
      const board = new THREE.Group();
      board.position.set(0, -0.02, 0);
      board.rotation.x = -0.55;
      mini.add(board);
      const bar = rbox(0.62, 0.028, 0.028, 0.012, 2);
      [-0.1, 0.1].forEach((v) => {
        add(bar, mats.ink, 0, v, 0, board);
        const vertical = add(bar, mats.ink, v, 0, 0, board);
        vertical.rotation.z = Math.PI / 2;
      });
      const xBar = rbox(0.15, 0.03, 0.03, 0.012, 2);
      const makeX = (x, y, material) => {
        const a = add(xBar, material, x, y, 0.02, board);
        a.rotation.z = Math.PI / 4;
        const b = add(xBar, material, x, y, 0.02, board);
        b.rotation.z = -Math.PI / 4;
      };
      const ring = kit.track(new THREE.TorusGeometry(0.052, 0.016, 8, 24));
      makeX(-0.2, 0.2, mats.main);
      makeX(0, 0, mats.main);
      add(ring, mats.soft, 0.2, 0.2, 0.02, board);
      add(ring, mats.soft, -0.2, -0.2, 0.02, board);
      const winner = add(ring, mats.glow, 0.2, -0.2, 0.02, board);
      return (t) => {
        winner.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
      };
    }
    case "memory": {
      const tile = rbox(0.24, 0.3, 0.035, 0.02, 2);
      const tiles = [];
      [
        [-0.14, 0.02],
        [0.14, 0.02],
        [-0.14, -0.14],
        [0.14, -0.14],
      ].forEach(([x, y], i) => {
        const pivot = new THREE.Group();
        pivot.position.set(x, y + 0.02, -0.02 + i * 0.01);
        pivot.rotation.x = -0.35;
        mini.add(pivot);
        add(tile, i === 1 ? mats.main : mats.soft, 0, 0, 0, pivot);
        if (i === 1) {
          add(kit.track(new THREE.SphereGeometry(0.035, 12, 8)), mats.glow, 0, 0, 0.03, pivot);
        }
        tiles.push(pivot);
      });
      return (t) => {
        const k = (t % 4) / 4;
        tiles[2].rotation.y = k > 0.6 && k < 0.95 ? Math.sin(((k - 0.6) / 0.35) * Math.PI) * Math.PI : 0;
      };
    }
    case "pong": {
      const paddle = rbox(0.045, 0.07, 0.22, 0.02, 2);
      const left = add(paddle, mats.ink, -0.28, FLOOR + 0.055, 0);
      const right = add(paddle, mats.main, 0.28, FLOOR + 0.055, 0.05);
      const dash = rbox(0.018, 0.012, 0.05, 0.005, 1);
      for (let k = -2; k <= 2; k += 1) {
        add(dash, mats.soft, 0, FLOOR + 0.025, k * 0.12);
      }
      const ball = add(kit.track(new THREE.SphereGeometry(0.04, 14, 10)), mats.glow, 0.1, FLOOR + 0.06, -0.04);
      return (t) => {
        const x = Math.sin(t * 1.8) * 0.22;
        const z = Math.sin(t * 2.7) * 0.2;
        ball.position.x = x;
        ball.position.z = z;
        left.position.z = z * 0.8;
        right.position.z = z * 0.85;
      };
    }
    case "flappy": {
      const pipe = kit.track(new THREE.CylinderGeometry(0.055, 0.055, 1, 16, 1));
      const cap = kit.track(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16, 1));
      const pipePair = (x, gapY) => {
        const bottomH = gapY - 0.1 - FLOOR;
        const bottom = add(pipe, mats.soft, x, FLOOR + bottomH / 2, -0.05);
        bottom.scale.y = bottomH;
        add(cap, mats.main, x, FLOOR + bottomH, -0.05);
        const topStart = gapY + 0.12;
        const topH = 0.38 - topStart;
        const top = add(pipe, mats.soft, x, topStart + topH / 2, -0.05);
        top.scale.y = topH;
        add(cap, mats.main, x, topStart, -0.05);
      };
      pipePair(0.05, 0.02);
      pipePair(0.28, -0.08);
      const bird = new THREE.Group();
      bird.position.set(-0.2, 0.02, 0.08);
      mini.add(bird);
      add(kit.track(new THREE.SphereGeometry(0.065, 16, 12)), mats.main, 0, 0, 0, bird);
      const beak = add(kit.track(new THREE.ConeGeometry(0.025, 0.06, 8)), mats.glow, 0.075, -0.005, 0, bird);
      beak.rotation.z = -Math.PI / 2;
      add(kit.track(new THREE.SphereGeometry(0.014, 8, 6)), mats.white, 0.04, 0.03, 0.045, bird);
      const wing = add(rbox(0.06, 0.012, 0.05, 0.005, 1), mats.soft, -0.01, 0, 0.06, bird);
      return (t) => {
        bird.position.y = 0.02 + Math.sin(t * 3.2) * 0.05;
        wing.rotation.x = Math.sin(t * 16) * 0.5;
      };
    }
    case "racer": {
      add(rbox(0.38, 0.03, 0.7, 0.015, 2), mats.ink, 0, FLOOR + 0.03, 0);
      const dash = rbox(0.018, 0.01, 0.07, 0.004, 1);
      const dashes = [];
      for (let k = 0; k < 5; k += 1) {
        dashes.push(add(dash, mats.white, 0, FLOOR + 0.05, -0.3 + k * 0.15));
      }
      const car = rbox(0.1, 0.06, 0.17, 0.025, 2);
      const player = add(car, mats.main, -0.09, FLOOR + 0.085, 0.16);
      add(rbox(0.07, 0.035, 0.07, 0.015, 1), mats.white, 0, 0.04, -0.01, player);
      const other = add(car, mats.soft, 0.09, FLOOR + 0.085, -0.14);
      add(rbox(0.07, 0.035, 0.07, 0.015, 1), mats.white, 0, 0.04, 0.01, other);
      return (t) => {
        dashes.forEach((d, k) => {
          d.position.z = -0.32 + (((k * 0.15 + t * 0.35) % 0.75) + 0.75) % 0.75 - 0.04;
        });
        player.position.x = -0.09 + Math.sin(t * 1.2) * 0.02;
      };
    }
    case "shooter": {
      const ship = new THREE.Group();
      ship.position.set(0, -0.22, 0.05);
      mini.add(ship);
      const hull = add(kit.track(new THREE.ConeGeometry(0.07, 0.2, 4)), mats.main, 0, 0, 0, ship);
      hull.rotation.y = Math.PI / 4;
      const wings = add(rbox(0.2, 0.03, 0.06, 0.012, 1), mats.soft, 0, -0.06, 0, ship);
      wings.rotation.set(0, 0, 0);
      const enemy = kit.track(new THREE.OctahedronGeometry(0.055, 0));
      const enemies = [-0.2, 0, 0.2].map((x, k) => add(enemy, mats.ink, x, 0.22 - (k % 2) * 0.06, -0.05));
      const bullet = add(kit.track(new THREE.CapsuleGeometry(0.014, 0.05, 4, 8)), mats.glow, 0, -0.05, 0.05);
      return (t) => {
        enemies.forEach((e, k) => {
          e.rotation.y = t * 1.5 + k;
        });
        bullet.position.y = -0.1 + ((t * 0.5) % 1) * 0.3;
        ship.position.x = Math.sin(t * 1.1) * 0.05;
      };
    }
    case "platformer":
    default: {
      const platform = rbox(0.28, 0.045, 0.2, 0.015, 2);
      add(platform, mats.ink, -0.2, FLOOR + 0.08, 0.05);
      add(platform, mats.soft, 0.02, -0.12, -0.02);
      add(platform, mats.main, 0.22, 0.04, -0.08);
      const hero = add(rbox(0.06, 0.1, 0.06, 0.02, 1), mats.main, -0.22, FLOOR + 0.155, 0.05);
      const shape = new THREE.Shape();
      for (let k = 0; k < 10; k += 1) {
        const r = k % 2 === 0 ? 0.075 : 0.032;
        const a = (k / 10) * Math.PI * 2 + Math.PI / 2;
        if (k === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      shape.closePath();
      const starGeometry = kit.track(
        new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2 })
      );
      starGeometry.center();
      const starMesh = add(starGeometry, mats.glow, 0.22, 0.2, -0.08);
      return (t) => {
        starMesh.rotation.y = t * 1.6;
        hero.position.y = FLOOR + 0.155 + Math.max(0, Math.sin(t * 2.4)) * 0.08;
      };
    }
  }
}
