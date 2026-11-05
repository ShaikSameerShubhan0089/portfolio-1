// Canvas palette, read from the active theme's CSS tokens (style.css) and refreshed
// whenever the theme changes. `accent` is the player/ball/food colour (--primary);
// `highlight` is the cyan-blue --accent.
const COLORS = {};
const BOARD = ["", ""];
let redrawGame = null;

function readThemeColors() {
  const css = window.getComputedStyle(document.documentElement);
  const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  const dark = document.documentElement.dataset.theme === "dark";
  Object.assign(COLORS, {
    bg: token("--bg", "#F6F9FF"),
    panel: token("--surface", "#FFFFFF"),
    panel2: token("--surface-2", "#EFF5FF"),
    text: token("--text", "#0F172A"),
    textSoft: dark ? "rgba(248, 250, 252, 0.5)" : "rgba(15, 23, 42, 0.42)",
    muted: token("--muted", "#64748B"),
    lineStrong: token("--line-strong", "#C4D4EB"),
    line: token("--line", "#DCE6F5"),
    accent: token("--primary", "#2563EB"),
    highlight: token("--accent", "#06B6D4"),
    overlay: dark ? "rgba(7, 20, 38, 0.84)" : "rgba(246, 249, 255, 0.88)",
    carWindow: dark ? "rgba(7, 20, 38, 0.55)" : "rgba(255, 255, 255, 0.65)",
  });
  BOARD[0] = token("--surface-2", "#EFF5FF");
  BOARD[1] = token("--surface", "#FFFFFF");
}

readThemeColors();
document.addEventListener("themechange", () => {
  readThemeColors();
  try {
    redrawGame?.();
  } catch {
    // The game may not have drawn its first frame yet; its loop will pick the colours up.
  }
});

