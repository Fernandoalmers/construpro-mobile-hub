
/**
 * Helper function to add timestamp to logs
 */
export function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

/**
 * Timeout wrapper for async operations with enhanced error handling
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName?: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${operationName || 'Operation'} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Enhanced retry logic for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 2, 
  delayMs: number = 1000,
  operationName?: string
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      if (attempt > 1) {
        logWithTimestamp(`[withRetry] Attempt ${attempt}/${maxRetries + 1} for ${operationName || 'operation'}`);
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt - 1)));
      }
      
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logWithTimestamp(`[withRetry] Attempt ${attempt} failed for ${operationName}:`, error);
      
      if (attempt === maxRetries + 1) {
        break;
      }
    }
  }
  
  throw lastError;
}
