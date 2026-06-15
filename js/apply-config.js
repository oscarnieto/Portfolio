/* ============================================================
   Applies window.SITE_CONFIG (plus any local editor draft) to
   the DOM. Must run after data/site-config.js and before the
   page scripts, so text splitting picks up the final content.
   ============================================================ */
(function () {
  const DRAFT_KEY = "on-site-draft";

  function deepMerge(base, extra) {
    if (Array.isArray(extra)) return extra.slice();
    if (extra && typeof extra === "object") {
      const out = Array.isArray(base) ? {} : Object.assign({}, base);
      Object.keys(extra).forEach((k) => {
        out[k] = deepMerge(base ? base[k] : undefined, extra[k]);
      });
      return out;
    }
    return extra === undefined ? base : extra;
  }

  // merge a local draft (saved by editor.html) over the published config
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) window.SITE_CONFIG = deepMerge(window.SITE_CONFIG, JSON.parse(draft));
  } catch (e) { /* private mode etc. — published config still applies */ }

  const cfg = window.SITE_CONFIG || {};
  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const nl2br = (s) => esc(s).replace(/\n/g, "<br>");
  const q = (sel) => document.querySelector(sel);
  const qa = (sel) => document.querySelectorAll(sel);
  const setText = (sel, value) => { const el = q(sel); if (el && value != null) el.textContent = value; };
  const setHTML = (sel, value) => { const el = q(sel); if (el && value != null) el.innerHTML = value; };

  /* ---------- theme ---------- */
  function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function applyTheme(t) {
    if (!t) return;
    const root = document.documentElement.style;
    if (t.ink) root.setProperty("--ink", t.ink);
    if (t.bone) {
      root.setProperty("--bone", t.bone);
      const rgb = hexToRgb(t.bone);
      if (rgb) {
        root.setProperty("--bone-dim", `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.55)`);
        root.setProperty("--line", `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.14)`);
      }
    }
    if (t.acid) root.setProperty("--acid", t.acid);
    if (t.ember) root.setProperty("--ember", t.ember);
    const grain = q(".hero__grain");
    if (grain) grain.style.display = t.grain === false ? "none" : "";
  }
  applyTheme(cfg.theme);

  // live theme updates from the visual editor (no reload needed)
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "cfg-theme") applyTheme(e.data.theme);
  });

  /* ---------- header (both pages) ---------- */
  if (cfg.header) {
    qa(".site-header__logo").forEach((el) => {
      el.innerHTML = `<span class="logo-mark" aria-hidden="true"></span>${esc(cfg.header.logo)}<sup>©</sup>`;
    });
    const meta = q(".site-header__meta span:last-child");
    if (meta) meta.innerHTML = `${esc(cfg.header.location)}&nbsp;·&nbsp;<span id="clock">00:00</span>`;
    const mfoot = q(".mobile-menu__foot > span");
    if (mfoot) mfoot.innerHTML = `${esc(cfg.header.location)} · <span id="clockMobile">00:00</span>`;
  }

  // index-only content below
  if (!document.getElementById("worksList")) return;

  /* ---------- hero / preloader ---------- */
  if (cfg.hero) {
    // central word
    const center = q(".hero__center-inner");
    if (center && cfg.hero.line1) center.textContent = cfg.hero.line1;
    setText(".preloader__name", [cfg.hero.line1, cfg.hero.line2].filter(Boolean).join(" "));
    setHTML(".hero__role", nl2br(cfg.hero.role));
    setHTML(".hero__avail", `<span class="dot dot--live" aria-hidden="true"></span> ${nl2br(cfg.hero.avail)}`);
    setText(".hero__badge", cfg.hero.badge);
    setHTML(".hero__tag", nl2br(cfg.hero.tag));
    setText(".hero__scroll span", cfg.hero.scroll);

    // satellite words orbiting the centre — positions [left%, top%, depth, corner?]
    const sats = q("#heroSats");
    if (sats && Array.isArray(cfg.hero.words)) {
      const POS = [
        [11, 17, 0.55, true],   [46, 9, 1.15, false],  [82, 17, 0.7, true],
        [89, 45, 1.2, false],   [6, 43, 0.9, false],   [12, 76, 1.05, true],
        [46, 88, 0.8, false],   [85, 74, 1.1, true],   [70, 27, 0.95, false],
        [29, 70, 0.85, false],  [62, 82, 1.0, false],  [33, 30, 0.75, false]
      ];
      sats.innerHTML = cfg.hero.words.slice(0, POS.length).map((w, i) => {
        const [l, t, depth, corner] = POS[i];
        const delay = (Math.random() * 2).toFixed(2);
        const dur = (4 + Math.random() * 3).toFixed(2);
        return `<span class="hero__sat${corner ? " hero__sat--corner" : ""}" ` +
          `style="left:${l}%;top:${t}%" data-depth="${depth}">` +
          `<span class="hero__sat-inner">` +
          `<span class="hero__sat-label" style="animation-delay:-${delay}s;animation-duration:${dur}s">${esc(w)}</span>` +
          `</span></span>`;
      }).join("");
    }
  }

  /* ---------- marquee ---------- */
  if (Array.isArray(cfg.marquee) && cfg.marquee.length) {
    const group = q(".marquee__group");
    if (group) group.innerHTML = cfg.marquee.map((i) => `${esc(i)} <i>✦</i>`).join(" ") + "&nbsp;";
  }

  /* ---------- about ---------- */
  if (cfg.about) {
    setText(".about .section-head__label", cfg.about.label);
    setText("#aboutStatement", cfg.about.statement);
    const ps = qa(".about__copy > p");
    if (ps[0]) ps[0].innerHTML = nl2br(cfg.about.p1);
    if (ps[1]) ps[1].innerHTML = nl2br(cfg.about.p2);
    qa(".about__stats li").forEach((li, i) => {
      const s = (cfg.about.stats || [])[i];
      if (!s) return;
      const strong = li.querySelector("strong");
      strong.dataset.counter = s.n;
      strong.textContent = "0";
      li.querySelector("span").textContent = s.label;
    });
  }

  /* ---------- work list ---------- */
  if (cfg.work) {
    setHTML(".works .section-head__label", `${esc(cfg.work.label)} <em>${esc(cfg.work.years)}</em>`);
    qa(".work").forEach((row, i) => {
      const w = (cfg.work.items || [])[i];
      if (!w) return;
      row.querySelector(".work__name").textContent = w.name;
      const meta = row.querySelectorAll(".work__meta span");
      if (meta[0]) meta[0].textContent = w.meta;
      if (meta[1]) meta[1].textContent = w.year;
    });
  }

  /* ---------- services ---------- */
  if (cfg.services) {
    setText(".services .section-head__label", cfg.services.label);
    qa(".service").forEach((item, i) => {
      const s = (cfg.services.items || [])[i];
      if (!s) return;
      item.querySelector("h3").textContent = s.title;
      item.querySelector(".service__body p").textContent = s.body;
    });
  }

  /* ---------- contact / footer ---------- */
  if (cfg.contact) {
    setHTML(".contact__kicker", nl2br(cfg.contact.kicker));
    const cta = qa("[data-split-footer]");
    if (cta[0]) cta[0].textContent = cfg.contact.cta1;
    if (cta[1]) cta[1].textContent = cfg.contact.cta2;
    qa('a[href^="mailto:"]').forEach((a) => {
      a.href = `mailto:${cfg.contact.email}`;
      if (a.textContent.includes("@")) a.textContent = cfg.contact.email;
    });
    const socials = qa(".contact__grid > div:nth-child(2) a");
    (cfg.contact.socials || []).forEach((s, i) => { if (socials[i]) socials[i].textContent = s; });
    const studio = q(".contact__grid > div:nth-child(3) p");
    if (studio) studio.innerHTML = nl2br(cfg.contact.studio);
    setText(".contact__bottom > span", cfg.contact.copyright);
  }
})();
