import { Icon } from '../../components/Icon.jsx';
import { HeaderIdentity } from './HeaderIdentity.jsx';

/** Decorative search + notification bell, then the identity block (FR-012). */
export function TopHeader() {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-gutter-lg">
      <div className="flex items-center gap-space-sm w-96">
        <div className="flex items-center w-full gap-space-xs px-space-md py-space-xs bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <Icon name="search" size={20} className="text-outline" />
          <input
            aria-label="Search"
            placeholder="Search operations, users, metrics..."
            type="text"
            className="w-full bg-transparent border-none outline-hidden text-body-md text-on-surface placeholder:text-outline"
          />
        </div>
      </div>
      <div className="flex items-center gap-space-md">
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          <Icon name="notifications" size={22} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />
        </button>
        <HeaderIdentity />
      </div>
    </header>
  );
}
