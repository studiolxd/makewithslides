import type { CarouselItem } from '../../types';
import { sanitize } from '../../utils/sanitize';

interface CarouselSlideProps {
  item: CarouselItem;
  index: number;
  alignX?: 'left' | 'center' | 'right';
  alignY?: 'start' | 'middle' | 'end';
  numbered?: boolean;
}

const alignYMap = { start: 'flex-start', middle: 'center', end: 'flex-end' } as const;
const alignXMap = { left: 'flex-start', center: 'center', right: 'flex-end' } as const;

export function CarouselSlide({ item, index, alignX = 'left', alignY = 'middle', numbered }: CarouselSlideProps) {
  const hasImage = !!item.image;
  const hasText = !!item.title || !!item.text;

  const bodyStyle: React.CSSProperties = {
    justifyContent: alignYMap[alignY],
    alignItems: alignXMap[alignX],
    textAlign: alignX,
  };

  return (
    <div className={`carousel-slide${hasImage ? ' carousel-slide--has-image' : ''}`}>
      {numbered && (
        <span className="carousel-slide__number" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
      )}
      {hasImage && (
        <img className="carousel-slide__image" src={item.image} alt={item.title ?? `Imagen del slide ${index + 1}`} />
      )}
      {hasText && (
        <div className="carousel-slide__body" style={bodyStyle}>
          {item.title && <h3 className="carousel-slide__title">{item.title}</h3>}
          {item.text && (
            <div
              className="carousel-slide__text"
              dangerouslySetInnerHTML={{ __html: sanitize(item.text!) }}
            />
          )}
        </div>
      )}
    </div>
  );
}
