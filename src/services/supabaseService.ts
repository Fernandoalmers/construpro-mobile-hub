
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
      maxRetries?: number
    } = {}
  ) {
    const { 
      method = 'POST', 
      body = undefined, 
      headers = {}, 
      maxRetries = 2 
    } = options;
    
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        // Get current session before making the request
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('Authentication session invalid or expired');
        }
        
        console.log(`Invoking function ${functionName} (attempt ${retries + 1})`);
        console.log('Request body type:', typeof body);
        console.log('Request body keys:', body ? Object.keys(body) : 'undefined');
        console.log('Sending body:', JSON.stringify(body, null, 2));
        
        // Ensure we have a valid body object for POST requests
        if (method === 'POST' && (!body || typeof body !== 'object')) {
          throw new Error('Body is required for POST requests and must be an object');
        }
        
        // For Supabase Edge Functions, pass the body directly as an object
        const invokeOptions: any = {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            ...headers
          }
        };
        
        // Only add body if it exists and is not empty
        if (body && typeof body === 'object' && Object.keys(body).length > 0) {
          invokeOptions.body = body;
        }
        
        console.log('Invoke options:', {
          headers: invokeOptions.headers,
          hasBody: !!invokeOptions.body,
          bodyKeys: invokeOptions.body ? Object.keys(invokeOptions.body) : []
        });

        const { data, error } = await supabase.functions.invoke(functionName, invokeOptions);

        if (error) {
          console.error(`Function ${functionName} error:`, error);
          
          // Check for authentication-related errors
          if (error.message?.includes('Auth session missing') || 
              error.message?.includes('Invalid authentication token') ||
              error.message?.includes('Authentication failed')) {
            
            if (retries < maxRetries) {
              console.log(`Authentication error, attempting to refresh session (retry ${retries + 1})`);
              
              // Try to refresh the session
              const { error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError) {
                retries++;
                continue; // Retry with refreshed session
              }
            }
            
            throw new Error('Authentication session expired - please log in again');
          }
          
          if (retries < maxRetries && 
             (error.message?.includes('timeout') || 
              error.message?.includes('network') ||
              error.message?.includes('connection'))) {
            // Only retry on network-related errors
            console.log(`Network error, retry attempt ${retries + 1} for ${functionName}`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            continue;
          }
          throw error;
        }

        console.log(`Function ${functionName} completed successfully`);
        console.log('Response data type:', typeof data);
        console.log('Response data:', data);
        return { data, error: null };
      } catch (error: any) {
        console.error(`Function ${functionName} exception:`, error);
        
        if (retries < maxRetries && 
           (error.message?.includes('timeout') || 
            error.message?.includes('network') ||
            error.message?.includes('connection'))) {
          console.log(`Exception retry attempt ${retries + 1} for ${functionName}`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
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
