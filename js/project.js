/* ============================================================
   Iris Novak — Project case study page
   Template-driven: project.html?p=<slug>
   ============================================================ */

(function () {
  const { gsap, ScrollTrigger, Lenis } = window;
  gsap.registerPlugin(ScrollTrigger);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ----------------------------------------------------------
     Project data
     ---------------------------------------------------------- */
  const PROJECTS = {
    "mono-records": {
      index: "001", title: "Mono Records",
      client: "Mono Records Ltd.", year: "2026", role: "Lead Designer",
      tags: "Identity, Packaging, Art Direction",
      intro: "An independent vinyl label that needed to look like it sounds: warm, analogue, and a little obsessive about detail.",
      body1: "We built the identity around the groove itself — a single concentric mark that scales from a 12-inch sleeve to a run-out etching. The system uses one typeface, one accent colour, and a strict grid that lets every release breathe while staying unmistakably Mono.",
      body2: "Packaging became the brand's loudest channel: heavyweight board, blind embossing, and a numbering system collectors actually argue about. The identity launched with a 40-release back-catalogue reissue and a Brooklyn pop-up listening bar.",
      accent: "#d4f93c", base: "#101010", paper: "#f2efe9", spec: "Aa",
      art: "mono", next: "cafe-brut",
    },
    "cafe-brut": {
      index: "002", title: "Café Brut",
      client: "Brut Hospitality", year: "2025", role: "Brand Designer",
      tags: "Branding, Signage, Menus",
      intro: "A natural-wine café in El Born that wanted zero rustic clichés — no kraft paper, no hand-drawn grapes, no apologies.",
      body1: "The identity borrows from brutalist signage and Catalan modernisme in equal parts: a heavy slab logotype, terracotta and bone, and menus set like classified ads. Everything is printed locally on a Risograph two blocks from the bar.",
      body2: "The signage programme runs on a single aluminium extrusion that holds menus, opening hours and the occasional manifesto. Six months in, the tote bag outsells the orange wine.",
      accent: "#ff5c38", base: "#7a3320", paper: "#e8e2d6", spec: "Bb",
      art: "brut", next: "ojo-festival",
    },
    "ojo-festival": {
      index: "003", title: "Ojo Festival",
      client: "Ojo Cultural SL", year: "2024", role: "Art Director",
      tags: "Art Direction, Motion, Wayfinding",
      intro: "A festival of experimental film that asked for an identity able to mutate across 200 screens without losing its stare.",
      body1: "The eye became a parametric system, not a logo: an ellipse whose pupil tracks cursor, crowd or camera depending on the surface. Posters are stills from the system; the system itself runs live in the venue.",
      body2: "We art-directed the full campaign — trailers, wayfinding, a 40-metre façade projection — with a palette built from projector light on black. Attendance grew 32% and the identity took a silver at ADC.",
      accent: "#ff5c38", base: "#1c1030", paper: "#f2efe9", spec: "Oo",
      art: "ojo", next: "norr-atelier",
    },
    "norr-atelier": {
      index: "004", title: "Norr Atelier",
      client: "Norr Atelier AB", year: "2023", role: "Designer",
      tags: "Identity, Editorial, Web",
      intro: "A Stockholm furniture atelier moving from craft fairs to collectors — without sanding off what made it credible.",
      body1: "The identity is a study in restraint: a condensed wordmark split by an em-dash, two columns of black flanking a bone-white field, and photography rules that forbid props. The brand book is twelve pages long and most of them are margins.",
      body2: "We designed the launch catalogue as a numbered edition with a Swiss-bound spine; the web store treats every piece like a plate in a monograph. First collection sold out in three weeks.",
      accent: "#ff5c38", base: "#0e0e0c", paper: "#f2efe9", spec: "Nn",
      art: "norr", next: "liminal-type",
    },
    "liminal-type": {
      index: "005", title: "Liminal Type Co.",
      client: "Liminal Type Co.", year: "2022", role: "Type Designer",
      tags: "Type Design, Web, Specimens",
      intro: "A type foundry for letterforms caught between states — too sharp to be friendly, too warm to be brutal.",
      body1: "We designed the foundry's flagship family, Liminal Grotesk, in eight weights with a variable optical axis, and an identity that is nothing but the typeface doing its job: specimens as posters, posters as ads, ads as specimens.",
      body2: "The site renders every glyph live with adjustable tension — visitors break the letters, then license them. Liminal Grotesk now sits on two airline rebrands and one cult energy drink.",
      accent: "#d4f93c", base: "#d4f93c", paper: "#0e0e0c", spec: "Gg",
      art: "liminal", next: "mono-records",
    },
  };

  const slug = new URLSearchParams(location.search).get("p");
  const data = PROJECTS[slug] || PROJECTS["mono-records"];
  const nextData = PROJECTS[data.next];

  /* ----------------------------------------------------------
     SVG artwork generators (1200x680 hero, 1200x600 gallery)
     ---------------------------------------------------------- */
  const heroArt = {
    mono: (p) => `
      <rect width="1200" height="680" fill="${p.base}"/>
      <circle cx="600" cy="340" r="240" fill="none" stroke="${p.accent}" stroke-width="52"/>
      <circle cx="600" cy="340" r="116" fill="${p.accent}"/>
      <circle cx="600" cy="340" r="20" fill="${p.base}"/>
      <text x="70" y="610" font-family="Syne, sans-serif" font-weight="800" font-size="64" fill="${p.paper}">MONO®</text>
      <text x="1130" y="610" text-anchor="end" font-family="Space Grotesk, sans-serif" font-size="26" fill="${p.paper}" opacity=".55">33⅓ RPM — EST. 2026</text>`,
    brut: (p) => `
      <rect width="1200" height="680" fill="${p.paper}"/>
      <rect x="120" y="90" width="960" height="500" fill="${p.base}"/>
      <text x="180" y="300" font-family="Syne, sans-serif" font-weight="800" font-size="132" fill="${p.paper}">CAFÉ</text>
      <text x="180" y="460" font-family="Syne, sans-serif" font-weight="800" font-size="132" fill="#d4f93c">BRUT</text>
      <circle cx="950" cy="190" r="38" fill="${p.paper}"/>
      <text x="180" y="540" font-family="Space Grotesk, sans-serif" font-size="24" fill="${p.paper}" opacity=".6">VINS NATURALS — EL BORN, BCN</text>`,
    ojo: (p) => `
      <defs><radialGradient id="g-${p.art}" cx=".5" cy=".5" r=".62">
        <stop offset="0" stop-color="${p.accent}"/><stop offset="1" stop-color="${p.base}"/>
      </radialGradient></defs>
      <rect width="1200" height="680" fill="url(#g-${p.art})"/>
      <ellipse cx="600" cy="340" rx="330" ry="180" fill="none" stroke="${p.paper}" stroke-width="10"/>
      <circle cx="600" cy="340" r="92" fill="${p.paper}"/>
      <circle cx="600" cy="340" r="40" fill="${p.base}"/>
      <text x="70" y="612" font-family="Syne, sans-serif" font-weight="800" font-size="56" fill="${p.paper}">OJO — 24</text>`,
    norr: (p) => `
      <rect width="1200" height="680" fill="${p.paper}"/>
      <rect x="0" y="0" width="400" height="680" fill="${p.base}"/>
      <rect x="800" y="0" width="400" height="680" fill="${p.base}"/>
      <text x="600" y="390" text-anchor="middle" font-family="Syne, sans-serif" font-weight="800" font-size="170" fill="${p.base}">N—A</text>
      <circle cx="600" cy="150" r="26" fill="${p.accent}"/>
      <text x="600" y="560" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="24" fill="${p.base}" opacity=".6">STOCKHOLM</text>`,
    liminal: (p) => `
      <rect width="1200" height="680" fill="${p.base}"/>
      <text x="600" y="470" text-anchor="middle" font-family="Syne, sans-serif" font-weight="800" font-size="380" fill="${p.paper}">Aa</text>
      <rect x="70" y="70" width="240" height="18" fill="${p.paper}"/>
      <rect x="890" y="592" width="240" height="18" fill="${p.paper}"/>`,
  };

  // Generic gallery compositions, parameterised by project palette
  function posterRows(p) {
    const word = p.title.split(" ")[0].toUpperCase();
    let rows = "";
    for (let i = 0; i < 5; i++) {
      const y = 118 + i * 102;
      const solid = i % 2 === 0;
      rows += `<text x="60" y="${y}" font-family="Syne, sans-serif" font-weight="800" font-size="96"
        ${solid ? `fill="${p.paper}"` : `fill="none" stroke="${p.paper}" stroke-width="2"`}
        opacity="${1 - i * 0.13}">${word}</text>`;
    }
    return `<rect width="1200" height="600" fill="${p.base === p.paper ? "#0e0e0c" : p.base}"/>
      ${rows}
      <circle cx="1080" cy="120" r="44" fill="${p.accent}"/>`;
  }

  function specimenPlate(p) {
    const fg = p.paper === "#0e0e0c" ? p.paper : p.base === "#0e0e0c" || p.base === "#101010" ? p.paper : p.base;
    return `<rect width="1200" height="600" fill="${p.accent}"/>
      <text x="430" y="430" text-anchor="middle" font-family="Syne, sans-serif" font-weight="800" font-size="330" fill="#0e0e0c">${p.spec}</text>
      <text x="820" y="240" font-family="Space Grotesk, sans-serif" font-size="26" fill="#0e0e0c">${p.title} — visual system<tspan x="820" dy="38">${p.year} · ${p.tags.split(",")[0]}</tspan></text>
      <rect x="820" y="300" width="310" height="2" fill="#0e0e0c"/>
      <text x="820" y="430" font-family="Syne, sans-serif" font-weight="800" font-size="40" fill="#0e0e0c">${p.index} / 005</text>`;
  }

  function svgEl(viewH, inner, label) {
    return `<svg viewBox="0 0 1200 ${viewH}" role="img" aria-label="${label}">${inner}</svg>`;
  }

  /* ----------------------------------------------------------
     Populate the page
     ---------------------------------------------------------- */
  document.title = `${data.title} — Iris Novak`;
  document.getElementById("caseIndex").textContent = data.index;
  document.getElementById("caseTitle").textContent = data.title;
  document.getElementById("metaClient").textContent = data.client;
  document.getElementById("metaYear").textContent = data.year;
  document.getElementById("metaRole").textContent = data.role;
  document.getElementById("metaTags").textContent = data.tags;
  document.getElementById("caseIntro").textContent = data.intro;
  document.getElementById("caseBody1").textContent = data.body1;
  document.getElementById("caseBody2").textContent = data.body2;
  document.getElementById("caseHeroArt").innerHTML = svgEl(680, heroArt[data.art](data), `${data.title} hero artwork`);
  document.getElementById("caseArt1").innerHTML = svgEl(600, posterRows(data), `${data.title} poster series`);
  document.getElementById("caseArt2").innerHTML = svgEl(600, specimenPlate(data), `${data.title} specimen`);
  document.getElementById("nextTitle").textContent = nextData.title;
  document.getElementById("nextLink").href = `project.html?p=${data.next}`;

  /* ----------------------------------------------------------
     Clock
     ---------------------------------------------------------- */
  function tickClock() {
    const el = document.getElementById("clock");
    if (el) el.textContent = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
    }).format(new Date());
  }
  tickClock();
  setInterval(tickClock, 30_000);

  /* ----------------------------------------------------------
     Smooth scroll
     ---------------------------------------------------------- */
  let lenis = null;
  if (!reducedMotion) {
    lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ----------------------------------------------------------
     Cursor
     ---------------------------------------------------------- */
  if (finePointer && !reducedMotion) {
    const cursor = document.getElementById("cursor");
    const label = document.getElementById("cursorLabel");
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("pointermove", (e) => {
      cursor.classList.add("is-active");
      xTo(e.clientX); yTo(e.clientY);
    }, { passive: true });

    document.querySelectorAll("[data-cursor]").forEach((el) => {
      el.addEventListener("pointerenter", () => {
        if (el.dataset.cursor === "view") {
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

  /* ----------------------------------------------------------
     Animations
     ---------------------------------------------------------- */
  const titleEl = document.getElementById("caseTitle");
  const chars = (() => {
    const text = titleEl.textContent;
    titleEl.textContent = "";
    titleEl.setAttribute("aria-label", text);
    // chars grouped per word so lines only break at spaces
    text.split(" ").forEach((word, wi, all) => {
      const w = document.createElement("span");
      w.className = "char-word";
      w.setAttribute("aria-hidden", "true");
      [...word].forEach((ch) => {
        const s = document.createElement("span");
        s.className = "char";
        s.textContent = ch;
        w.appendChild(s);
      });
      titleEl.appendChild(w);
      if (wi < all.length - 1) titleEl.appendChild(document.createTextNode(" "));
    });
    return titleEl.querySelectorAll(".char");
  })();

  // Shrink display type when its longest unbreakable word exceeds the box
  const fits = [
    [document.querySelector(".pcase-title"), titleEl],
    [document.getElementById("nextLink"), document.getElementById("nextTitle")],
  ];
  function fitDisplay() {
    fits.forEach(([box, inner]) => {
      box.style.fontSize = "";
      const avail = box.clientWidth;
      const width = inner.scrollWidth;
      if (width > avail) {
        const current = parseFloat(getComputedStyle(box).fontSize);
        box.style.fontSize = `${Math.floor(current * (avail / width) * 0.98)}px`;
      }
    });
  }
  fitDisplay();
  window.addEventListener("resize", fitDisplay);
  if (document.fonts) document.fonts.ready.then(fitDisplay);

  if (reducedMotion) {
    document.getElementById("pageWipe").remove();
  } else {
    // entry wipe + intro
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .to("#pageWipe", { scaleY: 0, duration: 0.9, ease: "power4.inOut" })
      .from(chars, { yPercent: 115, duration: 1, stagger: 0.04 }, "-=0.35")
      .from("[data-reveal]", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, "-=0.6")
      .from(".pcase-visual--hero", { y: 60, autoAlpha: 0, duration: 0.9 }, "-=0.55");

    // intro statement word scrub
    const intro = document.getElementById("caseIntro");
    const words = intro.textContent.trim().split(/\s+/);
    intro.setAttribute("aria-label", intro.textContent.trim());
    intro.textContent = "";
    words.forEach((w, i) => {
      const s = document.createElement("span");
      s.className = "word";
      s.setAttribute("aria-hidden", "true");
      s.textContent = w;
      intro.appendChild(s);
      if (i < words.length - 1) intro.appendChild(document.createTextNode(" "));
    });
    gsap.from(intro.querySelectorAll(".word"), {
      autoAlpha: 0.12, yPercent: 12, stagger: 0.05, ease: "none",
      scrollTrigger: { trigger: intro, start: "top 82%", end: "bottom 50%", scrub: 0.6 },
    });

    // visuals: reveal + slow parallax
    gsap.utils.toArray("[data-parallax-art]").forEach((fig) => {
      if (!fig.classList.contains("pcase-visual--hero")) {
        gsap.from(fig, {
          autoAlpha: 0, y: 70, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: fig, start: "top 88%", once: true },
        });
      }
      gsap.fromTo(fig.querySelector("svg"), { yPercent: -4 }, {
        yPercent: 4, ease: "none",
        scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // body copy
    gsap.from(".pcase-cols p", {
      autoAlpha: 0, y: 32, duration: 0.9, stagger: 0.12, ease: "power3.out",
      scrollTrigger: { trigger: ".pcase-cols", start: "top 85%", once: true },
    });

    // next-project reveal
    gsap.from("#nextTitle", {
      yPercent: 115, duration: 1.1, ease: "power4.out",
      scrollTrigger: { trigger: ".pcase-next", start: "top 78%", once: true },
    });
  }
})();
