import { useCallback, useState } from 'react';

type TooltipPosition = 'below-right' | 'below-left' | 'above-right' | 'above-left';

interface HelpTooltipProps {
  text: string;
  style?: React.CSSProperties;
  tooltipPosition?: TooltipPosition;
}

const positionStyles: Record<TooltipPosition, React.CSSProperties> = {
  'below-right': { top: 'calc(100% + 8px)', right: 0 },
  'below-left':  { top: 'calc(100% + 8px)', left: 0 },
  'above-right': { bottom: 'calc(100% + 8px)', right: 0 },
  'above-left':  { bottom: 'calc(100% + 8px)', left: 0 },
};

export function HelpTooltip({ text, style, tooltipPosition = 'below-right' }: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = 'help-tooltip';

  const toggle = useCallback(() => setVisible((v) => !v), []);

  return (
    <div className="help-tooltip" style={style}>
      <button
        className="help-tooltip__trigger"
        aria-describedby={visible ? tooltipId : undefined}
        onClick={toggle}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label="Ayuda"
        type="button"
      >
        <i className="fi fi-tr-comment-question" aria-hidden="true" />
      </button>
      {visible && (
        <div
          className="help-tooltip__content"
          id={tooltipId}
          role="tooltip"
          style={positionStyles[tooltipPosition]}
        >
          {text}
        </div>
      )}
    </div>
  );
}
