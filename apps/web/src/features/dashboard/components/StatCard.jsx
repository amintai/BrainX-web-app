import { Icon } from '../../../components/Icon.jsx';

const ICON_TONES = {
  secondary: 'bg-surface-container-low text-secondary',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
};

/** KPI card shell: label, value, icon, and a footer slot (FR-016). */
export function StatCard({ label, value, valueSuffix, icon, iconTone, children }) {
  return (
    <div className="flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-lowest shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-space-xs">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider">
            {label}
          </span>
          <div className="flex items-baseline gap-space-xs">
            <span className="text-display-lg text-on-surface font-display">{value}</span>
            {valueSuffix && <span className="text-body-md text-outline">{valueSuffix}</span>}
          </div>
        </div>
        <div className={`p-space-xs rounded-lg ${ICON_TONES[iconTone]}`}>
          <Icon name={icon} size={24} />
        </div>
      </div>
      <div className="mt-space-md pt-space-xs flex items-center justify-between">{children}</div>
    </div>
  );
}
