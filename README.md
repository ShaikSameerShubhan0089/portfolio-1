# Shaik Sameer — Personal Brand Website

A full-stack portfolio with an independently served static frontend and Flask API backend. The frontend contains the portfolio, styles, games, and browser-side scripts. The backend owns chat, resume-request email, approval links, analytics, credentials, and the private resume PDF.

## Project structure

```
frontend/
  index.html       Generated standalone portfolio page
  config.js        Backend API URL for the frontend
  app.js           Resume request and visit tracking
  static/          CSS, JavaScript, images, fonts, certificates, and vendor assets
backend/
  myapp.py         Flask API and server-side approval/admin pages
  analytics.py     Optional Postgres analytics
  templates/       Backend email and approval/admin templates
  static/          Assets for backend-rendered approval/admin pages
  private/         Resume PDF (never publicly served)
  requirements.txt Python runtime dependencies
  tests/           Backend tests
  build_frontend.py Rebuilds frontend/index.html from backend/templates/index.html
```

The frontend calls `/api/chat`, `/api/resume`, and `/api/visit` on the configured backend. API keys and private files stay in the backend.

## Start locally

Requires Python 3.12+. Open two PowerShell terminals from the project root.

**Terminal 1 — backend:**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
python myapp.py
```

**Terminal 2 — frontend:**

```powershell
cd frontend
python -m http.server 5500
```

Open <http://localhost:5500>. Add your API keys to `backend/.env` for chat and email features. The backend allows the local frontend origin by default.

If you edit the portfolio template at `backend/templates/index.html`, rebuild the local preview from the project root:

```powershell
python backend/build_frontend.py
```

The default build warns when `SITE_URL` is still the example placeholder. Before a production deployment, set `SITE_URL` in `backend/.env` to the real HTTPS frontend origin and use the guarded production build:

```powershell
python backend/build_frontend.py --production
```

The production build stops before writing output if the domain is missing, local, or still an example placeholder.

Run backend tests from `backend/` with `python -m pytest`.

## Deploy independently

### Frontend on Netlify

Connect this GitHub repository to Netlify. The included [netlify.toml](netlify.toml) builds the generated static page and publishes `frontend/`; no npm commands are required. In the Netlify site settings, set `SITE_URL` to the final public HTTPS domain. Netlify will stop the production build if that value is missing or still a placeholder. Set `window.PORTFOLIO_API_BASE` in `frontend/config.js` to the deployed Flask API URL before deploying.

To connect a custom domain, open the Netlify site's **Domain management** settings, add the domain, then apply the DNS records Netlify displays at your domain registrar. Set the same canonical origin as `SITE_URL` in Netlify's build environment and in the Render backend environment.

### Backend on Render

Deploy the Flask service using [render.yaml](render.yaml). Set `FRONTEND_ORIGIN` to the exact deployed Netlify origin. Set service credentials such as `BREVO_API_KEY`, `GROQ_API_KEY`, and `DATABASE_URL` in Render's Environment settings; never add them to `frontend/config.js` or Git.

See [backend/.env.example](backend/.env.example) for available server settings.
## Personal-brand SEO and search setup

The site uses Shaik Sameer as the primary name, with Sam and Sameer as natural alternate names. It includes semantic page sections, Open Graph/Twitter metadata, JSON-LD Person/WebSite/ProfilePage data, image alt text, and an image sitemap. These help search engines understand and discover the site but cannot guarantee indexing or a particular ranking.

Before deploying:

1. Choose the final public domain and set `SITE_URL` in `backend/.env` to that origin (no trailing slash), for example `https://sameershaik.com`.
2. Set `window.PORTFOLIO_API_BASE` in `frontend/config.js` to the deployed Flask API URL, and set `FRONTEND_ORIGIN` in the backend environment to the exact frontend origin.
3. From the repository root run `python backend/build_frontend.py --production`. This synchronizes frontend assets into the backend for its approval/admin pages and generates `frontend/index.html`, `frontend/sitemap.xml`, and `frontend/robots.txt` using the required real `SITE_URL`.
4. Deploy the `frontend/` folder as a static site and `backend/` as the Flask service. Keep `.env` and service credentials out of Git.

### Google Search Console

- Add the final domain property in [Google Search Console](https://search.google.com/search-console/) and verify ownership with DNS or the verification method Google provides.
- Submit `https://YOUR_DOMAIN/sitemap.xml` after replacing the example with the actual site domain.
- Use URL Inspection on the homepage, confirm crawling is allowed by `robots.txt`, and request indexing after the live deployment is stable.
- Review indexing, branded search queries, and image search performance over time. Search visibility can take time and is not guaranteed.

### Google Analytics

No Analytics property is configured by default. The optional consent banner keeps both first-party visit/question analytics and Google Analytics off until the visitor opts in. If you create a GA4 property, set its measurement ID (`G-...`) in `frontend/config.js`; analytics only loads after an explicit Allow action. Configure retention and consent settings in Google Analytics to match your privacy obligations.

### Photos and Google Images

The gallery reuses the genuine profile and event photos already in `frontend/static/images/` without altering faces. The generated image sitemap lists those crawlable image URLs. Before launch, confirm the final domain and static asset URLs match the deployed site, and supply any additional genuine photos you want included. No generated or stock identity photos are used.
