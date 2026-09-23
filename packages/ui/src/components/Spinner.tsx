type Size = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: Size;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => (
  <svg
    className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    aria-label="Loading"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);