const FONTS = {
  display: '"Geist", system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, Consolas, monospace',
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.addEventListener("DOMContentLoaded", () => {
  const modals = createModalController();

  setupNavigation();
  setupJourneyChrome();
  setupHeroPhotos();
  setupReveal();
  setupFooterYear();
  setupGames(modals);
  setupProjectShowcases(modals);
  setupScene();
});

/* ------------------------------------------------------------------ */
/* Page chrome                                                         */
/* ------------------------------------------------------------------ */

function setupNavigation() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (!toggle || !nav) {
    return;
  }

  const isOpen = () => nav.classList.contains("is-open");
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    header?.classList.toggle("is-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!isOpen());
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));

  document.addEventListener("click", (event) => {
    if (isOpen() && !nav.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia("(min-width: 768px)").addEventListener?.("change", (event) => {
    if (event.matches) {
      setOpen(false);
    }
  });
}

// Keeps the reader oriented: chapter rail, mobile progress bar + chapter
// name, active nav link, scroll cue, and the "current" experience row.
function setupJourneyChrome() {
  const header = document.querySelector(".site-header");
  const chapters = Array.from(document.querySelectorAll(".chapter[data-chapter]"));
  const railLinks = Array.from(document.querySelectorAll(".chapter-rail a[data-chapter]"));
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const railFill = document.querySelector(".rail-fill");
  const barFill = document.querySelector(".progress-bar-fill");
  const chapterIndex = document.querySelector(".header-chapter-index");
  const chapterName = document.querySelector(".header-chapter-name");
  const scrollCue = document.querySelector(".scroll-cue");
  const timelineRows = Array.from(document.querySelectorAll(".timeline-row[data-marker]"));
  const experience = document.getElementById("experience");
  const cases = Array.from(document.querySelectorAll("#work [data-case]"));
  const railCount = document.querySelector(".chapter-rail .rail-count");
  const caseTotal = String(cases.length).padStart(2, "0");

  let activeChapter = null;
  let activeLabel = "";
  let activeMarker = -2;
  let scheduled = false;

  const update = () => {
    scheduled = false;
    const scrollY = window.scrollY;
    const viewport = window.innerHeight;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewport);
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll));

    header?.classList.toggle("is-scrolled", scrollY > 8);
    if (railFill) {
      railFill.style.transform = `scaleY(${progress})`;
    }
    if (barFill) {
      barFill.style.transform = `scaleX(${progress})`;
    }
    if (scrollCue && scrollY > 40) {
      scrollCue.classList.add("is-hidden");
    }

    const probe = scrollY + viewport * 0.4;
    let current = chapters[0];
    chapters.forEach((chapter) => {
      if (chapter.offsetTop <= probe) {
        current = chapter;
      }
    });
    if (scrollY >= maxScroll - 2) {
      current = chapters[chapters.length - 1];
    }

    // Position within Work ("03/10") so ten case studies never feel endless.
    let caseLabel = "";
    if (current?.dataset.chapter === "work" && cases.length) {
      let index = 0;
      const caseProbe = viewport * 0.5;
      cases.forEach((item, i) => {
        if (item.getBoundingClientRect().top <= caseProbe) {
          index = i;
        }
      });
      caseLabel = `${String(index + 1).padStart(2, "0")}/${caseTotal}`;
    }
    if (caseLabel !== activeLabel) {
      activeLabel = caseLabel;
      if (railCount) {
        railCount.textContent = caseLabel ? ` · ${caseLabel}` : "";
        railCount.hidden = !caseLabel;
      }
      if (chapterName && current) {
        chapterName.textContent = `${current.dataset.chapterName || ""}${caseLabel ? ` ${caseLabel}` : ""}`;
      }
    }

    if (current && current !== activeChapter) {
      activeChapter = current;
      const id = current.dataset.chapter;
      railLinks.forEach((link) => {
        const isActive = link.dataset.chapter === id;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
      navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`));
      if (chapterIndex && chapterName) {
        chapterIndex.textContent = current.dataset.chapterIndex || "";
        chapterName.textContent = `${current.dataset.chapterName || ""}${caseLabel ? ` ${caseLabel}` : ""}`;
      }
    }

    // Experience row nearest the middle of the screen.
    let marker = -1;
    if (experience && timelineRows.length) {
      const rect = experience.getBoundingClientRect();
      if (rect.top < viewport * 0.6 && rect.bottom > viewport * 0.4) {
        let best = Infinity;
        timelineRows.forEach((row, index) => {
          const box = row.getBoundingClientRect();
          const distance = Math.abs(box.top + box.height / 2 - viewport * 0.5);
          if (distance < best) {
            best = distance;
            marker = index;
          }
        });
      }
    }
    if (marker !== activeMarker) {
      activeMarker = marker;
      timelineRows.forEach((row, index) => row.classList.toggle("is-current", index === marker));
      document.dispatchEvent(new CustomEvent("journey:marker", { detail: marker }));
    }
  };

  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
}

// Hero photo stack: click/tap (or the Next button) cycles the front photo, a fine
// pointer tilts the stack a few degrees, and the cards separate as the intro scrolls away.
function setupHeroPhotos() {
  const stack = document.querySelector("[data-photo-stack]");
  if (!stack) {
    return;
  }
  const cards = Array.from(stack.querySelectorAll(".photo-card"));
  const next = document.querySelector(".photo-next");
  const count = document.querySelector(".photo-count");
  const caption = document.querySelector(".photo-caption-text");
  const intro = document.getElementById("intro");
  const total = String(cards.length).padStart(2, "0");

  const cycle = () => {
    cards.forEach((card) => {
      const pos = (Number(card.dataset.pos) + cards.length - 1) % cards.length;
      card.dataset.pos = String(pos);
      if (pos === 0) {
        const index = cards.indexOf(card);
        if (count) {
          count.textContent = `${String(index + 1).padStart(2, "0")} / ${total}`;
        }
        if (caption) {
          caption.textContent = card.dataset.caption || "";
        }
      }
    });
  };

  stack.addEventListener("click", cycle);
  if (next) {
    next.hidden = false;
    next.addEventListener("click", cycle);
  }

  if (prefersReducedMotion.matches) {
    return;
  }

  const target = { x: 0, y: 0, spread: 0 };
  const current = { x: 0, y: 0, spread: 0 };
  let frame = 0;
  let last = 0;

  const tick = (now) => {
    const dt = Math.min(0.05, (now - (last || now - 16)) / 1000);
    last = now;
    const k = 1 - Math.exp(-dt * 8);
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;
    current.spread += (target.spread - current.spread) * k;
    stack.style.setProperty("--tilt-x", `${current.y.toFixed(3)}deg`);
    stack.style.setProperty("--tilt-y", `${current.x.toFixed(3)}deg`);
    stack.style.setProperty("--spread", current.spread.toFixed(3));
    const settled =
      Math.abs(target.x - current.x) < 0.01 && Math.abs(target.y - current.y) < 0.01 && Math.abs(target.spread - current.spread) < 0.002;
    frame = settled ? 0 : window.requestAnimationFrame(tick);
    if (settled) {
      last = 0;
    }
  };
  const kick = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(tick);
    }
  };

  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const hero = stack.closest(".hero") || stack;
  hero.addEventListener("pointermove", (event) => {
    if (!fine.matches) {
      return;
    }
    const rect = stack.getBoundingClientRect();
    const px = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / (rect.width * 1.2)));
    const py = Math.max(-1, Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / (rect.height * 1.2)));
    target.x = px * 8;
    target.y = -py * 6;
    kick();
  });
  hero.addEventListener("pointerleave", () => {
    target.x = 0;
    target.y = 0;
    kick();
  });

  const onScroll = () => {
    const height = intro ? intro.offsetHeight : window.innerHeight;
    const spread = Math.min(1, Math.max(0, window.scrollY / (height * 0.6)));
    if (Math.abs(spread - target.spread) > 0.001) {
      target.spread = spread;
      kick();
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupReveal() {
  const revealNodes = document.querySelectorAll(".reveal");
  const showAll = () => revealNodes.forEach((node) => node.classList.add("is-visible"));

  if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );

  revealNodes.forEach((node) => observer.observe(node));
  window.addEventListener("beforeprint", showAll);
}

function setupFooterYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = year;
  });
}

// The 3D journey is decorative and optional: it loads after first paint and
// only when WebGL works and the visitor hasn't asked for reduced motion.
function setupScene() {
  const host = document.getElementById("scene");
  const root = document.documentElement;
  // The 3D stages (spacers above each panel on small screens) only exist while the scene can run.
  const fallBack = () => {
    root.classList.remove("has-3d");
    host?.classList.remove("is-live");
    host?.querySelector("canvas")?.remove();
  };
  if (!host?.dataset.module || prefersReducedMotion.matches || !supportsWebGL()) {
    fallBack();
    return;
  }

  const start = () => {
    import(host.dataset.module)
      .then((module) => {
        if (!module.startJourney(host)) {
          fallBack();
        }
      })
      .catch(fallBack);
  };

  const whenIdle = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(start, { timeout: 1200 });
    } else {
      window.setTimeout(start, 120);
    }
  };

  if (document.readyState === "complete") {
    whenIdle();
  } else {
    window.addEventListener("load", whenIdle, { once: true });
  }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!context) {
      return false;
    }
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */

function createModalController() {
  const stack = [];
  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  const finishClose = (entry) => {
    const index = stack.indexOf(entry);
    if (index === -1) {
      return;
    }
    stack.splice(index, 1);
    const { modal } = entry;
    modal.classList.remove("is-open");
    modal.hidden = true;
    if (!stack.length) {
      document.body.classList.remove("modal-open");
    }
    entry.onClose?.();
    entry.returnFocus?.focus?.({ preventScroll: true });
  };

  // `beforeClose` may return a promise (e.g. an exit animation); Escape, the close
  // button and the backdrop all wait for it, and repeated requests are ignored.
  const close = (modal) => {
    const entry = stack.find((item) => item.modal === modal);
    if (!entry || entry.closing) {
      return;
    }
    if (!entry.beforeClose) {
      finishClose(entry);
      return;
    }
    entry.closing = true;
    Promise.resolve()
      .then(() => entry.beforeClose())
      .catch(() => {})
      .then(() => finishClose(entry));
  };

  const open = (modal, { onClose, initialFocus, beforeClose, returnFocus } = {}) => {
    if (stack.some((entry) => entry.modal === modal)) {
      return;
    }

    stack.push({ modal, onClose, beforeClose, returnFocus: returnFocus || document.activeElement });
    modal.hidden = false;
    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
    (initialFocus || modal.querySelector(focusableSelector))?.focus({ preventScroll: true });
  };

  document.addEventListener("keydown", (event) => {
    const top = stack[stack.length - 1];
    if (!top) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close(top.modal);
      return;
    }

    if (event.key === "Tab") {
      const focusable = Array.from(top.modal.querySelectorAll(focusableSelector)).filter(
        (element) => element.offsetParent !== null
      );
      if (!focusable.length) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  return { open, close };
}

function setupProjectShowcases(modals) {
  const buttons = document.querySelectorAll(".project-launch");
  const modal = document.getElementById("projectModal");
  const stage = document.getElementById("projectStage");
  const title = document.getElementById("projectModalTitle");
  const kicker = document.getElementById("projectModalKicker");
  const description = document.getElementById("projectModalDescription");
  const githubLink = document.getElementById("projectModalGithub");
  const liveLink = document.getElementById("projectModalLive");
  const closeButton = document.getElementById("closeProjectModal");

  if (!buttons.length || !modal || !stage || !title || !kicker || !description || !githubLink || !closeButton) {
    return;
  }

  const projects = {
    carbonsphere: {
      title: "CarbonSphere AI",
      kicker: "Case 01 · Geospatial AI · 2026",
      summary: "Satellite imagery in, auditable forest-carbon estimates out.",
      problem:
        "Forest carbon audits rely on manual plot sampling: people physically counting trees. It's expensive, takes weeks per report, and the report is out of date as soon as it's delivered.",
      approach:
        "A FastAPI service chains Sentinel-2 NDVI from Google Earth Engine, OpenCV HSV canopy segmentation (tunable sensitivity, DeepLabV3 option), GIS area calculation and an IPCC Tier 1 biomass-to-CO₂ model. Every analysis is saved to MongoDB for auditability; a Leaflet/Chart.js dashboard shows maps and trends.",
      result:
        "One POST /forest/analyze call turns coordinates plus an image into biomass, carbon stock, CO₂-equivalent and carbon-credit estimates, with a stored history for review. It's a prototype.",
      stack: "Python, FastAPI, Google Earth Engine, OpenCV, MongoDB, Leaflet",
      status: "Prototype",
      github: "https://github.com/ShaikSameerShubhan0089/Carbon-Sphere",
      live: "https://carbon-sphere-1.onrender.com/",
      artifacts: [
        {
          type: "code",
          file: "backend/services/carbon_service.py",
          code: [
            "if ndvi < 0.2:",
            "    biomass_density = 0            # non-vegetated",
            "elif ndvi < 0.5:",
            "    biomass_density = 50 * ndvi    # shrub / grass",
            "else:",
            "    biomass_density = 150 * ndvi   # forest",
            "",
            "effective_area = area_hectares * tree_cover_ratio",
            "total_biomass = effective_area * biomass_density",
            "carbon_stock = total_biomass * 0.5     # ≈50% of biomass is carbon",
            "co2_equivalent = carbon_stock * 3.67   # 44/12",
          ],
        },
      ],
    },
    rise: {
      title: "RISE — Autism Risk Detection",
      kicker: "Case 02 · Healthcare ML · 2026",
      summary: "Risk Identification System for Early Detection — explainable autism-risk scoring.",
      problem:
        "Early-childhood development programmes need to flag children at risk of autism early, from structured assessments done in the field. The system has to support clinicians, not replace a diagnosis.",
      approach:
        "A 12-table PostgreSQL schema covers the location hierarchy down to anganwadi centres, longitudinal child tracking, referrals and audit logs. Four clinical indices (SCII, NSI, ERM, DBS) feed a calibrated XGBoost risk classifier and an escalation predictor built on longitudinal change. SHAP gives the top five reasons behind every score.",
      result:
        "The risk classifier met its ROC-AUC > 0.88 and sensitivity > 0.85 targets, and the escalation predictor met ROC-AUC > 0.82, on a synthetic cohort of 1,000 children. Scores map to four risk tiers, each with a clinical action. Phase 1 (data and models) is complete.",
      stack: "Python, XGBoost, SHAP, PostgreSQL",
      status: "Phase 1 complete",
      github: "https://github.com/ShaikSameerShubhan0089/RISE",
      live: "https://rise-sxih.onrender.com/",
      artifacts: [
        {
          type: "table",
          title: "Risk tiers",
          meta: "score → action",
          columns: ["Probability", "Tier", "Clinical action"],
          numeric: [0],
          rows: [
            ["< 0.25", "Low risk", "Routine monitoring"],
            ["0.25–0.50", "Mild concern", "Enhanced monitoring & reassessment"],
            ["0.50–0.75", "Moderate risk", "Specialist referral recommended"],
            ["> 0.75", "High risk", "Immediate specialist referral"],
          ],
        },
        {
          type: "table",
          title: "Model targets",
          meta: "synthetic cohort · n = 1,000",
          columns: ["Model", "Metric", "Target", "Met"],
          numeric: [2],
          met: 3,
          rows: [
            ["Risk classifier", "ROC-AUC", "> 0.88", "✓"],
            ["Risk classifier", "Sensitivity", "> 0.85", "✓"],
            ["Escalation predictor", "ROC-AUC", "> 0.82", "✓"],
          ],
          note: "Decision support — not a diagnostic tool.",
        },
      ],
    },
    queryvault: {
      title: "QueryVault AI",
      kicker: "Case 03 · Database AI agents · 2025",
      summary: "Four LLM agents that read a slow query’s plan and tell you how to fix it.",
      problem:
        "Slow SQL is hard to fix: reading EXPLAIN plans and choosing indexes takes database expertise most developers don't have.",
      approach:
        "For each pasted query, an async MariaDB client (aiomysql) collects the table schemas, the EXPLAIN plan and up to five sample rows. Four agents on Groq (Llama 3.3 70B) then run in turn: the Query Optimizer rewrites the query and proposes indexes, the Cost Advisor estimates IO/runtime cost, the Schema Advisor suggests indexes, partitioning and column changes, and the Data Validator checks the sample rows for quality issues. Each agent returns structured JSON, with fallbacks when the model's output can't be parsed.",
      result:
        "A single /analyze call returns the optimized query, recommendations, warnings, the EXPLAIN plan and sample rows in one view, plus a schema overview endpoint for the UI. DML and DDL are rejected before anything touches the database. Prototype.",
      stack: "Python, FastAPI, Groq (Llama 3.3 70B), MariaDB, aiomysql",
      status: "Prototype",
      github: "https://github.com/ShaikSameerShubhan0089/query",
      live: "https://queryvault-gaot.onrender.com/",
      artifacts: [
        {
          type: "code",
          file: "main.py",
          code: [
            'FORBIDDEN = ["insert", "update", "delete", "drop",',
            '             "truncate", "alter", "create", "replace"]',
            "",
            "def is_select_only(sql: str) -> bool:",
            "    q = sql.strip().lower()",
            '    if any(re.search(rf"\\b{kw}\\b", q) for kw in FORBIDDEN):',
            "        return False",
            '    return q.startswith("select") or q.startswith("with")',
          ],
        },
      ],
    },
    portfoliogen: {
      title: "Portfolio Generator",
      kicker: "Case 04 · Full-stack web app · 2025",
      summary: "A portfolio builder that turns form inputs into responsive, customizable portfolio websites.",
      problem: "Help users create portfolio websites faster without building one from scratch.",
      approach:
        "JWT-based registration, login and password reset; six mobile-optimized templates (minimal, project showcase, creative, business, developer/skills and blog); an enhanced builder with real-time preview; profile/project image and résumé uploads with Multer; email for password reset and sharing with Nodemailer; and a mobile-first UI with 44px touch targets. Deployed on Render.",
      result: "Reduced the effort required to launch a presentable personal portfolio online.",
      stack: "Node.js, Express, React, MongoDB, JWT, Multer, Nodemailer",
      status: "Live",
      github: "https://github.com/Smr2005/portfolio-Gen2",
      live: "https://portfolio-gen2.onrender.com/",
    },
    portfolio: {
      title: "Personal Portfolio (this site)",
      kicker: "Case 05 · Product engineering · 2026",
      summary: "A gated résumé flow and an AI assistant, built as a small product.",
      problem:
        "I wanted control over who receives my résumé without making recruiters wait on an inbox, and a static page can't answer a recruiter's follow-up questions.",
      approach:
        "Résumé requests email me a signed, expiring approval link; opening it shows a confirmation step so email link scanners can't trigger a send. Email goes through Brevo with a Gmail SMTP fallback. Laddu, the assistant, answers from a curated fact sheet with short conversation memory and supports voice input and spoken replies. Both endpoints are rate-limited, and the flow is covered by 27 automated tests.",
      result:
        "The PDF only reaches people I approve, and visitors can type or speak a question and get an answer about my work without scrolling.",
      stack: "Flask, Groq, Web Speech API, pytest",
      status: "Live",
      github: "https://github.com/Smr2005/SAMEER_Porfolio",
      live: "https://shaik-sameer-portfolio.onrender.com/",
      artifacts: [
        {
          type: "flow",
          title: "Résumé request flow",
          steps: ["Visitor requests", "Signed link emailed to me", "I confirm", "PDF sent"],
        },
      ],
    },
    disease: {
      title: "Multiple Disease Prediction",
      kicker: "Case 06 · Healthcare ML · 2025",
      summary: "Five disease-risk screenings from routine health inputs, in one Streamlit app.",
      problem: "Early warning for common diseases needs quick screening from routine health inputs.",
      approach:
        "Trained RandomForest models for diabetes, heart disease, Parkinson's, lung cancer and hypothyroidism, loaded into a single Streamlit app with an input form per condition, example values and an explanation of each measurement.",
      result: "One app screens five conditions from patient inputs, with example values and explanations of each measurement.",
      stack: "Python, scikit-learn, Streamlit",
      status: "Live",
      github: "https://github.com/Smr2005/Multiple_Disease_Prediction",
      live: "https://sameermedico.streamlit.app/",
    },
    movie: {
      title: "Movie Recommender System",
      kicker: "Case 07 · Recommendation ML · 2025",
      summary: "Pick a film you liked and get the five titles most like it.",
      problem: "Picking what to watch next from thousands of titles is slow.",
      approach: "A content-similarity recommender over the TMDB 5000 dataset, served through a Streamlit interface.",
      result: "Pick a movie and instantly get the five most similar titles.",
      stack: "Python, scikit-learn, Streamlit, TMDB 5000",
      status: "Live",
      github: "https://github.com/Smr2005/Smr2005-Movie-Recomendor-System",
      live: "https://smr2005-movie-recomendor-system-eqeizu5aesxnqxk9m3tz9u.streamlit.app/",
    },
    autofeel: {
      title: "Car Pulse (AutoFeel)",
      kicker: "Case 08 · NLP sentiment · 2025",
      summary: "How people feel about specific car models, read straight from their reviews.",
      problem: "Car buyers and brands can't easily see how people feel about specific models from raw reviews.",
      approach:
        "A Flask app cleans submitted reviews with NLTK and classifies their sentiment with a scikit-learn model, then groups the results by brand and model.",
      result: "Submitted reviews are scored Positive, Negative or Neutral and rolled up into sentiment trends per brand and model.",
      stack: "Python, Flask, NLTK, scikit-learn",
      status: "Live",
      github: "https://github.com/Smr2005/AutoFeel_Car_Sentiment_Analyzer_Flask",
      live: "https://carpulse.onrender.com/",
    },
    face: {
      title: "Facial Recognition System",
      kicker: "Case 09 · Computer vision · 2024",
      summary: "Real-time face detection and recognition from a webcam.",
      problem: "Identity checks from a live camera need fast, reliable face detection and matching.",
      approach: "OpenCV captures webcam frames, a Haar Cascade detects faces, and an LBPH recognizer trained on captured faces identifies them.",
      result: "Detects and recognizes known faces live, with on-screen recognition feedback.",
      stack: "Python, OpenCV",
      status: "Not deployed",
      github: "https://github.com/Smr2005/AI-Powered-Face-Recognitionapp",
      live: null,
    },
    iot: {
      title: "IoT Gas Leak Detection",
      kicker: "Case 10 · IoT safety",
      summary: "Sensor-based monitoring that raises an alert when gas levels signal a leak.",
      problem: "Gas leaks are dangerous when nobody notices them in time.",
      approach: "A sensor-based monitoring system watches gas levels and raises alerts.",
      result: "Gives early warning of leaks so people can respond quickly. The code isn't public.",
      stack: "IoT sensors, microcontroller",
      status: "Not deployed",
      github: null,
      live: null,
    },
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined) {
      node.textContent = text;
    }
    return node;
  };

  // Tiny Python highlighter: comments, strings, numbers, keywords.
  const TOKENS = /(#.*$)|((?:rf|r|f)?"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(if|elif|else|def|return|for|in|not|and|or|any)\b|\b(\d+(?:\.\d+)?)\b/g;
  const highlight = (line) => {
    const out = el("span", "l");
    let last = 0;
    line.replace(TOKENS, (match, comment, string, keyword, number, offset) => {
      if (offset > last) {
        out.append(line.slice(last, offset));
      }
      const kind = comment ? "tk-c" : string ? "tk-s" : keyword ? "tk-k" : "tk-n";
      out.append(el("span", kind, match));
      last = offset + match.length;
      return match;
    });
    out.append(line.slice(last) || (line ? "" : " "));
    return out;
  };

  const artifactHead = (left, right) => {
    const head = el("div", "artifact-head");
    head.append(el("span", "", left));
    if (right) {
      head.append(el("span", "", right));
    }
    return head;
  };

  const renderArtifact = (artifact) => {
    const figure = el("figure", artifact.type === "code" ? "artifact artifact-code" : "artifact");
    if (artifact.type === "code") {
      figure.append(artifactHead(artifact.file, "excerpt"));
      const pre = el("pre", "code");
      pre.tabIndex = 0;
      const code = el("code");
      artifact.code.forEach((line) => code.append(highlight(line)));
      pre.append(code);
      figure.append(pre);
    } else if (artifact.type === "table") {
      figure.append(artifactHead(artifact.title, artifact.meta));
      const scroll = el("div", "table-scroll");
      const table = el("table", "stack-sm");
      const thead = el("thead");
      const headRow = el("tr");
      artifact.columns.forEach((column) => {
        const th = el("th", "", column);
        th.scope = "col";
        headRow.append(th);
      });
      thead.append(headRow);
      const tbody = el("tbody");
      artifact.rows.forEach((row) => {
        const tr = el("tr");
        row.forEach((value, index) => {
          const className = artifact.numeric?.includes(index) ? "num" : index === artifact.met ? "met" : "";
          const td = el("td", className, value);
          td.dataset.label = artifact.columns[index];
          if (index === artifact.met) {
            td.append(el("span", "visually-hidden", " Met"));
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(thead, tbody);
      scroll.append(table);
      figure.append(scroll);
      if (artifact.note) {
        figure.append(el("p", "artifact-note", artifact.note));
      }
    } else if (artifact.type === "flow") {
      figure.append(artifactHead(artifact.title));
      const list = el("ol", "flow");
      artifact.steps.forEach((step) => list.append(el("li", "", step)));
      figure.append(list);
    }
    return figure;
  };

  const renderProject = (project) => {
    stage.replaceChildren();

    const detail = el("div", "project-detail");
    [
      ["Problem", project.problem],
      ["Approach", project.approach],
      ["Impact", project.result],
    ].forEach(([label, text]) => {
      const block = el("div", "project-detail-block");
      block.append(el("h3", "", label), el("p", "", text));
      detail.appendChild(block);
    });

    const meta = el("dl", "project-detail-meta");
    [
      ["Stack", project.stack],
      ["Status", project.status],
      ["Code", project.github ? "Public on GitHub" : "Private"],
    ]
      .filter(([, value]) => value)
      .forEach(([label, value]) => {
        const row = el("div");
        row.append(el("dt", "", label), el("dd", "", value));
        meta.appendChild(row);
      });
    detail.appendChild(meta);

    stage.appendChild(detail);
    (project.artifacts || []).forEach((artifact) => stage.appendChild(renderArtifact(artifact)));
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const project = projects[button.dataset.project];
      if (!project) {
        return;
      }

      kicker.textContent = project.kicker;
      title.textContent = project.title;
      description.textContent = project.summary;
      githubLink.hidden = !project.github;
      githubLink.href = project.github || "#";
      if (liveLink) {
        liveLink.hidden = !project.live;
        liveLink.href = project.live || "#";
      }
      renderProject(project);
      modals.open(modal, { initialFocus: modal.querySelector(".project-modal-card") });
    });
  });

  closeButton.addEventListener("click", () => modals.close(modal));
  modal.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.closeProject === "true") {
      modals.close(modal);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Games: shell                                                        */
/* ------------------------------------------------------------------ */

const KEY_ACTIONS = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  " ": "action",
  Spacebar: "action",
};

const CONTROL_LABELS = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

function setupGames(modals) {
  const launches = document.querySelectorAll(".game-launch");
  const modal = document.getElementById("gameModal");
  const stage = document.getElementById("gameStage");
  const title = document.getElementById("gameModalTitle");
  const description = document.getElementById("gameModalDescription");
  const scoreLabel = document.getElementById("gameScoreLabel");
  const helpText = document.getElementById("gameHelpText");
  const controls = document.getElementById("gameControls");
  const resetButton = document.getElementById("gameResetButton");
  const closeButton = document.getElementById("closeGameModal");

  if (!modal || !stage || !title || !description || !scoreLabel || !helpText || !controls || !resetButton || !closeButton) {
    return;
  }

  const catalog = {
    snake: {
      title: "Snake",
      description: "Eat the food to grow. Don't hit the walls or your own tail.",
      help: "Keyboard: arrow keys or WASD · Touch: swipe or use the buttons",
      controls: ["up", "left", "down", "right"],
      layout: "dpad",
      create: createSnakeGame,
    },
    tic: {
      title: "Tic Tac Toe",
      description: "Two players take turns placing X and O. Three in a row wins.",
      help: "Click or tap any empty cell",
      controls: [],
      create: createTicTacToe,
    },
    memory: {
      title: "Memory Match",
      description: "Flip two cards at a time and find every matching pair.",
      help: "Click or tap the cards",
      controls: [],
      create: createMemoryGame,
    },
    pong: {
      title: "Pong",
      description: "First to seven points wins. Keep the ball past the AI paddle.",
      help: "Keyboard: ↑ ↓ or W S · Touch: drag on the board or hold the buttons",
      controls: ["up", "down"],
      create: createPongGame,
    },
    flappy: {
      title: "Flappy Flight",
      description: "Flap to stay in the air and fly through the gaps between the pipes.",
      help: "Keyboard: Space or ↑ · Touch: tap the board or the Flap button",
      controls: ["action"],
      aliases: { up: "action" },
      actionLabel: "Flap",
      create: createFlappyGame,
    },
    racer: {
      title: "Lane Racer",
      description: "Switch lanes to dodge traffic. The road speeds up the longer you survive.",
      help: "Keyboard: ← → or A D · Touch: use the buttons",
      controls: ["left", "right"],
      create: createRacerGame,
    },
    shooter: {
      title: "Space Shooter",
      description: "Shoot enemies before they slip past you. Three misses or a collision ends the run.",
      help: "Keyboard: ← → to move, hold Space to fire · Touch: use the buttons",
      controls: ["left", "action", "right"],
      actionLabel: "Fire",
      create: createShooterGame,
    },
    platformer: {
      title: "Star Platformer",
      description: "Run and jump across the platforms to collect all five stars as fast as you can.",
      help: "Keyboard: ← → to run, Space or ↑ to jump · Touch: use the buttons",
      controls: ["left", "action", "right"],
      aliases: { up: "action" },
      actionLabel: "Jump",
      create: createPlatformerGame,
    },
  };

  const held = new Set();
  let config = null;
  let game = null;
  let inputLocked = false;

  const input = {
    isHeld: (action) => held.has(action),
  };

  const setScore = (text) => {
    scoreLabel.textContent = text;
  };

  const press = (action) => {
    if (!game || inputLocked || !config.controls.includes(action)) {
      return false;
    }
    if (!held.has(action)) {
      held.add(action);
      game.press?.(action);
    }
    return true;
  };

  const release = (action) => {
    held.delete(action);
  };

  const releaseAll = () => held.clear();

  const keyToAction = (key) => {
    const action = KEY_ACTIONS[key];
    return (action && config.aliases?.[action]) || action;
  };

  const renderControls = () => {
    controls.replaceChildren();
    controls.className = `game-controls${config.layout ? ` layout-${config.layout}` : ""}`;
    controls.hidden = !config.controls.length;

    config.controls.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `control-button control-${action}`;
      button.textContent = action === "action" ? config.actionLabel : CONTROL_LABELS[action];
      button.setAttribute("aria-label", action === "action" ? config.actionLabel : `Move ${action}`);

      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        press(action);
      });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
        button.addEventListener(type, () => release(action));
      });
      // Keyboard users activating the on-screen button.
      button.addEventListener("click", (event) => {
        if (event.detail === 0) {
          press(action);
          release(action);
        }
      });

      controls.appendChild(button);
    });
  };

  const stopGame = () => {
    game?.stop();
    game = null;
    releaseAll();
  };

  const startGame = () => {
    stopGame();
    stage.replaceChildren();
    game = config.create(stage, { setScore, input, press });
    game.start();
  };

  const card = modal.querySelector(".game-modal-card");
  const backdrop = modal.querySelector(".game-modal-backdrop");
  let launching = false;
  let launched = null; // { index, fromCube, cardEl }

  const closeGame = () => {
    stopGame();
    stage.replaceChildren();
    controls.replaceChildren();
    modal.classList.remove("is-animating");
    card?.getAnimations?.().forEach((animation) => animation.cancel());
    backdrop?.getAnimations?.().forEach((animation) => animation.cancel());
    launched = null;
  };

  /* Launch choreography: the 3D cube rises and bursts open (scene.js), then the modal
     card grows out of the cube's screen rectangle. Falls back to growing from the game
     card, and to the instant modal under reduced motion. */
  const REST = "translate(0px, 0px) perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
  const transformFrom = (rect, fromCube) => {
    const final = card.getBoundingClientRect();
    const scale = Math.min(1, Math.max(0.05, Math.max(rect.width / final.width, rect.height / final.height)));
    const dx = rect.left + rect.width / 2 - (final.left + final.width / 2);
    const dy = rect.top + rect.height / 2 - (final.top + final.height / 2);
    const tilt = fromCube ? "rotateX(24deg) rotateY(-18deg)" : "rotateX(0deg) rotateY(0deg)";
    return `translate(${dx}px, ${dy}px) perspective(900px) ${tilt} scale(${scale})`;
  };
  const canAnimate = () => typeof card?.animate === "function" && !prefersReducedMotion.matches;

  const growFrom = (rect, fromCube) => {
    modal.classList.add("is-animating");
    const duration = fromCube ? 440 : 320;
    const from = transformFrom(rect, fromCube);
    backdrop?.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: "ease-out" });
    const animation = card.animate(
      [
        { transform: from, opacity: 0.35, offset: 0 },
        { opacity: 1, offset: 0.4 },
        { transform: REST, opacity: 1, offset: 1 },
      ],
      { duration, easing: fromCube ? "cubic-bezier(0.25, 0.8, 0.25, 1)" : "cubic-bezier(0.16, 1, 0.3, 1)" }
    );
    return animation.finished.catch(() => {}).then(() => modal.classList.remove("is-animating"));
  };

  const shrinkInto = (rect, fromCube) => {
    modal.classList.add("is-animating");
    const duration = fromCube ? 400 : 280;
    const to = transformFrom(rect, fromCube);
    backdrop?.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: "ease-in", fill: "forwards" });
    const animation = card.animate(
      [
        { transform: REST, opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.55 },
        { transform: to, opacity: 0, offset: 1 },
      ],
      { duration, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" }
    );
    return animation.finished.catch(() => {});
  };

  const visibleRect = (element) => {
    const rect = element?.getBoundingClientRect();
    if (!rect || !rect.width || rect.bottom < 0 || rect.top > window.innerHeight) {
      return null;
    }
    return rect;
  };

  const beforeClose = async () => {
    const current = launched;
    stopGame();
    if (!current || !canAnimate()) {
      window.portfolioScene?.closeGame?.(current ? current.index : -1);
      return;
    }
    const scene = window.portfolioScene;
    const cubeRect = current.fromCube ? scene?.cubeRect?.(current.index) : null;
    const target = cubeRect || visibleRect(current.cardEl);
    const reassemble = current.fromCube && scene ? scene.closeGame(current.index) : Promise.resolve();
    if (target) {
      await Promise.all([shrinkInto(target, Boolean(cubeRect)), reassemble]);
    } else {
      await reassemble;
    }
  };

  launches.forEach((button) => {
    button.addEventListener("click", async () => {
      const next = catalog[button.dataset.game];
      if (!next || launching || !modal.hidden) {
        return;
      }
      launching = true;
      const cardEl = button.closest("[data-game-card]");
      const index = Number(cardEl?.dataset.gameCard);
      const animate = canAnimate();

      let cubeRect = null;
      const scene = window.portfolioScene;
      if (animate && scene?.launchGame && Number.isInteger(index)) {
        try {
          cubeRect = await scene.launchGame(index);
        } catch {
          cubeRect = null;
        }
      }
      const origin = animate ? cubeRect || visibleRect(cardEl) : null;

      config = next;
      title.textContent = config.title;
      description.textContent = config.description;
      helpText.textContent = config.help;
      renderControls();
      launched = { index, fromCube: Boolean(cubeRect), cardEl };
      modals.open(modal, { onClose: closeGame, beforeClose, initialFocus: card, returnFocus: button });
      // Draw the game's ready screen so the card grows with its real content; input
      // (and so the game itself) stays locked until the card reaches full size.
      startGame();
      if (origin) {
        inputLocked = true;
        await growFrom(origin, Boolean(cubeRect));
        inputLocked = false;
      }
      launching = false;
    });
  });

  resetButton.addEventListener("click", () => {
    if (config) {
      startGame();
    }
  });

  closeButton.addEventListener("click", () => modals.close(modal));
  modal.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.closeGame === "true") {
      modals.close(modal);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!game || inputLocked || modal.hidden || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const action = keyToAction(event.key);
    if (action && config.controls.includes(action)) {
      event.preventDefault();
      if (!event.repeat) {
        press(action);
      }
    }
  });

  document.addEventListener("keyup", (event) => {
    const action = config && keyToAction(event.key);
    if (action) {
      release(action);
    }
  });

  window.addEventListener("blur", releaseAll);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      releaseAll();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Games: canvas helpers                                               */
/* ------------------------------------------------------------------ */

function createCanvas(stage, width, height) {
  const surface = document.createElement("div");
  surface.className = "game-surface";

  const canvas = document.createElement("canvas");
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.className = "game-canvas";
  canvas.style.maxWidth = `min(100%, ${width * 1.15}px)`;

  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);

  surface.appendChild(canvas);
  stage.appendChild(surface);

  const toLogical = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    };
  };

  return { canvas, ctx, width, height, toLogical };
}

// Fixed 60 Hz simulation so speed is identical on 60 Hz and 120 Hz screens.
function createLoop(step, draw) {
  const STEP_MS = 1000 / 60;
  let frame = null;
  let last = 0;
  let accumulator = 0;

  const tick = (time) => {
    if (!last) {
      last = time;
    }
    accumulator += Math.min(time - last, 250);
    last = time;

    let running = true;
    while (accumulator >= STEP_MS && running) {
      running = step() !== false;
      accumulator -= STEP_MS;
    }

    draw();
    frame = running ? window.requestAnimationFrame(tick) : null;
  };

  return {
    start() {
      redrawGame = draw;
      this.stop();
      last = 0;
      accumulator = 0;
      frame = window.requestAnimationFrame(tick);
    },
    stop() {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      frame = null;
    },
  };
}

function roundRect(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.fill();
}

function circle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function star(ctx, x, y, outer, color) {
  const inner = outer * 0.45;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

function clearBoard(ctx, width, height, background) {
  ctx.clearRect(0, 0, width, height);
  if (background) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, background[0]);
    gradient.addColorStop(1, background[1]);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = COLORS.panel;
  }
  ctx.fillRect(0, 0, width, height);
}

function drawOverlay(ctx, width, height, heading, subheading) {
  ctx.save();
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 34px ${FONTS.display}`;
  ctx.fillText(heading, width / 2, height / 2 - 16);
  if (subheading) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `400 13px ${FONTS.mono}`;
    ctx.fillText(subheading.toUpperCase(), width / 2, height / 2 + 24);
  }
  ctx.restore();
}

const isTouchDevice = () => window.matchMedia("(pointer: coarse)").matches;
const startHint = (verb) => (isTouchDevice() ? `Tap a button to ${verb}` : `Press any control key to ${verb}`);

/* ------------------------------------------------------------------ */
/* Games                                                               */
/* ------------------------------------------------------------------ */

function createSnakeGame(stage, { setScore }) {
  const SIZE = 14;
  const CELL = 30;
  const board = createCanvas(stage, SIZE * CELL, SIZE * CELL);
  const { ctx, width, height, canvas } = board;
  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  let state = null;

  const placeFood = () => {
    const free = [];
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        if (!state.snake.some((segment) => segment.x === x && segment.y === y)) {
          free.push({ x, y });
        }
      }
    }
    state.food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
  };

  const step = () => {
    if (state.status !== "playing") {
      return true;
    }

    state.counter += 1;
    if (state.counter < state.interval) {
      return true;
    }
    state.counter = 0;

    if (state.queue.length) {
      state.direction = state.queue.shift();
    }

    const head = state.snake[0];
    const next = { x: head.x + state.direction.x, y: head.y + state.direction.y };
    const grows = state.food && next.x === state.food.x && next.y === state.food.y;
    const body = grows ? state.snake : state.snake.slice(0, -1);
    const hitWall = next.x < 0 || next.x >= SIZE || next.y < 0 || next.y >= SIZE;
    const hitSelf = body.some((segment) => segment.x === next.x && segment.y === next.y);

    if (hitWall || hitSelf) {
      state.status = "over";
      setScore(`Game over • Score: ${state.score}`);
      return false;
    }

    state.snake.unshift(next);
    if (grows) {
      state.score += 1;
      state.interval = Math.max(6, 11 - Math.floor(state.score / 4));
      placeFood();
      if (!state.food) {
        state.status = "won";
        setScore(`You win • Score: ${state.score}`);
        return false;
      }
    } else {
      state.snake.pop();
    }

    setScore(`Score: ${state.score}`);
    return true;
  };

  const draw = () => {
    clearBoard(ctx, width, height, BOARD);
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        roundRect(ctx, x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6, 3, COLORS.line);
      }
    }

    if (state.food) {
      circle(ctx, state.food.x * CELL + CELL / 2, state.food.y * CELL + CELL / 2, CELL / 2 - 6, COLORS.accent);
    }

    state.snake.forEach((segment, index) => {
      roundRect(
        ctx,
        segment.x * CELL + 3,
        segment.y * CELL + 3,
        CELL - 6,
        CELL - 6,
        3,
        index === 0 ? COLORS.accent : COLORS.textSoft
      );
    });

    if (state.status === "ready") {
      drawOverlay(ctx, width, height, "Snake", isTouchDevice() ? "Swipe or tap an arrow to start" : "Press an arrow key to start");
    } else if (state.status === "over") {
      drawOverlay(ctx, width, height, "Game over", `Score ${state.score} · press Restart`);
    } else if (state.status === "won") {
      drawOverlay(ctx, width, height, "Board cleared!", `Score ${state.score}`);
    }
  };

  const loop = createLoop(step, draw);

  const press = (action) => {
    const next = DIRECTIONS[action];
    if (!next || state.status === "over" || state.status === "won") {
      return;
    }

    // Compare against the last queued turn so two quick presses can't reverse the snake into itself.
    const reference = state.queue[state.queue.length - 1] || state.direction;
    const reverses = reference.x + next.x === 0 && reference.y + next.y === 0;
    const same = reference.x === next.x && reference.y === next.y;

    if (state.status === "ready") {
      state.status = "playing";
      if (!reverses) {
        state.direction = next;
      }
      return;
    }

    if (!reverses && !same && state.queue.length < 2) {
      state.queue.push(next);
    }
  };

  let swipeStart = null;
  canvas.addEventListener("pointerdown", (event) => {
    swipeStart = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!swipeStart) {
      return;
    }
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
      return;
    }
    press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  });
  canvas.style.touchAction = "none";

  return {
    start() {
      state = {
        snake: [
          { x: 6, y: 7 },
          { x: 5, y: 7 },
          { x: 4, y: 7 },
        ],
        direction: DIRECTIONS.right,
        queue: [],
        food: null,
        score: 0,
        counter: 0,
        interval: 11,
        status: "ready",
      };
      placeFood();
      setScore("Score: 0");
      loop.start();
    },
    stop() {
      loop.stop();
    },
    press,
  };
}

