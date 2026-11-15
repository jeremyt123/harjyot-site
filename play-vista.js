/* Windows Vista-style desktop: core shell (boot, login, windows, taskbar, start menu, virtual filesystem).
   Apps live in vista-apps.js and register through VISTA.registerApp(). */
(function () {
  const SW = 1024, SH = 640, TB = 40; // logical screen size + taskbar height
  const CSS = `
  .vs{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 30%,#1b1b1b,#050505 70%);overflow:hidden;font-family:"Segoe UI",Inter,system-ui,sans-serif;user-select:none;-webkit-user-select:none}
  .vs-scene{position:absolute;left:50%;top:50%;width:1100px;height:880px;transform-origin:center center;perspective:1800px}
  .vs-mon{position:absolute;left:38px;top:0;width:1024px;height:640px;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.2,1.4,.4,1)}
  .vs-bezel{position:absolute;left:-26px;top:-26px;right:-26px;bottom:-60px;border-radius:22px;background:linear-gradient(160deg,#2c2c2e,#0a0a0b 40%,#1e1e20);box-shadow:0 30px 60px rgba(0,0,0,.7),inset 0 0 0 2px #3a3a3d,inset 0 2px 6px rgba(255,255,255,.18);cursor:grab}
  .vs-chin{position:absolute;left:0;right:0;bottom:12px;height:34px;display:flex;align-items:center;justify-content:center;gap:16px;color:#8a8a8a;font:600 11px Segoe UI,sans-serif;letter-spacing:.2em;pointer-events:none}
  .vs-pwr{position:absolute;right:20px;bottom:-46px;width:22px;height:22px;border-radius:50%;border:2px solid #555;background:radial-gradient(circle at 35% 30%,#555,#111);cursor:pointer;z-index:5;box-shadow:0 2px 4px #000}
  .vs-pwr::after{content:"";position:absolute;left:50%;top:4px;width:2px;height:8px;margin-left:-1px;background:#9a9a9a;border-radius:1px}
  .vs-led{position:absolute;right:56px;bottom:-38px;width:6px;height:6px;border-radius:50%;background:#333;z-index:5}
  .vs-led.on{background:#46ff6a;box-shadow:0 0 8px #46ff6a}
  .vs-screen{position:absolute;inset:0;overflow:hidden;background:#000;border-radius:3px;box-shadow:inset 0 0 0 2px #000,0 0 30px rgba(120,170,255,.12)}
  .vs-screen::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:9999;background:linear-gradient(115deg,rgba(255,255,255,.07),transparent 40%)}
  .vs-stand{position:absolute;left:470px;top:668px;width:160px;height:60px;background:linear-gradient(#2a2a2c,#111);clip-path:polygon(18% 0,82% 0,100% 100%,0 100%)}
  .vs-base{position:absolute;left:420px;top:722px;width:260px;height:16px;border-radius:50%;background:linear-gradient(#303033,#0c0c0d);box-shadow:0 8px 14px rgba(0,0,0,.6)}
  .vs-kbd{position:absolute;left:250px;top:760px;width:600px;height:96px;border-radius:10px;background:linear-gradient(#26262a,#0e0e10);transform:rotateX(52deg);transform-origin:top center;box-shadow:0 6px 16px rgba(0,0,0,.6),inset 0 1px 0 #444;
    background-image:repeating-linear-gradient(90deg,transparent 0 27px,#000 27px 29px),repeating-linear-gradient(0deg,transparent 0 17px,#000 17px 19px),linear-gradient(#26262a,#0e0e10)}
  .vs-mouse{position:absolute;left:900px;top:790px;width:30px;height:48px;border-radius:15px 15px 18px 18px;background:linear-gradient(#333,#111);box-shadow:0 3px 8px #000,inset 0 1px 0 #555;transform:rotateX(50deg)}
  .vs-mouse::after{content:"";position:absolute;left:50%;top:0;height:20px;width:1px;background:#000}

  .vs *{box-sizing:border-box}
  .vs-off{position:absolute;inset:0;background:#050505}
  .vs-boot{position:absolute;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#cfe;gap:22px;z-index:3000}
  .vs-boot h1{font:300 28px "Segoe UI",sans-serif;letter-spacing:.04em;color:#e8f4ff;text-shadow:0 0 18px #4fb4ff}
  .vs-boot h1 b{font-weight:600}
  .vs-orb{width:78px;height:78px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#bff6ff,#1c8fd6 55%,#064a8c);box-shadow:0 0 40px #2aa4ff;animation:vspulse 1.6s ease-in-out infinite}
  @keyframes vspulse{50%{transform:scale(1.08);box-shadow:0 0 70px #5cc8ff}}
  .vs-bar{width:220px;height:10px;border-radius:6px;background:#0b1a2a;border:1px solid #1d4d73;overflow:hidden}
  .vs-bar i{display:block;height:100%;width:30%;background:linear-gradient(90deg,transparent,#44ff9a,#1ccf7a,transparent);animation:vsbar 1.4s linear infinite}
  @keyframes vsbar{from{transform:translateX(-120%)}to{transform:translateX(420%)}}
  .vs-login{position:absolute;inset:0;z-index:2500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(ellipse at 50% 40%,#2d8fd0,#0b3a68 60%,#041a33);color:#fff}
  .vs-login h2{font:300 26px "Segoe UI";text-shadow:0 2px 8px rgba(0,0,0,.5)}
  .vs-users{display:flex;gap:26px}
  .vs-user{width:130px;text-align:center;cursor:pointer;padding:12px 6px;border-radius:10px;border:1px solid transparent;transition:.15s}
  .vs-user:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.5)}
  .vs-av{width:78px;height:78px;border-radius:12px;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:42px;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.5)}
  .vs-login small{opacity:.75}
  .vs-desk{position:absolute;inset:0;background-size:cover;background-position:center;overflow:hidden}
  .vs-icons{position:absolute;left:0;top:0;right:0;bottom:${TB}px}
  .vs-ico{position:absolute;width:78px;text-align:center;color:#fff;font-size:12px;padding:4px 2px;border:1px solid transparent;border-radius:4px;text-shadow:0 1px 3px #000,0 0 6px #000;cursor:default}
  .vs-ico:hover{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.4)}
  .vs-ico.sel{background:rgba(80,150,255,.45);border-color:rgba(200,225,255,.8)}
  .vs-ico .g{font-size:34px;line-height:42px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}
  .vs-ico .l{display:block;word-break:break-word;line-height:14px}
  .vs-wins{position:absolute;left:0;top:0;right:0;bottom:${TB}px;pointer-events:none}
  .vs-win{position:absolute;pointer-events:auto;display:flex;flex-direction:column;border-radius:9px 9px 3px 3px;
    background:linear-gradient(rgba(88,142,214,.62),rgba(40,86,160,.62));backdrop-filter:blur(14px) saturate(150%);-webkit-backdrop-filter:blur(14px) saturate(150%);
    border:1px solid rgba(255,255,255,.62);box-shadow:0 8px 28px rgba(0,0,0,.55),inset 0 0 0 1px rgba(0,20,60,.5);padding:0 6px 6px;transition:opacity .18s,transform .18s}
  .vs-win.blur{background:linear-gradient(rgba(180,196,220,.6),rgba(130,150,185,.6));box-shadow:0 4px 14px rgba(0,0,0,.4),inset 0 0 0 1px rgba(40,50,70,.4)}
  .vs-win.min{opacity:0;transform:scale(.6) translateY(120px);pointer-events:none}
  .vs-win.max{border-radius:0}
  .vs-tb{height:30px;display:flex;align-items:center;gap:6px;color:#fff;font-size:12px;text-shadow:0 0 8px #fff,0 1px 2px rgba(0,0,0,.7);cursor:default;flex:none}
  .vs-tb .ti{font-size:15px}.vs-tb .tt{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .vs-wb{display:flex;gap:1px;margin-top:-10px}
  .vs-wb button{width:28px;height:19px;border:1px solid rgba(255,255,255,.7);border-radius:0 0 4px 4px;background:linear-gradient(rgba(190,215,250,.75),rgba(90,130,200,.8) 50%,rgba(60,100,180,.85));color:#fff;font:700 11px Segoe UI;cursor:pointer;padding:0;text-shadow:0 1px 2px #000}
  .vs-wb button:hover{filter:brightness(1.25)}
  .vs-wb .x{width:44px;background:linear-gradient(#e9a0a0,#d0402f 50%,#b01d10)}
  .vs-body{flex:1;min-height:0;background:#f0f0f0;color:#111;border:1px solid rgba(0,20,60,.6);position:relative;overflow:hidden;display:flex;flex-direction:column;font-size:12px;user-select:text;-webkit-user-select:text}
  .vs-rs{position:absolute;z-index:3}
  .vs-menubar{display:flex;gap:2px;padding:2px 4px;background:linear-gradient(#fff,#eef2f8);border-bottom:1px solid #c5ccd8;flex:none;position:relative}
  .vs-menubar>span{padding:2px 8px;border-radius:3px;cursor:default}.vs-menubar>span:hover{background:#d9e6f8}
  .vs-menu{position:absolute;min-width:150px;background:#f6f8fb;border:1px solid #8a94a6;box-shadow:3px 3px 8px rgba(0,0,0,.35);padding:2px;z-index:2000;font-size:12px;color:#111}
  .vs-menu div{padding:4px 22px 4px 24px;cursor:default;white-space:nowrap;border-radius:2px}.vs-menu div:hover{background:linear-gradient(#e4f0ff,#c5dcfa);outline:1px solid #9ec2f2}
  .vs-menu hr{border:0;border-top:1px solid #cdd3dd;margin:3px 2px}
  .vs-menu .dis{opacity:.4;pointer-events:none}
  .vs-tool{display:flex;gap:4px;padding:4px;background:linear-gradient(#fafcff,#e3eaf5);border-bottom:1px solid #c5ccd8;flex:none;align-items:center;flex-wrap:wrap}
  .vs-btn{padding:3px 12px;border:1px solid #7a8aa3;border-radius:3px;background:linear-gradient(#fff,#dde5f1 50%,#cdd9ea);cursor:pointer;font:12px Segoe UI;color:#111}
  .vs-btn:hover{border-color:#3c7fb1;background:linear-gradient(#f3faff,#cfe8fb 50%,#a9d4f6)}
  .vs-btn:active{background:linear-gradient(#a9d4f6,#cfe8fb)}
  .vs-in{border:1px solid #8a94a6;padding:3px 5px;font:12px Segoe UI;background:#fff;color:#111;border-radius:2px}
  .vs-status{flex:none;padding:2px 8px;background:linear-gradient(#f3f6fb,#dde4ef);border-top:1px solid #c5ccd8;font-size:11px;color:#333}
  .vs-tbar{position:absolute;left:0;right:0;bottom:0;height:${TB}px;z-index:900;display:flex;align-items:center;padding:0 4px 0 0;background:linear-gradient(rgba(70,80,100,.78),rgba(10,14,24,.88) 50%,rgba(0,0,0,.92));backdrop-filter:blur(12px);border-top:1px solid rgba(255,255,255,.35);color:#fff}
  .vs-start{width:50px;height:50px;margin:-14px 6px 0 4px;border-radius:50%;border:0;cursor:pointer;background:radial-gradient(circle at 35% 25%,#d8fbff,#38a8ee 50%,#0a5aa8);box-shadow:0 0 10px #2aa0ff,inset 0 0 6px rgba(255,255,255,.7);font-size:22px;position:relative;z-index:2}
  .vs-start:hover{filter:brightness(1.2)}
  .vs-tasks{flex:1;display:flex;gap:3px;height:100%;align-items:center;overflow:hidden;padding:0 4px}
  .vs-task{height:32px;min-width:44px;max-width:150px;flex:0 1 150px;border-radius:4px;border:1px solid rgba(255,255,255,.28);background:linear-gradient(rgba(255,255,255,.2),rgba(255,255,255,.04));color:#fff;font:11px Segoe UI;display:flex;align-items:center;gap:6px;padding:0 8px;cursor:pointer;overflow:hidden;white-space:nowrap}
  .vs-task:hover{background:linear-gradient(rgba(150,210,255,.4),rgba(60,120,200,.25))}
  .vs-task.act{background:linear-gradient(rgba(150,210,255,.55),rgba(60,120,200,.4));border-color:rgba(200,230,255,.8)}
  .vs-task span{overflow:hidden;text-overflow:ellipsis}
  .vs-tray{display:flex;align-items:center;gap:8px;padding:0 10px;height:100%;border-left:1px solid rgba(255,255,255,.18);font-size:11px;text-align:center;line-height:1.2}
  .vs-tray .ic{cursor:pointer;font-size:14px}.vs-tray .ic:hover{filter:brightness(1.4)}
  .vs-clock{cursor:pointer;padding:2px 4px;border-radius:3px}.vs-clock:hover{background:rgba(255,255,255,.15)}
  .vs-sm{position:absolute;left:4px;bottom:${TB - 2}px;width:410px;height:470px;z-index:950;border-radius:8px;display:flex;flex-direction:column;overflow:hidden;
    background:linear-gradient(rgba(90,140,210,.72),rgba(22,50,100,.82));backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.6);box-shadow:0 8px 30px rgba(0,0,0,.6)}
  .vs-sm-main{display:flex;flex:1;min-height:0;padding:6px 6px 0}
  .vs-sm-l{flex:1.15;background:#fff;border-radius:5px 0 0 5px;padding:4px;overflow:auto;color:#111}
  .vs-sm-r{flex:.85;background:linear-gradient(#2b4e86,#1a3260);border-radius:0 5px 5px 0;padding:6px;color:#fff;overflow:auto}
  .vs-sm-i{display:flex;gap:8px;align-items:center;padding:5px 6px;border-radius:3px;cursor:default;font-size:12px;border:1px solid transparent}
  .vs-sm-l .vs-sm-i:hover{background:linear-gradient(#e4f0ff,#c5dcfa);border-color:#9ec2f2}
  .vs-sm-r .vs-sm-i:hover{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.4)}
  .vs-sm-i b{font-size:19px;width:24px;text-align:center}
  .vs-sm-s{margin:6px;display:flex;gap:6px;align-items:center}
  .vs-sm-s input{flex:1;border-radius:14px;border:1px solid #8aa;padding:6px 12px;font:12px Segoe UI;outline:none}
  .vs-sm-pw{display:flex;gap:4px;justify-content:flex-end;padding:6px 10px;background:rgba(0,10,40,.35)}
  .vs-sm-pw button{border:1px solid rgba(255,255,255,.6);border-radius:5px;padding:4px 12px;background:linear-gradient(#e87a6a,#b02a1a);color:#fff;cursor:pointer;font:12px Segoe UI}
  .vs-sm-pw .a{background:linear-gradient(#7aa8e8,#2a50b0);padding:4px 8px}
  .vs-ctx{position:absolute;z-index:3000}
  .vs-toast{position:absolute;right:10px;bottom:${TB + 10}px;width:260px;z-index:960;padding:10px 12px;border-radius:7px;background:linear-gradient(#fdfdfd,#e1ebf8);color:#111;border:1px solid #6a86b0;box-shadow:0 4px 14px rgba(0,0,0,.5);font-size:12px;animation:vstoast .3s ease-out}
  .vs-toast b{display:block;margin-bottom:2px}
  @keyframes vstoast{from{transform:translateY(20px);opacity:0}}
  .vs-side{position:absolute;right:6px;top:8px;width:170px;bottom:${TB + 8}px;display:flex;flex-direction:column;gap:8px;z-index:5;pointer-events:none}
  .vs-gad{background:rgba(20,30,50,.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:6px;color:#fff;font-size:11px;text-align:center;pointer-events:auto}
  .vs-cal{position:absolute;right:6px;bottom:${TB + 4}px;width:230px;padding:10px;z-index:960;border-radius:8px;background:linear-gradient(#fdfdfd,#dfe9f6);color:#111;border:1px solid #6a86b0;box-shadow:0 6px 20px rgba(0,0,0,.5)}
  .vs-modal{position:absolute;inset:0;z-index:2800;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center}
  .vs-dlg{background:#f0f0f0;color:#111;border:1px solid #556;border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.6);min-width:300px;overflow:hidden;font-size:12px}
  .vs-dlg h4{margin:0;padding:6px 10px;background:linear-gradient(#7aa8e8,#2a50b0);color:#fff;font:600 12px Segoe UI}
  .vs-dlg .b{padding:12px}
  .vs-dlg .f{display:flex;gap:6px;justify-content:flex-end;padding:8px 12px;background:#e6e9ef}
  .vs-alt{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3100;display:flex;gap:10px;padding:16px;border-radius:12px;background:rgba(20,30,50,.8);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.5)}
  .vs-alt div{width:90px;text-align:center;color:#fff;font-size:11px;padding:8px;border-radius:6px;border:2px solid transparent}
  .vs-alt div.on{border-color:#7fc4ff;background:rgba(120,190,255,.25)}.vs-alt b{display:block;font-size:34px}
  .vs-bsod{position:absolute;inset:0;background:#0000aa;color:#fff;z-index:4000;padding:50px;font:16px "Lucida Console",monospace;white-space:pre-wrap;cursor:pointer}
  .vs-upd{position:absolute;inset:0;z-index:4000;background:#0a2a52;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-size:18px}
  @media(max-width:700px){.vs-scene{}}
  `;

  // ── helpers ──
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem("vista_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("vista_" + k, JSON.stringify(v)); } catch (e) {} } };

  // ── virtual filesystem (persisted) ──
  function seedFS() {
    const f = (n, v) => ({ n, f: 1, v }), d = (n, c = []) => ({ n, d: 1, c });
    return d("", [
      d("C:", [
        d("Users", [d("Harjyot", [d("Desktop", [f("Read Me.txt", "Welcome to Harjyot's Vista!\r\n\r\nThis is a tiny working desktop: open the Start menu, drag windows,\r\ntry Paint, Minesweeper, the Command Prompt and more.\r\nEverything you save lives in this browser only.")]),
          d("Documents", [f("Resume notes.txt", "Video editor & motion graphics artist.\r\nAfter Effects • Premiere Pro • Photoshop."), f("Ideas.txt", "- jelly orange slice\r\n- more arcade games\r\n- ship the portfolio")]),
          d("Pictures", []), d("Music", []), d("Videos", [])]), d("Guest", [d("Desktop"), d("Documents"), d("Pictures")]), d("Visitor", [d("Desktop"), d("Documents"), d("Pictures")])]),
        d("Windows", [d("System32", [f("kernel32.dll", "MZ…"), f("hosts", "127.0.0.1 localhost")]), f("explorer.exe", "MZ…")]),
        d("Program Files", [d("Internet Explorer"), d("Windows Media Player"), d("Windows Mail")]),
        d("Secret", [f("hello.txt", "You found the hidden folder! 🎉\r\nTry typing  secret  in the Command Prompt.")]),
        d("$Recycle.Bin", []),
      ]),
      d("D:", []),
    ]);
  }
  const FS = { root: store.get("fs", null) || seedFS() };
  const saveFS = () => store.set("fs", FS.root);
  const split = (p) => p.replace(/\//g, "\\").split("\\").filter(Boolean);
  function node(path) { let n = FS.root; for (const part of split(path)) { if (!n.c) return null; n = n.c.find((x) => x.n.toLowerCase() === part.toLowerCase()); if (!n) return null; } return n; }
  function parentOf(path) { const p = split(path); const name = p.pop(); return { dir: node(p.join("\\")), name }; }
  const fs = {
    get: node, exists: (p) => !!node(p), list: (p) => { const n = node(p); return n && n.c ? n.c : []; },
    read: (p) => { const n = node(p); return n && n.f ? n.v : null; },
    write(p, v) { const { dir, name } = parentOf(p); if (!dir || !dir.c) return false; let n = dir.c.find((x) => x.n.toLowerCase() === name.toLowerCase()); if (n) { if (n.d) return false; n.v = v; } else dir.c.push({ n: name, f: 1, v }); saveFS(); return true; },
    mkdir(p) { const { dir, name } = parentOf(p); if (!dir || !dir.c || dir.c.some((x) => x.n.toLowerCase() === name.toLowerCase())) return false; dir.c.push({ n: name, d: 1, c: [] }); saveFS(); return true; },
    remove(p) { // move to recycle bin
      const { dir, name } = parentOf(p); if (!dir) return false; const i = dir.c.findIndex((x) => x.n.toLowerCase() === name.toLowerCase()); if (i < 0) return false;
      const [n] = dir.c.splice(i, 1); const bin = node("C:\\$Recycle.Bin"); n.orig = p; bin.c.push(n); saveFS(); return true;
    },
    restore(name) { const bin = node("C:\\$Recycle.Bin"), i = bin.c.findIndex((x) => x.n === name); if (i < 0) return false; const n = bin.c[i]; const { dir } = parentOf(n.orig); if (!dir) return false; bin.c.splice(i, 1); delete n.orig; if (!dir.c.some((x) => x.n === n.n)) dir.c.push(n); saveFS(); return true; },
    purge(name) { const bin = node("C:\\$Recycle.Bin"); bin.c = bin.c.filter((x) => x.n !== name); saveFS(); },
    emptyBin() { node("C:\\$Recycle.Bin").c = []; saveFS(); },
    rename(p, nn) { const n = node(p); if (!n) return false; n.n = nn; saveFS(); return true; },
    size(n) { return n.f ? (n.v ? String(n.v).length : 0) : (n.c || []).reduce((a, x) => a + fs.size(x), 0); },
    search(q) { const out = []; (function walk(n, path) { for (const c of n.c || []) { const p = path ? path + "\\" + c.n : c.n; if (c.n.toLowerCase().includes(q) && !p.includes("$Recycle")) out.push({ n: c, path: p }); if (c.d) walk(c, p); } })(FS.root, ""); return out.slice(0, 8); },
  };

  // ── wallpapers (generated, no external assets) ──
  function wallpaper(kind) {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 600; const x = c.getContext("2d");
    if (kind === "hills") {
      let g = x.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, "#1a6fd1"); g.addColorStop(0.6, "#8cd0ff"); g.addColorStop(1, "#d8f0ff"); x.fillStyle = g; x.fillRect(0, 0, 1024, 600);
      x.fillStyle = "rgba(255,255,255,.85)"; for (const [cx, cy, r] of [[180, 120, 60], [260, 140, 80], [700, 90, 70], [800, 110, 55], [520, 170, 45]]) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.arc(cx + r * 0.9, cy + 10, r * 0.7, 0, 7); x.fill(); }
      const hill = (y, a, f, c1, c2) => { const gg = x.createLinearGradient(0, y - a, 0, 600); gg.addColorStop(0, c1); gg.addColorStop(1, c2); x.fillStyle = gg; x.beginPath(); x.moveTo(0, 600); for (let i = 0; i <= 1024; i += 8) x.lineTo(i, y + Math.sin(i * f) * a + Math.sin(i * f * 2.3) * a * 0.3); x.lineTo(1024, 600); x.fill(); };
      hill(360, 38, 0.006, "#6ec23a", "#2f7d1a"); hill(430, 34, 0.009, "#4daa26", "#1f6a10"); hill(500, 26, 0.012, "#2f8a16", "#124a08");
    } else if (kind === "aurora") {
      x.fillStyle = "#060616"; x.fillRect(0, 0, 1024, 600);
      for (let i = 0; i < 5; i++) { const g = x.createRadialGradient(200 + i * 160, 300, 10, 200 + i * 160, 300, 320); g.addColorStop(0, ["rgba(80,255,200,.55)", "rgba(120,80,255,.5)", "rgba(40,180,255,.5)", "rgba(220,60,255,.45)", "rgba(60,255,140,.5)"][i]); g.addColorStop(1, "transparent"); x.fillStyle = g; x.fillRect(0, 0, 1024, 600); }
    } else if (kind === "orange") {
      const g = x.createLinearGradient(0, 0, 1024, 600); g.addColorStop(0, "#1a0900"); g.addColorStop(0.5, "#a83a00"); g.addColorStop(1, "#ff9a1f"); x.fillStyle = g; x.fillRect(0, 0, 1024, 600);
      x.fillStyle = "rgba(255,220,160,.12)"; for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(700, 250, 40 + i * 50, 0, 7); x.stroke(); x.fill(); }
    } else if (kind === "secret") {
      x.fillStyle = "#000"; x.fillRect(0, 0, 1024, 600); x.font = "14px monospace"; for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(0,255,90,${Math.random() * 0.8 + 0.1})`; x.fillText(String.fromCharCode(0x30a0 + Math.random() * 60), (i * 37) % 1024, (i * 53) % 600); }
      x.fillStyle = "#0f0"; x.font = "bold 40px monospace"; x.textAlign = "center"; x.fillText("YOU FOUND THE SECRET WALLPAPER", 512, 300);
    } else { x.fillStyle = "#1b3f7a"; x.fillRect(0, 0, 1024, 600); }
    return c.toDataURL("image/jpeg", 0.85);
  }
  const WALLS = { hills: "Vista Hills", aurora: "Aurora", orange: "Citrus", secret: "???" };
  const wallCache = {};
  const wall = (k) => wallCache[k] || (wallCache[k] = wallpaper(k));

  function mount(root) {
    if (!document.getElementById("vista-css")) { const st = document.createElement("style"); st.id = "vista-css"; st.textContent = CSS; document.head.appendChild(st); }
    const V = window.VISTA;
    const rootEl = h("div", "vs"); root.appendChild(rootEl);
    const scene = h("div", "vs-scene"); rootEl.appendChild(scene);
    scene.innerHTML = `<div class="vs-stand"></div><div class="vs-base"></div><div class="vs-kbd"></div><div class="vs-mouse"></div>`;
    const mon = h("div", "vs-mon"); scene.appendChild(mon);
    const bezel = h("div", "vs-bezel"); bezel.innerHTML = `<div class="vs-chin">WINDOWS VISTA™</div>`; mon.appendChild(bezel);
    const pwr = h("div", "vs-pwr"); pwr.title = "Power"; const led = h("div", "vs-led"); mon.appendChild(pwr); mon.appendChild(led);
    const screen = h("div", "vs-screen"); mon.appendChild(screen);
    let S = 1; // scene scale
    function fit() { const r = rootEl.getBoundingClientRect(); S = Math.max(0.3, Math.min(r.width / 1130, r.height / 900, 1.25)); scene.style.transform = `translate(-50%,-50%) scale(${S})`; }
    const ro = new ResizeObserver(fit); ro.observe(rootEl); fit();

    // monitor tilt (drag the bezel)
    let tilt = null;
    bezel.addEventListener("pointerdown", (e) => { tilt = { x: e.clientX, y: e.clientY }; bezel.setPointerCapture(e.pointerId); mon.style.transition = "none"; bezel.style.cursor = "grabbing"; });
    bezel.addEventListener("pointermove", (e) => { if (!tilt) return; const ry = Math.max(-14, Math.min(14, (e.clientX - tilt.x) * 0.12)), rx = Math.max(-8, Math.min(8, -(e.clientY - tilt.y) * 0.1)); mon.style.transform = `rotateY(${ry}deg) rotateX(${rx}deg)`; });
    const untilt = () => { tilt = null; mon.style.transition = ""; mon.style.transform = ""; bezel.style.cursor = ""; };
    bezel.addEventListener("pointerup", untilt); bezel.addEventListener("pointercancel", untilt);

    // ── OS state ──
    const os = {
      root: screen, S: () => S, fs, h, esc, store, V, wall, WALLS,
      settings: Object.assign({ wallpaper: "hills", volume: 0.6, accent: "#3a78d8", clockOffset: 0, users: ["Harjyot", "Guest", "Visitor"], sidebar: true, iconPos: {} }, store.get("settings", {})),
      user: "Harjyot", windows: [], z: 10, wins: null, running: false, procs: [],
      save() { store.set("settings", os.settings); },
    };
    os.home = () => "C:\\Users\\" + os.user;
    os.now = () => new Date(Date.now() + os.settings.clockOffset);

    // ── audio ──
    let ac = null;
    function beep(freqs, dur = 0.12, type = "sine", gain = 0.12) {
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume();
        freqs.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * dur * 0.8; o.type = type; o.frequency.value = f; g.gain.setValueAtTime(gain * os.settings.volume, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 2.2); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur * 2.4); });
      } catch (e) {}
    }
    os.sound = (n) => ({ start: () => beep([392, 523, 659, 784, 1047], 0.18), notify: () => beep([880, 1175], 0.1), error: () => beep([220, 165], 0.15, "square", 0.08), shut: () => beep([784, 659, 523, 392], 0.16), click: () => beep([1200], 0.02) }[n] || (() => {}))();
    os.audio = () => { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); return ac; };

    // ── power / boot ──
    let on = false, bootTimers = [], deskEl = null, tick = null;
    const off = h("div", "vs-off"); screen.appendChild(off);
    function clearScreen() { bootTimers.forEach(clearTimeout); bootTimers = []; clearInterval(tick); clearInterval(os.randomToast); clearInterval(os.sideTimer); screen.innerHTML = ""; os.windows = []; os.procs = []; os.running = false; }
    function powerOff() { clearScreen(); screen.appendChild(off); on = false; led.classList.remove("on"); }
    function powerOn() {
      clearScreen(); on = true; led.classList.add("on");
      const boot = h("div", "vs-boot", `<div class="vs-orb"></div><h1>Starting <b>Windows</b></h1><div class="vs-bar"><i></i></div><small style="opacity:.5">Copyright © 2007 Harjyot Sohal Corporation (just for fun)</small>`);
      screen.appendChild(boot); os.sound("start");
      bootTimers.push(setTimeout(() => { boot.remove(); showLogin(); }, 3200));
    }
    pwr.addEventListener("click", () => { if (on) { if (os.running) shutdown(false); else powerOff(); } else powerOn(); });
    os.shutdown = shutdown; os.restart = () => shutdown(true); os.logoff = () => { clearScreen(); showLogin(); }; os.lock = os.logoff;
    function shutdown(restart) {
      if (!os.running) return;
      os.sound("shut"); const d = h("div", "vs-boot", `<div class="vs-orb" style="animation-duration:1s"></div><h1>${restart ? "Restarting" : "Shutting down"}…</h1>`); d.style.zIndex = 4500; screen.appendChild(d);
      bootTimers.push(setTimeout(() => { if (restart) powerOn(); else powerOff(); }, 2000));
    }

    function showLogin() {
      clearScreen();
      const lg = h("div", "vs-login", `<h2>Welcome</h2><div class="vs-users"></div><small>Click a user to log on · no passwords here</small>`); const us = lg.querySelector(".vs-users");
      const av = { Harjyot: ["🧑‍🎤", "#e8892a"], Guest: ["👤", "#5a7fb5"], Visitor: ["🧑‍🚀", "#3a9a6a"] };
      os.settings.users.forEach((u) => { const a = av[u] || ["🙂", "#777"]; const d = h("div", "vs-user", `<div class="vs-av" style="background:${a[1]}">${a[0]}</div>${esc(u)}`); d.onclick = () => { os.user = u; welcome(); }; us.appendChild(d); });
      screen.appendChild(lg);
    }
    function welcome() {
      clearScreen(); const w = h("div", "vs-login", `<h2>Welcome, ${esc(os.user)}</h2><div class="vs-bar"><i></i></div>`); screen.appendChild(w);
      bootTimers.push(setTimeout(() => { w.remove(); desktop(); }, 1400));
    }

    // ── desktop ──
    function desktop() {
      clearScreen(); os.running = true;
      const desk = h("div", "vs-desk"); deskEl = desk; os.desk = desk; desk.style.backgroundImage = `url(${wall(os.settings.wallpaper)})`; screen.appendChild(desk);
      const icons = h("div", "vs-icons"); desk.appendChild(icons);
      const wins = h("div", "vs-wins"); desk.appendChild(wins); os.wins = wins;
      const side = h("div", "vs-side"); desk.appendChild(side); os.side = side; renderSidebar();
      // taskbar
      const tb = h("div", "vs-tbar"); screen.appendChild(tb); os.taskbar = tb;
      const start = h("button", "vs-start", "⊞"); start.title = "Start"; tb.appendChild(start);
      const tasks = h("div", "vs-tasks"); tb.appendChild(tasks); os.tasks = tasks;
      const tray = h("div", "vs-tray"); tb.appendChild(tray);
      const vol = h("span", "ic", "🔊"), net = h("span", "ic", "🌐"), clk = h("div", "vs-clock");
      vol.title = "Volume"; net.title = "Network"; tray.append(vol, net, clk);
      const upd = () => { const d = os.now(); clk.innerHTML = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + "<br>" + d.toLocaleDateString([], { month: "numeric", day: "numeric", year: "numeric" }); }; upd(); tick = setInterval(() => { upd(); }, 1000);
      vol.onclick = () => V.openApp("controlpanel", "sound"); net.onclick = () => os.notify("Network", "Connected to the Internet (simulated).", "🌐");
      clk.onclick = (e) => { e.stopPropagation(); toggleCal(); };
      start.onclick = (e) => { e.stopPropagation(); toggleStart(); };
      desk.addEventListener("pointerdown", () => { closePopups(); });
      screen.addEventListener("contextmenu", (e) => e.preventDefault());
      renderIcons(); (V.hooks || []).forEach((f) => f(os));
      desk.addEventListener("contextmenu", (e) => { if (e.target === desk || e.target === icons || e.target === wins) { e.preventDefault(); desktopMenu(e); } });
      icons.addEventListener("contextmenu", (e) => { if (e.target === icons) { e.preventDefault(); desktopMenu(e); } });
      os.notify("Welcome", `Hi ${os.user}! Click the orb to open the Start menu.`, "👋");
      os.sound("notify");
      os.randomToast = setInterval(() => { if (os.running && Math.random() < 0.35) { os.notify(["Did you know?", "Tip", "System"][Math.floor(Math.random() * 3)], ["Right-click the desktop for more options.", "Type 'help' in Command Prompt.", "Windows Update is not actually running. Promise.", "Try the secret wallpaper in Control Panel…", "Minesweeper never gets old."][Math.floor(Math.random() * 5)], "💡"); os.sound("notify"); } }, 45000);
    }
    os.refreshDesktop = () => { if (!deskEl) return; deskEl.style.backgroundImage = `url(${wall(os.settings.wallpaper)})`; renderIcons(); renderSidebar(); };
    function coords(e) { const r = screen.getBoundingClientRect(); return { x: (e.clientX - r.left) / S, y: (e.clientY - r.top) / S }; }
    os.coords = coords;

    // desktop icons (system shortcuts + files from Desktop folder), draggable, positions persisted
    function renderIcons() {
      const box = deskEl.querySelector(".vs-icons"); box.innerHTML = "";
      const items = [{ id: "computer", g: "🖥️", l: "Computer" }, { id: "docs", g: "📁", l: "Documents" }, { id: "recycle", g: os.fsBinCount() ? "🗑️" : "🗑️", l: "Recycle Bin" }, { id: "ie", g: "🌐", l: "Internet Explorer" }, { id: "games", g: "🎮", l: "Games" }, { id: "notepad", g: "📝", l: "Notepad" }, { id: "paint", g: "🎨", l: "Paint" }];
      fs.list(os.home() + "\\Desktop").forEach((n) => items.push({ file: os.home() + "\\Desktop\\" + n.n, g: n.d ? "📁" : V.fileIcon(n.n), l: n.n }));
      let i = 0;
      items.forEach((it) => {
        const key = it.id || it.file; const pos = os.settings.iconPos[key] || { x: 10 + Math.floor(i / 7) * 86, y: 8 + (i % 7) * 76 }; i++;
        const d = h("div", "vs-ico", `<div class="g">${it.g}</div><span class="l">${esc(it.l)}</span>`); d.style.left = pos.x + "px"; d.style.top = pos.y + "px"; d.dataset.k = key; box.appendChild(d);
        let drag = null;
        d.addEventListener("pointerdown", (e) => { e.stopPropagation(); closePopups(); box.querySelectorAll(".sel").forEach((x) => x.classList.remove("sel")); d.classList.add("sel"); drag = { c: coords(e), x: pos.x, y: pos.y, moved: false }; d.setPointerCapture(e.pointerId); });
        d.addEventListener("pointermove", (e) => { if (!drag) return; const c = coords(e); const dx = c.x - drag.c.x, dy = c.y - drag.c.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; if (drag.moved) { d.style.left = Math.max(0, drag.x + dx) + "px"; d.style.top = Math.max(0, Math.min(SH - TB - 70, drag.y + dy)) + "px"; } });
        d.addEventListener("pointerup", () => { if (drag && drag.moved) { const sx = Math.round(parseFloat(d.style.left) / 8) * 8, sy = Math.round(parseFloat(d.style.top) / 8) * 8; os.settings.iconPos[key] = { x: sx, y: sy }; d.style.left = sx + "px"; d.style.top = sy + "px"; os.save(); } drag = null; });
        d.addEventListener("dblclick", () => { if (it.file) V.openPath(it.file); else V.openApp(it.id === "docs" ? "explorer" : it.id, it.id === "docs" ? os.home() + "\\Documents" : undefined); });
        d.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); const items2 = [["Open", () => d.dispatchEvent(new MouseEvent("dblclick"))]]; if (it.file) items2.push(["Delete", () => { fs.remove(it.file); renderIcons(); }]); items2.push(["Properties", () => os.alert("Properties", `<b>${esc(it.l)}</b><br>${it.file ? esc(it.file) : "System shortcut"}`)]); ctxMenu(e, items2); });
      });
    }
    os.fsBinCount = () => fs.list("C:\\$Recycle.Bin").length;
    os.renderIcons = () => deskEl && renderIcons();

    function desktopMenu(e) {
      const newItem = (label, make) => [label, () => make()];
      ctxMenu(e, [
        ["View ▸ Refresh", () => renderIcons()], ["Sort by name", () => { os.settings.iconPos = {}; os.save(); renderIcons(); }], "-",
        ["New ▸ Folder", () => { const n = "New Folder " + (Date.now() % 1000); fs.mkdir(os.home() + "\\Desktop\\" + n); renderIcons(); }],
        ["New ▸ Text Document", () => { const n = "New Text " + (Date.now() % 1000) + ".txt"; fs.write(os.home() + "\\Desktop\\" + n, ""); renderIcons(); }],
        ["New ▸ Sticky Note", () => V.openApp("stickynotes", "new")], "-",
        ["Personalize", () => V.openApp("controlpanel", "personalize")], ["Display settings", () => V.openApp("controlpanel", "display")], ["Gadgets: " + (os.settings.sidebar ? "Hide" : "Show"), () => { os.settings.sidebar = !os.settings.sidebar; os.save(); renderSidebar(); }],
      ]);
    }
    function ctxMenu(e, items) {
      closeCtx(); const c = coords(e); const m = h("div", "vs-menu vs-ctx"); items.forEach((it) => { if (it === "-") { m.appendChild(h("hr")); return; } const d = h("div", "", esc(it[0])); d.onclick = (ev) => { ev.stopPropagation(); closeCtx(); it[1](); }; m.appendChild(d); });
      m.style.left = Math.min(c.x, SW - 190) + "px"; m.style.top = Math.min(c.y, SH - items.length * 24 - 10) + "px"; screen.appendChild(m); os.ctx = m;
    }
    function closeCtx() { if (os.ctx) { os.ctx.remove(); os.ctx = null; } }
    os.ctxMenu = ctxMenu;

    // ── sidebar gadgets ──
    function renderSidebar() {
      const side = os.side; if (!side) return; side.innerHTML = ""; clearInterval(os.sideTimer); if (!os.settings.sidebar) return;
      const clock = h("div", "vs-gad", `<canvas width="120" height="120"></canvas><div style="font-size:10px;opacity:.7">Clock</div>`);
      const cpu = h("div", "vs-gad", `<div style="text-align:left">CPU <b class="cv">0%</b></div><canvas width="150" height="34"></canvas>`);
      const cal = h("div", "vs-gad", `<div class="cd" style="font-size:11px"></div>`);
      const weather = h("div", "vs-gad", `<div style="font-size:26px">⛅</div><b>22°C</b> Partly sunny<br><span style="opacity:.7">Toronto (simulated)</span>`);
      const money = h("div", "vs-gad", `<div style="text-align:left">💱 <b>1 USD</b> = <span class="fx">1.00 CAD</span></div>`);
      const slide = h("div", "vs-gad", `<canvas width="150" height="70" style="border-radius:4px"></canvas><div style="font-size:10px;opacity:.7">Slide Show</div>`);
      [clock, cpu, weather, money, slide].forEach((g) => side.appendChild(g));
      const cc = clock.querySelector("canvas").getContext("2d"), pc = cpu.querySelector("canvas").getContext("2d"), sc = slide.querySelector("canvas").getContext("2d");
      const hist = new Array(40).fill(10); let si = 0;
      const draw = () => {
        const d = os.now(); cc.clearRect(0, 0, 120, 120); cc.translate(60, 60);
        cc.fillStyle = "rgba(255,255,255,.9)"; cc.beginPath(); cc.arc(0, 0, 56, 0, 7); cc.fill(); cc.strokeStyle = "#35a"; cc.lineWidth = 3; cc.stroke();
        for (let i = 0; i < 12; i++) { cc.rotate(Math.PI / 6); cc.fillStyle = "#333"; cc.fillRect(-1, -52, 2, 7); }
        const hand = (a, l, w, c) => { cc.save(); cc.rotate(a); cc.strokeStyle = c; cc.lineWidth = w; cc.beginPath(); cc.moveTo(0, 6); cc.lineTo(0, -l); cc.stroke(); cc.restore(); };
        hand(((d.getHours() % 12) + d.getMinutes() / 60) * Math.PI / 6, 30, 4, "#222"); hand((d.getMinutes() + d.getSeconds() / 60) * Math.PI / 30, 44, 3, "#222"); hand(d.getSeconds() * Math.PI / 30, 48, 1.5, "#d22");
        cc.setTransform(1, 0, 0, 1, 0, 0);
        const v = Math.min(100, Math.max(2, hist[hist.length - 1] + (Math.random() - 0.5) * 24)); hist.push(v); hist.shift(); os.cpu = v;
        cpu.querySelector(".cv").textContent = Math.round(v) + "%"; pc.clearRect(0, 0, 150, 34); pc.strokeStyle = "#5f5"; pc.beginPath(); hist.forEach((q, i) => pc.lineTo(i * 3.8, 33 - q * 0.32)); pc.stroke();
        cal.querySelector(".cd").textContent = d.toDateString(); money.querySelector(".fx").textContent = (1.36 + Math.sin(Date.now() / 5000) * 0.01).toFixed(3) + " CAD";
        if (Math.floor(Date.now() / 3000) % 3 !== si) { si = Math.floor(Date.now() / 3000) % 3; const g = sc.createLinearGradient(0, 0, 150, 70); const pal = [["#ff9a1f", "#a83a00"], ["#2a8fd0", "#0b3a68"], ["#58d854", "#144a10"]][si]; g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]); sc.fillStyle = g; sc.fillRect(0, 0, 150, 70); sc.font = "28px serif"; sc.fillText(["🍊", "🌊", "🌿"][si], 56, 46); }
      };
      draw(); os.sideTimer = setInterval(draw, 1000);
    }

    // ── windows ──
    let nextId = 1;
    os.createWindow = function (opts) {
      const id = nextId++; const w = opts.w || 560, hh = opts.h || 380;
      const el = h("div", "vs-win"); el.style.width = w + "px"; el.style.height = hh + "px";
      const off = (os.windows.length % 8) * 24; el.style.left = (opts.x !== undefined ? opts.x : 60 + off) + "px"; el.style.top = (opts.y !== undefined ? opts.y : 30 + off) + "px";
      const tbar = h("div", "vs-tb", `<span class="ti">${opts.icon || "🪟"}</span><span class="tt">${esc(opts.title || "Window")}</span>`);
      const wb = h("div", "vs-wb"); const bMin = h("button", "", "–"), bMax = h("button", "", "☐"), bX = h("button", "x", "✕");
      if (opts.noMin !== true) wb.appendChild(bMin); if (opts.resizable !== false) wb.appendChild(bMax); wb.appendChild(bX); tbar.appendChild(wb);
      const body = h("div", "vs-body"); el.append(tbar, body);
      const win = { id, el, body, app: opts.app, title: opts.title, icon: opts.icon, minimized: false, maximized: false, onClose: opts.onClose, os, closed: false };
      win.setTitle = (t) => { win.title = t; tbar.querySelector(".tt").textContent = t; if (win.task) win.task.querySelector("span").textContent = t; };
      os.wins.appendChild(el); os.windows.push(win);
      // taskbar button
      const task = h("button", "vs-task", `<b>${opts.icon || "🪟"}</b><span>${esc(opts.title || "")}</span>`); win.task = task; os.tasks.appendChild(task);
      task.onclick = () => { if (win.minimized) restore(win); else if (os.windows[os.windows.length - 1] === win && !el.classList.contains("blur")) minimize(win); else focus(win); };
      task.addEventListener("contextmenu", (e) => { e.preventDefault(); ctxMenu(e, [["Restore", () => restore(win)], ["Minimize", () => minimize(win)], ["Maximize", () => toggleMax(win)], ["Close", () => close(win)]]); });
      function focus(wn) { if (wn.minimized) return restore(wn); closePopups(); os.z++; wn.el.style.zIndex = os.z; os.windows.forEach((o) => { o.el.classList.toggle("blur", o !== wn); o.task.classList.toggle("act", o === wn); }); os.windows.splice(os.windows.indexOf(wn), 1); os.windows.push(wn); wn.el.classList.remove("blur"); }
      function minimize(wn) { wn.minimized = true; wn.el.classList.add("min"); wn.task.classList.remove("act"); const next = [...os.windows].reverse().find((o) => !o.minimized && o !== wn); if (next) focus(next); }
      function restore(wn) { wn.minimized = false; wn.el.classList.remove("min"); focus(wn); }
      function toggleMax(wn) {
        if (opts.resizable === false) return;
        if (!wn.maximized) { wn.prev = { l: el.style.left, t: el.style.top, w: el.style.width, h: el.style.height }; el.style.left = "0"; el.style.top = "0"; el.style.width = SW + "px"; el.style.height = SH - TB + "px"; wn.maximized = true; el.classList.add("max"); }
        else { Object.assign(el.style, { left: wn.prev.l, top: wn.prev.t, width: wn.prev.w, height: wn.prev.h }); wn.maximized = false; el.classList.remove("max"); }
        if (wn.onResize) wn.onResize();
      }
      function close(wn) { if (wn.closed) return; if (wn.onClose && wn.onClose() === false) return; wn.closed = true; el.style.opacity = 0; el.style.transform = "scale(.9)"; setTimeout(() => el.remove(), 150); wn.task.remove(); os.windows = os.windows.filter((o) => o !== wn); const n = [...os.windows].reverse().find((o) => !o.minimized); if (n) focus(n); }
      win.focus = () => focus(win); win.minimize = () => minimize(win); win.close = () => close(win); win.toggleMax = () => toggleMax(win);
      bMin.onclick = (e) => { e.stopPropagation(); minimize(win); }; bMax.onclick = (e) => { e.stopPropagation(); toggleMax(win); }; bX.onclick = (e) => { e.stopPropagation(); close(win); };
      tbar.addEventListener("dblclick", () => toggleMax(win));
      el.addEventListener("pointerdown", () => { if (win.minimized) return; focus(win); }, true);
      // drag
      let dr = null;
      tbar.addEventListener("pointerdown", (e) => { if (e.target.closest(".vs-wb") || win.maximized) return; const c = coords(e); dr = { c, l: parseFloat(el.style.left), t: parseFloat(el.style.top) }; tbar.setPointerCapture(e.pointerId); });
      tbar.addEventListener("pointermove", (e) => { if (!dr) return; const c = coords(e); el.style.left = Math.max(-el.offsetWidth + 80, Math.min(SW - 60, dr.l + c.x - dr.c.x)) + "px"; el.style.top = Math.max(0, Math.min(SH - TB - 30, dr.t + c.y - dr.c.y)) + "px"; });
      tbar.addEventListener("pointerup", () => (dr = null)); tbar.addEventListener("pointercancel", () => (dr = null));
      // resize handles
      if (opts.resizable !== false) for (const edge of ["e", "s", "se", "w", "n", "nw", "ne", "sw"]) {
        const r = h("div", "vs-rs"); r.dataset.e = edge; const cur = { e: "ew", w: "ew", n: "ns", s: "ns", se: "nwse", nw: "nwse", ne: "nesw", sw: "nesw" }[edge] + "-resize"; r.style.cursor = cur;
        const st = { e: "right:-4px;top:8px;bottom:8px;width:8px", w: "left:-4px;top:8px;bottom:8px;width:8px", s: "bottom:-4px;left:8px;right:8px;height:8px", n: "top:-4px;left:8px;right:8px;height:6px", se: "right:-5px;bottom:-5px;width:14px;height:14px", sw: "left:-5px;bottom:-5px;width:14px;height:14px", ne: "right:-5px;top:-5px;width:14px;height:14px", nw: "left:-5px;top:-5px;width:14px;height:14px" }[edge]; r.style.cssText += st; el.appendChild(r);
        let rs = null;
        r.addEventListener("pointerdown", (e) => { if (win.maximized) return; e.stopPropagation(); focus(win); rs = { c: coords(e), l: parseFloat(el.style.left), t: parseFloat(el.style.top), w: el.offsetWidth, h: el.offsetHeight }; r.setPointerCapture(e.pointerId); });
        r.addEventListener("pointermove", (e) => { if (!rs) return; const c = coords(e), dx = c.x - rs.c.x, dy = c.y - rs.c.y; const mw = opts.minW || 240, mh = opts.minH || 160;
          if (edge.includes("e")) el.style.width = Math.max(mw, rs.w + dx) + "px"; if (edge.includes("s")) el.style.height = Math.max(mh, rs.h + dy) + "px";
          if (edge.includes("w")) { const nw = Math.max(mw, rs.w - dx); el.style.width = nw + "px"; el.style.left = rs.l + (rs.w - nw) + "px"; } if (edge.includes("n")) { const nh = Math.max(mh, rs.h - dy); el.style.height = nh + "px"; el.style.top = rs.t + (rs.h - nh) + "px"; }
          if (win.onResize) win.onResize(); });
        r.addEventListener("pointerup", () => (rs = null)); r.addEventListener("pointercancel", () => (rs = null));
      }
      focus(win); el.style.opacity = 0; el.style.transform = "scale(.92)"; requestAnimationFrame(() => { el.style.opacity = 1; el.style.transform = ""; });
      return win;
    };
    function closePopups() { closeCtx(); if (os.sm) { os.sm.remove(); os.sm = null; } if (os.calEl) { os.calEl.remove(); os.calEl = null; } if (os.menuEl) { os.menuEl.remove(); os.menuEl = null; } }
    os.closePopups = closePopups;
    document.addEventListener("pointerdown", (e) => { if (!screen.contains(e.target)) return; });

    // ── start menu ──
    function toggleStart() {
      if (os.sm) return closePopups(); closePopups();
      const sm = h("div", "vs-sm"); os.sm = sm; sm.addEventListener("pointerdown", (e) => e.stopPropagation());
      const apps = V.list().filter((a) => !a.hidden);
      sm.innerHTML = `<div class="vs-sm-main"><div class="vs-sm-l"></div><div class="vs-sm-r"></div></div><div class="vs-sm-s"><input placeholder="Start Search" /></div><div class="vs-sm-pw"><button class="a">🔒</button><button class="a ar">▸</button><button class="p">⏻ Shut Down</button></div>`;
      const L = sm.querySelector(".vs-sm-l"), Rr = sm.querySelector(".vs-sm-r"), inp = sm.querySelector("input");
      const item = (a, into) => { const d = h("div", "vs-sm-i", `<b>${a.icon}</b><span>${esc(a.name)}</span>`); d.onclick = () => { closePopups(); a.run ? a.run() : V.openApp(a.id); }; into.appendChild(d); };
      function renderList(q) {
        L.innerHTML = ""; q = (q || "").toLowerCase().trim();
        if (!q) { ["ie", "notepad", "paint", "calculator", "wmp", "moviemaker", "cmd", "games", "minesweeper"].map((id) => V.get(id)).filter(Boolean).forEach((a) => item(a, L)); const all = h("div", "vs-sm-i", "<b>▸</b><span>All Programs</span>"); all.onclick = () => { L.innerHTML = ""; apps.forEach((a) => item(a, L)); }; L.appendChild(all); return; }
        const found = apps.filter((a) => a.name.toLowerCase().includes(q) || (a.kw || "").includes(q)); found.forEach((a) => item(a, L));
        fs.search(q).forEach((r) => { const d = h("div", "vs-sm-i", `<b>${r.n.d ? "📁" : V.fileIcon(r.n.n)}</b><span>${esc(r.n.n)}<br><small style="opacity:.55">${esc(r.path)}</small></span>`); d.onclick = () => { closePopups(); V.openPath(r.path); }; L.appendChild(d); });
        if (!L.children.length) L.innerHTML = '<div style="padding:10px;opacity:.6">No items match your search.</div>';
      }
      renderList(); inp.oninput = () => renderList(inp.value); setTimeout(() => inp.focus(), 30);
      const home = os.home();
      [["👤", os.user, () => V.openApp("explorer", home)], ["📄", "Documents", () => V.openApp("explorer", home + "\\Documents")], ["🖼️", "Pictures", () => V.openApp("photos")], ["🎵", "Music", () => V.openApp("wmp")], ["🖥️", "Computer", () => V.openApp("explorer")], ["🎮", "Games", () => V.openApp("games")], ["⚙️", "Control Panel", () => V.openApp("controlpanel")], ["🗑️", "Recycle Bin", () => V.openApp("recycle")], ["ℹ️", "About", () => V.openApp("about")]].forEach(([ic, nm, fn]) => { const d = h("div", "vs-sm-i", `<b>${ic}</b><span>${esc(nm)}</span>`); d.onclick = () => { closePopups(); fn(); }; Rr.appendChild(d); });
      sm.querySelector(".p").onclick = () => { closePopups(); shutdown(false); };
      sm.querySelector(".a").onclick = () => { closePopups(); os.lock(); };
      sm.querySelector(".ar").onclick = (e) => { e.stopPropagation(); const r = e.target.getBoundingClientRect(), sr = screen.getBoundingClientRect(); const m = h("div", "vs-menu"); m.style.left = (r.left - sr.left) / S + "px"; m.style.bottom = TB + 36 + "px"; [["Switch User", os.logoff], ["Log Off", os.logoff], ["Lock", os.lock], ["Restart", os.restart], ["Sleep", () => { closePopups(); powerOff(); }]].forEach(([t, fn]) => { const d = h("div", "", t); d.onclick = () => { closePopups(); fn(); }; m.appendChild(d); }); screen.appendChild(m); os.menuEl = m; };
      screen.appendChild(sm);
    }
    function toggleCal() {
      if (os.calEl) return closePopups(); closePopups(); const d = os.now(); let y = d.getFullYear(), m = d.getMonth();
      const c = h("div", "vs-cal"); os.calEl = c; c.addEventListener("pointerdown", (e) => e.stopPropagation());
      const draw = () => { const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(); let t = `<div style="display:flex;justify-content:space-between;font-weight:600;margin-bottom:6px"><span class="pv" style="cursor:pointer">◀</span><span>${new Date(y, m).toLocaleDateString([], { month: "long", year: "numeric" })}</span><span class="nx" style="cursor:pointer">▶</span></div><table style="width:100%;text-align:center;font-size:12px"><tr>${"SMTWTFS".split("").map((x) => `<th>${x}</th>`).join("")}</tr><tr>`; for (let i = 0; i < first; i++) t += "<td></td>"; for (let i = 1; i <= days; i++) { if ((first + i - 1) % 7 === 0 && i > 1) t += "</tr><tr>"; const today = i === d.getDate() && m === d.getMonth() && y === d.getFullYear(); t += `<td style="padding:3px;${today ? "background:#3a78d8;color:#fff;border-radius:4px" : ""}">${i}</td>`; } c.innerHTML = t + "</tr></table>"; c.querySelector(".pv").onclick = () => { m--; if (m < 0) { m = 11; y--; } draw(); }; c.querySelector(".nx").onclick = () => { m++; if (m > 11) { m = 0; y++; } draw(); }; };
      draw(); screen.appendChild(c);
    }
    os.notify = (title, msg, icon) => { const t = h("div", "vs-toast", `<b>${icon || "ℹ️"} ${esc(title)}</b>${esc(msg)}`); screen.appendChild(t); setTimeout(() => { t.style.transition = "opacity .5s"; t.style.opacity = 0; setTimeout(() => t.remove(), 500); }, 4200); };

    // ── dialogs ──
    function modal(title, bodyHtml, buttons) {
      const m = h("div", "vs-modal"); const d = h("div", "vs-dlg", `<h4>${esc(title)}</h4><div class="b">${bodyHtml}</div><div class="f"></div>`); m.appendChild(d); screen.appendChild(m); const f = d.querySelector(".f");
      const close = () => m.remove(); buttons.forEach(([label, fn]) => { const b = h("button", "vs-btn", esc(label)); b.onclick = () => { if (fn && fn(d) === false) return; close(); }; f.appendChild(b); }); return { m, d, close };
    }
    os.modal = modal;
    os.alert = (t, msg) => modal(t, msg, [["OK"]]);
    os.confirm = (t, msg, yes) => modal(t, msg, [["Yes", () => yes()], ["No"]]);
    os.prompt = (t, label, def, cb) => { const r = modal(t, `${esc(label)}<br><input class="vs-in" style="width:100%;margin-top:6px" value="${esc(def || "")}">`, [["OK", (d) => cb(d.querySelector("input").value)], ["Cancel"]]); setTimeout(() => r.d.querySelector("input").focus(), 20); };
    // file open/save dialog on the virtual filesystem
    os.fileDialog = (mode, startDir, defName, cb) => {
      let dir = startDir || os.home() + "\\Documents", sel = defName || "";
      const r = modal(mode === "save" ? "Save As" : "Open", `<div style="width:420px"><input class="vs-in pa" style="width:100%;margin-bottom:6px"><div class="ls" style="height:170px;overflow:auto;background:#fff;border:1px solid #889"></div><input class="vs-in fn" style="width:100%;margin-top:6px" placeholder="File name"></div>`, [[mode === "save" ? "Save" : "Open", (d) => { const nm = d.querySelector(".fn").value.trim(); if (!nm) return false; cb(dir + "\\" + nm); }], ["Cancel"]]);
      const d = r.d, pa = d.querySelector(".pa"), ls = d.querySelector(".ls"), fn = d.querySelector(".fn"); fn.value = sel;
      const draw = () => { pa.value = dir; ls.innerHTML = ""; const up = h("div", "vs-sm-i", "<b>⬆️</b><span>..</span>"); up.style.color = "#111"; up.onclick = () => { const p = split(dir); if (p.length > 1) { p.pop(); dir = p.join("\\"); draw(); } }; ls.appendChild(up);
        fs.list(dir).forEach((n) => { const it = h("div", "vs-sm-i", `<b>${n.d ? "📁" : V.fileIcon(n.n)}</b><span>${esc(n.n)}</span>`); it.style.color = "#111"; it.onclick = () => { if (n.d) { dir += "\\" + n.n; draw(); } else fn.value = n.n; }; it.ondblclick = () => { if (!n.d) { fn.value = n.n; r.d.querySelector(".f .vs-btn").click(); } }; ls.appendChild(it); }); };
      pa.onchange = () => { if (fs.get(pa.value) && fs.get(pa.value).d) { dir = pa.value; draw(); } }; draw();
    };

    // ── Alt+Tab switcher ──
    let altSel = 0, altEl = null;
    const onKey = (e) => {
      if (!os.running) return;
      if ((e.altKey && e.key === "Tab") || (e.altKey && e.key.toLowerCase() === "q")) {
        e.preventDefault(); const list = [...os.windows].reverse(); if (!list.length) return;
        if (!altEl) { altEl = h("div", "vs-alt"); screen.appendChild(altEl); altSel = 0; } altSel = (altSel + (e.shiftKey ? list.length - 1 : 1)) % list.length;
        altEl.innerHTML = list.map((w, i) => `<div class="${i === altSel ? "on" : ""}"><b>${w.icon || "🪟"}</b>${esc(w.title || "")}</div>`).join("");
      }
    };
    const onKeyUp = (e) => { if (altEl && (e.key === "Alt" || e.key.toLowerCase() === "q")) { const list = [...os.windows].reverse(); const w = list[altSel]; altEl.remove(); altEl = null; if (w) w.focus(); } };
    document.addEventListener("keydown", onKey); document.addEventListener("keyup", onKeyUp);
    os.flip = () => { if (!os.windows.length) return; onKey({ altKey: true, key: "Tab", preventDefault() {}, shiftKey: false }); setTimeout(() => onKeyUp({ key: "Alt" }), 900); };

    // ── easter eggs ──
    os.bsod = () => { const b = h("div", "vs-bsod", `A problem has been detected and Windows has been shut down to prevent damage\nto your computer.\n\nHARJYOT_PORTFOLIO_TOO_AWESOME\n\nIf this is the first time you've seen this Stop error screen, don't panic.\nThis is a joke and it is completely harmless.\n\nTechnical information:\n*** STOP: 0x000000FUN (0x00000001, 0xC0FFEE, 0xDEADBEEF, 0x00000000)\n\nClick anywhere to restart the simulated computer…`); screen.appendChild(b); os.sound("error"); b.onclick = () => { b.remove(); os.restart(); }; };
    os.fakeUpdate = () => { const u = h("div", "vs-upd", `<div style="font-size:22px">Configuring Windows Updates</div><div id="pct">0% complete</div><div>Do not turn off your computer (you can't hurt it, it's pretend)</div>`); screen.appendChild(u); let p = 0; const iv = setInterval(() => { p += 3 + Math.random() * 5; if (p >= 100) { clearInterval(iv); u.remove(); os.notify("Windows Update", "Updates installed. Nothing changed. 😄", "✅"); } else u.querySelector("#pct").textContent = Math.floor(p) + "% complete"; }, 250); };

    V.os = os;
    mount.dispose = () => { document.removeEventListener("keydown", onKey); document.removeEventListener("keyup", onKeyUp); clearInterval(tick); clearInterval(os.sideTimer); clearInterval(os.randomToast); bootTimers.forEach(clearTimeout); ro.disconnect(); try { ac && ac.close(); } catch (e) {} V.os = null; (V.disposers || []).forEach((f) => { try { f(); } catch (e) {} }); V.disposers = []; };
    powerOn();
  }

  // ── app registry (shared with vista-apps.js) ──
  const apps = {};
  window.VISTA = {
    os: null, apps, disposers: [], hooks: [], h, esc, fs,
    registerApp(def) { apps[def.id] = def; },
    get: (id) => apps[id], list: () => Object.values(apps),
    fileIcon(name) { const e = (name.split(".").pop() || "").toLowerCase(); return { txt: "📄", png: "🖼️", jpg: "🖼️", rtf: "📝", doc: "📝", dll: "⚙️", exe: "🔧", mp3: "🎵" }[e] || "📄"; },
    openApp(id, arg) { const a = apps[id]; const os = this.os; if (!a || !os || !os.running) return null; if (a.single) { const ex = os.windows.find((w) => w.app === id); if (ex) { ex.focus(); if (a.onArg) a.onArg(ex, arg); return ex; } }
      if (a.run && !a.open) return a.run(arg); const win = os.createWindow({ app: id, title: a.name, icon: a.icon, w: a.w, h: a.h, resizable: a.resizable, minW: a.minW, minH: a.minH }); a.open(win, os, arg); return win; },
    openPath(path) { const n = this.fs.get(path); if (!n) return; if (n.d) return this.openApp("explorer", path); const ext = (path.split(".").pop() || "").toLowerCase(); if (ext === "png" || ext === "jpg") return this.openApp("paint", path); if (ext === "rtf") return this.openApp("wordpad", path); return this.openApp("notepad", path); },
    pathHelpers: { split },
  };

  window.PG.register("vista", { title: "Windows Vista · Mini OS", mount, unmount() { if (mount.dispose) mount.dispose(); } });
})();
