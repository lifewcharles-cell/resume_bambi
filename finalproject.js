(function initLoader() {
  const loader = document.getElementById("loader");
  const body = document.body;
  if (!loader) return;

  if (sessionStorage.getItem("bambi-pt")) {
    sessionStorage.removeItem("bambi-pt");
    loader.remove();
    const tl = document.querySelector(".tagline");
    if (tl) tl.classList.add("tl-ready");
    return;
  }

  body.classList.add("loading");
  setTimeout(() => loader.classList.add("loader-active"), 150);
  setTimeout(() => loader.classList.add("loader-hidden"), 5000);
  setTimeout(() => {
    loader.remove();
    body.classList.remove("loading");
    const tl = document.querySelector(".tagline");
    if (tl) tl.classList.add("tl-ready");
  }, 6600);
})();

(function initTaglineAnim() {
  const el = document.querySelector(".tagline");
  if (!el) return;
  const text = "World's by BAMBI";
  el.setAttribute("aria-label", text);
  el.innerHTML = "";
  let idx = 0;
  [...text].forEach((ch) => {
    const span = document.createElement("span");
    if (ch === " ") {
      span.className = "tl-space";
    } else {
      span.className = ch === "·" ? "tl-sep" : "tl-char";
      span.style.setProperty("--i", idx++);
    }
    span.textContent = ch;
    el.appendChild(span);
  });
})();

