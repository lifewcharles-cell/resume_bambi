(function initLoader() {
  const loader = document.getElementById("loader");
  const fill = document.getElementById("loaderProgress");
  const body = document.body;
  if (!loader) return;
  if (sessionStorage.getItem("bambi-pt")) {
    sessionStorage.removeItem("bambi-pt");
    loader.remove();
    return;
  }
  body.classList.add("loading");
  setTimeout(() => loader.classList.add("loader-active"), 150);
  let pct = 0;
  const tick = setInterval(() => {
    pct = pct < 85 ? pct + 0.8 : pct + 2;
    if (fill) fill.style.width = Math.min(pct, 100) + "%";
    if (pct >= 100) clearInterval(tick);
  }, 40);
  setTimeout(() => loader.classList.add("loader-hidden"), 5000);
  setTimeout(() => {
    loader.remove();
    body.classList.remove("loading");
  }, 6600);
})();

(function initTheme() {
  const btn = document.getElementById("themeToggle");
  const body = document.body;
  if (!btn) return;
  if (localStorage.getItem("bambi-world-theme") === "light") {
    body.classList.add("light-mode");
  }
  btn.addEventListener("click", () => {
    body.classList.toggle("light-mode");
    localStorage.setItem(
      "bambi-world-theme",
      body.classList.contains("light-mode") ? "light" : "dark",
    );
  });
})();

