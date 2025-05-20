
import { supabase } from "@/integrations/supabase/client";

export const supabaseService = {
  /**
   * Invokes a Supabase Edge Function with retries for better reliability
   */
  async invokeFunction(
    functionName: string, 
    options: { 
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE', 
      body?: Record<string, any>,
      headers?: Record<string, string>,
      maxRetries?: number,
      retryDelay?: number  // Added this property to the type definition
    } = {}
  ) {
    const { 
      method = 'POST', 
      body = undefined, 
      headers = {}, 
      maxRetries = 2,
      retryDelay = 1000  // Default retry delay of 1 second
    } = options;
    
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          method,
          body,
          headers
        });

        if (error) {
          if (retries < maxRetries && 
             (error.message.includes('timeout') || 
              error.message.includes('network') ||
              error.message.includes('connection'))) {
            // Only retry on network-related errors
            console.log(`Retry attempt ${retries + 1} for ${functionName}`);
            retries++;
            // Use the retryDelay option or calculate a delay based on retry count
            const delay = retryDelay || 1000 * retries;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }

        return { data, error: null };
      } catch (error: any) {
        if (retries < maxRetries && 
           (error.message?.includes('timeout') || 
            error.message?.includes('network') ||
            error.message?.includes('connection'))) {
          console.log(`Retry attempt ${retries + 1} for ${functionName}`);
          retries++;
          // Use the retryDelay option or calculate a delay based on retry count
          const delay = retryDelay || 1000 * retries;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return { 
          data: null, 
          error: {
            message: error.message || `Error invoking ${functionName}`,
            status: error.status || 500,
            original: error
          }
        };
      }
    }
    
    // This should never happen, but TypeScript needs a return statement
    return { 
      data: null, 
      error: {
        message: `Max retries reached for ${functionName}`,
        status: 500,
        original: null
      }
    };
  }
};
