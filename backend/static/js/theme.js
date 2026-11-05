// Light / dark theme toggle. The initial theme is applied by the inline script in
// _head_assets.html before first paint; this file wires up the header buttons.
(() => {
  const root = document.documentElement;
  const THEME_COLOR = { light: "#F4F3EE", dark: "#111A18" };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let settleTimer = 0;

  const current = () => (root.dataset.theme === "dark" ? "dark" : "light");

  const sync = () => {
    const theme = current();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.hidden = false;
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  };

  const setTheme = (theme) => {
    if (!reducedMotion.matches) {
      root.classList.add("theme-switching");
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => root.classList.remove("theme-switching"), 260);
    }
    root.dataset.theme = theme;
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // Storage unavailable (private mode, blocked): the choice lasts for this page only.
    }
    sync();
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  };

  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-theme-toggle]") : null;
    if (button) {
      setTheme(current() === "dark" ? "light" : "dark");
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync, { once: true });
  } else {
    sync();
  }
})();
