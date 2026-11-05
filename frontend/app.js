(() => {
  const apiBase = window.PORTFOLIO_API_BASE || "";
  const resumeForm = document.getElementById("resumeForm");
  const resumeStatus = document.getElementById("resumeStatus");
  const consent = document.getElementById("analyticsConsent");
  const consentKey = "sameer-analytics-consent";

  resumeForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = resumeForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    resumeStatus.textContent = "Sending your request…";
    try {
      const response = await fetch(`${apiBase}/api/resume`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(Object.fromEntries(new FormData(resumeForm))),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Your request could not be sent. Please try again later.");
      if (!result.message) throw new Error("The server returned an unexpected response. Please try again later.");
      resumeStatus.textContent = result.message;
      resumeForm.reset();
    } catch (error) {
      resumeStatus.textContent = error instanceof TypeError
        ? "Could not reach the backend. Check that it is running and try again."
        : error.message;
    } finally {
      submit.disabled = false;
    }
  });

  const sendVisit = () => fetch(`${apiBase}/api/visit`, {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer }),
  }).catch(() => {});

  const loadAnalytics = () => {
    sendVisit();
    const id = window.PORTFOLIO_GA_ID;
    if (!id || !/^G-[A-Z0-9]+$/i.test(id) || document.querySelector("[data-ga-loaded]")) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    script.dataset.gaLoaded = "true";
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
  };

  const remember = (value) => {
    try { localStorage.setItem(consentKey, value); } catch {}
    consent?.setAttribute("hidden", "");
    if (value === "accepted") loadAnalytics();
  };

  document.getElementById("analyticsAccept")?.addEventListener("click", () => remember("accepted"));
  document.getElementById("analyticsDecline")?.addEventListener("click", () => remember("declined"));
  try {
    const saved = localStorage.getItem(consentKey);
    if (saved === "accepted") loadAnalytics();
    else if (saved !== "declined") consent?.removeAttribute("hidden");
  } catch {
    // Without storage consent is not persisted; do not load analytics automatically.
    consent?.removeAttribute("hidden");
  }
})();
