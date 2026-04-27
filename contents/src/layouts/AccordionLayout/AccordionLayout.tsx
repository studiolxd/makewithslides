import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AccordionSlideData, ElementAnimation } from '../../types';
import { useSlideInteraction } from '../../contexts/SlideInteractionContext';
import { sanitize } from '../../utils/sanitize';
import { HelpTooltip } from '../InteractiveImageLayout/HelpTooltip';

interface AccordionLayoutProps {
  data: AccordionSlideData;
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

export function AccordionLayout({ data }: AccordionLayoutProps) {
  const { completedIds, registerRequiredInteractions, markCompleted } = useSlideInteraction();
  const registered = useRef(false);

  const [openIds, setOpenIds] = useState<string[]>(completedIds);
  const closable = data.closable ?? true;
  const exclusive = data.exclusive ?? true;
  const hasHeader = !!data.title || !!data.text;
  const align = data.contentAlign ?? 'start';
  const helpText = data.helpTooltip ?? 'Pulsa sobre cada elemento para desplegar su contenido';

  const hasStagger = data.textAnimation?.stagger != null;
  const textRef = useRef<HTMLDivElement>(null);

  const completedIdsSet = useMemo(() => new Set(completedIds), [completedIds]);
  const openIdsSet = useMemo(() => new Set(openIds), [openIds]);

  const allCompleted = data.blocking !== false && completedIds.length >= data.items.length;

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    if (data.blocking !== false) {
      registerRequiredInteractions(data.items.length);
    }
  }, [data.blocking, data.items.length, registerRequiredInteractions]);

  const animType = data.textAnimation?.type;
  const animDelay = data.textAnimation?.delay;
  const animDuration = data.textAnimation?.duration;
  const animStagger = data.textAnimation?.stagger;

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

  const handleClick = useCallback((id: string) => {
    if (!completedIdsSet.has(id)) {
      markCompleted(id);
    }

    setOpenIds((prev) => {
      const isOpen = prev.includes(id);
      if (isOpen && closable) return prev.filter((x) => x !== id);
      if (isOpen && !closable) return prev;
      if (exclusive) return [id];
      return [...prev, id];
    });
  }, [closable, exclusive, completedIdsSet, markCompleted]);

  return (
    <div className="layout-accordion">
      {hasHeader && (
        <div className="layout-accordion__header" style={{ alignItems: alignMap[align] }}>
          {data.title && (
            <h2 className="layout-accordion__title" style={animationStyle(data.titleAnimation)}>
              {data.title}
            </h2>
          )}
          {data.text && (
            <div
              ref={textRef}
              className="layout-accordion__text"
              style={hasStagger ? undefined : animationStyle(data.textAnimation)}
              dangerouslySetInnerHTML={{ __html: sanitize(data.text!) }}
            />
          )}
        </div>
      )}
      <div className="layout-accordion__body">
        {data.items.map((item) => {
          const isOpen = openIdsSet.has(item.id);
          return (
            <div className={`layout-accordion__item${isOpen ? ' layout-accordion__item--open' : ''}`} key={item.id}>
              <button
                className={`layout-accordion__item-header${isOpen ? ' layout-accordion__item-header--open' : ''}`}
                onClick={() => handleClick(item.id)}
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${item.id}`}
                type="button"
              >
                {item.icon && (
                  <span className="layout-accordion__item-icon">
                    <i className={item.icon} aria-hidden="true" />
                  </span>
                )}
                <span className="layout-accordion__item-title">{item.title}</span>
                <span className="layout-accordion__chevron" aria-hidden="true">
                  <i className="fi fi-rr-angle-down" />
                </span>
              </button>
              <div id={`accordion-panel-${item.id}`} className="layout-accordion__item-content" role="region" aria-hidden={!isOpen} style={{ maxHeight: isOpen ? '1000px' : '0' }}>
                <div className="layout-accordion__item-body">
                  <div
                    className="layout-accordion__item-text"
                    dangerouslySetInnerHTML={{ __html: sanitize(item.text) }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {data.blocking !== false && !allCompleted && (
        <HelpTooltip
          text={helpText}
          style={{ top: 16, right: 16, bottom: 'auto', left: 'auto' }}
          tooltipPosition="below-right"
        />
      )}
    </div>
  );
}
