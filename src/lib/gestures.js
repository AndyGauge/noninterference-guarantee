/**
 * Gesture helpers: wheel + touch-drag → discrete page navigation.
 *
 * Vertical scroll / vertical swipe is reserved for scrolling the current
 * page's content (which reveals rehearsal notes). Only horizontal gestures
 * turn pages.
 */

const WHEEL_THRESHOLD = 140;
const TOUCH_THRESHOLD = 70;
const DRAG_MAX = 260;
const COOLDOWN = 750;
const WHEEL_RESET_MS = 220;

export function createPager({ onNext, onPrev, setOffset }) {
  let lastNav = 0;
  let wheelAccum = 0;
  let wheelResetTimer;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let touchCurrentY = 0;
  let dragging = false;
  let dragAxis = null;

  const cooldownOk = () => Date.now() - lastNav >= COOLDOWN;

  function fireNext() {
    if (!cooldownOk()) return;
    lastNav = Date.now();
    onNext?.();
  }

  function firePrev() {
    if (!cooldownOk()) return;
    lastNav = Date.now();
    onPrev?.();
  }

  function onWheel(e) {
    const dx = e.deltaX;
    const dy = e.deltaY;

    if (Math.abs(dx) <= Math.abs(dy)) {
      wheelAccum = 0;
      return;
    }

    e.preventDefault?.();
    wheelAccum += dx;

    if (wheelAccum >= WHEEL_THRESHOLD) {
      wheelAccum = 0;
      fireNext();
    } else if (wheelAccum <= -WHEEL_THRESHOLD) {
      wheelAccum = 0;
      firePrev();
    }

    clearTimeout(wheelResetTimer);
    wheelResetTimer = setTimeout(() => {
      wheelAccum = 0;
    }, WHEEL_RESET_MS);
  }

  function onTouchStart(e) {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchCurrentX = touchStartX;
    touchCurrentY = touchStartY;
    dragging = true;
    dragAxis = null;
  }

  function onTouchMove(e) {
    if (!dragging) return;
    const t = e.touches[0];
    touchCurrentX = t.clientX;
    touchCurrentY = t.clientY;
    const dx = touchCurrentX - touchStartX;
    const dy = touchCurrentY - touchStartY;

    if (dragAxis === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        dragAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
    }

    if (dragAxis === 'x') {
      e.preventDefault();
      const clamped = Math.max(-DRAG_MAX, Math.min(DRAG_MAX, dx));
      setOffset?.(clamped);
    }
  }

  function onTouchEnd() {
    if (!dragging) return;
    dragging = false;
    const dx = touchCurrentX - touchStartX;

    if (dragAxis === 'x' && Math.abs(dx) > TOUCH_THRESHOLD) {
      if (dx < 0) fireNext();
      else firePrev();
      setTimeout(() => setOffset?.(0), 30);
    } else if (dragAxis === 'x') {
      setOffset?.(0);
    }

    dragAxis = null;
  }

  return {
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd
  };
}
