const numberFormatter = new Intl.NumberFormat('en-US');
const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** Formats an integer/float with US thousands separators, e.g. 2845 -> "2,845". */
export function formatNumber(n) {
  return numberFormatter.format(n);
}

/** Formats a 0-1 fraction as a whole-number percent string, e.g. 0.104 -> "10%". */
export function formatPercent(fraction) {
  return `${Math.round(fraction * 100)}%`;
}

const DIVISIONS = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
];

/**
 * Formats `date` relative to `now` (default: the current time), e.g.
 * "8 minutes ago". `now` is injectable so tests are deterministic (R-15).
 */
export function formatRelativeTime(date, now = Date.now()) {
  const target = date instanceof Date ? date.getTime() : new Date(date).getTime();
  let duration = (target - now) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeTimeFormatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return relativeTimeFormatter.format(Math.round(duration), 'years');
}
