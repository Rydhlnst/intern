export const DEFAULT_PAGE_SIZE = 10;

export type PageParams = {
  page: number;
  limit: number;
  offset: number;
};

/**
 * Derive limit/offset from raw query-string values. Clamps to sane bounds so a
 * hand-edited `?page=` or `?limit=` can never break the query.
 */
export function getPagination(input?: {
  page?: string | number | null;
  limit?: string | number | null;
}): PageParams {
  const page = Math.max(1, Number(input?.page) || 1);
  const rawLimit = Number(input?.limit) || DEFAULT_PAGE_SIZE;
  const limit = Math.min(100, Math.max(1, rawLimit));
  return { page, limit, offset: (page - 1) * limit };
}

export type Paginated<T> = {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function paginated<T>(
  rows: T[],
  total: number,
  { page, limit }: PageParams
): Paginated<T> {
  return {
    rows,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
