type SupabaseErrorLike = {
  code?: string;
};

type SupabaseResultLike = {
  error: SupabaseErrorLike | null;
};

export class SupabaseOperationError extends Error {
  readonly code: string;
  readonly operation: string;

  constructor(operation: string, code?: string) {
    super(`Supabase operation failed: ${operation}`);
    this.name = "SupabaseOperationError";
    this.operation = operation;
    this.code = code || "SUPABASE_OPERATION_FAILED";
  }
}

export function assertSupabaseResult(
  result: SupabaseResultLike,
  operation: string,
): void {
  if (result.error) {
    throw new SupabaseOperationError(operation, result.error.code);
  }
}