function createTicTacToe(stage, { setScore }) {
  const WINS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  let board = [];
  let player = "X";
  let winningLine = null;
  let ended = false;
  let cells = [];

  const surface = document.createElement("div");
  surface.className = "game-surface";
  const wrapper = document.createElement("div");
  wrapper.className = "tic-board";
  surface.appendChild(wrapper);

  const render = () => {
    cells.forEach((cell, index) => {
      cell.textContent = board[index];
      cell.classList.toggle("is-x", board[index] === "X");
      cell.classList.toggle("is-o", board[index] === "O");
      cell.classList.toggle("is-winning", Boolean(winningLine?.includes(index)));
      cell.disabled = ended || Boolean(board[index]);
      cell.setAttribute("aria-label", `Cell ${index + 1}${board[index] ? `, ${board[index]}` : ", empty"}`);
    });
  };

  const play = (index) => {
    if (ended || board[index]) {
      return;
    }

    board[index] = player;
    winningLine = WINS.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]) || null;

    if (winningLine) {
      ended = true;
      setScore(`Winner: ${player}`);
    } else if (board.every(Boolean)) {
      ended = true;
      setScore("Draw");
    } else {
      player = player === "X" ? "O" : "X";
      setScore(`Turn: ${player}`);
    }

    render();
  };

  cells = Array.from({ length: 9 }, (_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tic-cell";
    button.addEventListener("click", () => play(index));
    wrapper.appendChild(button);
    return button;
  });

  return {
    start() {
      board = Array(9).fill("");
      player = "X";
      winningLine = null;
      ended = false;
      setScore("Turn: X");
      stage.appendChild(surface);
      render();
    },
    stop() {},
  };
}

