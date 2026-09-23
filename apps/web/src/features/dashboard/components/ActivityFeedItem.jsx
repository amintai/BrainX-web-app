import { Avatar } from '../../../components/Avatar.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { formatRelativeTime } from '../../../lib/format.js';

const CATEGORY_STYLES = {
  secops: 'text-secondary',
  'access-control': 'text-emerald-700',
  automation: 'text-outline',
  governance: 'text-secondary',
};

const CATEGORY_LABELS = {
  secops: 'SecOps',
  'access-control': 'Access Control',
  automation: 'Automated Job',
  governance: 'Governance',
};

const TYPE_ICONS = {
  'token-created': { name: 'key', className: 'text-outline' },
  'access-approved': { name: 'how_to_reg', className: 'text-emerald-600' },
  'key-rotation': { name: 'sync', className: 'text-outline' },
  'role-schema-changed': { name: 'admin_panel_settings', className: 'text-outline' },
};

/** A single activity-feed row (FR-018). Built as JSX, never an HTML string. */
export function ActivityFeedItem({ entry }) {
  const typeIcon = TYPE_ICONS[entry.type];

  return (
    <div className="py-space-sm flex items-start gap-space-md">
      {entry.actor.kind === 'system' ? (
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
          <Icon name="security_update_good" size={18} />
        </div>
      ) : (
        <Avatar name={entry.actor.name} src={entry.actor.avatarUrl} />
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <p className="text-body-md text-on-surface truncate">
          <strong className="font-semibold">{entry.actor.name}</strong> {entry.summary}{' '}
          {entry.target &&
            (entry.target.format === 'code' ? (
              <span className="text-code-md font-mono px-1.5 py-0.5 rounded-xs bg-surface-container-high text-on-surface">
                {entry.target.label}
              </span>
            ) : (
              <span className="text-on-surface-variant font-medium">{entry.target.label}</span>
            ))}
        </p>
        <div className="flex items-center gap-space-sm mt-0.5">
          <span className="text-body-sm text-outline">{formatRelativeTime(entry.occurredAt)}</span>
          <span className="text-outline">·</span>
          <span className={`text-label-sm ${CATEGORY_STYLES[entry.category]}`}>
            {CATEGORY_LABELS[entry.category]}
          </span>
        </div>
      </div>
      {typeIcon && (
        <Icon name={typeIcon.name} size={18} className={`${typeIcon.className} shrink-0`} />
      )}
    </div>
  );
}
