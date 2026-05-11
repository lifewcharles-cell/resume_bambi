/* ================================================
   BAMBI DESIGN PAGE — design.js
   §1  initLoader      — progress bar + timing
   §2  initCanvas      — constellation / neural net
   §3  initCursor      — lagging ring + inner dot
   §4  initMouseGlow   — ambient halo
   §5  initReveal      — IntersectionObserver
   §6  initVideoHover  — play video on hover
================================================ */

/* ── §1 · LOADER ──────────────────────────────── */
(function initLoader() {
  const loader = document.getElementById("loader");
  const fill   = document.getElementById("loaderProgress");
  const body   = document.body;
  if (!loader) return;

  body.classList.add("loading");
  setTimeout(() => loader.classList.add("loader-active"), 150);

  // Animate progress fill: 0→85% over 4s, 85→100% fast at end
  let pct = 0;
  const tick = setInterval(() => {
    pct = pct < 85 ? pct + 0.9 : pct + 2.5;
    if (fill) fill.style.width = Math.min(pct, 100) + "%";
    if (pct >= 100) clearInterval(tick);
  }, 40);

  setTimeout(() => loader.classList.add("loader-hidden"), 5000);
  setTimeout(() => { loader.remove(); body.classList.remove("loading"); }, 6600);
})();


