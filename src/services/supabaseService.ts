
import { supabase } from '@/integrations/supabase/client';

interface InvokeFunctionOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, any>;
  headers?: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number; // Add retryDelay option
}

// Add a sleep function for implementing delay between retries
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const supabaseService = {
  async invokeFunction(
    functionName: string,
    options: InvokeFunctionOptions = {}
  ): Promise<{ data: any; error: any }> {
    const { 
      method = 'POST', 
      body, 
      headers = {},
      maxRetries = 3,
      retryDelay = 1000 // Default retry delay of 1000ms (1 second)
    } = options;
    
    let attempts = 0;
    let lastError: any = null;
    
    while (attempts <= maxRetries) {
      try {
        // If not the first attempt, add exponential backoff
        if (attempts > 0) {
          // Calculate delay with exponential backoff: baseDelay * 2^attempt
          // But cap it to a maximum of 10 seconds
          const delay = Math.min(retryDelay * Math.pow(1.5, attempts - 1), 10000);
          console.log(`Retry attempt ${attempts}/${maxRetries} after ${delay}ms delay`);
          await sleep(delay);
        }
        
        // Call the function
        const { data, error } = await supabase.functions.invoke(functionName, {
          method,
          body,
          headers,
        });
        
        // If successful, return the result
        if (!error) {
          if (attempts > 0) {
            console.log(`Function ${functionName} succeeded after ${attempts} retries`);
          }
          return { data, error: null };
        }
        
        // If error, save it and continue with retries
        lastError = error;
        console.error(`Function ${functionName} error (attempt ${attempts + 1}/${maxRetries + 1}):`, error);
      } catch (err) {
        // Catch unexpected errors
        lastError = err;
        console.error(`Unexpected error calling ${functionName} (attempt ${attempts + 1}/${maxRetries + 1}):`, err);
      }
      
      attempts++;
    }
    
    // If we've exhausted all retries, return the last error
    console.error(`Function ${functionName} failed after ${maxRetries} retries. Last error:`, lastError);
    return { data: null, error: lastError };
  }
};
