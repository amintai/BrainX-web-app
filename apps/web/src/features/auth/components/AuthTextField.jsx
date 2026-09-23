import { useField } from 'formik';
import { Icon } from '../../../components/Icon.jsx';

/** Formik-bound text field with a leading icon, trailing slot, and error text (FR-003/004). */
export function AuthTextField({
  name,
  label,
  type = 'text',
  placeholder,
  icon,
  trailing,
  autoComplete,
}) {
  const [field, meta] = useField(name);
  const hasError = Boolean(meta.touched && meta.error);
  const errorId = `${name}-error`;

  return (
    <div className="space-y-1.5">
      <label className="block text-label-md text-on-surface" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
          <Icon name={icon} size={18} />
        </div>
        <input
          {...field}
          id={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={`w-full h-10 pl-10 ${trailing ? 'pr-10' : 'pr-3'} bg-surface-container-low text-on-surface text-body-md rounded-lg focus:outline-hidden focus:bg-surface-container-lowest focus:shadow-md transition-all placeholder:text-outline/70`}
        />
        {trailing}
      </div>
      {hasError && (
        <p id={errorId} className="text-body-sm text-error">
          {meta.error}
        </p>
      )}
    </div>
  );
}
