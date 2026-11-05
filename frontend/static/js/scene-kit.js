// Shared building blocks for the 3D journey: theme palettes, lit materials that
// recolour live, rounded geometry, canvas "screens", soft contact shadows and a
// hologram shader. Decorative only.
import * as THREE from "three";
import { RoundedBoxGeometry } from "../vendor/three/addons/RoundedBoxGeometry.js";

// Blue/neutral palettes (brief v4 tokens). No greens anywhere.
export const PALETTES = {
  light: {
    bg: "#F6F9FF",
    shell: "#F4F7FC",
    shell2: "#D9E5F6",
    steel: "#9DB2CF",
    trim: "#24344F",
    primary: "#2563EB",
    deep: "#1D4ED8",
    sky: "#38BDF8",
    accent: "#06B6D4",
    ice: "#BFDBFE",
    glass: "#C7DBFA",
    glassOpacity: 0.34,
    edge: "#64748B",
    dim: "#94A3B8",
    grid: "#D2DEEF",
    road: "#BFD3F2",
    shadow: "#0B2A5B",
    shadowOpacity: 0.2,
    screen: "#FFFFFF",
    screen2: "#EFF5FF",
    ink: "#0F172A",
    muted: "#64748B",
    line: "#DCE6F5",
    holoFill: "#2563EB",
    holoRim: "#1D4ED8",
    holoOpacity: 0.9,
    canopy: ["#BFDBFE", "#93C5FD", "#7DD3FC", "#60A5FA", "#A5B4FC"],
    ambient: 0.35,
    hemi: 0.75,
    hemiSky: "#FFFFFF",
    hemiGround: "#B9CCEA",
    key: 1.55,
    fill: 0.45,
    rim: 0.9,
    env: 0.55,
    glow: 0.85,
  },
  dark: {
    bg: "#071426",
    shell: "#28476F",
    shell2: "#15304F",
    steel: "#7C9BC4",
    trim: "#081322",
    primary: "#3B82F6",
    deep: "#2563EB",
    sky: "#38BDF8",
    accent: "#22D3EE",
    ice: "#1E40AF",
    glass: "#60A5FA",
    glassOpacity: 0.18,
    edge: "#3E6699",
    dim: "#2B4A74",
    grid: "#15304F",
    road: "#1E3A5F",
    shadow: "#000000",
    shadowOpacity: 0.5,
    screen: "#0D1B30",
    screen2: "#11233D",
    ink: "#F8FAFC",
    muted: "#94A3B8",
    line: "#1E3A5F",
    holoFill: "#38BDF8",
    holoRim: "#22D3EE",
    holoOpacity: 1,
    canopy: ["#1D4ED8", "#2563EB", "#0284C7", "#0EA5E9", "#3B82F6"],
    ambient: 0.22,
    hemi: 0.55,
    hemiSky: "#BFD4F2",
    hemiGround: "#030A14",
    key: 1.5,
    fill: 0.35,
    rim: 1.3,
    env: 0.45,
    glow: 1,
  },
};

