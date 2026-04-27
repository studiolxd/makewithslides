import { useCallback, useEffect, useRef } from 'react';
import type { PopupItem } from '../../types';
import { sanitize } from '../../utils/sanitize';

interface PopupModalProps {
  item: PopupItem;
  onClose: () => void;
}

export function PopupModal({ item, onClose }: PopupModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  // Focus close button on mount
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Focus trap: cicla el foco dentro del modal al tabular
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    container.addEventListener('keydown', handleTab);
    return () => container.removeEventListener('keydown', handleTab);
  }, []);

  return (
    <div
      className="popup-modal"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={item.popupTitle ?? 'Popup'}
    >
      <div className="popup-modal__container" ref={containerRef}>
        <button
          ref={closeRef}
          className="popup-modal__close"
          onClick={onClose}
          aria-label="Cerrar"
          type="button"
        >
          <i className="fi fi-br-cross" aria-hidden="true" />
        </button>
        {item.popupTitle && (
          <h3 className="popup-modal__title">{item.popupTitle}</h3>
        )}
        <div
          className="popup-modal__content"
          dangerouslySetInnerHTML={{ __html: sanitize(item.popupContent) }}
        />
      </div>
    </div>
  );
}
