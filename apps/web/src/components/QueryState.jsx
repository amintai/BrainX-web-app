/**
 * Renders a query's pending/error/success states (ADR-5). `query` is a
 * TanStack `UseQueryResult` (or a hand-built object with the same shape).
 */
export function QueryState({ query, skeleton, errorMessage, children }) {
  if (query.isPending) {
    return skeleton;
  }

  if (query.isError) {
    return (
      <p role="alert" className="text-error text-body-sm">
        {errorMessage}
      </p>
    );
  }

  return children(query.data);
}