(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DS = 3;
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
      NAMP = 3.8,
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

(function initPatterns() {
  const canvas = document.getElementById("pattern-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W,
    H,
    t = 0;
  let pmx = 0,
    pmy = 0,
    tpmx = 0,
    tpmy = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }

  function rgb(phase) {
    const c = (Math.sin(t * 0.2 + phase) + 1) * 0.5;
    return `rgb(${(201 * c + 196 * (1 - c)) | 0},${(169 * c + 53 * (1 - c)) | 0},${(110 * c + 86 * (1 - c)) | 0})`;
  }

  function rgbA(phase, a) {
    const c = (Math.sin(t * 0.2 + phase) + 1) * 0.5;
    return `rgba(${(201 * c + 196 * (1 - c)) | 0},${(169 * c + 53 * (1 - c)) | 0},${(110 * c + 86 * (1 - c)) | 0},${a})`;
  }

  function radGrad(lx, ly, r, phase) {
    const c = (Math.sin(t * 0.2 + phase) + 1) * 0.5;
    const r1 = (201 * c + 196 * (1 - c)) | 0,
      g1 = (169 * c + 53 * (1 - c)) | 0,
      b1 = (110 * c + 86 * (1 - c)) | 0;
    const r2 = (196 * (1 - c) + 201 * c) | 0,
      g2 = (53 * (1 - c) + 169 * c) | 0,
      b2 = (86 * (1 - c) + 110 * c) | 0;
    const gr = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
    gr.addColorStop(0, `rgba(${r1},${g1},${b1},1)`);
    gr.addColorStop(0.55, `rgba(${r2},${g2},${b2},0.7)`);
    gr.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
    return gr;
  }

  
  function wander(phase, amp) {
    return {
      x: Math.sin(t * 0.11 + phase * 1.31) * amp,
      y: Math.cos(t * 0.09 + phase * 0.73) * amp,
    };
  }

  
  function withOffset(dx, dy, fn) {
    ctx.save();
    ctx.translate(dx, dy);
    fn();
    ctx.restore();
  }

  
  function shippo() {
    const pulse = 1 + Math.sin(t * 0.38) * 0.13;
    const R = Math.min(W, H) * 0.062 * pulse;
    const dx = R * 1.72,
      dy = R * 1.72;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(t * 0.004);
    ctx.translate(-W, -H);

    const PAD = 2;
    const cols = Math.ceil((W * 2) / dx) + PAD * 2;
    const rows = Math.ceil((H * 2) / dy) + PAD * 2;

    
    ctx.strokeStyle = rgbA(0, 0.65);
    ctx.lineWidth = 2.4;
    ctx.shadowColor = rgbA(0, 0.9);
    ctx.shadowBlur = 16;
    ctx.globalAlpha = 0.08;
    ctx.setLineDash([R * 0.55, R * 0.65]);
    ctx.lineDashOffset = -t * 26;
    for (let row = -PAD; row < rows; row++) {
      const off = (row & 1) * dx * 0.5;
      for (let c = -PAD; c < cols; c++) {
        ctx.beginPath();
        ctx.arc(c * dx + off, row * dy, R, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.3;
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = rgb(t * 0.06);
    ctx.setLineDash([R * 0.4, R * 0.95]);
    ctx.lineDashOffset = -t * 16;
    for (let row = -PAD; row < rows; row++) {
      const off = (row & 1) * dx * 0.5;
      for (let c = -PAD; c < cols; c++) {
        ctx.beginPath();
        ctx.arc(c * dx + off, row * dy, R, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  
  function asagao(bx, by, R, petals, alpha, phase) {
    const breathe = 1 + Math.sin(t * 1.2 + phase) * 0.1;
    const dr = wander(phase, R * 0.22);
    const sR = R * breathe;

    ctx.save();
    ctx.translate(bx + dr.x, by + dr.y);
    ctx.rotate(t * 0.013 * (phase > 2 ? -1 : 1));

    ctx.shadowColor = rgb(phase);
    ctx.shadowBlur = 20;
    ctx.lineWidth = 2.0;

    
    ctx.strokeStyle = rgb(phase + 0.6);
    ctx.globalAlpha = alpha * 0.55;
    ctx.beginPath();
    ctx.arc(0, 0, sR * 1.16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = rgb(phase + 1.4);
    ctx.globalAlpha = alpha * 0.28;
    ctx.beginPath();
    ctx.arc(0, 0, sR * 1.42, 0, Math.PI * 2);
    ctx.stroke();

    
    ctx.globalAlpha = alpha;
    for (let p = 0; p < petals; p++) {
      const a = (p / petals) * Math.PI * 2;
      const px = Math.cos(a) * sR * 0.42;
      const py = Math.sin(a) * sR * 0.42;
      ctx.strokeStyle = radGrad(px, py, sR * 0.58, phase + p * 0.55);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(px, py, sR * 0.52, 0, Math.PI * 2);
      ctx.stroke();
    }

    
    ctx.strokeStyle = rgb(phase);
    ctx.fillStyle = rgb(phase + 1.3);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha * 1.4;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, sR * 0.17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, sR * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  
  function karakusa(bx, by, size, alpha, phase, dir) {
    const dr = wander(phase * 0.6, size * 0.18);
    const extend = 1 + Math.sin(t * 0.55 + phase) * 0.22;

    ctx.save();
    ctx.translate(bx + dr.x, by + dr.y);
    ctx.rotate(t * 0.011 * dir + phase);

    ctx.lineWidth = 2.0;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = rgb(phase + 1);
    ctx.shadowBlur = 18;

    ctx.strokeStyle = rgb(phase);
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const a = (i / 300) * Math.PI * 6;
      const r = (i / 300) * size * extend;
      i === 0 ? ctx.moveTo(r, 0) : ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    ctx.stroke();

    
    for (let b = 0; b < 4; b++) {
      const ba = (b / 4) * Math.PI * 2;
      const len =
        size * 0.36 * (1 + Math.sin(t * 0.8 + phase + b * 1.6) * 0.28);
      const ox = Math.cos(ba) * size * 0.55;
      const oy = Math.sin(ba) * size * 0.55;
      ctx.strokeStyle = rgb(phase + b * 1.0);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= 150; i++) {
        const a = (i / 150) * Math.PI * 4 - ba;
        const r = (i / 150) * len;
        const px = ox + r * Math.cos(a),
          py = oy + r * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  
  function kanoko(bx, by, fieldR, spacing, dotR, alpha, phase) {
    const dr = wander(phase * 0.4, fieldR * 0.14);
    ctx.save();
    ctx.translate(bx + dr.x, by + dr.y);
    ctx.shadowColor = rgb(phase);
    ctx.shadowBlur = 12;

    const cells = Math.ceil(fieldR / spacing) + 1;
    for (let row = -cells; row <= cells; row++) {
      for (let c = -cells; c <= cells; c++) {
        const x = c * spacing + (row & 1) * spacing * 0.5;
        const y = row * spacing * 0.866;
        const dist = Math.sqrt(x * x + y * y);
        if (dist > fieldR) continue;

        const fade = Math.pow(1 - dist / fieldR, 1.4);
        const ripple = 1 + Math.sin(t * 2.2 - dist * 0.13 + phase) * 0.38;
        const pulse = 1 + Math.sin(t * 1.2 + phase + dist * 0.045) * 0.26;

        ctx.fillStyle = rgb(phase + dist * 0.011);
        ctx.globalAlpha = alpha * fade;
        ctx.beginPath();
        ctx.arc(x, y, dotR * pulse * ripple, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  
  function frame() {
    ctx.clearRect(0, 0, W, H);
    t += 0.005;
    const M = Math.min(W, H);

    
    pmx += (tpmx - pmx) * 0.055;
    pmy += (tpmy - pmy) * 0.055;

    
    withOffset(pmx * 5, pmy * 5, () => shippo());

    
    withOffset(pmx * 14, pmy * 14, () => {
      asagao(W * 0.5, H * 0.5, M * 0.23, 8, 0.11, 0.8);
      karakusa(W * 0.16, H * 0.22, M * 0.15, 0.12, 0.0, 1);
      karakusa(W * 0.84, H * 0.78, M * 0.17, 0.11, 2.1, -1);
      karakusa(W * 0.82, H * 0.2, M * 0.14, 0.11, 4.2, 1);
      karakusa(W * 0.18, H * 0.8, M * 0.15, 0.11, 1.05, -1);
      karakusa(W * 0.5, H * 0.28, M * 0.12, 0.1, 3.14, 1);
      karakusa(W * 0.5, H * 0.72, M * 0.12, 0.1, 5.24, -1);
    });

    
    withOffset(pmx * 26, pmy * 26, () => {
      asagao(W * 0.07, H * 0.1, M * 0.15, 6, 0.15, 0.0);
      asagao(W * 0.93, H * 0.9, M * 0.16, 8, 0.14, 1.2);
      asagao(W * 0.91, H * 0.11, M * 0.13, 6, 0.13, 2.4);
      asagao(W * 0.09, H * 0.89, M * 0.14, 8, 0.13, 3.6);
      asagao(W * 0.5, H * 0.07, M * 0.11, 6, 0.12, 4.8);
      asagao(W * 0.5, H * 0.93, M * 0.11, 6, 0.12, 6.0);
      asagao(W * 0.12, H * 0.48, M * 0.1, 6, 0.11, 1.6);
      asagao(W * 0.88, H * 0.52, M * 0.1, 6, 0.11, 4.2);
      kanoko(W * 0.5, H * 0.17, M * 0.13, 20, 2.8, 0.13, 0.5);
      kanoko(W * 0.5, H * 0.83, M * 0.13, 20, 2.8, 0.12, 1.5);
      kanoko(W * 0.14, H * 0.5, M * 0.11, 18, 2.6, 0.12, 2.5);
      kanoko(W * 0.86, H * 0.5, M * 0.11, 18, 2.6, 0.11, 3.5);
      kanoko(W * 0.28, H * 0.35, M * 0.09, 16, 2.4, 0.1, 4.5);
      kanoko(W * 0.72, H * 0.65, M * 0.09, 16, 2.4, 0.1, 5.5);
    });

    requestAnimationFrame(frame);
  }

  document.addEventListener("mousemove", (e) => {
    tpmx = (e.clientX / window.innerWidth - 0.5) * 2;
    tpmy = (e.clientY / window.innerHeight - 0.5) * 2;
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

(function initCards() {
  const cards = document.querySelectorAll(".icard");
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty("--mx", (x / rect.width) * 100 + "%");
      card.style.setProperty("--my", (y / rect.height) * 100 + "%");

      const xPct = (x / rect.width - 0.5) * 2;
      const yPct = (y / rect.height - 0.5) * 2;

      card.style.transform = `perspective(480px) rotateX(${-yPct * 22}deg) rotateY(${xPct * 22}deg) translateZ(40px) scale(1.08)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
    });
  });

  
  const THEMES = {
    "music.html": "music",
    "design.html": "design",
    "world.html": "world",
  };
  cards.forEach((card) => {
    const href = card.getAttribute("href") || "";
    const theme = Object.keys(THEMES).find((k) => href.includes(k));
    if (!theme) return;
    card.addEventListener("mouseenter", () => {
      document.body.dataset.cardHover = THEMES[theme];
    });
    card.addEventListener("mouseleave", () => {
      delete document.body.dataset.cardHover;
    });
  });
})();

(function initEye() {
  const wrap = document.getElementById("eyeWrap");
  const hero = document.querySelector(".hero");
  const pupil = document.getElementById("eye-pupil");
  const pInner = document.getElementById("eye-pupil-inner");
  const hilite = document.getElementById("eye-highlight");
  if (!wrap || !pupil || !hero) return;

  const MAX = 13; 

  hero.addEventListener("mousemove", (e) => {
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    
    const nx = Math.max(
      -1,
      Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.35)),
    );
    const ny = Math.max(
      -1,
      Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.35)),
    );

    
    const px = (110 + nx * MAX).toFixed(2);
    const py = (55 + ny * MAX * 0.65).toFixed(2);
    pupil.setAttribute("cx", px);
    pupil.setAttribute("cy", py);
    pInner.setAttribute("cx", px);
    pInner.setAttribute("cy", py);
    hilite.setAttribute("cx", (+px + 7).toFixed(2));
    hilite.setAttribute("cy", (+py - 7).toFixed(2));

    
    const tiltX = (-ny * 18).toFixed(1);
    const tiltY = (nx * 22).toFixed(1);
    wrap.style.transform = `perspective(280px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  });

  hero.addEventListener("mouseleave", () => {
    ["cx", "cy"].forEach((a) => {
      pupil.setAttribute(a, a === "cx" ? "110" : "55");
      pInner.setAttribute(a, a === "cx" ? "110" : "55");
    });
    hilite.setAttribute("cx", "118");
    hilite.setAttribute("cy", "46");
    wrap.style.transform = "";
  });
})();

(function initReveal() {
  const els = document.querySelectorAll(".reveal-up");
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
    { threshold: 0.15 },
  );

  els.forEach((el) => obs.observe(el));
})();

(function initAudio() {
  const audioEl = document.getElementById("audio");
  const audioBtn = document.getElementById("audioBtn");
  const audioPlayer = document.querySelector(".audio-player");
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");
  const ring = document.getElementById("vizRing");

  if (!audioBtn || !audioEl || !ring) return;

  const rc = ring.getContext("2d");
  const CX = 22,
    CY = 22,
    BASE_R = 12,
    MAX_DEV = 7,
    PTS = 64;

  let audioCtx, analyser, srcNode, freqData;
  let isPlaying = false;
  let rt = 0;

  function connectAnalyser() {
    if (audioCtx) return;
    audioCtx = new (
      window.AudioContext ||  (window).webkitAudioContext
    )();
    audioCtx.resume();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    srcNode = audioCtx.createMediaElementSource(audioEl);
    srcNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  function drawRing() {
    rc.clearRect(0, 0, 44, 44);
    rt += 0.04;

    if (isPlaying && analyser) analyser.getByteFrequencyData(freqData);

    rc.beginPath();
    for (let i = 0; i <= PTS; i++) {
      const angle = (i / PTS) * Math.PI * 2 - Math.PI / 2;
      let dev;
      if (isPlaying && freqData) {
        dev =
          (freqData[Math.floor((i / PTS) * freqData.length)] / 255) * MAX_DEV;
      } else {
        dev =
          Math.sin(rt + (i / PTS) * Math.PI * 4) * 1.6 +
          Math.sin(rt * 0.6 + (i / PTS) * Math.PI * 2) * 0.8;
      }
      const r = BASE_R + dev;
      const x = CX + Math.cos(angle) * r;
      const y = CY + Math.sin(angle) * r;
      i === 0 ? rc.moveTo(x, y) : rc.lineTo(x, y);
    }
    rc.closePath();

    const grad = rc.createLinearGradient(0, 0, 44, 44);
    grad.addColorStop(0, "rgb(201,169,110)");
    grad.addColorStop(1, "rgb(196,53,86)");
    rc.strokeStyle = grad;
    rc.lineWidth = isPlaying ? 1.6 : 1.0;
    rc.stroke();

    if (isPlaying) {
      const glow = rc.createRadialGradient(CX, CY, 0, CX, CY, BASE_R + MAX_DEV);
      glow.addColorStop(0, "rgba(201,169,110,0.10)");
      glow.addColorStop(0.6, "rgba(196,53,86,0.05)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      rc.fillStyle = glow;
      rc.fill();
    }

    requestAnimationFrame(drawRing);
  }
  drawRing();

  audioBtn.addEventListener("click", () => {
    if (audioEl.paused) {
      connectAnalyser();
      audioEl
        .play()
        .then(() => {
          isPlaying = true;
          playIcon.style.display = "none";
          pauseIcon.style.display = "block";
          audioPlayer.classList.add("playing");
        })
        .catch((err) => console.warn("Audio play failed:", err));
    } else {
      audioEl.pause();
      isPlaying = false;
      playIcon.style.display = "block";
      pauseIcon.style.display = "none";
      audioPlayer.classList.remove("playing");
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

gsap.from(".icard", {
  scrollTrigger: {
    trigger: ".cards-grid",
    start: "top 80%",
    toggleActions: "play none none none",
  },
  y: 60,
  opacity: 0,
  duration: 1.0,
  stagger: 0.16,
  ease: "power3.out",
  clearProps: "transform,opacity",
});

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

gsap.from(".footer-col", {
  scrollTrigger: { trigger: ".site-footer", start: "top 92%" },
  y: 28,
  opacity: 0,
  duration: 0.8,
  stagger: 0.1,
  ease: "power2.out",
  clearProps: "transform,opacity",
});

let tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".cta-section",
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
  .from(".cta-eyebrow", { scale: 0.3, rotation: 45, autoAlpha: 0 })
  .addLabel("color")
  .from(".cta-headline", { y: 30, autoAlpha: 0 })
  .addLabel("spin")
  .from(".cta-actions", { y: 20, autoAlpha: 0 })
  .addLabel("end");
