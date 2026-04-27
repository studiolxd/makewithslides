import type { Slide } from '../../types';
import { CoverLayout } from '../../layouts/CoverLayout/CoverLayout';
import { SectionCoverLayout } from '../../layouts/SectionCoverLayout/SectionCoverLayout';
import { ImageTextLayout } from '../../layouts/ImageTextLayout/ImageTextLayout';
import { InteractiveTextLayout } from '../../layouts/InteractiveTextLayout/InteractiveTextLayout';
import { InteractiveImageLayout } from '../../layouts/InteractiveImageLayout/InteractiveImageLayout';
import { PopupLayout } from '../../layouts/PopupLayout/PopupLayout';
import { CarouselLayout } from '../../layouts/CarouselLayout/CarouselLayout';
import { IconTabsLayout } from '../../layouts/IconTabsLayout/IconTabsLayout';
import { AccordionLayout } from '../../layouts/AccordionLayout/AccordionLayout';
import { TabsLayout } from '../../layouts/TabsLayout/TabsLayout';
import { ClosingLayout } from '../../layouts/ClosingLayout/ClosingLayout';
import type { CoverSlideData, SectionCoverSlideData, ImageTextSlideData, InteractiveTextSlideData, InteractiveImageSlideData, PopupSlideData, CarouselSlideData, IconTabsSlideData, AccordionSlideData, TabsSlideData, ClosingSlideData } from '../../types';

interface SlideViewerProps {
  slide: Slide;
  onNext?: () => void;
}

export function SlideViewer({ slide, onNext }: SlideViewerProps) {
  switch (slide.layout) {
    case 'cover':
      return <CoverLayout data={slide.data as CoverSlideData} onNext={onNext} />;
    case 'section-cover':
      return <SectionCoverLayout data={slide.data as SectionCoverSlideData} />;
    case 'image-text':
      return <ImageTextLayout data={slide.data as ImageTextSlideData} />;
    case 'interactive-text':
      return <InteractiveTextLayout data={slide.data as InteractiveTextSlideData} />;
    case 'interactive-image':
      return <InteractiveImageLayout data={slide.data as InteractiveImageSlideData} />;
    case 'popup':
      return <PopupLayout data={slide.data as PopupSlideData} />;
    case 'carousel':
      return <CarouselLayout data={slide.data as CarouselSlideData} />;
    case 'icon-tabs':
      return <IconTabsLayout data={slide.data as IconTabsSlideData} />;
    case 'accordion':
      return <AccordionLayout data={slide.data as AccordionSlideData} />;
    case 'tabs':
      return <TabsLayout data={slide.data as TabsSlideData} />;
    case 'closing':
      return <ClosingLayout data={slide.data as ClosingSlideData} />;
    default:
      return <div className="slide-viewer__error">Layout desconocido</div>;
  }
}
