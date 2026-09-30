// Plugin catalog: search, source filter and category chips, all mirrored in the URL.
(function () {
  "use strict";

  const data = window.EYESCORD;
  const grid = document.querySelector("[data-grid]");
  if (!data || !grid) return;

  const input = document.querySelector("[data-q]");
  const countEl = document.querySelector("[data-count]");
  const tagBox = document.querySelector("[data-tags]");
  const empty = document.querySelector("[data-empty]");
  const emptyTitle = document.querySelector("[data-empty-title]");
  const sourceButtons = Array.from(document.querySelectorAll("[data-source]"));

  const spell = (t) => t.replace("Customisation", "Customization").replace("Organisation", "Organization");
  const plugins = data.plugins.map((p) => ({
    ...p,
    tagsShown: p.tags.map(spell),
    hay: `${p.name} ${p.description} ${p.tags.map(spell).join(" ")}`.toLowerCase(),
  }));

  // ---------- state ----------
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get("q") || "",
    source: ["eyescord", "upstream"].includes(params.get("source")) ? params.get("source") : "all",
    tag: params.get("tag") || "",
  };

  // ---------- render cards once ----------
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function highlight(text, q) {
    if (!q) return esc(text);
    const lower = text.toLowerCase();
    let out = "";
    let i = 0;
    for (;;) {
      const j = lower.indexOf(q, i);
      if (j === -1) break;
      out += esc(text.slice(i, j)) + "<mark>" + esc(text.slice(j, j + q.length)) + "</mark>";
      i = j + q.length;
    }
    return out + esc(text.slice(i));
  }

  const cards = plugins.map((p) => {
    const card = document.createElement("article");
    card.className = "pcard";
    const badges = [];
    if (p.exclusive) badges.push(`<span class="badge badge-solid">Eyescord</span>`);
    if (p.required) badges.push(`<span class="badge">Always on</span>`);
    else if (p.enabledByDefault) badges.push(`<span class="badge">On by default</span>`);
    if (p.commands) badges.push(`<span class="badge">Slash commands</span>`);
    p.tagsShown.forEach((t) => badges.push(`<span class="badge">${esc(t)}</span>`));
    card.innerHTML =
      `<div class="pcard-top"><h3></h3></div>` +
      `<p></p>` +
      (badges.length ? `<div class="pcard-meta">${badges.join("")}</div>` : "");
    return { p, card, h3: card.querySelector("h3"), desc: card.querySelector("p") };
  });

  const frag = document.createDocumentFragment();
  cards.forEach((c) => frag.append(c.card));
  grid.append(frag);

  // ---------- tag chips ----------
  const tagCounts = new Map();
  plugins.forEach((p) => p.tagsShown.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));
  const tags = [...tagCounts.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);
  if (state.tag) state.tag = spell(state.tag);
  if (state.tag && !tagCounts.has(state.tag)) state.tag = "";

  function chip(label, value, n) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.tag = value;
    b.append(label);
    if (n != null) {
      const s = document.createElement("span");
      s.textContent = n;
      b.append(" ", s);
    }
    return b;
  }
  tagBox.append(chip("Any category", ""));
  tags.forEach(([t, n]) => tagBox.append(chip(t, t, n)));

  // ---------- filtering ----------
  let lastQ = null;

  function apply(pushUrl) {
    const q = state.q.trim().toLowerCase();
    let shown = 0;

    for (const c of cards) {
      const p = c.p;
      const ok =
        (state.source === "all" || (state.source === "eyescord") === p.exclusive) &&
        (!state.tag || p.tagsShown.includes(state.tag)) &&
        (!q || p.hay.includes(q));
      c.card.hidden = !ok;
      if (ok) shown++;
      if (q !== lastQ) {
        c.h3.innerHTML = highlight(p.name, q);
        c.desc.innerHTML = highlight(p.description, q);
      }
    }
    lastQ = q;

    const total = plugins.length;
    countEl.textContent = shown === total ? `${total} plugins` : `${shown} of ${total} plugins`;

    empty.hidden = shown !== 0;
    if (shown === 0) {
      emptyTitle.textContent = state.q ? `No plugins match “${state.q.trim()}”.` : "No plugins in this combination.";
    }

    sourceButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.source === state.source)));
    tagBox.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tag === state.tag)));

    if (pushUrl) {
      const u = new URLSearchParams();
      if (state.q.trim()) u.set("q", state.q.trim());
      if (state.source !== "all") u.set("source", state.source);
      if (state.tag) u.set("tag", state.tag);
      const qs = u.toString();
      history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
    }
  }

  input.value = state.q;
  input.addEventListener("input", () => { state.q = input.value; apply(true); });

  sourceButtons.forEach((b) => b.addEventListener("click", () => { state.source = b.dataset.source; apply(true); }));

  tagBox.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    state.tag = state.tag === b.dataset.tag ? "" : b.dataset.tag;
    apply(true);
  });

  document.querySelector("[data-clear]").addEventListener("click", () => {
    state.q = ""; state.source = "all"; state.tag = "";
    input.value = "";
    apply(true);
    input.focus();
  });

  // "/" jumps to search, Escape clears it.
  document.addEventListener("keydown", (e) => {
    const typing = /^(input|textarea|select)$/i.test(document.activeElement.tagName);
    if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === "Escape" && document.activeElement === input && input.value) {
      input.value = ""; state.q = ""; apply(true);
    }
  });

  apply(false);
})();
