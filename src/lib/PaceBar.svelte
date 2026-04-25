<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { flat, sections, TALK_MINUTES } from './outline.js';

  /**
   * @typedef {Object} Props
   * @property {string} currentNum           - The current slide's num.
   * @property {number} [elapsedMs=0]        - Timer elapsed in ms (0 if idle).
   * @property {boolean} [running=false]     - Whether the talk timer is running.
   */

  /** @type {Props} */
  let { currentNum, elapsedMs = 0, running = false } = $props();

  const TALK_MS = TALK_MINUTES * 60 * 1000;

  const sectionRanges = (() => {
    const byId = {};
    for (const card of flat) {
      const r = byId[card.section] || (byId[card.section] = { start: Infinity, end: 0 });
      r.start = Math.min(r.start, card.targetStart);
      r.end = Math.max(r.end, card.targetEnd);
    }
    return sections
      .filter((s) => byId[s.id] && byId[s.id].end > byId[s.id].start)
      .map((s) => ({
        id: s.id,
        label: s.label,
        startPct: (byId[s.id].start / TALK_MINUTES) * 100,
        endPct: (byId[s.id].end / TALK_MINUTES) * 100
      }));
  })();

  let current = $derived(flat.find((c) => c.num === currentNum));

  let slideBand = $derived(
    current
      ? {
          left: (current.targetStart / TALK_MINUTES) * 100,
          width: Math.max(
            0.4,
            ((current.targetEnd - current.targetStart) / TALK_MINUTES) * 100
          )
        }
      : null
  );

  let clockPct = $derived(
    running ? Math.max(0, Math.min(100, (elapsedMs / TALK_MS) * 100)) : null
  );

  function onBarClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const targetMin = frac * TALK_MINUTES;
    let best = flat[0];
    let bestDist = Infinity;
    for (const c of flat) {
      const mid = (c.targetStart + c.targetEnd) / 2;
      const d = Math.abs(mid - targetMin);
      if (d < bestDist) {
        best = c;
        bestDist = d;
      }
    }
    if (best && best.num !== currentNum) goto(base + '/' + best.num);
  }
</script>

<button type="button" class="pacebar" onclick={onBarClick} aria-label="Talk timeline — click to jump">
  <span class="axis"></span>

  {#each sectionRanges as r}
    <span class="section-tick" style:left="{r.startPct}%" title={r.label}></span>
  {/each}

  {#if slideBand}
    <span class="slide-band" style:left="{slideBand.left}%" style:width="{slideBand.width}%"></span>
  {/if}

  {#if clockPct !== null}
    <span class="clock" style:left="{clockPct}%"></span>
  {/if}
</button>

<style>
  .pacebar {
    position: relative;
    display: block;
    width: 100%;
    height: 14px;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
  }

  .axis {
    position: absolute;
    top: 50%; left: 0; right: 0;
    height: 1px;
    background: var(--rule);
    transform: translateY(-50%);
    pointer-events: none;
  }

  .section-tick {
    position: absolute;
    top: 50%;
    width: 1px;
    height: 10px;
    background: var(--rule);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .slide-band {
    position: absolute;
    top: 50%;
    height: 4px;
    background: var(--accent);
    border-radius: 2px;
    transform: translateY(-50%);
    opacity: 0.55;
    pointer-events: none;
    transition: left 280ms ease, width 280ms ease;
  }

  .clock {
    position: absolute;
    top: 50%;
    width: 2px;
    height: 14px;
    background: var(--ink);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
</style>
