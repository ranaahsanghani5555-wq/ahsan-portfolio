import { useEffect } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * useFocusTrap — traps Tab focus inside `ref` and closes on Escape.
 *
 * Behaviour is split across two effects on purpose:
 *  - the mount effect records the element that opened the dialog and restores
 *    focus to it when the dialog unmounts, so a keyboard user always lands
 *    back where they left off;
 *  - the `active` effect attaches the key listener. Overlays that open a second
 *    dialog on top can set `active: false` while they are covered, so the two
 *    traps never fight over the Tab key.
 *
 * Focus moves into the dialog whenever the trap is armed and focus is still
 * outside it, which keeps focus inside the lower dialog when a stacked dialog
 * closes (the incoming focus is already within the node, so it is left alone).
 *
 * @param {React.RefObject<HTMLElement>} ref   the dialog element
 * @param {object}  options
 * @param {boolean} options.active             whether the trap is armed
 * @param {() => void} options.onClose         called on Escape
 * @param {React.RefObject<HTMLElement>} [options.restoreTo] explicit opener
 * @param {boolean} [options.focusFirst]       move focus in when armed
 */
export function useFocusTrap(ref, { active = true, onClose, restoreTo, focusFirst = true } = {}) {
  useEffect(() => {
    // Capture the opener once, on mount, so focus can be restored on unmount.
    const opener = restoreTo?.current ?? document.activeElement;
    return () => {
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, [restoreTo]);

  useEffect(() => {
    if (!active) return undefined;
    const node = ref.current;
    if (!node) return undefined;

    const focusables = () =>
      Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );

    // Idempotent: only pull focus in when it is not already inside. This keeps
    // the behaviour correct under StrictMode's double-invoked effects and when a
    // stacked dialog closes above this one.
    if (focusFirst && !node.contains(document.activeElement)) {
      const first = focusables()[0] ?? node;
      first.focus?.();
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (!items.length) {
        event.preventDefault();
        node.focus?.();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [active, onClose, focusFirst, ref]);
}
