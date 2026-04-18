export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }
