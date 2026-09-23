function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Pure donut-segment geometry (FR-020). Returns one entry per input value,
 * in the same order, each carrying the SVG `stroke-dasharray`/`stroke-
 * dashoffset` pair and the exact `fraction` used — the legend percentage
 * must reuse this same fraction so the chart and legend can never disagree.
 */
export function computeDonutSegments(values, { radius = 38 } = {}) {
  const circumference = 2 * Math.PI * radius;
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return [];
  }

  let cumulative = 0;
  return values.map((value) => {
    const fraction = value / total;
    const length = fraction * circumference;
    const dashArray = `${round2(length)} ${round2(circumference)}`;
    const dashOffset = -round2(cumulative);
    cumulative += length;
    return { fraction, dashArray, dashOffset };
  });
}
