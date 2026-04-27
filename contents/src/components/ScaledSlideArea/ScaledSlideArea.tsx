import { useRef, useState, useEffect, type ReactNode } from 'react';

const DESIGN_W = 1200;
const DESIGN_H = 675;

interface ScaledSlideAreaProps {
  children: ReactNode;
}

export function ScaledSlideArea({ children }: ScaledSlideAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width === 0 || height === 0) return;
      setScale(Math.min(width / DESIGN_W, height / DESIGN_H));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="scaled-slide">
      <div
        className="scaled-slide__surface"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
