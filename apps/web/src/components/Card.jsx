const BASE_CLASSES = 'rounded-xl bg-surface-container-lowest p-space-lg shadow-xs';

/** Generic section surface used across the dashboard and users pages. */
export function Card({ as: Component = 'section', className = '', children }) {
  return <Component className={`${BASE_CLASSES} ${className}`}>{children}</Component>;
}
