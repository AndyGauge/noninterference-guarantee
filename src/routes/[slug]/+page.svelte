<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { next, prev, flat, sectionOf, TALK_MINUTES } from '$lib/outline.js';
  import { createPager } from '$lib/gestures.js';
  import { md, mdBlock } from '$lib/md.js';
  import { highlightJson } from '$lib/highlight-json.js';
  import { installKeymap } from '$lib/keymap.js';
  import PaceBar from '$lib/PaceBar.svelte';
  import QrCode from '$lib/QrCode.svelte';

  const TITLE = 'Noninterference for LLM Tool Schemas';

  let { data } = $props();
  let section = $derived(data.section);
  let sectionMeta = $derived(sectionOf(section.section));
  let nextSection = $derived(next(section.num));
  let prevSection = $derived(prev(section.num));
  let position = $derived(section.orderIndex + 1);
  let total = flat.length;

  let dragOffset = $state(0);
  let dragging = $derived(dragOffset !== 0);

  let notesInline = $state(false);  // toggled by `n` key
  let helpOpen = $state(false);     // toggled by `?` key

  // ── presentation timer ──────────────────────────────────────────────────
  const TALK_MS = TALK_MINUTES * 60 * 1000;
  const TIMER_KEY = 'sveltekitslides:timer-start:noninterference-for-llm-tool-schemas';
  const CURRENT_KEY = 'sveltekitslides:current:noninterference-for-llm-tool-schemas';
  const PACE_TOLERANCE_MS = 30 * 1000;

  // Publish current slide num so the /presenter window can sync.
  $effect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CURRENT_KEY, section.num);
  });

  let timerStart = $state(null);
  let now = $state(Date.now());

  $effect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(TIMER_KEY);
    if (stored) timerStart = parseInt(stored, 10);
    const tick = setInterval(() => { now = Date.now(); }, 1000);
    return () => clearInterval(tick);
  });

  let elapsedMs = $derived(timerStart ? now - timerStart : 0);
  let remainingMs = $derived(TALK_MS - elapsedMs);
  let over = $derived(remainingMs < 0);
  let timerText = $derived(fmt(Math.abs(remainingMs)));

  let targetStartMs = $derived(section.targetStart * 60 * 1000);
  let targetEndMs = $derived(section.targetEnd * 60 * 1000);
  let paceMs = $derived(
    !timerStart
      ? 0
      : elapsedMs < targetStartMs
        ? elapsedMs - targetStartMs
        : elapsedMs > targetEndMs
          ? elapsedMs - targetEndMs
          : 0
  );
  let paceStatus = $derived(
    !timerStart
      ? 'idle'
      : Math.abs(paceMs) <= PACE_TOLERANCE_MS
        ? 'on-pace'
        : paceMs < 0 ? 'ahead' : 'behind'
  );
  let paceLabel = $derived(
    paceStatus === 'idle'
      ? `starts at ${fmt(targetStartMs)}`
      : paceStatus === 'on-pace'
        ? 'on pace'
        : paceStatus === 'ahead'
          ? `${fmt(Math.abs(paceMs))} ahead`
          : `${fmt(paceMs)} behind`
  );

  function fmt(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function toggleTimer() {
    if (!timerStart) {
      timerStart = Date.now();
      window.localStorage.setItem(TIMER_KEY, String(timerStart));
    } else {
      timerStart = null;
      window.localStorage.removeItem(TIMER_KEY);
    }
  }

  const pager = createPager({
    onNext: () => { if (nextSection) goto(base + '/' + nextSection.num); },
    onPrev: () => {
      if (prevSection) goto(base + '/' + prevSection.num);
      else goto(base + '/');
    },
    setOffset: (v) => { dragOffset = v; }
  });

  function key(e) {
    // We intentionally don't block when modifier keys are held — the user
    // might be doing real shortcuts.
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      if (nextSection) goto(base + '/' + nextSection.num);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      if (prevSection) goto(base + '/' + prevSection.num);
      else goto(base + '/');
    } else if (e.key === 'Escape') {
      goto(base + '/');
    }
  }

  onMount(() => installKeymap({
    onToggleNotes: () => { notesInline = !notesInline; },
    onToggleKeymapHelp: () => { helpOpen = !helpOpen; }
  }));

  let isDivider = $derived(section.kind === 'divider');
</script>

<svelte:window onkeydown={key} />

