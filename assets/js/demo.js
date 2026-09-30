// The hero demo: one chat played out twice, once as stock Discord and once through Eyescord.
(function () {
  "use strict";

  const root = document.querySelector("[data-demo]");
  if (!root) return;

  const win = root.querySelector("[data-window]");
  const list = root.querySelector("[data-msgs]");
  const typing = root.querySelector("[data-typing]");
  const caption = root.querySelector("[data-caption]");
  const replay = root.querySelector("[data-replay]");
  const modeButtons = Array.from(root.querySelectorAll("[data-mode]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const people = {
    maya: { initial: "M", tone: "v3" },
    dan: { initial: "D", tone: "v2" },
    noam: { initial: "N", tone: "" },
  };

  // Times are milliseconds from the start of the scene.
  const scene = [
    { at: 200, add: { id: "m1", who: "maya", time: "9:41 PM", text: "need a 5th for ranked tonight" } },
    { at: 1200, typing: "dan" },
    { at: 1900, add: { id: "m2", who: "dan", time: "9:41 PM", text: "me. 9pm" } },
    { at: 2700, typing: "noam" },
    { at: 3600, add: { id: "m3", who: "noam", time: "9:42 PM", text: "ok confession, i'm hardstuck silver" } },
    { at: 4700, edit: { id: "m2", text: "me. 10pm, dinner first" } },
    { at: 6000, del: "m3" },
    { at: 6900, typing: "maya" },
    { at: 7900, add: { id: "m4", who: "maya", time: "9:42 PM", text: "noam we all saw that" } },
  ];

  let mode = "eyes";
  let timers = [];
  let seen = { edit: false, del: false };

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildMessage({ id, who, time, text }, animate) {
    const p = people[who];
    const msg = el("div", "msg" + (animate ? " is-new" : ""));
    msg.dataset.id = id;
    msg.append(el("span", `av ${p.tone}`.trim(), p.initial));
    const head = el("div", "who");
    head.append(el("strong", "", who), el("time", "", `Today at ${time}`));
    msg.append(head, el("div", "before"), el("div", "text", text));
    return msg;
  }

  function apply(step, animate) {
    if (step.typing) {
      typing.textContent = `${step.typing} is typing…`;
      typing.hidden = false;
      return;
    }
    typing.hidden = true;

    if (step.add) {
      list.append(buildMessage(step.add, animate));
    } else if (step.edit) {
      const msg = list.querySelector(`[data-id="${step.edit.id}"]`);
      const text = msg.querySelector(".text");
      const old = el("s", "", text.textContent);
      msg.querySelector(".before").replaceChildren(old);
      text.textContent = step.edit.text;
      text.append(el("span", "edited", "(edited)"));
      msg.classList.add("was-edited");
      seen.edit = true;
    } else if (step.del) {
      const msg = list.querySelector(`[data-id="${step.del}"]`);
      msg.classList.remove("is-new");
      msg.classList.add("is-deleted");
      msg.querySelector(".text").append(el("span", "flag", "deleted"));
      seen.del = true;
    }
    renderCaption();
  }

  function renderCaption() {
    const eyes = mode === "eyes";
    let html;
    if (eyes) {
      const parts = [];
      if (seen.del) parts.push("noam's deleted message");
      if (seen.edit) parts.push("what dan's edit replaced");
      parts.push("that #mod-chat exists, even though you can't open it");
      html = `<strong>With Eyescord</strong> you still see ${joinList(parts)}.`;
    } else {
      const parts = [];
      if (seen.del) parts.push("removes noam's message");
      if (seen.edit) parts.push("hides what dan changed");
      parts.push("doesn't list #mod-chat at all");
      html = `<strong>Stock Discord</strong> ${joinList(parts)}.`;
    }
    caption.innerHTML = html;
  }

  function joinList(items) {
    if (items.length === 1) return items[0];
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
  }

  function setMode(next) {
    mode = next;
    win.classList.toggle("eyes", mode === "eyes");
    modeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    renderCaption();
  }

  function play() {
    timers.forEach(clearTimeout);
    timers = [];
    list.replaceChildren();
    typing.hidden = true;
    seen = { edit: false, del: false };
    replay.hidden = true;
    renderCaption();

    if (reduceMotion) {
      scene.forEach((s) => apply(s, false));
      typing.hidden = true;
      replay.hidden = false;
      return;
    }
    scene.forEach((s) => timers.push(setTimeout(() => apply(s, true), s.at)));
    timers.push(setTimeout(() => { typing.hidden = true; replay.hidden = false; }, scene[scene.length - 1].at + 600));
  }

  modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  replay.addEventListener("click", play);

  // Start when the window is actually on screen (it sits below the fold on phones).
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        play();
      }
    }, { threshold: 0.35 });
    io.observe(win);
  } else {
    play();
  }
})();
