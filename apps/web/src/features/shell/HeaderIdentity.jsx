import { Avatar } from '../../components/Avatar.jsx';
import { Icon } from '../../components/Icon.jsx';
import { useIdentity } from '../auth/useIdentity.js';

/** Non-interactive identity block: avatar, name, role, chevron (FR-012). */
export function HeaderIdentity() {
  const { fullName, roleLabel } = useIdentity();

  return (
    <div className="flex items-center gap-space-sm pl-space-sm">
      <Avatar name={fullName} src={null} size="sm" />
      <div className="flex flex-col text-left">
        <span className="text-label-md text-on-surface">{fullName}</span>
        <span className="text-label-sm text-on-surface-variant">{roleLabel}</span>
      </div>
      <Icon name="expand_more" size={18} className="text-outline" />
    </div>
  );
}
