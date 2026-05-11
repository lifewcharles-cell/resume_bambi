/* ================================================
   BAMBI WORLD PAGE — world.js
   §1  initLoader      — progress bar + timing
   §1b initTheme       — dark/light toggle
   §2  initCanvas      — particle cosmos / nebula
   §3  initCursor      — lagging ring + inner dot
   §4  initMouseGlow   — ambient halo
   §5  initReveal      — scroll reveal
   §6  initStickyScroll— panel activation
   §7  initVideoHover  — play video on hover
================================================ */

/* ── §1 · LOADER ──────────────────────────────── */
(function initLoader() {
  const loader = document.getElementById("loader");
  const fill   = document.getElementById("loaderProgress");
  const body   = document.body;
  if (!loader) return;
  body.classList.add("loading");
  setTimeout(() => loader.classList.add("loader-active"), 150);
  let pct = 0;
  const tick = setInterval(() => {
    pct = pct < 85 ? pct + 0.8 : pct + 2;
    if (fill) fill.style.width = Math.min(pct, 100) + "%";
    if (pct >= 100) clearInterval(tick);
  }, 40);
  setTimeout(() => loader.classList.add("loader-hidden"), 5000);
  setTimeout(() => { loader.remove(); body.classList.remove("loading"); }, 6600);
})();


/* ── §1b · THEME TOGGLE ───────────────────────── */
(function initTheme() {
  const btn  = document.getElementById("themeToggle");
  const body = document.body;
  if (!btn) return;
  // Restore saved preference
  if (localStorage.getItem("bambi-world-theme") === "light") {
    body.classList.add("light-mode");
  }
  btn.addEventListener("click", () => {
    body.classList.toggle("light-mode");
    localStorage.setItem("bambi-world-theme",
      body.classList.contains("light-mode") ? "light" : "dark");
  });
})();


/* ── §1c · SCROLL-DRIVEN COLOR ─────────────────────
   Interpolates --clr-scroll from gold (#e9c46a)
   to amber (#a47148) as the user scrolls 0→100%.
   CSS elements that use var(--clr-scroll) react live.
──────────────────────────────────────────────── */
(function initScrollColor() {
  const gold  = { r: 233, g: 196, b: 106 };
  const amber = { r: 164, g: 113, b:  72 };
  function lerp(a, b, t) { return (a + (b - a) * t) | 0; }

  function update() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(1, window.scrollY / maxScroll);
    const r = lerp(gold.r, amber.r, pct);
    const g = lerp(gold.g, amber.g, pct);
    const b = lerp(gold.b, amber.b, pct);
    document.documentElement.style.setProperty("--clr-scroll", `rgb(${r},${g},${b})`);
  }

  window.addEventListener("scroll", update, { passive: true });
  update();
})();


