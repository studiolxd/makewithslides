import { useCallback } from 'react';
import type { ElementAnimation, PopupItem } from '../../types';

interface PopupCardProps {
  item: PopupItem;
  blocking?: boolean;
  isCompleted: boolean;
  onOpen: (item: PopupItem) => void;
  onComplete: (id: string) => void;
}

function animationStyle(anim?: ElementAnimation): React.CSSProperties {
  if (!anim) return {};
  const delay = anim.delay ?? 0;
  const duration = anim.duration ?? 0.6;
  return {
    opacity: 0,
    animation: `it-${anim.type} ${duration}s ${delay}s ease-out forwards`,
  };
}

export function PopupCard({ item, blocking, isCompleted, onOpen, onComplete }: PopupCardProps) {
  const hoverScale = item.hoverScale ?? (blocking ? 0.95 : 0.85);

  const handleClick = useCallback(() => {
    if (!isCompleted) {
      onComplete(item.id);
    }
    onOpen(item);
  }, [isCompleted, onComplete, onOpen, item]);

  const classNames = [
    'popup-card',
    isCompleted && 'popup-card--completed',
    blocking && 'popup-card--blocking',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      style={{ '--hover-scale': hoverScale, ...animationStyle(item.imageAnimation) } as React.CSSProperties}
      onClick={handleClick}
      type="button"
    >
      <img className="popup-card__image" src={item.image} alt={item.title ?? ''} />

      {item.title && (
        <div className={`popup-card__title-block${item.titleTheme === 'dark' ? ' popup-card__title-block--dark' : ''}`}>
          <span className="popup-card__title">{item.title}</span>
        </div>
      )}

      {isCompleted && <div className="popup-card__overlay" />}
      {isCompleted && <span className="sr-only">Completado</span>}
    </button>
  );
}
