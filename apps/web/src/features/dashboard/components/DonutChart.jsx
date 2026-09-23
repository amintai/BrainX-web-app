import { computeDonutSegments } from '../lib/donut.js';

/** Inline SVG donut (FR-020). Note capital-B `viewBox` (ADR-2: Stitch's `viewbox` typo). */
export function DonutChart({
  segments,
  centerLabel = '100%',
  centerCaption = 'Allocated',
  ariaLabel,
}) {
  const computed = computeDonutSegments(segments.map((segment) => segment.value));

  return (
    <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 100 100"
        role="img"
        aria-label={ariaLabel}
      >
        <circle
          className="text-surface-container-high"
          cx="50"
          cy="50"
          fill="transparent"
          r="38"
          stroke="currentColor"
          strokeWidth="12"
        />
        {computed.map((segment, index) => (
          <circle
            key={segments[index].key}
            className={segments[index].strokeClass}
            cx="50"
            cy="50"
            fill="transparent"
            r="38"
            stroke="currentColor"
            strokeDasharray={segment.dashArray}
            strokeDashoffset={segment.dashOffset}
            strokeWidth="12"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-headline-sm text-on-surface font-bold">{centerLabel}</span>
        <span className="text-label-sm text-outline">{centerCaption}</span>
      </div>
    </div>
  );
}
