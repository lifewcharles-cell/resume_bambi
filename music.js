/* ================================================
   BAMBI MUSIC — music.js

   §0  initLoader    — progress bar + timing
   §0b initCursor    — lagging ring cursor
   §0c initMouseGlow — ambient halo
   1. 3D Wave-Grid Canvas Background
      Perspective-projected grid of points that
      undulate via sine waves. Two axes of wave
      are offset so the mesh feels organic.
      Mouse movement tilts the grid gently.

   2. Hero Content Parallax
      Three concentric rings and the text block
      each move at a different depth factor when
      the cursor moves through the hero.

   3. Scroll Reveal
      IntersectionObserver adds .visible to any
      element with class .reveal when 12% of it
      enters the viewport.
================================================ */

/* ────────────────────────────────────────────────
   §0 · LOADER
──────────────────────────────────────────────── */
(function initLoader() {
  const loader = document.getElementById("loader");
  const fill   = document.getElementById("loaderProgress");
  const body   = document.body;
  if (!loader) return;
  body.classList.add("loading");
  setTimeout(() => loader.classList.add("loader-active"), 150);
  let pct = 0;
  const tick = setInterval(() => {
    pct = pct < 85 ? pct + 0.9 : pct + 2;
    if (fill) fill.style.width = Math.min(pct, 100) + "%";
    if (pct >= 100) clearInterval(tick);
  }, 40);
  setTimeout(() => loader.classList.add("loader-hidden"), 5000);
  setTimeout(() => { loader.remove(); body.classList.remove("loading"); }, 6600);
})();


/* ────────────────────────────────────────────────
   §0b · CURSOR
──────────────────────────────────────────────── */
(function initCursor() {
  const cursorEl = document.getElementById("cursor");
  if (!cursorEl) return;
  let cx=0, cy=0, mx=0, my=0;
  document.addEventListener("mousemove", e => { mx=e.clientX; my=e.clientY; });
  const inner = cursorEl.querySelector(".cursor-inner");
  function loop() {
    cx += (mx-cx)*0.12; cy += (my-cy)*0.12;
    cursorEl.style.left = cx+"px"; cursorEl.style.top = cy+"px";
    if (inner) { inner.style.left=(mx-cx)+"px"; inner.style.top=(my-cy)+"px"; }
    requestAnimationFrame(loop);
  }
  loop();
  document.querySelectorAll("a,button").forEach(el => {
    el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
  });
})();


/* ────────────────────────────────────────────────
   §0c · MOUSE GLOW
──────────────────────────────────────────────── */
(function initMouseGlow() {
  const glow = document.getElementById("mouseGlow");
  if (!glow) return;
  document.addEventListener("mousemove", e => {
    glow.style.left = e.clientX+"px"; glow.style.top = e.clientY+"px";
  });
})();


