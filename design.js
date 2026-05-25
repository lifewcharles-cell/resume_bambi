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
    pct = pct < 85 ? pct + 0.9 : pct + 2.5;
    if (fill) fill.style.width = Math.min(pct, 100) + "%";
    if (pct >= 100) clearInterval(tick);
  }, 40);

  setTimeout(() => loader.classList.add("loader-hidden"), 5000);
  setTimeout(() => {
    loader.remove();
    body.classList.remove("loading");
  }, 6600);
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

(function initCardDepth() {
  const GRID_SELECTORS = [".mag-grid", ".mag-col-right", ".work-grid"];
  const CARD_SELECTORS = ".mag-card, .work-card";

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
    cardsIn(grid).forEach((c) => {
      c.classList.remove("card-focus", "card-recede");
    });
  }

  document.querySelectorAll(CARD_SELECTORS).forEach((card) => {
    card.addEventListener("mouseenter", () => {
      const grid = nearestGrid(card);
      if (!grid) return;
      clearAll(grid);
      card.classList.add("card-focus");
      cardsIn(grid).forEach((sibling) => {
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
    ".section-title, .hero-title, .ht-l1, .ht-l2, .sp-title",
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
  document.querySelectorAll(".mag-card, .work-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 18}deg) rotateX(${-y * 14}deg) translateZ(12px)`;
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

gsap.from(".ht-l1, .ht-l2", {
  scrollTrigger: {
    trigger: ".hero",
    start: "top 80%",
    toggleActions: "play none none none",
  },
  y: 50,
  opacity: 0,
  duration: 1.1,
  stagger: 0.2,
  ease: "power3.out",
  clearProps: "transform,opacity",
});

gsap.utils.toArray(".brand-row").forEach((row, i) => {
  gsap.from(row, {
    scrollTrigger: {
      trigger: row,
      start: "top 85%",
      toggleActions: "play none none none",
    },
    x: i % 2 === 0 ? -55 : 55,
    opacity: 0,
    duration: 1.0,
    ease: "power3.out",
    clearProps: "transform,opacity",
  });
});

gsap.from(".mag-card, .work-card", {
  scrollTrigger: { trigger: ".mag-grid", start: "top 80%" },
  y: 55,
  opacity: 0,
  duration: 0.9,
  stagger: 0.12,
  ease: "power3.out",
  clearProps: "transform,opacity",
});

let tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".container",
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
  .from(".section-title", {
    scale: 0.3,
    rotation: 45,
    autoAlpha: 0,
    stagger: 0.15,
  })
  .addLabel("color")
  .from(".pr-statement", { y: 30, autoAlpha: 0 })
  .addLabel("spin")
  .to(".hero-bg-mark", { rotation: 360, ease: "none" })
  .addLabel("end");

gsap.utils.toArray(".section-title").forEach((el) => {
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
