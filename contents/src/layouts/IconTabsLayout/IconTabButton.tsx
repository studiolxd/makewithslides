import type { IconTabItem } from '../../types';

interface IconTabButtonProps {
  item: IconTabItem;
  isActive: boolean;
  isCompleted: boolean;
  filled?: boolean;
  onClick: (id: string) => void;
}

export function IconTabButton({ item, isActive, isCompleted, filled, onClick }: IconTabButtonProps) {
  const cls = [
    'icon-tab',
    filled ? 'icon-tab--filled' : '',
    isActive ? 'icon-tab--active' : '',
    isCompleted ? 'icon-tab--completed' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={cls}
      onClick={() => onClick(item.id)}
      aria-expanded={isActive}
      aria-label={item.title ?? item.id}
      type="button"
    >
      <span className="icon-tab__icon">
        {item.icon ? (
          <i className={item.icon} aria-hidden="true" />
        ) : item.image ? (
          <img src={item.image} alt="" />
        ) : null}
      </span>
      {isCompleted && <span className="sr-only">Completado</span>}
    </button>
  );
}
