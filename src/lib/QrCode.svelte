<script>
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';

  /**
   * @typedef {Object} Props
   * @property {string} [text]       - Text/URL to encode. Defaults to current page URL.
   * @property {number} [size=128]   - Rendered size in px.
   * @property {string} [caption]    - Small caption shown under the code.
   * @property {'dark'|'light'} [mode='light'] - QR theme; flips fg/bg colors.
   */

  /** @type {Props} */
  let { text = '', size = 128, caption = '', mode = 'light' } = $props();

  let svgMarkup = $state('');

  function resolveTarget() {
    if (text) return text;
    if (typeof window === 'undefined') return '';
    const fromEnv = import.meta.env.VITE_PUBLIC_URL;
    return fromEnv || window.location.origin + window.location.pathname;
  }

  onMount(async () => {
    const target = resolveTarget();
    if (!target) return;
    try {
      svgMarkup = await QRCode.toString(target, {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
        color:
          mode === 'dark'
            ? { dark: '#f4efe3', light: '#00000000' }
            : { dark: '#14110d', light: '#00000000' }
      });
    } catch (e) {
      svgMarkup = '';
    }
  });
</script>

<div class="qr" style:width="{size}px">
  {#if svgMarkup}
    <div class="code" style:width="{size}px" style:height="{size}px">
      {@html svgMarkup}
    </div>
  {:else}
    <div class="code placeholder" style:width="{size}px" style:height="{size}px"></div>
  {/if}
  {#if caption}
    <div class="caption">{caption}</div>
  {/if}
</div>

<style>
  .qr {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.45rem;
  }

  .code { display: block; }

  .code :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }

  .placeholder {
    border: 1px dashed var(--rule);
    border-radius: 4px;
  }

  .caption {
    font-family: var(--sans);
    font-size: 0.6rem;
    text-transform: lowercase;
    letter-spacing: 0.14em;
    color: var(--muted);
    text-align: center;
    word-break: break-all;
    line-height: 1.3;
  }
</style>
