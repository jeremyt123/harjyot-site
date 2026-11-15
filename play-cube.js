/* Rubik's Cube: real 27-cubie model. State lives in each cubie's position/orientation, so every
   turn is a true 90° layer rotation. "Solve" plays back the full move history in reverse, which is
   exact for any cube scrambled or turned inside this page. */
(function () {
  const CSS = `
  .cb{display:flex;height:100%;gap:18px;padding:18px;box-sizing:border-box;color:#f1e2cc;font-family:Inter,system-ui,sans-serif}
  .cb-view{position:relative;flex:1;min-width:0;border-radius:18px;overflow:hidden;
    background:radial-gradient(ellipse at 50% 85%,rgba(255,122,0,.22),transparent 60%),#050505;
    box-shadow:0 0 0 1px rgba(255,122,0,.25) inset}
  .cb-view canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab}
  .cb-hint{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:rgba(241,226,204,.45);pointer-events:none}
  .cb-win{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;
    font:italic 700 clamp(2.4rem,8vw,5rem) Georgia,serif;color:#ff9a1f;text-shadow:0 0 30px rgba(255,122,0,.8);animation:cbpop .6s ease-out}
  .cb-win small{font:600 .9rem Inter,sans-serif;letter-spacing:.18em;color:#f1e2cc;margin-top:8px;text-shadow:none}
  @keyframes cbpop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
  .cb-panel{width:250px;flex:none;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:12px;box-sizing:border-box;
    background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,122,0,.3)}
  .cb-stats{display:flex;gap:10px}
  .cb-stat{flex:1;background:rgba(0,0,0,.35);border-radius:12px;padding:10px;text-align:center}
  .cb-stat b{display:block;font:700 1.4rem "Orbitron",monospace;color:#ff9a1f}
  .cb-stat span{font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;opacity:.6}
  .cb-panel label{font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;opacity:.7}
  .cb-panel select{width:100%;margin-top:6px;padding:8px;border-radius:8px;border:1px solid rgba(255,122,0,.35);background:#111;color:#f1e2cc}
  .cb-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .cb-btn{padding:10px 0;border-radius:10px;border:1px solid rgba(255,122,0,.5);background:rgba(255,122,0,.12);color:#ffb460;
    font:700 .72rem Inter,sans-serif;letter-spacing:.14em;cursor:pointer;transition:.15s}
  .cb-btn:hover:not(:disabled){background:rgba(255,122,0,.3);color:#fff}
  .cb-btn:disabled{opacity:.35;cursor:default}
  .cb-hist{flex:1;min-height:60px;overflow:auto;background:rgba(0,0,0,.35);border-radius:10px;padding:8px;font:.75rem ui-monospace,monospace;color:#ffcf99;word-break:break-word}
  @media(max-width:760px){.cb{flex-direction:column;padding:10px}.cb-panel{width:auto}.cb-hist{max-height:60px;flex:none}}
  `;

  function mount(root) {
    const THREE = window.THREE;
    if (!THREE) { root.textContent = "3D library failed to load."; return; }
    const style = document.createElement("style"); style.textContent = CSS; root.appendChild(style);
    const wrap = document.createElement("div"); wrap.className = "cb";
    wrap.innerHTML = `
      <div class="cb-view"><canvas></canvas><div class="cb-hint">Drag the cube's stickers to turn a layer · drag the background to orbit · scroll / pinch to zoom</div></div>
      <aside class="cb-panel">
        <div class="cb-stats">
          <div class="cb-stat"><b id="cb-time">0:00.0</b><span>Timer</span></div>
          <div class="cb-stat"><b id="cb-moves">0</b><span>Moves</span></div>
        </div>
        <div><label>Scramble difficulty</label>
          <select id="cb-diff"><option value="8">Easy · 8 moves</option><option value="20" selected>Medium · 20 moves</option><option value="32">Hard · 32 moves</option></select></div>
        <div class="cb-btns">
          <button class="cb-btn" id="cb-scr">SCRAMBLE</button><button class="cb-btn" id="cb-sol">SOLVE</button>
          <button class="cb-btn" id="cb-res">RESET</button><button class="cb-btn" id="cb-und">UNDO</button>
        </div>
        <label>Move history</label><div class="cb-hist" id="cb-hist">—</div>
      </aside>`;
    root.appendChild(wrap);
    const view = wrap.querySelector(".cb-view"), canvas = wrap.querySelector("canvas");
    const $ = (id) => wrap.querySelector("#" + id);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(4, 8, 6); scene.add(key);
    const warm = new THREE.PointLight(0xff8a2a, 0.9, 40); warm.position.set(-6, -3, -5); scene.add(warm);

    // ── build the cube ──
    const cubeGroup = new THREE.Group(); scene.add(cubeGroup);
    const COL = { U: 0xffffff, D: 0xffd500, F: 0x0a9b48, B: 0x0a46ad, R: 0xc4122f, L: 0xff5a00 };
    const FACES = {
      U: { n: new THREE.Vector3(0, 1, 0), rot: [-Math.PI / 2, 0, 0] }, D: { n: new THREE.Vector3(0, -1, 0), rot: [Math.PI / 2, 0, 0] },
      R: { n: new THREE.Vector3(1, 0, 0), rot: [0, Math.PI / 2, 0] }, L: { n: new THREE.Vector3(-1, 0, 0), rot: [0, -Math.PI / 2, 0] },
      F: { n: new THREE.Vector3(0, 0, 1), rot: [0, 0, 0] }, B: { n: new THREE.Vector3(0, 0, -1), rot: [0, Math.PI, 0] },
    };
    const shape = new THREE.Shape(), w = 0.41, r = 0.1;
    shape.moveTo(-w + r, -w); shape.lineTo(w - r, -w); shape.quadraticCurveTo(w, -w, w, -w + r);
    shape.lineTo(w, w - r); shape.quadraticCurveTo(w, w, w - r, w); shape.lineTo(-w + r, w);
    shape.quadraticCurveTo(-w, w, -w, w - r); shape.lineTo(-w, -w + r); shape.quadraticCurveTo(-w, -w, -w + r, -w);
    const stickerGeo = new THREE.ShapeGeometry(shape, 6);
    const bodyGeo = new THREE.BoxGeometry(0.97, 0.97, 0.97);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.45, metalness: 0.1 });
    const stickerMats = {};
    for (const k in COL) stickerMats[k] = new THREE.MeshPhysicalMaterial({ color: COL[k], roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 });
    let cubies = [], pickables = [];

    function build() {
      cubies.forEach((c) => cubeGroup.remove(c));
      cubies = []; pickables = [];
      for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
        const c = new THREE.Group(); c.position.set(x, y, z);
        const body = new THREE.Mesh(bodyGeo, bodyMat); body.userData.cubie = c; c.add(body); pickables.push(body);
        c.userData.stickers = [];
        const add = (f) => {
          const m = new THREE.Mesh(stickerGeo, stickerMats[f]);
          m.rotation.set(...FACES[f].rot); m.position.copy(FACES[f].n).multiplyScalar(0.486);
          m.userData = { cubie: c, face: f, normal: FACES[f].n.clone() };
          c.add(m); c.userData.stickers.push(m); pickables.push(m);
        };
        if (y === 1) add("U"); if (y === -1) add("D"); if (x === 1) add("R"); if (x === -1) add("L");
        if (z === 1) add("F"); if (z === -1) add("B");
        cubeGroup.add(c); cubies.push(c);
      }
    }
    build();

    // ── move logic ──
    const AX = ["x", "y", "z"];
    function label(m) {
      const { axis, layer, dir } = m; let L, cw;
      if (axis === "y") { if (layer === 1) { L = "U"; cw = -1; } else if (layer === -1) { L = "D"; cw = 1; } else { L = "E"; cw = 1; } }
      if (axis === "x") { if (layer === 1) { L = "R"; cw = -1; } else if (layer === -1) { L = "L"; cw = 1; } else { L = "M"; cw = 1; } }
      if (axis === "z") { if (layer === 1) { L = "F"; cw = -1; } else if (layer === -1) { L = "B"; cw = 1; } else { L = "S"; cw = -1; } }
      return L + (dir === cw ? "" : "'");
    }
    const inv = (m) => ({ axis: m.axis, layer: m.layer, dir: -m.dir });
    const same = (a, b) => a.axis === b.axis && a.layer === b.layer && a.dir === b.dir;

    let full = [], user = [], queue = [], busy = false, scrambled = false, solving = false;
    let tStart = 0, tRun = false, tFinal = 0, moves = 0, won = false;

    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    function runQueue() {
      if (busy || !queue.length) return;
      const job = queue.shift(); busy = true;
      const { m } = job, dur = job.dur;
      const pivot = new THREE.Group(); cubeGroup.add(pivot);
      const layer = cubies.filter((c) => Math.round(c.position[m.axis]) === m.layer);
      layer.forEach((c) => pivot.attach(c));
      const t0 = performance.now(), target = m.dir * Math.PI / 2;
      (function step(now) {
        if (disposed) return;
        const p = Math.min(1, (now - t0) / dur);
        pivot.rotation[m.axis] = target * ease(p);
        if (p < 1) return requestAnimationFrame(step);
        pivot.rotation[m.axis] = target; pivot.updateMatrixWorld(true);
        layer.forEach((c) => {
          cubeGroup.attach(c);
          c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
          const mat = new THREE.Matrix4().makeRotationFromQuaternion(c.quaternion);
          for (const i of [0, 1, 2, 4, 5, 6, 8, 9, 10]) mat.elements[i] = Math.round(mat.elements[i]);
          c.quaternion.setFromRotationMatrix(mat);
        });
        cubeGroup.remove(pivot); busy = false;
        if (job.done) job.done();
        runQueue();
      })(t0);
    }
    function turn(m, { record = true, dur = 260, user: byUser = true, done } = {}) {
      queue.push({ m, dur, done: () => {
        if (record) { full.push(m); if (byUser) { user.push(m); moves++; if (scrambled && !tRun && !won) { tRun = true; tStart = performance.now(); } } }
        refresh();
        if (byUser && scrambled && !won && !solving && isSolved()) celebrate();
        if (done) done();
      } });
      runQueue();
    }
    function isSolved() {
      const seen = {};
      for (const c of cubies) for (const s of c.userData.stickers) {
        const n = s.userData.normal.clone().applyQuaternion(c.quaternion);
        const k = Math.round(n.x) + "," + Math.round(n.y) + "," + Math.round(n.z);
        if (seen[k] === undefined) seen[k] = s.userData.face; else if (seen[k] !== s.userData.face) return false;
      }
      return true;
    }
    function celebrate() {
      won = true; tRun = false; tFinal = performance.now() - tStart;
      const d = document.createElement("div"); d.className = "cb-win";
      d.innerHTML = `Solved!<small>${fmt(tFinal)} · ${moves} MOVES</small>`; view.appendChild(d);
      const t0 = performance.now();
      (function spin(now) { if (disposed) return; const p = Math.min(1, (now - t0) / 1400); cubeGroup.rotation.y = 2 * Math.PI * ease(p); if (p < 1) requestAnimationFrame(spin); else cubeGroup.rotation.y = 0; })(t0);
      setTimeout(() => d.remove(), 3500);
    }
    const fmt = (ms) => { const s = ms / 1000; return Math.floor(s / 60) + ":" + (s % 60).toFixed(1).padStart(4, "0"); };
    function refresh() {
      $("cb-moves").textContent = moves;
      $("cb-hist").textContent = user.length ? user.map(label).join(" ") : "—";
      $("cb-und").disabled = !user.length || busy || solving;
    }
    function lock(b) { ["cb-scr", "cb-sol", "cb-res", "cb-und"].forEach((id) => ($(id).disabled = b)); if (!b) refresh(); }

    $("cb-scr").onclick = () => {
      if (busy || solving) return;
      resetState(); scrambled = true;
      const n = parseInt($("cb-diff").value, 10); let last = null; const outer = [-1, 1];
      lock(true);
      for (let i = 0; i < n; i++) {
        let m; do { m = { axis: AX[Math.floor(Math.random() * 3)], layer: outer[Math.floor(Math.random() * 2)], dir: Math.random() < 0.5 ? -1 : 1 }; }
        while (last && last.axis === m.axis && last.layer === m.layer);
        last = m;
        turn(m, { user: false, dur: 90, done: i === n - 1 ? () => { lock(false); } : null });
      }
    };
    $("cb-sol").onclick = () => {
      if (busy || solving || !full.length) return;
      // reverse the whole history, cancelling moves that undo each other
      const stack = [];
      for (let i = full.length - 1; i >= 0; i--) {
        const m = inv(full[i]); const top = stack[stack.length - 1];
        if (top && top.axis === m.axis && top.layer === m.layer && top.dir === -m.dir) stack.pop();
        else { stack.push(m); const n = stack.length; if (n >= 3 && same(stack[n - 1], stack[n - 2]) && same(stack[n - 2], stack[n - 3])) { const x = stack[n - 1]; stack.length -= 3; stack.push(inv(x)); } }
      }
      solving = true; lock(true); tRun = false;
      if (!stack.length) { solving = false; resetState(); lock(false); return; }
      stack.forEach((m, i) => turn(m, { record: false, dur: 170, user: false, done: i === stack.length - 1 ? () => { solving = false; resetState(); lock(false); } : null }));
    };
    $("cb-res").onclick = () => { if (busy || solving) return; build(); resetState(); };
    $("cb-und").onclick = () => {
      if (busy || solving || !user.length) return;
      const m = user.pop(); full.pop(); moves = Math.max(0, moves - 1);
      turn(inv(m), { record: false, user: false, dur: 200 });
    };
    function resetState() { full = []; user = []; queue = []; moves = 0; scrambled = false; won = false; tRun = false; tFinal = 0; $("cb-time").textContent = "0:00.0"; refresh(); }
    refresh();

    // ── camera, picking, drag ──
    const sph = new THREE.Spherical(9.5, 1.05, 0.75);
    function placeCam() { sph.phi = Math.max(0.2, Math.min(Math.PI - 0.2, sph.phi)); sph.radius = Math.max(6, Math.min(18, sph.radius)); camera.position.setFromSpherical(sph); camera.lookAt(0, 0, 0); }
    placeCam();
    const ray = new THREE.Raycaster(), ptrs = new Map();
    let mode = null, start = null, hitInfo = null, pinch0 = 0;
    function ndc(e) { const r = canvas.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
    function toScreen(v) { const p = v.clone().project(camera), r = canvas.getBoundingClientRect(); return new THREE.Vector2((p.x + 1) / 2 * r.width, (1 - p.y) / 2 * r.height); }
    canvas.addEventListener("pointerdown", (e) => {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {} ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { mode = "pinch"; const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); return; }
      start = { x: e.clientX, y: e.clientY }; mode = "orbit"; hitInfo = null;
      if (busy || solving) return;
      ray.setFromCamera(ndc(e), camera);
      const h = ray.intersectObjects(pickables, false)[0];
      if (h) {
        const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
        const ax = ["x", "y", "z"].reduce((a, k) => (Math.abs(n[k]) > Math.abs(n[a]) ? k : a), "x");
        const nn = new THREE.Vector3(); nn[ax] = Math.sign(n[ax]);
        hitInfo = { n: nn, point: h.point.clone(), cubie: h.object.userData.cubie }; mode = "layer";
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      const prev = ptrs.get(e.pointerId); if (!prev) return;
      if (mode === "pinch" && ptrs.size === 2) {
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0) { sph.radius *= pinch0 / d; placeCam(); } pinch0 = d; return;
      }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (mode === "orbit") { sph.theta -= (e.clientX - prev.x) * 0.008; sph.phi -= (e.clientY - prev.y) * 0.008; placeCam(); }
      else if (mode === "layer" && Math.hypot(dx, dy) > 14) {
        const d = new THREE.Vector2(dx, dy).normalize(); const n = hitInfo.n; let best = null, bs = -2;
        for (const ax of AX) { if (Math.abs(n[ax]) === 1) continue; for (const s of [-1, 1]) {
          const t = new THREE.Vector3(); t[ax] = s;
          const sd = toScreen(hitInfo.point.clone().add(t.clone().multiplyScalar(0.5))).sub(toScreen(hitInfo.point)).normalize();
          const sc = sd.dot(d); if (sc > bs) { bs = sc; best = t; } } }
        const a = new THREE.Vector3().crossVectors(n, best);
        const axis = AX.find((k) => Math.abs(a[k]) === 1), dir = Math.sign(a[axis]);
        const layer = Math.round(hitInfo.cubie.position[axis]);
        mode = "done"; turn({ axis, layer, dir });
      }
    });
    const end = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2 && mode === "pinch") mode = null; if (!ptrs.size) { mode = null; start = null; } };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("wheel", (e) => { e.preventDefault(); sph.radius *= 1 + Math.sign(e.deltaY) * 0.08; placeCam(); }, { passive: false });

    // ── loop ──
    let disposed = false, raf = 0;
    function resize() { const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    const ro = new ResizeObserver(resize); ro.observe(view); resize();
    (function loop(now) {
      if (disposed) return; raf = requestAnimationFrame(loop);
      if (tRun) $("cb-time").textContent = fmt(now - tStart); else if (won) $("cb-time").textContent = fmt(tFinal);
      renderer.render(scene, camera);
    })(performance.now());

    if (/[?&]debug/.test(location.search)) window.__cb = { turn, inv, isSolved, full: () => full.slice() };
    mount.dispose = () => { disposed = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); };
  }

  PG.register("cube", { title: "Rubik's Cube", mount, unmount() { if (mount.dispose) mount.dispose(); } });
})();
