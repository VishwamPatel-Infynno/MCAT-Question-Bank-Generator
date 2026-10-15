import { useEffect } from 'react';

export function useKeyboardShortcuts({
  onGenerate,
  onApprove,
  onDiscard,
  onToggleEdit,
  onToggleTheme,
  onFocusSearch,
  onEscape
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputActive = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

      // Escape always handles modal/editor dismissal
      if (e.key === 'Escape') {
        if (onEscape) onEscape();
        return;
      }

      // Cmd+Enter or Ctrl+Enter triggers Generation
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (onGenerate) onGenerate();
        return;
      }

      // If typing in input, ignore single-character navigation shortcuts
      if (isInputActive) return;

      // Key: T -> Toggle Theme
      if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (onToggleTheme) onToggleTheme();
        return;
      }

      // Key: / -> Focus Search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (onFocusSearch) onFocusSearch();
        return;
      }

      // Key: A -> Approve Candidate
      if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (onApprove) onApprove();
        return;
      }

      // Key: D -> Discard Candidate
      if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (onDiscard) onDiscard();
        return;
      }

      // Key: E -> Quick Edit
      if (e.key.toLowerCase() === 'e' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (onToggleEdit) onToggleEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGenerate, onApprove, onDiscard, onToggleEdit, onToggleTheme, onFocusSearch, onEscape]);
}
