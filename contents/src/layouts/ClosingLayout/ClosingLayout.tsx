import type { ClosingSlideData } from '../../types';
import { isSafeUrl } from '../../utils/sanitize';

interface ClosingLayoutProps {
  data: ClosingSlideData;
}

export function ClosingLayout({ data }: ClosingLayoutProps) {
  return (
    <div
      className="layout-closing"
      style={isSafeUrl(data.backgroundImage) ? { backgroundImage: `url(${data.backgroundImage})` } : undefined}
    >
      {isSafeUrl(data.backgroundVideo) && (
        <video
          className="layout-closing__video"
          src={data.backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      )}
      <div className="layout-closing__box">
        <div className="layout-closing__box-top">
          <h2 className="layout-closing__box-title">¡Enhorabuena!</h2>
          <span className="layout-closing__box-line" />
        </div>
        <div className="layout-closing__box-bottom">
          <img className="layout-closing__box-icon" src="./assets/images/icon_closing.png" alt="Icono de finalización del curso" />
          <p className="layout-closing__box-text">Has finalizado este contenido.</p>
        </div>
      </div>
    </div>
  );
}
