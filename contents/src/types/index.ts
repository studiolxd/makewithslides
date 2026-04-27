import { z } from 'zod';
import {
  imagePositionSchema,
  contentAlignSchema,
  animationTypeSchema,
  overlayAlignXSchema,
  overlayAlignYSchema,
  elementAnimationSchema,
  iconPopupSchema,
  coverSlideDataSchema,
  sectionCoverSlideDataSchema,
  imageTextSlideDataSchema,
  interactiveTextSlideDataSchema,
  interactiveImageItemSchema,
  interactiveImageSlideDataSchema,
  popupItemSchema,
  popupSlideDataSchema,
  carouselItemSchema,
  carouselSlideDataSchema,
  iconTabItemSchema,
  iconTabsSlideDataSchema,
  accordionItemSchema,
  accordionSlideDataSchema,
  tabItemSchema,
  tabsSlideDataSchema,
  closingSlideDataSchema,
  slideSchema,
  indexEntrySchema,
  courseConfigSchema,
  courseMetaSchema,
  courseContentSchema,
} from '../schemas/content.schema';

// === Utility types ===
export type ImagePosition  = z.infer<typeof imagePositionSchema>;
export type ContentAlign   = z.infer<typeof contentAlignSchema>;
export type AnimationType  = z.infer<typeof animationTypeSchema>;
export type OverlayAlignX  = z.infer<typeof overlayAlignXSchema>;
export type OverlayAlignY  = z.infer<typeof overlayAlignYSchema>;
export type ElementAnimation = z.infer<typeof elementAnimationSchema>;
export type IconPopup        = z.infer<typeof iconPopupSchema>;

// === Slide layout union (kept as literal for readability) ===
export type SlideLayout = 'cover' | 'section-cover' | 'image-text' | 'interactive-text' | 'interactive-image' | 'popup' | 'carousel' | 'icon-tabs' | 'accordion' | 'tabs' | 'closing';

// === Slide data types (derived from schemas — single source of truth) ===
export type CoverSlideData            = z.infer<typeof coverSlideDataSchema>;
export type SectionCoverSlideData     = z.infer<typeof sectionCoverSlideDataSchema>;
export type ImageTextSlideData        = z.infer<typeof imageTextSlideDataSchema>;
export type InteractiveTextSlideData  = z.infer<typeof interactiveTextSlideDataSchema>;
export type InteractiveImageItem      = z.infer<typeof interactiveImageItemSchema>;
export type InteractiveImageSlideData = z.infer<typeof interactiveImageSlideDataSchema>;
export type PopupItem                 = z.infer<typeof popupItemSchema>;
export type PopupSlideData            = z.infer<typeof popupSlideDataSchema>;
export type CarouselItem              = z.infer<typeof carouselItemSchema>;
export type CarouselSlideData         = z.infer<typeof carouselSlideDataSchema>;
export type IconTabItem               = z.infer<typeof iconTabItemSchema>;
export type IconTabsSlideData         = z.infer<typeof iconTabsSlideDataSchema>;
export type AccordionItem             = z.infer<typeof accordionItemSchema>;
export type AccordionSlideData        = z.infer<typeof accordionSlideDataSchema>;
export type TabItem                   = z.infer<typeof tabItemSchema>;
export type TabsSlideData             = z.infer<typeof tabsSlideDataSchema>;
export type ClosingSlideData          = z.infer<typeof closingSlideDataSchema>;

// === Slide data union ===
export type SlideData =
  | CoverSlideData
  | SectionCoverSlideData
  | ImageTextSlideData
  | InteractiveTextSlideData
  | InteractiveImageSlideData
  | PopupSlideData
  | CarouselSlideData
  | IconTabsSlideData
  | AccordionSlideData
  | TabsSlideData
  | ClosingSlideData;

// === Slide (discriminated union: layout narrows data automatically) ===
export type Slide = z.infer<typeof slideSchema>;

// === Index / config / meta / course ===
export type IndexEntry   = z.infer<typeof indexEntrySchema>;
export type CourseConfig = z.infer<typeof courseConfigSchema>;
export type CourseMeta   = z.infer<typeof courseMetaSchema>;
export type CourseContent = z.infer<typeof courseContentSchema>;

// === SCORM progress state (runtime only — not validated by schema) ===
export interface ScormProgress {
  currentSlide: number;
  visitedSlides: number[];
  completedInteractions: Record<number, string[]>;
  sidebarCollapsed: boolean;
}
