/* Vista apps: Explorer, Internet Explorer, Notepad, WordPad, Paint, Calculator, Media Player, Photos,
   Movie Maker, Command Prompt, Task Manager, Control Panel, Calendar, Sticky Notes, Snipping Tool, Recycle Bin, About. */
(function () {
  const V = window.VISTA, h = V.h, esc = V.esc, fs = V.fs, store = (k, d) => { try { const v = localStorage.getItem("vista_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, put = (k, v) => { try { localStorage.setItem("vista_" + k, JSON.stringify(v)); } catch (e) {} };
  const reg = (d) => V.registerApp(d);
  const wrapMenu = (win, spec) => {
    const bar = h("div", "vs-menubar"); win.body.appendChild(bar);
    const closeM = () => bar.querySelectorAll(".vs-menu").forEach((m) => m.remove());
    Object.keys(spec).forEach((name) => { const s = h("span", "", name); s.onclick = (e) => { e.stopPropagation(); const was = bar.querySelector(".vs-menu"); closeM(); if (was) return; const m = h("div", "vs-menu"); m.style.left = s.offsetLeft + "px"; m.style.top = "22px";
      spec[name].forEach((it) => { if (it === "-") return m.appendChild(h("hr")); const d = h("div", "", esc(it[0])); d.onclick = (ev) => { ev.stopPropagation(); closeM(); it[1](); }; m.appendChild(d); }); bar.appendChild(m); }; bar.appendChild(s); });
    win.body.addEventListener("pointerdown", (e) => { if (!e.target.closest(".vs-menu") && !e.target.closest(".vs-menubar > span")) closeM(); }, true);
    return bar;
  };
  const guard = (win, os, dirty, save) => { win.onClose = () => { if (!dirty() || win.force) return true; os.modal("Unsaved changes", `Save changes to <b>${esc(win.title)}</b>?`, [["Save", () => { save(() => { win.force = true; win.close(); }); }], ["Don't Save", () => { win.force = true; win.close(); }], ["Cancel"]]); return false; }; };
  const fname = (p) => p.split("\\").pop();

  // ── Explorer ──
  const driveCap = { "C:": 120, "D:": 0 };
  reg({ id: "explorer", name: "Windows Explorer", icon: "📁", w: 640, h: 420, kw: "files folder computer", open(win, os, arg) { explorer(win, os, arg || ""); } });
  reg({ id: "computer", name: "Computer", icon: "🖥️", kw: "my computer drives", run: () => V.openApp("explorer", "") });
  function explorer(win, os, start) {
    let path = start, hist = [start], hi = 0;
    win.body.innerHTML = `<div class="vs-tool"><button class="vs-btn bk">◀</button><button class="vs-btn fw">▶</button><button class="vs-btn up">⬆</button><input class="vs-in ad" style="flex:1"><button class="vs-btn nf">New folder</button></div><div style="display:flex;flex:1;min-height:0"><div class="nav" style="width:130px;background:#e8eef7;border-right:1px solid #c5ccd8;padding:6px;overflow:auto"></div><div class="ls" style="flex:1;overflow:auto;background:#fff;padding:8px;display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start"></div></div><div class="vs-status"></div>`;
    const ls = win.body.querySelector(".ls"), ad = win.body.querySelector(".ad"), st = win.body.querySelector(".vs-status");
    const nav = win.body.querySelector(".nav"); const home = os.home();
    [["🖥️ Computer", ""], ["🖥️ Desktop", home + "\\Desktop"], ["📄 Documents", home + "\\Documents"], ["🖼️ Pictures", home + "\\Pictures"], ["🎵 Music", home + "\\Music"], ["🎬 Videos", home + "\\Videos"]].forEach(([l, p]) => { const d = h("div", "", l); d.style.cssText = "padding:4px;cursor:pointer;border-radius:3px"; d.onmouseenter = () => (d.style.background = "#cfe3fa"); d.onmouseleave = () => (d.style.background = ""); d.onclick = () => go(p); nav.appendChild(d); });
    function go(p, push = true) { path = p; if (push) { hist = hist.slice(0, hi + 1); hist.push(p); hi = hist.length - 1; } draw(); }
    function draw() {
      ad.value = path || "Computer"; ls.innerHTML = ""; win.setTitle(path ? fname(path) || path : "Computer");
      if (!path) { ["C:", "D:"].forEach((dv) => { const n = fs.get(dv); const used = dv === "C:" ? 38 + fs.size(n) / 1e6 : 0, cap = driveCap[dv] || 4.7; const label = dv === "C:" ? "Local Disk (C:)" : "DVD RW Drive (D:)"; const d = h("div", "", `<div style="font-size:40px">${dv === "C:" ? "💽" : "💿"}</div><b>${label}</b><div style="width:150px;height:12px;border:1px solid #666;background:#ddd;margin:4px 0"><div style="width:${Math.min(100, (used / cap) * 100)}%;height:100%;background:linear-gradient(#6cf,#27c)"></div></div><small>${(cap - used).toFixed(1)} GB free of ${cap} GB</small>`); d.style.cssText = "width:170px;padding:8px;cursor:default;border:1px solid transparent;border-radius:4px"; d.ondblclick = () => go(dv); d.onmouseenter = () => (d.style.borderColor = "#9ec2f2"); d.onmouseleave = () => (d.style.borderColor = "transparent"); ls.appendChild(d); }); st.textContent = "2 items"; return; }
      const items = fs.list(path).filter((n) => !(n.n === "$Recycle.Bin")).slice().sort((a, b) => (b.d ? 1 : 0) - (a.d ? 1 : 0) || a.n.localeCompare(b.n));
      items.forEach((n) => { const full = path + "\\" + n.n; const d = h("div", "", `<div style="font-size:34px">${n.d ? "📁" : V.fileIcon(n.n)}</div><div style="word-break:break-word">${esc(n.n)}</div>`); d.style.cssText = "width:92px;text-align:center;padding:6px 2px;border:1px solid transparent;border-radius:4px;font-size:12px"; d.onmouseenter = () => (d.style.background = "#dcebfc"); d.onmouseleave = () => (d.style.background = "");
        d.ondblclick = () => (n.d ? go(full) : V.openPath(full)); d.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); os.ctxMenu(e, [["Open", () => d.ondblclick()], ["Rename", () => os.prompt("Rename", "New name:", n.n, (v) => { if (v && fs.rename(full, v)) draw(); })], ["Delete", () => os.confirm("Delete", `Move <b>${esc(n.n)}</b> to the Recycle Bin?`, () => { fs.remove(full); draw(); os.renderIcons(); })], ["Properties", () => os.alert("Properties", `<b>${esc(n.n)}</b><br>${n.d ? "Folder" : "File"}<br>Size: ${fs.size(n)} bytes<br>${esc(full)}`)]]); }; ls.appendChild(d); });
      if (!items.length) ls.innerHTML = '<div style="color:#888;padding:20px">This folder is empty.</div>'; st.textContent = items.length + " item(s)";
    }
    ls.oncontextmenu = (e) => { e.preventDefault(); if (!path) return; os.ctxMenu(e, [["New Folder", () => nf()], ["New Text Document", () => { fs.write(path + "\\New Text " + (Date.now() % 1000) + ".txt", ""); draw(); }], ["Refresh", draw]]); };
    const nf = () => os.prompt("New folder", "Folder name:", "New Folder", (v) => { if (v && path) { fs.mkdir(path + "\\" + v); draw(); os.renderIcons(); } });
    win.body.querySelector(".nf").onclick = nf;
    win.body.querySelector(".bk").onclick = () => { if (hi > 0) { hi--; go(hist[hi], false); } };
    win.body.querySelector(".fw").onclick = () => { if (hi < hist.length - 1) { hi++; go(hist[hi], false); } };
    win.body.querySelector(".up").onclick = () => { if (!path) return; const p = path.split("\\"); p.pop(); go(p.join("\\")); };
    ad.onkeydown = (e) => { if (e.key === "Enter") { const v = ad.value.trim(); if (!v || v.toLowerCase() === "computer") go(""); else if (fs.get(v) && fs.get(v).d) go(v); else os.alert("Windows Explorer", "Windows can't find '" + esc(v) + "'."); } };
    draw();
  }
  reg({ id: "recycle", name: "Recycle Bin", icon: "🗑️", w: 520, h: 360, single: true, open(win, os) {
    win.body.innerHTML = `<div class="vs-tool"><button class="vs-btn em">Empty the Recycle Bin</button><button class="vs-btn rs">Restore selected</button></div><div class="ls" style="flex:1;overflow:auto;background:#fff"></div><div class="vs-status"></div>`;
    const ls = win.body.querySelector(".ls"); let sel = null;
    const draw = () => { ls.innerHTML = ""; const it = fs.list("C:\\$Recycle.Bin"); it.forEach((n) => { const r = h("div", "", `<span style="font-size:20px">${n.d ? "📁" : V.fileIcon(n.n)}</span> <b>${esc(n.n)}</b> <small style="color:#777">from ${esc(n.orig || "")}</small>`); r.style.cssText = "padding:6px 8px;border-bottom:1px solid #eee;cursor:default" + (sel === n.n ? ";background:#cfe3fa" : ""); r.onclick = () => { sel = n.n; draw(); }; ls.appendChild(r); }); if (!it.length) ls.innerHTML = '<div style="padding:20px;color:#888">The Recycle Bin is empty.</div>'; win.body.querySelector(".vs-status").textContent = it.length + " item(s)"; os.renderIcons(); };
    win.body.querySelector(".em").onclick = () => os.confirm("Empty Recycle Bin", "Permanently delete all items? This can't be undone.", () => { fs.emptyBin(); draw(); });
    win.body.querySelector(".rs").onclick = () => { if (sel && fs.restore(sel)) { sel = null; draw(); } };
    draw();
  } });

  // ── Notepad ──
  reg({ id: "notepad", name: "Notepad", icon: "📝", w: 560, h: 380, kw: "text editor", open(win, os, arg) {
    let file = null, dirty = false;
    const ta = h("textarea"); ta.style.cssText = "flex:1;border:0;outline:none;resize:none;padding:6px;font:14px Consolas,monospace;white-space:pre;overflow:auto"; ta.spellcheck = false;
    const setT = () => win.setTitle((file ? fname(file) : "Untitled") + (dirty ? "*" : "") + " - Notepad");
    const doSave = (after) => { if (file) { fs.write(file, ta.value); dirty = false; setT(); os.renderIcons(); if (after) after(); } else saveAs(after); };
    const saveAs = (after) => os.fileDialog("save", os.home() + "\\Documents", "Untitled.txt", (p) => { fs.write(p, ta.value); file = p; dirty = false; setT(); os.renderIcons(); if (after) after(); });
    const load = (p) => { const v = fs.read(p); if (v === null) return; file = p; ta.value = v; dirty = false; setT(); };
    wrapMenu(win, { File: [["New", () => { file = null; ta.value = ""; dirty = false; setT(); }], ["Open…", () => os.fileDialog("open", os.home() + "\\Documents", "", load)], ["Save", () => doSave()], ["Save As…", () => saveAs()], "-", ["Exit", () => win.close()]],
      Edit: [["Select All", () => { ta.focus(); ta.select(); }], ["Find…", () => findDlg(false)], ["Replace…", () => findDlg(true)], ["Time/Date", () => { ta.setRangeText(os.now().toLocaleString(), ta.selectionStart, ta.selectionEnd, "end"); }]],
      Format: [["Word Wrap", () => { ta.style.whiteSpace = ta.style.whiteSpace === "pre" ? "pre-wrap" : "pre"; }]] });
    win.body.appendChild(ta); ta.oninput = () => { dirty = true; setT(); };
    function findDlg(rep) { os.modal(rep ? "Replace" : "Find", `Find what: <input class="vs-in f" style="width:160px">${rep ? '<br><br>Replace with: <input class="vs-in r" style="width:160px">' : ""}`, [["Find Next", (d) => { const q = d.querySelector(".f").value; const i = ta.value.indexOf(q, ta.selectionEnd); const j = i < 0 ? ta.value.indexOf(q) : i; if (j >= 0) { ta.focus(); ta.setSelectionRange(j, j + q.length); } else os.alert("Notepad", "Cannot find '" + esc(q) + "'"); return false; }], ...(rep ? [["Replace All", (d) => { const q = d.querySelector(".f").value; if (q) { ta.value = ta.value.split(q).join(d.querySelector(".r").value); dirty = true; setT(); } }]] : []), ["Close"]]); }
    guard(win, os, () => dirty, doSave); setT(); if (arg && typeof arg === "string" && fs.get(arg)) load(arg); ta.focus();
  } });

  // ── WordPad ──
  reg({ id: "wordpad", name: "WordPad", icon: "📘", w: 600, h: 420, kw: "word rich text", open(win, os, arg) {
    let file = null, dirty = false;
    const bar = h("div", "vs-tool"); bar.innerHTML = `<button class="vs-btn" data-c="bold"><b>B</b></button><button class="vs-btn" data-c="italic"><i>I</i></button><button class="vs-btn" data-c="underline"><u>U</u></button><select class="vs-in sz"><option value="2">Small</option><option value="3" selected>Normal</option><option value="5">Large</option><option value="7">Huge</option></select><button class="vs-btn" data-c="justifyLeft">⯇</button><button class="vs-btn" data-c="justifyCenter">≡</button><button class="vs-btn" data-c="justifyRight">⯈</button><button class="vs-btn" data-c="insertUnorderedList">• List</button><input type="color" class="co" value="#000000" title="Text colour">`;
    const ed = h("div"); ed.contentEditable = "true"; ed.style.cssText = "flex:1;background:#fff;padding:16px 22px;overflow:auto;font:14px Calibri,Segoe UI,sans-serif;outline:none;margin:8px;border:1px solid #bbb"; ed.innerHTML = "";
    const setT = () => win.setTitle((file ? fname(file) : "Document") + (dirty ? "*" : "") + " - WordPad");
    const doSave = (after) => { const go = (p) => { fs.write(p, ed.innerHTML); file = p; dirty = false; setT(); os.renderIcons(); if (after) after(); }; if (file) go(file); else os.fileDialog("save", os.home() + "\\Documents", "Document.rtf", go); };
    wrapMenu(win, { File: [["New", () => { file = null; ed.innerHTML = ""; dirty = false; setT(); }], ["Open…", () => os.fileDialog("open", os.home() + "\\Documents", "", (p) => { const v = fs.read(p); if (v !== null) { file = p; ed.innerHTML = p.endsWith(".rtf") ? v : esc(v).replace(/\n/g, "<br>"); dirty = false; setT(); } })], ["Save", () => doSave()], "-", ["Exit", () => win.close()]] });
    win.body.append(bar, ed);
    bar.querySelectorAll("[data-c]").forEach((b) => (b.onmousedown = (e) => { e.preventDefault(); document.execCommand(b.dataset.c); dirty = true; setT(); }));
    bar.querySelector(".sz").onchange = (e) => { ed.focus(); document.execCommand("fontSize", false, e.target.value); }; bar.querySelector(".co").oninput = (e) => { ed.focus(); document.execCommand("foreColor", false, e.target.value); };
    ed.oninput = () => { dirty = true; setT(); }; guard(win, os, () => dirty, doSave); setT();
    if (arg && typeof arg === "string" && fs.get(arg)) { file = arg; ed.innerHTML = fs.read(arg); setT(); }
  } });

  // ── Paint ──
  reg({ id: "paint", name: "Paint", icon: "🎨", w: 720, h: 520, kw: "draw image", open(win, os, arg) {
    const tools = ["pencil", "brush", "eraser", "fill", "line", "rect", "ellipse", "picker"], icon = { pencil: "✏️", brush: "🖌️", eraser: "🧽", fill: "🪣", line: "╱", rect: "▭", ellipse: "◯", picker: "💧" };
    win.body.innerHTML = `<div class="vs-tool tl"></div><div class="vs-tool pal"></div><div style="flex:1;overflow:auto;background:#7b8fa8;padding:8px"><canvas width="640" height="380" style="background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:crosshair;touch-action:none"></canvas></div><div class="vs-status">Ready</div>`;
    const cv = win.body.querySelector("canvas"), ctx = cv.getContext("2d", { willReadFrequently: true }); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 640, 380);
    let tool = "pencil", color = "#000000", size = 3, undo = [], redo = [], file = null;
    const snap = () => { undo.push(ctx.getImageData(0, 0, 640, 380)); if (undo.length > 40) undo.shift(); redo = []; };
    const tl = win.body.querySelector(".tl"), pal = win.body.querySelector(".pal"), stat = win.body.querySelector(".vs-status");
    tools.forEach((t) => { const b = h("button", "vs-btn", icon[t]); b.title = t; b.onclick = () => { tool = t; tl.querySelectorAll(".vs-btn").forEach((x) => (x.style.outline = "")); b.style.outline = "2px solid #3a78d8"; }; tl.appendChild(b); if (t === "pencil") b.style.outline = "2px solid #3a78d8"; });
    const sz = h("input"); sz.type = "range"; sz.min = 1; sz.max = 30; sz.value = 3; sz.oninput = () => (size = +sz.value); const cp = h("input"); cp.type = "color"; cp.value = color; cp.oninput = () => (color = cp.value);
    const ub = h("button", "vs-btn", "↶ Undo"), rb = h("button", "vs-btn", "↷ Redo"), sb = h("button", "vs-btn", "💾 Save"), eb = h("button", "vs-btn", "⬇ Export PNG"), cb = h("button", "vs-btn", "New");
    ub.onclick = () => { if (undo.length) { redo.push(ctx.getImageData(0, 0, 640, 380)); ctx.putImageData(undo.pop(), 0, 0); } }; rb.onclick = () => { if (redo.length) { undo.push(ctx.getImageData(0, 0, 640, 380)); ctx.putImageData(redo.pop(), 0, 0); } };
    cb.onclick = () => { snap(); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 640, 380); file = null; win.setTitle("untitled - Paint"); };
    const save = () => { const go = (p) => { fs.write(p, cv.toDataURL("image/png")); file = p; win.setTitle(fname(p) + " - Paint"); os.notify("Paint", "Saved " + fname(p), "🎨"); os.renderIcons(); }; if (file) go(file); else os.fileDialog("save", os.home() + "\\Pictures", "drawing.png", (p) => go(p.endsWith(".png") ? p : p + ".png")); };
    sb.onclick = save; eb.onclick = () => { const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = "paint.png"; a.click(); };
    tl.append(h("span", "", " Size"), sz, cp, ub, rb, cb, sb, eb);
    ["#000000", "#7f7f7f", "#880015", "#ed1c24", "#ff7f27", "#fff200", "#22b14c", "#00a2e8", "#3f48cc", "#a349a4", "#ffffff", "#c3c3c3", "#b97a57", "#ffaec9", "#ffc90e", "#b5e61d", "#99d9ea", "#7092be"].forEach((c) => { const b = h("div"); b.style.cssText = `width:20px;height:20px;background:${c};border:1px solid #555;cursor:pointer`; b.onclick = () => { color = c; cp.value = c; }; pal.appendChild(b); });
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (640 / r.width), (e.clientY - r.top) * (380 / r.height)]; };
    function flood(x, y, fill) { const id = ctx.getImageData(0, 0, 640, 380), d = id.data; x |= 0; y |= 0; const i0 = (y * 640 + x) * 4, tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2]; const f = [parseInt(fill.slice(1, 3), 16), parseInt(fill.slice(3, 5), 16), parseInt(fill.slice(5, 7), 16)]; if (tr === f[0] && tg === f[1] && tb === f[2]) return; const st = [[x, y]]; while (st.length) { const [px, py] = st.pop(); if (px < 0 || py < 0 || px >= 640 || py >= 380) continue; const i = (py * 640 + px) * 4; if (d[i] !== tr || d[i + 1] !== tg || d[i + 2] !== tb) continue; d[i] = f[0]; d[i + 1] = f[1]; d[i + 2] = f[2]; d[i + 3] = 255; st.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]); } ctx.putImageData(id, 0, 0); }
    let down = null, base = null;
    cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); const p = pos(e); if (tool === "picker") { const d = ctx.getImageData(p[0] | 0, p[1] | 0, 1, 1).data; color = "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join(""); cp.value = color; return; } snap(); if (tool === "fill") { flood(p[0], p[1], color); return; } down = p; base = ctx.getImageData(0, 0, 640, 380); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = tool === "eraser" ? "#fff" : color; ctx.lineWidth = tool === "pencil" ? 1 : tool === "eraser" ? size * 3 : size * (tool === "brush" ? 2 : 1); if (tool === "pencil" || tool === "brush" || tool === "eraser") { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 0.1, p[1]); ctx.stroke(); } };
    cv.onpointermove = (e) => { const p = pos(e); stat.textContent = `${p[0] | 0}, ${p[1] | 0} px`; if (!down) return; if (tool === "pencil" || tool === "brush" || tool === "eraser") { ctx.lineTo(p[0], p[1]); ctx.stroke(); } else { ctx.putImageData(base, 0, 0); ctx.beginPath(); if (tool === "line") { ctx.moveTo(down[0], down[1]); ctx.lineTo(p[0], p[1]); } else if (tool === "rect") ctx.rect(down[0], down[1], p[0] - down[0], p[1] - down[1]); else if (tool === "ellipse") ctx.ellipse((down[0] + p[0]) / 2, (down[1] + p[1]) / 2, Math.abs(p[0] - down[0]) / 2, Math.abs(p[1] - down[1]) / 2, 0, 0, 7); ctx.stroke(); } };
    cv.onpointerup = () => (down = null); cv.onpointercancel = () => (down = null);
    win.setTitle("untitled - Paint");
    if (arg && typeof arg === "string" && fs.get(arg)) { const v = fs.read(arg); if (v && v.startsWith("data:")) { const im = new Image(); im.onload = () => { ctx.drawImage(im, 0, 0); file = arg; win.setTitle(fname(arg) + " - Paint"); }; im.src = v; } }
  } });

  // ── Calculator ──
  reg({ id: "calculator", name: "Calculator", icon: "🧮", w: 250, h: 340, resizable: false, kw: "math", open(win) {
    win.body.style.background = "#dfe6f2"; let cur = "0", acc = null, op = null, fresh = true;
    win.body.innerHTML = `<div class="dp" style="margin:8px;padding:8px;background:#fff;border:1px solid #889;text-align:right;font:26px Consolas,monospace;height:48px;overflow:hidden"></div><div class="g" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:0 8px 8px;flex:1"></div>`;
    const dp = win.body.querySelector(".dp"), g = win.body.querySelector(".g"); const show = () => (dp.textContent = cur);
    const calc = (a, b, o) => ({ "+": a + b, "-": a - b, "×": a * b, "÷": b === 0 ? NaN : a / b }[o]);
    const press = (k) => {
      if (/\d/.test(k)) { if (fresh) { cur = k; fresh = false; } else if (cur.length < 14) cur = cur === "0" ? k : cur + k; }
      else if (k === ".") { if (fresh) { cur = "0."; fresh = false; } else if (!cur.includes(".")) cur += "."; }
      else if (["+", "-", "×", "÷"].includes(k)) { if (op && !fresh) { acc = calc(acc, parseFloat(cur), op); cur = String(+acc.toPrecision(12)); } else acc = parseFloat(cur); op = k; fresh = true; }
      else if (k === "=") { if (op) { acc = calc(acc, parseFloat(cur), op); cur = isNaN(acc) ? "Cannot divide by zero" : String(+acc.toPrecision(12)); op = null; fresh = true; } }
      else if (k === "C") { cur = "0"; acc = null; op = null; fresh = true; } else if (k === "⌫") { cur = cur.length > 1 && !fresh ? cur.slice(0, -1) : "0"; }
      else if (k === "%") { cur = String(+(parseFloat(cur) * (acc !== null && op ? acc / 100 : 0.01)).toPrecision(12)); fresh = false; } else if (k === "±") cur = String(-parseFloat(cur)); else if (k === "√") { cur = String(+Math.sqrt(parseFloat(cur)).toPrecision(12)); fresh = true; }
      show();
    };
    ["C", "⌫", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "±", "0", ".", "="].forEach((k) => { const b = h("button", "vs-btn", k); b.style.fontSize = "16px"; b.onclick = () => press(k); g.appendChild(b); });
    win.el.addEventListener("keydown", (e) => { const m = { "*": "×", "/": "÷", Enter: "=", Backspace: "⌫", Escape: "C" }; const k = m[e.key] || e.key; if (/^[\d.+\-%=]$/.test(k) || Object.values(m).includes(k)) { e.preventDefault(); press(k); } }); win.el.tabIndex = 0; win.el.focus(); show();
  } });

  // ── Internet Explorer 7 ──
  reg({ id: "ie", name: "Internet Explorer", icon: "🌐", w: 700, h: 460, kw: "browser web", open(win, os) {
    const pages = {
      "ie://home": () => `<div style="text-align:center;padding:30px 20px"><div style="font:italic 46px Georgia;color:#1a5fb4">Harj<span style="color:#e8892a">Search</span></div><p style="color:#666">The totally-real search engine of 2007</p><p style="margin-top:18px"><a data-go="ie://about">About Harjyot</a> · <a data-go="ie://work">Work</a> · <a data-go="ie://fun">Fun &amp; Games</a> · <a data-go="ie://news">News</a></p></div>`,
      "ie://about": () => `<div style="padding:20px"><h2>About Harjyot Sohal</h2><p>Video editor &amp; motion graphics artist. Storytelling that blends editorial precision with striking visuals, across music videos, documentaries, ads and digital media — After Effects, Premiere Pro and Photoshop.</p><p><a href="https://www.linkedin.com/in/harjyot-sohal-07366a95/" target="_blank">LinkedIn ↗</a></p></div>`,
      "ie://work": () => `<div style="padding:20px"><h2>Selected Work</h2><ul><li>FanDuel · Gate 14 · Schneiders</li><li>OwnersBox livestream + campaigns</li><li>Linemate · BET99 short-form</li><li>Featured longform YouTube edits</li></ul><p>Close this and scroll the portfolio to see them in full.</p></div>`,
      "ie://fun": () => `<div style="padding:20px"><h2>Fun &amp; Games</h2><p>Try <b>Minesweeper</b>, <b>Solitaire</b>, <b>Chess</b> and <b>Pinball</b> from the Games folder in the Start menu. Secret: type <code>secret</code> in Command Prompt.</p></div>`,
      "ie://news": () => `<div style="padding:20px"><h2>Headlines (2007)</h2><ul><li>Local man still uses Internet Explorer 7 voluntarily</li><li>Windows Vista: "It's actually fine now"</li><li>Zune enjoys quiet week</li></ul></div>`,
    };
    win.body.innerHTML = `<div class="vs-tool"><button class="vs-btn bk">◀</button><button class="vs-btn fw">▶</button><button class="vs-btn rf">⟳</button><button class="vs-btn hm">🏠</button><input class="vs-in ad" style="flex:1"><input class="vs-in sq" placeholder="Search" style="width:130px"><button class="vs-btn gs">🔍</button></div><div class="tabs" style="display:flex;gap:2px;background:#cfd8e8;padding:3px 4px 0"></div><div class="vs-menubar bm" style="padding:2px 6px;gap:10px;font-size:11px"></div><div class="pg" style="flex:1;overflow:auto;background:#fff"></div>`;
    const ad = win.body.querySelector(".ad"), pg = win.body.querySelector(".pg"), tabsEl = win.body.querySelector(".tabs");
    let tabs = [{ url: "ie://home", hist: ["ie://home"], i: 0 }], cur = 0;
    const bms = [["Home", "ie://home"], ["About", "ie://about"], ["Work", "ie://work"], ["Fun", "ie://fun"], ["News", "ie://news"]];
    bms.forEach(([l, u]) => { const s = h("a", "", "⭐ " + l); s.style.cursor = "pointer"; s.onclick = () => nav(u); win.body.querySelector(".bm").appendChild(s); });
    function render() {
      tabsEl.innerHTML = ""; tabs.forEach((t, i) => { const b = h("div", "", `${esc(t.url.replace("ie://", "") || "tab")} <span style="cursor:pointer;opacity:.6">✕</span>`); b.style.cssText = "padding:3px 10px;border:1px solid #99a;border-bottom:0;border-radius:4px 4px 0 0;font-size:11px;cursor:pointer;background:" + (i === cur ? "#fff" : "#e5ebf5"); b.onclick = () => { cur = i; render(); }; b.querySelector("span").onclick = (e) => { e.stopPropagation(); if (tabs.length > 1) { tabs.splice(i, 1); cur = Math.max(0, Math.min(cur, tabs.length - 1)); render(); } }; tabsEl.appendChild(b); });
      const plus = h("div", "", "＋"); plus.style.cssText = "padding:3px 8px;cursor:pointer"; plus.onclick = () => { tabs.push({ url: "ie://home", hist: ["ie://home"], i: 0 }); cur = tabs.length - 1; render(); }; tabsEl.appendChild(plus);
      const t = tabs[cur]; ad.value = t.url; win.setTitle(t.url.replace("ie://", "") + " - Windows Internet Explorer");
      if (pages[t.url]) pg.innerHTML = pages[t.url](); else if (t.url.startsWith("ie://search/")) { const q = decodeURIComponent(t.url.slice(12)); const hits = Object.keys(pages).filter((k) => (pages[k]() + k).toLowerCase().includes(q.toLowerCase())); pg.innerHTML = `<div style="padding:20px"><h3>Results for "${esc(q)}"</h3>${hits.map((k) => `<p><a data-go="${k}" style="cursor:pointer">${k}</a></p>`).join("") || "<p>No results. (This search engine only knows the portfolio.)</p>"}</div>`; }
      else pg.innerHTML = `<div style="padding:30px"><h2 style="color:#c00">Internet Explorer cannot display the webpage</h2><p>Real websites can't load inside this tiny simulated browser.</p><p><a href="${/^https?:/.test(t.url) ? esc(t.url) : "https://" + esc(t.url)}" target="_blank" rel="noopener">Open ${esc(t.url)} in a real browser tab ↗</a></p></div>`;
      pg.querySelectorAll("[data-go]").forEach((a) => { a.style.cssText += ";color:#1a5fb4;cursor:pointer;text-decoration:underline"; a.onclick = () => nav(a.dataset.go); });
    }
    function nav(u) { const t = tabs[cur]; if (!/^(ie:|https?:)/.test(u)) u = /\s|^[^.]+$/.test(u) ? "ie://search/" + encodeURIComponent(u) : "https://" + u; t.hist = t.hist.slice(0, t.i + 1); t.hist.push(u); t.i++; t.url = u; render(); }
    const q = (s) => win.body.querySelector(s);
    q(".bk").onclick = () => { const t = tabs[cur]; if (t.i > 0) { t.i--; t.url = t.hist[t.i]; render(); } }; q(".fw").onclick = () => { const t = tabs[cur]; if (t.i < t.hist.length - 1) { t.i++; t.url = t.hist[t.i]; render(); } };
    q(".rf").onclick = render; q(".hm").onclick = () => nav("ie://home"); ad.onkeydown = (e) => { if (e.key === "Enter") nav(ad.value.trim()); };
    const doS = () => { const v = q(".sq").value.trim(); if (v) nav("ie://search/" + encodeURIComponent(v)); }; q(".gs").onclick = doS; q(".sq").onkeydown = (e) => { if (e.key === "Enter") doS(); };
    render();
  } });

  // ── Media Player (synthesized music, real playback + visualizer) ──
  const TRACKS = [
    { t: "Citrus Sunrise", a: "Harj Synth", e: "🍊", c: ["#ff9a1f", "#a83a00"], bpm: 112, lead: [0, 4, 7, 12, 7, 4, 7, 9, 5, 9, 12, 17, 12, 9, 7, 4], bass: [-24, -24, -17, -19] },
    { t: "Vista Dreams", a: "Aero Glass", e: "🌊", c: ["#2a8fd0", "#0b3a68"], bpm: 90, lead: [0, 3, 7, 10, 12, 10, 7, 3, -2, 2, 5, 9, 12, 9, 5, 2], bass: [-24, -21, -26, -23] },
    { t: "Pixel Parade", a: "8-Bit Heroes", e: "🎮", c: ["#58d854", "#144a10"], bpm: 140, lead: [0, 0, 12, 0, 0, 10, 0, 7, 5, 5, 17, 5, 5, 15, 5, 3], bass: [-24, -12, -19, -7] },
  ];
  reg({ id: "wmp", name: "Windows Media Player", icon: "🎵", w: 560, h: 420, single: true, kw: "music audio", open(win, os) {
    win.body.style.background = "linear-gradient(#0d2a52,#04101f)"; win.body.style.color = "#fff";
    win.body.innerHTML = `<div style="display:flex;gap:12px;padding:12px;flex:1;min-height:0"><div style="flex:1;display:flex;flex-direction:column;gap:8px"><div class="art" style="height:90px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:46px"></div><canvas class="vz" width="320" height="110" style="width:100%;height:110px;background:#000;border-radius:6px"></canvas><div class="tt" style="font-weight:600"></div></div><div class="pl" style="width:170px;background:rgba(255,255,255,.08);border-radius:6px;padding:4px;overflow:auto"></div></div><div style="padding:6px 12px 12px"><input class="pr" type="range" min="0" max="100" value="0" style="width:100%"><div style="display:flex;gap:8px;align-items:center;margin-top:4px"><button class="vs-btn pv">⏮</button><button class="vs-btn pp">▶</button><button class="vs-btn st">⏹</button><button class="vs-btn nx">⏭</button><span style="flex:1"></span>🔊<input class="vo" type="range" min="0" max="100" value="${Math.round(os.settings.volume * 100)}" style="width:100px"></div></div>`;
    const q = (s) => win.body.querySelector(s); let ti = 0, playing = false, step = 0, timer = null, ac = null, master = null, an = null, raf = 0;
    const pl = q(".pl"); TRACKS.forEach((t, i) => { const d = h("div", "", `${t.e} ${esc(t.t)}<br><small style="opacity:.6">${esc(t.a)}</small>`); d.style.cssText = "padding:6px;cursor:pointer;border-radius:4px"; d.ondblclick = () => { ti = i; step = 0; play(); }; d.onclick = () => { ti = i; sel(); }; pl.appendChild(d); });
    function sel() { const t = TRACKS[ti]; q(".art").style.background = `linear-gradient(135deg,${t.c[0]},${t.c[1]})`; q(".art").textContent = t.e; q(".tt").textContent = t.t + " — " + t.a; [...pl.children].forEach((d, i) => (d.style.background = i === ti ? "rgba(120,190,255,.3)" : "")); }
    function ensure() { if (ac) return; ac = os.audio(); master = ac.createGain(); master.gain.value = os.settings.volume; an = ac.createAnalyser(); an.fftSize = 128; master.connect(an); an.connect(ac.destination); }
    const note = (n, d, type, v) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.type = type; o.frequency.value = 261.63 * Math.pow(2, n / 12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02); };
    function play() { ensure(); stopTimer(); playing = true; q(".pp").textContent = "⏸"; sel(); const t = TRACKS[ti], ms = 60000 / t.bpm / 2; timer = setInterval(() => { const n = t.lead[step % t.lead.length]; note(n + 12, ms / 1000 * 1.4, "triangle", 0.25); if (step % 4 === 0) note(t.bass[(step / 4) % t.bass.length] + 12, ms / 1000 * 3, "sine", 0.35); step++; q(".pr").value = ((step % (t.lead.length * 4)) / (t.lead.length * 4)) * 100; if (step % (t.lead.length * 4) === 0) { ti = (ti + 1) % TRACKS.length; step = 0; sel(); } }, ms); viz(); }
    function stopTimer() { clearInterval(timer); timer = null; }
    function pause() { playing = false; stopTimer(); q(".pp").textContent = "▶"; }
    function viz() { cancelAnimationFrame(raf); const c = q(".vz").getContext("2d"), data = new Uint8Array(an.frequencyBinCount); const loop = () => { if (win.closed) return; raf = requestAnimationFrame(loop); an.getByteFrequencyData(data); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(0, 0, 320, 110); const bw = 320 / data.length; data.forEach((v, i) => { c.fillStyle = `hsl(${200 + i * 2},90%,${40 + v / 8}%)`; c.fillRect(i * bw, 110 - v * 0.42, bw - 1, v * 0.42); }); }; loop(); }
    q(".pp").onclick = () => (playing ? pause() : play()); q(".st").onclick = () => { pause(); step = 0; q(".pr").value = 0; }; q(".nx").onclick = () => { ti = (ti + 1) % TRACKS.length; step = 0; if (playing) play(); else sel(); }; q(".pv").onclick = () => { ti = (ti + TRACKS.length - 1) % TRACKS.length; step = 0; if (playing) play(); else sel(); };
    q(".vo").oninput = (e) => { os.settings.volume = e.target.value / 100; os.save(); if (master) master.gain.value = os.settings.volume; }; q(".pr").oninput = (e) => { const t = TRACKS[ti]; step = Math.floor((e.target.value / 100) * t.lead.length * 4); };
    win.onClose = () => { pause(); cancelAnimationFrame(raf); return true; }; sel();
  } });

  // ── Photo Gallery (generated pictures) ──
  function makePhotos() {
    const out = []; const mk = (draw) => { const c = document.createElement("canvas"); c.width = 640; c.height = 420; const x = c.getContext("2d"); draw(x); return c.toDataURL("image/jpeg", 0.8); };
    const sky = (x, a, b) => { const g = x.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, 640, 420); };
    out.push(["Sunset Hills", mk((x) => { sky(x, "#ff7a00", "#ffd9a0"); x.fillStyle = "#ffe9b0"; x.beginPath(); x.arc(450, 200, 50, 0, 7); x.fill(); x.fillStyle = "#3a1a4a"; x.beginPath(); x.moveTo(0, 420); for (let i = 0; i <= 640; i += 10) x.lineTo(i, 300 + Math.sin(i / 70) * 30); x.lineTo(640, 420); x.fill(); })]);
    out.push(["Ocean Blue", mk((x) => { sky(x, "#7ecbff", "#1a6fd1"); x.fillStyle = "rgba(255,255,255,.5)"; for (let i = 0; i < 14; i++) x.fillRect((i * 97) % 640, 230 + (i * 41) % 180, 90, 3); })]);
    out.push(["Forest Path", mk((x) => { sky(x, "#9ad87a", "#1f5a1a"); x.fillStyle = "#0f3a0f"; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(i * 58, 420); x.lineTo(i * 58 + 28, 120 + (i % 3) * 40); x.lineTo(i * 58 + 56, 420); x.fill(); } })]);
    out.push(["Neon City", mk((x) => { sky(x, "#12002a", "#5a1a8a"); for (let i = 0; i < 14; i++) { const hh = 80 + ((i * 53) % 200); x.fillStyle = "#0a0016"; x.fillRect(i * 46, 420 - hh, 40, hh); x.fillStyle = ["#ff2a8a", "#2affd5", "#ffd02a"][i % 3]; for (let j = 0; j < hh / 20; j++) x.fillRect(i * 46 + 6, 420 - hh + 8 + j * 18, 8, 6); } })]);
    out.push(["Desert", mk((x) => { sky(x, "#ffd27a", "#d9822b"); x.fillStyle = "#b5601a"; x.beginPath(); x.moveTo(0, 420); for (let i = 0; i <= 640; i += 8) x.lineTo(i, 280 + Math.sin(i / 90) * 40 + Math.sin(i / 25) * 6); x.lineTo(640, 420); x.fill(); })]);
    out.push(["Citrus", mk((x) => { sky(x, "#fff3d6", "#ffcf8a"); x.fillStyle = "#ff8a00"; x.beginPath(); x.arc(320, 210, 130, 0, 7); x.fill(); x.fillStyle = "#ffd070"; x.beginPath(); x.arc(320, 210, 112, 0, 7); x.fill(); x.strokeStyle = "#ff9a1f"; x.lineWidth = 6; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(320, 210); x.lineTo(320 + Math.cos(i * Math.PI / 4) * 110, 210 + Math.sin(i * Math.PI / 4) * 110); x.stroke(); } })]);
    return out;
  }
  reg({ id: "photos", name: "Windows Photo Gallery", icon: "🖼️", w: 640, h: 460, single: true, kw: "pictures images", open(win, os) {
    const photos = makePhotos(); let idx = -1, zoom = 1, rot = 0, slide = null;
    win.body.innerHTML = `<div class="gal" style="flex:1;overflow:auto;background:#fff;padding:10px;display:flex;flex-wrap:wrap;gap:10px;align-content:flex-start"></div><div class="vw" style="display:none;flex:1;flex-direction:column;background:#111;min-height:0"><div class="vs-tool"><button class="vs-btn bk">◀ Gallery</button><button class="vs-btn pv">◀</button><button class="vs-btn nx">▶</button><button class="vs-btn zi">＋</button><button class="vs-btn zo">－</button><button class="vs-btn ro">⟳ Rotate</button><button class="vs-btn sl">▶ Slide show</button><button class="vs-btn fu">⛶ Full screen</button></div><div class="im" style="flex:1;display:flex;align-items:center;justify-content:center;overflow:auto"><img style="max-width:100%;transition:transform .25s"></div></div>`;
    const q = (s) => win.body.querySelector(s), gal = q(".gal"), vw = q(".vw"), img = vw.querySelector("img");
    photos.forEach((p, i) => { const d = h("div", "", `<img src="${p[1]}" style="width:150px;height:100px;object-fit:cover;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"><div style="text-align:center;font-size:11px">${esc(p[0])}</div>`); d.style.cursor = "pointer"; d.onclick = () => show(i); gal.appendChild(d); });
    const apply = () => (img.style.transform = `scale(${zoom}) rotate(${rot}deg)`);
    function show(i) { idx = (i + photos.length) % photos.length; gal.style.display = "none"; vw.style.display = "flex"; img.src = photos[idx][1]; zoom = 1; rot = 0; apply(); win.setTitle(photos[idx][0] + " - Photo Gallery"); }
    q(".bk").onclick = () => { stop(); vw.style.display = "none"; gal.style.display = "flex"; win.setTitle("Windows Photo Gallery"); };
    q(".pv").onclick = () => show(idx - 1); q(".nx").onclick = () => show(idx + 1); q(".zi").onclick = () => { zoom = Math.min(4, zoom + 0.25); apply(); }; q(".zo").onclick = () => { zoom = Math.max(0.25, zoom - 0.25); apply(); }; q(".ro").onclick = () => { rot += 90; apply(); };
    const stop = () => { clearInterval(slide); slide = null; q(".sl").textContent = "▶ Slide show"; };
    q(".sl").onclick = () => { if (slide) stop(); else { q(".sl").textContent = "⏸ Stop"; slide = setInterval(() => show(idx + 1), 2500); } }; q(".fu").onclick = () => { const el = vw; if (el.requestFullscreen) el.requestFullscreen().catch(() => os.notify("Photos", "Full screen was blocked by the browser.", "⚠️")); };
    win.onClose = () => { stop(); return true; };
  } });

  // ── Movie Maker ──
  reg({ id: "moviemaker", name: "Windows Movie Maker", icon: "🎬", w: 700, h: 500, single: true, kw: "video edit", open(win, os) {
    const clips = [{ n: "Sunrise", c: ["#ff9a1f", "#7a1a00"], k: 0 }, { n: "Waves", c: ["#2a8fd0", "#031a38"], k: 1 }, { n: "Neon", c: ["#ff2a8a", "#150033"], k: 2 }];
    let tl = [], sel = -1, playing = false, t0 = 0, raf = 0; const W = 480, H = 270;
    win.body.innerHTML = `<div style="display:flex;flex:1;min-height:0;gap:6px;padding:6px;background:#dfe6f2"><div style="width:150px;background:#fff;border:1px solid #99a;padding:4px;overflow:auto"><b>Collection</b><div class="lib"></div></div><div style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0"><canvas class="pv" width="${W}" height="${H}" style="width:100%;max-height:230px;background:#000;object-fit:contain"></canvas><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><button class="vs-btn pl">▶ Preview</button><button class="vs-btn ex">⬇ Export (.webm)</button><span>Text <input class="vs-in tx" value="My Movie" style="width:110px"></span><span>Transition <select class="vs-in tr"><option value="fade">Fade</option><option value="wipe">Wipe</option><option value="none">None</option></select></span></div><div style="font-size:11px">Selected clip trim: start <input class="ts" type="range" min="0" max="3" step="0.1" value="0" style="width:70px"> length <input class="tdur" type="range" min="1" max="4" step="0.1" value="3" style="width:70px"> <button class="vs-btn rm">Remove</button> <span class="inf"></span></div></div></div><div style="padding:6px;background:#cdd6e6;border-top:1px solid #99a"><b style="font-size:11px">Storyboard / Timeline</b><div class="tlw" style="display:flex;gap:4px;min-height:54px;margin-top:4px;overflow:auto"></div></div>`;
    const q = (s) => win.body.querySelector(s), cv = q(".pv"), c = cv.getContext("2d");
    function frame(clip, t) { const k = clip.k; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, clip.c[0]); g.addColorStop(1, clip.c[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
      if (k === 0) { c.fillStyle = "#ffe9b0"; c.beginPath(); c.arc(W / 2, H - 40 - t * 30, 40, 0, 7); c.fill(); c.fillStyle = "#2a0a30"; c.fillRect(0, H - 50, W, 50); }
      else if (k === 1) { c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); for (let x = 0; x <= W; x += 8) c.lineTo(x, 120 + i * 24 + Math.sin(x / 30 + t * 3 + i) * 10); c.stroke(); } }
      else { for (let i = 0; i < 12; i++) { c.fillStyle = ["#ff2a8a", "#2affd5", "#ffd02a"][i % 3]; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i); c.fillRect(i * 40, H - 40 - ((i * 37 + t * 60) % 180), 30, 10); } c.globalAlpha = 1; } }
    const total = () => tl.reduce((a, x) => a + x.len, 0);
    function render(t) { if (!tl.length) { c.fillStyle = "#111"; c.fillRect(0, 0, W, H); c.fillStyle = "#789"; c.font = "16px Segoe UI"; c.fillText("Add clips from the collection to start", 100, 135); return; }
      let acc = 0, i = 0; for (; i < tl.length; i++) { if (t < acc + tl[i].len) break; acc += tl[i].len; } i = Math.min(i, tl.length - 1); const cl = tl[i], lt = t - acc + cl.start; frame(cl, lt); const trm = q(".tr").value, tt = 0.5, into = t - acc;
      if (trm !== "none" && i > 0 && into < tt) { const prev = tl[i - 1], p = into / tt; c.save(); if (trm === "fade") { c.globalAlpha = 1 - p; frame(prev, prev.start + prev.len); } else { c.beginPath(); c.rect(W * p, 0, W, H); c.clip(); frame(prev, prev.start + prev.len); } c.restore(); }
      c.fillStyle = "#fff"; c.font = "bold 26px Segoe UI"; c.textAlign = "center"; c.shadowColor = "#000"; c.shadowBlur = 6; c.fillText(q(".tx").value, W / 2, H - 20); c.textAlign = "left"; c.shadowBlur = 0; }
    function draw() { const row = q(".tlw"); row.innerHTML = ""; tl.forEach((cl, i) => { const d = h("div", "", `<b>${esc(cl.n)}</b><br><small>${cl.len.toFixed(1)}s</small>`); d.style.cssText = `min-width:${40 + cl.len * 24}px;padding:4px 6px;color:#fff;border-radius:4px;cursor:pointer;border:2px solid ${i === sel ? "#fff" : "transparent"};background:linear-gradient(135deg,${cl.c[0]},${cl.c[1]})`; d.onclick = () => { sel = i; q(".ts").value = cl.start; q(".tdur").value = cl.len; draw(); }; row.appendChild(d); }); q(".inf").textContent = `Total ${total().toFixed(1)}s`; render(0); }
    clips.forEach((cl) => { const d = h("div", "", "🎞️ " + cl.n); d.style.cssText = "padding:6px;cursor:pointer;border-bottom:1px solid #eee"; d.ondblclick = d.onclick = () => { tl.push({ ...cl, start: 0, len: 3 }); sel = tl.length - 1; q(".ts").value = 0; q(".tdur").value = 3; draw(); }; q(".lib").appendChild(d); });
    q(".ts").oninput = (e) => { if (sel >= 0) { tl[sel].start = +e.target.value; draw(); } }; q(".tdur").oninput = (e) => { if (sel >= 0) { tl[sel].len = +e.target.value; draw(); } }; q(".rm").onclick = () => { if (sel >= 0) { tl.splice(sel, 1); sel = -1; draw(); } }; q(".tx").oninput = () => render(0);
    function play(onEnd) { if (!tl.length) return; cancelAnimationFrame(raf); playing = true; t0 = performance.now(); const L = () => { if (win.closed) return; const t = (performance.now() - t0) / 1000; if (t >= total()) { playing = false; render(total() - 0.01); if (onEnd) onEnd(); return; } render(t); raf = requestAnimationFrame(L); }; L(); }
    q(".pl").onclick = () => play();
    q(".ex").onclick = () => { if (!tl.length) return os.alert("Movie Maker", "Add at least one clip first."); if (!window.MediaRecorder || !cv.captureStream) return os.alert("Movie Maker", "Your browser can't export video from a canvas."); const rec = new MediaRecorder(cv.captureStream(30), { mimeType: MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "" }), chunks = []; rec.ondataavailable = (e) => chunks.push(e.data); rec.onstop = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(chunks, { type: "video/webm" })); a.download = "movie.webm"; a.click(); os.notify("Movie Maker", "Exported movie.webm", "🎬"); }; rec.start(); play(() => setTimeout(() => rec.stop(), 150)); };
    win.onClose = () => { cancelAnimationFrame(raf); return true; }; draw();
  } });

  // ── Command Prompt ──
  reg({ id: "cmd", name: "Command Prompt", icon: "⬛", w: 600, h: 360, kw: "terminal console shell dos", open(win, os) {
    win.body.style.background = "#000"; win.body.style.color = "#c0c0c0"; let cwd = os.home(), fg = "#c0c0c0";
    win.body.innerHTML = `<div class="out" style="flex:1;overflow:auto;padding:6px;font:13px Consolas,monospace;white-space:pre-wrap"></div><div style="display:flex;padding:0 6px 6px;font:13px Consolas,monospace"><span class="pr"></span><input class="in" style="flex:1;background:transparent;border:0;outline:none;color:inherit;font:inherit"></div>`;
    const out = win.body.querySelector(".out"), inp = win.body.querySelector(".in"), pr = win.body.querySelector(".pr"); const hist = []; let hi = 0;
    const print = (s) => { out.textContent += s + "\n"; out.scrollTop = out.scrollHeight; }; const prompt = () => (pr.textContent = cwd + ">");
    const COLORS = { "0": "#000", "1": "#00a", "2": "#0a0", "3": "#0aa", "4": "#a00", "5": "#a0a", "6": "#aa0", "7": "#c0c0c0", "8": "#888", "9": "#55f", a: "#5f5", b: "#5ff", c: "#f55", d: "#f5f", e: "#ff5", f: "#fff" };
    const resolve = (p) => { if (!p) return cwd; if (/^[a-z]:/i.test(p)) return p.replace(/\\$/, ""); if (p === "..") { const s = cwd.split("\\"); if (s.length > 1) s.pop(); return s.join("\\"); } return cwd + "\\" + p; };
    function tree(p, pre = "") { const items = fs.list(p).filter((n) => n.n !== "$Recycle.Bin"); items.forEach((n, i) => { print(pre + (i === items.length - 1 ? "└── " : "├── ") + n.n); if (n.d) tree(p + "\\" + n.n, pre + (i === items.length - 1 ? "    " : "│   ")); }); }
    const cmds = {
      help: () => print("HELP, DIR, CD, CLS, ECHO, DATE, TIME, VER, TREE, IPCONFIG, COLOR, SYSTEMINFO, TYPE, MKDIR, DEL, WHOAMI, HOSTNAME, PING, EXIT\n(there might be a few hidden extras…)"),
      dir: () => { const l = fs.list(cwd).filter((n) => n.n !== "$Recycle.Bin"); print(" Directory of " + cwd + "\n"); l.forEach((n) => print(`${os.now().toLocaleDateString()}  ${n.d ? "<DIR>   " : String(fs.size(n)).padStart(8)}  ${n.n}`)); print(`        ${l.length} item(s)`); },
      cd: (a) => { const t = resolve(a.trim()); if (!a.trim()) return print(cwd); const n = fs.get(t); if (n && n.d) cwd = t; else print("The system cannot find the path specified."); },
      cls: () => (out.textContent = ""), echo: (a) => print(a), date: () => print("The current date is: " + os.now().toDateString()), time: () => print("The current time is: " + os.now().toLocaleTimeString()),
      ver: () => print("Microsoft Windows [Version 6.0.6000] (Harjyot Edition)"), tree: () => { print(cwd); tree(cwd); },
      ipconfig: () => print("Windows IP Configuration\n\nEthernet adapter Local Area Connection:\n\n   IPv4 Address. . . . . : 192.168.1.42\n   Subnet Mask . . . . . : 255.255.255.0\n   Default Gateway . . . : 192.168.1.1\n\n(simulated — no real network info is read)"),
      color: (a) => { const c = a.trim().toLowerCase(); if (c.length === 2 && COLORS[c[0]] && COLORS[c[1]]) { win.body.style.background = COLORS[c[0]]; win.body.style.color = COLORS[c[1]]; } else print("Usage: COLOR bf  (background, foreground hex digit)"); },
      systeminfo: () => print(`Host Name:        HARJYOT-PC\nOS Name:          Microsoft Windows Vista Ultimate (portfolio build)\nProcessor:        Virtual CPU @ 2.4 GHz\nTotal Physical Memory: 2,048 MB\nLogged on user:   ${os.user}\nProcesses:        ${os.windows.length + 6}`),
      type: (a) => { const v = fs.read(resolve(a.trim())); print(v === null ? "The system cannot find the file specified." : v); }, mkdir: (a) => { if (!fs.mkdir(resolve(a.trim()))) print("A subdirectory or file already exists."); else os.renderIcons(); }, md: (a) => cmds.mkdir(a),
      del: (a) => { if (fs.remove(resolve(a.trim()))) { os.renderIcons(); print("Moved to Recycle Bin."); } else print("Could Not Find " + a); }, whoami: () => print("harjyot-pc\\" + os.user.toLowerCase()), hostname: () => print("HARJYOT-PC"),
      ping: (a) => { const host = a.trim() || "localhost"; print(`Pinging ${host} with 32 bytes of data (simulated):`); for (let i = 0; i < 4; i++) print(`Reply from ${host}: bytes=32 time=${8 + ((i * 7) % 9)}ms TTL=57`); }, exit: () => win.close(),
      secret: () => { print("🔓 Unlocking the secret…"); localStorage.setItem("vista_secret", "1"); V.openApp("secret"); }, matrix: () => { win.body.style.background = "#000"; win.body.style.color = "#0f0"; let n = 0; const iv = setInterval(() => { print(Array.from({ length: 56 }, () => (Math.random() < 0.5 ? "0" : "1")).join(" ")); if (++n > 24) clearInterval(iv); }, 70); },
      bsod: () => os.bsod(), update: () => os.fakeUpdate(), snake: () => V.openApp("snake"), winver: () => V.openApp("about"), coffee: () => print("   ( (\n    ) )\n  .______.\n  |      |]\n  \\      /\n   `----'\n Here's a coffee ☕"), hack: () => { print("Initializing hack sequence…"); let i = 0; const iv = setInterval(() => { print("Cracking mainframe… " + (i += 17) + "%"); if (i >= 100) { clearInterval(iv); print("ACCESS GRANTED. (Just kidding. 🙂)"); } }, 250); },
      sudo: () => print("Nice try. This is Windows."), "42": () => print("The answer to life, the universe, and everything."), dance: () => print("♪┏(・o・)┛♪┗ ( ・o・) ┓♪"),
    };
    print("Microsoft Windows [Version 6.0.6000]\nCopyright (c) 2006 Microsoft Corporation.  All rights reserved.\n"); prompt();
    inp.onkeydown = (e) => { if (e.key === "Enter") { const line = inp.value; inp.value = ""; print(cwd + ">" + line); if (line.trim()) { hist.push(line); hi = hist.length; const [c, ...r] = line.trim().split(/\s+/); const fn = cmds[c.toLowerCase()]; try { if (fn) fn(r.join(" ")); else print(`'${c}' is not recognized as an internal or external command,\noperable program or batch file.`); } catch (err) { print("Error: " + err.message); } } prompt(); } else if (e.key === "ArrowUp") { if (hi > 0) inp.value = hist[--hi]; e.preventDefault(); } else if (e.key === "ArrowDown") { inp.value = hi < hist.length - 1 ? hist[++hi] : ""; } };
    win.body.addEventListener("pointerdown", () => setTimeout(() => inp.focus(), 0)); setTimeout(() => inp.focus(), 50);
  } });

  // ── Task Manager ──
  reg({ id: "taskmgr", name: "Windows Task Manager", icon: "📊", w: 460, h: 420, single: true, kw: "processes performance", open(win, os) {
    win.body.innerHTML = `<div class="vs-tool"><button class="vs-btn" data-t="apps">Applications</button><button class="vs-btn" data-t="procs">Processes</button><button class="vs-btn" data-t="perf">Performance</button></div><div class="pn" style="flex:1;overflow:auto;background:#fff;padding:6px"></div><div class="vs-status"></div>`;
    let tab = "apps", memH = new Array(60).fill(40), cpuH = new Array(60).fill(10); const pn = win.body.querySelector(".pn"), st = win.body.querySelector(".vs-status");
    const base = ["System Idle Process", "System", "csrss.exe", "winlogon.exe", "explorer.exe", "sidebar.exe"]; const pid = {};
    win.body.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
    function draw() {
      const cpu = os.cpu || 10; cpuH.push(cpu); cpuH.shift(); memH.push(35 + os.windows.length * 3 + Math.random() * 3); memH.shift();
      if (tab === "apps") { pn.innerHTML = ""; os.windows.forEach((w) => { const r = h("div", "", `${w.icon || "🪟"} ${esc(w.title || "")} <button class="vs-btn" style="float:right">End Task</button>`); r.style.cssText = "padding:5px;border-bottom:1px solid #eee"; r.querySelector("button").onclick = () => w.close(); pn.appendChild(r); }); if (!os.windows.length) pn.textContent = "No tasks running."; }
      else if (tab === "procs") { pn.innerHTML = `<table style="width:100%;font-size:12px"><tr style="text-align:left"><th>Image Name</th><th>CPU</th><th>Memory</th><th></th></tr></table>`; const tb = pn.querySelector("table"); const rows = [...base.map((n) => ({ n })), ...os.windows.map((w) => ({ n: (w.app || "app") + ".exe", w }))]; rows.forEach((r) => { pid[r.n] = pid[r.n] || { c: Math.round(Math.random() * 6), m: 800 + Math.round(Math.random() * 40000) }; const tr = h("tr", "", `<td>${esc(r.n)}</td><td>${r.n.startsWith("System Idle") ? Math.round(100 - cpu) : pid[r.n].c}%</td><td>${pid[r.n].m.toLocaleString()} K</td><td><button class="vs-btn">End</button></td>`); tr.querySelector("button").onclick = () => { if (r.w) r.w.close(); else if (r.n === "System" || r.n === "csrss.exe" || r.n === "winlogon.exe") os.bsod(); else os.alert("Task Manager", "Access is denied."); }; tb.appendChild(tr); }); }
      else { pn.innerHTML = `<b>CPU Usage</b> ${Math.round(cpu)}%<br><canvas class="c1" width="400" height="90" style="background:#000;width:100%"></canvas><br><b>Memory</b> ${Math.round(memH[memH.length - 1])}%<br><canvas class="c2" width="400" height="90" style="background:#000;width:100%"></canvas>`; [["c1", cpuH, "#5f5"], ["c2", memH, "#6cf"]].forEach(([c, d, col]) => { const x = pn.querySelector("." + c).getContext("2d"); x.strokeStyle = "#143"; for (let i = 0; i < 400; i += 20) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 90); x.stroke(); } x.strokeStyle = col; x.beginPath(); d.forEach((v, i) => x.lineTo(i * 6.8, 90 - v * 0.9)); x.stroke(); }); }
      st.textContent = `Processes: ${os.windows.length + base.length}   CPU Usage: ${Math.round(cpu)}%`;
    }
    const iv = setInterval(draw, 1000); win.onClose = () => { clearInterval(iv); return true; }; draw();
  } });

  // ── Control Panel ──
  reg({ id: "controlpanel", name: "Control Panel", icon: "⚙️", w: 560, h: 420, single: true, kw: "settings personalize display", onArg(w, a) { if (w.go) w.go(a); }, open(win, os, arg) {
    win.go = go; const body = h("div"); body.style.cssText = "flex:1;overflow:auto;padding:12px;background:#fff"; win.body.appendChild(body);
    const sections = { personalize: "🎨 Personalization", display: "🖥️ Display", mouse: "🖱️ Mouse", sound: "🔊 Sound", datetime: "🕒 Date and Time", users: "👥 User Accounts", gadgets: "🧩 Sidebar Gadgets" };
    function go(s) {
      body.innerHTML = ""; if (!s || !sections[s]) { body.innerHTML = "<h3>Control Panel</h3>"; Object.keys(sections).forEach((k) => { const d = h("div", "", sections[k]); d.style.cssText = "padding:10px;cursor:pointer;border-bottom:1px solid #eee;font-size:14px"; d.onmouseenter = () => (d.style.background = "#e8f1fd"); d.onmouseleave = () => (d.style.background = ""); d.onclick = () => go(k); body.appendChild(d); }); win.setTitle("Control Panel"); return; }
      win.setTitle(sections[s].slice(3)); const back = h("button", "vs-btn", "◀ Control Panel"); back.onclick = () => go(); body.appendChild(back); const c = h("div"); c.style.marginTop = "12px"; body.appendChild(c);
      if (s === "personalize") { c.innerHTML = "<b>Desktop background</b><div class='w' style='display:flex;gap:10px;flex-wrap:wrap;margin-top:8px'></div>"; Object.keys(os.WALLS).forEach((k) => { if (k === "secret" && localStorage.getItem("vista_secret") !== "1") return; const d = h("div", "", `<img src="${os.wall(k)}" style="width:120px;height:72px;object-fit:cover;border:3px solid ${os.settings.wallpaper === k ? "#3a78d8" : "#ccc"}"><div style="text-align:center;font-size:11px">${os.WALLS[k]}</div>`); d.style.cursor = "pointer"; d.onclick = () => { os.settings.wallpaper = k; os.save(); os.refreshDesktop(); go("personalize"); }; c.querySelector(".w").appendChild(d); }); if (localStorage.getItem("vista_secret") !== "1") c.insertAdjacentHTML("beforeend", "<p style='color:#999;font-size:11px'>There may be a hidden wallpaper somewhere…</p>"); }
      else if (s === "display") { c.innerHTML = `Resolution: <select class="vs-in"><option>1024 × 640 (recommended)</option><option>800 × 600</option></select><br><br>Brightness: <input type="range" min="40" max="100" value="${store("bright", 100)}" class="br">`; c.querySelector(".br").oninput = (e) => { put("bright", +e.target.value); os.root.style.filter = `brightness(${e.target.value / 100})`; }; }
      else if (s === "mouse") { c.innerHTML = `Pointer speed: <input type="range" min="1" max="10" value="5"><br><br><label><input type="checkbox"> Swap primary and secondary buttons</label><p style="color:#777;font-size:11px">(Saved for show — a browser can't change your real mouse.)</p>`; }
      else if (s === "sound") { c.innerHTML = `System volume: <input type="range" min="0" max="100" value="${Math.round(os.settings.volume * 100)}" class="vo"> <button class="vs-btn t">Test sound</button>`; c.querySelector(".vo").oninput = (e) => { os.settings.volume = e.target.value / 100; os.save(); }; c.querySelector(".t").onclick = () => os.sound("notify"); }
      else if (s === "datetime") { c.innerHTML = `Current: <b class="n"></b><br><br>Shift clock by minutes: <input type="number" class="vs-in m" value="${Math.round(os.settings.clockOffset / 60000)}" style="width:90px"> <button class="vs-btn a">Apply</button> <button class="vs-btn r">Reset to real time</button>`; const n = c.querySelector(".n"), u = () => (n.textContent = os.now().toLocaleString()); u(); const iv = setInterval(() => { if (win.closed) clearInterval(iv); else u(); }, 1000); c.querySelector(".a").onclick = () => { os.settings.clockOffset = (+c.querySelector(".m").value || 0) * 60000; os.save(); }; c.querySelector(".r").onclick = () => { os.settings.clockOffset = 0; os.save(); c.querySelector(".m").value = 0; }; }
      else if (s === "users") { const draw = () => { c.innerHTML = "<b>Accounts</b><div class='l'></div><br>New account name: <input class='vs-in nm'> <button class='vs-btn ad'>Create</button>"; os.settings.users.forEach((u) => { const r = h("div", "", `👤 ${esc(u)}${u === os.user ? " <i>(you)</i>" : ""} <button class="vs-btn" style="float:right">Delete</button>`); r.style.cssText = "padding:6px;border-bottom:1px solid #eee"; r.querySelector("button").onclick = () => { if (u === os.user || os.settings.users.length < 2) return os.alert("User Accounts", "You can't delete the account you're using."); os.settings.users = os.settings.users.filter((x) => x !== u); os.save(); draw(); }; c.querySelector(".l").appendChild(r); }); c.querySelector(".ad").onclick = () => { const v = c.querySelector(".nm").value.trim(); if (v && !os.settings.users.includes(v) && /^[\w -]{1,20}$/.test(v)) { os.settings.users.push(v); fs.mkdir("C:\\Users\\" + v); ["Desktop", "Documents", "Pictures"].forEach((d) => fs.mkdir("C:\\Users\\" + v + "\\" + d)); os.save(); draw(); } }; }; draw(); }
      else if (s === "gadgets") { c.innerHTML = `<label><input type="checkbox" ${os.settings.sidebar ? "checked" : ""}> Show Sidebar gadgets (clock, CPU, weather, currency, slide show)</label>`; c.querySelector("input").onchange = (e) => { os.settings.sidebar = e.target.checked; os.save(); os.refreshDesktop(); }; }
    }
    go(arg);
  } });

  // ── Calendar ──
  reg({ id: "calendar", name: "Windows Calendar", icon: "📅", w: 520, h: 420, single: true, open(win, os) {
    let y = os.now().getFullYear(), m = os.now().getMonth(), ev = store("events", {}); const body = h("div"); body.style.cssText = "flex:1;padding:10px;overflow:auto;background:#fff"; win.body.appendChild(body);
    function draw() { const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), today = os.now(); let t = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><button class="vs-btn pv">◀</button><b style="font-size:16px">${new Date(y, m).toLocaleDateString([], { month: "long", year: "numeric" })}</b><button class="vs-btn nx">▶</button></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center">${"SMTWTFS".split("").map((d) => `<b>${d}</b>`).join("")}`; for (let i = 0; i < first; i++) t += "<div></div>"; for (let d = 1; d <= days; d++) { const k = `${y}-${m + 1}-${d}`, isT = d === today.getDate() && m === today.getMonth() && y === today.getFullYear(); t += `<div data-d="${k}" style="min-height:48px;border:1px solid ${isT ? "#3a78d8" : "#ddd"};background:${isT ? "#e5f0ff" : "#fff"};padding:2px;cursor:pointer;font-size:11px;text-align:left"><b>${d}</b>${(ev[k] || []).map((e, i) => `<div data-e="${i}" style="background:#ffd9a0;border-radius:3px;margin-top:1px;overflow:hidden;white-space:nowrap">${esc(e)}</div>`).join("")}</div>`; } body.innerHTML = t + "</div>";
      body.querySelector(".pv").onclick = () => { m--; if (m < 0) { m = 11; y--; } draw(); }; body.querySelector(".nx").onclick = () => { m++; if (m > 11) { m = 0; y++; } draw(); };
      body.querySelectorAll("[data-d]").forEach((c) => (c.onclick = (e) => { const k = c.dataset.d, ei = e.target.dataset.e; if (ei !== undefined) { os.modal("Event", esc(ev[k][ei]), [["Edit", () => { os.prompt("Edit event", "Title:", ev[k][ei], (v) => { if (v) ev[k][ei] = v; else ev[k].splice(ei, 1); put("events", ev); draw(); }); }], ["Delete", () => { ev[k].splice(ei, 1); put("events", ev); draw(); }], ["Close"]]); return; } os.prompt("New event", `Event for ${k}:`, "", (v) => { if (v) { (ev[k] = ev[k] || []).push(v); put("events", ev); draw(); } }); })); }
    draw();
  } });

  // ── Sticky notes (live on the desktop, draggable, persisted) ──
  const NOTE_COLORS = ["#fff59a", "#ffc8e0", "#bfe9ff", "#c9f5c0"];
  function notesLoad() { return store("notes", []); }
  function renderNotes(os) {
    if (!os.desk) return; os.desk.querySelectorAll(".vs-note").forEach((n) => n.remove()); const notes = notesLoad();
    notes.forEach((n, i) => { const d = h("div", "vs-note"); d.style.cssText = `position:absolute;left:${n.x}px;top:${n.y}px;width:160px;height:150px;background:${n.c};box-shadow:2px 4px 10px rgba(0,0,0,.45);z-index:6;color:#222;display:flex;flex-direction:column;font:13px "Segoe Print","Comic Sans MS",cursive`;
      d.innerHTML = `<div class="hd" style="height:18px;background:rgba(0,0,0,.12);cursor:move;display:flex;justify-content:space-between;padding:0 4px;font-size:11px"><span class="cl" style="cursor:pointer">🎨</span><span class="rm" style="cursor:pointer">✕</span></div><textarea style="flex:1;border:0;background:transparent;resize:none;outline:none;padding:6px;font:inherit"></textarea>`; const ta = d.querySelector("textarea"); ta.value = n.t;
      const save = () => { const a = notesLoad(); a[i] = n; put("notes", a); }; ta.oninput = () => { n.t = ta.value; save(); };
      d.querySelector(".cl").onclick = () => { n.c = NOTE_COLORS[(NOTE_COLORS.indexOf(n.c) + 1) % NOTE_COLORS.length]; d.style.background = n.c; save(); }; d.querySelector(".rm").onclick = () => { const a = notesLoad(); a.splice(i, 1); put("notes", a); renderNotes(os); };
      let dr = null; const hd = d.querySelector(".hd"); hd.onpointerdown = (e) => { dr = { c: os.coords(e), x: n.x, y: n.y }; hd.setPointerCapture(e.pointerId); }; hd.onpointermove = (e) => { if (!dr) return; const c = os.coords(e); n.x = Math.max(0, dr.x + c.x - dr.c.x); n.y = Math.max(0, dr.y + c.y - dr.c.y); d.style.left = n.x + "px"; d.style.top = n.y + "px"; }; hd.onpointerup = () => { if (dr) { dr = null; save(); } }; os.desk.appendChild(d); });
  }
  reg({ id: "stickynotes", name: "Sticky Notes", icon: "🗒️", kw: "notes", run(arg) { const os = V.os; const a = notesLoad(); a.push({ x: 220 + a.length * 24, y: 60 + a.length * 24, c: NOTE_COLORS[a.length % 4], t: "" }); put("notes", a); renderNotes(os); } });
  V.hooks.push(renderNotes);

  // ── Snipping Tool ──
  reg({ id: "snipping", name: "Snipping Tool", icon: "✂️", kw: "screenshot capture", run() {
    const os = V.os; const go = () => { const ov = h("div"); ov.style.cssText = "position:absolute;inset:0;z-index:3500;cursor:crosshair;background:rgba(255,255,255,.25)"; os.root.appendChild(ov); const box = h("div"); box.style.cssText = "position:absolute;border:2px dashed #e00;background:rgba(255,0,0,.1)"; ov.appendChild(box); let s = null;
      ov.onpointerdown = (e) => { s = os.coords(e); ov.setPointerCapture(e.pointerId); }; ov.onpointermove = (e) => { if (!s) return; const c = os.coords(e); Object.assign(box.style, { left: Math.min(s.x, c.x) + "px", top: Math.min(s.y, c.y) + "px", width: Math.abs(c.x - s.x) + "px", height: Math.abs(c.y - s.y) + "px" }); };
      ov.onpointerup = async (e) => { const c = os.coords(e); const r = { x: Math.min(s.x, c.x), y: Math.min(s.y, c.y), w: Math.abs(c.x - s.x), h: Math.abs(c.y - s.y) }; ov.remove(); if (r.w < 8 || r.h < 8) return; box.style.display = "none"; try { const cv = await window.html2canvas(os.desk, { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1, logging: false, useCORS: true, backgroundColor: null }); const url = cv.toDataURL("image/png"); const w = os.createWindow({ app: "snipping", title: "Snipping Tool", icon: "✂️", w: Math.min(700, r.w + 40), h: Math.min(520, r.h + 110) }); w.body.innerHTML = `<div class="vs-tool"><button class="vs-btn sv">💾 Save to Pictures</button></div><div style="flex:1;overflow:auto;background:#7b8fa8;padding:10px"><img src="${url}" style="box-shadow:0 2px 8px #000"></div>`; w.body.querySelector(".sv").onclick = () => { fs.write(os.home() + "\\Pictures\\snip-" + Date.now() % 100000 + ".png", url); os.renderIcons(); os.notify("Snipping Tool", "Saved to Pictures.", "✂️"); }; } catch (err) { os.alert("Snipping Tool", "Couldn't capture the screen: " + esc(err.message || err)); } }; };
      if (window.html2canvas) go(); else { os.notify("Snipping Tool", "Loading…", "✂️"); const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; s.onload = go; s.onerror = () => os.alert("Snipping Tool", "Couldn't load the screenshot library (are you offline?)."); document.head.appendChild(s); } } });

  // ── About / secret ──
  reg({ id: "about", name: "About Windows", icon: "ℹ️", w: 420, h: 320, resizable: false, single: true, hidden: true, open(win, os) {
    win.body.style.background = "#fff"; win.body.innerHTML = `<div style="padding:18px;line-height:1.5"><div style="font:300 26px Segoe UI;color:#1a5fb4">Windows <b>Vista</b> · Portfolio Edition</div><hr><p><b>Built by Harjyot Sohal</b> — video editor &amp; motion graphics artist.</p><p>This tiny OS is a fan-made homage that runs entirely in your browser. No real Microsoft code or assets are used, and nothing here touches your real files. Everything you save stays in this browser.</p><p style="color:#888;font-size:11px">Version 6.0 (build FUN) · Hint: some commands in Command Prompt are secret 🤫</p></div>`;
  } });
  reg({ id: "secret", name: "Secret.exe", icon: "🕵️", w: 460, h: 300, hidden: true, open(win, os) {
    win.body.style.cssText += ";background:#001a00;color:#0f0;font-family:Consolas,monospace"; win.body.innerHTML = `<pre style="padding:16px;font-size:13px">   ____  _____ ____ ____  _____ _____
  / ___|| ____/ ___|  _ \\| ____|_   _|
  \\___ \\|  _|| |   | |_) |  _|   | |
   ___) | |__| |___|  _ <| |___  | |
  |____/|_____\\____|_| \\_\\_____| |_|

 You found Harjyot's secret program!
 • A hidden wallpaper is now unlocked in Control Panel.
 • There's a secret folder at C:\\Secret.
 • Try: matrix · hack · coffee · dance · snake · bsod · update</pre>`; os.notify("Secret unlocked", "New wallpaper available in Personalization.", "🔓");
  } });
})();
