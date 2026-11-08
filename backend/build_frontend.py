from pathlib import Path
from shutil import copytree
from urllib.parse import urlsplit
from xml.sax.saxutils import escape
import argparse

from myapp import SITE_URL, app
from project_pages import ABOUT, PROJECTS
from photos import PHOTOS

IMAGE_REDIRECTS = {
    "sameer-profile.webp": "shaik-sameer-profile.webp",
    "sameer-portrait.webp": "shaik-sameer-college-event-speaking.webp",
    "sameer-about.webp": "shaik-sameer-casual-portrait.webp",
    "shaik-sameer-seated-cream-suit-edit-1.jpg": "shaik-sameer-cream-suit-seated-portrait-1.jpg",
    "shaik-sameer-seated-cream-suit-edit-2.jpg": "shaik-sameer-cream-suit-smiling-portrait.jpg",
    "shaik-sameer-courtyard-white-shirt-edited.jpg": "shaik-sameer-white-shirt-courtyard-portrait.jpg",
    "shaik-sameer-cafe-portrait-edited.jpg": "shaik-sameer-outdoor-cafe-portrait.jpg",
    "shaik-sameer-event-coat-edited.jpg": "shaik-sameer-event-coat-scarf-portrait.jpg",
    "shaik-sameer-courtyard-white-shirt-portrait.jpg": "shaik-sameer-courtyard-standing-portrait.jpg",
    "shaik-sameer-courtyard-white-shirt-smiling.jpg": "shaik-sameer-courtyard-smiling-portrait.jpg",
    "shaik-sameer-navy-shirt-portrait-edited.jpg": "shaik-sameer-navy-shirt-standing-portrait.jpg",
    "shaik-sameer-white-shirt-walking-edited.jpg": "shaik-sameer-white-shirt-walking-portrait.jpg",
    "shaik-sameer-traditional-attire-edited.jpg": "shaik-sameer-traditional-attire-event-portrait.jpg",
    "shaik-sameer-light-blazer-portrait-edited.jpg": "shaik-sameer-light-blazer-outdoor-portrait.jpg",
    "shaik-sameer-blue-shirt-portrait-edited.jpg": "shaik-sameer-blue-shirt-standing-portrait.jpg",
    # This older duplicate filename was also published and should resolve to the renamed event photo.
    "shaik-sameer-college-event.webp": "shaik-sameer-college-event-speaking.webp",
}


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
    with app.test_request_context("/", base_url="http://localhost:5500"):
        about_html = app.jinja_env.get_template("about.html").render(site_url=SITE_URL, about=ABOUT, projects=PROJECTS)
        (project_root / "frontend" / "about" ).mkdir(parents=True, exist_ok=True)
        (project_root / "frontend" / "about" / "index.html").write_text(about_html, encoding="utf-8")
        photos_html = app.jinja_env.get_template("photos.html").render(site_url=SITE_URL, photos=PHOTOS)
        photos_dir = project_root / "frontend" / "photos"
        photos_dir.mkdir(parents=True, exist_ok=True)
        (photos_dir / "index.html").write_text(photos_html, encoding="utf-8")
        for project in PROJECTS:
            project_dir = project_root / "frontend" / "projects" / project["slug"]
            project_dir.mkdir(parents=True, exist_ok=True)
            page = app.jinja_env.get_template("project_detail.html").render(site_url=SITE_URL, project=project)
            (project_dir / "index.html").write_text(page, encoding="utf-8")
    site = escape(SITE_URL.rstrip("/"))
    def image_entries(photos):
        return "\n".join(
            "    <image:image>"
            f"<image:loc>{site}/static/images/{escape(photo['filename'])}</image:loc>"
            f"<image:title>{escape(photo['title'])}</image:title>"
            f"<image:caption>{escape(photo['sitemap_caption'])}</image:caption>"
            "</image:image>"
            for photo in photos
        )

    profile_photo = next(photo for photo in PHOTOS if photo["filename"] == "shaik-sameer-profile.webp")
    sitemap = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>{site}/</loc>
    <changefreq>monthly</changefreq>
{image_entries(PHOTOS)}
  </url>
  <url>
    <loc>{site}/about/</loc>
{image_entries([profile_photo])}
  </url>
  <url>
    <loc>{site}/photos/</loc>
{image_entries(PHOTOS)}
  </url>
{''.join(f'  <url><loc>{site}/projects/{escape(project["slug"])}/</loc></url>\n' for project in PROJECTS)}
</urlset>
'''
    (output.parent / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (output.parent / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: {site}/sitemap.xml\n",
        encoding="utf-8",
    )
    redirects = "\n".join(
        f"/static/images/{old} /static/images/{new} 301"
        for old, new in IMAGE_REDIRECTS.items()
    ) + "\n"
    (output.parent / "_redirects").write_text(redirects, encoding="utf-8")
    print(f"Built homepage, {len(PROJECTS)} project pages, about page, photo gallery, sitemap.xml, and robots.txt for {SITE_URL}")


if __name__ == "__main__":
    main()
