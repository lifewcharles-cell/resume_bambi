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
    pct = pct < 85 ? pct + 0.9 : pct + 2;
    if (fill) fill.style.width = Math.min(pct, 100) + "%";
    if (pct >= 100) clearInterval(tick);
  }, 40);
  setTimeout(() => loader.classList.add("loader-hidden"), 5000);
  setTimeout(() => {
    loader.remove();
    body.classList.remove("loading");
  }, 6600);
})();

(function initMouseGlow() {
  const glow = document.getElementById("mouseGlow");
  if (!glow) return;
  document.addEventListener("mousemove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });
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

(function initParallax() {
  const content = document.querySelector(".hero-content");
  const rings = document.querySelectorAll(".hero-ring");
  if (!content) return;

  let tx = 0,
    ty = 0; 
  let rx = [0, 0, 0],
    ry = [0, 0, 0]; 

  const TEXT_DEPTH = 7; 
  const RING_DEPTHS = [14, 10, 6]; 

  window.addEventListener("mousemove", (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2; 
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;

    tx = nx * TEXT_DEPTH;
    ty = ny * TEXT_DEPTH;

    rings.forEach((_, i) => {
      rx[i] = -nx * RING_DEPTHS[i];
      ry[i] = -ny * RING_DEPTHS[i];
    });
  });

  
  let cx = 0,
    cy = 0;
  let crx = [0, 0, 0],
    cry = [0, 0, 0];

  function tick() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    content.style.transform = `translate(${cx}px, ${cy}px)`;

    rings.forEach((ring, i) => {
      crx[i] += (rx[i] - crx[i]) * 0.06;
      cry[i] += (ry[i] - cry[i]) * 0.06;
      ring.style.transform = `translate(calc(-50% + ${crx[i]}px), calc(-50% + ${cry[i]}px))`;
    });

    requestAnimationFrame(tick);
  }
  tick();
})();

(function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  els.forEach((el) => obs.observe(el));
})();

(function initScramble() {
  const CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";
  const DURATION = 620;

  function scramble(el) {
    const original = el.textContent;
    const len = original.length;
    const start = performance.now();
    el.style.fontFamily = "'Courier New', Courier, monospace";

    function tick(now) {
      const pct = Math.min(1, (now - start) / DURATION);
      const revealed = Math.floor(pct * pct * len);
      let out = "";
      for (let i = 0; i < len; i++) {
        if (original[i] === " ") {
          out += " ";
          continue;
        }
        out +=
          i < revealed
            ? original[i]
            : CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      el.textContent = out;
      if (pct < 1) requestAnimationFrame(tick);
      else {
        el.textContent = original;
        el.style.fontFamily = "";
      }
    }
    requestAnimationFrame(tick);
  }

  const targets = document.querySelectorAll(
    ".section-title, .hero-title, .ht-line",
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

(function initHeroGlow() {
  const title = document.querySelector(".hero-title");
  if (!title) return;
  let t = 0;
  function pulse() {
    t += 0.025;
    const i = (Math.sin(t * 0.9) + 1) * 0.5;
    title.style.textShadow = `0 0 ${4 + i * 8}px rgba(196,53,86,${0.28 + i * 0.22}),
       0 0 ${8 + i * 16}px rgba(201,169,110,${0.1 + i * 0.1})`;
    requestAnimationFrame(pulse);
  }
  pulse();
})();

(function initAmbientAudio() {
  const btn = document.getElementById("ambientBtn");
  const audio = document.getElementById("ambientAudio");
  const player = document.getElementById("ambientPlayer");
  if (!btn || !audio) return;

  let ctx, analyser, src;

  function connect() {
    if (ctx) return;
    ctx = new (
      window.AudioContext ||  (window).webkitAudioContext
    )();
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
      audio
        .play()
        .then(() => {
          player.classList.add("playing");
          btn.querySelector(".amb-icon").textContent = "■";
        })
        .catch(() => {});
    } else {
      audio.pause();
      player.classList.remove("playing");
      btn.querySelector(".amb-icon").textContent = "♪";
    }
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
  y: -90,
  ease: "none",
});

gsap.utils.toArray(".section-title").forEach((el) => {
  gsap.from(el, {
    scrollTrigger: {
      trigger: el,
      start: "top 88%",
      toggleActions: "play none none none",
    },
    x: -40,
    opacity: 0,
    duration: 1.0,
    ease: "power3.out",
    clearProps: "transform,opacity",
  });
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
  .from(".about-quote-mark", { scale: 0.3, rotation: 45, autoAlpha: 0 })
  .addLabel("color")
  .from(".about-quote", { y: 30, autoAlpha: 0 })
  .addLabel("spin")
  .from(".about-inner", { y: 20, autoAlpha: 0 })
  .addLabel("end");

gsap.from(".cta-band", {
  scrollTrigger: { trigger: ".cta-band", start: "top 82%" },
  scale: 0.95,
  opacity: 0,
  duration: 1.2,
  ease: "power2.out",
  clearProps: "transform,opacity",
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
