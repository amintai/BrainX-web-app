interface PaginationParams {
  page?: number;
  limit?: number;
}

export const toOffset = ({ page = 1, limit = 50 }: PaginationParams): number =>
  (page - 1) * limit;

export const buildPaginatedResponse = <T>(
  items: T[],
  total: number,
  { page = 1, limit = 50 }: PaginationParams,
) => ({
  items,
  pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
});
