# Working in this project

This is a SvelteKit slide deck scaffolded by `create-sveltekitslides`.

## Where things live

- `src/lib/outline.js` — **the deck content.** Edit this; the slide
  numbers and timing reflow automatically.
- `src/routes/[slug]/+page.svelte` — per-slide renderer (above-fold
  slide + below-fold notes). Edit if you need a new card kind.
- `src/routes/+page.svelte` — cover.
- `src/routes/presenter/+page.svelte` — presenter view (current + next
  slide + notes + timer in one window).
- `src/lib/QrCode.svelte` — runtime QR. Encodes `window.location.origin`.
- `src/lib/PaceBar.svelte` — the talk-timeline at the bottom of each slide.
- `PROMPT.md` — the talk's context (audience, claim, sections). Read
  this before drafting outline content.

## When the user asks you to write the deck

Read `PROMPT.md` end to end. Then edit `src/lib/outline.js`. Don't
touch chrome, gestures, or QR rendering unless asked.

## Conventions

- One short, declarative `title` per slide.
- 3–5 `points` max — fragments, not sentences.
- The `notes` field is the *prose* the speaker will deliver. Be
  expansive there; it doesn't project.
- Inline markdown in `gist` and `points`: `**bold**`, `*em*`, ``code``.
- Block markdown in `notes`: paragraphs (blank-line separated) and
  `-` bullets are supported.

## Don't

- Don't add a build step or change adapter-static.
- Don't add a heavy CSS framework. The deck is hand-rolled CSS on purpose.
- Don't put the speaker's prose on the projected slide. It belongs in `notes`.
