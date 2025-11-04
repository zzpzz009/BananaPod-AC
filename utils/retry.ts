export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  jitter?: boolean;
  retryable?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number, delayMs: number) => void;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function defaultRetryable(error: any): boolean {
  const msg = typeof error?.message === 'string' ? error.message : String(error);
  if (!msg) return false;
  const upper = msg.toUpperCase();
  return (
    upper.includes('429') ||
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('RATE LIMIT') ||
    upper.includes('QUOTA') ||
    upper.includes('FAILED TO FETCH') ||
    upper.includes('NETWORK') ||
    upper.includes('TIMEOUT')
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const retries = Math.max(0, opts.retries ?? 3);
  const baseDelayMs = Math.max(0, opts.baseDelayMs ?? 800);
  const jitter = opts.jitter ?? true;
  const retryable = opts.retryable ?? defaultRetryable;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !retryable(error)) {
        throw error;
      }
      const delayMs = Math.floor(baseDelayMs * Math.pow(2, attempt) * (jitter ? (0.8 + Math.random() * 0.4) : 1));
      if (typeof opts.onRetry === 'function') {
        opts.onRetry(error, attempt + 1, delayMs);
      }
      await sleep(delayMs);
      attempt++;
    }
  }
}