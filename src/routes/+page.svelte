<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { flat, TALK_MINUTES } from '$lib/outline.js';
  import { createPager } from '$lib/gestures.js';
  import QrCode from '$lib/QrCode.svelte';

  // Substituted at scaffold time; safe to edit by hand afterwards.
  const TITLE  = 'Noninterference for LLM Tool Schemas';
  const KICKER = 'Type-state authorization, with proofs';
  const AUTHOR = 'Andrew Gauger';
  const VENUE  = '';

  let dragOffset = $state(0);
  let dragging = $derived(dragOffset !== 0);

  function start() {
    if (flat.length) goto(base + '/' + flat[0].num);
  }

  const pager = createPager({
    onNext: start,
    onPrev: () => {},
    setOffset: (v) => { dragOffset = Math.min(0, v); }
  });

  function key(e) {
    if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') start();
  }
</script>

<svelte:window onkeydown={key} />

<main
  class="cover"
  class:dragging
  onwheel={pager.onWheel}
  ontouchstart={pager.onTouchStart}
  ontouchmove={pager.onTouchMove}
  ontouchend={pager.onTouchEnd}
  ontouchcancel={pager.onTouchCancel}
  style:transform="translateX({dragOffset}px)"
>
  <div class="meta top">
    <span>{VENUE}</span>
    <span>{TALK_MINUTES} min talk</span>
  </div>

  <div class="title-block">
    {#if KICKER}<div class="kicker">{KICKER}</div>{/if}
    <h1 class="vt-title">{TITLE}</h1>
    {#if AUTHOR}<div class="author">{AUTHOR}</div>{/if}
  </div>

  <aside class="qr-stage">
    <QrCode size={200} caption="scan to follow along" />
  </aside>

  <div class="meta bottom">
    <button onclick={start}>Begin&nbsp;→</button>
    <span class="hint">Enter, arrow, swipe, or scroll</span>
  </div>
</main>

<style>
  .cover {
    height: 100vh;
    height: 100dvh;
    padding: 5vh 7vw;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto 1fr auto;
    gap: 2rem 4rem;
    transition: transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1);
    touch-action: pan-y;
    will-change: transform;
  }

  .cover.dragging { transition: none; }

  .meta {
    grid-column: 1 / -1;
    font-family: var(--sans);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.24em;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-block { grid-column: 1; align-self: center; max-width: 1100px; }

  .kicker {
    font-family: var(--sans);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.28em;
    color: var(--muted);
    margin-bottom: 1.5rem;
  }

  h1 {
    font-family: var(--serif);
    font-weight: 300;
    font-size: clamp(4rem, 11vw, 12rem);
    line-height: 0.92;
    letter-spacing: -0.035em;
    color: var(--ink);
  }

  .author {
    font-family: var(--sans);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.28em;
    color: var(--ink);
    margin-top: 2.6rem;
  }

  .qr-stage {
    grid-column: 2;
    align-self: center;
    justify-self: end;
  }

  button {
    font-family: var(--sans);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.24em;
    padding: 1rem 1.6rem;
    background: var(--ink);
    color: var(--bg);
    transition: background 200ms ease;
  }

  button:hover { background: var(--accent); }

  .hint {
    font-family: var(--sans);
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
  }

  @media (max-width: 720px) {
    .cover {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto 1fr auto auto;
      padding: 4vh 7vw;
      gap: 1.5rem;
    }
    .title-block { grid-column: 1; grid-row: 2; }
    .qr-stage    { grid-column: 1; grid-row: 4; justify-self: start; }
    h1 { font-size: clamp(3rem, 14vw, 5rem); }
    .author { font-size: 0.7rem; margin-top: 1.6rem; }
  }
</style>