function createMemoryGame(stage, { setScore }) {
  const ICONS = ["AI", "DB", "ML", "UX", "API", "SQL", "BOT", "WEB"];
  let cards = [];
  let open = [];
  let attempts = 0;
  let locked = false;
  let timeout = null;
  let buttons = [];

  const surface = document.createElement("div");
  surface.className = "game-surface";
  const board = document.createElement("div");
  board.className = "memory-board";
  surface.appendChild(board);

  const shuffle = (array) => {
    for (let index = array.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
    }
    return array;
  };

  const render = () => {
    cards.forEach((card, index) => {
      const button = buttons[index];
      const faceUp = card.open || card.matched;
      button.textContent = faceUp ? card.value : "?";
      button.classList.toggle("is-open", card.open && !card.matched);
      button.classList.toggle("is-matched", card.matched);
      button.disabled = card.matched;
      button.setAttribute("aria-label", faceUp ? `Card ${card.value}` : `Hidden card ${index + 1}`);
    });
  };

  const flip = (index) => {
    const card = cards[index];
    if (locked || card.open || card.matched) {
      return;
    }

    card.open = true;
    open.push(index);

    if (open.length === 2) {
      attempts += 1;
      const [first, second] = open.map((cardIndex) => cards[cardIndex]);

      if (first.value === second.value) {
        first.matched = true;
        second.matched = true;
        first.open = false;
        second.open = false;
        open = [];
        const done = cards.every((entry) => entry.matched);
        setScore(done ? `Completed in ${attempts} attempts` : `Attempts: ${attempts}`);
      } else {
        locked = true;
        setScore(`Attempts: ${attempts}`);
        timeout = window.setTimeout(() => {
          first.open = false;
          second.open = false;
          open = [];
          locked = false;
          render();
        }, 750);
      }
    }

    render();
  };

  return {
    start() {
      window.clearTimeout(timeout);
      attempts = 0;
      open = [];
      locked = false;
      setScore("Attempts: 0");
      cards = shuffle([...ICONS, ...ICONS]).map((value) => ({ value, open: false, matched: false }));
      board.replaceChildren();
      buttons = cards.map((_, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "memory-card-button";
        button.addEventListener("click", () => flip(index));
        board.appendChild(button);
        return button;
      });
      stage.appendChild(surface);
      render();
    },
    stop() {
      window.clearTimeout(timeout);
    },
  };
}

