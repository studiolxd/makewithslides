import { useCallback, useState } from 'react';
import type { ElementAnimation, InteractiveImageItem } from '../../types';
import { sanitize } from '../../utils/sanitize';

interface InteractiveImageCardProps {
  item: InteractiveImageItem;
  blocking?: boolean;
  isCompleted: boolean;
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

export function InteractiveImageCard({ item, blocking, isCompleted, onComplete }: InteractiveImageCardProps) {
  const [open, setOpen] = useState(isCompleted);
  const hoverScale = item.hoverScale ?? (blocking ? 0.95 : 0.85);

  const handleClick = useCallback(() => {
    if (!open) {
      if (!isCompleted) {
        onComplete(item.id);
      }
      setOpen(true);
    } else if (!blocking) {
      setOpen(false);
    }
  }, [open, blocking, isCompleted, onComplete, item.id]);

  const classNames = [
    'ii-card',
    open && 'ii-card--open',
    isCompleted && 'ii-card--completed',
    blocking && 'ii-card--blocking',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      style={{ '--hover-scale': hoverScale, ...animationStyle(item.imageAnimation) } as React.CSSProperties}
      onClick={handleClick}
      aria-expanded={open}
      type="button"
    >
      <img className="ii-card__image" src={item.image} alt={item.title ?? ''} />

      {item.title && (
        <div className={`ii-card__title-block${item.titleTheme === 'dark' ? ' ii-card__title-block--dark' : ''}`}>
          <span className="ii-card__title">{item.title}</span>
          {open && <span className="ii-card__title-line" />}
        </div>
      )}

      {open && (
        <div className="ii-card__overlay">
          <div
            className="ii-card__overlay-content"
            dangerouslySetInnerHTML={{ __html: sanitize(item.overlayContent) }}
          />
        </div>
      )}
      {isCompleted && <span className="sr-only">Completado</span>}
    </button>
  );
}
