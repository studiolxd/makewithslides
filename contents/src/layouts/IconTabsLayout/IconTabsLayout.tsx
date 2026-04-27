import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ElementAnimation, IconTabsSlideData } from '../../types';
import { useSlideInteraction } from '../../contexts/SlideInteractionContext';
import { sanitize } from '../../utils/sanitize';
import { IconTabButton } from './IconTabButton';
import { HelpTooltip } from '../InteractiveImageLayout/HelpTooltip';

interface IconTabsLayoutProps {
  data: IconTabsSlideData;
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

export function IconTabsLayout({ data }: IconTabsLayoutProps) {
  const { completedIds, registerRequiredInteractions, markCompleted } = useSlideInteraction();
  const registered = useRef(false);

  const [openIds, setOpenIds] = useState<string[]>(completedIds);
  const closable = data.closable ?? true;
  const exclusive = data.exclusive ?? true;
  const inline = data.inline ?? false;
  const filled = (data.iconStyle ?? 'outlined') === 'filled';
  const hasHeader = !!data.title || !!data.text;
  const align = data.contentAlign ?? 'start';

  const helpText = data.helpTooltip ?? 'Pulsa sobre cada icono para ver su contenido';
  const hasCompletedContent = data.blocking !== false && !!data.completedContent;
  const allCompleted = data.blocking !== false && completedIds.length >= data.items.length;

  const completedIdsSet = useMemo(() => new Set(completedIds), [completedIds]);
  const openIdsSet = useMemo(() => new Set(openIds), [openIds]);

  const completedDelay = data.completedContentDelay ?? 0;
  const [showCompleted, setShowCompleted] = useState(completedDelay === 0);

  const hasStagger = data.textAnimation?.stagger != null;
  const textRef = useRef<HTMLDivElement>(null);

  // Register required interactions on mount
  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    if (data.blocking !== false) {
      registerRequiredInteractions(data.items.length + (hasCompletedContent ? 1 : 0));
    }
  }, [data.blocking, data.items.length, hasCompletedContent, registerRequiredInteractions]);

  const COMPLETED_INTERACTION_ID = '__completed__';
  const handleCompletedAnimationEnd = useCallback(() => {
    if (!completedIdsSet.has(COMPLETED_INTERACTION_ID)) {
      markCompleted(COMPLETED_INTERACTION_ID);
    }
  }, [completedIdsSet, markCompleted]);

  // Delayed completed content reveal
  useEffect(() => {
    if (!allCompleted || completedDelay === 0) {
      if (allCompleted) setShowCompleted(true);
      return;
    }
    const timer = setTimeout(() => setShowCompleted(true), completedDelay * 1000);
    return () => clearTimeout(timer);
  }, [allCompleted, completedDelay]);

  const animType = data.textAnimation?.type;
  const animDelay = data.textAnimation?.delay;
  const animDuration = data.textAnimation?.duration;
  const animStagger = data.textAnimation?.stagger;

  // Stagger animation for header text
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

      if (isOpen && closable) {
        return prev.filter((x) => x !== id);
      }
      if (isOpen && !closable) {
        return prev;
      }
      if (exclusive) {
        return [id];
      }
      return [...prev, id];
    });
  }, [closable, exclusive, completedIdsSet, markCompleted]);

  const openItems = data.items.filter((item) => openIdsSet.has(item.id));

  // In exclusive mode, only show the first open item in the reveal panel
  const revealItems = exclusive ? openItems.slice(0, 1) : openItems;

  function renderReveal(items: typeof revealItems) {
    if (items.length === 0) return null;
    return items.map((item) => (
      <div className="layout-icon-tabs__reveal" key={item.id}>
        {item.title && <h3 className="layout-icon-tabs__reveal-title">{item.title}</h3>}
        {item.text && (
          <div
            className="layout-icon-tabs__reveal-text"
            dangerouslySetInnerHTML={{ __html: sanitize(item.text!) }}
          />
        )}
      </div>
    ));
  }

  // Inline mode: each item is a row [icon | content]
  if (inline) {
    return (
      <div className="layout-icon-tabs">
        {hasHeader && (
          <div className="layout-icon-tabs__header" style={{ alignItems: alignMap[align] }}>
            {data.title && (
              <h2 className="layout-icon-tabs__title" style={animationStyle(data.titleAnimation)}>
                {data.title}
              </h2>
            )}
            {data.text && (
              <div
                ref={textRef}
                className="layout-icon-tabs__text"
                style={hasStagger ? undefined : animationStyle(data.textAnimation)}
                dangerouslySetInnerHTML={{ __html: sanitize(data.text!) }}
              />
            )}
          </div>
        )}
        <div className="layout-icon-tabs__body layout-icon-tabs__body--inline" style={data.iconJustify ? { justifyContent: data.iconJustify } : undefined}>
          {data.items.map((item) => {
            const isOpen = openIdsSet.has(item.id);
            return (
              <div className={`layout-icon-tabs__inline-item${isOpen ? ' layout-icon-tabs__inline-item--open' : ''}`} key={item.id}>
                <IconTabButton
                  item={item}
                  isActive={isOpen}
                  isCompleted={completedIdsSet.has(item.id)}
                  filled={filled}
                  onClick={handleClick}
                />
                {isOpen && (item.title || item.text) && (
                  <div className="layout-icon-tabs__inline-reveal">
                    {item.title && <h3 className="layout-icon-tabs__reveal-title">{item.title}</h3>}
                    {item.text && (
                      <div
                        className="layout-icon-tabs__reveal-text"
                        dangerouslySetInnerHTML={{ __html: sanitize(item.text!) }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {data.blocking !== false && !allCompleted && (
          <HelpTooltip text={helpText} />
        )}
        {allCompleted && showCompleted && data.completedContent && (
          <div
            className="layout-icon-tabs__completed"
            onAnimationEnd={handleCompletedAnimationEnd}
            dangerouslySetInnerHTML={{ __html: sanitize(data.completedContent ?? '') }}
          />
        )}
      </div>
    );
  }

  // Standard mode: separate icons bar + reveal panel
  const isVertical = data.iconDirection === 'vertical';

  return (
    <div className="layout-icon-tabs">
      {hasHeader && (
        <div className="layout-icon-tabs__header" style={{ alignItems: alignMap[align] }}>
          {data.title && (
            <h2 className="layout-icon-tabs__title" style={animationStyle(data.titleAnimation)}>
              {data.title}
            </h2>
          )}
          {data.text && (
            <div
              ref={textRef}
              className="layout-icon-tabs__text"
              style={hasStagger ? undefined : animationStyle(data.textAnimation)}
              dangerouslySetInnerHTML={{ __html: sanitize(data.text!) }}
            />
          )}
        </div>
      )}
      <div className={`layout-icon-tabs__body layout-icon-tabs__body--${data.iconDirection}`}>
        <div className="layout-icon-tabs__icons" style={data.iconJustify ? { justifyContent: data.iconJustify } : undefined}>
          {data.items.map((item) => (
            <IconTabButton
              key={item.id}
              item={item}
              isActive={openIdsSet.has(item.id)}
              isCompleted={completedIdsSet.has(item.id)}
              filled={filled}
              onClick={handleClick}
            />
          ))}
        </div>
        {isVertical && revealItems.length > 0 && (
          <div className="layout-icon-tabs__reveal-panel">
            {renderReveal(revealItems)}
          </div>
        )}
        {!isVertical && revealItems.length > 0 && (
          <div className={`layout-icon-tabs__reveal-panel${revealItems.length > 1 ? ' layout-icon-tabs__reveal-panel--list' : ''}`}>
            {renderReveal(revealItems)}
          </div>
        )}
      </div>
      {data.blocking !== false && !allCompleted && (
        <HelpTooltip text={helpText} />
      )}
      {allCompleted && showCompleted && data.completedContent && (
        <div
          className="layout-icon-tabs__completed"
          onAnimationEnd={handleCompletedAnimationEnd}
          dangerouslySetInnerHTML={{ __html: data.completedContent }}
        />
      )}
    </div>
  );
}
