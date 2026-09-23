/**
 * Material Symbols Outlined wrapper (ADR-7). Decorative by default
 * (`aria-hidden`); pass `label` to expose it as a labelled image instead.
 */
export function Icon({ name, size = 20, filled = false, className = '', label }) {
  const style = {
    fontSize: size,
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
  };

  const a11yProps = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' };

  return (
    <span className={`material-symbols-outlined ${className}`} style={style} {...a11yProps}>
      {name}
    </span>
  );
}
