# Eyescord website

Static site, no build step. Open `index.html` directly, or serve the folder:

    python -m http.server 5173 --bind 127.0.0.1

Pages: `index.html` (home + live demo + FAQ), `plugins.html` (searchable catalog), `download.html`.

## After a new Eyescord release

    python tools/build-data.py

Reads `..\Eyescord` (version, `plugins.json`, `release\installer\EYESCORD-Installer.exe`), copies the
installer to `downloads\`, and rewrites `assets\data\site-data.js` with the plugin list, size and SHA-256.
Every number on the site comes from that file. Pass another source path as the first argument if the
repo moves.

`tools/shots.py` re-renders `assets/img/og.png` (link preview) and saves check screenshots.

## Deploying

Upload the whole folder to any static host. The installer is 53 MB: fine for GitHub Pages or your own
server, too big for Cloudflare Pages (25 MB per file). To serve it from somewhere else, put the full URL
in the `"file"` field of `site-data.js`.

`og:image` needs an absolute URL to show in Discord/Twitter previews: replace `assets/img/og.png` in the
three HTML heads with `https://<your-domain>/assets/img/og.png` once the domain is known.
