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

Open <http://localhost:5500>. Add local-only API credentials to the ignored `backend/.env` for chat and email features. Local browser origins are accepted only when `FLASK_DEBUG=1`.

If you edit the portfolio template at `backend/templates/index.html`, rebuild the local preview from the project root:

```powershell
python backend/build_frontend.py
```

The default `SITE_URL` is the current Netlify origin. Set it in the environment when building for a different domain. The production build rejects placeholder, local, and non-HTTPS URLs:

```powershell
python backend/build_frontend.py --production
```

The production build stops before writing output if the domain is missing, local, or still an example placeholder.

Run backend tests from `backend/` with `python -m pytest`.

## Deploy independently

### Frontend on Netlify

Connect this GitHub repository to Netlify. The included [netlify.toml](netlify.toml) builds the generated static page and publishes `frontend/`; no npm commands are required. In Netlify's build environment, set `SITE_URL` to `https://shaiksameershubhan.netlify.app`. The frontend API base is kept in one public-only setting in `frontend/config.js`; it must point to the Render service and contains no credentials.

To connect a custom domain later, add it in Netlify **Domain management**, apply Netlify's DNS records at your registrar, then change `SITE_URL` in Netlify and Render to the custom HTTPS origin. Change Render's `FRONTEND_ORIGIN` to that same frontend origin. Keep `PUBLIC_BASE_URL` set to the Render backend URL.

### Backend on Render

Deploy the Flask service as a Render Web Service with root directory `backend`, build command `pip install -r requirements.txt`, and start command `gunicorn myapp:app --workers 1 --threads 4 --timeout 60`. In the Render Environment settings, set `FRONTEND_ORIGIN=https://shaiksameershubhan.netlify.app`, `SITE_URL=https://shaiksameershubhan.netlify.app`, and `PUBLIC_BASE_URL=https://sameer-portfolio-backend-4ep8.onrender.com`. Set credentials such as `BREVO_API_KEY`, `GROQ_API_KEY`, `DATABASE_URL`, and `SECRET_KEY` only in Render; never add them to frontend files or Git. The liveness endpoint is `/health`.

See [backend/.env.example](backend/.env.example) for available server settings.
## Personal-brand SEO and search setup

The site uses Shaik Sameer as the primary name, with Sam and Sameer as natural alternate names. It includes semantic page sections, Open Graph/Twitter metadata, JSON-LD Person/WebSite/ProfilePage data, image alt text, and an image sitemap. These help search engines understand and discover the site but cannot guarantee indexing or a particular ranking.

Before deploying:

1. Use `https://shaiksameershubhan.netlify.app` as the official URL. Set `SITE_URL` in Netlify's build environment and in Render's service environment to that exact origin.
2. Set Render `FRONTEND_ORIGIN` to the same Netlify origin and `PUBLIC_BASE_URL` to `https://sameer-portfolio-backend-4ep8.onrender.com`. The public API base is configured in `frontend/config.js`.
3. From the repository root run `python backend/build_frontend.py --production` after setting `SITE_URL` in the shell or `backend/.env`. Netlify runs the same build command using its environment variable. This generates canonical metadata, `frontend/sitemap.xml`, and `frontend/robots.txt` for the official URL.
4. Deploy `frontend/` to Netlify and `backend/` to Render. Keep `.env` and all service credentials out of Git.

### Google Search Console

- Add the final domain property in [Google Search Console](https://search.google.com/search-console/) and verify ownership with DNS or the verification method Google provides.
- Submit `https://shaiksameershubhan.netlify.app/sitemap.xml`.
- Use URL Inspection on the homepage, confirm crawling is allowed by `robots.txt`, and request indexing after the live deployment is stable.
- Review indexing, branded search queries, and image search performance over time. Search visibility can take time and is not guaranteed.

### Google Analytics

No Analytics property is configured by default. The optional consent banner keeps both first-party visit/question analytics and Google Analytics off until the visitor opts in. If you create a GA4 property, set its measurement ID (`G-...`) in `frontend/config.js`; analytics only loads after an explicit Allow action. Configure retention and consent settings in Google Analytics to match your privacy obligations.

### Photos and Google Images

The gallery reuses the genuine profile and event photos already in `frontend/static/images/` without altering faces. The generated image sitemap lists those crawlable image URLs. Before launch, confirm the final domain and static asset URLs match the deployed site, and supply any additional genuine photos you want included. No generated or stock identity photos are used.
