import { useCallback, useEffect, useRef, useState } from 'react';
import type { ElementAnimation, ImageTextSlideData } from '../../types';
import { useSlideInteraction } from '../../contexts/SlideInteractionContext';
import { sanitize } from '../../utils/sanitize';
import { HelpTooltip } from '../InteractiveImageLayout/HelpTooltip';

interface ImageTextLayoutProps {
  data: ImageTextSlideData;
}

const alignMap = { start: 'flex-start', middle: 'center', end: 'flex-end' } as const;

function animationStyle(anim?: ElementAnimation): React.CSSProperties {
  if (!anim || anim.stagger != null) return {};
  const delay = anim.delay ?? 0;
  const duration = anim.duration ?? 0.6;
  return {
    opacity: 0,
    animation: `it-${anim.type} ${duration}s ${delay}s ease-out forwards`,
  };
}

export function ImageTextLayout({ data }: ImageTextLayoutProps) {
  const positionClass = `layout-image-text--${data.imagePosition}`;
  const isHorizontal = data.imagePosition === 'left' || data.imagePosition === 'right';
  const size = data.imageSize ?? 50;
  const align = data.contentAlign ?? 'middle';
  const hasStagger = data.textAnimation?.stagger != null;
  const textRef = useRef<HTMLDivElement>(null);
  const animType = data.textAnimation?.type;
  const animDelay = data.textAnimation?.delay;
  const animDuration = data.textAnimation?.duration;
  const animStagger = data.textAnimation?.stagger;
  const [popupOpen, setPopupOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const popupContainerRef = useRef<HTMLDivElement>(null);

  const registered = useRef(false);
  const { completedIds, registerRequiredInteractions, markCompleted } = useSlideInteraction();
  const isCompleted = completedIds.includes('icon-popup');

  useEffect(() => {
    if (!data.iconPopup || registered.current) return;
    registered.current = true;
    registerRequiredInteractions(1);
  }, [data.iconPopup, registerRequiredInteractions]);

  const handlePopupOpen = useCallback(() => {
    setPopupOpen(true);
    if (!isCompleted) markCompleted('icon-popup');
  }, [isCompleted, markCompleted]);

  const handlePopupClose = useCallback(() => setPopupOpen(false), []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setPopupOpen(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setPopupOpen(false);
  }, []);

  useEffect(() => {
    if (popupOpen) closeRef.current?.focus();
  }, [popupOpen]);

  // Focus trap para el popup inline
  useEffect(() => {
    if (!popupOpen) return;
    const container = popupContainerRef.current;
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
  }, [popupOpen]);

  useEffect(() => {
    if (!hasStagger || !textRef.current || !animType) return;
    const baseDelay = animDelay ?? 0;
    const step = animStagger!;
    const duration = animDuration ?? 0.6;
    const name = `it-${animType}`;

    const elements = textRef.current.querySelectorAll<HTMLElement>(':scope > p, :scope > ul > li, :scope > ol > li');
    elements.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.animation = `${name} ${duration}s ${baseDelay + i * step}s ease-out forwards`;
    });
  }, [hasStagger, animType, animDelay, animDuration, animStagger]);

  const imageWrapperStyle: React.CSSProperties = {
    ...(isHorizontal ? { width: `${size}%` } : { height: `${size}%` }),
    ...animationStyle(data.imageAnimation),
  };

  return (
    <div className={`layout-image-text ${positionClass}`}>
      {data.image && (
        <div className="layout-image-text__image-wrapper" style={imageWrapperStyle}>
          <img
            className="layout-image-text__image"
            src={data.image}
            alt={data.title}
            style={data.objectPosition ? { objectPosition: data.objectPosition } : undefined}
          />
        </div>
      )}
      <div className="layout-image-text__content" style={{ justifyContent: alignMap[align] }}>
        {(data.showInlineTitle ?? true) && (
          <h2
            className="layout-image-text__title"
            style={animationStyle(data.titleAnimation)}
          >
            {data.title}
          </h2>
        )}
        <div
          ref={textRef}
          className="layout-image-text__text"
          style={hasStagger ? undefined : animationStyle(data.textAnimation)}
          dangerouslySetInnerHTML={{ __html: sanitize(data.text) }}
        />
        {data.iconPopup && (
          <button
            className={`layout-image-text__icon-popup-btn${isCompleted ? ' layout-image-text__icon-popup-btn--completed' : ''}`}
            onClick={handlePopupOpen}
            type="button"
            aria-label={data.iconPopup.popupTitle ?? 'Más información'}
          >
            <i className={data.iconPopup.icon} aria-hidden="true" />
          </button>
        )}
      </div>
      {data.iconPopup && !isCompleted && (
        <HelpTooltip
          text={data.iconPopup.helpTooltip ?? 'Pulsa el icono para ver más información'}
          style={{ bottom: 16, right: 16, top: 'auto', left: 'auto' }}
          tooltipPosition="above-left"
        />
      )}
      {data.iconPopup && popupOpen && (
        <div
          className="popup-modal"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label={data.iconPopup.popupTitle ?? 'Popup'}
        >
          <div className="popup-modal__container" ref={popupContainerRef}>
            <button
              ref={closeRef}
              className="popup-modal__close"
              onClick={handlePopupClose}
              aria-label="Cerrar"
              type="button"
            >
              <i className="fi fi-br-cross" aria-hidden="true" />
            </button>
            {data.iconPopup.popupTitle && (
              <h3 className="popup-modal__title">{data.iconPopup.popupTitle}</h3>
            )}
            <div
              className="popup-modal__content"
              dangerouslySetInnerHTML={{ __html: sanitize(data.iconPopup.popupContent) }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
