/* Чердак / Лес — логика сайта. Фильмы правятся в js/films.js */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SCENES = ["choose", "attic", "forest"];
  const NAMES = { attic: "Чердак", forest: "Лес" };
  let current = null;

  /* ================= ЗВУК (Web Audio, без файлов) ================= */
  const Sound = {
    ctx: null, master: null, enabled: true, layers: {},
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.8 : 0;
      this.master.connect(this.ctx.destination);
    },
    noiseBuffer() {
      if (this._nb) return this._nb;
      const len = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return (this._nb = b);
    },
    noiseLayer(name, type, freq, q, vol) {
      if (!this.ctx || this.layers[name]) return;
      const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuffer(); src.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = this.ctx.createGain(); g.gain.value = 0;
      src.connect(f).connect(g).connect(this.master); src.start();
      g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 2);
      this.layers[name] = { src, g, f };
      return this.layers[name];
    },
    stop(name) {
      const l = this.layers[name]; if (!l) return;
      const t = this.ctx.currentTime; l.g.gain.cancelScheduledValues(t); l.g.gain.setValueAtTime(l.g.gain.value, t);
      l.g.gain.linearRampToValueAtTime(0, t + 1.2);
      if (l.src) setTimeout(() => { try { l.src.stop(); } catch (e) {} }, 1400);
      if (l.timer) clearInterval(l.timer);
      delete this.layers[name];
    },
    stopAll() { Object.keys(this.layers).forEach(n => this.stop(n)); },
    tone(freq, dur, vol, type = "sine", slideTo) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.4, dur / 3));
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
      return o;
    },
    rain() { this.noiseLayer("rain", "highpass", 900, 0.3, 0.12); },
    fire() { const l = this.noiseLayer("fire", "lowpass", 300, 0.7, 0.05); },
    wind() {
      const l = this.noiseLayer("wind", "bandpass", 400, 1.2, 0.09); if (!l) return;
      l.timer = setInterval(() => { l.f.frequency.linearRampToValueAtTime(250 + Math.random() * 500, this.ctx.currentTime + 3); }, 3000);
    },
    music() {
      if (!this.ctx || this.layers.music) return;
      const crackle = this.noiseLayer("crackle", "highpass", 3000, 0.5, 0.02);
      const chords = [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 311]];
      let i = 0;
      const play = () => { chords[i++ % chords.length].forEach((f, k) => this.tone(f, 2.4, 0.035, k ? "sine" : "triangle")); document.dispatchEvent(new Event("beat")); };
      play();
      this.layers.music = { g: { gain: { value: 0, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {} } }, timer: setInterval(play, 2400) };
    },
    stopMusic() { this.stop("music"); this.stop("crackle"); },
    howl() { if (!this.ctx) return; const o = this.tone(330, 3.2, 0.04, "sine", 520); },
    click() { this.tone(1200, 0.06, 0.05, "square"); },
    burst(dur, vol, freq) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime, src = this.ctx.createBufferSource(); src.buffer = this.noiseBuffer();
      const f = this.ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.5;
      const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(this.master); src.start(t); src.stop(t + dur + 0.05);
    },
    boof(delay = 0) { setTimeout(() => { this.tone(420, 0.16, 0.16, "triangle", 260); this.burst(0.12, 0.12, 900); }, delay); },
    shiba(state) {
      if (state === "wake") { this.tone(330, 0.35, 0.12, "triangle", 470); }          // «уф?»
      else if (state === "happy") { this.boof(); this.boof(180); }                    // «буф-буф»
      else if (state === "belly") { this.burst(0.5, 0.1, 1400); this.tone(520, 0.4, 0.06, "sine", 380); } // довольное сопение
      else if (state === "sleep") { this.burst(0.8, 0.06, 600); }                     // зевок
      else { this.burst(0.2, 0.07, 1200); }                                           // фырк
    },
    huff() { this.shiba("sniff"); },
    unlock() {
      this.init();
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      if (!this._started && this.ctx && current && current !== "choose") {
        this._started = true;
        if (current === "attic") { if (!curtainClosed) this.rain(); this.fire(); if (record.classList.contains("playing")) this.music(); }
        if (current === "forest") this.wind();
      }
    },
    toggle() {
      this.enabled = !this.enabled;
      if (this.master) this.master.gain.value = this.enabled ? 0.8 : 0;
      const b = $("#soundToggle"); b.textContent = "Звук: " + (this.enabled ? "вкл" : "выкл"); b.setAttribute("aria-pressed", this.enabled);
    }
  };
  $("#soundToggle").addEventListener("click", () => { Sound.unlock(); Sound.toggle(); });
  document.addEventListener("pointerdown", () => Sound.unlock(), true);
  document.addEventListener("keydown", () => Sound.unlock(), true);

  /* ================= НАВИГАЦИЯ ================= */
  function go(scene) {
    if (!SCENES.includes(scene)) scene = "choose";
    if (scene === current) return;
    closeTv();
    if (current === "attic") leaveAttic();
    if (current === "forest") leaveForest();
    current = scene;
    document.body.className = "scene-" + scene;
    if (location.hash !== "#" + scene) history.pushState(null, "", "#" + scene);
    if (scene === "choose") showChoose();
    if (scene === "attic") { localStorage.setItem("lastScene", "attic"); enterAttic(); }
    if (scene === "forest") { localStorage.setItem("lastScene", "forest"); enterForest(); }
  }
  $$("[data-go]").forEach(b => b.addEventListener("click", () => { Sound.init(); if (Sound.ctx && Sound.ctx.state === "suspended") Sound.ctx.resume(); Sound._started = true; go(b.dataset.go); }));
  window.addEventListener("popstate", () => go(location.hash.slice(1) || "choose"));
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!$("#tvOverlay").hidden) closeTv(); else if (current !== "choose") go("choose");
  });

  function showChoose() {
    const last = localStorage.getItem("lastScene");
    $$(".half").forEach(h => h.classList.toggle("last", h.dataset.go === last));
    const r = $("#resume");
    if (last && NAMES[last]) { r.hidden = false; r.textContent = "Вернуться туда, где была: " + NAMES[last]; r.onclick = () => { Sound.init(); go(last); }; }
    else r.hidden = true;
  }

  /* ================= ЧЕРДАК ================= */
  const room = $(".attic-room");
  const lamp = $("#lamp"), record = $("#record"), shiba = $("#shiba");
  const candles = $$(".candle");
  function updateLight() {
    const lit = candles.filter(c => c.classList.contains("lit")).length;
    const light = 0.22 + (lamp.classList.contains("on") ? 0.45 : 0) + lit * 0.1 + ($("#atticTv").classList.contains("on") ? 0.08 : 0);
    room.style.setProperty("--light", Math.min(1, light).toFixed(2));
    room.classList.toggle("lamp-on", lamp.classList.contains("on"));
    room.classList.toggle("tv-on", $("#atticTv").classList.contains("on"));
    fogRate = 0.004 + lit * 0.003; // чем больше свечей, тем быстрее запотевает окно
  }
  candles.forEach(c => c.addEventListener("click", () => { c.classList.toggle("lit"); Sound.click(); updateLight(); }));
  lamp.addEventListener("click", () => { lamp.classList.toggle("on"); Sound.click(); updateLight(); });
  record.addEventListener("click", () => {
    record.classList.toggle("playing");
    record.classList.contains("playing") ? Sound.music() : Sound.stopMusic();
  });
  document.addEventListener("beat", () => { if (shiba.classList.contains("sleep")) { shiba.classList.add("ear"); setTimeout(() => shiba.classList.remove("ear"), 700); } });

  /* сиба */
  const SHIBA_STATES = ["sleep", "wake", "happy", "belly"];
  let shibaIdx = 0, shibaTimer;
  function setShiba(state) {
    SHIBA_STATES.forEach(s => shiba.classList.remove(s));
    shiba.classList.add(state);
    shiba.setAttribute("aria-label", state === "sleep" ? "Сиба Тыква спит, нажми, чтобы разбудить" : "Сиба Тыква не спит, нажми ещё");
  }
  shiba.addEventListener("click", () => {
    shibaIdx = (shibaIdx + 1) % SHIBA_STATES.length;
    if (shibaIdx === 0) shibaIdx = 1;
    Sound.unlock(); setShiba(SHIBA_STATES[shibaIdx]); Sound.shiba(SHIBA_STATES[shibaIdx]);
    clearTimeout(shibaTimer);
    shibaTimer = setTimeout(() => { shibaIdx = 0; setShiba("sleep"); Sound.shiba("sleep"); }, 25000);
  });
  shiba.addEventListener("mouseenter", () => { if (shiba.classList.contains("sleep")) { shiba.classList.add("ear"); setTimeout(() => shiba.classList.remove("ear"), 700); } });

  /* окно: дождь + конденсат */
  const rainC = $("#rain"), glassC = $("#fogGlass");
  const rctx = rainC.getContext("2d"), gctx = glassC.getContext("2d");
  let drops = [], rainRAF = null, fogRate = 0.004;
  function sizeWindow() {
    [rainC, glassC].forEach(c => { c.width = c.clientWidth; c.height = c.clientHeight; });
    gctx.fillStyle = "rgba(160,175,188,0.55)"; gctx.fillRect(0, 0, glassC.width, glassC.height);
    drops = Array.from({ length: 90 }, () => ({ x: Math.random() * rainC.width, y: Math.random() * rainC.height, l: 8 + Math.random() * 14, v: 4 + Math.random() * 5 }));
  }
  function rainLoop() {
    const w = rainC.width, h = rainC.height;
    const g = rctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#1b2836"); g.addColorStop(1, "#0a1018");
    rctx.fillStyle = g; rctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) { const lx = w * (0.15 + i * 0.18), ly = h * 0.84, lg = rctx.createRadialGradient(lx, ly, 0, lx, ly, 14); lg.addColorStop(0, "rgba(255,200,130,0.55)"); lg.addColorStop(1, "rgba(255,200,130,0)"); rctx.fillStyle = lg; rctx.fillRect(lx - 14, ly - 14, 28, 28); }
    rctx.strokeStyle = "rgba(180,200,230,0.45)"; rctx.lineWidth = 1;
    drops.forEach(d => { rctx.beginPath(); rctx.moveTo(d.x, d.y); rctx.lineTo(d.x - 2, d.y + d.l); rctx.stroke(); d.y += d.v; if (d.y > h) { d.y = -d.l; d.x = Math.random() * w; } });
    gctx.globalCompositeOperation = "source-over"; gctx.fillStyle = "rgba(160,175,188," + fogRate + ")"; gctx.fillRect(0, 0, glassC.width, glassC.height);
    rainRAF = requestAnimationFrame(rainLoop);
  }
  function wipe(e) {
    const r = glassC.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    gctx.globalCompositeOperation = "destination-out";
    const g = gctx.createRadialGradient(x, y, 0, x, y, 26); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    gctx.fillStyle = g; gctx.beginPath(); gctx.arc(x, y, 26, 0, 7); gctx.fill();
  }
  /* штора */
  const curtainBtn = $("#curtainBtn");
  let curtainClosed = localStorage.getItem("curtain") === "closed";
  function applyCurtain() {
    room.classList.toggle("curtain-closed", curtainClosed);
    curtainBtn.textContent = curtainClosed ? "Открыть штору" : "Задёрнуть штору";
    curtainBtn.setAttribute("aria-pressed", curtainClosed);
    glassC.style.pointerEvents = curtainClosed ? "none" : "";
    if (current === "attic") curtainClosed ? Sound.stop("rain") : Sound.rain();
  }
  curtainBtn.addEventListener("click", () => { curtainClosed = !curtainClosed; localStorage.setItem("curtain", curtainClosed ? "closed" : "open"); applyCurtain(); });
  applyCurtain();

  glassC.addEventListener("pointermove", wipe);
  glassC.addEventListener("pointerdown", wipe);

  /* пыль в лунном луче */
  const dustC = $("#dust"), dctx = dustC.getContext("2d"); let motes = [], dustRAF = null;
  function sizeDust() { dustC.width = innerWidth; dustC.height = innerHeight; motes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.4, vx: (Math.random() - 0.5) * 0.0004, vy: -0.0002 - Math.random() * 0.0004, a: 0.15 + Math.random() * 0.45 })); }
  function dustLoop() {
    const w = dustC.width, h = dustC.height; dctx.clearRect(0, 0, w, h);
    motes.forEach(m => {
      m.x += m.vx; m.y += m.vy; if (m.y < 0) m.y = 1; if (m.x < 0) m.x = 1; if (m.x > 1) m.x = 0;
      const px = m.x * w, py = m.y * h, inShaft = px > w * 0.06 + py * 0.25 && px < w * 0.2 + py * 0.55;
      if (!inShaft) return;
      dctx.fillStyle = `rgba(210,225,240,${m.a})`; dctx.beginPath(); dctx.arc(px, py, m.r, 0, 7); dctx.fill();
    });
    dustRAF = requestAnimationFrame(dustLoop);
  }

  function enterAttic() {
    sizeDust(); if (!dustRAF && !reduceMotion) dustLoop();
    requestAnimationFrame(() => { sizeWindow(); if (!rainRAF) rainLoop(); });
    if (!curtainClosed) Sound.rain(); Sound.fire(); updateLight(); applyCurtain();
    if (record.classList.contains("playing")) Sound.music();
  }
  function leaveAttic() { cancelAnimationFrame(rainRAF); rainRAF = null; cancelAnimationFrame(dustRAF); dustRAF = null; Sound.stopAll(); }

  /* ================= ЛЕС ================= */
  const fw = $(".forest-world");
  const forest = $("#forest"), fl = $("#flashlight"), wolf = $("#wolf"), ftv = $("#forestTv");
  function makeTrees(layer, n, c1, c2, wMin, wMax, seed) {
    const id = "g" + seed;
    let svg = `<svg viewBox="0 0 1000 600" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${c2}"/><stop offset=".55" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>`;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.2 + Math.random() * 0.6) * (1000 / n) - wMax / 2, w = wMin + Math.random() * (wMax - wMin), top = w * 0.55;
      svg += `<path d="M${x} 600 L${x + (w - top) / 2} -10 L${x + (w + top) / 2} -10 L${x + w} 600Z" fill="url(#${id})"/>`;
      for (let b = 0; b < 2; b++) {
        const by = 60 + Math.random() * 260, dir = Math.random() > 0.5 ? 1 : -1, len = 40 + Math.random() * 70, cx = x + w / 2;
        svg += `<path d="M${cx} ${by} L${cx + dir * len} ${by - len * 0.7}" stroke="${c1}" stroke-width="${Math.max(2, w * 0.07)}" stroke-linecap="round"/>`;
      }
    }
    layer.innerHTML = svg + "</svg>";
  }
  makeTrees($(".layer-far"), 16, "#24343a", "#16232a", 12, 22, 1);
  makeTrees($(".layer-mid"), 9, "#111b20", "#0a1115", 26, 46, 2);
  makeTrees($(".layer-near"), 4, "#05090b", "#020405", 80, 130, 3);

  const WOLF_SPOTS = [ { x: 14, y: 24, s: 0.8 }, { x: 70, y: 26, s: 0.75 }, { x: 34, y: 22, s: 0.7 }, { x: 82, y: 20, s: 0.65 }, { x: 22, y: 28, s: 0.9 } ];
  const WOLF_BY_TV = { x: 62, y: 16, s: 0.95 };
  let wolfSpot = 0, wolfTimer, idleTimer, closer = 0, mouse = { x: innerWidth / 2, y: innerHeight * 0.6 };

  function placeWolf(spot, instant) {
    wolf.style.setProperty("--wo", 0);
    setTimeout(() => {
      wolf.style.setProperty("--wx", spot.x + "%"); wolf.style.setProperty("--wy", spot.y + "%");
      wolf.style.setProperty("--ws", (spot.s + closer * 0.08).toFixed(2));
      wolf.classList.toggle("turn", spot.x > 50);
      wolf.style.setProperty("--wo", 1);
    }, instant ? 0 : 2600);
  }
  function wanderWolf() {
    if (reduceMotion || ftv.classList.contains("on")) return;
    wolfSpot = (wolfSpot + 1 + Math.floor(Math.random() * (WOLF_SPOTS.length - 1))) % WOLF_SPOTS.length;
    placeWolf(WOLF_SPOTS[wolfSpot]);
  }
  wolf.addEventListener("click", e => {
    e.stopPropagation();
    if (!wolf.classList.contains("stare")) { wolf.classList.add("stare"); Sound.howl(); setTimeout(() => wolf.classList.remove("stare"), 4000); }
    else { wolf.classList.remove("stare"); wanderWolf(); }
  });

  function flashlightMove(e) {
    mouse = { x: e.clientX, y: e.clientY };
    fl.style.setProperty("--fx", e.clientX + "px"); fl.style.setProperty("--fy", e.clientY + "px");
    const cx = e.clientX / innerWidth - 0.5, cy = e.clientY / innerHeight - 0.5;
    if (!reduceMotion) $$(".trees", forest).forEach(t => { const d = +t.dataset.depth; t.style.transform = `translate(${-cx * 60 * d}px, ${-cy * 20 * d}px)`; });
    const wr = wolf.getBoundingClientRect(), ex = wr.left + wr.width * (wolf.classList.contains("turn") ? 0.2 : 0.8), ey = wr.top + wr.height * 0.35;
    const dist = Math.hypot(e.clientX - ex, e.clientY - ey);
    const glow = Math.max(0, 1 - dist / 260);
    wolf.style.setProperty("--glow", glow.toFixed(2)); wolf.style.setProperty("--wb", (0.12 + glow * 0.6).toFixed(2));
    const tr = ftv.getBoundingClientRect(), tdist = Math.hypot(e.clientX - (tr.left + tr.width / 2), e.clientY - (tr.top + tr.height / 2));
    ftv.classList.toggle("near", tdist < 260); fw.classList.toggle("tv-near", tdist < 260);
    resetIdle();
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (current !== "forest") return;
      closer = Math.min(3, closer + 1); placeWolf(WOLF_SPOTS[wolfSpot], true);
      ftv.classList.add("near"); setTimeout(() => ftv.classList.remove("near"), 3000);
      resetIdle();
    }, 25000);
  }
  forest.addEventListener("pointermove", flashlightMove);

  /* помехи на ржавом телевизоре */
  const sc = $("#static"), sctx = sc.getContext("2d"); let staticRAF = null;
  function staticLoop() {
    sc.width = 120; sc.height = 90;
    const img = sctx.createImageData(120, 90);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    sctx.putImageData(img, 0, 0);
    staticRAF = setTimeout(() => requestAnimationFrame(staticLoop), 60);
  }

  function enterForest() {
    Sound.wind(); closer = 0; staticLoop();
    placeWolf(WOLF_SPOTS[wolfSpot], true);
    if (!reduceMotion) wolfTimer = setInterval(wanderWolf, 30000 + Math.random() * 20000);
    resetIdle();
  }
  function leaveForest() { clearInterval(wolfTimer); clearTimeout(idleTimer); clearTimeout(staticRAF); Sound.stopAll(); }

  /* ================= ТЕЛЕВИЗОР ================= */
  const TEXT = {
    attic: { title: "Программа передач", play: "▶ Смотреть здесь", close: "Выключить телевизор", fail: "Не грузится? Открыть в новой вкладке ↗", empty: "Сегодня по телевизору ничего. Добавь фильм в js/films.js", hint: "Выбери фильм в программе справа" },
    forest: { title: "Найденные кассеты", play: "▶ Включить", close: "Выключить и не оборачиваться", fail: "Не грузится? Открыть в новой вкладке ↗", empty: "Здесь пока пусто. Слишком пусто.", hint: "Выбери кассету. Если не боишься." }
  };
  const overlay = $("#tvOverlay"), list = $("#tvList"), player = $("#tvPlayer");

  function srcOf(url) {
    const m = String(url).match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
    return (m ? m[1] : String(url)).trim().replace(/&amp;/g, "&");
  }
  function toEmbed(url) {
    url = srcOf(url);
    try {
      const u = new URL(url), h = u.hostname.replace(/^www\.|^m\./, "");
      if (h === "youtube.com" && u.searchParams.get("v")) return "https://www.youtube-nocookie.com/embed/" + u.searchParams.get("v");
      if (h === "youtube.com" && u.pathname.startsWith("/embed/")) return url;
      if (h === "youtu.be") return "https://www.youtube-nocookie.com/embed" + u.pathname;
      if (h === "rutube.ru") { const m = u.pathname.match(/\/video\/([\w]+)/); if (m) return "https://rutube.ru/play/embed/" + m[1]; if (u.pathname.startsWith("/play/embed/")) return url; }
      if (h === "archive.org") { const m = u.pathname.match(/\/(details|embed)\/([^/]+)/); if (m) return "https://archive.org/embed/" + m[2]; }
      if (/vk\.(com|ru)$|vkvideo\.ru$/.test(h) && u.pathname.includes("video_ext.php")) return url;
    } catch (e) {}
    return null;
  }
  function openUrl(u) {
    try {
      const x = new URL(u);
      if (x.pathname.includes("video_ext.php")) return `https://vkvideo.ru/video${x.searchParams.get("oid")}_${x.searchParams.get("id")}`;
      const m = x.pathname.match(/\/play\/embed\/(\w+)/); if (m && /rutube/.test(x.hostname)) return `https://rutube.ru/video/${m[1]}/`;
    } catch (e) {}
    return u;
  }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function openTv(scene) {
    const t = TEXT[scene];
    overlay.className = "tv-overlay " + scene; overlay.hidden = false;
    $("#tvTitle").textContent = t.title; $("#tvClose").textContent = t.close;
    player.innerHTML = `<p class="tv-hint">${esc(t.hint)}</p>`; const fbk = $("#tvFallback"); if (fbk) fbk.remove();
    const films = (window.FILMS || []).filter(f => f && f.url); // один общий список для обоих телевизоров
    list.innerHTML = films.length ? "" : `<li><small>${esc(t.empty)}</small></li>`;
    films.forEach(f => {
      const li = document.createElement("li"), b = document.createElement("button");
      b.innerHTML = `${esc(f.title)}${f.year ? " (" + esc(f.year) + ")" : ""}<small>${f.type === "embed" ? "в телевизоре" : "по ссылке ↗"}${f.note ? " · " + esc(f.note) : ""}</small>`;
      b.addEventListener("click", () => { $$("button", list).forEach(x => x.classList.remove("active")); b.classList.add("active"); showFilm(f, t); Sound.click(); });
      li.appendChild(b); list.appendChild(li);
    });
    if (scene === "attic") { $("#atticTv").classList.add("on"); shiba.classList.add("watching"); updateLight(); }
    if (scene === "forest") { ftv.classList.add("on"); fw.classList.add("tv-on"); placeWolf(WOLF_BY_TV, true); }
    Sound.click();
    $("#tvClose").focus();
  }
  function showFilm(f, t) {
    const raw = srcOf(f.url);
    const safeUrl = /^https?:\/\//i.test(raw) ? raw : "#";
    const link = `<a class="btn" href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer">Открыть фильм ↗</a>`;
    const embed = f.type === "embed" ? toEmbed(f.url) : null;
    if (embed) {
      player.innerHTML = `<p class="tv-hint">${esc(f.title)}</p><button class="btn" id="playHere">${esc(t.play)}</button>`;
      $("#playHere").addEventListener("click", () => {
        player.innerHTML = `<iframe src="${esc(embed)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock; clipboard-write" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="${esc(f.title)}"></iframe>`;
        const old = $("#tvFallback"); if (old) old.remove();
        const fb = document.createElement("a"); fb.id = "tvFallback"; fb.className = "tv-fallback";
        fb.href = openUrl(raw); fb.target = "_blank"; fb.rel = "noopener noreferrer"; fb.textContent = t.fail;
        $("#tvClose").before(fb);
      });
    } else {
      player.innerHTML = `<p class="tv-hint">${esc(f.title)}${f.year ? " (" + esc(f.year) + ")" : ""}</p>${link}${f.type === "embed" ? `<small>Эту ссылку нельзя встроить, открой её в новой вкладке.</small>` : ""}`;
    }
  }
  function closeTv() {
    if (overlay.hidden) return;
    overlay.hidden = true; player.innerHTML = ""; const fbk = $("#tvFallback"); if (fbk) fbk.remove();
    $("#atticTv").classList.remove("on"); shiba.classList.remove("watching"); updateLight();
    if (ftv.classList.contains("on")) { ftv.classList.remove("on"); fw.classList.remove("tv-on"); if (current === "forest") placeWolf(WOLF_SPOTS[wolfSpot]); }
  }
  $("#atticTv").addEventListener("click", () => openTv("attic"));
  ftv.addEventListener("click", () => openTv("forest"));
  $("#tvClose").addEventListener("click", closeTv);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeTv(); });

  window.addEventListener("resize", () => { if (current === "attic") { sizeWindow(); sizeDust(); } });

  /* старт: всегда с экрана выбора, кроме прямой ссылки на сцену */
  const start = location.hash.slice(1);
  current = null;
  go(SCENES.includes(start) ? start : "choose");
})();
