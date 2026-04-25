// Keyboard shortcuts beyond the basic prev/next. The slide page wires
// these up via `installKeymap()`; the cover page just listens for "begin".
//
//   B  blackout (any key restores)
//   n  toggle inline-notes mode (otherwise notes only appear via scroll)
//   ?  toggle keymap overlay
//   g  jump-to-slide picker (uses a native <dialog>-like prompt)
//   .  same as B (Powerpoint convention)

import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { flat } from './outline.js';

export function installKeymap({ onToggleNotes, onToggleKeymapHelp }) {
  if (typeof window === 'undefined') return () => {};

  function blackout(on) {
    document.body.classList.toggle('blackout', on);
  }

  let blackedOut = false;

  function key(e) {
    // Don't intercept when the user is typing in a real input.
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

    if (blackedOut) {
      blackedOut = false;
      blackout(false);
      e.preventDefault();
      return;
    }

    if (e.key === 'b' || e.key === 'B' || e.key === '.') {
      blackedOut = true;
      blackout(true);
      e.preventDefault();
      return;
    }

    if (e.key === 'n' || e.key === 'N') {
      onToggleNotes?.();
      e.preventDefault();
      return;
    }

    if (e.key === '?') {
      onToggleKeymapHelp?.();
      e.preventDefault();
      return;
    }

    if (e.key === 'g' || e.key === 'G') {
      const ans = window.prompt(
        `Jump to slide (1–${flat.length}, or section id):`,
        ''
      );
      if (!ans) return;
      const num = parseInt(ans, 10);
      let target = null;
      if (Number.isFinite(num) && num >= 1 && num <= flat.length) {
        target = flat[num - 1];
      } else {
        target = flat.find((c) => c.section === ans.trim());
      }
      if (target) goto(base + '/' + target.num);
      e.preventDefault();
    }
  }

  window.addEventListener('keydown', key);
  return () => {
    window.removeEventListener('keydown', key);
    blackout(false);
  };
}