/* ────────────────────────────────────────────────
   §1 · DEEP FIELD CANVAS  (Cinematic depth-of-field)

   THREE DEPTH LAYERS — each moves at its own speed.
   Far: barely visible, nearly still.
   Mid: slow drift, subtle presence.
   Near: larger, breathing, occasional warmth.

   CAMERA: Lissajous figure-8 path — the vanishing
   point traces a smooth ∞ shape that never repeats
   the same position twice in a 3-min window.
   Mouse adds a light tilt on top.

   MOTION BLUR: 0.90 alpha overlay — minimal trails.
   The past ghosts very gently, not smeared.
──────────────────────────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const FOV = 620;
  const LAYERS = [
    { n: 260, z0: 900,  z1: 2600, rMin: 0.25, rMax: 0.8,  aMin: 0.02, aMax: 0.08, warm: 0.00 },
    { n:  75, z0: 300,  z1: 900,  rMin: 0.7,  rMax: 1.7,  aMin: 0.06, aMax: 0.18, warm: 0.20 },
    { n:  18, z0: 0,    z1: 300,  rMin: 1.4,  rMax: 3.2,  aMin: 0.18, aMax: 0.48, warm: 0.55 },
  ];

  let W, H, t = 0;
  let rotX = 0, rotY = 0, tRotX = 0, tRotY = 0;
  let pts = [];

  function spawn(layer) {
    const a = Math.random() * Math.PI * 2;
    const d = 15 + Math.random() * 340;
    return {
      x: Math.cos(a) * d,  y: Math.sin(a) * d,
      z: layer.z0 + Math.random() * (layer.z1 - layer.z0),
      vx: (Math.random() - 0.5) * 0.022,
      vy: (Math.random() - 0.5) * 0.016,
      vz: (Math.random() - 0.5) * 0.04,
      r:  layer.rMin + Math.random() * (layer.rMax - layer.rMin),
      warm: Math.random() < layer.warm,
      phase: Math.random() * Math.PI * 2,
      L: layer
    };
  }

  function build() {
    pts = [];
    LAYERS.forEach(L => { for (let i = 0; i < L.n; i++) pts.push(spawn(L)); });
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    build();
  }

  function project(x, y, z, camX, camY) {
    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
    const cx = Math.cos(rotX), sx = Math.sin(rotX);
    const y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
    const s  = FOV / (FOV + z2 + 220);
    return { sx: W/2 + camX + x1*s, sy: H/2 + camY + y2*s, s, z2 };
  }

  window.addEventListener("mousemove", e => {
    tRotY = (e.clientX / W - 0.5) * 0.10;
    tRotX = (e.clientY / H - 0.5) * 0.06;
  });

  function frame() {
    t += 0.004;

    // Minimal ghost — elegant, not smeared
    ctx.fillStyle = "rgba(4,6,10,0.90)";
    ctx.fillRect(0, 0, W, H);

    // Lissajous figure-8: camera traces ∞ shape, never repeats
    const camX = Math.sin(t * 0.038) * 24;
    const camY = Math.sin(t * 0.057) * 14;

    rotX += (tRotX - rotX) * 0.018;
    rotY += (tRotY - rotY) * 0.018;

    // Sort far→near so nearer particles paint over distant ones
    pts.sort((a, b) => b.z - a.z);

    pts.forEach(p => {
      // Lazy drift — very gentle, organic
      p.x += p.vx + Math.sin(t * 0.22 + p.phase) * 0.008;
      p.y += p.vy + Math.cos(t * 0.18 + p.phase) * 0.006;
      p.z += p.vz;

      // Respawn if drifted outside layer
      if (p.z < p.L.z0 - 40 || p.z > p.L.z1 + 40) {
        const np = spawn(p.L);
        Object.assign(p, np);
      }

      const pr = project(p.x, p.y, p.z, camX, camY);
      if (pr.sx < -6 || pr.sx > W+6 || pr.sy < -6 || pr.sy > H+6) return;

      // Depth fade: far particles are dimmer
      const depth01 = 1 - (p.z - p.L.z0) / (p.L.z1 - p.L.z0);
      const alpha   = (p.L.aMin + depth01 * (p.L.aMax - p.L.aMin)) *
                      (1 + Math.sin(t * 1.4 + p.phase) * 0.08);  // subtle twinkle

      const size = p.r * pr.s * 3.2;

      if (p.warm) {
        // Warm ember: barely-there red-orange — like embers through smoke
        ctx.fillStyle = `rgba(210,70,40,${alpha})`;
      } else {
        // Cool field: blue-white starlight, dims at distance
        const v = (155 + depth01 * 70) | 0;
        ctx.fillStyle = `rgba(${v},${v+12},${v+28},${alpha})`;
      }

      ctx.beginPath();
      ctx.arc(pr.sx, pr.sy, Math.max(0.3, size), 0, Math.PI * 2);
      ctx.fill();

      // Near layer only: one very faint halo — depth anchor
      if (p.L === LAYERS[2] && alpha > 0.28) {
        const gr = ctx.createRadialGradient(pr.sx, pr.sy, 0, pr.sx, pr.sy, size * 7);
        const c  = p.warm ? `rgba(210,70,40,` : `rgba(170,185,220,`;
        gr.addColorStop(0, c + (alpha * 0.14) + ")");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(pr.sx, pr.sy, size * 7, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Brand pulse: a single slow crimson breath at center — barely there
    const pulse  = (Math.sin(t * 0.55) + 1) * 0.5;
    const breath = ctx.createRadialGradient(W/2+camX, H/2+camY, 0, W/2+camX, H/2+camY, 220);
    breath.addColorStop(0,   `rgba(196,53,86,${0.012 + pulse * 0.016})`);
    breath.addColorStop(0.6, `rgba(196,53,86,${0.003 + pulse * 0.004})`);
    breath.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = breath;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  frame();
})();


/* ────────────────────────────────────────────────
   §2 · HERO PARALLAX

   Cursor position drives three rings and the text
   block at different depth factors so the hero
   feels like a 3D diorama when you move the mouse.
──────────────────────────────────────────────── */
(function initParallax() {
  const content = document.querySelector(".hero-content");
  const rings   = document.querySelectorAll(".hero-ring");
  if (!content) return;

  let tx = 0, ty = 0;  // current text offset
  let rx = [0,0,0], ry = [0,0,0];  // per-ring current offsets

  const TEXT_DEPTH  = 7;   // pixels of movement for text
  const RING_DEPTHS = [14, 10, 6];  // rings move more (parallax behind text)

  window.addEventListener("mousemove", e => {
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2;  // -1 → +1
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;

    tx = nx * TEXT_DEPTH;
    ty = ny * TEXT_DEPTH;

    rings.forEach((_, i) => {
      rx[i] = -nx * RING_DEPTHS[i];
      ry[i] = -ny * RING_DEPTHS[i];
    });
  });

  // Smooth via rAF rather than inline style on every mousemove
  let cx = 0, cy = 0;
  let crx = [0,0,0], cry = [0,0,0];

  function tick() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    content.style.transform = `translate(${cx}px, ${cy}px)`;

    rings.forEach((ring, i) => {
      crx[i] += (rx[i] - crx[i]) * 0.06;
      cry[i] += (ry[i] - cry[i]) * 0.06;
      ring.style.transform =
        `translate(calc(-50% + ${crx[i]}px), calc(-50% + ${cry[i]}px))`;
    });

    requestAnimationFrame(tick);
  }
  tick();
})();


