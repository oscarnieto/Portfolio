/* ============================================================
   Oscar Nieto — Portfolio
   GSAP + ScrollTrigger + Lenis + Three.js
   ============================================================ */

import * as THREE from "../vendor/three.module.min.js";

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const FLAGS = (window.SITE_CONFIG && window.SITE_CONFIG.theme) || {};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ------------------------------------------------------------
   Smooth scroll (Lenis), bridged into ScrollTrigger
   ------------------------------------------------------------ */
let lenis = null;
if (!reducedMotion && FLAGS.smoothScroll !== false) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
  else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
}

// Anchor links route through Lenis
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      closeMenu();
      scrollToTarget(id);
    }
  });
});

/* ------------------------------------------------------------
   Tiny text splitter
   ------------------------------------------------------------ */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = "";
  el.setAttribute("aria-label", text);
  [...text].forEach((ch) => {
    const s = document.createElement("span");
    s.className = "char";
    s.setAttribute("aria-hidden", "true");
    s.textContent = ch === " " ? " " : ch;
    el.appendChild(s);
  });
  return el.querySelectorAll(".char");
}

function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute("aria-label", el.textContent.trim());
  el.textContent = "";
  words.forEach((w, i) => {
    const s = document.createElement("span");
    s.className = "word";
    s.setAttribute("aria-hidden", "true");
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return el.querySelectorAll(".word");
}

const heroChars = [...document.querySelectorAll("[data-split]")].map(splitChars);

/* ------------------------------------------------------------
   Three.js — hero shader background
   ------------------------------------------------------------ */
const canvas = document.getElementById("webgl");
let renderHero = () => {};
let heroVisible = true;

(function initHeroScene() {
  if (FLAGS.shader === false) {
    canvas.style.background = "radial-gradient(120% 90% at 25% 20%, #2a1b54 0%, #0a0a14 55%), radial-gradient(100% 90% at 80% 80%, #3a1038 0%, transparent 60%)";
    return;
  }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  } catch (e) {
    canvas.style.background = "radial-gradient(120% 90% at 25% 20%, #2a1b54 0%, #0a0a14 55%), radial-gradient(100% 90% at 80% 80%, #3a1038 0%, transparent 60%)";
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec2 uRes;
      uniform vec2 uMouse;

      // --- simplex noise (Ashima / IQ) ---
      vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
      vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
      vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 p){
        float v = 0.0;
        float a = 0.55;
        for (int i = 0; i < 4; i++) {
          v += a * snoise(p);
          p = p * 1.9 + 13.7;
          a *= 0.5;
        }
        return v;
      }

      // soft colour blob (metaball-style falloff)
      float blob(vec2 uv, vec2 c, float r){
        return smoothstep(r, 0.0, distance(uv, c));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;
        float t = uTime * 0.08;

        // organic warp so the gradients drift like liquid
        vec2 warp = vec2(fbm(uv * 1.6 + t * 0.5), fbm(uv * 1.6 - t * 0.4 + 7.3));
        vec2 p = uv + (warp - 0.5) * 0.18;

        // slowly orbiting colour centres; one tracks the pointer
        vec2 c1 = vec2(0.28 + 0.16 * sin(t * 0.70),       0.32 + 0.18 * cos(t * 0.62));
        vec2 c2 = vec2(0.76 + 0.15 * cos(t * 0.52 + 1.0), 0.36 + 0.16 * sin(t * 0.83));
        vec2 c3 = vec2(0.52 + 0.20 * sin(t * 0.41 + 2.0), 0.74 + 0.16 * cos(t * 0.55));
        vec2 c4 = vec2(0.42 + 0.18 * cos(t * 0.61 + 4.0), 0.56 + 0.20 * sin(t * 0.47));
        c4 += (uMouse - 0.5) * 0.35;

        // deep night base with a blue cast
        vec3 col = vec3(0.030, 0.032, 0.055);
        col += vec3(0.34, 0.16, 0.64) * blob(p, c1, 0.46) * 0.95;  // violet
        col += vec3(0.09, 0.27, 0.58) * blob(p, c3, 0.52) * 0.85;  // deep blue
        col += vec3(0.90, 0.22, 0.46) * blob(p, c2, 0.40) * 0.75;  // magenta
        col += vec3(0.62, 0.86, 0.26) * blob(p, c4, 0.30) * 0.38;  // acid (subtle)

        // soft tone-map keeps the blend creamy rather than blown-out
        col = col / (1.0 + col);
        col = pow(col, vec3(0.86));

        // vignette so the type stays legible
        float vig = smoothstep(1.30, 0.30, length(uv - vec2(0.5, 0.52)));
        col *= mix(0.52, 1.0, vig);

        // faint grain to avoid banding on the gradients
        float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        col += (g - 0.5) * 0.015;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  if (finePointer) {
    window.addEventListener("pointermove", (e) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1 - e.clientY / window.innerHeight;
    }, { passive: true });
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, finePointer ? 1.75 : 1.25);
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(dpr);
    uniforms.uRes.value.set(w * dpr, h * dpr);
  }
  resize();
  window.addEventListener("resize", resize);

  renderHero = (time) => {
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    uniforms.uMouse.value.set(mouse.x, mouse.y);
    uniforms.uTime.value = time;
    renderer.render(scene, camera);
  };

  if (reducedMotion) {
    renderHero(8); // single static frame
  } else {
    gsap.ticker.add((time) => { if (heroVisible) renderHero(time); });
    ScrollTrigger.create({
      trigger: "#hero",
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => { heroVisible = self.isActive; },
    });
  }
})();

