import { z } from 'zod';

// === Primitive / utility schemas ===

export const imagePositionSchema = z.enum(['top', 'bottom', 'left', 'right']);
export const contentAlignSchema = z.enum(['start', 'middle', 'end']);
export const animationTypeSchema = z.enum(['fadeIn', 'slideUp', 'slideDown', 'slideLeft', 'slideRight']);
export const overlayAlignXSchema = z.enum(['left', 'center', 'right']);
export const overlayAlignYSchema = z.enum(['top', 'center', 'bottom']);

export const elementAnimationSchema = z.object({
  type: animationTypeSchema,
  delay: z.number().optional(),
  duration: z.number().optional(),
  stagger: z.number().optional(),
});

export const iconPopupSchema = z.object({
  icon: z.string().min(1),
  popupTitle: z.string().optional(),
  popupContent: z.string().min(1),
  helpTooltip: z.string().optional(),
});

// === Per-layout data schemas ===

export const coverSlideDataSchema = z.object({
  unitTitle: z.string().min(1),
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional(),
});

export const sectionCoverSlideDataSchema = z.object({
  sectionTitle: z.string().min(1),
  subtitle: z.string().optional(),
  image: z.string().min(1),
  imagePosition: z.enum(['left', 'right']).optional(),
  imageFocus: z.string().optional(),
  imageFadeDelay: z.number().optional(),
  imageFadeDuration: z.number().optional(),
});

export const imageTextSlideDataSchema = z.object({
  imagePosition: imagePositionSchema,
  image: z.string().optional(),
  imageSize: z.number().optional(),
  objectPosition: z.string().optional(),
  contentAlign: contentAlignSchema.optional(),
  showInlineTitle: z.boolean().optional(),
  imageAnimation: elementAnimationSchema.optional(),
  titleAnimation: elementAnimationSchema.optional(),
  textAnimation: elementAnimationSchema.optional(),
  title: z.string(),
  text: z.string(),
  iconPopup: iconPopupSchema.optional(),
});

export const interactiveTextSlideDataSchema = z.object({
  imagePosition: imagePositionSchema,
  image: z.string().min(1),
  imageSize: z.number().optional(),
  objectPosition: z.string().optional(),
  contentAlign: contentAlignSchema.optional(),
  showInlineTitle: z.boolean().optional(),
  imageAnimation: elementAnimationSchema.optional(),
  titleAnimation: elementAnimationSchema.optional(),
  textAnimation: elementAnimationSchema.optional(),
  title: z.string(),
  text: z.string(),
  overlayContent: z.string().min(1),
  overlayAlignX: overlayAlignXSchema.optional(),
  overlayAlignY: overlayAlignYSchema.optional(),
  hoverScale: z.number().optional(),
  helpTooltip: z.string().optional(),
});

export const interactiveImageItemSchema = z.object({
  id: z.string().min(1),
  image: z.string().min(1),
  title: z.string().optional(),
  titleTheme: z.enum(['dark', 'light']).optional(),
  overlayContent: z.string().min(1),
  hoverScale: z.number().optional(),
  imageAnimation: elementAnimationSchema.optional(),
});

export const interactiveImageSlideDataSchema = z.object({
  imagePosition: imagePositionSchema,
  imageSize: z.number().optional(),
  contentAlign: contentAlignSchema.optional(),
  showInlineTitle: z.boolean().optional(),
  titleAnimation: elementAnimationSchema.optional(),
  textAnimation: elementAnimationSchema.optional(),
  title: z.string(),
  text: z.string(),
  images: z.array(interactiveImageItemSchema).min(1),
  blocking: z.boolean().optional(),
  helpTooltip: z.string().optional(),
  titlePosition: z.enum(['top', 'bottom']).optional(),
});

export const popupItemSchema = z.object({
  id: z.string().min(1),
  image: z.string().min(1),
  title: z.string().optional(),
  titleTheme: z.enum(['dark', 'light']).optional(),
  popupTitle: z.string().optional(),
  popupContent: z.string().min(1),
  hoverScale: z.number().optional(),
  imageAnimation: elementAnimationSchema.optional(),
});

export const popupSlideDataSchema = z.object({
  imagePosition: imagePositionSchema,
  imageSize: z.number().optional(),
  contentAlign: contentAlignSchema.optional(),
  showInlineTitle: z.boolean().optional(),
  titleAnimation: elementAnimationSchema.optional(),
  textAnimation: elementAnimationSchema.optional(),
  title: z.string(),
  text: z.string(),
  items: z.array(popupItemSchema).min(1),
  blocking: z.boolean().optional(),
  helpTooltip: z.string().optional(),
});

export const carouselItemSchema = z.object({
  image: z.string().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
});

