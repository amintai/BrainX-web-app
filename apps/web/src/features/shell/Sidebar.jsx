import { Icon } from '../../components/Icon.jsx';
import { SidebarNavItem } from './SidebarNavItem.jsx';
import { PRIMARY_NAV, FOOTER_NAV } from './navigation.js';
import { useSignOut } from '../auth/useSignOut.js';

const BRAND_LABEL = 'Nexus Enterprise';

/**
 * Fixed left sidebar (FR-008). No local logo asset is committed (see
 * notes.md, 2026-09-23) — the brand mark falls back to an `Icon`.
 */
export function Sidebar() {
  const { signOut, isSigningOut } = useSignOut();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-primary text-on-primary z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col">
        <div className="h-16 px-space-md flex items-center gap-space-sm bg-primary-container/40">
          <Icon name="hub" size={24} className="text-on-primary" label={`${BRAND_LABEL} logo`} />
          <span className="text-headline-sm text-on-primary tracking-tight">{BRAND_LABEL}</span>
        </div>
        <nav aria-label="Primary" className="flex flex-col gap-space-xs px-space-sm mt-space-md">
          {PRIMARY_NAV.map((item) => (
            <SidebarNavItem key={item.key} item={item} />
          ))}
        </nav>
      </div>
      <nav
        aria-label="Account"
        className="p-space-sm flex flex-col gap-space-xs bg-primary-container/20"
      >
        {FOOTER_NAV.map((item) =>
          item.key === 'logout' ? (
            <SidebarNavItem key={item.key} item={item} onSelect={signOut} disabled={isSigningOut} />
          ) : (
            <SidebarNavItem key={item.key} item={item} />
          ),
        )}
      </nav>
    </aside>
  );
}