/* ------------------------------------------------------------
   Preloader + hero intro
   ------------------------------------------------------------ */
const preloader = document.getElementById("preloader");
const countEl = document.getElementById("preloaderCount");

function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  heroChars.forEach((chars, i) => {
    tl.from(chars, {
      yPercent: 115,
      duration: 1.1,
      stagger: 0.045,
    }, i * 0.12);
  });
  // only rendered lines (mobile hides the non-corner ones)
  const lines = [...document.querySelectorAll(".hero__lines line")]
    .filter((ln) => getComputedStyle(ln).display !== "none");
  if (lines.length) {
    lines.forEach((ln) => {
      const len = ln.getTotalLength();
      gsap.set(ln, { strokeDasharray: len, strokeDashoffset: len });
    });
    tl.to(lines, {
      strokeDashoffset: 0,
      duration: 0.9,
      stagger: 0.05,
      ease: "power2.out",
    }, 0.25);
  }
  if (document.querySelector(".hero__sat-inner")) {
    tl.from(".hero__sat-inner", {
      autoAlpha: 0,
      scale: 0.5,
      filter: "blur(12px)",
      duration: 1.0,
      stagger: { each: 0.06, from: "random" },
    }, 0.45);
  }
  tl.from("[data-intro]", {
    y: 24,
    autoAlpha: 0,
    duration: 0.9,
    stagger: 0.08,
  }, 0.6);
  return tl;
}

if (reducedMotion) {
  preloader.remove();
} else if (FLAGS.preloader === false) {
  preloader.remove();
  heroIntro();
} else {
  const progress = { value: 0 };
  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((res) => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", res, { once: true });
    }),
  ]);

  let assetsReady = false;
  let finished = false;
  const renderCount = () => { countEl.textContent = Math.round(progress.value); };

  // Count to 99, then hold until fonts + assets have actually loaded
  const countTween = gsap.to(progress, {
    value: 99,
    duration: 1.4,
    ease: "power2.inOut",
    onUpdate: renderCount,
    onComplete: maybeFinish,
  });
  ready.then(() => { assetsReady = true; maybeFinish(); });

  function maybeFinish() {
    if (finished || !assetsReady || countTween.progress() < 1) return;
    finished = true;
    gsap.timeline()
      .to(progress, { value: 100, duration: 0.25, ease: "power1.out", onUpdate: renderCount })
      .to(".preloader__inner", { yPercent: -30, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, ">")
      .to(preloader, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.9,
        ease: "power4.inOut",
        onComplete: () => preloader.remove(),
      }, "-=0.15")
      .add(heroIntro(), "-=0.45");
  }
}

/* ------------------------------------------------------------
   Hero parallax — satellite words + centred word follow the pointer
   ------------------------------------------------------------ */
