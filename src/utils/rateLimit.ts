/**
 * Rate-limit-aware delay helper.
 * All Discord API calls in setup go through this to reduce 429 errors.
 */

/** Sleep for `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with retry logic.
 * Handles Discord rate-limit errors (HTTP 429) by respecting retry_after.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  label: string,
  maxRetries = 3
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      // Small polite delay between API calls to avoid hitting rate limits
      await sleep(500);
      return result;
    } catch (err: unknown) {
      lastError = err;
      // discord.js wraps rate-limit errors; check for retry_after field
      const retryAfter = getRetryAfter(err);
      if (retryAfter !== null) {
        await sleep(retryAfter * 1000 + 100);
      } else if (attempt < maxRetries) {
        await sleep(1000 * attempt);
      }
    }
  }
  throw new Error(`Operation "${label}" failed after ${maxRetries} attempts: ${String(lastError)}`);
}

function getRetryAfter(err: unknown): number | null {
  if (typeof err === 'object' && err !== null) {
    // discord.js DiscordAPIError has a `retryAfter` property (in seconds)
    const e = err as Record<string, unknown>;
    if (typeof e['retryAfter'] === 'number') return e['retryAfter'];
  }
  return null;
}
