from pathlib import Path
from shutil import copytree
from urllib.parse import urlsplit
from xml.sax.saxutils import escape
import argparse

from myapp import SITE_URL, app


def main():
    parser = argparse.ArgumentParser(description="Build the static portfolio and search files.")
    parser.add_argument(
        "--production",
        action="store_true",
        help="Require a real HTTPS SITE_URL before writing deployable output.",
    )
    args = parser.parse_args()
    parsed_site = urlsplit(SITE_URL)
    hostname = (parsed_site.hostname or "").lower()
    placeholder = (
        parsed_site.scheme != "https"
        or not hostname
        or hostname.endswith(".example")
        or "your-domain" in hostname
        or hostname in {"localhost", "127.0.0.1", "0.0.0.0"}
    )
    if args.production and placeholder:
        raise SystemExit(
            "Production build stopped: set SITE_URL to the final public HTTPS frontend URL in the build environment (Netlify) or backend/.env, then retry."
        )
    if placeholder:
        print("WARNING: SITE_URL is still a placeholder; this output is for local preview only.")

    project_root = Path(__file__).resolve().parents[1]
    output = project_root / "frontend" / "index.html"
    copytree(project_root / "frontend" / "static", Path(__file__).resolve().parent / "static", dirs_exist_ok=True)
    with app.test_request_context("/", base_url="http://localhost:5500"):
        html = app.jinja_env.get_template("index.html").render(site_url=SITE_URL, backend_mode=False)
    html = "\n".join(line.rstrip() for line in html.splitlines()) + "\n"
    output.write_text(html, encoding="utf-8")
    site = escape(SITE_URL.rstrip("/"))
    sitemap = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>{site}/</loc>
    <changefreq>monthly</changefreq>
    <image:image><image:loc>{site}/static/images/shaik-sameer-profile.webp</image:loc><image:title>Shaik Sameer profile portrait</image:title></image:image>
    <image:image><image:loc>{site}/static/images/shaik-sameer-college-event.webp</image:loc><image:title>Shaik Sameer speaking at a college event</image:title></image:image>
    <image:image><image:loc>{site}/static/images/shaik-sameer-casual-portrait.webp</image:loc><image:title>Shaik Sameer casual portrait</image:title></image:image>
  </url>
</urlset>
'''
    (output.parent / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (output.parent / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: {site}/sitemap.xml\n",
        encoding="utf-8",
    )
    print(f"Built {output}, sitemap.xml, and robots.txt for {SITE_URL}")


if __name__ == "__main__":
    main()
