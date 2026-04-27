import type { SectionCoverSlideData } from '../../types';

interface SectionCoverLayoutProps {
  data: SectionCoverSlideData;
}

export function SectionCoverLayout({ data }: SectionCoverLayoutProps) {
  const fadeDelay = data.imageFadeDelay ?? 0;
  const fadeDuration = data.imageFadeDuration ?? 1;
  const position = data.imagePosition ?? 'left';

  return (
    <div className={`layout-section-cover layout-section-cover--${position}`}>
      <div
        className="layout-section-cover__image-wrapper"
        style={{
          animationDelay: `${fadeDelay}s`,
          animationDuration: `${fadeDuration}s`,
        }}
      >
        <img
          className="layout-section-cover__image"
          src={data.image}
          alt={data.sectionTitle}
          style={data.imageFocus ? { objectPosition: data.imageFocus } : undefined}
        />
      </div>
      <div className="layout-section-cover__content">
        <h1 className="layout-section-cover__title">{data.sectionTitle}</h1>
        <span className="layout-section-cover__line" />
        {data.subtitle && (
          <p className="layout-section-cover__subtitle" dangerouslySetInnerHTML={{ __html: data.subtitle }} />
        )}
      </div>
    </div>
  );
}
