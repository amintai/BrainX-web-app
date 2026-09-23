const SIZE_CLASSES = {
  sm: 'h-1.5',
  md: 'h-2',
};

/** Clamped 0-100 progress bar. Fill width is inline style (ADR-2: dynamic values). */
export function ProgressBar({ value, size = 'md', label }) {
  const clamped = Math.max(0, Math.min(100, value));
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full bg-surface-container-high ${sizeClass} rounded-full overflow-hidden`}
    >
      <div
        className="bg-secondary h-full rounded-full transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
