import { useState } from 'react';
import { getInitials, toneFor } from './avatar.js';

const SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
};

/** Image avatar with a deterministic-tone initials fallback (ADR-11, R-10). */
export function Avatar({ name, src = null, size = 'md', className = '' }) {
  const [errored, setErrored] = useState(false);
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  if (!src || errored) {
    return (
      <div
        className={`${sizeClass} shrink-0 rounded-full flex items-center justify-center text-label-lg font-bold ${toneFor(name)} ${className}`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
