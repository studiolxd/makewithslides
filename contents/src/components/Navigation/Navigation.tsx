interface NavigationProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  isNextBlocked?: boolean;
}

export function Navigation({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  isNextBlocked = false,
}: NavigationProps) {
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === totalSlides - 1;

  return (
    <nav className="navigation" aria-label="Navegación de diapositivas">
      <div className="navigation__buttons">
        <button
          className="navigation__btn"
          onClick={onPrevious}
          disabled={isFirst}
          aria-label={isFirst ? 'Primera diapositiva' : `Diapositiva anterior (${currentSlide} de ${totalSlides})`}
        >
          <i className="fi fi-tr-angle-left" aria-hidden="true" />
        </button>

        <button
          className="navigation__btn"
          onClick={onNext}
          disabled={isLast || isNextBlocked}
          aria-label={
            isNextBlocked
              ? 'Diapositiva siguiente — bloqueada: completa las interacciones para continuar'
              : isLast
                ? 'Última diapositiva'
                : `Diapositiva siguiente (${currentSlide + 2} de ${totalSlides})`
          }
        >
          <i className="fi fi-tr-angle-right" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
