import { useCallback, useMemo, useState } from 'react';
import { useScormProgress } from './hooks/useScormProgress';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Navigation } from './components/Navigation/Navigation';
import { SlideViewer } from './components/SlideViewer/SlideViewer';
import { SlideHeader } from './components/SlideHeader/SlideHeader';
import { SlideInteractionStateContext, SlideInteractionActionsContext } from './contexts/SlideInteractionContext';
import { ScaledSlideArea } from './components/ScaledSlideArea/ScaledSlideArea';
import type { CourseContent, InteractiveImageSlideData, PopupSlideData, IconTabsSlideData, CarouselSlideData, AccordionSlideData, TabsSlideData, ImageTextSlideData } from './types';

interface AppProps {
  content: CourseContent;
  initialSlide?: number;
}

function App({ content, initialSlide }: AppProps) {
  const { progress, ready, goToSlide, markInteractionComplete, toggleSidebar } = useScormProgress(content.slides.length, initialSlide);
  const [requiredCount, setRequiredCount] = useState(0);

  const requiredInteractionsMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const slide of content.slides) {
      let required = 0;
      if (slide.layout === 'interactive-text') {
        required = 1;
      } else if (slide.layout === 'interactive-image' && (slide.data as InteractiveImageSlideData).blocking !== false) {
        required = (slide.data as InteractiveImageSlideData).images.length;
      } else if (slide.layout === 'popup' && (slide.data as PopupSlideData).blocking !== false) {
        required = (slide.data as PopupSlideData).items.length;
      } else if (slide.layout === 'icon-tabs' && (slide.data as IconTabsSlideData).blocking !== false) {
        required = (slide.data as IconTabsSlideData).items.length;
      } else if (slide.layout === 'carousel' && (slide.data as CarouselSlideData).blocking !== false) {
        required = (slide.data as CarouselSlideData).items.length;
      } else if (slide.layout === 'accordion' && (slide.data as AccordionSlideData).blocking !== false) {
        required = (slide.data as AccordionSlideData).items.length;
      } else if (slide.layout === 'tabs' && (slide.data as TabsSlideData).blocking !== false) {
        required = (slide.data as TabsSlideData).items.length;
      } else if (slide.layout === 'image-text' && (slide.data as ImageTextSlideData).iconPopup) {
        required = 1;
      }
      if (required > 0) {
        map[slide.id] = required;
      }
    }
    return map;
  }, [content.slides]);

  const slideIndexMap = useMemo(
    () => new Map(content.slides.map((s, i) => [s.id, i])),
    [content.slides]
  );

  const currentSlideIndex = slideIndexMap.get(progress.currentSlide) ?? -1;
  const currentSlideData = currentSlideIndex >= 0 ? content.slides[currentSlideIndex] : undefined;

  const completedIds = useMemo(
    () => progress.completedInteractions[progress.currentSlide] ?? [],
    [progress.completedInteractions, progress.currentSlide]
  );

  const isBlocking =
    (currentSlideData?.layout === 'interactive-text')
    || (currentSlideData?.layout === 'interactive-image'
      && (currentSlideData.data as InteractiveImageSlideData).blocking !== false)
    || (currentSlideData?.layout === 'popup'
      && (currentSlideData.data as PopupSlideData).blocking !== false)
    || (currentSlideData?.layout === 'icon-tabs'
      && (currentSlideData.data as IconTabsSlideData).blocking !== false)
    || (currentSlideData?.layout === 'carousel'
      && (currentSlideData.data as CarouselSlideData).blocking !== false)
    || (currentSlideData?.layout === 'accordion'
      && (currentSlideData.data as AccordionSlideData).blocking !== false)
    || (currentSlideData?.layout === 'tabs'
      && (currentSlideData.data as TabsSlideData).blocking !== false)
    || (currentSlideData?.layout === 'image-text'
      && !!(currentSlideData.data as ImageTextSlideData).iconPopup);

  const isNextBlocked = isBlocking && completedIds.length < requiredCount;

  const interactionActionsCtx = useMemo(() => ({
    registerRequiredInteractions: (count: number) => setRequiredCount(count),
    markCompleted: (interactionId: string) => {
      markInteractionComplete(progress.currentSlide, interactionId);
    },
  }), [markInteractionComplete, progress.currentSlide]);

  const interactionStateCtx = useMemo(() => ({
    completedIds,
    requiredCount,
  }), [completedIds, requiredCount]);

  const completedSlides = useMemo(() => {
    return progress.visitedSlides.filter((slideId) => {
      const required = requiredInteractionsMap[slideId];
      if (!required) return true;
      const completed = progress.completedInteractions[slideId]?.length ?? 0;
      return completed >= required;
    });
  }, [progress.visitedSlides, progress.completedInteractions]);

  const slideLabel = useMemo(() => {
    const entry = content.index.find((e) => e.slideId === progress.currentSlide);
    return entry?.title ?? `Diapositiva ${currentSlideIndex + 1}`;
  }, [progress.currentSlide, currentSlideIndex]);

  const handlePrevious = useCallback(() => {
    if (currentSlideIndex > 0) {
      goToSlide(content.slides[currentSlideIndex - 1].id);
    }
  }, [currentSlideIndex, goToSlide, content.slides]);

  const handleNext = useCallback(() => {
    if (currentSlideIndex < content.slides.length - 1) {
      goToSlide(content.slides[currentSlideIndex + 1].id);
    }
  }, [currentSlideIndex, goToSlide, content.slides]);

  if (!ready) {
    return <div className="app__loading" role="status" aria-live="polite">Cargando curso...</div>;
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <Sidebar
        index={content.index}
        currentSlide={progress.currentSlide}
        visitedSlides={completedSlides}
        lockIndex={content.config.lockIndex}
        collapsed={progress.sidebarCollapsed}
        onToggle={toggleSidebar}
        onNavigate={(slideId) => {
          goToSlide(slideId);
          if (window.matchMedia('(max-width: 768px)').matches) {
            toggleSidebar();
          }
        }}
      />
      <main className="app__main" id="main-content">
        {currentSlideData && (
          <SlideHeader
            title={slideLabel}
            showTitle={currentSlideData.showTitle ?? false}
            showPagination={currentSlideData.showPagination ?? false}
            currentSlide={currentSlideIndex}
            totalSlides={content.slides.length}
          />
        )}
        <SlideInteractionActionsContext.Provider value={interactionActionsCtx}>
          <SlideInteractionStateContext.Provider value={interactionStateCtx}>
            <div className="app__slide-area" aria-live="polite">
              <span className="sr-only">{slideLabel}</span>
              <ScaledSlideArea>
                {currentSlideData ? (
                  <SlideViewer key={currentSlideData.id} slide={currentSlideData} onNext={handleNext} />
                ) : (
                  <div className="app__loading" role="alert">Diapositiva no encontrada</div>
                )}
              </ScaledSlideArea>
            </div>
            <Navigation
              currentSlide={currentSlideIndex}
              totalSlides={content.slides.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              isNextBlocked={isNextBlocked}
            />
          </SlideInteractionStateContext.Provider>
        </SlideInteractionActionsContext.Provider>
      </main>
    </div>
  );
}

export default App;