/* ── §2 · BRUTALIST 3D CANVAS ──────────────────
   Perspective wireframe grid with rising/falling
   rectangular pillars. Mouse tilts the scene.
   Hard-edge geometric aesthetic — no curves.
   Glitch flash fires randomly every ~4s.
──────────────────────────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W, H, t = 0;
  let rotX = 0.55, rotY = 0;
  let mx = 0.5, my = 0.5;
  let isDragging = false, dragX0 = 0, dragY0 = 0, dragRX0 = 0, dragRY0 = 0;
  let glitchActive = false, glitchFrames = 0;

  // Grid parameters
  const COLS = 16, ROWS = 16, SPACING = 120, FOV = 700;
  let pillars = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    canvas.style.cursor = "grab";
    buildPillars();
  }

  function buildPillars() {
    pillars = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        pillars.push({
          bx:    (c - COLS / 2 + 0.5) * SPACING,
          bz:    (r - ROWS / 2 + 0.5) * SPACING,
          baseH: 10 + Math.random() * 180,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.6,
          row: r, col: c
        });
      }
    }
  }

  // 3D → 2D projection
  function project(x, y, z) {
    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    const cx = Math.cos(rotX), sx = Math.sin(rotX);
    const y2 = y * cx - z1 * sx;
    const z2 = y * sx + z1 * cx;
    const s  = FOV / (FOV + z2 + 500);
    return { sx: W / 2 + x1 * s, sy: H / 2 + y2 * s, depth: z2, scale: s };
  }

  // Color: steel-grey → blood-red based on height + depth (Ex Machina palette)
  function pillarColor(depth, heightPct, alpha) {
    const c  = Math.max(0, Math.min(1, (Math.sin(t * 0.06 + heightPct * 3) + 1) * 0.5));
    // steel (#6d7c83) → vivid red (#db2d2b) at tall/active pillars
    const nr = (109 * (1 - c) + 219 * c) | 0;
    const ng = (124 * (1 - c) +  45 * c) | 0;
    const nb = (131 * (1 - c) +  43 * c) | 0;
    const depthFade = Math.max(0.04, Math.min(1, 1 - (depth + 800) / 2000));
    return `rgba(${nr},${ng},${nb},${(alpha * depthFade).toFixed(3)})`;
  }

  // Draw a single wireframe rectangular prism
  function drawPillar(bx, bz, height, depth) {
    const hw = SPACING * 0.22;  // half-width of pillar
    const topY = -height, botY = 0;

    // 8 corners: top 4 and bottom 4
    const corners = [
      project(bx - hw, topY, bz - hw),
      project(bx + hw, topY, bz - hw),
      project(bx + hw, topY, bz + hw),
      project(bx - hw, topY, bz + hw),
      project(bx - hw, botY, bz - hw),
      project(bx + hw, botY, bz - hw),
      project(bx + hw, botY, bz + hw),
      project(bx - hw, botY, bz + hw),
    ];

    const hp = height / 250;
    const baseAlpha = glitchActive ? 0.55 : 0.28;
    const strokeA   = pillarColor(depth, hp, baseAlpha);
    const topA      = pillarColor(depth, hp, baseAlpha * 1.6);

    ctx.strokeStyle = strokeA;
    ctx.lineWidth   = glitchActive ? 1.8 : 0.8;

    // Top face
    ctx.strokeStyle = topA;
    ctx.beginPath();
    ctx.moveTo(corners[0].sx, corners[0].sy);
    ctx.lineTo(corners[1].sx, corners[1].sy);
    ctx.lineTo(corners[2].sx, corners[2].sy);
    ctx.lineTo(corners[3].sx, corners[3].sy);
    ctx.closePath();
    ctx.stroke();

    // Vertical edges
    ctx.strokeStyle = strokeA;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(corners[i].sx,     corners[i].sy);
      ctx.lineTo(corners[i + 4].sx, corners[i + 4].sy);
      ctx.stroke();
    }

    // Floor face (faint)
    ctx.strokeStyle = pillarColor(depth, 0, baseAlpha * 0.4);
    ctx.beginPath();
    ctx.moveTo(corners[4].sx, corners[4].sy);
    ctx.lineTo(corners[5].sx, corners[5].sy);
    ctx.lineTo(corners[6].sx, corners[6].sy);
    ctx.lineTo(corners[7].sx, corners[7].sy);
    ctx.closePath();
    ctx.stroke();
  }

  // Draw the ground grid plane
  function drawGrid() {
    const extent = (Math.max(COLS, ROWS) / 2 + 1) * SPACING;
    const step   = SPACING;
    ctx.lineWidth = 0.4;

    for (let x = -extent; x <= extent; x += step) {
      const a = project(x, 0, -extent);
      const b = project(x, 0,  extent);
      const depthFade = Math.max(0, 1 - Math.abs(x) / extent);
      ctx.strokeStyle = `rgba(65,73,79,${(0.14 * depthFade).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    for (let z = -extent; z <= extent; z += step) {
      const a = project(-extent, 0, z);
      const b = project( extent, 0, z);
      const depthFade = Math.max(0, 1 - Math.abs(z) / extent);
      ctx.strokeStyle = `rgba(65,73,79,${(0.14 * depthFade).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
  }

  canvas.addEventListener("mousedown", e => {
    isDragging = true; dragX0 = e.clientX; dragY0 = e.clientY;
    dragRX0 = rotX; dragRY0 = rotY;
    canvas.style.cursor = "grabbing";
  });
  window.addEventListener("mouseup", () => { isDragging = false; canvas.style.cursor = "grab"; });
  document.addEventListener("mousemove", e => {
    if (isDragging) {
      rotX = Math.max(0.05, Math.min(1.55, dragRX0 + (e.clientY - dragY0) * 0.006));
      rotY = dragRY0 + (e.clientX - dragX0) * 0.006;
    } else {
      mx = e.clientX / W; my = e.clientY / H;
    }
  });

  window.addEventListener("resize", resize);

  let glitchCountdown = 240; // frames until next glitch

  function frame() {
    ctx.fillStyle = "rgba(7,11,13,0.76)";
    ctx.fillRect(0, 0, W, H);
    t += 0.006;

    // Mouse tilts the scene ±0.18 rad (only when not drag-orbiting)
    if (!isDragging) {
      rotX += (0.52 + (my - 0.5) * 0.18 - rotX) * 0.03;
      rotY += ((mx - 0.5) * 0.22 - rotY) * 0.03;
      // Slow breath-orbit — barely perceptible, always alive
      rotY += 0.00018;
    }

    // Glitch trigger
    glitchCountdown--;
    if (glitchCountdown <= 0) {
      glitchActive  = true;
      glitchCountdown = 180 + Math.random() * 300;
    }
    if (glitchActive) {
      glitchFrames++;
      if (glitchFrames > 4) { glitchActive = false; glitchFrames = 0; }
    }

    // Glitch scanline flash — blood red
    if (glitchActive) {
      const gy = Math.random() * H;
      ctx.fillStyle = `rgba(219,45,43,0.07)`;
      ctx.fillRect(0, gy, W, 1 + Math.random() * 6);
      // occasional red vertical tear
      if (Math.random() > 0.5) {
        const gx = Math.random() * W;
        ctx.fillStyle = `rgba(164,23,21,0.05)`;
        ctx.fillRect(gx, 0, 1 + Math.random() * 3, H);
      }
    }

    // Ground grid
    drawGrid();

    // Sort pillars back→front for painter's algorithm
    const sorted = pillars.slice().sort((a, b) => {
      const pa = project(a.bx, 0, a.bz);
      const pb = project(b.bx, 0, b.bz);
      return pb.depth - pa.depth;
    });

    sorted.forEach(p => {
      const h = p.baseH * (0.6 + Math.sin(t * p.speed + p.phase) * 0.4);
      const base = project(p.bx, 0, p.bz);
      drawPillar(p.bx, p.bz, h, base.depth);
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

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


/* ── §6 · VIDEO HOVER PLAY ────────────────────── */
(function initVideoHover() {
  document.querySelectorAll(".video-el").forEach(v => {
    const wrap = v.closest(".video-wrap");
    if (!wrap) return;
    wrap.addEventListener("mouseenter", () => v.play && v.play().catch(() => {}));
    wrap.addEventListener("mouseleave", () => { v.pause && v.pause(); v.currentTime = 0; });
  });
})();


