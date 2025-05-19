// src/types/errors.ts

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}
