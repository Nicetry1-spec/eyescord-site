// Shared behaviour for every page: data binding, download links, OS notice, nav, switches, copy.
(function () {
  "use strict";

  const data = window.EYESCORD || null;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const fmtSize = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`;

  // ---------- data binding ----------
  if (data) {
    const plugins = data.plugins || [];
    const values = {
      version: data.version,
      "version-tag": `v${data.version}`,
      count: String(plugins.length),
      exclusive: String(plugins.filter((p) => p.exclusive).length),
      size: data.installer ? fmtSize(data.installer.bytes) : "",
      "installer-version": data.installer ? data.installer.version : "",
      sha256: data.installer ? data.installer.sha256 : "",
      file: data.installer ? data.installer.file.split("/").pop() : "",
    };
    $$("[data-bind]").forEach((el) => {
      const v = values[el.dataset.bind];
      if (v) el.textContent = v;
    });
    $$("[data-bind-href]").forEach((el) => {
      const v = data[el.dataset.bindHref];
      if (v) el.href = v;
    });

    // Every [data-download] link points straight at the installer.
    // Without a built installer they fall back to the download page.
    if (data.installer) {
      $$("[data-download]").forEach((el) => {
        el.href = data.installer.file;
        el.setAttribute("download", data.installer.file.split("/").pop());
      });
    } else {
      $$("[data-dl-button]").forEach((el) => {
        el.setAttribute("aria-disabled", "true");
        el.textContent = "Installer not published yet";
      });
    }
  }

  // ---------- OS notice ----------
  const platform = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || "").toLowerCase();
  const os =
    /win/.test(platform) ? "Windows" :
    /mac|iphone|ipad/.test(platform) ? (/(iphone|ipad)/.test(navigator.userAgent.toLowerCase()) ? "iOS" : "macOS") :
    /android/.test(navigator.userAgent.toLowerCase()) ? "Android" :
    /linux|x11/.test(platform) ? "Linux" : "";
  if (os && os !== "Windows") {
    $$("[data-os-note]").forEach((el) => {
      el.textContent = `You're on ${os}. The Eyescord installer runs on Windows only, so download it on your PC.`;
      el.hidden = false;
    });
  }

  // ---------- nav ----------
  const nav = $("[data-nav]");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const toggle = $("[data-nav-toggle]", nav);
    if (toggle) {
      const setOpen = (open) => {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
      };
      toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
      $$(".nav-links a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    }

    // mark the current page
    const here = location.pathname.split("/").pop() || "index.html";
    $$(".nav-links a", nav).forEach((a) => {
      if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
    });
  }

  // ---------- switches ----------
  document.addEventListener("click", (e) => {
    const sw = e.target.closest(".switch[role='switch']");
    if (!sw || sw.getAttribute("aria-disabled") === "true") return;
    sw.setAttribute("aria-checked", String(sw.getAttribute("aria-checked") !== "true"));
  });

  // ---------- tag chips on the landing page ----------
  const chipBox = $("[data-tag-chips]");
  if (chipBox && data) {
    const counts = new Map();
    data.plugins.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    const top = [...counts.entries()].filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]);
    const frag = document.createDocumentFragment();
    top.forEach(([tag, n]) => {
      const a = document.createElement("a");
      a.className = "chip";
      a.href = `plugins.html?tag=${encodeURIComponent(tag)}`;
      a.append(tag.replace("Customisation", "Customization").replace("Organisation", "Organization"), " ");
      const span = document.createElement("span");
      span.textContent = n;
      a.append(span);
      frag.append(a);
    });
    chipBox.prepend(frag);
  }

  // ---------- toast + copy ----------
  const toastEl = $("[data-toast]");
  let toastTimer;
  window.eyescordToast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 1800);
  };

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const src = document.getElementById(btn.dataset.copy);
    if (!src) return;
    try {
      await navigator.clipboard.writeText(src.textContent.trim());
      window.eyescordToast(btn.dataset.copied || "Copied");
    } catch {
      const range = document.createRange();
      range.selectNodeContents(src);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      window.eyescordToast("Selected. Press Ctrl+C to copy");
    }
  });
})();
