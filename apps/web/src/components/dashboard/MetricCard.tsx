interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
}

const MetricCard = ({ label, value, description, isLoading = false }: MetricCardProps) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm">
    {isLoading ? (
      <>
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-9 w-24 animate-pulse rounded-md bg-gray-200" />
        {description !== undefined && (
          <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-100" />
        )}
      </>
    ) : (
      <>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
      </>
    )}
  </div>
);

export default MetricCard;
