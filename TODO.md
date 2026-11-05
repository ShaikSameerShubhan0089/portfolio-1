# Portfolio Audit — TODO

Audit: 2026-09-14. Fixes applied the same day and verified with 23 pytest tests plus browser checks at 1440px, 900px, and 390px.

Flags: 🔴 Critical · 🟠 Bug · 🟡 Looks bad / UX · ⚪ Cleanup · 👤 Needs you

---

## 👤 Still needs you

- [ ] **Rotate the old `SENDER_PASSWORD`** if it was ever a real password. The line was deleted from `.env`, but the value may exist elsewhere.
- [ ] **Set `SECRET_KEY` in your local `.env`** (see `.env.example`). Render generates one automatically from `render.yaml`.
- [ ] **Update the resume PDF content.** [private/sameer_resume.pdf](private/sameer_resume.pdf) is out of date: it lists `shaiksameershubhan@gmail.com` (site uses `…71@gmail.com`), the old `Smr2005` GitHub, "Computer Science graduate", and no Agile CAS / HMG roles. It was compressed from 4.1 MB to 302 KB, but its text is unchanged.
- [ ] **IoT Gas Leak Detection repo** isn't public on either GitHub account. The GitHub button was removed; add it back if you publish the repo.
- [ ] **Consolidate GitHub accounts** (`Smr2005` vs `ShaikSameerShubhan0089`). Links now all work, but projects are split across both.
- [ ] **Check the Render dashboard** has `BREVO_API_KEY` and `GROQ_API_KEY` set, then deploy.
- [ ] **Review and commit** the staged changes (nothing was committed).

## 🔴 Critical — done

- [x] `/approve_resume` now requires a signed token that expires after 7 days (itsdangerous). GET only shows a confirmation page; the resume is sent on POST, so email link scanners can't trigger it.
- [x] Request email is rendered with an auto-escaping Jinja template, so HTML injection no longer works.
- [x] Approval link is built with `url_for` (with ProxyFix, or `PUBLIC_BASE_URL`) instead of the dead hardcoded `…-ta3w.onrender.com` domain.
- [x] Brevo/Groq error details are logged server-side only; visitors see generic messages.
- [x] Rate limits: chat 20 per 10 min per IP, resume requests 5 per hour per IP; questions capped at 500 characters.
- [x] Groq response parsing is guarded; malformed responses return 502 instead of crashing.
- [x] Resume is gated only: the Download button is gone and the PDF moved from `static/` to `private/`.
- [x] `venv/` untracked (`git rm -r --cached`); it's already in `.gitignore`.
- [x] Real favicons (ico, 16px, 32px, apple-touch) and a 1200×630 `og-image.png` generated from the logo.
- [x] Debug mode and port come from the environment (`FLASK_DEBUG`, `PORT`).
- [x] Unused `SENDER_PASSWORD`, `SMTP_SERVER`, and `SMTP_PORT` removed from `.env`. `SENDER_EMAIL` and `OWNER_EMAIL` are now read from the environment.

## 🟠 Bugs — done

### Chatbot
- [x] Visitor's message is no longer deleted on errors (the "thinking" bubble is removed by reference).
- [x] Enter, Send, and prompt chips are all locked while a request is pending.
- [x] Last 8 messages are sent as history, so follow-up questions work. The server validates roles and lengths.
- [x] Chatbot facts now match the site: all 9 projects, B.Tech **2022**–2026 (confirmed from the resume), certifications, consistent name.

### Layout
- [x] Sticky header works (`overflow-x: clip` instead of `overflow: hidden`).
- [x] Removed `perspective` from `.page-shell`, so fixed background layers stay fixed. The cubes keep their own perspective.
- [x] Escape closes both modals. Modals have `role="dialog"`, `aria-modal`, a focus trap, and focus returns to the trigger on close.
- [x] Reveal animation only hides content when JS runs (`.js` class). Content also shows in print and when JS is off.

