import { NavLink } from 'react-router';
import { Icon } from '../../components/Icon.jsx';

const BASE =
  'flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-label-lg transition-colors';
const ACTIVE = 'bg-secondary text-on-secondary';
const IDLE = 'text-primary-fixed-dim hover:bg-primary-container hover:text-on-primary';

/**
 * A sidebar row: a real `NavLink` when `item.to` is set (FR-009), an
 * action button when `onSelect` is given (Logout), or a fully inert button
 * with no handler otherwise (FR-010: Analytics/Settings).
 */
export function SidebarNavItem({ item, onSelect, disabled = false }) {
  const content = (
    <>
      <Icon name={item.icon} size={20} />
      <span>{item.label}</span>
    </>
  );

  if (item.to) {
    return (
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) => `${BASE} ${isActive ? ACTIVE : IDLE}`}
      >
        {content}
      </NavLink>
    );
  }

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} disabled={disabled} className={`${BASE} ${IDLE}`}>
        {content}
      </button>
    );
  }

  return (
    <button type="button" aria-disabled="true" className={`${BASE} ${IDLE}`}>
      {content}
    </button>
  );
}
