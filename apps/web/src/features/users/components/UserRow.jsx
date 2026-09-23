import { Avatar } from '../../../components/Avatar.jsx';
import { RoleBadge } from './RoleBadge.jsx';
import { StatusBadge } from './StatusBadge.jsx';

/** A single user row: zebra + hover treatment per Stitch (FR-024). */
export function UserRow({ user, index }) {
  const zebraClass = index % 2 === 1 ? 'bg-surface/30' : '';

  return (
    <tr className={`hover:bg-surface-container-low/70 transition-colors border-none ${zebraClass}`}>
      <td className="py-3.5 px-space-md">
        <div className="flex items-center gap-space-sm">
          <Avatar name={user.name} src={user.avatarUrl} />
          <div className="flex flex-col min-w-0">
            <span className="text-label-lg text-on-surface font-semibold truncate">
              {user.name}
            </span>
            <span className="text-body-sm text-on-surface-variant truncate">{user.email}</span>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-space-md">
        <RoleBadge role={user.role} />
      </td>
      <td className="py-3.5 px-space-md text-right pr-space-md">
        <StatusBadge status={user.status} />
      </td>
    </tr>
  );
}
