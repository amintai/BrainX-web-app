import { Icon } from '../../../components/Icon.jsx';

/** Controlled search input over the static user dataset (FR-023). */
export function UserSearchInput({ value, onChange }) {
  return (
    <div className="relative flex-1">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
        <Icon name="search" size={20} />
      </span>
      <input
        aria-label="Search users"
        placeholder="Search users by name or email..."
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full pl-10 pr-space-md py-2 bg-surface-container-low rounded-lg text-body-md text-on-surface placeholder:text-outline focus:outline-hidden focus:bg-surface-container-lowest shadow-inner transition-colors"
      />
    </div>
  );
}
