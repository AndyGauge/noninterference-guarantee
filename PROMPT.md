# Prompt — Noninterference for LLM Tool Schemas

You're drafting a slide deck. The project was scaffolded from
`create-sveltekitslides`; everything you need to know about the talk
is below. Your job is to fill in **`src/lib/outline.js`** with real
slide content. Don't change file layout or chrome — only `outline.js`,
unless I explicitly ask for more.

## The talk

- **Title:** Noninterference for LLM Tool Schemas
- **Kicker:** Type-state authorization, with proofs
- **Speaker:** Andrew Gauger
- **Venue:** (not given)
- **Length:** 25 minutes
- **Audience:** PL and security researchers; engineers building MCP / agent infrastructure.

## What it's about

A formal model of schema-level authorization for LLM tool protocols, with a noninterference proof and a Rust type-state encoding that enforces the check at compile time.

## Central claim

> What an unauthorized principal can see is identical to a server that never had the gated capability.

## Single takeaway

Authorization belongs in the schema. Encoded as a type-state in Rust, the compiler refuses any call site that omits the check — at zero runtime cost.

## Sections

- **The Problem** — 5 min (id `problem`)
- **Schema-level Authorization** — 4 min (id `shaping`)
- **Noninterference** — 8 min (id `theorem`)
- **The Rust Type-State** — 5 min (id `rust`)
- **Five Languages** — 3 min (id `five-langs`)

## Demos

No demos. This is a paper talk. Walk the formal model live; show the Rust encoding on slide.

## Risks and fallback

Math-heavy slides — keep set-builder notation small and read every symbol aloud the first time it appears. If the audience is more security than PL, lean harder on the failure-mode framing in §I-A.

## Q&A — questions to be ready for

1. Why noninterference rather than capability-based access control? 2. Why static enforcement only in Rust — could Idris/F* close the temporal gap? 3. How does the model relate to Denning's lattice / Sabelfeld+Myers?

## Voice

precise, formal-but-spoken; cite definition and theorem numbers; never decorative; let the math do the work

---

## How outline.js works

`outline.js` exports a `raw` array of slide objects. Each one has:

- `section` — id from `sections` (already populated for you)
- `kind` — `'divider' | 'content' | 'code' | 'close'`
- `title` — the slide headline (one short line, projects huge)
- `gist` — one line under the title; supports inline markdown (`**bold**`, `*em*`, ``code``)
- `points` — array of bullets; each bullet supports the same inline markdown
- `code` — `{ lang: 'ruby', body: '…' }` for code slides
- `video` — `{ provider: 'youtube', id: '…', caption: '…' }` (optional)
- `attribution`, `wordmarks` — optional flourishes (see the cfp/slides reference)
- `duration` — minutes budgeted to this slide. The cumulative sum is the talk length.
- `notes` — rehearsal markdown, multi-paragraph. **This is not projected.**
  It sits below the fold for the speaker to scroll through during practice
  or to share with someone reading the deck offline. Use it for the actual
  paragraph the speaker will say. Be expansive here — it costs nothing.

Slides come out as `/01`, `/02`, … in the URL — numbers are assigned by
array order, you don't write them.

## What "good" looks like

- Each `title` is one short, declarative line. Project at 5rem+. No filler.
- Each `gist` is one sentence that earns the slide.
- 3–5 points per content slide. Fragments, not sentences. Inline `**bold**`
  and ``code`` welcome.
- `notes` is where the *real* writing happens — what the speaker plans to
  *say*. Multiple paragraphs. Treat it like the script.
- Section dividers are short — a label, a one-line gist, no points.
- The close card is for contact info + links, projected during Q&A.

## What to avoid

- Putting whole sentences on the slide. The speaker *says* the sentences.
- Bullet bloat — six points on a slide is a wall. Cut to four.
- Decorative scare quotes around your own phrasing.
- Making notes redundant with bullets — notes should be the prose version.
- Drift from the central claim. Every slide should serve it.

When you've filled it in, the speaker can run `npm run dev`, hit the talk
timer, and rehearse straight from the browser.
