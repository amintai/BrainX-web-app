import { QUICK_LINKS } from '../quickLinks.js';
import { ShortcutTile } from './ShortcutTile.jsx';

/** Quick-navigation shortcut tiles; only User Management is functional (FR-019). */
export function QuickNavigation() {
  return (
    <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-xs">
      <div className="flex items-center justify-between mb-space-md">
        <h2 className="text-headline-sm text-on-surface">Quick Navigation</h2>
        <span className="text-label-sm text-outline uppercase tracking-wider">Shortcuts</span>
      </div>
      <div className="grid grid-cols-2 gap-space-sm">
        {QUICK_LINKS.map((link) => (
          <ShortcutTile
            key={link.key}
            title={link.title}
            description={link.description}
            icon={link.icon}
            to={link.to}
          />
        ))}
      </div>
    </section>
  );
}