function createPongGame(stage, { setScore, input }) {
  const W = 640;
  const H = 360;
  const PADDLE_W = 12;
  const PADDLE_H = 80;
  const BALL_R = 8;
  const WIN_SCORE = 7;
  const board = createCanvas(stage, W, H);
  const { ctx, canvas, toLogical } = board;

  let state = null;
  let dragTarget = null;

  const serve = (direction) => {
    state.ballX = W / 2;
    state.ballY = H / 2;
    state.ballVX = 5 * direction;
    state.ballVY = (Math.random() * 2 - 1) * 3;
    state.serveDelay = 45;
  };

  const bounce = (paddleY, direction) => {
    const offset = (state.ballY - (paddleY + PADDLE_H / 2)) / (PADDLE_H / 2);
    const speed = Math.min(Math.hypot(state.ballVX, state.ballVY) * 1.05, 11);
    const angle = offset * (Math.PI / 3.2);
    state.ballVX = Math.cos(angle) * speed * direction;
    state.ballVY = Math.sin(angle) * speed;
  };

  const step = () => {
    if (state.status !== "playing") {
      return true;
    }

    if (input.isHeld("up")) {
      dragTarget = null;
      state.playerY -= 6.5;
    }
    if (input.isHeld("down")) {
      dragTarget = null;
      state.playerY += 6.5;
    }
    if (dragTarget !== null) {
      state.playerY += Math.max(-9, Math.min(9, dragTarget - (state.playerY + PADDLE_H / 2)));
    }
    state.playerY = Math.max(0, Math.min(H - PADDLE_H, state.playerY));

    const aiCenter = state.aiY + PADDLE_H / 2;
    const aiTarget = state.ballVX > 0 ? state.ballY : H / 2;
    state.aiY += Math.max(-4.4, Math.min(4.4, (aiTarget - aiCenter) * 0.12));
    state.aiY = Math.max(0, Math.min(H - PADDLE_H, state.aiY));

    if (state.serveDelay > 0) {
      state.serveDelay -= 1;
      return true;
    }

    state.ballX += state.ballVX;
    state.ballY += state.ballVY;

    if (state.ballY - BALL_R <= 0 && state.ballVY < 0) {
      state.ballY = BALL_R;
      state.ballVY *= -1;
    }
    if (state.ballY + BALL_R >= H && state.ballVY > 0) {
      state.ballY = H - BALL_R;
      state.ballVY *= -1;
    }

    const playerX = 20;
    const aiX = W - 20 - PADDLE_W;

    // Only bounce while the ball moves toward a paddle, then push it clear, so it can't get stuck inside.
    if (
      state.ballVX < 0 &&
      state.ballX - BALL_R <= playerX + PADDLE_W &&
      state.ballX + BALL_R >= playerX &&
      state.ballY + BALL_R >= state.playerY &&
      state.ballY - BALL_R <= state.playerY + PADDLE_H
    ) {
      state.ballX = playerX + PADDLE_W + BALL_R;
      bounce(state.playerY, 1);
    }

    if (
      state.ballVX > 0 &&
      state.ballX + BALL_R >= aiX &&
      state.ballX - BALL_R <= aiX + PADDLE_W &&
      state.ballY + BALL_R >= state.aiY &&
      state.ballY - BALL_R <= state.aiY + PADDLE_H
    ) {
      state.ballX = aiX - BALL_R;
      bounce(state.aiY, -1);
    }

    if (state.ballX < -BALL_R * 2) {
      state.aiScore += 1;
      serve(1);
    } else if (state.ballX > W + BALL_R * 2) {
      state.playerScore += 1;
      serve(-1);
    }

    setScore(`You ${state.playerScore} • AI ${state.aiScore}`);

    if (state.playerScore >= WIN_SCORE || state.aiScore >= WIN_SCORE) {
      state.status = "over";
      setScore(`${state.playerScore > state.aiScore ? "You win" : "AI wins"} • ${state.playerScore}–${state.aiScore}`);
      return false;
    }

    return true;
  };

  const draw = () => {
    clearBoard(ctx, W, H, BOARD);
    ctx.save();
    ctx.strokeStyle = COLORS.lineStrong;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = COLORS.muted;
    ctx.font = `700 34px ${FONTS.display}`;
    ctx.textAlign = "center";
    ctx.fillText(String(state.playerScore), W / 2 - 60, 44);
    ctx.fillText(String(state.aiScore), W / 2 + 60, 44);

    roundRect(ctx, 20, state.playerY, PADDLE_W, PADDLE_H, 2, COLORS.text);
    roundRect(ctx, W - 20 - PADDLE_W, state.aiY, PADDLE_W, PADDLE_H, 2, COLORS.muted);
    circle(ctx, state.ballX, state.ballY, BALL_R, COLORS.accent);

    if (state.status === "ready") {
      drawOverlay(ctx, W, H, "Pong", isTouchDevice() ? "Drag on the board or tap a button to start" : "Press ↑ or ↓ to start");
    } else if (state.status === "over") {
      drawOverlay(
        ctx,
        W,
        H,
        state.playerScore > state.aiScore ? "You win!" : "AI wins",
        `${state.playerScore}–${state.aiScore} · press Restart`
      );
    }
  };

  const loop = createLoop(step, draw);

  const beginIfReady = () => {
    if (state.status === "ready") {
      state.status = "playing";
    }
  };

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", (event) => {
    beginIfReady();
    dragTarget = toLogical(event).y;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.buttons || event.pointerType === "touch") {
      dragTarget = toLogical(event).y;
    }
  });

  return {
    start() {
      state = {
        playerY: (H - PADDLE_H) / 2,
        aiY: (H - PADDLE_H) / 2,
        playerScore: 0,
        aiScore: 0,
        status: "ready",
      };
      dragTarget = null;
      serve(Math.random() > 0.5 ? 1 : -1);
      setScore("You 0 • AI 0");
      loop.start();
    },
    stop() {
      loop.stop();
    },
    press: beginIfReady,
  };
}

