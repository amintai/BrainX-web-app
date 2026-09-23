interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = ({ children, className = '', padding = 'md' }: CardProps) => (
  <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${paddingClasses[padding]} ${className}`}>
    {children}
  </div>
);

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const CardHeader = ({ title, description, action }: CardHeaderProps) => (
  <div className="mb-4 flex items-start justify-between">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
