import type { CoverSlideData } from '../../types';
import { sanitize, isSafeUrl } from '../../utils/sanitize';

interface CoverLayoutProps {
  data: CoverSlideData;
  onNext?: () => void;
}

export function CoverLayout({ data, onNext }: CoverLayoutProps) {
  return (
    <div
      className="layout-cover"
      style={isSafeUrl(data.backgroundImage) ? { backgroundImage: `url(${data.backgroundImage})` } : undefined}
    >
      {isSafeUrl(data.backgroundVideo) && (
        <video
          className="layout-cover__video"
          src={data.backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      )}
      <div className="layout-cover__stripe" />
      <div className="layout-cover__content">
        <h1 className="layout-cover__unit-title" dangerouslySetInnerHTML={{ __html: sanitize(data.unitTitle) }} />
        {onNext && (
          <button className="layout-cover__start-btn" onClick={onNext} type="button">
            COMENZAR
          </button>
        )}
      </div>
    </div>
  );
}
