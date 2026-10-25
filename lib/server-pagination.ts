export type PaginationQuery = {
  page: number;
  pageSize: number;
  search: string;
  requested: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function parsePagination(
  searchParams: URLSearchParams,
  defaultPageSize = 15,
  maxPageSize = 100,
): PaginationQuery | null {
  const rawPage = searchParams.get("page");
  const rawPageSize = searchParams.get("limit");
  if (
    (rawPage !== null && !/^[1-9]\d*$/.test(rawPage)) ||
    (rawPageSize !== null && !/^[1-9]\d*$/.test(rawPageSize))
  ) {
    return null;
  }
  const page = rawPage === null ? 1 : Number(rawPage);
  const pageSize = rawPageSize === null ? defaultPageSize : Number(rawPageSize);
  if (
    !Number.isSafeInteger(page) ||
    !Number.isSafeInteger(pageSize) ||
    pageSize > maxPageSize
  ) {
    return null;
  }
  return {
    page,
    pageSize,
    search: (searchParams.get("q") ?? "").trim().slice(0, 100),
    requested: rawPage !== null,
  };
}

export function pageForTotal(total: number, requestedPage: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page: Math.min(requestedPage, totalPages),
    totalPages,
  };
}

export function paginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
