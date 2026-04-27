import { useEffect, useRef } from 'react';
import type { ElementAnimation, InteractiveImageSlideData } from '../../types';
import { useSlideInteraction } from '../../contexts/SlideInteractionContext';
import { sanitize } from '../../utils/sanitize';
import { InteractiveImageCard } from './InteractiveImageCard';
import { HelpTooltip } from './HelpTooltip';

interface InteractiveImageLayoutProps {
  data: InteractiveImageSlideData;
}

const alignMap = { start: 'flex-start', middle: 'center', end: 'flex-end' } as const;

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

export function InteractiveImageLayout({ data }: InteractiveImageLayoutProps) {
  const { completedIds, registerRequiredInteractions, markCompleted } = useSlideInteraction();
  const registered = useRef(false);

  const positionClass = `layout-interactive-image--${data.imagePosition}`;
  const titlePosClass = data.titlePosition ? `layout-interactive-image--title-${data.titlePosition}` : '';
  const isHorizontal = data.imagePosition === 'left' || data.imagePosition === 'right';
  const size = data.imageSize ?? 50;
  const align = data.contentAlign ?? 'middle';
  const helpText = data.helpTooltip ?? 'Pulsa sobre cada imagen para ver su contenido';

  const hasStagger = data.textAnimation?.stagger != null;
  const textRef = useRef<HTMLDivElement>(null);

  const animType = data.textAnimation?.type;
  const animDelay = data.textAnimation?.delay;
  const animDuration = data.textAnimation?.duration;
  const animStagger = data.textAnimation?.stagger;

  // Register required interactions on mount
  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    if (data.blocking !== false) {
      registerRequiredInteractions(data.images.length);
    }
  }, [data.blocking, data.images.length, registerRequiredInteractions]);

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

  const imagesWrapperStyle: React.CSSProperties = {
    ...(isHorizontal ? { width: `${size}%` } : { height: `${size}%` }),
  };

  return (
    <div className={`layout-interactive-image ${positionClass} ${titlePosClass}`.trim()}>
      <div className="layout-interactive-image__content" style={{ justifyContent: alignMap[align] }}>
        {(data.showInlineTitle ?? true) && (
          <h2
            className="layout-interactive-image__title"
            style={animationStyle(data.titleAnimation)}
          >
            {data.title}
          </h2>
        )}
        <div
          ref={textRef}
          className="layout-interactive-image__text"
          style={hasStagger ? undefined : animationStyle(data.textAnimation)}
          dangerouslySetInnerHTML={{ __html: sanitize(data.text) }}
        />
      </div>
      <div className="layout-interactive-image__images-wrapper" style={imagesWrapperStyle}>
        <div className="layout-interactive-image__images">
          {data.images.map((item) => (
            <InteractiveImageCard
              key={item.id}
              item={item}
              blocking={data.blocking !== false}
              isCompleted={completedIds.includes(item.id)}
              onComplete={markCompleted}
            />
          ))}
        </div>
      </div>
      {data.blocking !== false && completedIds.length < data.images.length && (
        <HelpTooltip text={helpText} style={helpPositionMap[data.imagePosition]} tooltipPosition={helpTooltipPositionMap[data.imagePosition]} />
      )}
    </div>
  );
}
