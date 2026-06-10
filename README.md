# Iris Novak — Portfolio

A fictional graphic-designer portfolio landing page. Dark editorial layout, Syne + Space Grotesk type,
a Three.js domain-warped noise shader in the hero, and GSAP-driven scroll choreography.

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
