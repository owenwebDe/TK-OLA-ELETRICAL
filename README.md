# TK-OLA Technical Service Ventures

Demo website for **TK-OLA Technical Service Ventures** — solar, electrical and CCTV
contractor, Shop 6, Opposite Culvert Junction, Kurudu, Abuja FCT. Working since 2012.

Built by [IconEdge Technologies LTD](https://github.com/owenwebDe).

## Running it

Static HTML. No build step, no dependencies to install.

```bash
# any static server, e.g.
npx serve .
```

Then open `http://localhost:3000`.

Deploying: point Netlify (or any static host) at this folder. `netlify.toml` is included.

## What is in here

| Path | What it is |
|---|---|
| `index.html` | the page |
| `credits.html` | photograph credits and licences |
| `assets/app.css` | all styling |
| `assets/app.js` | motion layer — Lenis smooth scroll, GSAP ScrollTrigger, SplitText |
| `assets/hero3d.js` | the hero's WebGL solar field (Three.js, ES module) |
| `assets/img/` | photographs (WebP) |

Libraries load from CDN at pinned versions: GSAP 3.13.0, Lenis 1.1.18, Three.js 0.169.0.
Fonts are Archivo and Geist from Google Fonts.

## Motion

The page honours `prefers-reduced-motion`. On a machine with that set — which includes
any Windows install with **Settings → Accessibility → Visual effects → Animation
effects** turned off — the page renders fully but still: no smooth scroll, no reveals,
and the hero shows one rendered frame of the solar field instead of animating it.

To preview the full motion on such a machine, add `?motion=on`:

```
http://localhost:3000/?motion=on
```

The WebGL hero also steps itself down automatically: on a machine with no GPU
(software rendering) or below ~30fps it renders a single frame and stops, so it
never stutters.

## Photographs are placeholders

**Every photograph in `assets/img/` is a licensed stand-in, not TK-OLA's own work.**
They are credited in `credits.html` under CC BY / CC BY-SA licences. Replace them with
TK-OLA's real job photographs before this goes live as the company's site.

## Still to confirm with the client

- Logo and brand colours (the page currently uses a dots mark and a TK-OLA wordmark)
- Prices — the services list carries no figures
- Which districts beyond Kurudu they cover
- CAC / NEMSA registration numbers, if they want them shown
