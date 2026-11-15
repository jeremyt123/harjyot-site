/* Playground hub: glass picker menu + full-screen overlay that lazy-loads each experience */
(function () {
  const overlay = document.getElementById("pg-overlay");
  if (!overlay) return;
  const stage = document.getElementById("pg-stage");
  const titleEl = document.getElementById("pg-title");
  const loader = document.getElementById("pg-loader");
  const registry = {};
  const loaded = {};
  let current = null;

  const PG = (window.PG = {
    register(name, exp) { registry[name] = exp; },
    open, close,
  });

  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
    return loaded[src];
  }

  // The jelly slice and slot machines already live in the page (hidden in #fun-home). Opening them moves
  // the real elements into the full-screen view so all their existing code keeps working, then moves them back.
  function movedExp(title, selector, onMount) {
    return {
      title,
      mount(stageEl) {
        const el = document.querySelector(selector); if (!el) return;
        stageEl.style.overflow = "auto"; stageEl.appendChild(el);
        if (onMount) onMount();
        requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      },
      unmount() {
        const el = document.querySelector(selector), home = document.getElementById("fun-home");
        if (el && home) home.appendChild(el); stage.style.overflow = "";
      },
    };
  }
  registry.jelly = movedExp("Citrus Jelly", "#jelly", () => window.initJelly && window.initJelly());
  // Three.js (~600 KB) is only downloaded when someone opens the cube or the jelly, not on every page load
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const NEEDS_THREE = { cube: 1, jelly: 1 };
  registry.arcade = movedExp("The Arcade", "#slot-machine-wrap");

  const FILES = {
    jelly: [], arcade: [],
    cube: ["play-cube.js?v=1"],
    nes: ["play-platformer.js?v=1"],
    vista: ["play-vista.js?v=2", "play-vista-apps.js?v=2", "play-vista-games.js?v=2"],
  };

  async function open(name) {
    if (current) close();
    overlay.hidden = false;
    document.documentElement.classList.add("pg-open");
    try { if (typeof lenis !== "undefined" && lenis) lenis.stop(); } catch (e) {}
    loader.hidden = false;
    loader.textContent = "Loading…";
    stage.innerHTML = "";
    try {
      if (NEEDS_THREE[name]) await loadScript(THREE_URL);
      for (const f of FILES[name]) await loadScript(f); // order matters (vista then apps)
      const exp = registry[name];
      if (!exp) throw new Error("Experience not registered");
      titleEl.textContent = exp.title;
      loader.hidden = true;
      current = exp;
      exp.mount(stage);
    } catch (err) {
      loader.hidden = false;
      loader.textContent = "Couldn't load this one: " + err.message;
    }
  }

  function close() {
    if (current && current.unmount) { try { current.unmount(); } catch (e) {} }
    current = null;
    stage.innerHTML = "";
    overlay.hidden = true;
    document.documentElement.classList.remove("pg-open");
    try { if (typeof lenis !== "undefined" && lenis) lenis.start(); } catch (e) {}
  }

  document.getElementById("pg-back").addEventListener("click", close);
  document.querySelectorAll("[data-exp]").forEach((card) =>
    card.addEventListener("click", () => open(card.dataset.exp)));
  document.querySelectorAll("[data-goto]").forEach((card) =>
    card.addEventListener("click", () => {
      const el = document.querySelector(card.dataset.goto);
      if (!el) return;
      if (typeof lenis !== "undefined" && lenis) lenis.scrollTo(el, { offset: -70 });
      else el.scrollIntoView({ behavior: "smooth" });
    }));
  // glass: a soft light that follows the cursor across glass cards
  const spots = document.querySelectorAll(".pg-card, .contact-card, .gd-blurb, .stat-item, .hero-box, .ob-banner");
  spots.forEach((el) => {
    el.classList.add("glass-spot");
    el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); el.style.setProperty("--mx", e.clientX - r.left + "px"); el.style.setProperty("--my", e.clientY - r.top + "px"); });
  });
  // deep link: #play-cube etc.
  const hash = (location.hash || "").replace("#play-", "");
  if (FILES[hash]) setTimeout(() => open(hash), 300);
})();