export const carouselSlideDataSchema = z.object({
  imagePosition: imagePositionSchema,
  imageSize: z.number().optional(),
  contentAlign: contentAlignSchema.optional(),
  showInlineTitle: z.boolean().optional(),
  titleAnimation: elementAnimationSchema.optional(),
  textAnimation: elementAnimationSchema.optional(),
  title: z.string().optional(),
  text: z.string().optional(),
  items: z.array(carouselItemSchema).min(1),
  itemsAlignX: z.enum(['left', 'center', 'right']).optional(),
  itemsAlignY: z.enum(['start', 'middle', 'end']).optional(),
  autoPlay: z.boolean().optional(),
  autoPlayInterval: z.number().optional(),
  blocking: z.boolean().optional(),
  bordered: z.boolean().optional(),
  numbered: z.boolean().optional(),
  backgroundImage: z.string().optional(),
  helpTooltip: z.string().optional(),
});

export const iconTabItemSchema = z.object({
  id: z.string().min(1),
  icon: z.string().optional(),
  image: z.string().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
});

export const iconTabsSlideDataSchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  titleAnimation: elementAnimationSchema.optional(),
  textAnimation: elementAnimationSchema.optional(),
  contentAlign: contentAlignSchema.optional(),
  iconDirection: z.enum(['horizontal', 'vertical']),
  iconStyle: z.enum(['filled', 'outlined']).optional(),
  iconJustify: z.enum(['center', 'space-around', 'space-between', 'space-evenly', 'flex-start', 'flex-end']).optional(),
  inline: z.boolean().optional(),
  closable: z.boolean().optional(),
  exclusive: z.boolean().optional(),
  blocking: z.boolean().optional(),
  helpTooltip: z.string().optional(),
  completedContent: z.string().optional(),
  completedContentDelay: z.number().optional(),
  items: z.array(iconTabItemSchema).min(1),
});

export const accordionItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().optional(),
  text: z.string().min(1),
});

export const accordionSlideDataSchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  titleAnimation: elementAnimationSchema.optional(),
  textAnimation: elementAnimationSchema.optional(),
  contentAlign: contentAlignSchema.optional(),
  closable: z.boolean().optional(),
  exclusive: z.boolean().optional(),
  blocking: z.boolean().optional(),
  helpTooltip: z.string().optional(),
  items: z.array(accordionItemSchema).min(1),
});

export const tabItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().optional(),
  title: z.string().optional(),
  text: z.string().min(1),
});

export const tabsSlideDataSchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  titleAnimation: elementAnimationSchema.optional(),
  textAnimation: elementAnimationSchema.optional(),
  contentAlign: contentAlignSchema.optional(),
  helpTooltip: z.string().optional(),
  blocking: z.boolean().optional(),
  items: z.array(tabItemSchema).min(1),
});

export const closingSlideDataSchema = z.object({
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional(),
});

// === Slide: fields shared by all layouts ===

const slideBaseSchema = z.object({
  id: z.number(),
  showTitle: z.boolean().optional(),
  showPagination: z.boolean().optional(),
});

// === Discriminated union: layout + data validated together ===
// This ensures carousel slides have items[], accordion slides have items[], etc.

export const slideSchema = z.discriminatedUnion('layout', [
  slideBaseSchema.extend({ layout: z.literal('cover'),              data: coverSlideDataSchema }),
  slideBaseSchema.extend({ layout: z.literal('section-cover'),      data: sectionCoverSlideDataSchema }),
  slideBaseSchema.extend({ layout: z.literal('image-text'),         data: imageTextSlideDataSchema }),
  slideBaseSchema.extend({ layout: z.literal('interactive-text'),   data: interactiveTextSlideDataSchema }),
  slideBaseSchema.extend({ layout: z.literal('interactive-image'),  data: interactiveImageSlideDataSchema }),
  slideBaseSchema.extend({ layout: z.literal('popup'),              data: popupSlideDataSchema }),
  slideBaseSchema.extend({ layout: z.literal('carousel'),           data: carouselSlideDataSchema }),
  slideBaseSchema.extend({ layout: z.literal('icon-tabs'),          data: iconTabsSlideDataSchema }),
  slideBaseSchema.extend({ layout: z.literal('accordion'),          data: accordionSlideDataSchema }),
  slideBaseSchema.extend({ layout: z.literal('tabs'),               data: tabsSlideDataSchema }),
  slideBaseSchema.extend({ layout: z.literal('closing'),            data: closingSlideDataSchema }),
]);

// === Index entry ===

export const indexEntrySchema = z.object({
  title: z.string().min(1),
  numbered: z.boolean(),
  level: z.number().min(1),
  slideId: z.number().nullable(),
});

// === Course config ===

export const courseConfigSchema = z.object({
  lockIndex: z.boolean(),
  scormVersion: z.enum(['1.2', '2004']),
});

// === Course metadata (used for SCORM packaging) ===

export const courseMetaSchema = z.object({
  title: z.string().min(1),
  identifier: z.string().min(1).regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, puntos, guiones y guiones bajos'),
  description: z.string().optional(),
  masteryScore: z.number().min(0).max(100).optional(), // default 100
});

// === Root course content ===

export const courseContentSchema = z.object({
  meta: courseMetaSchema.optional(),
  config: courseConfigSchema,
  index: z.array(indexEntrySchema),
  slides: z.array(slideSchema).min(1),
});