/* ────────────────────────────────────────────────
   §3 · SCROLL REVEAL

   Any element with class .reveal is invisible at
   start. When 12% of it enters the viewport,
   .visible is added — CSS transition handles
   the fade-up animation.
──────────────────────────────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => obs.observe(el));
})();


/* ────────────────────────────────────────────────
   §4 · TEXT SCRAMBLE
   Section titles and hero headlines scramble through
   random characters then resolve letter-by-letter
   when they enter the viewport.
──────────────────────────────────────────────── */
(function initScramble() {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";
  const DURATION = 620;

  function scramble(el) {
    const original = el.textContent;
    const len      = original.length;
    const start    = performance.now();
    el.style.fontFamily = "'Courier New', Courier, monospace";

    function tick(now) {
      const pct      = Math.min(1, (now - start) / DURATION);
      const revealed = Math.floor(pct * pct * len);
      let out = "";
      for (let i = 0; i < len; i++) {
        if (original[i] === " ") { out += " "; continue; }
        out += i < revealed
          ? original[i]
          : CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      el.textContent = out;
      if (pct < 1) requestAnimationFrame(tick);
      else { el.textContent = original; el.style.fontFamily = ""; }
    }
    requestAnimationFrame(tick);
  }

  const targets = document.querySelectorAll(".section-title, .hero-title, .ht-line");
  if (!targets.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { scramble(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.15 });
  targets.forEach(el => obs.observe(el));
})();


/* ────────────────────────────────────────────────
   §5 · HERO GLOW PULSE
   Hero title glows in sync with warp vortex drift.
──────────────────────────────────────────────── */
(function initHeroGlow() {
  const title = document.querySelector(".hero-title");
  if (!title) return;
  let t = 0;
  function pulse() {
    t += 0.025;
    const i = (Math.sin(t * 0.9) + 1) * 0.5;
    title.style.textShadow =
      `0 0 ${4 + i * 8}px rgba(232,24,24,${0.28 + i * 0.22}),
       0 0 ${8 + i * 16}px rgba(192,200,208,${0.10 + i * 0.10})`;
    requestAnimationFrame(pulse);
  }
  pulse();
})();


/* ────────────────────────────────────────────────
   §6 · AMBIENT AUDIO REACTOR
   Drop assets/audio/ambient.mp3 to activate.
   Exposes window._bambiAudio for the canvas.
──────────────────────────────────────────────── */
(function initAmbientAudio() {
  const btn    = document.getElementById("ambientBtn");
  const audio  = document.getElementById("ambientAudio");
  const player = document.getElementById("ambientPlayer");
  if (!btn || !audio) return;

  let ctx, analyser, src;

  function connect() {
    if (ctx) return;
    ctx      = new (window.AudioContext || /** @type {any} */(window).webkitAudioContext)();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    src = ctx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(ctx.destination);
    const data = new Uint8Array(analyser.frequencyBinCount);
    window._bambiAudio = { analyser, data };
  }

  btn.addEventListener("click", () => {
    connect();
    ctx.resume();
    if (audio.paused) {
      audio.play().then(() => {
        player.classList.add("playing");
        btn.querySelector(".amb-icon").textContent = "■";
      }).catch(() => {});
    } else {
      audio.pause();
      player.classList.remove("playing");
      btn.querySelector(".amb-icon").textContent = "♪";
    }
  });
})();


/* ── §7 · HAMBURGER NAV ───────────────────────── */
(function initHamburger() {
  const btn  = document.getElementById("hamBtn");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open);
  });
  menu.querySelectorAll(".mob-link").forEach(a => {
    a.addEventListener("click", () => {
      menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
    });
  });
})();