export const clamp01 = (t) => Math.min(Math.max(t, 0), 1);
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInCubic = (t) => Math.pow(clamp01(t), 3);
export const easeInOut = (t) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const easeOutBack = (t) => {
  const x = clamp01(t);
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
// Moves `value` toward `target` at a steady rate; returns [next, stillMoving].
export const approach = (value, target, step) => {
  const next = value < target ? Math.min(target, value + step) : Math.max(target, value - step);
  return [next, next !== target];
};
export const damp = (value, target, rate, dt) => value + (target - value) * (1 - Math.exp(-rate * dt));

export function createKit({ renderer, scene, coarse }) {
  const disposables = [];
  const themeHooks = [];
  const track = (thing) => {
    disposables.push(thing);
    return thing;
  };
  let palette = PALETTES.light;
  let themeName = "light";

  /* Materials ---------------------------------------------------------- */

  const registry = []; // { material, role, emissive, emissiveIntensity, opacityRole }
  const mat = ({
    role = "shell",
    rough = 0.5,
    metal = 0.05,
    emissive = null,
    emissiveIntensity = 1,
    physical = false,
    clearcoat = 0,
    transparent = false,
    opacity = 1,
    opacityScale = null,
    side = THREE.FrontSide,
    depthWrite = true,
    flat = false,
  } = {}) => {
    const Material = physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
    const material = new Material({
      roughness: rough,
      metalness: metal,
      transparent,
      opacity,
      side,
      depthWrite,
      flatShading: flat,
    });
    if (physical) {
      material.clearcoat = clearcoat;
      material.clearcoatRoughness = 0.12;
    }
    registry.push({ material, role, emissive, emissiveIntensity, opacityScale });
    return track(material);
  };
  const basicRegistry = [];
  const basic = (role, { transparent = false, opacity = 1, blending = THREE.NormalBlending, side = THREE.FrontSide, depthWrite = true, fog = true } = {}) => {
    const material = new THREE.MeshBasicMaterial({ transparent, opacity, blending, side, depthWrite, toneMapped: false, fog });
    basicRegistry.push({ material, role });
    return track(material);
  };
  const lineRegistry = [];
  const line = (role, { transparent = false, opacity = 1 } = {}) => {
    const material = new THREE.LineBasicMaterial({ transparent, opacity });
    lineRegistry.push({ material, role });
    return track(material);
  };

  const M = {
    shell: mat({ role: "shell", rough: 0.42, metal: 0.04 }),
    gloss: mat({ role: "shell", rough: 0.22, metal: 0.08, physical: true, clearcoat: 0.8 }),
    shell2: mat({ role: "shell2", rough: 0.55, metal: 0.04 }),
    steel: mat({ role: "steel", rough: 0.3, metal: 0.75 }),
    trim: mat({ role: "trim", rough: 0.4, metal: 0.2 }),
    primary: mat({ role: "primary", rough: 0.32, metal: 0.12, physical: true, clearcoat: 0.6 }),
    deep: mat({ role: "deep", rough: 0.36, metal: 0.12 }),
    sky: mat({ role: "sky", rough: 0.35, metal: 0.08 }),
    ice: mat({ role: "ice", rough: 0.4, metal: 0.05 }),
    glow: mat({ role: "accent", rough: 0.3, metal: 0, emissive: "accent", emissiveIntensity: 0.9 }),
    glowPrimary: mat({ role: "primary", rough: 0.3, metal: 0, emissive: "primary", emissiveIntensity: 0.7 }),
    glass: mat({
      role: "glass",
      rough: 0.12,
      metal: 0,
      physical: true,
      clearcoat: 1,
      transparent: true,
      opacityScale: 1,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    glassHi: mat({
      role: "primary",
      rough: 0.15,
      metal: 0,
      physical: true,
      clearcoat: 1,
      transparent: true,
      opacityScale: 1.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    screenOff: mat({ role: "trim", rough: 0.15, metal: 0.3, physical: true, clearcoat: 1 }),
    // Unlit fills and lines (accents only).
    accentFill: basic("accent"),
    hiFill: basic("primary"),
    skyFill: basic("sky"),
    beam: basic("accent", { transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
    edge: line("edge"),
    dimLine: line("dim"),
    grid: line("grid"),
    road: line("road"),
    accentLine: line("primary"),
    pulseLine: line("accent"),
  };

  /* Geometry ----------------------------------------------------------- */

  const geometryCache = new Map();
  const rbox = (w, h, d, r = 0.06, segments = coarse ? 2 : 3) => {
    const radius = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    const key = `${w}|${h}|${d}|${radius}|${segments}`;
    if (!geometryCache.has(key)) {
      geometryCache.set(key, track(new RoundedBoxGeometry(w, h, d, segments, Math.max(0.001, radius))));
    }
    return geometryCache.get(key);
  };
  const mesh = (geometry, material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    track(geometry); // disposing a shared geometry twice is harmless
    return m;
  };
  const lineGeometry = (values) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(values, 3));
    return track(geometry);
  };
  const seg = coarse ? 0.6 : 1; // segment multiplier for curved geometry

  /* Canvas screens ------------------------------------------------------ */

  const screens = [];
  // A flat unlit panel whose content is drawn to a canvas with the active palette.
  const screen = (w, h, draw, { px = 220, transparent = false, doubleSide = false } = {}) => {
    const canvas = document.createElement("canvas");
    const scale = coarse ? 0.7 : 1;
    canvas.width = Math.min(1024, Math.round(w * px * scale));
    canvas.height = Math.min(1024, Math.round(h * px * scale));
    const ctx = canvas.getContext("2d");
    const texture = track(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const material = track(
      new THREE.MeshBasicMaterial({
        map: texture,
        toneMapped: false,
        transparent,
        side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
        depthWrite: !transparent,
      })
    );
    const plane = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), material);
    const entry = {
      mesh: plane,
      canvas,
      state: {},
      redraw(state) {
        if (state) {
          Object.assign(entry.state, state);
        }
        const W = canvas.width;
        const H = canvas.height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        ctx.scale(W / 1000, H / ((1000 * h) / w)); // draw in a 1000-wide logical space
        draw(ctx, 1000, (1000 * h) / w, palette, entry.state);
        ctx.restore();
        texture.needsUpdate = true;
      },
    };
    screens.push(entry);
    return entry;
  };

  /* Soft contact shadow -------------------------------------------------- */

  const shadowTexture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return track(new THREE.CanvasTexture(canvas));
  })();
  const shadowMat = track(
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false })
  );
  const shadowPlane = track(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  const shadow = (w, d, y = 0.005) => {
    const m = new THREE.Mesh(shadowPlane, shadowMat);
    m.scale.set(w, 1, d);
    m.position.y = y;
    m.renderOrder = -1;
    return m;
  };

  /* Glow sprite (brief flashes, LEDs) ----------------------------------- */

  const glowTexture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.6)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = track(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  })();
  const glowMats = [];
  const glow = (role = "accent", opacity = 0.9) => {
    const material = track(
      new THREE.SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false, opacity, toneMapped: false })
    );
    material.userData.baseOpacity = opacity;
    glowMats.push({ material, role });
    return new THREE.Sprite(material);
  };

  /* Hologram shader (fresnel rim + faint scan lines) -------------------- */

  const holoMats = [];
  const holo = ({ fill = 0.05, rim = 0.85, scan = 0.06, side = THREE.FrontSide } = {}) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uFill: { value: new THREE.Color() },
        uRim: { value: new THREE.Color() },
        uFillAlpha: { value: fill },
        uRimAlpha: { value: rim },
        uScan: { value: scan },
        uOpacity: { value: 1 },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormalV;
        varying vec3 vViewV;
        varying float vWorldY;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormalV = normalize(normalMatrix * normal);
          vViewV = normalize(-mv.xyz);
          vWorldY = (modelMatrix * vec4(position, 1.0)).y;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uFill;
        uniform vec3 uRim;
        uniform float uFillAlpha;
        uniform float uRimAlpha;
        uniform float uScan;
        uniform float uOpacity;
        uniform float uTime;
        varying vec3 vNormalV;
        varying vec3 vViewV;
        varying float vWorldY;
        void main() {
          float facing = abs(dot(normalize(vNormalV), normalize(vViewV)));
          float fresnel = pow(1.0 - facing, 2.4);
          float lines = smoothstep(0.55, 1.0, sin(vWorldY * 34.0 - uTime * 2.2));
          vec3 color = mix(uFill, uRim, clamp(fresnel * 1.2, 0.0, 1.0));
          float alpha = (uFillAlpha + fresnel * uRimAlpha + lines * uScan) * uOpacity;
          gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      side,
    });
    holoMats.push(material);
    return track(material);
  };

  /* Environment + theme --------------------------------------------------- */

  const setEnvironment = (texture) => {
    scene.environment = texture;
  };

  const applyTheme = (name) => {
    themeName = name === "dark" ? "dark" : "light";
    palette = PALETTES[themeName];
    registry.forEach(({ material, role, emissive, emissiveIntensity, opacityScale }) => {
      material.color.set(palette[role]);
      if (emissive) {
        material.emissive.set(palette[emissive]);
        material.emissiveIntensity = emissiveIntensity * palette.glow;
      }
      if (opacityScale) {
        material.opacity = Math.min(0.9, palette.glassOpacity * opacityScale);
      }
    });
    basicRegistry.forEach(({ material, role }) => material.color.set(palette[role]));
    lineRegistry.forEach(({ material, role }) => material.color.set(palette[role]));
    glowMats.forEach(({ material, role }) => material.color.set(palette[role]));
    holoMats.forEach((material) => {
      material.uniforms.uFill.value.set(palette.holoFill);
      material.uniforms.uRim.value.set(palette.holoRim);
      material.uniforms.uOpacity.value = palette.holoOpacity;
    });
    shadowMat.color.set(palette.shadow);
    shadowMat.opacity = palette.shadowOpacity;
    scene.environmentIntensity = palette.env;
    themeHooks.forEach((hook) => hook(palette, themeName));
    screens.forEach((entry) => entry.redraw());
  };

  const redrawScreens = () => screens.forEach((entry) => entry.redraw());

  return {
    THREE,
    coarse,
    seg,
    M,
    mat,
    basic,
    line,
    rbox,
    mesh,
    lineGeometry,
    screen,
    shadow,
    glow,
    holo,
    track,
    onTheme: (hook) => themeHooks.push(hook),
    palette: () => palette,
    themeName: () => themeName,
    applyTheme,
    redrawScreens,
    setEnvironment,
    holoMats,
    dispose() {
      disposables.forEach((item) => item.dispose?.());
    },
  };
}