if (finePointer && !reducedMotion) {
  const heroEl = document.getElementById("hero");
  const sats = [...document.querySelectorAll(".hero__sat")].map((el) => {
    const inner = el.querySelector(".hero__sat-inner");
    return {
      depth: parseFloat(el.dataset.depth) || 1,
      x: gsap.quickTo(inner, "x", { duration: 1, ease: "power3" }),
      y: gsap.quickTo(inner, "y", { duration: 1, ease: "power3" }),
    };
  });
  const centerInner = document.querySelector(".hero__center-inner");
  const cx = gsap.quickTo(centerInner, "x", { duration: 1.1, ease: "power3" });
  const cy = gsap.quickTo(centerInner, "y", { duration: 1.1, ease: "power3" });

  if (heroEl && (sats.length || centerInner)) {
    heroEl.addEventListener("pointermove", (e) => {
      const r = heroEl.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      sats.forEach((s) => { s.x(nx * s.depth * 46); s.y(ny * s.depth * 46); });
      cx(nx * -22); cy(ny * -14);
    }, { passive: true });
    heroEl.addEventListener("pointerleave", () => {
      sats.forEach((s) => { s.x(0); s.y(0); });
      cx(0); cy(0);
    });
  }
}

/* ------------------------------------------------------------
   Custom cursor
   ------------------------------------------------------------ */
if (finePointer && !reducedMotion) {
  const cursor = document.getElementById("cursor");
  const label = document.getElementById("cursorLabel");
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });

  window.addEventListener("pointermove", (e) => {
    cursor.classList.add("is-active");
    xTo(e.clientX); yTo(e.clientY);
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));

  document.querySelectorAll("[data-cursor]").forEach((el) => {
    const mode = el.dataset.cursor;
    el.addEventListener("pointerenter", () => {
      if (mode === "view") {
        label.textContent = "View";
        cursor.classList.add("is-view");
        gsap.to(cursor, { width: 72, height: 72, duration: 0.35, ease: "power3.out" });
      } else {
        gsap.to(cursor, { scale: 2.4, duration: 0.3, ease: "power3.out" });
      }
    });
    el.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-view");
      gsap.to(cursor, { width: 14, height: 14, scale: 1, duration: 0.3, ease: "power3.out" });
    });
  });
}

/* ------------------------------------------------------------
   Header: hide on scroll down, show on scroll up
   ------------------------------------------------------------ */
const header = document.getElementById("siteHeader");
ScrollTrigger.create({
  start: "top -120",
  onUpdate: (self) => {
    header.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > 300);
  },
});

/* ------------------------------------------------------------
   Marquee — infinite loop, direction follows scroll
   ------------------------------------------------------------ */
(function marquee() {
  const track = document.getElementById("marqueeTrack");
  const group = track.querySelector(".marquee__group");
  for (let i = 0; i < 3; i++) track.appendChild(group.cloneNode(true));

  if (reducedMotion) return;

  const loop = gsap.to(track, {
    xPercent: -25,
    duration: Number(FLAGS.marqueeSpeed) || 18,
    ease: "none",
    repeat: -1,
  });

  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = gsap.utils.clamp(0.4, 4, Math.abs(self.getVelocity() / 220));
      gsap.to(loop, { timeScale: self.direction * v, duration: 0.4, overwrite: true });
    },
  });
})();

/* ------------------------------------------------------------
   About — statement scrub, portrait parallax, counters
   ------------------------------------------------------------ */