function createFlappyGame(stage, { setScore }) {
  const W = 640;
  const H = 360;
  const BIRD_X = 160;
  const BIRD_R = 13;
  const PIPE_W = 56;
  const GAP = 124;
  const SPACING = 230;
  const board = createCanvas(stage, W, H);
  const { ctx, canvas } = board;

  let state = null;

  const addPipe = (x) => {
    const gapTop = 50 + Math.random() * (H - GAP - 100);
    state.pipes.push({ x, gapTop, scored: false });
  };

  const flap = () => {
    if (state.status === "over") {
      return;
    }
    state.status = "playing";
    state.velocity = -6.6;
  };

  const collides = (pipe) => {
    const nearestX = Math.max(pipe.x, Math.min(BIRD_X, pipe.x + PIPE_W));
    const rects = [
      { top: 0, bottom: pipe.gapTop },
      { top: pipe.gapTop + GAP, bottom: H },
    ];
    return rects.some(({ top, bottom }) => {
      const nearestY = Math.max(top, Math.min(state.birdY, bottom));
      return Math.hypot(BIRD_X - nearestX, state.birdY - nearestY) < BIRD_R;
    });
  };

  const step = () => {
    if (state.status === "ready") {
      state.bob += 0.08;
      state.birdY = H / 2 + Math.sin(state.bob) * 8;
      return true;
    }

    state.velocity = Math.min(state.velocity + 0.36, 9);
    state.birdY += state.velocity;

    state.pipes.forEach((pipe) => {
      pipe.x -= 2.8;
      if (!pipe.scored && pipe.x + PIPE_W < BIRD_X - BIRD_R) {
        pipe.scored = true;
        state.score += 1;
      }
    });

    if (state.pipes.length && state.pipes[0].x + PIPE_W < 0) {
      state.pipes.shift();
    }
    const lastPipe = state.pipes[state.pipes.length - 1];
    if (!lastPipe || lastPipe.x < W - SPACING) {
      addPipe(W);
    }

    const hitBounds = state.birdY - BIRD_R < 0 || state.birdY + BIRD_R > H;
    if (hitBounds || state.pipes.some(collides)) {
      state.status = "over";
      setScore(`Game over • Score: ${state.score}`);
      return false;
    }

    setScore(`Score: ${state.score}`);
    return true;
  };

  const draw = () => {
    clearBoard(ctx, W, H, BOARD);
    state.pipes.forEach((pipe) => {
      roundRect(ctx, pipe.x, -10, PIPE_W, pipe.gapTop + 10, 3, COLORS.text);
      roundRect(ctx, pipe.x, pipe.gapTop + GAP, PIPE_W, H - pipe.gapTop - GAP + 10, 3, COLORS.text);
    });
    circle(ctx, BIRD_X, state.birdY, BIRD_R, COLORS.accent);
    circle(ctx, BIRD_X + 5, state.birdY - 4, 3, COLORS.bg);

    ctx.fillStyle = COLORS.text;
    ctx.font = `700 34px ${FONTS.display}`;
    ctx.textAlign = "center";
    ctx.fillText(String(state.score), W / 2, 44);

    if (state.status === "ready") {
      drawOverlay(ctx, W, H, "Flappy Flight", isTouchDevice() ? "Tap to flap" : "Press Space to flap");
    } else if (state.status === "over") {
      drawOverlay(ctx, W, H, "Crashed", `Score ${state.score} · press Restart`);
    }
  };

  const loop = createLoop(step, draw);

  canvas.style.touchAction = "manipulation";
  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    flap();
  });

  return {
    start() {
      state = { birdY: H / 2, velocity: 0, score: 0, pipes: [], bob: 0, status: "ready" };
      addPipe(W + 80);
      setScore("Score: 0");
      loop.start();
    },
    stop() {
      loop.stop();
    },
    press: flap,
  };
}

