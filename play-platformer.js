/* Pixel Quest: an original NES-style platformer. 256x240 canvas, 16px tiles, fixed 60 Hz physics.
   No Nintendo sprites/levels/music: everything is drawn from rectangles and synthesized with WebAudio. */
(function () {
  const W = 256, H = 240, T = 16, ROWS = 15;
  const CSS = `
  .pq{position:absolute;inset:0;background:#000;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none}
  .pq canvas{image-rendering:pixelated;image-rendering:crisp-edges;background:#000;touch-action:none;max-width:100%;max-height:100%;box-shadow:0 0 60px rgba(255,122,0,.25)}
  .pq-touch{position:absolute;left:0;right:0;bottom:0;height:130px;display:none;pointer-events:none}
  .pq.touch .pq-touch{display:block}
  .pq-touch button{position:absolute;pointer-events:auto;border-radius:50%;border:2px solid rgba(255,255,255,.5);background:rgba(255,255,255,.16);color:#fff;font:700 18px monospace;touch-action:none}
  `;

  // ── pixel font (3x5) ──
  const GL = { "0": "111,101,101,101,111", "1": "010,110,010,010,111", "2": "111,001,111,100,111", "3": "111,001,111,001,111", "4": "101,101,111,001,001",
    "5": "111,100,111,001,111", "6": "111,100,111,101,111", "7": "111,001,001,001,001", "8": "111,101,111,101,111", "9": "111,101,111,001,111",
    A: "010,101,111,101,101", B: "110,101,110,101,110", C: "011,100,100,100,011", D: "110,101,101,101,110", E: "111,100,110,100,111", F: "111,100,110,100,100",
    G: "011,100,101,101,011", H: "101,101,111,101,101", I: "111,010,010,010,111", J: "001,001,001,101,010", K: "101,101,110,101,101", L: "100,100,100,100,111",
    M: "101,111,111,101,101", N: "111,101,101,101,101", O: "010,101,101,101,010", P: "111,101,111,100,100", Q: "010,101,101,111,011", R: "110,101,110,101,101",
    S: "011,100,010,001,110", T: "111,010,010,010,010", U: "101,101,101,101,111", V: "101,101,101,101,010", W: "101,101,111,111,101", X: "101,101,010,101,101",
    Y: "101,101,010,010,010", Z: "111,001,010,100,111", "-": "000,000,111,000,000", ":": "000,010,000,010,000", "!": "010,010,010,000,010", ".": "000,000,000,000,010",
    "?": "111,001,010,000,010", ">": "100,010,001,010,100", "+": "000,010,111,010,000", "/": "001,001,010,100,100", "'": "010,010,000,000,000", ",": "000,000,000,010,100" };
  const FONT = {};
  for (const k in GL) FONT[k] = GL[k].split(",").map((r) => r.split("").map((c) => c === "1"));

  function mount(root) {
    const style = document.createElement("style"); style.textContent = CSS; root.appendChild(style);
    const box = document.createElement("div"); box.className = "pq"; root.appendChild(box);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; box.appendChild(cv);
    const ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;
    function fit() { const r = box.getBoundingClientRect(); const s = Math.max(1, Math.min(r.width / W, r.height / H)); cv.style.width = W * s + "px"; cv.style.height = H * s + "px"; }
    const ro = new ResizeObserver(fit); ro.observe(box); fit();

    // ── audio ──
    let ac = null, muted = false, musicTimer = null, step = 0, musicOn = false;
    try { muted = localStorage.getItem("pq_muted") === "1"; } catch (e) {}
    function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === "suspended") ac.resume(); return ac; }
    function tone(f, d, type = "square", vol = 0.06, f2 = null, delay = 0) {
      if (muted || !audio()) return;
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + delay;
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
    }
    const hz = (n) => 261.63 * Math.pow(2, n / 12);
    const SFX = {
      jump: () => tone(330, 0.16, "square", 0.05, 760), coin: () => { tone(988, 0.07); tone(1319, 0.25, "square", 0.05, null, 0.07); },
      stomp: () => tone(220, 0.12, "square", 0.07, 80), bump: () => tone(110, 0.08, "square", 0.06),
      power: () => [0, 4, 7, 12, 16, 19].forEach((n, i) => tone(hz(n + 12), 0.09, "square", 0.05, null, i * 0.06)),
      life: () => [7, 11, 14, 19, 23].forEach((n, i) => tone(hz(n + 12), 0.1, "square", 0.05, null, i * 0.07)),
      die: () => [12, 11, 7, 4, 0, -5].forEach((n, i) => tone(hz(n), 0.16, "square", 0.06, null, i * 0.13)),
      clear: () => [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((n, i) => tone(hz(n + 12), 0.13, "square", 0.05, null, i * 0.1)),
      over: () => [7, 4, 0, -5].forEach((n, i) => tone(hz(n), 0.3, "triangle", 0.08, null, i * 0.28)),
      select: () => tone(660, 0.06), brick: () => tone(150, 0.12, "sawtooth", 0.05, 60),
    };
    const MUS = [
      { bpm: 150, lead: [0, 4, 7, 12, 7, 4, 7, null, 2, 5, 9, 14, 9, 5, 9, null, 4, 7, 11, 16, 11, 7, 11, null, 5, 9, 12, 9, 7, 5, 4, null], bass: [-24, -24, -17, -17, -22, -22, -15, -15, -20, -20, -13, -13, -19, -19, -12, -12] },
      { bpm: 135, lead: [0, null, 3, 7, 10, 7, 3, null, -2, null, 2, 5, 9, 5, 2, null, -4, null, 0, 3, 7, 3, 0, null, -5, -2, 2, 7, 5, 2, -2, null], bass: [-24, -24, -21, -21, -26, -26, -23, -23, -28, -28, -25, -25, -29, -29, -24, -24] },
      { bpm: 170, lead: [0, 0, 12, 0, 0, 10, 0, 0, 7, 7, 19, 7, 7, 17, 7, 7, 5, 5, 17, 5, 5, 15, 5, 5, 3, 7, 12, 15, 12, 7, 3, null], bass: [-24, -12, -24, -12, -19, -7, -19, -7, -17, -5, -17, -5, -21, -9, -21, -9] },
    ];
    function startMusic(i) {
      stopMusic(); if (muted) return; musicOn = true; step = 0;
      const m = MUS[i % MUS.length], ms = 60000 / m.bpm / 2;
      musicTimer = setInterval(() => {
        const n = m.lead[step % m.lead.length]; if (n !== null) tone(hz(n + 12), ms / 1000 * 0.9, "square", 0.025);
        if (step % 2 === 0) tone(hz(m.bass[(step / 2) % m.bass.length] + 12), ms / 1000 * 1.8, "triangle", 0.05);
        step++;
      }, ms);
    }
    function stopMusic() { musicOn = false; clearInterval(musicTimer); musicTimer = null; }

    // ── helpers ──
    const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    function text(s, x, y, c = "#fff", sc = 1, align = "left") {
      s = String(s).toUpperCase(); const wid = s.length * 4 * sc - sc; if (align === "center") x -= wid / 2; else if (align === "right") x -= wid;
      ctx.fillStyle = c;
      for (let i = 0; i < s.length; i++) { const g = FONT[s[i]]; if (!g) continue; for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (g[r][q]) ctx.fillRect(Math.round(x + (i * 4 + q) * sc), Math.round(y + r * sc), sc, sc); }
    }

    // ── levels ──
    function makeLevel(n) {
      const w = [112, 140, 170][n], g = [];
      for (let y = 0; y < ROWS; y++) g.push(new Array(w).fill("."));
      const ents = { enemies: [], plats: [] };
      const put = (x, y, c) => { if (x >= 0 && x < w && y >= 0 && y < ROWS) g[y][x] = c; };
      const ground = (a, b) => { for (let x = a; x <= b; x++) { put(x, 13, "#"); put(x, 14, "#"); } };
      const pipe = (x, h) => { for (let i = 0; i < h; i++) { const y = 13 - h + i; put(x, y, i === 0 ? "[" : "("); put(x + 1, y, i === 0 ? "]" : ")"); } };
      const stairs = (x, h) => { for (let i = 0; i < h; i++) for (let j = 0; j <= i; j++) put(x + i, 12 - j, "="); };
      const coins = (x, y, c) => { for (let i = 0; i < c; i++) put(x + i, y, "c"); };
      const enemy = (x, type = 0) => ents.enemies.push({ x: x * T, y: 13 * T - 12, w: 12, h: 12, vx: type ? -0.9 : -0.5, type, dead: 0, vy: 0, on: false });
      const mover = (x, y, range, speed, vertical) => ents.plats.push({ kind: vertical ? "v" : "h", x: x * T, y: y * T, w: 32, h: 8, x0: x * T, y0: y * T, range, speed, dir: 1, dx: 0, dy: 0 });
      const faller = (x, y) => ents.plats.push({ kind: "f", x: x * T, y: y * T, w: 32, h: 8, vy: 0, t: -1, dx: 0, dy: 0 });
      let gaps = [], checkpoint = 0, flag = w - 8;
      if (n === 0) {
        gaps = [[38, 39], [62, 64], [88, 89]];
        ground(0, w - 1); gaps.forEach(([a, b]) => { for (let x = a; x <= b; x++) { put(x, 13, "."); put(x, 14, "."); } });
        put(10, 9, "?"); put(12, 9, "B"); put(13, 9, "Q"); put(14, 9, "B"); put(15, 9, "?"); put(13, 5, "?");
        pipe(20, 2); pipe(30, 3); pipe(46, 2); pipe(70, 2);
        coins(25, 8, 4); coins(40, 8, 2); coins(58, 6, 5); coins(75, 9, 3); put(53, 9, "Q"); put(54, 9, "B"); put(55, 9, "?");
        [18, 33, 44, 56, 66, 76, 82].forEach((x) => enemy(x));
        put(82, 9, "?"); put(83, 9, "Q"); stairs(94, 5); checkpoint = 52;
      } else if (n === 1) {
        gaps = [[20, 22], [34, 37], [52, 55], [70, 71], [84, 88], [104, 106]];
        ground(0, w - 1); gaps.forEach(([a, b]) => { for (let x = a; x <= b; x++) { put(x, 13, "."); put(x, 14, "."); } });
        mover(36, 10, 40, 0.6, false); mover(53, 9, 48, 0.7, false); mover(86, 10, 28, 0.5, true);
        put(8, 9, "?"); put(9, 9, "Q"); put(10, 9, "?"); put(28, 8, "h"); put(29, 8, "h"); put(60, 6, "h"); put(61, 9, "Q");
        pipe(14, 3); pipe(26, 2); pipe(44, 4); pipe(64, 3); pipe(94, 2);
        coins(15, 7, 3); coins(30, 9, 3); coins(46, 7, 4); coins(66, 6, 4); coins(96, 9, 3);
        [12, 25, 31, 40, 47, 58, 66, 76, 80, 97, 100].forEach((x, i) => enemy(x, i % 4 === 3 ? 1 : 0));
        put(40, 9, "B"); put(41, 9, "?"); put(42, 9, "B"); put(76, 9, "Q"); stairs(118, 6); checkpoint = 62;
      } else {
        gaps = [[14, 16], [26, 29], [40, 44], [56, 58], [68, 74], [86, 88], [96, 102], [116, 120], [132, 136]];
        ground(0, w - 1); gaps.forEach(([a, b]) => { for (let x = a; x <= b; x++) { put(x, 13, "."); put(x, 14, "."); } });
        faller(27, 10); faller(41, 10); faller(43, 8); mover(70, 10, 36, 0.9, false); mover(97, 9, 40, 1.0, false); faller(117, 10); mover(133, 9, 12, 0.8, true);
        put(8, 9, "Q"); put(9, 9, "B"); put(10, 9, "?"); put(22, 8, "h"); put(50, 8, "h"); put(51, 8, "Q"); put(80, 9, "?"); put(81, 9, "Q"); put(108, 9, "Q");
        pipe(20, 2); pipe(34, 3); pipe(48, 3); pipe(62, 2); pipe(78, 4); pipe(92, 2); pipe(108, 3); pipe(124, 4);
        coins(11, 6, 5); coins(35, 5, 3); coins(63, 8, 4); coins(104, 6, 5); coins(128, 7, 3);
        [10, 24, 32, 38, 46, 52, 60, 66, 76, 84, 90, 94, 106, 112, 122, 126, 140].forEach((x, i) => enemy(x, i % 2));
        stairs(148, 8); checkpoint = 80;
      }
      put(flag, 12, "|"); for (let y = 3; y < 12; y++) put(flag, y, "|"); // flagpole tiles (non-solid)
      put(checkpoint, 12, "k");
      return { n, w, g, ents, checkpoint: checkpoint * T, flag: flag * T, sky: ["#5c94fc", "#181848", "#f8a850"][n], time: 300 };
    }
    const SOLID = new Set(["#", "B", "?", "Q", "!", "=", "[", "]", "(", ")"]);

    // ── game state ──
    const keys = {}; let state = "title", L, P, items = [], parts = [], pops = [], camX = 0, tick = 0, frame = 0;
    let score = 0, coinsN = 0, lives = 3, timeLeft = 300, timeTick = 0, menu = 0, spawnX = 32, stateT = 0, lvlIdx = 0, scores = [];
    try { scores = JSON.parse(localStorage.getItem("pq_scores") || "[]"); } catch (e) {}

    function newPlayer(x) { return { x, y: 13 * T - 16, w: 12, h: 16, vx: 0, vy: 0, on: false, face: 1, big: false, inv: 0, star: 0, speed: 0, mult: 0, coyote: 0, jumpHeld: false, anim: 0, slide: 0 }; }
    function loadLevel(i, keepSpawn) {
      lvlIdx = i; L = makeLevel(i); items = []; parts = []; pops = []; camX = 0;
      spawnX = keepSpawn || 32; P = newPlayer(spawnX); camX = Math.max(0, Math.min(P.x - 100, L.w * T - W));
      timeLeft = L.time; timeTick = 0; startMusic(i);
    }
    function newGame() { score = 0; coinsN = 0; lives = 3; loadLevel(0); state = "play"; audio(); }
    function saveScore() { scores.push(score); scores.sort((a, b) => b - a); scores = scores.slice(0, 5); try { localStorage.setItem("pq_scores", JSON.stringify(scores)); } catch (e) {} }

    const solidAt = (tx, ty) => { if (tx < 0) return true; if (tx >= L.w || ty < 0) return ty < 0 ? false : false; if (ty >= ROWS) return false; return SOLID.has(L.g[ty][tx]); };
    function pop(x, y, s, c = "#fff") { pops.push({ x, y, s, c, t: 0 }); }
    function burst(x, y, c, n = 6) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 2.5, vy: -Math.random() * 2.5 - 0.5, c, t: 30 }); }
    function addScore(n, x, y) { score += n; if (x !== undefined) pop(x, y, n); }
    function addCoin(x, y) {
      coinsN++; addScore(200 * (P.mult > 0 ? 2 : 1), x, y); SFX.coin();
      if (coinsN % 100 === 0) { lives++; SFX.life(); }
    }

    function hitBlock(tx, ty) {
      const c = L.g[ty][tx];
      if (c === "B") { if (P.big) { L.g[ty][tx] = "."; burst(tx * T + 8, ty * T + 8, "#c84c0c", 8); addScore(50); SFX.brick(); } else SFX.bump(); }
      else if (c === "?" || c === "h") { L.g[ty][tx] = "!"; addCoin(tx * T, ty * T - 8); parts.push({ x: tx * T + 8, y: ty * T - 4, vx: 0, vy: -3, c: "#fcd800", t: 20 }); }
      else if (c === "Q") {
        L.g[ty][tx] = "!"; SFX.bump(); const types = P.big ? ["speed", "star", "life", "mult", "speed", "star"] : ["grow", "grow", "speed", "star", "mult", "life"];
        items.push({ x: tx * T + 2, y: ty * T - 12, type: types[Math.floor(Math.random() * types.length)], t: 0 });
      } else SFX.bump();
    }

    // ── update ──
    function die() { if (P.dead) return; P.dead = true; P.vy = -4; P.vx = 0; stopMusic(); SFX.die(); state = "dying"; stateT = 0; }
    function hurt() {
      if (P.inv > 0 || P.dead) return;
      if (P.big) { P.big = false; P.y += 8; P.h = 16; P.inv = 100; SFX.bump(); } else die();
    }
    function stepPlayer() {
      const run = keys.run, spd = (run ? 2.0 : 1.3) * (P.speed > 0 ? 1.4 : 1);
      const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), acc = P.on ? 0.1 : 0.07;
      if (dir) { P.vx += dir * acc; P.face = dir; if (Math.abs(P.vx) > spd) P.vx += (Math.sign(P.vx) * spd - P.vx) * 0.3; } else P.vx *= P.on ? 0.84 : 0.98;
      if (Math.abs(P.vx) < 0.02) P.vx = 0;
      if (P.on) P.coyote = 8; else if (P.coyote > 0) P.coyote--;
      // jump: buffered for 8 frames before landing + 8 frames of coyote time, so it feels forgiving
      const press = keys.jump && !P.prevJump; P.prevJump = keys.jump; if (press) P.buf = 8; else if (P.buf > 0) P.buf--;
      if (P.buf > 0 && P.coyote > 0) { P.vy = -5.9 - Math.abs(P.vx) * 0.15; P.on = false; P.coyote = 0; P.buf = 0; P.jumpHeld = true; P.ride = null; SFX.jump(); }
      if (!keys.jump) { P.jumpHeld = false; if (P.vy < -2.6) P.vy = -2.6; }
      P.vy = Math.min(P.vy + 0.19, 5.2);
      // platform carry
      if (P.ride) { P.x += P.ride.dx; P.y += P.ride.dy; }
      // horizontal
      P.x += P.vx;
      let y0 = Math.floor(P.y / T), y1 = Math.floor((P.y + P.h - 1) / T);
      if (P.vx > 0) { const tx = Math.floor((P.x + P.w) / T); for (let ty = y0; ty <= y1; ty++) if (solidAt(tx, ty)) { P.x = tx * T - P.w; P.vx = 0; break; } }
      else if (P.vx < 0) { const tx = Math.floor(P.x / T); for (let ty = y0; ty <= y1; ty++) if (solidAt(tx, ty)) { P.x = (tx + 1) * T; P.vx = 0; break; } }
      if (P.x < camX) { P.x = camX; P.vx = Math.max(0, P.vx); }
      // vertical
      const prevBottom = P.y + P.h; P.y += P.vy; P.on = false;
      let x0 = Math.floor((P.x + 1) / T), x1 = Math.floor((P.x + P.w - 2) / T);
      if (P.vy > 0) { const ty = Math.floor((P.y + P.h) / T); for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) { P.y = ty * T - P.h; P.vy = 0; P.on = true; break; } }
      else if (P.vy < 0) {
        const ty = Math.floor(P.y / T);
        for (let tx = x0; tx <= x1; tx++) {
          const c = ty >= 0 && ty < ROWS ? L.g[ty][tx] : ".";
          if (solidAt(tx, ty) || c === "h") { if (c === "h" && !(P.x + P.w / 2 > tx * T && P.x + P.w / 2 < tx * T + T)) continue; P.y = (ty + 1) * T; P.vy = 0.5; hitBlock(tx, ty); break; }
        }
      }
      // platforms (one-way)
      P.ride = null;
      if (P.vy >= 0) for (const p of L.ents.plats) {
        if (P.x + P.w > p.x + 2 && P.x < p.x + p.w - 2 && prevBottom <= p.y + 3 && P.y + P.h >= p.y) { P.y = p.y - P.h; P.vy = 0; P.on = true; P.ride = p; if (p.kind === "f" && p.t < 0) p.t = 24; }
      }
      // tiles: coins, checkpoint, flag
      const cx0 = Math.floor(P.x / T), cx1 = Math.floor((P.x + P.w - 1) / T), cy0 = Math.floor(P.y / T), cy1 = Math.floor((P.y + P.h - 1) / T);
      for (let ty = cy0; ty <= cy1; ty++) for (let tx = cx0; tx <= cx1; tx++) {
        const c = ty >= 0 && ty < ROWS && tx >= 0 && tx < L.w ? L.g[ty][tx] : ".";
        if (c === "c") { L.g[ty][tx] = "."; addCoin(tx * T, ty * T - 8); }
        else if (c === "k" && spawnX < tx * T) { spawnX = tx * T; pop(tx * T, ty * T - 10, "CHECKPOINT", "#fff"); SFX.power(); }
        else if (c === "|") { win(); return; }
      }
      if (P.y > ROWS * T + 24) die();
      if (P.inv > 0) P.inv--; if (P.star > 0) P.star--; if (P.speed > 0) P.speed--; if (P.mult > 0) P.mult--;
      P.anim += Math.abs(P.vx) * 0.12;
    }
    function win() { stopMusic(); SFX.clear(); state = "clear"; stateT = 0; P.vx = 0; P.vy = 0; P.slide = 1; P.x = L.flag - 6; addScore(1000, P.x, P.y - 10); }
    function stepEnemies() {
      for (const e of L.ents.enemies) {
        if (e.dead) { e.dead++; continue; }
        if (Math.abs(e.x - camX - W / 2) > W) continue;
        e.vy = Math.min(e.vy + 0.2, 4); e.x += e.vx;
        const dir = Math.sign(e.vx), tx = Math.floor((dir > 0 ? e.x + e.w : e.x) / T);
        for (let ty = Math.floor(e.y / T); ty <= Math.floor((e.y + e.h - 1) / T); ty++) if (solidAt(tx, ty)) { e.x = dir > 0 ? tx * T - e.w : (tx + 1) * T; e.vx = -e.vx; break; }
        if (e.vx > 0 ? e.x > L.w * T : e.x < 0) e.vx = -e.vx;
        e.y += e.vy; const ty = Math.floor((e.y + e.h) / T);
        for (let tx2 = Math.floor(e.x / T); tx2 <= Math.floor((e.x + e.w - 1) / T); tx2++) if (e.vy > 0 && solidAt(tx2, ty)) { e.y = ty * T - e.h; e.vy = 0; break; }
        if (e.y > ROWS * T + 40) e.dead = 99;
        if (P.dead || state !== "play") continue;
        if (P.x + P.w > e.x + 2 && P.x < e.x + e.w - 2 && P.y + P.h > e.y && P.y < e.y + e.h - 2) {
          if (P.star > 0) { e.dead = 1; e.vy = -2; addScore(200, e.x, e.y - 8); SFX.stomp(); }
          else if (P.vy > 0.3 && P.y + P.h - e.y < 15) { e.dead = 1; P.vy = keys.jump ? -5.4 : -3.4; addScore(100, e.x, e.y - 8); SFX.stomp(); }
          else hurt();
        }
      }
    }
    function stepPlats() {
      for (const p of L.ents.plats) {
        if (p.kind === "h") { p.x += p.speed * p.dir; p.dx = p.speed * p.dir; p.dy = 0; if (Math.abs(p.x - p.x0) >= p.range) p.dir *= -1; }
        else if (p.kind === "v") { p.y += p.speed * p.dir; p.dy = p.speed * p.dir; p.dx = 0; if (Math.abs(p.y - p.y0) >= p.range) p.dir *= -1; }
        else { p.dx = 0; p.dy = 0; if (p.t > 0) p.t--; if (p.t === 0) { p.vy += 0.12; p.y += p.vy; p.dy = p.vy; } }
      }
    }
    function stepItems() {
      for (const it of items) {
        it.t++; if (it.got) continue;
        if (P.x + P.w > it.x && P.x < it.x + 12 && P.y + P.h > it.y && P.y < it.y + 12) {
          it.got = true; SFX.power();
          if (it.type === "grow") { if (!P.big) { P.big = true; P.h = 24; P.y -= 8; } addScore(1000, it.x, it.y - 8); pop(it.x, it.y - 18, "GROW!", "#fc7460"); }
          else if (it.type === "speed") { P.speed = 600; addScore(500, it.x, it.y - 8); pop(it.x, it.y - 18, "SPEED!", "#3cbcfc"); }
          else if (it.type === "star") { P.star = 600; addScore(1000, it.x, it.y - 8); pop(it.x, it.y - 18, "STAR!", "#fcd800"); }
          else if (it.type === "life") { lives++; SFX.life(); pop(it.x, it.y - 18, "1UP!", "#58d854"); }
          else if (it.type === "mult") { P.mult = 900; addScore(500, it.x, it.y - 8); pop(it.x, it.y - 18, "COINS X2!", "#fcd800"); }
          burst(it.x + 6, it.y + 6, "#fff", 10);
        }
      }
      items = items.filter((i) => !i.got);
    }
    function update() {
      tick++;
      if (state === "play") {
        if (++timeTick >= 24) { timeTick = 0; timeLeft--; if (timeLeft <= 0) { die(); } }
        stepPlats(); stepPlayer(); stepEnemies(); stepItems();
        const target = Math.max(0, Math.min(P.x - 104, L.w * T - W)); if (target > camX) camX += (target - camX) * 0.2; camX = Math.min(camX, L.w * T - W);
      } else if (state === "dying") {
        P.vy += 0.22; P.y += P.vy; if (++stateT > 120) { lives--; if (lives <= 0) { saveScore(); state = "gameover"; SFX.over(); stateT = 0; } else { loadLevel(lvlIdx, spawnX); state = "play"; } }
      } else if (state === "clear") {
        stateT++;
        if (stateT < 50 && P.y + P.h < 12 * T) P.y += 2; // slide down the pole
        else if (stateT >= 50 && stateT < 110) { P.slide = 0; P.x += 1; P.face = 1; P.on = true; }
        else if (stateT >= 110) {
          if (timeLeft > 0) { const d = Math.min(timeLeft, 3); timeLeft -= d; score += d * 50; if (stateT % 4 === 0) tone(1100, 0.03); }
          else if (stateT > 110 + 90) { if (lvlIdx >= 2) { saveScore(); state = "end"; stateT = 0; SFX.clear(); } else { loadLevel(lvlIdx + 1); state = "play"; } }
        }
      }
      for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.t--; } parts = parts.filter((p) => p.t > 0);
      for (const p of pops) { p.y -= 0.5; p.t++; } pops = pops.filter((p) => p.t < 50);
      if (state === "title" || state === "howto" || state === "scores") frame++;
    }

    // ── drawing ──
    function drawTile(c, x, y) {
      const n = lvlIdx;
      if (c === "#") { const col = ["#c84c0c", "#4040a0", "#a03000"][n]; rect(col, x, y, T, T); rect("#000", x, y + 7, T, 1); rect("#000", x + 7, y, 1, 8); rect("#000", x + 3, y + 8, 1, 8); rect("#fcbcb0", x + 1, y + 1, 5, 1); rect("#fcbcb0", x + 9, y + 9, 5, 1); }
      else if (c === "B") { rect("#c84c0c", x, y, T, T); rect("#000", x, y + 3, T, 1); rect("#000", x, y + 7, T, 1); rect("#000", x, y + 11, T, 1); rect("#000", x + 7, y, 1, 4); rect("#000", x + 3, y + 4, 1, 4); rect("#000", x + 11, y + 4, 1, 4); rect("#000", x + 7, y + 8, 1, 4); rect("#fcbcb0", x, y, T, 1); }
      else if (c === "?" || c === "Q") { const f = Math.floor(tick / 12) % 4; rect(f === 3 ? "#a85800" : "#fc9838", x, y, T, T); rect("#000", x, y, T, 1); rect("#000", x, y + 15, T, 1); rect("#000", x, y, 1, T); rect("#000", x + 15, y, 1, T); text("?", x + 5, y + 4, "#fff", 1); rect("#000", x + 6, y + 10, 1, 1); }
      else if (c === "!") { rect("#a85800", x, y, T, T); rect("#000", x, y, T, 1); rect("#000", x, y + 15, T, 1); rect("#000", x, y, 1, T); rect("#000", x + 15, y, 1, T); }
      else if (c === "=") { rect("#b0b0b0", x, y, T, T); rect("#fff", x, y, T, 1); rect("#fff", x, y, 1, T); rect("#505050", x + 15, y, 1, T); rect("#505050", x, y + 15, T, 1); }
      else if (c === "[" || c === "]") { rect("#00a800", x, y, T, T); rect("#005800", x + (c === "[" ? 0 : 15), y, 1, T); rect("#b8f818", x + (c === "[" ? 3 : 10), y + 1, 2, 14); rect("#000", x, y, T, 1); rect("#000", x, y + 15, T, 1); }
      else if (c === "(" || c === ")") { rect("#00a800", x + 1, y, 14, T); rect("#005800", x + (c === "(" ? 1 : 14), y, 1, T); rect("#b8f818", x + (c === "(" ? 4 : 10), y, 2, T); }
      else if (c === "c") { const w2 = [6, 4, 2, 4][Math.floor(tick / 8) % 4]; rect("#fcd800", x + 8 - w2 / 2, y + 3, w2, 10); rect("#c84c0c", x + 8 - w2 / 2, y + 3, 1, 10); }
      else if (c === "k") { rect("#fff", x + 7, y - 8, 2, 24); rect(spawnX >= x ? "#58d854" : "#e52521", x + 9, y - 8, 7, 5); }
      else if (c === "|") { rect("#58d854", x + 7, y, 2, T); if (y === 3 * T) { rect("#58d854", x + 4, y - 5, 8, 8); rect("#fff", x + 6, y - 3, 4, 4); } }
    }
    function drawPlayer() {
      if (P.dead) { drawHero(P.x - camX, P.y, true); return; }
      if (P.inv > 0 && Math.floor(tick / 3) % 2) return;
      drawHero(P.x - camX, P.y, false);
    }
    function drawHero(x, y, dead) {
      x = Math.round(x); y = Math.round(y);
      const big = P.big, s = P.star > 0, fl = Math.floor(tick / 4) % 3, shirt = s ? ["#fcd800", "#fc7460", "#fff"][fl] : "#1ca8a8", pants = s ? "#e52521" : "#2038ec", f = P.face;
      const h = P.h; const top = y; const bx = x;
      rect("#fc9838", bx + 2, top + (big ? 8 : 2), 9, 6);           // face
      rect(s ? "#fcd800" : "#e8501c", bx + 1, top + (big ? 4 : 0) , 11, 4); // hair/cap
      rect("#000", bx + (f > 0 ? 8 : 3), top + (big ? 10 : 4), 2, 2);  // eye
      const bodyY = top + (big ? 14 : 8);
      rect(shirt, bx + 1, bodyY, 11, big ? 6 : 4);
      rect(pants, bx + 1, bodyY + (big ? 6 : 4), 11, big ? 4 : 2);
      const legY = top + h - 4, step2 = P.on && Math.abs(P.vx) > 0.2 ? Math.floor(P.anim) % 2 : 0;
      rect("#7a3a00", bx + (step2 ? 0 : 1), legY, 5, 4); rect("#7a3a00", bx + (step2 ? 8 : 7), legY, 5, 4);
      if (!P.on && !dead) rect(shirt, bx + (f > 0 ? 10 : -1), bodyY - 2, 3, 3);
    }
    function drawEnemy(e) {
      const x = Math.round(e.x - camX), y = Math.round(e.y);
      if (e.dead) { if (e.dead < 25 || e.dead === 99) { if (e.dead !== 99) { rect(e.type ? "#e8501c" : "#a040a0", x, y + 8, 12, 4); } } return; }
      const fr = Math.floor(tick / 10) % 2, c1 = e.type ? "#e8501c" : "#a040a0", c2 = e.type ? "#fcd800" : "#e0a0e0";
      rect(c1, x + 1, y, 10, 9); rect(c1, x, y + 3, 12, 5); rect("#fff", x + 2, y + 3, 3, 3); rect("#fff", x + 7, y + 3, 3, 3);
      rect("#000", x + 3, y + 4, 1, 2); rect("#000", x + 8, y + 4, 1, 2); rect("#000", x + 2, y + 2, 4, 1); rect("#000", x + 7, y + 2, 4, 1);
      rect("#000", x + (fr ? 0 : 1), y + 9, 4, 3); rect("#000", x + (fr ? 8 : 7), y + 9, 4, 3); rect(c2, x + 4, y + 8, 4, 1);
      if (e.type) { rect("#fcd800", x + 2, y - 2, 2, 2); rect("#fcd800", x + 8, y - 2, 2, 2); }
    }
    function drawItem(it) {
      const x = Math.round(it.x - camX), y = Math.round(it.y + Math.sin(it.t * 0.1) * 1.2);
      const col = { grow: "#e52521", speed: "#3cbcfc", star: "#fcd800", life: "#58d854", mult: "#fc9838" }[it.type];
      rect("#000", x - 1, y - 1, 14, 14); rect(col, x, y, 12, 12);
      const ch = { grow: "+", speed: ">", star: "*", life: "1", mult: "2" }[it.type];
      if (ch === "*") { rect("#fff", x + 5, y + 2, 2, 8); rect("#fff", x + 2, y + 5, 8, 2); } else text(ch, x + 4, y + 3, "#fff", 1);
    }
    function drawWorld() {
      ctx.fillStyle = L.sky; ctx.fillRect(0, 0, W, H);
      const n = lvlIdx;
      if (n === 1) for (let i = 0; i < 40; i++) rect("#fff", (i * 53 + 17) % W, (i * 31) % 150, 1, 1);
      // parallax hills & clouds
      for (let i = -1; i < 8; i++) { const hx = i * 128 - ((camX * 0.3) % 128); const hc = ["#58d854", "#306030", "#a05020"][n]; rect(hc, hx, 150, 56, 90); rect(hc, hx + 8, 142, 40, 8); rect(hc, hx + 16, 138, 24, 4); rect("#005800", hx + 24, 156, 2, 4); rect("#005800", hx + 36, 164, 2, 4); }
      for (let i = -1; i < 6; i++) { const cx = i * 96 - ((camX * 0.15) % 96) + 20, cy = 24 + (i % 3) * 18; const cc = n === 1 ? "#6068c8" : "#fff"; rect(cc, cx + 4, cy, 24, 10); rect(cc, cx, cy + 4, 32, 6); rect(cc, cx + 10, cy - 4, 12, 4); }
      const x0 = Math.floor(camX / T), x1 = x0 + 17;
      for (let ty = 0; ty < ROWS; ty++) for (let tx = x0; tx <= x1 && tx < L.w; tx++) { const c = L.g[ty][tx]; if (c !== "." && c !== "h") drawTile(c, tx * T - Math.round(camX), ty * T); }
      for (const p of L.ents.plats) { const x = Math.round(p.x - camX); if (x < -40 || x > W) continue; rect("#fcbcb0", x, Math.round(p.y), p.w, 2); rect("#c84c0c", x, Math.round(p.y) + 2, p.w, 6); rect("#000", x, Math.round(p.y) + 7, p.w, 1); for (let i = 0; i < p.w; i += 8) rect("#000", x + i, Math.round(p.y) + 2, 1, 5); }
      for (const e of L.ents.enemies) if (e.x - camX > -20 && e.x - camX < W + 20) drawEnemy(e);
      for (const it of items) drawItem(it);
      if (P) drawPlayer();
      if (P && P.star > 0 && state === "play") ctx.globalAlpha = 1;
      for (const p of parts) rect(p.c, p.x - camX, p.y, 2, 2);
      for (const p of pops) text(p.s, p.x - camX, p.y, p.c, 1);
    }
    function hud() {
      text("SCORE", 8, 6, "#fff", 1); text(String(score).padStart(6, "0"), 8, 14, "#fff", 1);
      rect("#fcd800", 76, 14, 3, 5); text("X" + String(coinsN).padStart(2, "0"), 81, 14, "#fff", 1); text("COINS", 76, 6, "#fff", 1);
      text("WORLD", 128, 6, "#fff", 1); text("1-" + (lvlIdx + 1), 134, 14, "#fff", 1);
      text("TIME", 176, 6, "#fff", 1); text(String(Math.max(0, timeLeft)).padStart(3, "0"), 178, 14, timeLeft < 60 ? "#fc7460" : "#fff", 1);
      text("LIVES", 216, 6, "#fff", 1); text("X" + lives, 222, 14, "#fff", 1);
      let ix = 8; const tags = [["STAR", P.star, "#fcd800"], ["SPEED", P.speed, "#3cbcfc"], ["X2", P.mult, "#fc9838"]];
      for (const [nm, v, col] of tags) if (v > 0) { text(nm, ix, 24, col, 1); ix += nm.length * 4 + 4; }
    }
    function banner(lines, y0 = 90) { rect("rgba(0,0,0,0.0)", 0, 0, 0, 0); lines.forEach((l, i) => text(l[0], W / 2, y0 + i * 14, l[1] || "#fff", l[2] || 1, "center")); }
    const MENU = ["START GAME", "HOW TO PLAY", "SOUND", "HIGH SCORES"];
    function drawTitle() {
      ctx.fillStyle = "#5c94fc"; ctx.fillRect(0, 0, W, H);
      for (let i = -1; i < 4; i++) { const cx = i * 110 - (frame * 0.4) % 110 + 20, cy = 30 + (i & 1) * 22; rect("#fff", cx + 4, cy, 28, 10); rect("#fff", cx, cy + 4, 36, 6); rect("#fff", cx + 10, cy - 4, 14, 4); }
      for (let i = -1; i < 6; i++) { const hx = i * 100 - (frame * 0.8) % 100; rect("#58d854", hx, 170, 56, 70); rect("#58d854", hx + 8, 162, 40, 8); rect("#58d854", hx + 16, 158, 24, 4); }
      for (let x = 0; x < W; x += T) { drawTileAt("#", x, 14 * T - 16); drawTileAt("#", x, 14 * T); }
      const bob = Math.round(Math.sin(frame * 0.08) * 3);
      text("PIXEL", W / 2, 34 + bob, "#000", 6, "center"); text("PIXEL", W / 2, 32 + bob, "#fc9838", 6, "center");
      text("QUEST", W / 2, 70 + bob, "#000", 6, "center"); text("QUEST", W / 2, 68 + bob, "#fcd800", 6, "center");
      if (state === "title") {
        MENU.forEach((m, i) => { const lab = i === 2 ? "SOUND: " + (muted ? "OFF" : "ON") : m; if (menu === i) text(">", 70, 118 + i * 14, "#fff", 1); text(lab, 80, 118 + i * 14, menu === i ? "#fff" : "#fcbcb0", 1); });
        text("ARROWS + ENTER OR CLICK", W / 2, 180, "#000", 1, "center");
      } else if (state === "howto") {
        rect("#000", 16, 96, 224, 120);
        ["ARROWS/WASD  MOVE", "SPACE  JUMP", "SHIFT  RUN", "ESC  PAUSE   R  RESTART", "", "STOMP ENEMIES, HIT ? BLOCKS", "GRAB POWER-UPS, REACH THE FLAG", "", "PRESS ENTER TO GO BACK"].forEach((l, i) => text(l, W / 2, 104 + i * 11, "#fff", 1, "center"));
      } else if (state === "scores") {
        rect("#000", 40, 100, 176, 96); text("HIGH SCORES", W / 2, 108, "#fcd800", 1, "center");
        for (let i = 0; i < 5; i++) text((i + 1) + ".  " + (scores[i] !== undefined ? String(scores[i]).padStart(6, "0") : "------"), W / 2, 126 + i * 11, "#fff", 1, "center");
        text("PRESS ENTER TO GO BACK", W / 2, 184, "#fcbcb0", 1, "center");
      }
    }
    function drawTileAt(c, x, y) { const sv = lvlIdx; lvlIdx = 0; drawTile(c, x, y); lvlIdx = sv; }
    function render() {
      if (state === "title" || state === "howto" || state === "scores") { drawTitle(); return; }
      drawWorld(); hud();
      if (state === "pause") { rect("rgba(0,0,0,0)", 0, 0, 0, 0); ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, W, H); banner([["PAUSED", "#fff", 3], ["ESC RESUME", "#fcbcb0"], ["R RESTART LEVEL", "#fcbcb0"], ["Q QUIT TO TITLE", "#fcbcb0"]], 80); }
      if (state === "gameover") { ctx.fillStyle = "rgba(0,0,0,.75)"; ctx.fillRect(0, 0, W, H); banner([["GAME OVER", "#e52521", 4], ["SCORE " + String(score).padStart(6, "0"), "#fff"], ["PRESS ENTER OR R", "#fcbcb0"]], 80); }
      if (state === "clear") { banner([["COURSE CLEAR!", "#fcd800", 2], timeLeft > 0 ? ["TIME BONUS " + timeLeft + " X 50", "#fff"] : ["", "#fff"]], 70); }
      if (state === "end") { ctx.fillStyle = "rgba(0,0,0,.8)"; ctx.fillRect(0, 0, W, H); banner([["YOU WIN!", "#fcd800", 4], ["ALL 3 COURSES CLEARED", "#fff"], ["FINAL SCORE " + String(score).padStart(6, "0"), "#58d854"], ["PRESS ENTER", "#fcbcb0"]], 70); }
    }

    // ── input ──
    const KEYMAP = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", Space: "jump", ArrowUp: "jump", KeyW: "jump", ShiftLeft: "run", ShiftRight: "run", KeyX: "run" };
    function actionKey(code) {
      if (state === "title") {
        if (code === "ArrowUp" || code === "KeyW") { menu = (menu + 3) % 4; SFX.select(); }
        else if (code === "ArrowDown" || code === "KeyS") { menu = (menu + 1) % 4; SFX.select(); }
        else if (code === "Enter" || code === "Space") choose(menu);
      } else if (state === "howto" || state === "scores") { if (code === "Enter" || code === "Escape" || code === "Space") { state = "title"; SFX.select(); } }
      else if (state === "play") { if (code === "Escape" || code === "KeyP") { state = "pause"; stopMusic(); } }
      else if (state === "pause") { if (code === "Escape" || code === "KeyP") { state = "play"; startMusic(lvlIdx); } else if (code === "KeyR") { loadLevel(lvlIdx, 32); state = "play"; spawnX = 32; } else if (code === "KeyQ") { stopMusic(); state = "title"; } }
      else if (state === "gameover" || state === "end") { if (code === "Enter" || code === "KeyR") newGame(); else if (code === "Escape") state = "title"; }
    }
    function choose(i) {
      SFX.select();
      if (i === 0) newGame(); else if (i === 1) state = "howto"; else if (i === 2) { muted = !muted; try { localStorage.setItem("pq_muted", muted ? "1" : "0"); } catch (e) {} if (muted) stopMusic(); } else if (i === 3) state = "scores";
    }
    const onKeyDown = (e) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
      if (e.repeat) return; audio();
      const k = KEYMAP[e.code]; if (k) keys[k] = true; actionKey(e.code);
    };
    const onKeyUp = (e) => { const k = KEYMAP[e.code]; if (k) keys[k] = false; };
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);
    cv.addEventListener("pointerdown", (e) => {
      audio(); const r = cv.getBoundingClientRect(), y = ((e.clientY - r.top) / r.height) * H;
      if (state === "title") { const i = Math.floor((y - 114) / 14); if (i >= 0 && i < 4) { menu = i; choose(i); } }
      else if (state === "howto" || state === "scores") state = "title";
      else if (state === "gameover" || state === "end") newGame();
    });
    // touch controls
    const touch = document.createElement("div"); touch.className = "pq-touch";
    const mk = (label, key, css) => { const b = document.createElement("button"); b.textContent = label; b.style.cssText = css;
      const on = (v) => (ev) => { ev.preventDefault(); audio(); if (key === "pause") { if (v) actionKey("Escape"); } else keys[key] = v; };
      b.addEventListener("pointerdown", on(true)); b.addEventListener("pointerup", on(false)); b.addEventListener("pointercancel", on(false)); b.addEventListener("pointerleave", on(false)); touch.appendChild(b); };
    mk("◀", "left", "left:10px;bottom:30px;width:60px;height:60px"); mk("▶", "right", "left:80px;bottom:30px;width:60px;height:60px");
    mk("A", "jump", "right:10px;bottom:30px;width:68px;height:68px"); mk("B", "run", "right:88px;bottom:20px;width:54px;height:54px"); mk("II", "pause", "right:10px;top:-" + 0 + "px;bottom:110px;width:38px;height:28px;border-radius:8px");
    box.appendChild(touch);
    if (window.matchMedia("(pointer:coarse)").matches || "ontouchstart" in window) box.classList.add("touch");

    // ── loop (fixed 60 Hz) ──
    let acc = 0, last = performance.now(), raf = 0, dead = false;
    function loop(now) {
      if (dead) return; raf = requestAnimationFrame(loop);
      acc += Math.min(100, now - last); last = now;
      while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
      render();
    }
    raf = requestAnimationFrame(loop);
    mount.dispose = () => { dead = true; cancelAnimationFrame(raf); stopMusic(); ro.disconnect(); window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); try { ac && ac.close(); } catch (e) {} ac = null; };
    if (/[?&]debug/.test(location.search)) window.__pq = { get P() { return P; }, get L() { return L; }, get state() { return state; }, keys, newGame, loadLevel, get score() { return score; } };
  }

  PG.register("nes", { title: "Pixel Quest", mount, unmount() { if (mount.dispose) mount.dispose(); } });
})();
