import { useMemo } from 'react';
import type { IndexEntry } from '../../types';

interface SidebarProps {
  index: IndexEntry[];
  currentSlide: number;
  visitedSlides: number[];
  lockIndex: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: (slideId: number) => void;
}

export function Sidebar({
  index,
  currentSlide,
  visitedSlides,
  lockIndex,
  collapsed,
  onToggle,
  onNavigate,
}: SidebarProps) {
  const numbering = useMemo(() => {
    const result: Record<number, string> = {};
    const counters: number[] = [];
    const numberedLevel: boolean[] = [];

    index.forEach((entry, i) => {
      while (counters.length < entry.level) {
        counters.push(0);
        numberedLevel.push(false);
      }
      while (counters.length > entry.level) {
        counters.pop();
        numberedLevel.pop();
      }

      if (entry.numbered) {
        counters[entry.level - 1] = (counters[entry.level - 1] || 0) + 1;
        numberedLevel[entry.level - 1] = true;

        const parts: number[] = [];
        for (let l = 0; l < entry.level; l++) {
          if (numberedLevel[l]) parts.push(counters[l]);
        }
        result[i] = parts.join('.') + '. ';
      } else {
        counters[entry.level - 1] = 0;
        numberedLevel[entry.level - 1] = false;
      }
    });

    return result;
  }, [index]);

  const getNumberLabel = (i: number) => numbering[i] ?? '';

  const isClickable = (entry: IndexEntry) => {
    if (entry.slideId === null) return false;
    if (lockIndex && !visitedSlides.includes(entry.slideId)) return false;
    return true;
  };

  const isActive = (entry: IndexEntry) => entry.slideId === currentSlide;

  const isVisited = (entry: IndexEntry) =>
    entry.slideId !== null && visitedSlides.includes(entry.slideId);

  const isLocked = (entry: IndexEntry) =>
    entry.slideId !== null && lockIndex && !visitedSlides.includes(entry.slideId);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} aria-label="Índice del curso">
      <button
        className="sidebar__toggle"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Abrir índice' : 'Cerrar índice'}
      >
        <span className={`sidebar__hamburger ${!collapsed ? 'sidebar__hamburger--open' : ''}`} aria-hidden="true">
          <span className="sidebar__hamburger-line" />
          <span className="sidebar__hamburger-line" />
          <span className="sidebar__hamburger-line" />
        </span>
      </button>

      {!collapsed && (
        <nav className="sidebar__nav" aria-label="Índice">
          <ul className="sidebar__list" role="list">
            {index.map((entry, i) => {
              const clickable = isClickable(entry);
              const active = isActive(entry);
              const visited = isVisited(entry);
              const locked = isLocked(entry);

              return (
                <li
                  key={i}
                  className={[
                    'sidebar__item',
                    `sidebar__item--level-${entry.level}`,
                    active ? 'sidebar__item--active' : '',
                    visited ? 'sidebar__item--visited' : '',
                    !clickable ? 'sidebar__item--disabled' : '',
                    entry.slideId === null ? 'sidebar__item--group' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {clickable ? (
                    <button
                      className="sidebar__link"
                      onClick={() => onNavigate(entry.slideId!)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className="sidebar__link-text">
                        {getNumberLabel(i)}
                        {entry.title}
                      </span>
                      <i className={`fi fi-rr-check sidebar__check ${visited ? 'sidebar__check--visible' : ''}`} aria-hidden="true" />
                    </button>
                  ) : (
                    <span
                      className="sidebar__label"
                      title={locked ? 'Bloqueado: completa las diapositivas anteriores para acceder' : undefined}
                    >
                      {getNumberLabel(i)}
                      {entry.title}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </aside>
  );
}