/* Canvas drawing helpers ----------------------------------------------------- */

export const FONT = {
  sans: '"Geist", system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, Consolas, monospace',
};

export function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function fillRound(ctx, x, y, w, h, r, color) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

export function text(ctx, value, x, y, { size = 32, weight = 500, color = "#000", mono = false, align = "left" } = {}) {
  ctx.font = `${weight} ${size}px ${mono ? FONT.mono : FONT.sans}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(value, x, y);
}

// Subtle pointer reaction for a station's inner pivot; returns true while still easing.
export function tilt(object, dt, ctx, amount = 0.1, baseY = 0, baseX = 0) {
  const on = ctx.near < 1.2;
  const ty = baseY + (on ? ctx.pointer.x * amount : 0);
  const tx = baseX + (on ? ctx.pointer.y * amount * 0.3 : 0);
  object.rotation.y = damp(object.rotation.y, ty, 3, dt);
  object.rotation.x = damp(object.rotation.x, tx, 3, dt);
  return Math.abs(object.rotation.y - ty) > 0.0015 || Math.abs(object.rotation.x - tx) > 0.0015;
}

// Deterministic pseudo-random in [0, 1).
export function rand(seed) {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Sculpts a unit SphereGeometry into a calm, neutral human head facing +Z
// (brow, eye sockets, nose, cheekbones, lips, chin, jaw, ears). Returns a
// function mapping a unit direction to its sculpted surface point.
export function sculptHead(geometry) {
  const shape = (x, y, z, out) => {
    let sx = 0.8;
    const sy = 1.04;
    let sz = 0.95;
    if (y < 0) {
      const s = Math.pow(-y, 1.4);
      sx *= 1 - 0.3 * s;
      sz *= 1 - 0.12 * s * (z < 0 ? 1.8 : 0.3);
    }
    if (z < 0 && y > -0.25) {
      sz *= 1.07;
    }
    let X = x * sx;
    let Y = y * sy;
    let Z = z * sz;
    const front = smoothstep(0.3, 0.8, z);
    if (front > 0) {
      const g = (du, dv, su, sv) => Math.exp(-(du * du) / su - (dv * dv) / sv);
      const ax = Math.abs(x);
      let d = 0;
      d += 0.17 * g(x, y + 0.1, 0.005, 0.045) * (y < 0.18 ? 1 : 0.3); // nose bridge
      d += 0.09 * g(x, y + 0.27, 0.008, 0.005); // nose tip
      d += 0.04 * g(ax - 0.09, y + 0.3, 0.003, 0.003); // nostril wings
      d += 0.06 * g(x, y - 0.24, 0.14, 0.004); // brow ridge
      d -= 0.08 * g(ax - 0.29, y - 0.09, 0.011, 0.007); // eye sockets
      d += 0.035 * g(ax - 0.29, y - 0.08, 0.0035, 0.0025); // eyelids
      d += 0.035 * g(ax - 0.44, y + 0.1, 0.02, 0.02); // cheekbones
      d += 0.045 * g(x, y + 0.49, 0.028, 0.0028); // upper lip
      d += 0.04 * g(x, y + 0.59, 0.022, 0.0028); // lower lip
      d -= 0.018 * g(x, y + 0.54, 0.03, 0.0005); // mouth line
      d += 0.05 * g(x, y + 0.8, 0.02, 0.012); // chin
      d *= front;
      Z += d;
      X += x * d * 0.15;
    }
    const earSide = smoothstep(0.78, 0.95, Math.abs(x));
    if (earSide > 0) {
      const ear = 0.09 * Math.exp(-((y - 0.02) ** 2) / 0.025 - ((z + 0.08) ** 2) / 0.008) * earSide;
      X += Math.sign(x) * ear;
    }
    return out.set(X, Y, Z);
  };
  const position = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i).normalize();
    shape(v.x, v.y, v.z, v);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return (x, y, z, out = new THREE.Vector3()) => {
    const len = Math.hypot(x, y, z) || 1;
    return shape(x / len, y / len, z / len, out);
  };
}
