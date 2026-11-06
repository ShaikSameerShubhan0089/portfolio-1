from pathlib import Path
from shutil import copytree
from urllib.parse import urlsplit
from xml.sax.saxutils import escape
import argparse

from myapp import SITE_URL, app
from project_pages import ABOUT, PROJECTS


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
        about_html = app.jinja_env.get_template("about.html").render(site_url=SITE_URL, about=ABOUT)
        (project_root / "frontend" / "about" ).mkdir(parents=True, exist_ok=True)
        (project_root / "frontend" / "about" / "index.html").write_text(about_html, encoding="utf-8")
        for project in PROJECTS:
            project_dir = project_root / "frontend" / "projects" / project["slug"]
            project_dir.mkdir(parents=True, exist_ok=True)
            page = app.jinja_env.get_template("project_detail.html").render(site_url=SITE_URL, project=project)
            (project_dir / "index.html").write_text(page, encoding="utf-8")
    site = escape(SITE_URL.rstrip("/"))
    gallery_images = [
        ('sameer-profile.webp', 'Shaik Sameer profile portrait', 'Shaik Sameer smiling in a floral shirt'),
        ('sameer-portrait.webp', 'Shaik Sameer speaking at a college event', 'Shaik Sameer speaking into a microphone at a college event'),
        ('sameer-about.webp', 'Shaik Sameer casual portrait', 'Shaik Sameer smiling at a table in a red shirt'),
        ('shaik-sameer-seated-cream-suit-edit-1.jpg', 'Shaik Sameer seated in a cream suit, looking down', 'Seated portrait · Cream suit'),
        ('shaik-sameer-seated-cream-suit-edit-2.jpg', 'Shaik Sameer smiling while seated in a cream suit', 'Seated portrait · Cream suit'),
        ('shaik-sameer-courtyard-white-shirt-edited.jpg', 'Shaik Sameer standing in a white shirt in a courtyard', 'Portrait · Courtyard'),
        ('shaik-sameer-cafe-portrait-edited.jpg', 'Shaik Sameer smiling at an outdoor cafe', 'Portrait · Cafe'),
        ('shaik-sameer-event-coat-edited.jpg', 'Shaik Sameer wearing a light coat and scarf at an event', 'Portrait · Evening event'),
        ('shaik-sameer-courtyard-white-shirt-portrait.jpg', 'Shaik Sameer standing outdoors in a white shirt and dark trousers', 'Portrait · Outdoors'),
        ('shaik-sameer-courtyard-white-shirt-smiling.jpg', 'Shaik Sameer smiling in a white shirt in a courtyard', 'Portrait · Courtyard'),
        ('shaik-sameer-navy-shirt-portrait-edited.jpg', 'Shaik Sameer standing in a navy T-shirt and light trousers', 'Portrait · Navy T-shirt'),
        ('shaik-sameer-white-shirt-walking-edited.jpg', 'Shaik Sameer walking outdoors in a white shirt', 'Portrait · Walking outdoors'),
        ('shaik-sameer-traditional-attire-edited.jpg', 'Shaik Sameer seated in traditional attire at an event', 'Portrait · Traditional attire'),
        ('shaik-sameer-light-blazer-portrait-edited.jpg', 'Shaik Sameer wearing a light blazer outdoors', 'Portrait · Light blazer'),
        ('shaik-sameer-blue-shirt-portrait-edited.jpg', 'Shaik Sameer standing beside a doorway in a blue shirt', 'Portrait · Blue shirt'),
    ]
    image_entries = "\n".join(
        "    <image:image>"
        f"<image:loc>{site}/static/images/{escape(filename)}</image:loc>"
        f"<image:title>{escape(title)}</image:title>"
        f"<image:caption>{escape(caption)}</image:caption>"
        "</image:image>"
        for filename, title, caption in gallery_images
    )
    sitemap = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>{site}/</loc>
    <changefreq>monthly</changefreq>
{image_entries}
  </url>
  <url><loc>{site}/about/</loc></url>
{''.join(f'  <url><loc>{site}/projects/{escape(project["slug"])}/</loc></url>\n' for project in PROJECTS)}
</urlset>
'''
    (output.parent / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (output.parent / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: {site}/sitemap.xml\n",
        encoding="utf-8",
    )
    print(f"Built homepage, {len(PROJECTS)} project pages, about page, sitemap.xml, and robots.txt for {SITE_URL}")


if __name__ == "__main__":
    main()