### Games (rebuilt on `<canvas>`)
- [x] Touch support: on-screen buttons on touch devices, swipe for Snake, drag for Pong, tap to flap.
- [x] Fixed logical board sizes that scale to any width. Verified on a 390px screen: nothing clipped or off-screen.
- [x] One shared keyboard listener, so Restart can no longer multiply input.
- [x] Pong: ball can't stick in paddles; first to 7 wins.
- [x] Snake: turns are queued and checked against the last queued direction, so the snake can't reverse into itself.
- [x] Memory: final matched pair gets its styling.
- [x] Racer: spawn spacing guarantees an open lane.
- [x] Fixed 60 Hz simulation, so speed is the same on 120 Hz screens. Canvas replaces per-frame DOM rebuilds.
- [x] "Concept" copy removed; all eight games are described as playable.
- [x] Pong preview card paddles positioned correctly (they were missing `position: absolute`).

### Links
- [x] QueryVault GitHub → `ShaikSameerShubhan0089/QueryVault`.
- [x] IoT GitHub button removed (repo not public).
- [x] "Live Demo" renamed "Details". The modal now shows that project's own illustration instead of a shared generic scene.
- [x] Hero photo served locally instead of from `github.com/Smr2005.png`.

## 🟡 Looks bad / UX — done

- [x] All leftover "now / existing backend / future expansion" developer notes rewritten.
- [x] Self-praise in the hero replaced with concrete facts (current role, 9 projects, 0.92 ROC-AUC, education).
- [x] Hero headline shortened and resized; CTAs now above the fold at 1440×900.
- [x] Chat chips and input row no longer stretch.
- [x] About section: small cards stack beside the feature card instead of squeezing to 2–3 words per line.
- [x] Project and game card buttons line up across rows; game previews are a fixed height.
- [x] Modal score label and GitHub button no longer wrap.
- [x] Resume preview sheet is smaller and no longer covers the portrait.
- [x] Footer aligned. Floating chat button is a clear icon, hidden over the hero, chat, and footer, and smaller on mobile.
- [x] Card kickers are more readable (uppercase, higher contrast, spacing above headings).
- [x] Mobile: projects and games collapse to 4 with a "Show all" button (page height 23,400px → 17,400px).
- [x] Mobile: modal close button stays top-right; nav is opaque and closes on outside tap or Escape; brand subtitle fits one line; placeholder no longer cut off.
- [x] Contact added to the nav. Nav collapses at ≤960px so 8 links never overflow.
- [x] Education section and all 7 certificates added (files renamed to readable slugs).
- [x] Resume result pages, approval page, and errors share a styled layout with fonts; 404/405/500 are styled.
- [x] Chat input has a label; skip link and `:focus-visible` styles added.

## ⚪ Cleanup — done

- [x] Images resized to WebP with width/height and lazy loading: about photo 660 KB → 36 KB, portrait 148 KB → 51 KB, logo 44 KB → 6 KB.
- [x] Unused 3000×4000 photo, `chatbot-icon.png`, and old originals deleted.
- [x] Resume PDF 4.1 MB → 302 KB (stripped the embedded color-emoji table; pages render identically, emoji in monochrome).
- [x] Unused CSS removed (`ai-orb`, `button-muted`, `button-disabled`, `game-board`, `mouth`, `orb-core`, old DOM game boards, generic project scene). The audit's "26 duplicate selectors" was mostly a false positive from grouped selectors; the 2 real duplicates were merged.
- [x] Inline game background overrides removed (canvas rendering).
- [x] `requirements.txt` pinned; `requirements-dev.txt` added; `PYTHON_VERSION`, `SECRET_KEY`, and worker settings added to `render.yaml`.
- [x] Python indentation fixed.
- [x] README written; `.env.example` added.
- [x] Deletions from the earlier cleanup staged (nothing committed).
- [x] Tests added: [tests/test_app.py](tests/test_app.py) (23 tests).
