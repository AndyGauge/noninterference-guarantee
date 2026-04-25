<script>
  // Presenter view — designed to live in a second browser window. Shows the
  // current slide title + gist, the next slide preview, the rehearsal notes
  // for the current slide, and the talk timer.
  //
  // Driven by `localStorage` events so it stays in sync with the projected
  // window in the same browser. (For cross-device sync, opt into PartyKit
  // at scaffold time.)

  import { onMount } from 'svelte';
  import { flat, sectionOf, TALK_MINUTES } from '$lib/outline.js';
  import { mdBlock, md } from '$lib/md.js';

  const TALK_MS = TALK_MINUTES * 60 * 1000;
  const TIMER_KEY = 'sveltekitslides:timer-start:noninterference-for-llm-tool-schemas';
  const CURRENT_KEY = 'sveltekitslides:current:noninterference-for-llm-tool-schemas';

  let currentNum = $state(flat[0]?.num || '01');
  let timerStart = $state(null);
  let now = $state(Date.now());

  function readState() {
    if (typeof window === 'undefined') return;
    currentNum = window.localStorage.getItem(CURRENT_KEY) || flat[0]?.num || '01';
    const ts = window.localStorage.getItem(TIMER_KEY);
    timerStart = ts ? parseInt(ts, 10) : null;
  }

  onMount(() => {
    readState();
    const tick = setInterval(() => { now = Date.now(); }, 500);
    const onStorage = (e) => {
      if (e.key === TIMER_KEY || e.key === CURRENT_KEY) readState();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(tick);
      window.removeEventListener('storage', onStorage);
    };
  });

  let current = $derived(flat.find((c) => c.num === currentNum) || flat[0]);
  let currentIdx = $derived(flat.findIndex((c) => c.num === currentNum));
  let nextCard = $derived(currentIdx >= 0 && currentIdx < flat.length - 1 ? flat[currentIdx + 1] : null);

  let elapsedMs = $derived(timerStart ? now - timerStart : 0);
  let remainingMs = $derived(TALK_MS - elapsedMs);
  let over = $derived(remainingMs < 0);
  let elapsedText = $derived(fmt(elapsedMs));
  let remainingText = $derived(fmt(Math.abs(remainingMs)));

  function fmt(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
</script>

<svelte:head>
  <title>Presenter — Noninterference for LLM Tool Schemas</title>
</svelte:head>

<main class="presenter">
  <header>
    <div class="position">
      <span class="num">{current?.num} / {String(flat.length).padStart(2, '0')}</span>
      <span class="section">{sectionOf(current?.section)?.label || ''}</span>
    </div>
    <div class="clock">
      <div class="elapsed">{elapsedText}<span class="lab">elapsed</span></div>
      <div class="remaining" class:over>{over ? '+' : ''}{remainingText}<span class="lab">{over ? 'over' : 'left'}</span></div>
    </div>
  </header>

  <section class="now">
    <div class="lab">Now</div>
    <h1>{current?.title}</h1>
    {#if current?.gist}
      <p class="gist">{@html md(current.gist)}</p>
    {/if}
  </section>

  <section class="next">
    <div class="lab">Next</div>
    {#if nextCard}
      <h2>{nextCard.title}</h2>
      {#if nextCard.gist}
        <p class="gist-sm">{@html md(nextCard.gist)}</p>
      {/if}
    {:else}
      <p class="dim">— end of deck —</p>
    {/if}
  </section>

  <section class="notes">
    <div class="lab">Notes</div>
    <div class="notes-body">
      {#if current?.notes}
        {@html mdBlock(current.notes)}
      {:else}
        <p class="dim">(no notes for this slide)</p>
      {/if}
    </div>
  </section>

  <footer>
    <p class="hint">
      Open the projected window separately. Drive that window — this one
      updates from <code>localStorage</code> events. For cross-device sync,
      opt in to PartyKit at scaffold time.
    </p>
  </footer>
</main>

<style>
  .presenter {
    min-height: 100vh;
    min-height: 100dvh;
    padding: 3vh 4vw 2vh 4vw;
    display: grid;
    grid-template-columns: 3fr 2fr;
    grid-template-rows: auto auto 1fr auto;
    gap: 2vh 2.4rem;
    color: var(--ink);
  }

  header {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 1px solid var(--rule);
    padding-bottom: 1rem;
  }

  .position {
    display: flex;
    gap: 1rem;
    align-items: baseline;
    font-family: var(--sans);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--muted);
  }
  .position .num { color: var(--ink); font-variant-numeric: tabular-nums; }
  .position .section { color: var(--accent); }

  .clock {
    display: flex;
    gap: 2rem;
    align-items: baseline;
    font-variant-numeric: tabular-nums;
  }
  .clock .lab {
    display: block;
    font-family: var(--sans);
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.24em;
    color: var(--muted);
    margin-top: 0.25rem;
    text-align: right;
  }
  .clock .elapsed,
  .clock .remaining {
    font-family: var(--serif);
    font-size: 2.4rem;
    line-height: 1;
    text-align: right;
  }
  .clock .remaining.over { color: var(--accent); }

  .now { grid-column: 1; }
  .next { grid-column: 2; }
  .now .lab,
  .next .lab,
  .notes .lab {
    font-family: var(--sans);
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.32em;
    color: var(--accent);
    margin-bottom: 0.7rem;
  }

  .now h1 {
    font-family: var(--serif);
    font-style: italic;
    font-weight: 300;
    font-size: clamp(2rem, 3.8vw, 3.6rem);
    line-height: 1.02;
    letter-spacing: -0.015em;
    color: var(--ink);
  }
  .now .gist {
    font-family: var(--serif);
    font-size: clamp(1rem, 1.4vw, 1.3rem);
    color: var(--ink);
    margin-top: 1rem;
    border-left: 2px solid var(--accent);
    padding-left: 1rem;
    max-width: 50ch;
  }

  .next h2 {
    font-family: var(--serif);
    font-style: italic;
    font-weight: 300;
    font-size: clamp(1.3rem, 2vw, 1.9rem);
    line-height: 1.05;
    color: var(--muted);
  }
  .next .gist-sm {
    font-family: var(--serif);
    font-size: 1rem;
    color: var(--muted);
    margin-top: 0.6rem;
    max-width: 36ch;
  }

  .notes {
    grid-column: 1 / -1;
    border-top: 1px solid var(--rule);
    padding-top: 1.6rem;
    overflow-y: auto;
  }
  .notes-body {
    font-family: var(--serif);
    font-weight: 300;
    font-size: 1.05rem;
    line-height: 1.65;
    color: var(--ink);
    max-width: 78ch;
  }
  .notes-body :global(p) { margin: 0 0 1em; }
  .notes-body :global(ul) { margin: 0 0 1em; padding-left: 1.3rem; }
  .notes-body :global(strong) { font-weight: 500; }
  .notes-body :global(em) { font-style: italic; }
  .notes-body :global(code) {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.9em;
    padding: 0.08em 0.3em;
    background: color-mix(in srgb, var(--ink) 6%, transparent);
    border-radius: 3px;
  }

  .dim { color: var(--muted); font-style: italic; }

  footer {
    grid-column: 1 / -1;
    border-top: 1px solid var(--rule);
    padding-top: 1rem;
  }
  .hint {
    font-family: var(--sans);
    font-size: 0.7rem;
    color: var(--muted);
    line-height: 1.5;
    max-width: 70ch;
  }
  .hint code {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.85em;
    padding: 0.05em 0.35em;
    background: color-mix(in srgb, var(--ink) 6%, transparent);
    border-radius: 3px;
  }

  @media (max-width: 720px) {
    .presenter {
      grid-template-columns: 1fr;
      gap: 1.6vh 0;
    }
    .now, .next, .notes { grid-column: 1; }
  }
</style>