function createRacerGame(stage, { setScore }) {
  const W = 640;
  const H = 360;
  const ROAD_LEFT = 170;
  const ROAD_RIGHT = 470;
  const LANE_WIDTH = (ROAD_RIGHT - ROAD_LEFT) / 3;
  const CAR_W = 40;
  const CAR_H = 64;
  const PLAYER_Y = H - CAR_H - 18;
  const board = createCanvas(stage, W, H);
  const { ctx } = board;

  let state = null;
  const laneCenter = (lane) => ROAD_LEFT + LANE_WIDTH * lane + LANE_WIDTH / 2;

  const step = () => {
    if (state.status !== "playing") {
      return true;
    }

    state.speed = Math.min(3.4 + state.distance / 900, 9);
    state.distance += 1;
    state.dash = (state.dash + state.speed) % 40;
    state.playerX += (laneCenter(state.lane) - state.playerX) * 0.3;

    state.obstacles.forEach((obstacle) => {
      obstacle.y += state.speed;
    });
    state.obstacles = state.obstacles.filter((obstacle) => obstacle.y < H + CAR_H);

    // Spawn one car at a time with enough vertical spacing that a free lane always exists.
    state.sinceSpawn += state.speed;
    if (state.sinceSpawn > state.nextGap) {
      state.sinceSpawn = 0;
      state.nextGap = CAR_H * 2 + 20 + Math.random() * 120;
      state.obstacles.push({ lane: Math.floor(Math.random() * 3), y: -CAR_H });
    }

    const crashed = state.obstacles.some(
      (obstacle) =>
        Math.abs(laneCenter(obstacle.lane) - state.playerX) < CAR_W - 6 &&
        obstacle.y + CAR_H - 6 > PLAYER_Y &&
        obstacle.y + 6 < PLAYER_Y + CAR_H
    );

    const score = Math.floor(state.distance / 6);
    if (crashed) {
      state.status = "over";
      setScore(`Crashed • Distance: ${score}`);
      return false;
    }

    setScore(`Distance: ${score}`);
    return true;
  };

  const drawCar = (x, y, color) => {
    roundRect(ctx, x - CAR_W / 2, y, CAR_W, CAR_H, 10, color);
    roundRect(ctx, x - CAR_W / 2 + 7, y + 12, CAR_W - 14, 16, 2, COLORS.carWindow);
  };

  const draw = () => {
    clearBoard(ctx, W, H, BOARD);
    roundRect(ctx, ROAD_LEFT, 0, ROAD_RIGHT - ROAD_LEFT, H, 0, COLORS.panel2);
    ctx.fillStyle = COLORS.text;
    ctx.fillRect(ROAD_LEFT - 1, 0, 1, H);
    ctx.fillRect(ROAD_RIGHT, 0, 1, H);

    ctx.fillStyle = COLORS.muted;
    for (let lane = 1; lane < 3; lane += 1) {
      const x = ROAD_LEFT + LANE_WIDTH * lane - 2;
      for (let y = -40 + state.dash; y < H; y += 40) {
        ctx.fillRect(x + 1, y, 2, 20);
      }
    }

    state.obstacles.forEach((obstacle) => drawCar(laneCenter(obstacle.lane), obstacle.y, COLORS.text));
    drawCar(state.playerX, PLAYER_Y, COLORS.accent);

    if (state.status === "ready") {
      drawOverlay(ctx, W, H, "Lane Racer", startHint("start"));
    } else if (state.status === "over") {
      drawOverlay(ctx, W, H, "Crashed", `Distance ${Math.floor(state.distance / 6)} · press Restart`);
    }
  };

  const loop = createLoop(step, draw);

  return {
    start() {
      state = {
        lane: 1,
        playerX: laneCenter(1),
        obstacles: [],
        speed: 3.4,
        distance: 0,
        dash: 0,
        sinceSpawn: 0,
        nextGap: 120,
        status: "ready",
      };
      setScore("Distance: 0");
      loop.start();
    },
    stop() {
      loop.stop();
    },
    press(action) {
      if (state.status === "over") {
        return;
      }
      state.status = "playing";
      if (action === "left") {
        state.lane = Math.max(0, state.lane - 1);
      } else if (action === "right") {
        state.lane = Math.min(2, state.lane + 1);
      }
    },
  };
}