<main
  class="page"
  class:dragging
  class:is-divider={isDivider}
  data-kind={section.kind}
  onwheel={pager.onWheel}
  ontouchstart={pager.onTouchStart}
  ontouchmove={pager.onTouchMove}
  ontouchend={pager.onTouchEnd}
  ontouchcancel={pager.onTouchCancel}
  style:transform="translateX({dragOffset}px)"
>
  <section class="stage">
    <header class="chrome">
      <a class="mark vt-title" href="{base}/">{TITLE}</a>
      <div class="chrome-right">
        <span class="section-label">{sectionMeta?.label}</span>
        <span class="sep">·</span>
        <button
          type="button"
          class="timer"
          class:running={timerStart}
          class:over
          onclick={toggleTimer}
          title={timerStart ? 'Click to reset' : `Click to start ${TALK_MINUTES}-min timer`}
        >
          <span class="timer-dot"></span>
          <span class="timer-text">{over ? '+' : ''}{timerText}</span>
        </button>
        <span class="pace" data-status={paceStatus}>{paceLabel}</span>
      </div>
    </header>

    <div class="content" data-kind={section.kind}>
      {#if isDivider}
        <div class="divider-section-label">{sectionMeta?.label}</div>
      {/if}

      <h1 class="title">{section.title}</h1>

      {#if section.gist}
        <p class="gist">{@html md(section.gist)}</p>
      {/if}

      {#if section.attribution}
        <p class="attribution">— {section.attribution}</p>
      {/if}

      {#if section.wordmarks && section.wordmarks.length}
        <p class="wordmarks">
          {#each section.wordmarks as mark, i}
            {#if i > 0}<span class="sep"> · </span>{/if}<span class="mark">{mark}</span>
          {/each}
        </p>
      {/if}

      {#if section.code}
        <pre class="code"><code>{section.code.body}</code></pre>
      {/if}

      {#if section.compare}
        <div class="compare">
          <figure>
            <figcaption>{section.compare.left.label}</figcaption>
            <pre class="code json"><code>{@html highlightJson(section.compare.left.body)}</code></pre>
          </figure>
          <figure>
            <figcaption>{section.compare.right.label}</figcaption>
            <pre class="code json"><code>{@html highlightJson(section.compare.right.body)}</code></pre>
          </figure>
        </div>
      {/if}

      {#if section.points && section.points.length}
        <ul class="points">
          {#each section.points as point}
            <li>{@html md(point)}</li>
          {/each}
        </ul>
      {/if}

      {#if section.video}
        <div class="video-wrap" data-provider={section.video.provider}>
          {#if section.video.provider === 'youtube'}
            <iframe
              title={section.video.caption || 'Embedded video'}
              src={`https://www.youtube.com/embed/${section.video.id}?autoplay=1&mute=1&loop=1&playlist=${section.video.id}&controls=0&modestbranding=1&rel=0&playsinline=1`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer"
            ></iframe>
          {/if}
          {#if section.video.caption}
            <div class="video-caption">{section.video.caption}</div>
          {/if}
        </div>
      {/if}

      {#if notesInline && section.notes}
        <div class="notes-inline">
          {@html mdBlock(section.notes)}
        </div>
      {/if}
    </div>

    <aside class="qr-corner" class:big={section.kind === 'close'}>
      <QrCode size={section.kind === 'close' ? 160 : 96} caption="scan to follow along" />
    </aside>

    <footer class="stage-foot">
      <div class="nav-meta">
        <span class="pos">{position} / {total}</span>
        {#if prevSection}
          <a href="{base}/{prevSection.num}" class="nav-link">← {prevSection.title}</a>
        {:else}
          <a href="{base}/" class="nav-link">← Cover</a>
        {/if}
        {#if nextSection}
          <a href="{base}/{nextSection.num}" class="nav-link right">{nextSection.title} →</a>
        {:else}
          <span class="nav-link right disabled">End</span>
        {/if}
      </div>
      <PaceBar currentNum={section.num} elapsedMs={elapsedMs} running={!!timerStart} />
    </footer>
  </section>

  {#if section.notes}
    <section class="notes" aria-label="Rehearsal notes — not shown during live talk">
      <div class="notes-inner">
        <div class="notes-tag">Rehearsal notes</div>
        <div class="notes-body">{@html mdBlock(section.notes)}</div>
      </div>
    </section>
  {/if}

  {#if helpOpen}
    <div class="help-overlay" role="dialog" aria-label="Keymap" onclick={() => helpOpen = false}>
      <div class="help-card" onclick={(e) => e.stopPropagation()}>
        <h2>Keymap</h2>
        <table>
          <tbody>
            <tr><td><kbd>→</kbd> <kbd>PgDn</kbd> <kbd>Space</kbd></td><td>next slide</td></tr>
            <tr><td><kbd>←</kbd> <kbd>PgUp</kbd></td><td>previous slide</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>back to cover</td></tr>
            <tr><td><kbd>↓</kbd> <kbd>↑</kbd> / scroll</td><td>reveal notes below the fold</td></tr>
            <tr><td><kbd>n</kbd></td><td>toggle notes inline (above the fold)</td></tr>
            <tr><td><kbd>B</kbd> <kbd>.</kbd></td><td>blackout for Q&amp;A — any key restores</td></tr>
            <tr><td><kbd>g</kbd></td><td>jump to slide</td></tr>
            <tr><td><kbd>?</kbd></td><td>this help</td></tr>
          </tbody>
        </table>
        <p class="dismiss">Click anywhere to dismiss.</p>
      </div>
    </div>
  {/if}
</main>

<style>
  .page {
    min-height: 100vh;
    transition: transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1);
    touch-action: pan-y;
    will-change: transform;
  }

  .page.dragging { transition: none; }

  /* ── stage: exactly one screen, the "slide" itself ───────────── */
  .stage {
    height: 100vh;
    height: 100dvh;
    padding: 3vh 5vw 2vh 5vw;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 2vh;
    position: relative;
    overflow: hidden;
  }

  .chrome {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--sans);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--muted);
  }

  .mark {
    font-family: var(--serif);
    font-style: italic;
    font-size: 1rem;
    letter-spacing: 0;
    text-transform: none;
    color: var(--ink);
  }

  .chrome-right {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  .chrome-right .sep { color: var(--rule); }
  .section-label { color: var(--accent); }

  .timer {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.3rem 0.65rem;
    background: transparent;
    border: 1px solid var(--rule);
    border-radius: 999px;
    font-family: var(--sans);
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--muted);
    cursor: pointer;
  }
  .timer-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--rule);
    transition: background 160ms ease;
  }
  .timer.running .timer-dot { background: var(--accent); }
  .timer.over .timer-dot {
    background: var(--accent);
    animation: pulse 1.1s ease-in-out infinite;
  }
  .timer.over { color: var(--accent); border-color: var(--accent); }
  .timer-text { font-variant-numeric: tabular-nums; letter-spacing: 0.1em; }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.45; transform: scale(1.4); }
  }

  .pace {
    font-family: var(--sans);
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-variant-numeric: tabular-nums;
  }
  .pace[data-status='idle']    { color: var(--muted); }
  .pace[data-status='on-pace'] { color: var(--accent); }
  .pace[data-status='ahead']   { color: var(--accent); opacity: 0.85; }
  .pace[data-status='behind']  { color: var(--accent); font-weight: 500; }

  /* ── content: the actual projected slide ────────────────────── */
  .content {
    align-self: center;
    display: flex;
    flex-direction: column;
    gap: 2vh;
    max-width: 72ch;
  }

  .is-divider .content { max-width: 28ch; align-self: center; justify-self: start; }

  .divider-section-label {
    font-family: var(--sans);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.32em;
    color: var(--accent);
    margin-bottom: 0.8rem;
  }

  .title {
    font-family: var(--serif);
    font-weight: 300;
    font-style: italic;
    font-size: clamp(2.6rem, 5.4vw, 5.6rem);
    line-height: 0.98;
    letter-spacing: -0.02em;
    color: var(--ink);
  }

  .is-divider .title {
    font-size: clamp(3.5rem, 8vw, 7.5rem);
  }

  .gist {
    font-family: var(--serif);
    font-weight: 300;
    font-size: clamp(1.15rem, 1.8vw, 1.7rem);
    line-height: 1.35;
    color: var(--ink);
    max-width: 52ch;
    border-left: 2px solid var(--accent);
    padding-left: 1.2rem;
  }

  .attribution {
    font-family: var(--serif);
    font-style: italic;
    font-weight: 300;
    font-size: clamp(0.95rem, 1.1vw, 1.1rem);
    line-height: 1.4;
    color: var(--muted);
    padding-left: 1.3rem;
    margin-top: -0.8rem;
    max-width: 52ch;
  }

  .wordmarks {
    font-family: var(--serif);
    font-style: italic;
    font-weight: 300;
    font-size: clamp(1.6rem, 2.6vw, 2.4rem);
    line-height: 1.2;
    color: var(--ink);
    padding-left: 1.2rem;
    margin: 0.5rem 0;
  }

  .wordmarks .sep {
    color: var(--accent);
    font-style: normal;
    font-weight: 400;
    padding: 0 0.2rem;
  }

  .video-wrap {
    align-self: flex-start;
    width: min(480px, 60vw);
    max-width: 100%;
    margin-left: 1.2rem;
  }

  .video-wrap iframe {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 0;
    border-radius: 6px;
    box-shadow: 0 12px 40px rgba(20, 17, 13, 0.18);
    background: #000;
  }

  .video-caption {
    font-family: var(--sans);
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--muted);
    margin-top: 0.55rem;
  }

  .code {
    font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
    font-size: clamp(0.9rem, 1.1vw, 1.05rem);
    line-height: 1.55;
    padding: 1.2rem 1.4rem;
    background: color-mix(in srgb, var(--ink) 5%, transparent);
    border-left: 2px solid var(--accent);
    max-width: 80ch;
    overflow-x: auto;
    white-space: pre;
    color: var(--ink);
  }

  .points {
    list-style: none;
    padding-left: 1.2rem;
    border-left: 2px solid transparent;
  }

  .points li {
    font-family: var(--serif);
    font-weight: 300;
    font-size: clamp(1rem, 1.3vw, 1.25rem);
    line-height: 1.5;
    color: var(--ink);
    padding: 0.35rem 0 0.35rem 1.4rem;
    position: relative;
    max-width: 62ch;
  }

  .points li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.95em;
    width: 0.6rem;
    height: 1px;
    background: var(--accent);
  }

  /* ── side-by-side compare (e.g. two JSON schemas) ─────────────── */
  .compare {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.4rem;
    max-width: 100%;
  }

  .compare figure {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    min-width: 0;
  }

  .compare figcaption {
    font-family: var(--sans);
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.24em;
    color: var(--accent);
  }

  .compare .code {
    margin: 0;
    font-size: clamp(0.78rem, 0.95vw, 0.92rem);
    line-height: 1.5;
    padding: 0.9rem 1.1rem;
  }

  /* JSON token colors — applied via .json + spans from highlightJson() */
  .code.json :global(.jk) { color: var(--accent); }
  .code.json :global(.js) { color: color-mix(in srgb, var(--ink) 80%, transparent); }
  .code.json :global(.jn) { color: color-mix(in srgb, var(--accent) 70%, var(--ink)); }
  .code.json :global(.jl) {
    color: color-mix(in srgb, var(--ink) 60%, transparent);
    font-style: italic;
  }

  @media (max-width: 720px) {
    .compare { grid-template-columns: 1fr; gap: 1rem; }
  }

  .points :global(strong) { font-weight: 500; font-style: normal; }
  .points :global(em)     { font-style: italic; }
  .points :global(code) {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 0.88em;
    padding: 0.08em 0.35em;
    background: color-mix(in srgb, var(--ink) 6%, transparent);
    border-radius: 3px;
  }

  .gist :global(code) {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 0.9em;
    padding: 0.08em 0.35em;
    background: color-mix(in srgb, var(--ink) 6%, transparent);
    border-radius: 3px;
  }

  /* notes shown inline (toggled by `n` key) — distinct from below-fold notes */
  .notes-inline {
    font-family: var(--serif);
    font-weight: 300;
    font-size: clamp(0.95rem, 1.05vw, 1.05rem);
    line-height: 1.6;
    color: var(--muted);
    padding: 1rem 1.2rem;
    border-left: 1px dashed var(--rule);
    max-width: 62ch;
    background: color-mix(in srgb, var(--ink) 3%, transparent);
  }

  /* ── QR in the corner ───────────────────────────────────────── */
  .qr-corner { position: absolute; right: 5vw; bottom: 9vh; }
  .qr-corner.big { right: 6vw; bottom: 10vh; }

  /* ── foot: pace bar + nav ───────────────────────────────────── */
  .stage-foot { display: flex; flex-direction: column; gap: 0.8rem; }

  .nav-meta {
    display: grid;
    grid-template-columns: auto 1fr 1fr;
    gap: 1.5rem;
    align-items: baseline;
    font-family: var(--sans);
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--muted);
  }

  .pos { font-variant-numeric: tabular-nums; }

  .nav-link {
    color: var(--muted);
    transition: color 180ms ease;
    font-family: var(--serif);
    font-style: italic;
    font-size: 0.95rem;
    text-transform: none;
    letter-spacing: 0;
  }
  .nav-link:hover { color: var(--ink); }
  .nav-link.disabled { opacity: 0.4; }
  .nav-link.right { text-align: right; justify-self: end; }

  /* ── rehearsal notes, below the fold ────────────────────────── */
  .notes {
    padding: 8vh 5vw 12vh 5vw;
    border-top: 1px solid var(--rule);
    background: color-mix(in srgb, var(--bg) 92%, #000 8%);
  }

  .notes-inner { max-width: 62ch; margin: 0 auto; }

  .notes-tag {
    font-family: var(--sans);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.32em;
    color: var(--accent);
    margin-bottom: 1.4rem;
  }

  .notes-body {
    font-family: var(--serif);
    font-weight: 300;
    font-size: clamp(1rem, 1.1vw, 1.1rem);
    line-height: 1.65;
    color: var(--ink);
  }

  .notes-body :global(p) { margin: 0 0 1.1em; }
  .notes-body :global(p:last-child) { margin-bottom: 0; }
  .notes-body :global(ul) { margin: 0 0 1.1em; padding-left: 1.4rem; }
  .notes-body :global(li) { margin: 0.3em 0; }
  .notes-body :global(strong) { font-weight: 500; }
  .notes-body :global(em) { font-style: italic; }
  .notes-body :global(code) {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 0.9em;
    padding: 0.1em 0.4em;
    background: color-mix(in srgb, var(--ink) 6%, transparent);
    border-radius: 3px;
  }

  /* ── help overlay (?) ───────────────────────────────────────── */
  .help-overlay {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--ink) 30%, transparent);
    display: grid;
    place-items: center;
    z-index: 100;
    cursor: pointer;
  }
  .help-card {
    background: var(--bg);
    color: var(--ink);
    padding: 2rem 2.4rem;
    border: 1px solid var(--rule);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
    font-family: var(--sans);
    font-size: 0.85rem;
    cursor: default;
    max-width: 520px;
  }
  .help-card h2 {
    font-family: var(--serif);
    font-style: italic;
    font-weight: 300;
    font-size: 1.6rem;
    margin-bottom: 1rem;
  }
  .help-card table { width: 100%; border-collapse: collapse; }
  .help-card td { padding: 0.45rem 0; vertical-align: top; }
  .help-card td:first-child { width: 45%; padding-right: 1rem; }
  .help-card kbd {
    display: inline-block;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.8em;
    padding: 0.12em 0.45em;
    margin-right: 0.2em;
    background: color-mix(in srgb, var(--ink) 8%, transparent);
    border: 1px solid var(--rule);
    border-radius: 3px;
  }
  .help-card .dismiss {
    margin-top: 1rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--muted);
  }

  /* ── mobile ─────────────────────────────────────────────────── */
  @media (max-width: 720px) {
    .stage { padding: 2.5vh 6vw 2vh 6vw; gap: 1.4vh; }
    .chrome { font-size: 0.6rem; letter-spacing: 0.16em; }
    .chrome-right { gap: 0.5rem; }
    .chrome-right .section-label { display: none; }
    .chrome-right .sep { display: none; }
    .title { font-size: clamp(1.9rem, 7vw, 2.6rem); }
    .is-divider .title { font-size: clamp(2.4rem, 9vw, 3.4rem); }
    .gist { font-size: clamp(0.95rem, 4vw, 1.1rem); padding-left: 0.8rem; }
    .points { padding-left: 0.6rem; }
    .points li { font-size: clamp(0.9rem, 3.6vw, 1rem); padding-left: 1rem; }
    .code { font-size: 0.78rem; padding: 0.8rem; }
    .qr-corner { right: 4vw; bottom: 10vh; }
    .nav-meta { grid-template-columns: 1fr; gap: 0.3rem; font-size: 0.58rem; }
    .nav-link.right { justify-self: start; text-align: left; }
  }
</style>
