import { useCallback, useEffect, useRef, useState } from 'react';
import type { CarouselSlideData, ElementAnimation } from '../../types';
import { useSlideInteraction } from '../../contexts/SlideInteractionContext';
import { sanitize, isSafeUrl } from '../../utils/sanitize';
import { CarouselSlide } from './CarouselSlide';
import { HelpTooltip } from '../InteractiveImageLayout/HelpTooltip';

interface CarouselLayoutProps {
  data: CarouselSlideData;
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

export function CarouselLayout({ data }: CarouselLayoutProps) {
  const { registerRequiredInteractions, markCompleted } = useSlideInteraction();
  const registered = useRef(false);
  const markedRef = useRef(new Set<string>());
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const total = data.items.length;

  // Register required interactions on mount
  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    if (data.blocking !== false) {
      registerRequiredInteractions(total);
    }
  }, [data.blocking, total, registerRequiredInteractions]);

  // Mark slide as viewed when activeIndex changes
  useEffect(() => {
    if (data.blocking === false) return;
    const slideId = `carousel-${activeIndex}`;
    if (!markedRef.current.has(slideId)) {
      markedRef.current.add(slideId);
      markCompleted(slideId);
    }
  }, [activeIndex, data.blocking, markCompleted]);

  const allViewed = data.blocking !== false && markedRef.current.size >= total;

  const positionClass = `layout-carousel--${data.imagePosition}`;
  const isHorizontal = data.imagePosition === 'left' || data.imagePosition === 'right';
  const size = data.imageSize ?? 50;
  const align = data.contentAlign ?? 'middle';
  const hasContent = !!data.title || !!data.text;
  const helpText = data.helpTooltip ?? 'Pulsa las flechas para ver todas las diapositivas';

  const hasStagger = data.textAnimation?.stagger != null;
  const textRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i > 0 ? i - 1 : total - 1));
  }, [total]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i < total - 1 ? i + 1 : 0));
  }, [total]);

  // Auto-play
  useEffect(() => {
    if (!data.autoPlay) return;
    const interval = data.autoPlayInterval ?? 5000;
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i < total - 1 ? i + 1 : 0));
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [data.autoPlay, data.autoPlayInterval, total]);

  // Reset timer on manual navigation
  const handlePrev = useCallback(() => {
    clearInterval(timerRef.current);
    goPrev();
  }, [goPrev]);

  const handleNext = useCallback(() => {
    clearInterval(timerRef.current);
    goNext();
  }, [goNext]);

  const handleDot = useCallback((index: number) => {
    clearInterval(timerRef.current);
    goTo(index);
  }, [goTo]);

  const animType = data.textAnimation?.type;
  const animDelay = data.textAnimation?.delay;
  const animDuration = data.textAnimation?.duration;
  const animStagger = data.textAnimation?.stagger;

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

  const carouselStyle: React.CSSProperties = data.bordered
    ? {}
    : hasContent
      ? (isHorizontal ? { width: `${size}%` } : { height: `${size}%` })
      : {};

  if (isSafeUrl(data.backgroundImage) && !data.bordered) {
    carouselStyle.backgroundImage = `url(${data.backgroundImage})`;
  }

  const contentBgStyle: React.CSSProperties | undefined = data.bordered && isSafeUrl(data.backgroundImage)
    ? { backgroundImage: `url(${data.backgroundImage})`, backgroundSize: 'contain', backgroundPosition: 'bottom center', backgroundRepeat: 'no-repeat' }
    : undefined;

  const classNames = [
    'layout-carousel',
    positionClass,
    !hasContent && !data.bordered ? 'layout-carousel--full' : '',
    data.bordered ? 'layout-carousel--bordered' : '',
  ].filter(Boolean).join(' ');

  const carouselBlock = (
    <div className="layout-carousel__carousel" style={carouselStyle}>
      <div className="layout-carousel__viewport">
        <div
          className="layout-carousel__track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {data.items.map((item, i) => (
            <div className="layout-carousel__slide" key={i}>
              <CarouselSlide
                item={item}
                index={i}
                alignX={data.itemsAlignX}
                alignY={data.itemsAlignY}
                numbered={data.numbered}
              />
            </div>
          ))}
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            className="layout-carousel__arrow layout-carousel__arrow--prev"
            onClick={handlePrev}
            aria-label="Anterior"
            type="button"
          >
            <i className="fi fi-tr-angle-left" aria-hidden="true" />
          </button>
          <button
            className="layout-carousel__arrow layout-carousel__arrow--next"
            onClick={handleNext}
            aria-label="Siguiente"
            type="button"
          >
            <i className="fi fi-tr-angle-right" aria-hidden="true" />
          </button>
          <div className="layout-carousel__dots" role="tablist" aria-label="Slides del carrusel">
            {data.items.map((_, i) => (
              <button
                key={i}
                className={`layout-carousel__dot${i === activeIndex ? ' layout-carousel__dot--active' : ''}`}
                onClick={() => handleDot(i)}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`${data.items[i]?.title ?? `Diapositiva ${i + 1}`}${i === activeIndex ? ' — activa' : ''}`}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Bordered: carousel is inside the content area
  if (data.bordered) {
    return (
      <div className={classNames}>
        <div className="layout-carousel__content" style={contentBgStyle}>
          {data.title && (data.showInlineTitle ?? true) && (
            <h2
              className="layout-carousel__title"
              style={animationStyle(data.titleAnimation)}
            >
              {data.title}
            </h2>
          )}
          {data.text && (
            <div
              ref={textRef}
              className="layout-carousel__text"
              style={hasStagger ? undefined : animationStyle(data.textAnimation)}
              dangerouslySetInnerHTML={{ __html: sanitize(data.text!) }}
            />
          )}
          {carouselBlock}
          {data.blocking !== false && !allViewed && (
            <HelpTooltip text={helpText} style={helpPositionMap[data.imagePosition]} tooltipPosition={helpTooltipPositionMap[data.imagePosition]} />
          )}
        </div>
      </div>
    );
  }

  // Default: carousel and content as siblings
  return (
    <div className={classNames}>
      {hasContent && (
        <div className="layout-carousel__content" style={{ justifyContent: alignMap[align] }}>
          {data.title && (data.showInlineTitle ?? true) && (
            <h2
              className="layout-carousel__title"
              style={animationStyle(data.titleAnimation)}
            >
              {data.title}
            </h2>
          )}
          {data.text && (
            <div
              ref={textRef}
              className="layout-carousel__text"
              style={hasStagger ? undefined : animationStyle(data.textAnimation)}
              dangerouslySetInnerHTML={{ __html: sanitize(data.text!) }}
            />
          )}
        </div>
      )}
      {carouselBlock}
      {data.blocking !== false && !allViewed && (
        <HelpTooltip text={helpText} style={helpPositionMap[data.imagePosition]} tooltipPosition={helpTooltipPositionMap[data.imagePosition]} />
      )}
    </div>
  );
}
