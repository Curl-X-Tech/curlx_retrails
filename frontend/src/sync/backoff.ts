export interface BackoffOptions {
  baseMs?: number;
  maxMs?: number;
  maxAttempts?: number;
}

export function calculateBackoffDelay(
  attempt: number,
  options: BackoffOptions = {}
): number {
  const { baseMs = 1000, maxMs = 30000 } = options;
  if (attempt <= 0) return 0;
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt - 1));
  const jitter = Math.floor(Math.random() * 200);
  return exponential + jitter;
}

export function shouldRetry(attempt: number, options: BackoffOptions = {}): boolean {
  const { maxAttempts = 5 } = options;
  return attempt < maxAttempts;
}
