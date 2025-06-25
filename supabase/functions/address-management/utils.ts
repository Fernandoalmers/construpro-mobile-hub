
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestContext {
  user: { id: string };
  headers: Headers;
}

export { corsHeaders };

export async function createRequestContext(req: Request): Promise<RequestContext> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    console.log('[address-management] No authorization header found');
    throw new Error('Unauthorized');
  }

  // Extract token from Bearer header
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    console.log('[address-management] No token in authorization header');
    throw new Error('Unauthorized');
  }

  try {
    // Create a simple mock context for now
    // In a real implementation, you would verify the JWT token
    const context: RequestContext = {
      user: { id: 'temp-user-id' }, // This should be extracted from JWT
      headers: req.headers
    };
    
    console.log('[address-management] Context created successfully');
    return context;
  } catch (error) {
    console.error('[address-management] Error creating context:', error);
    throw new Error('Unauthorized');
  }
}

export function createErrorResponse(message: string, status: number, headers?: Record<string, string>) {
  const responseHeaders = { ...corsHeaders, ...headers };
  return new Response(
    JSON.stringify({ error: message }), 
    { 
      status, 
      headers: { 
        ...responseHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

export function createSuccessResponse(data: any, status: number = 200, headers?: Record<string, string>) {
  const responseHeaders = { ...corsHeaders, ...headers };
  return new Response(
    JSON.stringify(data), 
    { 
      status, 
      headers: { 
        ...responseHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}
