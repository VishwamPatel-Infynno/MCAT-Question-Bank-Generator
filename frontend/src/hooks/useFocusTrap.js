import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * useFocusTrap:
 * WCAG-compliant keyboard focus trap for modal dialogs and drawers.
 *
 * - Traps Tab and Shift+Tab cycles strictly inside the referenced container.
 * - Auto-focuses the first focusable child upon mounting.
 * - Restores focus to the triggering element upon unmount.
 * - Listens for Escape key to close the dialog.
 */
export function useFocusTrap({ isActive = true, onClose = null }) {
  const containerRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    previousActiveElementRef.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    // Find first focusable element and focus it
    const focusableElements = container.querySelectorAll(FOCUSABLE_SELECTOR);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      container.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) {
          e.stopPropagation();
          onClose();
        }
        return;
      }

      if (e.key !== 'Tab') return;

      const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
      if (elements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: if on first element, wrap to last
        if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isActive, onClose]);

  return containerRef;
}

export default useFocusTrap;
