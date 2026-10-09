import { useEffect } from 'react';
import { spin, spinWeight } from './choreography';

const TURN = Math.PI * 2;
const MAX_STEP = 120; // px — ignore jumps (pointer re-entering the window)

/**
 * Free 360° spin on both axes, in the showcase header and at 100% scroll.
 * - Mouse: press on the stage (`[data-spin-stage]`) and drag — crossing the
 *   whole screen sideways is one full turn, top-to-bottom one full flip.
 *   Releasing stops it (it eases into the exact spot it was left at);
 *   merely moving the mouse never rotates it.
 * - Touch: on the stage (`[data-spin-stage]`), with the page fully at the
 *   top or at the end (100%), a gesture that starts sideways spins the
 *   mockup (both axes for the rest of that drag). A gesture that starts
 *   up/down always scrolls, so the page never feels stuck. Scrolling is
 *   blocked per gesture (non-passive touchmove + preventDefault), never with
 *   `touch-action: none`.
 */
export default function useSpinControls() {
  useEffect(() => {
    let last = null;
    let touching = false; // gesture started on the stage, direction unknown
    let spinning = false; // gesture locked to spinning

    const rotateBy = (dx, dy) => {
      if (Math.abs(dx) > MAX_STEP || Math.abs(dy) > MAX_STEP) return;
      spin.target += (dx / window.innerWidth) * TURN;
      spin.pitchTarget += (dy / window.innerHeight) * TURN;
    };

    let dragging = false; // mouse button held down on the stage

    const onPointerDown = (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      if (!e.target.closest?.('[data-spin-stage]') || spinWeight() < 0.95) return;
      e.preventDefault(); // no text selection while dragging
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      document.documentElement.classList.add('is-spinning');
    };
    const onPointerMove = (e) => {
      if (!dragging || e.pointerType === 'touch') return;
      const prev = last;
      last = { x: e.clientX, y: e.clientY };
      rotateBy(last.x - prev.x, last.y - prev.y);
    };
    const onPointerUp = (e) => {
      if (!dragging || e?.pointerType === 'touch') return;
      dragging = false;
      last = null;
      document.documentElement.classList.remove('is-spinning');
    };

    const onTouchStart = (e) => {
      touching = e.touches.length === 1 && !!e.target.closest?.('[data-spin-stage]') && spinWeight() > 0.95;
      spinning = false;
      last = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e) => {
      if (!touching || !last) return;
      const t = e.touches[0];
      if (!spinning) {
        const dx = Math.abs(t.clientX - last.x);
        const dy = Math.abs(t.clientY - last.y);
        if (dx + dy < 3) return; // too small to tell the direction yet
        if (dy >= dx) {
          touching = false; // vertical: let the page scroll
          return;
        }
        spinning = true;
      }
      if (e.cancelable) e.preventDefault(); // this drag spins, it doesn't scroll
      rotateBy((t.clientX - last.x) * 1.2, (t.clientY - last.y) * 1.2);
      last = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = () => {
      touching = false;
      spinning = false;
      last = null;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('blur', onPointerUp);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('blur', onPointerUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);
}