(function about() {
  const words = splitWords(document.getElementById("aboutStatement"));

  if (reducedMotion) return;

  gsap.from(words, {
    autoAlpha: 0.12,
    yPercent: 12,
    stagger: 0.06,
    ease: "none",
    scrollTrigger: {
      trigger: "#aboutStatement",
      start: "top 82%",
      end: "bottom 45%",
      scrub: 0.6,
    },
  });

  gsap.fromTo("[data-parallax]",
    { yPercent: -8 },
    {
      yPercent: 8,
      ease: "none",
      scrollTrigger: { trigger: ".about__row", start: "top bottom", end: "bottom top", scrub: true },
    }
  );

  document.querySelectorAll("[data-counter]").forEach((el) => {
    const target = +el.dataset.counter;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => { el.textContent = Math.round(obj.v); },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
})();

/* ------------------------------------------------------------
   Works — row reveals + floating hover preview
   ------------------------------------------------------------ */
(function works() {
  const rows = gsap.utils.toArray(".work");

  if (!reducedMotion) {
    rows.forEach((row) => {
      gsap.from(row, {
        autoAlpha: 0,
        y: 48,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: row, start: "top 90%", once: true },
      });
    });
  }

  if (!finePointer) return;

  const preview = document.getElementById("worksPreview");
  const previewTrack = document.getElementById("worksPreviewTrack");
  const clones = rows.map((row, i) => {
    const svg = row.querySelector(".work__media svg").cloneNode(true);
    // de-dupe gradient/filter ids so url(#...) refs don't hit the originals
    svg.querySelectorAll("[id]").forEach((node) => { node.id = `${node.id}-p${i}`; });
    svg.querySelectorAll("[fill], [stroke]").forEach((node) => {
      ["fill", "stroke"].forEach((attr) => {
        const v = node.getAttribute(attr);
        if (v && v.startsWith("url(#")) node.setAttribute(attr, `url(#${v.slice(5, -1)}-p${i})`);
      });
    });
    previewTrack.appendChild(svg);
    return svg;
  });

  const xTo = gsap.quickTo(preview, "x", { duration: 0.5, ease: "power3" });
  const yTo = gsap.quickTo(preview, "y", { duration: 0.5, ease: "power3" });
  const section = document.getElementById("work");

  section.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });

  let active = -1;
  rows.forEach((row, i) => {
    const link = row.querySelector(".work__link");
    link.addEventListener("pointerenter", (e) => {
      xTo(e.clientX); yTo(e.clientY);
      clones.forEach((c, j) => c.classList.toggle("is-active", j === i));
      if (active === -1) {
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" });
      }
      active = i;
    });
    link.addEventListener("pointerleave", () => {
      active = -1;
      // small grace period so moving between rows doesn't flicker
      gsap.delayedCall(0.05, () => {
        if (active === -1) {
          gsap.to(preview, { autoAlpha: 0, scale: 0.85, duration: 0.35, ease: "power3.in" });
        }
      });
    });
  });
})();

/* ------------------------------------------------------------
   Services accordion
   ------------------------------------------------------------ */
document.querySelectorAll(".service").forEach((item) => {
  const head = item.querySelector(".service__head");
  const body = item.querySelector(".service__body");
  head.addEventListener("click", () => {
    const open = head.getAttribute("aria-expanded") === "true";
    head.setAttribute("aria-expanded", String(!open));
    gsap.to(body, {
      height: open ? 0 : "auto",
      duration: reducedMotion ? 0 : 0.55,
      ease: "power3.inOut",
      onComplete: () => ScrollTrigger.refresh(),
    });
  });
});

// Services panel slides up over the dark section
if (!reducedMotion) {
  gsap.from(".services", {
    y: 80,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".services", start: "top 95%", once: true },
  });
}

/* ------------------------------------------------------------
   Footer — big CTA reveal
   ------------------------------------------------------------ */
if (!reducedMotion) {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: "#contact", start: "top 75%", once: true },
    defaults: { ease: "power4.out" },
  });
  tl.from("[data-intro-footer]", { autoAlpha: 0, y: 24, duration: 0.8 })
    .from("[data-split-footer]", { yPercent: 115, duration: 1.1, stagger: 0.12 }, 0.1)
    .from(".contact__grid > div", { autoAlpha: 0, y: 28, duration: 0.8, stagger: 0.08 }, 0.45);
}

/* ------------------------------------------------------------
   Magnetic elements
   ------------------------------------------------------------ */
if (finePointer && !reducedMotion) {
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.12);
      yTo((e.clientY - r.top - r.height / 2) * 0.12);
    });
    el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  });
}

/* ------------------------------------------------------------
   Mobile menu
   ------------------------------------------------------------ */
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
  mobileMenu.classList.remove("is-open");
  mobileMenu.setAttribute("aria-hidden", "true");
  lenis?.start();
}

menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  if (open) {
    closeMenu();
  } else {
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    lenis?.stop();
    if (!reducedMotion) {
      gsap.fromTo(".mobile-menu__nav a",
        { y: 36, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, delay: 0.2, ease: "power3.out" });
    }
  }
});

/* ------------------------------------------------------------
   Clocks + back to top
   ------------------------------------------------------------ */
function tickClock() {
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
  }).format(new Date());
  ["clock", "clockMobile", "clockFooter"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = time;
  });
}
tickClock();
setInterval(tickClock, 30_000);

document.getElementById("toTop").addEventListener("click", () => scrollToTarget("#top"));
