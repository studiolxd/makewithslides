interface SlideHeaderProps {
  title?: string;
  showTitle: boolean;
  showPagination: boolean;
  currentSlide: number;
  totalSlides: number;
}

export function SlideHeader({
  title,
  showTitle,
  showPagination,
  currentSlide,
  totalSlides,
}: SlideHeaderProps) {
  if (!showTitle && !showPagination) return null;

  return (
    <div className="slide-header">
      <div className="slide-header__title">
        {showTitle && title ? title : ''}
      </div>
      {showPagination && (
        <div className="slide-header__pagination">
          {currentSlide + 1} | {totalSlides}
        </div>
      )}
    </div>
  );
}