/* ── §8 · CARD DEPTH STACK ON HOVER ─────────────
   When hovering a .mag-card or .work-card, the
   hovered card gets card-focus; siblings in the
   same grid get card-recede for a 3D depth effect.
──────────────────────────────────────────────────── */
(function initCardDepth() {
  const GRID_SELECTORS   = [".mag-grid", ".mag-col-right", ".work-grid"];
  const CARD_SELECTORS   = ".mag-card, .work-card";

  function nearestGrid(card) {
    for (const sel of GRID_SELECTORS) {
      const ancestor = card.closest(sel);
      if (ancestor) return ancestor;
    }
    return null;
  }

  function cardsIn(grid) {
    return Array.from(grid.querySelectorAll(CARD_SELECTORS));
  }

  function clearAll(grid) {
    cardsIn(grid).forEach(c => {
      c.classList.remove("card-focus", "card-recede");
    });
  }

  document.querySelectorAll(CARD_SELECTORS).forEach(card => {
    card.addEventListener("mouseenter", () => {
      const grid = nearestGrid(card);
      if (!grid) return;
      clearAll(grid);
      card.classList.add("card-focus");
      cardsIn(grid).forEach(sibling => {
        if (sibling !== card) sibling.classList.add("card-recede");
      });
    });

    card.addEventListener("mouseleave", () => {
      const grid = nearestGrid(card);
      if (!grid) return;
      clearAll(grid);
    });
  });
})();


/* ── §9 · TEXT SCRAMBLE ───────────────────────── */
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
  const targets = document.querySelectorAll(".section-title, .hero-title, .ht-l1, .ht-l2, .sp-title");
  if (!targets.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { scramble(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.15 });
  targets.forEach(el => obs.observe(el));
})();


/* ── §10 · IMAGE CARD 3D TILT ─────────────────── */
(function initCardTilt() {
  document.querySelectorAll(".mag-card, .work-card").forEach(card => {
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform =
        `perspective(600px) rotateY(${x * 18}deg) rotateX(${-y * 14}deg) translateZ(12px)`;
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });
})();


/* ── §11 · HAMBURGER NAV ──────────────────────── */
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
