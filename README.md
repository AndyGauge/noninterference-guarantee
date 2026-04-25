# Noninterference for LLM Tool Schemas

Type-state authorization, with proofs

A SvelteKit slide deck scaffolded by [`create-sveltekitslides`](https://github.com/AndyGauge/create-sveltekitslides).

## Each slide

Above the fold is the *projected* content: title, a one-line gist,
bullets or a code block, and — in the corner — a QR code so the audience
can scan and follow along on their own devices.

Below the fold are **rehearsal notes** — what the speaker plans to say,
scrollable during practice, not visible during the live talk unless
someone scrolls. Keep the browser at the top of the page during projection.

At the very bottom of the slide is a minimal pace bar: a line across the
25 minutes with ticks at the section boundaries, a filled
band where the current slide should be, and a second line marking where
the clock actually is once the timer is running.

## Presentation timer

Top-right of every slide. Click once to start the 25-minute
countdown (persists in `localStorage`). The pill next to it shows pace
against the current card's target window:

- **on pace** — within ±30 s of the target window
- **N:MM ahead** — earlier than the window
- **N:MM behind** — later than the window

Click again to reset.

## Keymap

- `→` / `PageDown` / horizontal scroll/swipe — next slide
- `←` / `PageUp` — previous slide
- `Esc` — back to cover
- `↓` / `↑` / vertical scroll — scroll within the page (reveals notes)
- `B` — black the screen (Q&A; press any key to restore)
- `n` — toggle rehearsal notes inline (without scrolling)
- `g` — jump-to-slide picker
- `?` — show keymap

## Presenter view

Open `/presenter` in a second window. You see: current slide preview,
next slide preview, the rehearsal notes for the current slide, and the
talk timer. Drive with your phone or laptop, project the main window.

## QR code

Every slide embeds a small SVG QR in the corner (and a large one on the
close card). The code encodes `window.location.origin` at runtime, so it
works on `localhost` during rehearsal and your domain during the talk.
To force a specific URL, set `VITE_PUBLIC_URL` in `.env.local`.

For a *static* QR (handouts, posters), use the bundled Rust binary:

```sh
npm run qr -- "https://your-talk.example" > static/qr.svg
```

## Local dev

```sh
npm install
npm run dev
```

## Deploy to GitHub Pages

```sh
BASE_PATH=/your-repo VITE_PUBLIC_URL=https://your-domain.example npm run build
```

The static site lands in `build/`.

## File layout

```
src/
  lib/
    outline.js        the deck — edit here to change content
    gestures.js       wheel + touch navigation
    md.js             inline + block markdown helper
    QrCode.svelte     client-side SVG QR renderer
    PaceBar.svelte    the talk-timeline bar at the bottom of each slide
    keymap.js         keyboard shortcuts + black-screen / notes toggles
  routes/
    +page.svelte         cover
    +layout.svelte       view transitions + (optional) PartyKit client
    [slug]/+page.svelte  per-slide renderer (timer + pace live here)
    presenter/+page.svelte  presenter view (current + next + notes + timer)
qrgen/
  crate/              vendored Rust QR generator
  bin/qr.js           node wrapper
PROMPT.md             talk context for an LLM to draft outline.js
CLAUDE.md             how to work in this codebase
```

## Author

Andrew Gauger
