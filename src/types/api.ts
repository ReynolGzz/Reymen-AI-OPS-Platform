export interface ApiResponse<T> {
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}