(function initScrollColor() {
  const gold = { r: 233, g: 196, b: 106 };
  const amber = { r: 164, g: 113, b: 72 };
  function lerp(a, b, t) {
    return (a + (b - a) * t) | 0;
  }
  function update() {
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const pct = Math.min(1, window.scrollY / maxScroll);
    const r = lerp(gold.r, amber.r, pct);
    const g = lerp(gold.g, amber.g, pct);
    const b = lerp(gold.b, amber.b, pct);
    document.documentElement.style.setProperty(
      "--clr-scroll",
      `rgb(${r},${g},${b})`,
    );
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
})();

(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DS = 4;
  let W, H, img, px;
  function resize() {
    W = Math.ceil(window.innerWidth / DS);
    H = Math.ceil(window.innerHeight / DS);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    img = ctx.createImageData(W, H);
    px = img.data;
  }
  let t = 0,
    lx = 0.35,
    ly = 0.28,
    tlx = 0.35,
    tly = 0.28;
  function hf(wx, wy, ti) {
    return (
      Math.sin(wx * 0.88 + ti * 0.91) * Math.cos(wy * 0.72 - ti * 0.63) * 0.24 +
      Math.sin(wx * 0.43 - ti * 0.54) * Math.cos(wy * 1.19 + ti * 0.38) * 0.21 +
      Math.cos(wx * 1.34 + wy * 0.87 + ti * 1.03) * 0.18 +
      Math.sin(wx * 0.27 + wy * 0.53 - ti * 0.72) * 0.16 +
      Math.sin(wx * 2.18 + wy * 1.84 + ti * 1.41) * 0.08 +
      Math.cos(wx * 0.14 - wy * 0.2 + ti * 0.27) * 0.13
    );
  }
  function frame() {
    t += 0.003;
    lx += (tlx - lx) * 0.06;
    ly += (tly - ly) * 0.06;
    const rlx = lx * 2 - 1,
      rly = ly * 2 - 1,
      rlz = 1.4;
    const ll = Math.sqrt(rlx * rlx + rly * rly + rlz * rlz);
    const Lx = rlx / ll,
      Ly = rly / ll,
      Lz = rlz / ll;
    const WS = 0.085,
      NAMP = 3.5,
      EPS = 0.6;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const wx = x * WS,
          wy = y * WS;
        const hC = hf(wx, wy, t),
          hR = hf(wx + EPS, wy, t),
          hD = hf(wx, wy + EPS, t);
        let nx = -(hR - hC) * NAMP,
          ny = -(hD - hC) * NAMP,
          nz = 1.0;
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= nl;
        ny /= nl;
        nz /= nl;
        const NdL = nx * Lx + ny * Ly + nz * Lz;
        const diff = Math.max(0, NdL);
        const Rz = Math.max(0, 2 * NdL * nz - Lz);
        let sT = Rz * Rz;
        sT *= sT;
        sT *= sT;
        sT *= sT;
        sT *= Rz * Rz * Rz * Rz * Rz * Rz;
        const sS = Rz * Rz * Rz * Rz * Rz;
        const hn = (hC + 1.0) * 0.5;
        const spR = 255 * hn + 215 * (1 - hn);
        const spG = 255 * hn + 218 * (1 - hn);
        const spB = 255 * hn + 226 * (1 - hn);
        const r = Math.min(255, 12 + diff * 16 + sT * (spR | 0) + sS * 45) | 0;
        const g = Math.min(255, 12 + diff * 16 + sT * (spG | 0) + sS * 45) | 0;
        const b = Math.min(255, 14 + diff * 18 + sT * (spB | 0) + sS * 50) | 0;
        const a =
          Math.min(255, (sT * 0.72 + sS * 0.09 + diff * 0.025) * 255) | 0;
        const i = (y * W + x) * 4;
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
        px[i + 3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(frame);
  }
  window.addEventListener("mousemove", (e) => {
    tlx = e.clientX / window.innerWidth;
    tly = e.clientY / window.innerHeight;
  });
  window.addEventListener("resize", resize);
  resize();
  frame();
})();

(function initHeroCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W, H;
  let rotX = 0.15,
    rotY = 0.0;
  let isDragging = false,
    dragX0 = 0,
    dragY0 = 0,
    saveRX = 0,
    saveRY = 0;

  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragX0 = e.clientX;
    dragY0 = e.clientY;
    saveRX = rotX;
    saveRY = rotY;
  });
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragX0;
    const dy = e.clientY - dragY0;
    rotX = saveRX + dy * 0.01;
    rotY = saveRY + dx * 0.01;
  });
  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  function project3D(x, y, z, cx, cy) {
    const FOV = 520;
    const c1 = Math.cos(rotY),
      s1 = Math.sin(rotY);
    const x1 = x * c1 + z * s1,
      z1 = -x * s1 + z * c1;
    const c2 = Math.cos(rotX),
      s2 = Math.sin(rotX);
    const y2 = y * c2 - z1 * s2,
      z2 = y * s2 + z1 * c2;
    const s = FOV / (FOV + z2 + 400);
    return { sx: cx + x1 * s, sy: cy + y2 * s, scale: s, depth: z2 };
  }

  let particles = [];

  function buildParticles() {
    particles = [];
    const radius = Math.min(W, H) * 0.32;
    for (let i = 0; i < 500; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 500);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      particles.push({
        px: radius * Math.sin(phi) * Math.cos(theta),
        py: radius * Math.cos(phi),
        pz: radius * Math.sin(phi) * Math.sin(theta),
      });
    }
  }

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildParticles();
  }

  const FACES = [
    [0, 2, 4],
    [0, 4, 3],
    [0, 3, 5],
    [0, 5, 2],
    [1, 4, 2],
    [1, 2, 5],
    [1, 5, 3],
    [1, 3, 4],
  ];

  function norm3(v) {
    const m = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    return [v[0] / m, v[1] / m, v[2] / m];
  }

  function drawGem(cx, cy) {
    const R = Math.min(W, H) * 0.1;
    const verts = [
      [0, R, 0],
      [0, -R, 0],
      [R, 0, 0],
      [-R, 0, 0],
      [0, 0, R],
      [0, 0, -R],
    ];

    const light = norm3([0.4, 0.6, 0.7]);
    const proj = verts.map((v) => project3D(v[0], v[1], v[2], cx, cy));

    const faceData = FACES.map((face) => {
      const [i0, i1, i2] = face;
      const p0 = proj[i0],
        p1 = proj[i1],
        p2 = proj[i2];
      const avgDepth = (p0.depth + p1.depth + p2.depth) / 3;
      const v0 = verts[i0],
        v1 = verts[i1],
        v2 = verts[i2];
      const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
      const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
      const nx = e1[1] * e2[2] - e1[2] * e2[1];
      const ny = e1[2] * e2[0] - e1[0] * e2[2];
      const nz = e1[0] * e2[1] - e1[1] * e2[0];
      const n = norm3([nx, ny, nz]);
      const dot = n[0] * light[0] + n[1] * light[1] + n[2] * light[2];
      return { face, proj: [p0, p1, p2], dot, avgDepth };
    });

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
      ctx.strokeStyle =
        dot >= 0 ? `rgba(233,196,106,0.55)` : `rgba(233,196,106,0.15)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    if (!isDragging) rotY += 0.003;

    const cx = W / 2,
      cy = H / 2;

    const projected = particles.map((p, i) => {
      const pr = project3D(p.px, p.py, p.pz, cx, cy);
      return {
        i,
        sx: pr.sx,
        sy: pr.sy,
        scale: pr.scale,
        depth: pr.depth,
        px: p.px,
        py: p.py,
        pz: p.pz,
      };
    });

    projected.sort((a, b) => b.depth - a.depth);

    const sphereR = Math.min(W, H) * 0.32 || 1;
    for (let i = 0; i < projected.length; i++) {
      const A = projected[i];
      let connected = 0;
      for (let j = i + 1; j < projected.length && connected < 2; j++) {
        const B = projected[j];
        const dot =
          (A.px * B.px + A.py * B.py + A.pz * B.pz) / (sphereR * sphereR);
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

    projected.forEach((p) => {
      const size = 1.5 + p.scale * 1.8;
      const alpha = 0.04 + Math.max(0, p.scale - 0.5) * 0.25;
      const maxD = sphereR;
      const t = Math.max(0, Math.min(1, (p.depth + maxD) / (2 * maxD)));
      const r = Math.round(220 + (164 - 220) * t);
      const g = Math.round(175 + (113 - 175) * t);
      const b = Math.round(55 + (72 - 55) * t);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    });

    drawGem(cx, cy);
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  frame();
})();

(function initMouseGlow() {
  const glow = document.getElementById("mouseGlow");
  if (!glow) return;
  document.addEventListener("mousemove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });
})();

(function initReveal() {
  const els = document.querySelectorAll(".reveal-up");
  if (!els.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  els.forEach((el) => obs.observe(el));
})();

(function initStickyScroll() {
  const panels = document.querySelectorAll(".sticky-panel");
  if (!panels.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-active");
        else e.target.classList.remove("is-active");
      });
    },
    { threshold: 0.35 },
  );
  panels.forEach((p) => obs.observe(p));
})();

(function initVideoHover() {
  document.querySelectorAll(".video-el").forEach((v) => {
    const wrap = v.closest(".video-wrap");
    if (!wrap) return;
    wrap.addEventListener(
      "mouseenter",
      () => v.play && v.play().catch(() => {}),
    );
    wrap.addEventListener("mouseleave", () => {
      v.pause && v.pause();
      v.currentTime = 0;
    });
  });
})();

(function initScramble() {
  const CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";
  const DURATION = 620;
  function scramble(el) {
    const orig = el.textContent,
      len = orig.length,
      start = performance.now();
    el.style.fontFamily = "'Courier New', monospace";
    function tick(now) {
      const pct = Math.min(1, (now - start) / DURATION);
      const rev = Math.floor(pct * pct * len);
      let out = "";
      for (let i = 0; i < len; i++) {
        if (orig[i] === " ") {
          out += " ";
          continue;
        }
        out += i < rev ? orig[i] : CHARS[(Math.random() * CHARS.length) | 0];
      }
      el.textContent = out;
      if (pct < 1) requestAnimationFrame(tick);
      else {
        el.textContent = orig;
        el.style.fontFamily = "";
      }
    }
    requestAnimationFrame(tick);
  }
  const targets = document.querySelectorAll(
    ".section-title, .hero-title, .ht-l1, .ht-l2, .ht-l3, .sp-title",
  );
  if (!targets.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          scramble(e.target);
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  targets.forEach((el) => obs.observe(el));
})();

(function initCardTilt() {
  document
    .querySelectorAll(".sp-img-wrap, .art-cell, .about-portrait")
    .forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(500px) rotateY(${x * 16}deg) rotateX(${-y * 12}deg) translateZ(10px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
})();

(function initHamburger() {
  const btn = document.getElementById("hamBtn");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open);
  });
  menu.querySelectorAll(".mob-link").forEach((a) => {
    a.addEventListener("click", () => {
      menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
    });
  });
})();

gsap.registerPlugin(ScrollTrigger);

gsap.to(".hero-content", {
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    scrub: 1.5,
  },
  y: -80,
  ease: "none",
});

gsap.from(".art-cell", {
  scrollTrigger: { trigger: ".art-grid-2x2", start: "top 80%" },
  scale: 0.82,
  opacity: 0,
  duration: 0.9,
  stagger: 0.1,
  ease: "power3.out",
  clearProps: "transform,opacity",
});

gsap.from(".about-img", {
  scrollTrigger: { trigger: ".about-grid", start: "top 82%" },
  x: -50,
  opacity: 0,
  duration: 1.0,
  ease: "power3.out",
  clearProps: "transform,opacity",
});
gsap.from(".about-text", {
  scrollTrigger: { trigger: ".about-grid", start: "top 82%" },
  x: 50,
  opacity: 0,
  duration: 1.0,
  ease: "power3.out",
  clearProps: "transform,opacity",
});

let tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".about-section",
    pin: true,
    start: "top top",
    end: "+=500",
    scrub: 1,
    snap: {
      snapTo: "labels",
      duration: { min: 0.2, max: 3 },
      delay: 0.2,
      ease: "power1.inOut",
    },
  },
});
tl.addLabel("start")
  .from(".about-quote", { scale: 0.3, rotation: 45, autoAlpha: 0 })
  .addLabel("color")
  .from(".about-body", { y: 30, autoAlpha: 0 })
  .addLabel("spin")
  .to(".about-quote-mark", { rotation: 360, ease: "none" })
  .addLabel("end");

gsap.utils.toArray(".section-title, .sp-title").forEach((el) => {
  gsap.from(el, {
    scrollTrigger: {
      trigger: el,
      start: "top 88%",
      toggleActions: "play none none none",
    },
    x: -36,
    opacity: 0,
    duration: 1.0,
    ease: "power3.out",
    clearProps: "transform,opacity",
  });
});

gsap.from(".footer-col", {
  scrollTrigger: { trigger: ".site-footer", start: "top 92%" },
  y: 28,
  opacity: 0,
  duration: 0.8,
  stagger: 0.1,
  ease: "power2.out",
  clearProps: "transform,opacity",
});
