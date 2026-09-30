"""Render the link-preview image and take check screenshots with headless Chromium.

    python -m http.server 5173 --bind 127.0.0.1   (from the site folder, in another terminal)
    python tools/shots.py [out_dir]
"""

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

SITE = Path(__file__).resolve().parent.parent
BASE = "http://127.0.0.1:5173"
out = Path(sys.argv[1]) if len(sys.argv) > 1 else SITE / "tools" / "shots"
out.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()

    og = browser.new_page(viewport={"width": 1200, "height": 630})
    og.goto(f"{BASE}/tools/og.html", wait_until="networkidle")
    og.screenshot(path=str(SITE / "assets" / "img" / "og.png"))

    for name, w, h in [("mobile", 390, 844), ("desktop", 1440, 900)]:
        page = browser.new_page(viewport={"width": w, "height": h})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/index.html", wait_until="networkidle")
        page.locator("[data-window]").scroll_into_view_if_needed()
        page.wait_for_timeout(9500)
        page.locator("[data-demo]").screenshot(path=str(out / f"demo-eyes-{name}.png"))
        page.click("[data-mode=stock]")
        page.wait_for_timeout(600)
        page.locator("[data-demo]").screenshot(path=str(out / f"demo-stock-{name}.png"))
        overflow = page.evaluate("document.documentElement.scrollWidth > innerWidth")
        for path in ["plugins.html?q=voice", "download.html"]:
            page.goto(f"{BASE}/{path}", wait_until="networkidle")
            page.screenshot(path=str(out / f"{path.split('.')[0]}-{name}.png"))
            overflow = overflow or page.evaluate("document.documentElement.scrollWidth > innerWidth")
        print(name, "horizontal overflow:", overflow, "js errors:", errors or "none")

    browser.close()