/* ── §2 · GOTHIC ATMOSPHERE CANVAS ────────────────
   Grunge gothic but clean and premium:
   - Slow rolling fog/mist layers (large radial blobs)
   - Ash particles drifting upward with gentle sway
   - Ember sparks that bloom and fade
   - Mouse shifts the fog subtly
──────────────────────────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W, H, t = 0;
  let mx = 0.5, my = 0.5;

  let fog = [], ash = [], embers = [];
  let scrollY = 0;
  let fogAngle = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    build();
  }

  function build() {
    // Fog: 6 large slow radial blobs — violet + fire tones
    fog = [];
    for (let i = 0; i < 6; i++) {
      fog.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     200 + Math.random() * 350,
        vx:    (Math.random() - 0.5) * 0.07,
        vy:    (Math.random() - 0.5) * 0.04,
        phase: Math.random() * Math.PI * 2,
        type:  i < 4 ? 'violet' : 'fire'
      });
    }

    // Ash: 200 tiny particles drifting upward
    ash = [];
    for (let i = 0; i < 200; i++) {
      ash.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     0.3 + Math.random() * 1.4,
        vx:    (Math.random() - 0.5) * 0.12,
        vy:    -(0.08 + Math.random() * 0.35),
        phase: Math.random() * Math.PI * 2,
        alpha: 0.2 + Math.random() * 0.6,
        fire:  Math.random() > 0.75
      });
    }

    // Embers: 14 bright sparks that bloom and vanish
    embers = [];
    for (let i = 0; i < 14; i++) {
      embers.push(spawnEmber());
    }
  }

  function spawnEmber() {
    return {
      x:       Math.random() * W,
      y:       H * 0.2 + Math.random() * H * 0.8,
      r:       1.2 + Math.random() * 2.8,
      life:    Math.random(),
      maxLife: 1.0 + Math.random() * 1.5,
      speed:   0.007 + Math.random() * 0.01,
      vy:      -(0.2 + Math.random() * 0.6),
      fire:    Math.random() > 0.5
    };
  }

  document.addEventListener("mousemove", e => { mx = e.clientX / W; my = e.clientY / H; });
  window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

  function frame() {
    ctx.clearRect(0, 0, W, H);
    t += 0.003;           // slower atmospheric time — more cinematic
    fogAngle += 0.00014;  // ultra-slow orbit — felt, not seen

    // ── Fog layers ──────────────────────────────
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(fogAngle);
    ctx.translate(-W / 2, -H / 2);
    ctx.translate(-scrollY * 0.10, 0);
    fog.forEach(f => {
      f.x += f.vx + (mx - 0.5) * 0.025;
      f.y += f.vy + (my - 0.5) * 0.015;
      if (f.x < -f.r) f.x = W + f.r;
      if (f.x > W + f.r) f.x = -f.r;
      if (f.y < -f.r) f.y = H + f.r;
      if (f.y > H + f.r) f.y = -f.r;

      const pulse = 1 + Math.sin(t * 0.25 + f.phase) * 0.18;
      const a     = 0.022 + Math.sin(t * 0.18 + f.phase) * 0.008;
      const r     = f.r * pulse;

      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      if (f.type === 'violet') {
        // Sickly acid gold-green — tarnished, diseased
        g.addColorStop(0,   `rgba(140,130,10,${a * 3})`);
        g.addColorStop(0.35,`rgba(100,95,8,${a * 1.5})`);
        g.addColorStop(1,   `rgba(50,45,5,0)`);
      } else {
        // Blood rust — raw, corrosive
        g.addColorStop(0,   `rgba(130,30,8,${a * 2.5})`);
        g.addColorStop(0.35,`rgba(90,20,5,${a * 1.2})`);
        g.addColorStop(1,   `rgba(50,10,3,0)`);
      }
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });
    ctx.restore();

    // ── Ash particles ────────────────────────────
    ash.forEach(a => {
      a.x += a.vx + Math.sin(t * 0.7 + a.phase) * 0.10;
      a.y += a.vy;
      if (a.y < -6) { a.y = H + 6; a.x = Math.random() * W; }
      if (a.x < -4) a.x = W + 4;
      if (a.x > W + 4) a.x = -4;

      const tw = a.alpha * (0.4 + Math.sin(t * 1.8 + a.phase) * 0.35);
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = a.fire
        ? `rgba(180,60,10,${tw * 0.65})`
        : `rgba(120,110,15,${tw * 0.55})`;
      ctx.fill();
    });

    // ── Embers ───────────────────────────────────
    embers.forEach((e, idx) => {
      e.life += e.speed;
      if (e.life > e.maxLife) { embers[idx] = spawnEmber(); return; }

      e.y += e.vy * 0.25;

      const prog  = e.life / e.maxLife;
      const alpha = prog < 0.3 ? prog / 0.3 : 1 - (prog - 0.3) / 0.7;

      // Glow halo
      const gr = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 6);
      if (e.fire) {
        gr.addColorStop(0,   `rgba(220,40,10,${alpha * 0.55})`);
        gr.addColorStop(0.5, `rgba(140,20,5,${alpha * 0.2})`);
        gr.addColorStop(1,   `rgba(70,8,3,0)`);
      } else {
        gr.addColorStop(0,   `rgba(160,140,10,${alpha * 0.5})`);
        gr.addColorStop(0.5, `rgba(110,100,8,${alpha * 0.18})`);
        gr.addColorStop(1,   `rgba(55,50,4,0)`);
      }
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * 6, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();

      // Core spark
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = e.fire
        ? `rgba(255,80,20,${alpha})`
        : `rgba(200,180,20,${alpha})`;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  frame();
})();


/* ── §2b · HERO GEM + PARTICLE SPHERE ────────────
   3D rotating octahedron (gold gem) + particle sphere
   drawn on #hero-canvas. Drag to rotate; auto-spins.
──────────────────────────────────────────────── */
(function initHeroCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W, H;
  let rotX = 0.15, rotY = 0.0;
  let isDragging = false, dragX0 = 0, dragY0 = 0, saveRX = 0, saveRY = 0;

  // ── Drag-to-rotate ──────────────────────────
  canvas.addEventListener("mousedown", e => {
    isDragging = true;
    dragX0 = e.clientX; dragY0 = e.clientY;
    saveRX = rotX; saveRY = rotY;
  });
  window.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const dx = e.clientX - dragX0;
    const dy = e.clientY - dragY0;
    rotX = saveRX + dy * 0.01;
    rotY = saveRY + dx * 0.01;
  });
  window.addEventListener("mouseup", () => { isDragging = false; });

  // ── 3D projection ───────────────────────────
  function project3D(x, y, z, cx, cy) {
    const FOV = 520;
    const c1 = Math.cos(rotY), s1 = Math.sin(rotY);
    const x1 = x * c1 + z * s1, z1 = -x * s1 + z * c1;
    const c2 = Math.cos(rotX), s2 = Math.sin(rotX);
    const y2 = y * c2 - z1 * s2, z2 = y * s2 + z1 * c2;
    const s = FOV / (FOV + z2 + 400);
    return { sx: cx + x1 * s, sy: cy + y2 * s, scale: s, depth: z2 };
  }

  // ── Particle sphere storage ─────────────────
  let particles = [];   // { px, py, pz }

  function buildParticles() {
    particles = [];
    const radius = Math.min(W, H) * 0.32;
    for (let i = 0; i < 500; i++) {
      const phi   = Math.acos(1 - 2 * (i + 0.5) / 500);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      particles.push({
        px: radius * Math.sin(phi) * Math.cos(theta),
        py: radius * Math.cos(phi),
        pz: radius * Math.sin(phi) * Math.sin(theta)
      });
    }
  }

  // ── Resize ──────────────────────────────────
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildParticles();
  }

  // ── Gem (octahedron) ────────────────────────
  const FACES = [
    [0,2,4],[0,4,3],[0,3,5],[0,5,2],
    [1,4,2],[1,2,5],[1,5,3],[1,3,4]
  ];

  // Normalise a 3-vector
  function norm3(v) {
    const m = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]) || 1;
    return [v[0]/m, v[1]/m, v[2]/m];
  }

  function drawGem(cx, cy) {
    const R = Math.min(W, H) * 0.10;
    const verts = [
      [ 0,  R,  0],
      [ 0, -R,  0],
      [ R,  0,  0],
      [-R,  0,  0],
      [ 0,  0,  R],
      [ 0,  0, -R]
    ];

    const light = norm3([0.4, 0.6, 0.7]);

    // Project all vertices
    const proj = verts.map(v => project3D(v[0], v[1], v[2], cx, cy));

    // Build face data
    const faceData = FACES.map(face => {
      const [i0, i1, i2] = face;
      const p0 = proj[i0], p1 = proj[i1], p2 = proj[i2];
      const avgDepth = (p0.depth + p1.depth + p2.depth) / 3;

      // Edge vectors in 3D for normal
      const v0 = verts[i0], v1 = verts[i1], v2 = verts[i2];
      const e1 = [v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]];
      const e2 = [v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]];
      const nx = e1[1]*e2[2] - e1[2]*e2[1];
      const ny = e1[2]*e2[0] - e1[0]*e2[2];
      const nz = e1[0]*e2[1] - e1[1]*e2[0];
      const n  = norm3([nx, ny, nz]);
      const dot = n[0]*light[0] + n[1]*light[1] + n[2]*light[2];

      return { face, proj: [p0, p1, p2], dot, avgDepth };
    });

    // Sort back-to-front
    faceData.sort((a, b) => b.avgDepth - a.avgDepth);

    faceData.forEach(({ proj: [p0, p1, p2], dot }) => {
      ctx.beginPath();
      ctx.moveTo(p0.sx, p0.sy);
      ctx.lineTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.closePath();

      if (dot >= 0) {
        const alpha = Math.max(0.02, dot * 0.25);
        ctx.fillStyle = `rgba(220,175,55,${alpha})`;
        ctx.fill();
      }

      ctx.strokeStyle = dot >= 0
        ? `rgba(233,196,106,0.55)`
        : `rgba(233,196,106,0.15)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  }

  // ── Frame loop ──────────────────────────────
  function frame() {
    ctx.clearRect(0, 0, W, H);

    // Auto-rotate when not dragging
    if (!isDragging) rotY += 0.003;

    const cx = W / 2, cy = H / 2;

    // Project all particles
    const projected = particles.map((p, i) => {
      const pr = project3D(p.px, p.py, p.pz, cx, cy);
      return { i, sx: pr.sx, sy: pr.sy, scale: pr.scale, depth: pr.depth, px: p.px, py: p.py, pz: p.pz };
    });

    // Sort farthest → closest
    projected.sort((a, b) => b.depth - a.depth);

    // ── Particle connections ─────────────────
    const sphereR = Math.min(W, H) * 0.32 || 1;
    for (let i = 0; i < projected.length; i++) {
      const A = projected[i];
      let connected = 0;
      for (let j = i + 1; j < projected.length && connected < 2; j++) {
        const B = projected[j];
        // Angular distance via dot product of unit vectors
        const dot = (A.px * B.px + A.py * B.py + A.pz * B.pz) / (sphereR * sphereR);
        const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
        if (ang < 0.18) {
          ctx.beginPath();
          ctx.moveTo(A.sx, A.sy);
          ctx.lineTo(B.sx, B.sy);
          ctx.strokeStyle = "rgba(220,175,55,0.04)";
          ctx.lineWidth = 0.6;
          ctx.stroke();
          connected++;
        }
      }
    }

    // ── Particles ────────────────────────────
    projected.forEach(p => {
      const size  = 1.5 + p.scale * 1.8;
      const alpha = 0.04 + Math.max(0, p.scale - 0.5) * 0.25;
      // Interpolate gold (220,175,55) → amber (164,113,72) by depth
      const maxD = sphereR;
      const t = Math.max(0, Math.min(1, (p.depth + maxD) / (2 * maxD)));
      const r = Math.round(220 + (164 - 220) * t);
      const g = Math.round(175 + (113 - 175) * t);
      const b = Math.round(55  + (72  - 55)  * t);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    });

    // ── Gem ──────────────────────────────────
    drawGem(cx, cy);

    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  frame();
})();


/* ── §3 · CURSOR ──────────────────────────────── */
(function initCursor() {
  const cursorEl = document.getElementById("cursor");
  if (!cursorEl) return;
  let cx = 0, cy = 0, mx = 0, my = 0;
  document.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });
  const inner = cursorEl.querySelector(".cursor-inner");
  function loop() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    cursorEl.style.left = cx + "px";
    cursorEl.style.top  = cy + "px";
    if (inner) {
      inner.style.left = (mx - cx) + "px";
      inner.style.top  = (my - cy) + "px";
    }
    requestAnimationFrame(loop);
  }
  loop();
  document.querySelectorAll("a, button").forEach(el => {
    el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
  });
})();


/* ── §4 · MOUSE GLOW ──────────────────────────── */
(function initMouseGlow() {
  const glow = document.getElementById("mouseGlow");
  if (!glow) return;
  document.addEventListener("mousemove", e => {
    glow.style.left = e.clientX + "px";
    glow.style.top  = e.clientY + "px";
  });
})();


/* ── §5 · SCROLL REVEAL ───────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll(".reveal-up");
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
})();


/* ── §6 · STICKY SCROLL PANEL ACTIVATION ─────── */
(function initStickyScroll() {
  const panels = document.querySelectorAll(".sticky-panel");
  if (!panels.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("is-active");
      else e.target.classList.remove("is-active");
    });
  }, { threshold: 0.35 });
  panels.forEach(p => obs.observe(p));
})();


/* ── §7 · VIDEO HOVER PLAY ────────────────────── */
(function initVideoHover() {
  document.querySelectorAll(".video-el").forEach(v => {
    const wrap = v.closest(".video-wrap");
    if (!wrap) return;
    wrap.addEventListener("mouseenter", () => v.play && v.play().catch(() => {}));
    wrap.addEventListener("mouseleave", () => { v.pause && v.pause(); v.currentTime = 0; });
  });
})();


/* ── §8 · TEXT SCRAMBLE ───────────────────────── */
(function initScramble() {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";
  const DURATION = 620;
  function scramble(el) {
    const orig = el.textContent, len = orig.length, start = performance.now();
    el.style.fontFamily = "'Courier New', monospace";
    function tick(now) {
      const pct = Math.min(1, (now - start) / DURATION);
      const rev = Math.floor(pct * pct * len);
      let out = "";
      for (let i = 0; i < len; i++) {
        if (orig[i] === " ") { out += " "; continue; }
        out += i < rev ? orig[i] : CHARS[(Math.random() * CHARS.length) | 0];
      }
      el.textContent = out;
      if (pct < 1) requestAnimationFrame(tick);
      else { el.textContent = orig; el.style.fontFamily = ""; }
    }
    requestAnimationFrame(tick);
  }
  const targets = document.querySelectorAll(".section-title, .hero-title, .ht-l1, .ht-l2, .ht-l3, .sp-title");
  if (!targets.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { scramble(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.15 });
  targets.forEach(el => obs.observe(el));
})();


/* ── §9 · IMAGE CARD 3D TILT ─────────────────── */
(function initCardTilt() {
  document.querySelectorAll(".sp-img-wrap, .art-cell, .about-portrait").forEach(card => {
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform =
        `perspective(500px) rotateY(${x * 16}deg) rotateX(${-y * 12}deg) translateZ(10px)`;
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });
})();


/* ── §10 · HAMBURGER NAV ──────────────────────── */
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
