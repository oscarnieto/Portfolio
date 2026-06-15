# Oscar Nieto — Portfolio

A fictional graphic-designer portfolio landing page. Dark editorial layout, Oswald (700, uppercase headlines) + Space Grotesk type,
a Three.js animated mesh-gradient shader in the hero with a centred word and parallax satellite words, and GSAP-driven scroll choreography.

## Stack

- **GSAP + ScrollTrigger** — preloader, hero intro, scroll reveals, scroll-velocity marquee, counters, accordion
- **Lenis** — smooth scrolling, bridged into ScrollTrigger
- **Three.js** — fullscreen fragment shader (simplex fbm, mouse-reactive) behind the hero
- No build step: all libraries are vendored in `vendor/`, fonts self-hosted in `fonts/`

## Run it

Any static server works:

```sh
python3 -m http.server 8765
# then open http://localhost:8765
```

## Visual editor

Open **`editor.html`** to edit the whole site without touching code: theme colours,
animation toggles, every text on the home page, the work list, services, contact info,
and each project's case study content and artwork palette.

- Changes preview live in an embedded frame (desktop/mobile) and are kept as a
  **draft in your browser** (localStorage), so you can revisit and keep editing.
- To publish, press **"Publicar cambios…"**: download the generated `site-config.js`
  and upload it to the repo's `data/` folder via GitHub's *Add file → Upload files*.
  Pages redeploys automatically.
- "Restablecer" discards the draft and returns to the published configuration.
- Each case study's seven image slots accept an uploaded file (auto-resized to
  1600px JPEG and embedded in the config) or a URL/repo path (e.g. `img/foto.jpg`),
  with editable captions; empty slots fall back to the generated SVG artwork.
- Clicking any case-study visual opens it large in a lightbox (keyboard: arrows
  to navigate, Esc to close; click backdrop or ✕ to dismiss).

The site reads `data/site-config.js` at load (`js/apply-config.js` applies it),
so the HTML always carries sensible defaults even without configuration.

## Checks

`scripts/check.mjs` loads the page in headless Chromium at desktop, laptop and mobile (iPhone 13)
viewports, captures screenshots into `shots/`, and fails on console errors or horizontal overflow:

```sh
node scripts/check.mjs
```

## Notes

- Custom cursor, magnetic buttons and the floating work-preview only activate on `(hover: hover) and (pointer: fine)` devices; mobile gets inline artwork and a fullscreen menu instead.
- `prefers-reduced-motion` disables the preloader, smooth scroll and all scroll animation, and renders a single static shader frame.
- The shader clamps device pixel ratio and pauses rendering when the hero is off-screen.
