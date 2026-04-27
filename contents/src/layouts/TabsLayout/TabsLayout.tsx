import { useCallback, useEffect, useRef, useState } from 'react';
import type { TabsSlideData, ElementAnimation } from '../../types';
import { useSlideInteraction } from '../../contexts/SlideInteractionContext';
import { sanitize } from '../../utils/sanitize';
import { HelpTooltip } from '../InteractiveImageLayout/HelpTooltip';

interface TabsLayoutProps {
  data: TabsSlideData;
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

export function TabsLayout({ data }: TabsLayoutProps) {
  const { completedIds, registerRequiredInteractions, markCompleted } = useSlideInteraction();
  const registered = useRef(false);

  const [activeId, setActiveId] = useState(data.items[0]?.id ?? '');
  const hasHeader = !!data.title || !!data.text;
  const align = data.contentAlign ?? 'start';
  const helpText = data.helpTooltip ?? 'Pulsa sobre cada pestaña para ver su contenido';

  const hasStagger = data.textAnimation?.stagger != null;
  const textRef = useRef<HTMLDivElement>(null);

  const animType = data.textAnimation?.type;
  const animDelay = data.textAnimation?.delay;
  const animDuration = data.textAnimation?.duration;
  const animStagger = data.textAnimation?.stagger;

  const allCompleted = data.blocking !== false && completedIds.length >= data.items.length;

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    if (data.blocking !== false) {
      registerRequiredInteractions(data.items.length);
    }
    // Mark first tab as completed on mount
    if (data.items[0] && !completedIds.includes(data.items[0].id)) {
      markCompleted(data.items[0].id);
    }
  }, [data.blocking, data.items, registerRequiredInteractions, completedIds, markCompleted]);

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
    if (!completedIds.includes(id)) {
      markCompleted(id);
    }
    setActiveId(id);
  }, [completedIds, markCompleted]);

  const activeItem = data.items.find((item) => item.id === activeId);

  return (
    <div className="layout-tabs">
      {hasHeader && (
        <div className="layout-tabs__header" style={{ alignItems: alignMap[align] }}>
          {data.title && (
            <h2 className="layout-tabs__title" style={animationStyle(data.titleAnimation)}>
              {data.title}
            </h2>
          )}
          {data.text && (
            <div
              ref={textRef}
              className="layout-tabs__text"
              style={hasStagger ? undefined : animationStyle(data.textAnimation)}
              dangerouslySetInnerHTML={{ __html: sanitize(data.text!) }}
            />
          )}
        </div>
      )}
      <div className="layout-tabs__tab-bar" role="tablist" aria-label={data.title ?? 'Pestañas de contenido'}>
        {data.items.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            className={`layout-tabs__tab${item.id === activeId ? ' layout-tabs__tab--active' : ''}`}
            onClick={() => handleClick(item.id)}
            role="tab"
            aria-selected={item.id === activeId}
            aria-controls={`tabpanel-${item.id}`}
            type="button"
          >
            {item.icon && (
              <span className="layout-tabs__tab-icon">
                <i className={item.icon} aria-hidden="true" />
              </span>
            )}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      {activeItem && (
        <div id={`tabpanel-${activeItem.id}`} className="layout-tabs__panel" role="tabpanel" aria-labelledby={`tab-${activeItem.id}`} key={activeItem.id}>
          {activeItem.title && <h3 className="layout-tabs__panel-title">{activeItem.title}</h3>}
          <div
            className="layout-tabs__panel-text"
            dangerouslySetInnerHTML={{ __html: sanitize(activeItem.text) }}
          />
        </div>
      )}
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
