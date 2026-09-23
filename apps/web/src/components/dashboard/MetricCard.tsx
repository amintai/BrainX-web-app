interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
}

const MetricCard = ({ label, value, description, isLoading = false }: MetricCardProps) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    {isLoading ? (
      <div className="mt-2 h-9 w-24 animate-pulse rounded-md bg-gray-200" />
    ) : (
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    )}
    {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
  </div>
);

export default MetricCard;
