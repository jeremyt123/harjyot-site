/* Vista games folder: Minesweeper, Solitaire (Klondike), Chess, Tic-Tac-Toe, Pinball, plus a hidden Snake. */
(function () {
  const V = window.VISTA, h = V.h, esc = V.esc, reg = (d) => V.registerApp(d);

  // ── Games folder ──
  reg({ id: "games", name: "Games", icon: "🎮", w: 520, h: 340, single: true, open(win, os) {
    const list = [["minesweeper", "💣", "Minesweeper"], ["solitaire", "🃏", "Solitaire"], ["chess", "♞", "Chess"], ["tictactoe", "❌", "Tic-Tac-Toe"], ["pinball", "🎱", "Pinball"]];
    if (localStorage.getItem("vista_secret") === "1") list.push(["snake", "🐍", "Snake (hidden!)"]);
    const g = h("div"); g.style.cssText = "flex:1;background:#fff;padding:14px;display:flex;flex-wrap:wrap;gap:14px;align-content:flex-start"; win.body.appendChild(g);
    list.forEach(([id, ic, nm]) => { const d = h("div", "", `<div style="font-size:42px">${ic}</div>${esc(nm)}`); d.style.cssText = "width:110px;text-align:center;padding:8px;border:1px solid transparent;border-radius:4px;cursor:default"; d.onmouseenter = () => { d.style.background = "#dcebfc"; d.style.borderColor = "#9ec2f2"; }; d.onmouseleave = () => { d.style.background = ""; d.style.borderColor = "transparent"; }; d.ondblclick = () => V.openApp(id); g.appendChild(d); });
    win.body.appendChild(h("div", "vs-status", "Double-click a game to play"));
  } });

  // ── Minesweeper ──
  reg({ id: "minesweeper", name: "Minesweeper", icon: "💣", w: 230, h: 320, resizable: false, kw: "mines game", open(win, os) {
    const LV = { Easy: [9, 9, 10], Medium: [16, 16, 40], Hard: [24, 16, 99] }; let cols, rows, mines, cells, started, over, flags, timer, secs, left;
    const root = h("div"); root.style.cssText = "flex:1;background:#c0c0c0;padding:6px;display:flex;flex-direction:column;align-items:center;gap:6px;overflow:auto"; win.body.appendChild(root);
    const bar = h("div"); bar.style.cssText = "display:flex;justify-content:space-between;align-items:center;width:100%;background:#c0c0c0;border:2px inset #fff;padding:4px"; bar.innerHTML = `<b class="mc" style="background:#000;color:#f00;font:20px Consolas;padding:0 6px">010</b><button class="vs-btn face" style="font-size:18px;padding:0 6px">🙂</button><b class="tm" style="background:#000;color:#f00;font:20px Consolas;padding:0 6px">000</b>`;
    const grid = h("div"); grid.style.cssText = "display:grid;border:3px inset #fff;background:#c0c0c0"; root.append(bar, grid);
    const menu = h("div", "vs-tool"); ["Easy", "Medium", "Hard"].forEach((l) => { const b = h("button", "vs-btn", l); b.onclick = () => init(l); menu.appendChild(b); }); win.body.insertBefore(menu, win.body.firstChild);
    const q = (s) => bar.querySelector(s), COLS = ["", "#00f", "#080", "#f00", "#008", "#800", "#088", "#000", "#888"];
    function init(l) { clearInterval(timer); [cols, rows, mines] = LV[l]; cells = Array.from({ length: rows * cols }, () => ({ m: 0, o: 0, f: 0, n: 0 })); started = false; over = false; flags = 0; secs = 0; left = rows * cols - mines; q(".face").textContent = "🙂"; q(".tm").textContent = "000"; upd();
      const cw = cols * 20 + 24; win.el.style.width = Math.max(230, cw + 22) + "px"; win.el.style.height = rows * 20 + 150 + "px"; grid.style.gridTemplateColumns = `repeat(${cols},20px)`; draw(); }
    const upd = () => (q(".mc").textContent = String(Math.max(-99, mines - flags)).padStart(3, "0"));
    const nb = (i) => { const r = (i / cols) | 0, c = i % cols, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) o.push(rr * cols + cc); } return o; };
    function place(safe) { let n = 0; while (n < mines) { const i = (Math.random() * cells.length) | 0; if (i === safe || cells[i].m || nb(safe).includes(i)) continue; cells[i].m = 1; n++; } cells.forEach((c, i) => (c.n = nb(i).filter((j) => cells[j].m).length)); }
    function reveal(i) { const st = [i]; while (st.length) { const j = st.pop(), c = cells[j]; if (c.o || c.f) continue; c.o = 1; left--; if (!c.m && c.n === 0) nb(j).forEach((k) => !cells[k].o && st.push(k)); } }
    function end(win_) { over = true; clearInterval(timer); q(".face").textContent = win_ ? "😎" : "😵"; cells.forEach((c) => { if (c.m && !win_) c.o = 2; }); if (win_) { cells.forEach((c) => { if (c.m) c.f = 1; }); flags = mines; upd(); os.notify("Minesweeper", `You win in ${secs}s! 🎉`, "💣"); } draw(); }
    function click(i) { if (over || cells[i].f) return; if (!started) { started = true; place(i); timer = setInterval(() => { secs++; q(".tm").textContent = String(Math.min(999, secs)).padStart(3, "0"); }, 1000); } if (cells[i].m) { cells[i].o = 3; return end(false); } reveal(i); if (left === 0) return end(true); draw(); }
    function draw() { grid.innerHTML = ""; cells.forEach((c, i) => { const d = h("div"); d.style.cssText = `width:20px;height:20px;display:flex;align-items:center;justify-content:center;font:bold 13px Consolas;cursor:default;${c.o === 1 || c.o >= 2 ? "background:#c0c0c0;border:1px solid #888" : "background:#c0c0c0;border:2px outset #fff"}`; if (c.o === 1 && c.n) { d.textContent = c.n; d.style.color = COLS[c.n]; } else if (c.o >= 2) { d.textContent = "💣"; if (c.o === 3) d.style.background = "#f55"; } else if (c.f) d.textContent = "🚩"; d.onclick = () => click(i); d.oncontextmenu = (e) => { e.preventDefault(); if (over || c.o) return; c.f = c.f ? 0 : 1; flags += c.f ? 1 : -1; upd(); draw(); }; grid.appendChild(d); }); }
    q(".face").onclick = () => init(Object.keys(LV).find((k) => LV[k][0] === cols) || "Easy"); win.onClose = () => { clearInterval(timer); return true; }; init("Easy");
  } });

  // ── Solitaire (Klondike, draw one, drag & drop) ──
  reg({ id: "solitaire", name: "Solitaire", icon: "🃏", w: 640, h: 500, minW: 560, minH: 440, kw: "cards klondike", open(win, os) {
    const SU = ["♠", "♥", "♦", "♣"], RK = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]; let G, hist = [], score = 0, secs = 0, timer = null, drag = null;
    win.body.style.background = "radial-gradient(#1f8a3a,#0b4a1c)"; win.body.innerHTML = `<div class="vs-tool" style="background:#0b3a18"><button class="vs-btn nw">New game</button><button class="vs-btn un">Undo</button><span style="color:#fff;margin-left:auto" class="sc"></span></div><div class="bd" style="flex:1;position:relative;overflow:auto;padding:10px"></div>`;
    const bd = win.body.querySelector(".bd"), sc = win.body.querySelector(".sc");
    const red = (c) => c.s === 1 || c.s === 2, snap = () => { hist.push(JSON.stringify({ G, score })); if (hist.length > 80) hist.shift(); };
    function deal() { const d = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ r, s, up: 0 }); for (let i = d.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [d[i], d[j]] = [d[j], d[i]]; } G = { stock: [], waste: [], found: [[], [], [], []], tab: [[], [], [], [], [], [], []] }; for (let c = 0; c < 7; c++) for (let k = 0; k <= c; k++) { const x = d.pop(); x.up = k === c ? 1 : 0; G.tab[c].push(x); } G.stock = d; score = 0; secs = 0; hist = []; clearInterval(timer); timer = setInterval(() => { secs++; head(); }, 1000); draw(); }
    const head = () => (sc.textContent = `Score: ${score}   Time: ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`);
    const card = (c, x, y, z) => { const d = h("div"); d.style.cssText = `position:absolute;left:${x}px;top:${y}px;z-index:${z};width:62px;height:86px;border-radius:5px;border:1px solid #333;box-sizing:border-box;font:bold 15px Segoe UI;padding:3px 4px;${c.up ? `background:#fff;color:${red(c) ? "#c00" : "#111"}` : "background:repeating-linear-gradient(45deg,#2a4aa8,#2a4aa8 4px,#3a5ac8 4px,#3a5ac8 8px)"}`; if (c.up) d.innerHTML = `${RK[c.r]}${SU[c.s]}<div style="font-size:30px;text-align:center;margin-top:6px">${SU[c.s]}</div>`; return d; };
    const slot = (x, y, label) => { const d = h("div", "", label || ""); d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:62px;height:86px;border:2px dashed rgba(255,255,255,.35);border-radius:6px;color:rgba(255,255,255,.4);font-size:28px;text-align:center;line-height:82px`; return d; };
    function canTab(c, col) { const t = col[col.length - 1]; if (!t) return c.r === 13; return t.up && red(t) !== red(c) && t.r === c.r + 1; }
    function canFound(c, p) { const t = p[p.length - 1]; if (!t) return c.r === 1; return t.s === c.s && c.r === t.r + 1; }
    function draw() {
      bd.innerHTML = ""; head();
      const st = slot(10, 6, "↻"); st.onclick = () => { snap(); if (G.stock.length) { const c = G.stock.pop(); c.up = 1; G.waste.push(c); } else if (G.waste.length) { G.stock = G.waste.reverse().map((c) => ((c.up = 0), c)); G.waste = []; score = Math.max(0, score - 20); } draw(); }; bd.appendChild(st);
      G.stock.length && (() => { const c = card({ up: 0 }, 10, 6, 1); c.onclick = st.onclick; bd.appendChild(c); })();
      const w = G.waste[G.waste.length - 1]; if (w) { const c = card(w, 84, 6, 2); c.draggable = true; c.ondragstart = (e) => { drag = { from: "waste", n: 1 }; e.dataTransfer.setData("text/plain", "x"); }; c.ondblclick = () => auto(w, "waste"); bd.appendChild(c); }
      G.found.forEach((p, i) => { const x = 252 + i * 74, s = slot(x, 6, p.length ? "" : ["♠", "♥", "♦", "♣"][i]); s.ondragover = (e) => e.preventDefault(); s.ondrop = (e) => { e.preventDefault(); drop("found", i); }; bd.appendChild(s); if (p.length) { const t = p[p.length - 1], c = card(t, x, 6, 2); c.ondragover = s.ondragover; c.ondrop = s.ondrop; c.draggable = true; c.ondragstart = () => (drag = { from: "found", i, n: 1 }); bd.appendChild(c); } });
      G.tab.forEach((col, ci) => { const x = 10 + ci * 74; const base = slot(x, 112, ""); base.ondragover = (e) => e.preventDefault(); base.ondrop = (e) => { e.preventDefault(); drop("tab", ci); }; bd.appendChild(base); col.forEach((c, k) => { const el = card(c, x, 112 + k * (c.up ? 24 : 12), 10 + k); el.ondragover = base.ondragover; el.ondrop = base.ondrop; if (c.up) { el.draggable = true; el.ondragstart = (e) => { drag = { from: "tab", i: ci, k, n: col.length - k }; e.dataTransfer.setData("text/plain", "x"); }; } else if (k === col.length - 1) el.onclick = () => { snap(); c.up = 1; score += 5; draw(); }; if (k === col.length - 1 && c.up) el.ondblclick = () => auto(c, "tab", ci); bd.appendChild(el); }); });
      if (G.found.every((p) => p.length === 13)) { clearInterval(timer); os.modal("Solitaire", "🎉 You won! Score " + score, [["New game", () => deal()], ["Close"]]); }
    }
    function take() { if (drag.from === "waste") return G.waste.slice(-1); if (drag.from === "found") return G.found[drag.i].slice(-1); return G.tab[drag.i].slice(drag.k); }
    function remove() { if (drag.from === "waste") G.waste.pop(); else if (drag.from === "found") G.found[drag.i].pop(); else { G.tab[drag.i].length = drag.k; const col = G.tab[drag.i], t = col[col.length - 1]; if (t && !t.up) { t.up = 1; score += 5; } } }
    function drop(kind, i) {
      if (!drag) return; const cards = take(); if (!cards.length) return; const c = cards[0];
      if (kind === "tab") { if (!canTab(c, G.tab[i]) || (drag.from === "tab" && drag.i === i)) { drag = null; return; } snap(); remove(); G.tab[i].push(...cards); if (drag.from === "waste") score += 5; if (drag.from === "found") score = Math.max(0, score - 15); }
      else { if (cards.length !== 1 || !canFound(c, G.found[i])) { drag = null; return; } snap(); remove(); G.found[i].push(c); if (drag.from !== "found") score += 10; }
      drag = null; draw();
    }
    function auto(c, from, i) { const f = G.found.findIndex((p) => canFound(c, p)); if (f < 0) return; snap(); if (from === "waste") G.waste.pop(); else { G.tab[i].pop(); const t = G.tab[i][G.tab[i].length - 1]; if (t && !t.up) { t.up = 1; score += 5; } } G.found[f].push(c); score += 10; draw(); }
    win.body.querySelector(".nw").onclick = deal; win.body.querySelector(".un").onclick = () => { if (hist.length) { const s = JSON.parse(hist.pop()); G = s.G; score = Math.max(0, s.score - 2); draw(); } };
    win.onClose = () => { clearInterval(timer); return true; }; deal();
  } });

  // ── Tic-Tac-Toe (unbeatable AI) ──
  reg({ id: "tictactoe", name: "Tic-Tac-Toe", icon: "❌", w: 260, h: 340, resizable: false, open(win, os) {
    let b, over, sc = { x: 0, o: 0, d: 0 }; const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    win.body.innerHTML = `<div style="padding:10px;text-align:center;background:#fff;flex:1"><div class="msg" style="height:22px;font-weight:600"></div><div class="g" style="display:grid;grid-template-columns:repeat(3,70px);gap:4px;justify-content:center;margin:8px 0"></div><div class="s"></div><button class="vs-btn nw" style="margin-top:8px">New game</button></div>`;
    const g = win.body.querySelector(".g"), msg = win.body.querySelector(".msg");
    const winner = (p) => { for (const [a, c, d] of L) if (p[a] && p[a] === p[c] && p[a] === p[d]) return p[a]; return p.every(Boolean) ? "d" : null; };
    function mm(p, t) { const w = winner(p); if (w) return w === "o" ? 1 : w === "x" ? -1 : 0; let best = t === "o" ? -2 : 2, move; p.forEach((v, i) => { if (v) return; p[i] = t; const s = mm(p, t === "o" ? "x" : "o"); p[i] = ""; if (t === "o" ? s > best : s < best) best = s; }); return best; }
    function ai() { let best = -2, mv = -1; b.forEach((v, i) => { if (v) return; b[i] = "o"; const s = mm(b, "x"); b[i] = ""; if (s > best) { best = s; mv = i; } }); if (mv >= 0) b[mv] = "o"; }
    function draw() { g.innerHTML = ""; b.forEach((v, i) => { const c = h("button", "vs-btn", v === "x" ? "❌" : v === "o" ? "⭕" : ""); c.style.cssText = "width:70px;height:70px;font-size:30px"; c.onclick = () => { if (over || b[i]) return; b[i] = "x"; let w = winner(b); if (!w) { ai(); w = winner(b); } if (w) { over = true; msg.textContent = w === "x" ? "You win! 🎉" : w === "o" ? "Computer wins" : "It's a draw"; sc[w]++; } win.body.querySelector(".s").textContent = `You ${sc.x} · Computer ${sc.o} · Draws ${sc.d}`; draw(); }; g.appendChild(c); }); }
    const nw = () => { b = Array(9).fill(""); over = false; msg.textContent = "Your move (❌)"; draw(); }; win.body.querySelector(".nw").onclick = nw; nw();
  } });

  // ── Chess (legal moves incl. check; auto-queen; no castling/en passant) ──
  reg({ id: "chess", name: "Chess", icon: "♞", w: 460, h: 520, minW: 400, kw: "board game", open(win, os) {
    const U = { wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙", bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟" };
    let B, turn, sel, legal = [], msg = "", over = false;
    const init = () => { const back = ["R", "N", "B", "Q", "K", "B", "N", "R"]; B = Array.from({ length: 8 }, () => Array(8).fill(null)); for (let c = 0; c < 8; c++) { B[0][c] = "b" + back[c]; B[1][c] = "bP"; B[6][c] = "wP"; B[7][c] = "w" + back[c]; } turn = "w"; sel = null; legal = []; over = false; msg = "Your move (white)"; draw(); };
    const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
    function moves(bd, r, c, atk) {
      const p = bd[r][c]; if (!p) return []; const col = p[0], t = p[1], out = []; const add = (rr, cc, cap) => { if (!inb(rr, cc)) return false; const x = bd[rr][cc]; if (x && x[0] === col) return false; if (cap === 1 && !x) return false; if (cap === 2 && x) return false; out.push([rr, cc]); return !x; };
      if (t === "P") { const d = col === "w" ? -1 : 1, st = col === "w" ? 6 : 1; if (!atk) { if (add(r + d, c, 2) && r === st) add(r + 2 * d, c, 2); } add(r + d, c - 1, 1); add(r + d, c + 1, 1); }
      else if (t === "N") [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(([a, b]) => add(r + a, c + b)); else if (t === "K") { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (a || b) add(r + a, c + b); }
      else { const dirs = t === "R" ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : t === "B" ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]; dirs.forEach(([a, b]) => { let rr = r + a, cc = c + b; while (inb(rr, cc)) { const x = bd[rr][cc]; if (x && x[0] === col) break; out.push([rr, cc]); if (x) break; rr += a; cc += b; } }); }
      return out;
    }
    const kingPos = (bd, col) => { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (bd[r][c] === col + "K") return [r, c]; };
    function inCheck(bd, col) { const k = kingPos(bd, col); if (!k) return true; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = bd[r][c]; if (p && p[0] !== col && moves(bd, r, c, true).some(([a, b]) => a === k[0] && b === k[1])) return true; } return false; }
    const apply = (bd, [r, c], [rr, cc]) => { const n = bd.map((x) => x.slice()); n[rr][cc] = n[r][c]; n[r][c] = null; if (n[rr][cc][1] === "P" && (rr === 0 || rr === 7)) n[rr][cc] = n[rr][cc][0] + "Q"; return n; };
    const legalFor = (bd, r, c) => moves(bd, r, c).filter((m) => !inCheck(apply(bd, [r, c], m), bd[r][c][0]));
    const all = (bd, col) => { const o = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (bd[r][c] && bd[r][c][0] === col) legalFor(bd, r, c).forEach((m) => o.push([[r, c], m])); return o; };
    const VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 }; const ev = (bd) => { let s = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = bd[r][c]; if (p) s += (p[0] === "b" ? 1 : -1) * (VAL[p[1]] + (p[1] === "P" ? (p[0] === "b" ? r : 7 - r) * 4 : 0)); } return s; };
    function search(bd, col, d, a, b) { const ms = all(bd, col); if (!ms.length) return inCheck(bd, col) ? (col === "b" ? -99999 - d : 99999 + d) : 0; if (d === 0) return ev(bd); let best = col === "b" ? -Infinity : Infinity; for (const [f, t] of ms) { const s = search(apply(bd, f, t), col === "b" ? "w" : "b", d - 1, a, b); if (col === "b") { best = Math.max(best, s); a = Math.max(a, s); } else { best = Math.min(best, s); b = Math.min(b, s); } if (b <= a) break; } return best; }
    function status() { const ms = all(B, turn); if (!ms.length) { over = true; msg = inCheck(B, turn) ? (turn === "w" ? "Checkmate — computer wins" : "Checkmate — you win! 🎉") : "Stalemate — draw"; } else msg = (turn === "w" ? "Your move" : "Computer thinking…") + (inCheck(B, turn) ? " — CHECK" : ""); }
    function aiMove() { if (over) return; const ms = all(B, "b"); let best = -Infinity, bm = null; ms.sort(() => Math.random() - 0.5); for (const [f, t] of ms) { const s = search(apply(B, f, t), "w", 2, -Infinity, Infinity); if (s > best) { best = s; bm = [f, t]; } } if (bm) B = apply(B, bm[0], bm[1]); turn = "w"; status(); draw(); }
    function draw() {
      win.body.innerHTML = `<div style="padding:8px;background:#e9edf5;flex:1;display:flex;flex-direction:column;align-items:center;gap:6px"><div class="m" style="font-weight:600">${esc(msg)}</div><div class="bd" style="display:grid;grid-template-columns:repeat(8,48px);border:3px solid #543;"></div><button class="vs-btn nw">New game</button></div>`; const bd = win.body.querySelector(".bd");
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = B[r][c], isL = legal.some((m) => m[0] === r && m[1] === c); const d = h("div", "", p ? U[p] : isL ? "•" : ""); d.style.cssText = `width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:34px;cursor:pointer;background:${sel && sel[0] === r && sel[1] === c ? "#7fd" : isL ? "#9d6" : (r + c) % 2 ? "#a8754a" : "#f0d9b5"};color:${p && p[0] === "w" ? "#fff" : "#000"};text-shadow:${p && p[0] === "w" ? "0 0 2px #000,0 0 2px #000" : "none"}`;
        d.onclick = () => { if (over || turn !== "w") return; if (isL) { B = apply(B, sel, [r, c]); sel = null; legal = []; turn = "b"; status(); draw(); setTimeout(aiMove, 250); return; } if (p && p[0] === "w") { sel = [r, c]; legal = legalFor(B, r, c); } else { sel = null; legal = []; } draw(); }; bd.appendChild(d); }
      win.body.querySelector(".nw").onclick = init;
    }
    init();
  } });

  // ── Pinball ──
  reg({ id: "pinball", name: "3D Pinball (2D edition)", icon: "🎱", w: 360, h: 580, resizable: false, kw: "ball arcade", open(win, os) {
    win.body.style.background = "#10002a"; win.body.innerHTML = `<div style="color:#ffd02a;font:12px monospace;padding:4px 8px" class="hd"></div><canvas width="340" height="480" style="margin:0 auto;background:linear-gradient(#1a0040,#05000f)"></canvas><div style="color:#aaa;text-align:center;font-size:11px;padding:4px">←/Z left · →/M right · Space launch (or tap the buttons)</div><div style="display:flex;gap:10px;justify-content:center"><button class="vs-btn l">◀ Flip</button><button class="vs-btn sp">Launch</button><button class="vs-btn r">Flip ▶</button></div>`;
    const cv = win.body.querySelector("canvas"), c = cv.getContext("2d"), hd = win.body.querySelector(".hd"); let ball, score = 0, lives = 3, L = 0, R = 0, raf = 0, bump; const keys = {};
    // launch lane on the right (x 300–340): ball rests on its floor, shoots up, and the top-right deflector sends it into the table
    const WALLS = [{ x1: 300, y1: 135, x2: 300, y2: 475 }, { x1: 300, y1: 475, x2: 340, y2: 475 }, { x1: 340, y1: 85, x2: 262, y2: 12 }, { x1: 10, y1: 380, x2: 105, y2: 440 }, { x1: 300, y1: 380, x2: 235, y2: 440 }];
    const reset = () => { ball = { x: 320, y: 458, vx: 0, vy: 0, live: false }; bump = [{ x: 110, y: 150, r: 22 }, { x: 230, y: 150, r: 22 }, { x: 170, y: 230, r: 22 }, { x: 80, y: 260, r: 14 }, { x: 260, y: 260, r: 14 }]; };
    const FL = { l: { x: 105, y: 440, a0: 0.5, a1: -0.4, len: 62 }, r: { x: 235, y: 440, a0: Math.PI - 0.5, a1: Math.PI + 0.4, len: 62 } };
    function fl(f, p) { const a = f.a0 + (f.a1 - f.a0) * p; return { x1: f.x, y1: f.y, x2: f.x + Math.cos(a) * f.len * (f === FL.l ? 1 : 1), y2: f.y + Math.sin(a) * f.len }; }
    function hitSeg(s, moving) { const dx = s.x2 - s.x1, dy = s.y2 - s.y1, t = Math.max(0, Math.min(1, ((ball.x - s.x1) * dx + (ball.y - s.y1) * dy) / (dx * dx + dy * dy))), px = s.x1 + dx * t, py = s.y1 + dy * t, d = Math.hypot(ball.x - px, ball.y - py); if (d < 10 && d > 0) { const nx = (ball.x - px) / d, ny = (ball.y - py) / d, vn = ball.vx * nx + ball.vy * ny; if (vn < 0) { ball.vx -= 1.8 * vn * nx; ball.vy -= 1.8 * vn * ny; } ball.x = px + nx * 10; ball.y = py + ny * 10; if (moving) ball.vy -= 6; } }
    function step() {
      const sub = 3; for (let k = 0; k < sub; k++) { if (ball.live) { ball.vy += 0.09; ball.x += ball.vx / sub * 1; ball.y += ball.vy / sub * 1; } L += ((keys.l ? 1 : 0) - L) * 0.4 / sub * 3; R += ((keys.r ? 1 : 0) - R) * 0.4 / sub * 3; if (ball.x < 10) { ball.x = 10; ball.vx = Math.abs(ball.vx) * 0.8; } if (ball.x > 330) { ball.x = 330; ball.vx = -Math.abs(ball.vx) * 0.8; } if (ball.y < 10) { ball.y = 10; ball.vy = Math.abs(ball.vy) * 0.8; }
        bump.forEach((b) => { const d = Math.hypot(ball.x - b.x, ball.y - b.y); if (d < b.r + 8) { const nx = (ball.x - b.x) / d, ny = (ball.y - b.y) / d; ball.vx = nx * 5; ball.vy = ny * 5; ball.x = b.x + nx * (b.r + 8); ball.y = b.y + ny * (b.r + 8); score += 100; b.hit = 6; } });
        hitSeg(fl(FL.l, L), keys.l && L < 0.9); hitSeg(fl(FL.r, R), keys.r && R < 0.9);
        WALLS.forEach((w) => hitSeg(w, false));
        if (ball.y > 500) { lives--; if (lives <= 0) { os.notify("Pinball", "Game over! Score " + score, "🎱"); lives = 3; score = 0; } reset(); } }
      c.clearRect(0, 0, 340, 480); bump.forEach((b) => { c.fillStyle = b.hit > 0 ? "#fff" : "#ff2a8a"; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.strokeStyle = "#ffd02a"; c.lineWidth = 3; c.stroke(); if (b.hit > 0) b.hit--; });
      c.strokeStyle = "#2affd5"; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); WALLS.forEach((w) => { c.moveTo(w.x1, w.y1); c.lineTo(w.x2, w.y2); }); c.stroke();
      if (!ball.live) { c.fillStyle = "#ffd02a"; c.font = "11px monospace"; c.fillText("SPACE ▲", 304, 495); }
      c.strokeStyle = "#ff9a1f"; c.lineWidth = 9; c.lineCap = "round"; [fl(FL.l, L), fl(FL.r, R)].forEach((s) => { c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke(); });
      c.fillStyle = "#fff"; c.beginPath(); c.arc(ball.x, ball.y, 8, 0, 7); c.fill(); hd.textContent = `SCORE ${score}    BALLS ${lives}`; raf = requestAnimationFrame(step);
    }
    const launch = () => { if (!ball.live || (ball.x > 302 && ball.y > 400 && Math.abs(ball.vy) < 1)) { ball.live = true; ball.vx = 0; ball.vy = -15.6 - Math.random() * 0.8; } };
    const kd = (e) => { if (!win.el.contains(document.activeElement) && !win.el.classList.contains("blur") === false) {} if (win.el.classList.contains("blur")) return; if (["ArrowLeft", "KeyZ"].includes(e.code)) keys.l = true; if (["ArrowRight", "KeyM"].includes(e.code)) keys.r = true; if (e.code === "Space") { e.preventDefault(); launch(); } }, ku = (e) => { if (["ArrowLeft", "KeyZ"].includes(e.code)) keys.l = false; if (["ArrowRight", "KeyM"].includes(e.code)) keys.r = false; };
    document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
    const hold = (sel, k) => { const b = win.body.querySelector(sel); b.onpointerdown = () => (keys[k] = true); b.onpointerup = b.onpointerleave = () => (keys[k] = false); }; hold(".l", "l"); hold(".r", "r"); win.body.querySelector(".sp").onclick = launch;
    win.onClose = () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); return true; }; reset(); step();
  } });

  // ── Snake (hidden) ──
  reg({ id: "snake", name: "Snake", icon: "🐍", w: 360, h: 420, resizable: false, hidden: true, open(win, os) {
    win.body.style.background = "#000"; win.body.innerHTML = `<div style="color:#0f0;font:12px monospace;padding:4px 8px" class="s">Score 0 · arrows to steer</div><canvas width="320" height="320" style="margin:0 auto;border:2px solid #0a0"></canvas>`; const cv = win.body.querySelector("canvas"), c = cv.getContext("2d"), s = win.body.querySelector(".s");
    let sn, d, f, sc, iv; const N = 16, P = 20; const init = () => { sn = [[8, 8], [7, 8], [6, 8]]; d = [1, 0]; sc = 0; food(); clearInterval(iv); iv = setInterval(tick, 110); }; const food = () => { do f = [(Math.random() * N) | 0, (Math.random() * N) | 0]; while (sn.some((p) => p[0] === f[0] && p[1] === f[1])); };
    function tick() { const hd = [sn[0][0] + d[0], sn[0][1] + d[1]]; if (hd[0] < 0 || hd[1] < 0 || hd[0] >= N || hd[1] >= N || sn.some((p) => p[0] === hd[0] && p[1] === hd[1])) { s.textContent = `Game over · score ${sc} · press any arrow`; clearInterval(iv); iv = null; return; } sn.unshift(hd); if (hd[0] === f[0] && hd[1] === f[1]) { sc += 10; food(); s.textContent = "Score " + sc; } else sn.pop(); c.fillStyle = "#000"; c.fillRect(0, 0, 320, 320); c.fillStyle = "#f33"; c.fillRect(f[0] * P, f[1] * P, P - 2, P - 2); c.fillStyle = "#0f0"; sn.forEach((p) => c.fillRect(p[0] * P, p[1] * P, P - 2, P - 2)); }
    const kd = (e) => { const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.code]; if (!m || win.el.classList.contains("blur")) return; e.preventDefault(); if (m[0] !== -d[0] || m[1] !== -d[1]) d = m; if (!iv) init(); };
    document.addEventListener("keydown", kd); win.onClose = () => { clearInterval(iv); document.removeEventListener("keydown", kd); return true; }; init();
  } });
})();
