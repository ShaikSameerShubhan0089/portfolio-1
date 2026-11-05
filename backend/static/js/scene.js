// 3D scroll journey. Decorative only: every piece of content lives in the HTML.
// Native scroll drives a camera along a spline through one station per chapter.
import * as THREE from "three";
import { RoomEnvironment } from "../vendor/three/addons/RoomEnvironment.js";
import { createKit, easeInOut, PALETTES } from "./scene-kit.js";
import { buildLab } from "./scene-lab.js";
import { buildIntro, buildCarbon, buildRise, buildQueryVault } from "./scene-stations-a.js";
import { buildPortfolioGen, buildPortfolio, buildDisease, buildMovie } from "./scene-stations-b.js";
import { buildAutoFeel, buildFace, buildIot, buildExperience, MARKERS_Z } from "./scene-stations-c.js";

const FOV = 40;
const DAMPING = 6; // camera catch-up rate (1/s); ~0.5s to settle
const AMBIENT_WINDOW = 8000; // station animations run this long after the last interaction
const IDLE_STOP = 2000; // stop rendering once nothing has changed for this long
const STAGE_FILL = 0.9; // share of a small-screen 3D stage the station should fill

export function startJourney(host) {
  if (!host || host.dataset.started) {
    return null;
  }
  const buildStart = performance.now();
  host.dataset.started = "true";

  const coarse = window.matchMedia("(max-width: 767px)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
  } catch {
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75));
  renderer.setClearColor(PALETTES.light.bg, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PALETTES.light.bg, 20, 64);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 4000);

  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x000000, 0.7);
  scene.add(ambient, hemisphere);
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(6, 12, 9);
  scene.add(key);
  const fillLight = new THREE.DirectionalLight(0xdbe8ff, 0.4);
  fillLight.position.set(-9, 4, 6);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0xbfdbfe, 0.8);
  rimLight.position.set(-2, 6, -12);
  scene.add(rimLight);

  // Lit, theme-aware building blocks shared by every station + a soft studio environment.
  const kit = createKit({ renderer, scene, coarse });
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTarget = pmrem.fromScene(room, 0.04);
    kit.track(envTarget);
    room.dispose?.();
    pmrem.dispose();
    kit.setEnvironment(envTarget.texture);
  } catch {
    // Reflections are a nicety; lights alone still read.
  }

  // Re-reads the active theme and recolours everything in place (no rebuild).
  const applyTheme = () => {
    const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const palette = PALETTES[theme];
    const cssBg = window.getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    const bg = /^#[0-9a-f]{6}$/i.test(cssBg) ? cssBg : palette.bg;
    renderer.setClearColor(bg, 1);
    scene.fog.color.set(bg);
    kit.applyTheme(theme);
    const lit = kit.palette();
    ambient.intensity = lit.ambient;
    hemisphere.color.set(lit.hemiSky);
    hemisphere.groundColor.set(lit.hemiGround);
    hemisphere.intensity = lit.hemi;
    key.intensity = lit.key;
    fillLight.intensity = lit.fill;
    rimLight.intensity = lit.rim;
  };

  /* ---------------------------------------------------------------- */
  /* Stations                                                          */
  /* ---------------------------------------------------------------- */

  const P = {
    intro: new THREE.Vector3(0, 0, 0),
    carbon: new THREE.Vector3(-1, -1.2, -36),
    rise: new THREE.Vector3(1.5, -1.6, -72),
    queryvault: new THREE.Vector3(-1.5, -0.8, -108),
    portfoliogen: new THREE.Vector3(1.5, -0.6, -144),
    portfolio: new THREE.Vector3(-1.5, -0.4, -180),
    disease: new THREE.Vector3(1.5, -1.0, -216),
    movie: new THREE.Vector3(-1.5, -1.2, -252),
    autofeel: new THREE.Vector3(1.5, -0.8, -288),
    face: new THREE.Vector3(-1.5, -0.8, -324),
    iot: new THREE.Vector3(1.5, -0.8, -360),
    experience: new THREE.Vector3(0, -1.2, -396),
    lab: new THREE.Vector3(-1.5, -0.6, -452),
  };

  const stations = {};

  // Places a station built in a scene-stations module on the path.
  const mount = (name, station, { rotation = [0, 0, 0], scale = 1, offset = [0, 0, 0] } = {}) => {
    station.group.position.copy(P[name]).add(new THREE.Vector3(...offset));
    station.group.rotation.set(...rotation);
    station.group.scale.setScalar(scale);
    scene.add(station.group);
    stations[name] = station;
  };

  // 1. Intro — AI systems core (plinth under the hero photos).
  mount("intro", buildIntro(kit), { rotation: [0.1, -0.6, 0], scale: 0.7 });
  // 2. CarbonSphere — terrain tile, canopy, satellite scan.
  mount("carbon", buildCarbon(kit), { rotation: [0, 0.5, 0] });
  // 3. RISE — clinical monitor, risk tiers, SHAP bars.
  mount("rise", buildRise(kit), { rotation: [0, -0.45, 0] });
  // 4. QueryVault — database stack with agent robots.
  mount("queryvault", buildQueryVault(kit), { rotation: [0, 0.35, 0], offset: [0, -0.4, 0] });

  // 5. Portfolio — résumé envelope through the security gate into the inbox.
  mount("portfolio", buildPortfolio(kit), { rotation: [0, -0.75, 0] });

  // Case 04 Portfolio Generator — laptop with template cards.
  mount("portfoliogen", buildPortfolioGen(kit), { rotation: [0, -0.3, 0] });
  // Case 06 Disease Prediction — holographic torso with organ zones.
  mount("disease", buildDisease(kit), { rotation: [0, 0.12, 0] });
  // Case 07 Movie Recommender — reel, clapperboard, film strip, similarity arcs.
  mount("movie", buildMovie(kit), { rotation: [0, 0.25, 0] });

  // Case 08 Car Pulse — car on a turntable, sentiment gauge, review bubbles.
  mount("autofeel", buildAutoFeel(kit));
  // Case 09 Facial Recognition — sculpted bust, scan plane, landmarks, lock-on frame.
  mount("face", buildFace(kit));
  // Case 10 IoT Gas Leak — cylinder, sensor board, alert beacon.
  mount("iot", buildIot(kit));
  // 6. Experience — timeline rail with milestone pillars and emblem plates.
  mount("experience", buildExperience(kit));

  // 7. Lab — eight glass game cubes; see scene-lab.js (hover lift, launch burst).
  {
    const lab = buildLab(kit);
    lab.group.position.copy(P.lab);
    lab.group.rotation.set(0.12, 0.4, 0);
    scene.add(lab.group);
    stations.lab = lab;
  }

  // 8. Contact — the whole path as a quiet constellation. The same line is the "road"
  // between stations while scrolling.
  {
    const roadPoints = [
      P.intro,
      P.carbon,
      P.rise,
      P.queryvault,
      P.portfoliogen,
      P.portfolio,
      P.disease,
      P.movie,
      P.autofeel,
      P.face,
      P.iot,
      P.experience,
      P.experience.clone().setZ(P.experience.z - 24),
      P.lab,
    ].map((point) => point.clone().setY(point.y - 0.02));
    const path = new THREE.CatmullRomCurve3(roadPoints, false, "centripetal");
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(coarse ? 360 : 600));
    const pathLine = new THREE.Line(kit.track(pathGeometry), kit.M.road);
    scene.add(pathLine);
    stations.path = {
      group: pathLine,
      alwaysUpdate: true,
      update() {
        return false;
      },
    };
  }

  /* ---------------------------------------------------------------- */
  /* Camera path from DOM layout                                       */
  /* ---------------------------------------------------------------- */

  // Base camera distance/elevation per station. The final framing is fitted to the
  // free screen area measured from the real layout (panel edge ↔ chapter rail), or to
  // the station's own 3D stage element on small screens and in the hero.
  const VIEWS = {
    intro: { d: 13, h: 4.8, lookY: 0 },
    carbon: { d: 17, h: 10, lookY: -0.5 },
    rise: { d: 12.5, h: 3.2, lookY: 2 },
    queryvault: { d: 12.5, h: 3.6, lookY: 0.6 },
    portfoliogen: { d: 10.5, h: 3.0, lookY: 1.4 },
    portfolio: { d: 9.5, h: 3.2, lookY: 1.4 },
    disease: { d: 8, h: 2.4, lookY: 1.6 },
    movie: { d: 12, h: 2.4, lookY: 2.6 },
    autofeel: { d: 11.5, h: 3.8, lookY: 1.0 },
    face: { d: 9.5, h: 2.0, lookY: 1.8 },
    iot: { d: 11, h: 6, lookY: 1.2 },
    experience: { d: 8, h: 3.2, lookY: 0.8 },
    // The Lab shares the desktop scene with a wide text panel. Keep its camera
    // close enough that the cube burst and miniature game pieces read clearly.
    lab: { d: 6.8, h: 3.2, lookY: 0.2 },
  };

  const hosts = Array.from(document.querySelectorAll("[data-station]"));
  const railEl = document.querySelector(".chapter-rail");
  const headerEl = document.querySelector(".site-header");
  const layout = []; // desktop: { name, start, end, a, b }
  const stageViews = []; // small screens: { name, top, left, width, height, position, target }
  let positionCurve = null;
  let targetCurve = null;
  let controlCount = 1;
  let viewport = { w: 1, h: 1, aspect: 1, mobile: coarse, mult: 1, stages: false };

  // World-space points that bound everything a station draws (lines and nodes included).
  scene.updateMatrixWorld(true);
  const boxPoints = (group, min, max) => {
    const points = [];
    for (let i = 0; i < 8; i += 1) {
      points.push(
        new THREE.Vector3(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z).applyMatrix4(group.matrixWorld)
      );
    }
    return points;
  };
  // Rotation-invariant bounds for stations that slowly turn.
  const ringPoints = (center, radius, y0, y1) => {
    const points = [];
    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2;
      [y0, y1].forEach((y) => {
        points.push(new THREE.Vector3(center.x + Math.cos(angle) * radius, center.y + y, center.z + Math.sin(angle) * radius));
      });
    }
    return points;
  };
  const markerPoints = (fromIndex) => {
    const points = [];
    MARKERS_Z.slice(fromIndex).forEach((z) => {
      points.push(
        ...boxPoints(stations.experience.group, new THREE.Vector3(-0.6, -0.1, z - 0.5), new THREE.Vector3(0.6, 2.8, z + 0.5))
      );
    });
    return points;
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const BOUNDS = {
    lab: boxPoints(stations.lab.group, V(-3.2, -1.1, -1.8), V(3.2, 2.4, 1.8)),
  };
  Object.entries(stations).forEach(([name, station]) => {
    if (station.bounds) {
      BOUNDS[name] = boxPoints(station.group, V(...station.bounds[0]), V(...station.bounds[1]));
    } else if (station.ring) {
      const { radius, y0, y1 } = station.ring;
      BOUNDS[name] = ringPoints(station.group.position, radius * station.group.scale.x, y0, y1);
    }
  });
  BOUNDS.contact = [...Object.values(BOUNDS).flat(), ...markerPoints(0)];

  const fitCamera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 4000);
  const probe = new THREE.Vector3();
  const axisRight = new THREE.Vector3();
  const axisUp = new THREE.Vector3();
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  // Moves the look target (and camera with it) so the projected bounds are centred in
  // `free` (NDC box), then sets the distance so they fill `fill` of it. With fill = 1
  // the camera only pulls back (never closer than the base distance).
  const fitTo = (points, baseTarget, direction, baseDistance, free, aspect, fill = 1) => {
    const target = baseTarget.clone();
    const position = new THREE.Vector3();
    let distance = baseDistance;
    fitCamera.aspect = aspect;
    fitCamera.updateProjectionMatrix();
    for (let iteration = 0; iteration < 14; iteration += 1) {
      position.copy(target).addScaledVector(direction, distance);
      fitCamera.position.copy(position);
      fitCamera.lookAt(target);
      fitCamera.updateMatrixWorld(true);
      axisRight.setFromMatrixColumn(fitCamera.matrixWorld, 0);
      axisUp.setFromMatrixColumn(fitCamera.matrixWorld, 1);

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      points.forEach((point) => {
        probe.copy(point).applyMatrix4(fitCamera.matrixWorldInverse);
        if (probe.z > -0.5) {
          return; // behind or at the camera
        }
        probe.applyMatrix4(fitCamera.projectionMatrix);
        minX = Math.min(minX, probe.x);
        maxX = Math.max(maxX, probe.x);
        minY = Math.min(minY, probe.y);
        maxY = Math.max(maxY, probe.y);
      });
      if (minX === Infinity) {
        break;
      }

      const halfW = distance * tanHalf * aspect;
      const halfH = distance * tanHalf;
      target.addScaledVector(axisRight, ((minX + maxX) / 2 - free.cx) * halfW * 0.9);
      target.addScaledVector(axisUp, ((minY + maxY) / 2 - free.cy) * halfH * 0.9);
      const overflow = Math.max((maxX - minX) / 2 / free.hw, (maxY - minY) / 2 / free.hh) / fill;
      if (fill < 1 || overflow > 1) {
        distance *= Math.min(Math.max(overflow, 0.6), 1.5);
      }
    }
    position.copy(target).addScaledVector(direction, distance);
    return { position, target };
  };

  // Camera poses for one station: experience gets two on desktop (first → last marker).
  const posesFor = (name, free, aspect, fill, mult, single) => {
    const out = [];
    const fitView = (points, anchor, view) => {
      const direction = new THREE.Vector3(0, view.h, view.d).normalize();
      const baseTarget = anchor.clone();
      baseTarget.y += view.lookY;
      out.push(fitTo(points, baseTarget, direction, Math.hypot(view.h, view.d) * mult, free, aspect, fill));
    };
    if (name === "contact") {
      // Overview from above and to the side, so the whole path reads as a line of stations.
      const direction = new THREE.Vector3(0.3, 0.58, 0.76).normalize();
      out.push(fitTo(BOUNDS.contact, new THREE.Vector3(0, -2, -226), direction, 400, free, aspect, Math.min(fill, 0.96)));
    } else if (name === "experience" && single) {
      // One stage view: the whole rail from above and to the side, markers in a receding row.
      const direction = new THREE.Vector3(0.62, 0.52, 0.58).normalize();
      const anchor = P.experience.clone().add(new THREE.Vector3(0, 0.8, (MARKERS_Z[0] + MARKERS_Z[MARKERS_Z.length - 1]) / 2));
      out.push(fitTo(markerPoints(0), anchor, direction, 24, free, aspect, fill));
    } else if (name === "experience") {
      [0, MARKERS_Z.length - 1].forEach((index) => {
        const anchor = P.experience.clone();
        anchor.z += MARKERS_Z[index] - 5;
        fitView(markerPoints(index), anchor, VIEWS.experience);
      });
    } else if (name === "lab" && !single) {
      // The Lab has a dedicated left-side stage on desktop. A generic free-box fit
      // shifts its target past the cube grid because the wide panel occupies the
      // other side of the viewport, so use a stable composition for the cubes.
      const view = VIEWS.lab;
      const direction = new THREE.Vector3(0, view.h, view.d).normalize();
      const target = P.lab.clone().add(new THREE.Vector3(5.2, -2.2, 0));
      const position = target.clone().addScaledVector(direction, 20);
      out.push({ position, target });
    } else if (VIEWS[name] && BOUNDS[name]) {
      fitView(BOUNDS[name], P[name], VIEWS[name]);
    }
    return out;
  };

  const rebuild = () => {
    // Match the drawable CSS viewport. innerWidth includes the scrollbar on
    // desktop, which otherwise scales the canvas slightly and softens details.
    const w = document.documentElement.clientWidth || window.innerWidth;
    const h = window.innerHeight;
    viewport = {
      w,
      h,
      aspect: w / h,
      // Below 1024px panels run full width; each station gets its own stage above its panel.
      mobile: w < 1024,
      mult: Math.min(2.4, Math.max(1, 1.2 / (w / h))),
      stages: false,
    };
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const margin = Math.max(24, w * 0.025);
    const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0;
    const scrollY = window.scrollY;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - h);
    const stageRectOf = (el) => {
      const stage = el.querySelector("[data-stage]");
      if (!stage || !stage.getClientRects().length) {
        return null;
      }
      const rect = stage.getBoundingClientRect();
      return rect.width > 40 && rect.height > 40 ? rect : null;
    };

    layout.length = 0;
    stageViews.length = 0;

    if (viewport.mobile) {
      // Small screens: one camera per 3D stage, rendered into that stage's rectangle.
      hosts.forEach((el) => {
        const rect = stageRectOf(el);
        if (!rect) {
          return;
        }
        const aspect = rect.width / rect.height;
        const free = { cx: 0, cy: 0, hw: 1, hh: 1 };
        const [pose] = posesFor(el.dataset.station, free, aspect, STAGE_FILL, 1, true);
        if (pose) {
          stageViews.push({
            name: el.dataset.station,
            top: rect.top + scrollY,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            aspect,
            position: pose.position,
            target: pose.target,
          });
        }
      });
      viewport.stages = viewport.mobile && stageViews.length > 0;
      if (viewport.stages) {
        return;
      }
    }

    // Free horizontal band for the object: between the panel edge and the rail.
    let railLeft = w;
    if (railEl && getComputedStyle(railEl).display !== "none") {
      railLeft = railEl.getBoundingClientRect().left;
      // Below 1280px the active label pops out to the left of the rail's numbers.
      if (w < 1280) {
        railLeft -= 150;
      }
    }
    const freeBox = (x0, x1, y0, y1) => {
      const left = Math.min(x0, x1 - 80);
      return {
        cx: ((left + x1) / 2 / w) * 2 - 1,
        hw: Math.max(0.08, (x1 - left) / w),
        cy: 1 - ((y0 + y1) / 2 / h) * 2,
        hh: Math.max(0.1, (y1 - y0) / h),
      };
    };

    const cams = [];
    const targets = [];

    hosts.forEach((el) => {
      const name = el.dataset.station;
      const rect = el.getBoundingClientRect();
      const top = rect.top + scrollY;
      const height = rect.height;
      const span = Math.min(height, h);
      let a = top + span / 2 - h / 2;
      let b = top + height - span / 2 - h / 2;
      a = Math.min(Math.max(a, 0), maxScroll);
      b = Math.min(Math.max(b, a), maxScroll);
      const side = el.classList.contains("side-right") ? -1 : 1;
      const start = cams.length;

      const content = el.querySelector(".panel, .hero");
      const contentRect = content ? content.getBoundingClientRect() : null;
      const stageRect = stageRectOf(el);
      const y0 = headerBottom + margin;
      const y1 = h - margin;
      let free;
      let fill = 1;
      if (stageRect) {
        // Hero plinth: frame the sculpture inside its own box (as laid out at hold scroll `a`).
        const stageTop = stageRect.top + scrollY - a;
        free = freeBox(stageRect.left, stageRect.right, stageTop, stageTop + stageRect.height);
        fill = 0.92;
      } else if (!contentRect) {
        free = freeBox(margin, w - margin, y0, y1);
      } else if (side === 1) {
        free = freeBox(contentRect.right + margin, railLeft - margin, y0, y1);
      } else {
        free = freeBox(margin, contentRect.left - margin, y0, y1);
      }

      const poses = posesFor(name, free, w / h, fill, stageRect ? 1 : viewport.mult, false);
      if (!poses.length) {
        return;
      }
      poses.forEach(({ position, target }) => {
        cams.push(position);
        targets.push(target);
      });
      layout.push({ name, start, end: cams.length - 1, a, b });
    });

    // Keep hold ranges ordered even if sections overlap.
    for (let i = 1; i < layout.length; i += 1) {
      layout[i].a = Math.max(layout[i].a, layout[i - 1].b);
      layout[i].b = Math.max(layout[i].b, layout[i].a);
    }

    controlCount = cams.length;
    if (!controlCount) {
      cams.push(new THREE.Vector3(0, 3, 14));
      targets.push(new THREE.Vector3());
      controlCount = 1;
    }
    if (controlCount < 2) {
      cams.push(cams[0].clone().add(new THREE.Vector3(0, 0, -1)));
      targets.push(targets[0].clone());
      controlCount = 2;
    }
    positionCurve = new THREE.CatmullRomCurve3(cams, false, "centripetal");
    targetCurve = new THREE.CatmullRomCurve3(targets, false, "centripetal");
  };

  const scrollToParam = (scrollY) => {
    if (!layout.length) {
      return 0;
    }
    if (scrollY <= layout[0].a) {
      return layout[0].start;
    }
    for (let i = 0; i < layout.length; i += 1) {
      const s = layout[i];
      if (scrollY <= s.b) {
        const f = s.b > s.a ? (scrollY - s.a) / (s.b - s.a) : 1;
        return s.start + (s.end - s.start) * Math.min(Math.max(f, 0), 1);
      }
      const next = layout[i + 1];
      if (!next) {
        return s.end;
      }
      if (scrollY < next.a) {
        const f = (scrollY - s.b) / Math.max(1, next.a - s.b);
        return s.end + (next.start - s.end) * easeInOut(f);
      }
    }
    return layout[layout.length - 1].end;
  };

  /* ---------------------------------------------------------------- */
  /* Loop                                                              */
  /* ---------------------------------------------------------------- */

  const pointerTarget = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const ctx = { pointer, pointerMagnitude: 0, ambient: true, near: 99, overview: 0, now: 0, cameraPos: new THREE.Vector3() };
  const focusPoint = new THREE.Vector3();
  // Last camera used to draw the lab (full screen or its stage), for projecting cubes to the page.
  const labProjection = { valid: false, proj: new THREE.Matrix4(), inv: new THREE.Matrix4(), left: 0, top: 0, width: 1, height: 1, view: null };
  const captureLabProjection = (left, top, width, height, view = null) => {
    camera.updateMatrixWorld();
    labProjection.proj.copy(camera.projectionMatrix);
    labProjection.inv.copy(camera.matrixWorldInverse);
    Object.assign(labProjection, { valid: true, left, top, width, height, view });
  };
  // Lab launch: ease the camera ≤10% toward the rising cube.
  const applyLabFocus = (look) => {
    const amount = stations.lab.focus(focusPoint);
    if (amount > 0) {
      camera.position.lerp(focusPoint, 0.09 * amount);
      look.lerp(focusPoint, 0.2 * amount);
    }
    return amount;
  };
  const stationNames = Object.keys(stations);

  let param = 0;
  let paramTarget = 0;
  let running = false;
  let rafId = 0;
  let lastFrame = 0;
  let lastInteraction = performance.now();
  let lastChange = performance.now();
  let disposed = false;

  const stationIndex = (name) => layout.find((s) => s.name === name);

  const setFog = (viewDistance, overview) => {
    // The current station stays crisp and the next one is hidden; the overview opens up.
    scene.fog.near = THREE.MathUtils.lerp(viewDistance + 2, viewDistance * 0.55, overview);
    scene.fog.far = THREE.MathUtils.lerp(viewDistance + 24, viewDistance * 1.9 + 60, overview);
  };

  // Small screens: draw each visible stage with its own camera, clipped to its rectangle.
  const renderStages = (dt) => {
    const { w, h } = viewport;
    const scrollY = window.scrollY;
    const visibleViews = [];
    const nearness = {};
    stageViews.forEach((view) => {
      const top = view.top - scrollY;
      if (top < h && top + view.height > 0) {
        visibleViews.push({ view, top });
        const shown = (Math.min(h, top + view.height) - Math.max(0, top)) / view.height;
        nearness[view.name] = shown > 0.4 ? 0 : 1.5;
      }
    });

    let changing = false;
    const labView = stageViews.find((view) => view.name === "lab");
    ctx.cameraPos.copy(labView ? labView.position : camera.position);
    stationNames.forEach((name) => {
      ctx.near = name in nearness ? nearness[name] : 99;
      ctx.overview = 0;
      if (stations[name].update(dt, ctx)) {
        changing = true;
      }
    });

    stations.path.group.visible = true;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
    renderer.clear();
    renderer.setScissorTest(true);

    visibleViews.forEach(({ view, top }) => {
      const overview = view.name === "contact" ? 1 : 0;
      stationNames.forEach((name) => {
        const station = stations[name];
        if (!station.alwaysUpdate) {
          station.group.visible = overview === 1 || name === view.name;
        }
      });
      // A gentle orbit as the stage crosses the screen keeps the object reading as 3D.
      const drift = THREE.MathUtils.clamp((top + view.height / 2 - h / 2) / h, -1, 1);
      tmp.copy(view.position).sub(view.target);
      tmp.applyAxisAngle(THREE.Object3D.DEFAULT_UP, drift * 0.2);
      camera.position.copy(view.target).add(tmp);
      camera.position.y += drift * tmp.length() * 0.04;
      camera.aspect = view.aspect;
      camera.updateProjectionMatrix();
      tmp.copy(view.target);
      if (view.name === "lab") {
        applyLabFocus(tmp);
      }
      camera.lookAt(tmp);
      setFog(camera.position.distanceTo(view.target), overview);

      const y = h - (top + view.height);
      renderer.setViewport(view.left, y, view.width, view.height);
      renderer.setScissor(view.left, y, view.width, view.height);
      renderer.render(scene, camera);
      if (view.name === "lab") {
        captureLabProjection(view.left, top, view.width, view.height, view);
      }
    });
    renderer.setScissorTest(false);
    return changing;
  };

  const renderJourney = (dt) => {
    const u = controlCount > 1 ? param / (controlCount - 1) : 0;
    positionCurve.getPoint(Math.min(Math.max(u, 0), 1), camPos);
    targetCurve.getPoint(Math.min(Math.max(u, 0), 1), camLook);

    const sway = 0.35 * viewport.mult;
    camera.aspect = viewport.aspect;
    camera.updateProjectionMatrix();
    camera.position.set(camPos.x + pointer.x * sway, camPos.y - pointer.y * sway * 0.6, camPos.z);
    applyLabFocus(camLook);
    camera.lookAt(camLook);
    ctx.cameraPos.copy(camera.position);

    // Fog opens up as the camera pulls back for the final overview.
    const last = layout[layout.length - 1];
    const overview = last && last.name === "contact" ? Math.min(Math.max(param - (last.start - 1), 0), 1) : 0;
    const viewDistance = camPos.distanceTo(camLook);
    setFog(viewDistance, overview);
    ctx.overview = overview;

    // The road starts once the camera leaves the hero, so it never crosses the photos.
    stations.path.group.visible = param > 0.45;

    let changing = false;
    stationNames.forEach((name) => {
      const station = stations[name];
      const info = stationIndex(name);
      ctx.near = info ? Math.min(Math.abs(param - info.start), Math.abs(param - info.end)) : 99;
      if (info && param > info.start && param < info.end) {
        ctx.near = 0;
      }
      tmp.copy(station.group.position);
      if (!station.alwaysUpdate) {
        station.group.visible = overview > 0.2 || tmp.distanceTo(camera.position) < viewDistance + 26;
      }
      if (station.update(dt, ctx)) {
        changing = true;
      }
    });

    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, viewport.w, viewport.h);
    renderer.render(scene, camera);
    if (stations.lab.group.visible) {
      captureLabProjection(0, 0, viewport.w, viewport.h);
    } else {
      labProjection.valid = false;
    }
    return changing;
  };

  const render = (now) => {
    if (disposed) {
      return;
    }
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;
    ctx.now = now;

    const ease = 1 - Math.exp(-dt * DAMPING);
    param += (paramTarget - param) * ease;
    if (Math.abs(paramTarget - param) < 0.0004) {
      param = paramTarget;
    }
    pointer.x += (pointerTarget.x - pointer.x) * (1 - Math.exp(-dt * 4));
    pointer.y += (pointerTarget.y - pointer.y) * (1 - Math.exp(-dt * 4));
    ctx.pointerMagnitude = Math.min(1, pointer.length());
    ctx.ambient = now - lastInteraction < AMBIENT_WINDOW;

    let changing = Math.abs(paramTarget - param) > 0 || pointer.distanceTo(pointerTarget) > 0.002;
    if (viewport.stages ? renderStages(dt) : renderJourney(dt)) {
      changing = true;
    }

    if (changing) {
      lastChange = now;
    }
    // While a game modal is open the scene idles, except during the cube launch/close animation.
    const hidden = document.hidden || (document.body.classList.contains("modal-open") && !stations.lab.busy(now));
    if (hidden || now - lastChange > IDLE_STOP) {
      running = false;
      rafId = 0;
      return;
    }
    rafId = window.requestAnimationFrame(render);
  };

  const renderNow = () => {
    if (disposed || document.hidden) {
      return;
    }
    const now = performance.now();
    lastFrame = now - 16;
    lastChange = now;
    const wasRunning = running;
    running = true;
    const pending = rafId;
    render(now);
    // render() may have scheduled or cancelled the loop; restore the previous loop state.
    if (wasRunning && pending && rafId !== pending) {
      window.cancelAnimationFrame(rafId);
      rafId = pending;
    } else if (!wasRunning) {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = 0;
      running = false;
    }
  };

  const wake = () => {
    lastInteraction = performance.now();
    lastChange = lastInteraction;
    const blocked = document.body.classList.contains("modal-open") && !stations.lab.busy(performance.now());
    if (!running && !disposed && !document.hidden && !blocked) {
      running = true;
      lastFrame = performance.now();
      rafId = window.requestAnimationFrame(render);
    }
  };

  const onScroll = () => {
    paramTarget = scrollToParam(window.scrollY);
    // Anchor jumps (Back to top, rail links) skip the fly-through of every station in between.
    if (Math.abs(paramTarget - param) > 1.5) {
      param = paramTarget - Math.sign(paramTarget - param) * 0.3;
    }
    wake();
  };

  let resizeQueued = false;
  const onResize = () => {
    if (resizeQueued) {
      return;
    }
    resizeQueued = true;
    window.requestAnimationFrame(() => {
      resizeQueued = false;
      rebuild();
      paramTarget = scrollToParam(window.scrollY);
      wake();
    });
  };

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const onPointerMove = (event) => {
    if (!finePointer.matches) {
      return;
    }
    pointerTarget.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
    wake();
  };

  const onMarker = (event) => {
    stations.experience.setActive(typeof event.detail === "number" ? event.detail : -1);
    wake();
  };

  const gameCards = Array.from(document.querySelectorAll("[data-game-card]"));
  const hoverHandlers = gameCards.map((card) => {
    const index = Number(card.dataset.gameCard);
    const enter = () => {
      stations.lab.hovered = index;
      wake();
    };
    const leave = () => {
      if (stations.lab.hovered === index) {
        stations.lab.hovered = -1;
        wake();
      }
    };
    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointerleave", leave);
    card.addEventListener("focusin", enter);
    card.addEventListener("focusout", leave);
    return { card, enter, leave };
  });

  const bodyObserver = new MutationObserver(() => {
    if (!document.body.classList.contains("modal-open") && !disposed) {
      // Re-measure (the scrollbar comes back) and draw a fresh frame immediately.
      rebuild();
      paramTarget = scrollToParam(window.scrollY);
      param = paramTarget;
      renderNow();
      wake();
    }
  });
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // Live theme switch: recolour materials and draw a fresh frame straight away.
  const themeObserver = new MutationObserver(() => {
    if (!disposed) {
      applyTheme();
      renderNow();
      wake();
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const layoutObserver = "ResizeObserver" in window ? new ResizeObserver(onResize) : null;
  layoutObserver?.observe(document.querySelector("main") || document.body);

  const onVisibility = () => {
    if (!document.hidden) {
      wake();
    }
  };

  const onContextLost = (event) => {
    event.preventDefault();
    dispose();
  };

  /* ---------------------------------------------------------------- */
  /* Game launch API (used by main.js's game modal)                    */
  /* ---------------------------------------------------------------- */

  const corner = new THREE.Vector3();
  const cubeCenter = new THREE.Vector3();
  // Screen rectangle of a lab cube as last drawn, or null if it isn't clearly on screen.
  const cubeRect = (index) => {
    if (disposed || !labProjection.valid || !stations.lab.group.visible) {
      return null;
    }
    const half = stations.lab.cubeBox(index, cubeCenter);
    if (!half) {
      return null;
    }
    let top = labProjection.top;
    if (labProjection.view) {
      top = labProjection.view.top - window.scrollY;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < 8; i += 1) {
      corner.set(i & 1 ? half : -half, i & 2 ? half : -half, i & 4 ? half : -half).add(cubeCenter);
      corner.applyMatrix4(labProjection.inv);
      if (corner.z > -0.1) {
        return null;
      }
      corner.applyMatrix4(labProjection.proj);
      const x = labProjection.left + ((corner.x + 1) / 2) * labProjection.width;
      const y = top + ((1 - corner.y) / 2) * labProjection.height;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const width = maxX - minX;
    const height = maxY - minY;
    const clipTop = labProjection.view ? Math.max(0, top) : 0;
    const clipBottom = labProjection.view ? Math.min(viewport.h, top + labProjection.height) : viewport.h;
    const inside = minX >= -4 && maxX <= viewport.w + 4 && minY >= clipTop - 4 && maxY <= clipBottom + 4;
    if (!inside || width < 16 || height < 16 || width > viewport.w * 0.6) {
      return null;
    }
    return new DOMRect(minX, minY, width, height);
  };

  const labIsFramed = () => {
    if (viewport.stages) {
      const view = stageViews.find((item) => item.name === "lab");
      if (!view) {
        return false;
      }
      const top = view.top - window.scrollY;
      return top >= -2 && top + view.height <= viewport.h + 2;
    }
    const info = stationIndex("lab");
    if (!info) {
      return false;
    }
    return param >= info.start - 0.25 && param <= info.end + 0.25 && Math.abs(paramTarget - param) < 0.05;
  };

  const scrollStageIntoView = () =>
    new Promise((resolve) => {
      const view = stageViews.find((item) => item.name === "lab");
      if (!view) {
        resolve(false);
        return;
      }
      const top = view.top - window.scrollY;
      const bottom = top + view.height;
      if (top >= viewport.h || bottom <= 0) {
        resolve(false); // not visible at all: the modal grows from the card instead
        return;
      }
      const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0;
      let delta = 0;
      if (top < headerBottom + 8) {
        delta = top - headerBottom - 8;
      } else if (bottom > viewport.h - 8) {
        delta = bottom - viewport.h + 8;
      }
      if (Math.abs(delta) < 2) {
        resolve(true);
        return;
      }
      const from = window.scrollY;
      const started = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - started) / 220);
        const eased = 1 - Math.pow(1 - k, 3);
        window.scrollTo({ top: from + delta * eased, behavior: "instant" });
        if (k < 1) {
          window.requestAnimationFrame(step);
        } else {
          resolve(true);
        }
      };
      window.requestAnimationFrame(step);
    });

  const LAUNCH_HANDOFF = 500; // ms: cube risen and burst open; the modal starts growing here

  const api = {
    launchGame(index) {
      return new Promise((resolve) => {
        if (disposed || document.hidden) {
          resolve(null);
          return;
        }
        const go = () => {
          stations.lab.reset();
          renderNow();
          if (!labIsFramed() || !cubeRect(index)) {
            resolve(null);
            return;
          }
          stations.lab.launch(index, performance.now());
          wake();
          window.setTimeout(() => {
            resolve(disposed ? null : cubeRect(index));
          }, LAUNCH_HANDOFF);
        };
        if (viewport.stages) {
          scrollStageIntoView().then((ok) => {
            if (!ok) {
              resolve(null);
              return;
            }
            window.requestAnimationFrame(go);
          });
        } else {
          go();
        }
      });
    },
    closeGame(index) {
      if (disposed || !stations.lab.close(index, performance.now())) {
        stations.lab.reset();
        return Promise.resolve();
      }
      wake();
      return new Promise((resolve) => window.setTimeout(resolve, 430));
    },
    cubeRect,
    stats: () => ({
      ...renderer.info.render,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      programs: renderer.info.programs?.length,
      buildMs,
    }),
  };
  window.portfolioScene = api;

  function dispose() {
    if (disposed) {
      return;
    }
    disposed = true;
    if (window.portfolioScene === api) {
      delete window.portfolioScene;
    }
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("journey:marker", onMarker);
    document.removeEventListener("visibilitychange", onVisibility);
    renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    hoverHandlers.forEach(({ card, enter, leave }) => {
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
      card.removeEventListener("focusin", enter);
      card.removeEventListener("focusout", leave);
    });
    bodyObserver.disconnect();
    themeObserver.disconnect();
    layoutObserver?.disconnect();
    kit.dispose();
    renderer.dispose();
    host.classList.remove("is-live");
    document.documentElement.classList.remove("has-3d");
    renderer.domElement.remove();
  }

  applyTheme();
  rebuild();
  param = paramTarget = scrollToParam(window.scrollY);
  const buildMs = Math.round(performance.now() - buildStart);
  // Canvas labels use the page fonts; redraw once they are ready.
  document.fonts?.ready.then(() => {
    if (!disposed) {
      kit.redrawScreens();
      renderNow();
    }
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("journey:marker", onMarker);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) {
      dispose();
    }
  });
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);

  host.classList.add("is-live");
  wake();
  // Warm up every station's shaders in the background so the first visit doesn't hitch
  // (only where the GPU compiles in parallel; elsewhere three.js would warn and block).
  if (renderer.extensions.has("KHR_parallel_shader_compile")) {
    renderer.compileAsync?.(scene, camera).catch(() => {});
  }

  return { dispose };
}
