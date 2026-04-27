import { useCallback, useEffect, useRef, useState } from 'react';
import type { ElementAnimation, InteractiveTextSlideData } from '../../types';
import { useSlideInteraction } from '../../contexts/SlideInteractionContext';
import { sanitize } from '../../utils/sanitize';
import { HelpTooltip } from '../InteractiveImageLayout/HelpTooltip';

interface InteractiveTextLayoutProps {
  data: InteractiveTextSlideData;
}

const alignMap = { start: 'flex-start', middle: 'center', end: 'flex-end' } as const;

const overlayAlignXMap = { left: 'flex-start', center: 'center', right: 'flex-end' } as const;
const overlayAlignYMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' } as const;

const INTERACTION_ID = 'interactive-text-image';

const helpPositionMap: Record<string, React.CSSProperties> = {
  left:   { top: 16, right: 16, bottom: 'auto', left: 'auto' },
  right:  { top: 16, left: 16, right: 'auto', bottom: 'auto' },
  top:    { bottom: 16, right: 16, top: 'auto', left: 'auto' },
  bottom: { top: 16, right: 16, bottom: 'auto', left: 'auto' },
};

type TooltipPosition = 'below-right' | 'below-left' | 'above-right' | 'above-left';
const helpTooltipPositionMap: Record<string, TooltipPosition> = {
  left:   'below-right',
  right:  'below-left',
  top:    'above-right',
  bottom: 'below-right',
};

function animationStyle(anim?: ElementAnimation): React.CSSProperties {
  if (!anim || anim.stagger != null) return {};
  const delay = anim.delay ?? 0;
  const duration = anim.duration ?? 0.6;
  return {
    opacity: 0,
    animation: `it-${anim.type} ${duration}s ${delay}s ease-out forwards`,
  };
}

export function InteractiveTextLayout({ data }: InteractiveTextLayoutProps) {
  const { completedIds, registerRequiredInteractions, markCompleted } = useSlideInteraction();
  const registered = useRef(false);

  const isCompleted = completedIds.includes(INTERACTION_ID);
  const [open, setOpen] = useState(isCompleted);

  const positionClass = `layout-interactive-text--${data.imagePosition}`;
  const isHorizontal = data.imagePosition === 'left' || data.imagePosition === 'right';
  const size = data.imageSize ?? 50;
  const align = data.contentAlign ?? 'middle';
  const hoverScale = data.hoverScale ?? 0.95;
  const helpText = data.helpTooltip ?? 'Pulsa sobre la imagen para descubrir su contenido';

  const hasStagger = data.textAnimation?.stagger != null;
  const textRef = useRef<HTMLDivElement>(null);

  const animType = data.textAnimation?.type;
  const animDelay = data.textAnimation?.delay;
  const animDuration = data.textAnimation?.duration;
  const animStagger = data.textAnimation?.stagger;

  // Always blocking — register 1 required interaction
  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    registerRequiredInteractions(1);
  }, [registerRequiredInteractions]);

  // Stagger animation for text
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

  const handleClick = useCallback(() => {
    if (open) return;
    if (!isCompleted) {
      markCompleted(INTERACTION_ID);
    }
    setOpen(true);
  }, [open, isCompleted, markCompleted]);

  const imageWrapperStyle: React.CSSProperties = {
    ...(isHorizontal ? { width: `${size}%` } : { height: `${size}%` }),
  };

  const alignX = data.overlayAlignX ?? 'left';
  const alignY = data.overlayAlignY ?? 'bottom';

  const overlayStyle: React.CSSProperties = {
    justifyContent: overlayAlignXMap[alignX],
    alignItems: overlayAlignYMap[alignY],
  };

  const overlayContentStyle: React.CSSProperties = {
    textAlign: alignX === 'center' ? 'center' : alignX === 'right' ? 'right' : 'left',
  };

  return (
    <div className={`layout-interactive-text ${positionClass}`}>
      <div className="layout-interactive-text__content" style={{ justifyContent: alignMap[align] }}>
        {(data.showInlineTitle ?? true) && (
          <h2
            className="layout-interactive-text__title"
            style={animationStyle(data.titleAnimation)}
          >
            {data.title}
          </h2>
        )}
        <div
          ref={textRef}
          className="layout-interactive-text__text"
          style={hasStagger ? undefined : animationStyle(data.textAnimation)}
          dangerouslySetInnerHTML={{ __html: sanitize(data.text) }}
        />
      </div>
      <div className="layout-interactive-text__image-wrapper" style={imageWrapperStyle}>
        <button
          className={`itext-image${open ? ' itext-image--open' : ''}`}
          style={{ '--hover-scale': hoverScale, ...animationStyle(data.imageAnimation) } as React.CSSProperties}
          onClick={handleClick}
          aria-expanded={open}
          type="button"
        >
          <img className="itext-image__img" src={data.image} alt={data.title} style={data.objectPosition ? { objectPosition: data.objectPosition } : undefined} />
          {open && (
            <div className="itext-image__overlay" style={overlayStyle}>
              <div
                className="itext-image__overlay-content"
                style={overlayContentStyle}
                dangerouslySetInnerHTML={{ __html: sanitize(data.overlayContent) }}
              />
            </div>
          )}
        </button>
      </div>
      {!open && (
        <HelpTooltip text={helpText} style={helpPositionMap[data.imagePosition]} tooltipPosition={helpTooltipPositionMap[data.imagePosition]} />
      )}
    </div>
  );
}