function createShooterGame(stage, { setScore, input }) {
  const W = 640;
  const H = 360;
  const SHIP_W = 36;
  const SHIP_H = 40;
  const SHIP_Y = H - SHIP_H - 14;
  const ENEMY_R = 14;
  const board = createCanvas(stage, W, H);
  const { ctx } = board;

  let state = null;

  const updateScore = () => {
    setScore(`Score: ${state.score} • Lives: ${state.lives}`);
  };

  const step = () => {
    if (state.status !== "playing") {
      return true;
    }

    state.time += 1;
    if (input.isHeld("left")) {
      state.shipX -= 5.5;
    }
    if (input.isHeld("right")) {
      state.shipX += 5.5;
    }
    state.shipX = Math.max(SHIP_W / 2, Math.min(W - SHIP_W / 2, state.shipX));

    state.cooldown = Math.max(0, state.cooldown - 1);
    if (input.isHeld("action") && state.cooldown === 0) {
      state.bullets.push({ x: state.shipX, y: SHIP_Y });
      state.cooldown = 14;
    }

    state.bullets.forEach((bullet) => {
      bullet.y -= 8;
    });
    state.bullets = state.bullets.filter((bullet) => bullet.y > -12);

    const difficulty = Math.min(state.time / 3600, 1);
    if (Math.random() < 0.018 + difficulty * 0.03) {
      state.enemies.push({
        x: ENEMY_R + Math.random() * (W - ENEMY_R * 2),
        y: -ENEMY_R,
        speed: 1.1 + Math.random() * 1.2 + difficulty * 1.6,
      });
    }

    state.enemies.forEach((enemy) => {
      enemy.y += enemy.speed;
    });

    state.bullets = state.bullets.filter((bullet) => {
      const hitIndex = state.enemies.findIndex(
        (enemy) => Math.abs(enemy.x - bullet.x) < ENEMY_R + 2 && Math.abs(enemy.y - bullet.y) < ENEMY_R + 8
      );
      if (hitIndex === -1) {
        return true;
      }
      state.enemies.splice(hitIndex, 1);
      state.score += 1;
      return false;
    });

    const rammed = state.enemies.some(
      (enemy) => Math.abs(enemy.x - state.shipX) < SHIP_W / 2 + ENEMY_R - 4 && enemy.y + ENEMY_R > SHIP_Y + 8
    );

    const escaped = state.enemies.filter((enemy) => enemy.y - ENEMY_R > H).length;
    state.enemies = state.enemies.filter((enemy) => enemy.y - ENEMY_R <= H);
    state.lives -= escaped;

    if (rammed || state.lives <= 0) {
      state.lives = Math.max(0, state.lives);
      state.status = "over";
      setScore(`Game over • Score: ${state.score}`);
      return false;
    }

    updateScore();
    return true;
  };

  const draw = () => {
    clearBoard(ctx, W, H, BOARD);

    ctx.fillStyle = COLORS.lineStrong;
    state.stars.forEach((star) => {
      ctx.fillRect(star.x, (star.y + state.time * star.speed) % H, star.size, star.size);
    });

    state.bullets.forEach((bullet) => roundRect(ctx, bullet.x - 1.5, bullet.y - 14, 3, 14, 1, COLORS.muted));
    state.enemies.forEach((enemy) => circle(ctx, enemy.x, enemy.y, ENEMY_R, COLORS.text));

    ctx.save();
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.moveTo(state.shipX, SHIP_Y);
    ctx.lineTo(state.shipX + SHIP_W / 2, SHIP_Y + SHIP_H);
    ctx.lineTo(state.shipX - SHIP_W / 2, SHIP_Y + SHIP_H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (state.status === "ready") {
      drawOverlay(ctx, W, H, "Space Shooter", startHint("start"));
    } else if (state.status === "over") {
      drawOverlay(ctx, W, H, "Game over", `Score ${state.score} · press Restart`);
    }
  };

  const loop = createLoop(step, draw);

  return {
    start() {
      state = {
        shipX: W / 2,
        bullets: [],
        enemies: [],
        score: 0,
        lives: 3,
        cooldown: 0,
        time: 0,
        status: "ready",
        stars: Array.from({ length: 40 }, () => ({
          x: Math.random() * W,
          y: Math.random() * H,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.4 + 0.1,
        })),
      };
      updateScore();
      loop.start();
    },
    stop() {
      loop.stop();
    },
    press() {
      if (state.status === "ready") {
        state.status = "playing";
      }
    },
  };
}

function createPlatformerGame(stage, { setScore, input }) {
  const W = 640;
  const H = 360;
  const PLAYER_W = 24;
  const PLAYER_H = 32;
  const GRAVITY = 0.45;
  const JUMP = -9.4;
  const board = createCanvas(stage, W, H);
  const { ctx } = board;

  const PLATFORMS = [
    { x: 0, y: 344, width: W },
    { x: 40, y: 290, width: 140 },
    { x: 220, y: 238, width: 130 },
    { x: 400, y: 186, width: 120 },
    { x: 540, y: 132, width: 90 },
    { x: 230, y: 110, width: 100 },
  ];

  const STAR_POSITIONS = [
    { x: 110, y: 266 },
    { x: 285, y: 214 },
    { x: 460, y: 162 },
    { x: 585, y: 108 },
    { x: 280, y: 86 },
  ];

  let state = null;

  const elapsedSeconds = () => (state.frames / 60).toFixed(1);

  const step = () => {
    if (state.status !== "playing") {
      return true;
    }

    state.frames += 1;

    let dx = 0;
    if (input.isHeld("left")) {
      dx -= 3.4;
    }
    if (input.isHeld("right")) {
      dx += 3.4;
    }
    state.x = Math.max(0, Math.min(W - PLAYER_W, state.x + dx));

    if (state.jumpQueued > 0) {
      state.jumpQueued -= 1;
      if (state.grounded) {
        state.vy = JUMP;
        state.grounded = false;
        state.jumpQueued = 0;
      }
    }

    const previousBottom = state.y + PLAYER_H;
    state.vy = Math.min(state.vy + GRAVITY, 12);
    state.y += state.vy;
    state.grounded = false;

    PLATFORMS.forEach((platform) => {
      const overlapsX = state.x + PLAYER_W > platform.x && state.x < platform.x + platform.width;
      const bottom = state.y + PLAYER_H;
      if (overlapsX && state.vy >= 0 && previousBottom <= platform.y && bottom >= platform.y) {
        state.y = platform.y - PLAYER_H;
        state.vy = 0;
        state.grounded = true;
      }
    });

    state.stars.forEach((star) => {
      if (
        !star.taken &&
        star.x > state.x - 10 &&
        star.x < state.x + PLAYER_W + 10 &&
        star.y > state.y - 10 &&
        star.y < state.y + PLAYER_H + 10
      ) {
        star.taken = true;
        state.score += 1;
      }
    });

    if (state.stars.every((star) => star.taken)) {
      state.status = "won";
      setScore(`All stars in ${elapsedSeconds()}s`);
      return false;
    }

    setScore(`Stars: ${state.score}/${STAR_POSITIONS.length} • ${elapsedSeconds()}s`);
    return true;
  };

  const draw = () => {
    clearBoard(ctx, W, H, BOARD);

    PLATFORMS.forEach((platform, index) => {
      roundRect(ctx, platform.x, platform.y, platform.width, index === 0 ? 16 : 10, 2, index === 0 ? COLORS.text : COLORS.textSoft);
    });

    state.stars.forEach((item) => {
      if (!item.taken) {
        star(ctx, item.x, item.y, 10, COLORS.highlight);
      }
    });

    roundRect(ctx, state.x, state.y, PLAYER_W, PLAYER_H, 3, COLORS.accent);
    roundRect(ctx, state.x + 14, state.y + 8, 5, 5, 1, COLORS.bg);

    if (state.status === "ready") {
      drawOverlay(ctx, W, H, "Star Platformer", startHint("start"));
    } else if (state.status === "won") {
      drawOverlay(ctx, W, H, "All stars collected!", `${elapsedSeconds()} seconds · press Restart`);
    }
  };

  const loop = createLoop(step, draw);

  return {
    start() {
      state = {
        x: 60,
        y: 290 - PLAYER_H,
        vy: 0,
        grounded: true,
        jumpQueued: 0,
        score: 0,
        frames: 0,
        status: "ready",
        stars: STAR_POSITIONS.map((star) => ({ ...star, taken: false })),
      };
      setScore(`Stars: 0/${STAR_POSITIONS.length}`);
      loop.start();
    },
    stop() {
      loop.stop();
    },
    press(action) {
      if (state.status === "won") {
        return;
      }
      state.status = "playing";
      if (action === "action" || action === "up") {
        // Small buffer so a jump pressed just before landing still counts.
        state.jumpQueued = 8;
      }
    },
  };
}
