export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: ErrorResponse | null;
  timestamp: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: ErrorResponse,
  ) {
    super(error.message);
    this.name = 'ApiError';
  }
}
