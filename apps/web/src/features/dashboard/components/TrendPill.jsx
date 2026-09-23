import { Icon } from '../../../components/Icon.jsx';

/** "+12.4%" / "-3.1%" trend indicator (FR-016). */
export function TrendPill({ changePct }) {
  const isUp = changePct >= 0;
  const classes = isUp
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-error-container text-on-error-container';
  const sign = isUp ? '+' : '';

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm ${classes}`}
    >
      <Icon name={isUp ? 'trending_up' : 'trending_down'} size={14} />
      <span>
        {sign}
        {changePct}%
      </span>
    </div>
  );
}
